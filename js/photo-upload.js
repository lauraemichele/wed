(function () {
  // Google Apps Script Web App URL. Deve esporre l'azione 'createSession'
  // che restituisce { result: 'ok', sessionUri: '...' } — vedi lo script in fondo.
  const PHOTO_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbyQFzorPHx7oLkm19Ptcfg7jtn6jRCRoYN5_jogNiAh-ZA2bc4UAfRiwQE7TcvjrG9r/exec';

  const MAX_FILES = 100;
  // Concorrenza adattiva: molte connessioni parallele per foto/file piccoli
  // (dove il collo di bottiglia è il round-trip di init sessione), meno se
  // ci sono video pesanti (dove il collo di bottiglia è la banda in upload).
  const MAX_CONCURRENT_SMALL = 6;   // file <= 20 MB (foto tipiche)
  const MAX_CONCURRENT_LARGE = 2;   // file > 20 MB (video)
  const LARGE_FILE_THRESHOLD = 20 * 1024 * 1024;
  const MAX_PHOTO_BYTES = 50 * 1024 * 1024;              // 50 MB
  const MAX_VIDEO_BYTES = 3 * 1024 * 1024 * 1024;        // 3 GB
  const SESSION_RETRIES = 2;                              // tentativi extra per file
  const RETRY_BASE_DELAY_MS = 1500;
  const SESSION_BATCH_SIZE = 15;                          // sessioni create per singola POST

  document.addEventListener('DOMContentLoaded', function () {
    const uploader = document.getElementById('photo-uploader');
    if (!uploader) return;

    if (!PHOTO_UPLOAD_URL) {
      uploader.style.display = 'none';
      return;
    }

    const fileInput = document.getElementById('photo-input');
    const submitBtn = document.getElementById('photo-submit');
    const clearBtn = document.getElementById('photo-clear');
    const statusEl = document.getElementById('photo-status');
    const fileListEl = document.getElementById('photo-file-list');

    let selected = [];
    let uploading = false;

    fileInput.addEventListener('change', function () {
      const chosen = Array.from(fileInput.files || []);
      if (chosen.length > MAX_FILES) {
        statusEl.innerHTML = '<span class="has-text-danger">Massimo ' + MAX_FILES +
          ' file per volta. Ne hai selezionati ' + chosen.length + '. Riseleziona.</span>';
        selected = [];
        fileListEl.innerHTML = '';
        submitBtn.disabled = true;
        return;
      }
      selected = chosen;
      renderList();
      submitBtn.disabled = selected.length === 0;
      statusEl.textContent = selected.length
        ? selected.length + ' file selezionati.'
        : '';
    });

    clearBtn.addEventListener('click', function () {
      if (uploading) return;
      selected = [];
      fileInput.value = '';
      fileListEl.innerHTML = '';
      statusEl.textContent = '';
      submitBtn.disabled = true;
    });

    submitBtn.addEventListener('click', async function () {
      if (!selected.length || uploading) return;
      uploading = true;
      submitBtn.disabled = true;
      clearBtn.disabled = true;
      fileInput.disabled = true;

      let done = 0;
      let failed = 0;
      const total = selected.length;
      const updateStatus = () => {
        statusEl.innerHTML = 'Caricati ' + done + '/' + total +
          (failed ? ' — errori: ' + failed : '') + '…';
      };
      updateStatus();

      // Deferred promise per file: risolta quando arriva il session URI dal batch.
      // I file oversize non entrano nella mappa; uploadOne li scarta senza attendere.
      const sessionPromises = new Map();
      const deferreds = new Map();
      const eligible = [];
      selected.forEach((file, i) => {
        if (fileOverLimit(file)) return;
        let resolveFn, rejectFn;
        const p = new Promise((r, j) => { resolveFn = r; rejectFn = j; });
        sessionPromises.set(i, p);
        deferreds.set(i, { resolve: resolveFn, reject: rejectFn });
        eligible.push({ file, i });
      });
      // Evita "unhandled rejection" se un worker fallisce prima di await.
      sessionPromises.forEach(p => p.catch(() => {}));

      // Batch di creazione sessioni, tutti in parallelo verso Apps Script.
      const batches = [];
      for (let i = 0; i < eligible.length; i += SESSION_BATCH_SIZE) {
        batches.push(eligible.slice(i, i + SESSION_BATCH_SIZE));
      }
      batches.forEach(batch => {
        (async () => {
          try {
            const sessions = await createSessionsBatch(batch);
            batch.forEach((item, k) => {
              const d = deferreds.get(item.i);
              const s = sessions && sessions[k];
              if (s && s.ok && s.sessionUri) d.resolve(s.sessionUri);
              else d.reject(new Error((s && s.message) || 'sessione non ottenuta'));
            });
          } catch (err) {
            batch.forEach(item => {
              const d = deferreds.get(item.i);
              if (d) d.reject(err);
            });
          }
        })();
      });

      const smallQueue = [];
      const largeQueue = [];
      selected.forEach((file, i) => {
        (file.size > LARGE_FILE_THRESHOLD ? largeQueue : smallQueue)
          .push({ file, i });
      });

      const runPool = (queue, poolSize) => {
        const workers = [];
        const n = Math.min(poolSize, queue.length);
        for (let w = 0; w < n; w++) {
          workers.push((async function worker() {
            while (queue.length) {
              const item = queue.shift();
              if (!item) return;
              try {
                await uploadOne(item.file, item.i, sessionPromises);
                done++;
              } catch (err) {
                failed++;
                markFile(item.i, 'error', (err && err.message) || 'errore');
              }
              updateStatus();
            }
          })());
        }
        return Promise.all(workers);
      };

      await Promise.all([
        runPool(smallQueue, MAX_CONCURRENT_SMALL),
        runPool(largeQueue, MAX_CONCURRENT_LARGE),
      ]);

      statusEl.innerHTML = failed === 0
        ? '<span class="has-text-success"><strong>Fatto!</strong> ' + done + ' file caricati.</span>'
        : '<span class="has-text-warning"><strong>' + done + ' caricati, ' + failed +
          ' falliti.</strong> Riseleziona i file in errore e riprova.</span>';

      uploading = false;
      fileInput.disabled = false;
      clearBtn.disabled = false;
      submitBtn.disabled = true;
    });

    function renderList() {
      fileListEl.innerHTML = '';
      selected.forEach(function (f, i) {
        const over = fileOverLimit(f);
        const li = document.createElement('li');
        li.id = 'photo-file-' + i;
        li.className = 'photo-file-item';
        li.innerHTML =
          '<span class="photo-file-name">' + escapeHtml(f.name) + '</span>' +
          '<span class="photo-file-size">' + formatSize(f.size) + '</span>' +
          '<span class="photo-file-state">' +
            (over ? '<span class="has-text-danger">' + escapeHtml(over) + '</span>' : 'in coda') +
          '</span>';
        fileListEl.appendChild(li);
      });
    }

    function fileOverLimit(file) {
      const isVideo = /^video\//.test(file.type || '');
      const limit = isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
      if (file.size > limit) {
        return isVideo
          ? 'video oltre ' + Math.round(MAX_VIDEO_BYTES / (1024 * 1024 * 1024)) + ' GB'
          : 'file oltre ' + Math.round(MAX_PHOTO_BYTES / (1024 * 1024)) + ' MB';
      }
      return null;
    }

    function markFile(i, state, extra) {
      const li = document.getElementById('photo-file-' + i);
      if (!li) return;
      const stateEl = li.querySelector('.photo-file-state');
      if (!stateEl) return;
      if (state === 'uploading') {
        stateEl.innerHTML = '<span class="has-text-info">' +
          escapeHtml(extra || 'caricamento…') + '</span>';
      } else if (state === 'ok') {
        stateEl.innerHTML = '<span class="has-text-success">ok</span>';
      } else if (state === 'error') {
        stateEl.innerHTML = '<span class="has-text-danger">errore' +
          (extra ? ': ' + escapeHtml(extra) : '') + '</span>';
      }
    }

    async function uploadOne(file, i, sessionPromises) {
      const over = fileOverLimit(file);
      if (over) throw new Error(over);

      let lastErr;
      for (let attempt = 0; attempt <= SESSION_RETRIES; attempt++) {
        if (attempt > 0) {
          markFile(i, 'uploading', 'ritento (' + (attempt + 1) + ')');
          await sleep(RETRY_BASE_DELAY_MS * attempt);
        }
        try {
          markFile(i, 'uploading', 'attesa sessione…');
          // Primo tentativo: usa la sessione pre-fetchata dal batch.
          // Retry: ricrea la singola sessione (fresh URI = più robusto).
          const sessionUri = (attempt === 0 && sessionPromises && sessionPromises.has(i))
            ? await sessionPromises.get(i)
            : await createSessionSingle(file);
          await putToSession(sessionUri, file, function (loaded, tot) {
            const pct = tot ? Math.floor(loaded * 100 / tot) : 0;
            markFile(i, 'uploading', pct + '%');
          });
          markFile(i, 'ok');
          return;
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr || new Error('errore sconosciuto');
    }

    async function createSessionsBatch(items) {
      const body = new FormData();
      body.append('action', 'createSessions');
      body.append('origin', window.location.origin);
      body.append('files', JSON.stringify(items.map(function (x) {
        return {
          filename: x.file.name,
          mimeType: x.file.type || 'application/octet-stream',
          size: x.file.size,
        };
      })));

      const res = await fetch(PHOTO_UPLOAD_URL, {
        method: 'POST',
        body: body,
        redirect: 'follow',
      });
      if (!res.ok) throw new Error('batch HTTP ' + res.status);
      const text = await res.text();
      let payload;
      try {
        payload = JSON.parse(text);
      } catch (e) {
        throw new Error('risposta batch non valida');
      }
      if (payload.result !== 'ok') throw new Error(payload.message || 'batch server error');
      if (!Array.isArray(payload.sessions)) throw new Error('sessions mancanti');
      return payload.sessions;
    }

    async function createSessionSingle(file) {
      const body = new FormData();
      body.append('action', 'createSession');
      body.append('filename', file.name);
      body.append('mimeType', file.type || 'application/octet-stream');
      body.append('size', String(file.size));
      body.append('origin', window.location.origin);

      const res = await fetch(PHOTO_UPLOAD_URL, {
        method: 'POST',
        body: body,
        redirect: 'follow',
      });
      if (!res.ok) throw new Error('init HTTP ' + res.status);
      const text = await res.text();
      let payload;
      try {
        payload = JSON.parse(text);
      } catch (e) {
        throw new Error('risposta init non valida');
      }
      if (payload.result !== 'ok') throw new Error(payload.message || 'init server error');
      if (!payload.sessionUri) throw new Error('sessione mancante');
      return payload.sessionUri;
    }

    function putToSession(sessionUri, file, onProgress) {
      return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', sessionUri, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.upload.onprogress = function (e) {
          if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total);
        };
        xhr.onload = function () {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve();
          } else {
            reject(new Error('upload HTTP ' + xhr.status));
          }
        };
        xhr.onerror = function () { reject(new Error('errore di rete')); };
        xhr.onabort = function () { reject(new Error('interrotto')); };
        xhr.ontimeout = function () { reject(new Error('timeout')); };
        xhr.send(file);
      });
    }

    function sleep(ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function formatSize(bytes) {
      if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + '&nbsp;GB';
      if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + '&nbsp;MB';
      return Math.max(1, Math.round(bytes / 1024)) + '&nbsp;KB';
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;',
          '"': '&quot;', "'": '&#39;'
        })[c];
      });
    }
  });
})();
