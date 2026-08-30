(function () {
  // Paste here the Google Apps Script Web App URL after deploy.
  // If empty, the uploader UI is hidden and only the Drive-folder fallback is shown.
  const PHOTO_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbyQFzorPHx7oLkm19Ptcfg7jtn6jRCRoYN5_jogNiAh-ZA2bc4UAfRiwQE7TcvjrG9r/exec';

  const MAX_FILES = 100;
  const MAX_CONCURRENT = 4;
  const MAX_FILE_SIZE_MB = 25;
  const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

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

      const queue = selected.map((file, i) => ({ file, i }));
      const workerCount = Math.min(MAX_CONCURRENT, queue.length);
      const workers = [];
      for (let w = 0; w < workerCount; w++) {
        workers.push((async function worker() {
          while (queue.length) {
            const item = queue.shift();
            if (!item) return;
            try {
              await uploadOne(item.file, item.i);
              done++;
            } catch (err) {
              failed++;
              markFile(item.i, 'error', (err && err.message) || 'errore');
            }
            updateStatus();
          }
        })());
      }
      await Promise.all(workers);

      statusEl.innerHTML = failed === 0
        ? '<span class="has-text-success"><strong>Fatto!</strong> ' + done + ' file caricati.</span>'
        : '<span class="has-text-warning"><strong>' + done + ' caricati, ' + failed +
          ' falliti.</strong> Riseleziona i file in errore e riprova.</span>';

      uploading = false;
      fileInput.disabled = false;
      clearBtn.disabled = false;
      // Keep submit disabled: force a new selection to avoid double uploads.
      submitBtn.disabled = true;
    });

    function renderList() {
      fileListEl.innerHTML = '';
      selected.forEach(function (f, i) {
        const oversize = f.size > MAX_FILE_SIZE;
        const li = document.createElement('li');
        li.id = 'photo-file-' + i;
        li.className = 'photo-file-item';
        li.innerHTML =
          '<span class="photo-file-name">' + escapeHtml(f.name) + '</span>' +
          '<span class="photo-file-size">' + (f.size / (1024 * 1024)).toFixed(1) + '&nbsp;MB</span>' +
          '<span class="photo-file-state">' +
            (oversize ? '<span class="has-text-danger">troppo grande</span>' : 'in coda') +
          '</span>';
        fileListEl.appendChild(li);
      });
    }

    function markFile(i, state, extra) {
      const li = document.getElementById('photo-file-' + i);
      if (!li) return;
      const stateEl = li.querySelector('.photo-file-state');
      if (!stateEl) return;
      if (state === 'uploading') {
        stateEl.innerHTML = '<span class="has-text-info">caricamento…</span>';
      } else if (state === 'ok') {
        stateEl.innerHTML = '<span class="has-text-success">ok</span>';
      } else if (state === 'error') {
        stateEl.innerHTML = '<span class="has-text-danger">errore' +
          (extra ? ': ' + escapeHtml(extra) : '') + '</span>';
      }
    }

    async function uploadOne(file, i) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('oltre ' + MAX_FILE_SIZE_MB + ' MB');
      }
      markFile(i, 'uploading');
      const base64 = await fileToBase64(file);

      // FormData (multipart/form-data) evita il preflight CORS
      // e Apps Script legge i campi da e.parameter.
      const body = new FormData();
      body.append('filename', file.name);
      body.append('mimeType', file.type || 'application/octet-stream');
      body.append('data', base64);

      const res = await fetch(PHOTO_UPLOAD_URL, { method: 'POST', body: body });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error('risposta non valida');
      }
      if (json.result !== 'ok') throw new Error(json.message || 'errore server');
      markFile(i, 'ok');
    }

    function fileToBase64(file) {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
          const result = String(reader.result || '');
          const comma = result.indexOf(',');
          resolve(comma >= 0 ? result.slice(comma + 1) : '');
        };
        reader.onerror = function () {
          reject(reader.error || new Error('lettura file fallita'));
        };
        reader.readAsDataURL(file);
      });
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
