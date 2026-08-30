function openModal($el) {
  $el.classList.add('is-active');
}

function closeModal($el) {
  $el.classList.remove('is-active');
}

function closeAllModals() {
  (document.querySelectorAll('.modal') || []).forEach(($modal) => {
    closeModal($modal);
  });
}


// Add a keyboard event to close all modals
document.addEventListener('keydown', (event) => {
  const e = event || window.event;

  if (e.keyCode === 27) { // Escape key
    closeAllModals();
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Get all "navbar-burger" elements
  var $navbarBurgers = Array.prototype.slice.call(
    document.querySelectorAll(".navbar-burger"),
    0
  );
  // Check if there are any navbar burgers
  if ($navbarBurgers.length > 0) {
    // Add a click event on each of them
    $navbarBurgers.forEach(function ($el) {
      $el.addEventListener("click", function () {
        // Get the target from the "data-target" attribute
        var target = $el.dataset.target;
        var $target = document.getElementById(target);
        // Toggle the class on both the "navbar-burger" and the "navbar-menu"
        $el.classList.toggle("is-active");
        $target.classList.toggle("is-active");
      });
    });
  }

  // Add a click event on various child elements to close the parent modal
  (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
    const $target = $close.closest('.modal');

    $close.addEventListener('click', () => {
      closeModal($target);
    });
  });

});

// Calendar Event URLs
function generateCalendarLinks() {
  const button = document.getElementById('add-to-calendar');
  if (!button) return;

  const ua = navigator.userAgent;
  const isAndroidChrome =
    /Android/.test(ua) &&
    /Chrome/.test(ua) &&
    !/EdgA|OPR|SamsungBrowser|Firefox/i.test(ua);

  if (!isAndroidChrome) return; // .ics fallback already set in HTML href

  const eventTitle = "Matrimonio Laura e Michele ♥️";
  const eventLocation = "Parrocchia Sacra Famiglia, Strada Vaciglio Centro 280, Modena";
  const eventNotes = "Sito web: https://lauraemichele.github.io/wed\n\nPer maggiori dettagli visita il sito web del matrimonio.";
  // Europe/Rome in September is CEST (UTC+2): 15:30 local = 13:30 UTC.
  const startMs = Date.UTC(2026, 8, 26, 13, 30, 0);
  const endMs = Date.UTC(2026, 8, 27, 0, 0, 0);

  // Fallback when the intent doesn't resolve: Google Calendar's render
  // URL. The Google Calendar Android app intercepts this via App Links.
  const googleParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: '20260926T153000/20260927T020000',
    ctz: 'Europe/Rome',
    details: eventNotes,
    location: eventLocation,
  });
  const fallbackUrl = 'https://www.google.com/calendar/render?' + googleParams.toString();

  // Use the canonical content URI form (intent://com.android.calendar/events
  // with scheme=content) — more reliable than the bare type=... form.
  button.href =
    'intent://com.android.calendar/events#Intent' +
    ';scheme=content' +
    ';action=android.intent.action.INSERT' +
    ';S.title=' + encodeURIComponent(eventTitle) +
    ';S.eventLocation=' + encodeURIComponent(eventLocation) +
    ';S.description=' + encodeURIComponent(eventNotes) +
    ';l.beginTime=' + startMs +
    ';l.endTime=' + endMs +
    ';S.browser_fallback_url=' + encodeURIComponent(fallbackUrl) +
    ';end';
  // target=_blank breaks intent dispatch in Chrome on Android.
  button.removeAttribute('target');
}

// Show the photo upload section only on the wedding day or when debug override is active
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function isWeddingWindowDay() {
  const today = new Date();
  const weddingCutoff = new Date(2026, 8, 26, 18, 0, 0);
  return today.getTime() >= weddingCutoff.getTime();
}

function showHiddenSections() {
  const isDebugOverride = getQueryParam('showHiddenMenu') === '1' || localStorage.getItem('showHiddenMenu') === '1';
  const shouldShow = isWeddingWindowDay() || isDebugOverride;
  const sectionConfigs = [
    { sectionId: 'photo-upload-day', navClass: '.photo-upload-menu' },
    { sectionId: 'recipes', navClass: '.recipes-menu' },
  ];

  sectionConfigs.forEach(({ sectionId, navClass }) => {
    const section = document.getElementById(sectionId);
    const navItems = document.querySelectorAll(navClass);

    if (section) {
      section.style.display = shouldShow ? 'block' : 'none';
    }

    if (navItems.length) {
      navItems.forEach((item) => {
        if (shouldShow) {
          item.classList.remove('is-hidden');
        } else {
          item.classList.add('is-hidden');
        }
      });
    }
  });
}

// Initialize calendar links on page load
document.addEventListener("DOMContentLoaded", function () {
  generateCalendarLinks();
  showHiddenSections();

  // Prevent text selection on buttons
  document.querySelectorAll('.button, .btn-cta, .btn-whatsapp').forEach(button => {
    button.addEventListener('mousedown', function (e) {
      e.preventDefault();
    });
    button.addEventListener('click', function () {
      // Deselect any selected text
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      } else if (document.selection) {
        document.selection.empty();
      }
    });
  });
});

// When the user scrolls down 20px from the top of the document, show the scroll up button
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  const toTop = document.getElementById("toTop");
  if (!toTop) return;
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    toTop.style.display = "block";
  } else {
    toTop.style.display = "none";
  }
}

function alert_markup(alert_type, msg) {
  return '<div class="notification is-' + alert_type + '">' + msg + '<button class="delete"></button></div>';
}



// Preloader
$(document).ready(function ($) {
  $(".preloader-wrapper").fadeOut(800);
  $("body").removeClass("preloader-site");

  /********************** RSVP **********************/
  $('#rsvp-form').on('submit', function (e) {
    e.preventDefault();
    var $form = $(this);
    var data = $form.serialize();

    $('#alert-wrapper').html(alert_markup('danger is-light', '<strong>Solo un secondo!</strong> Stiamo salvando i tuoi dati.'));

    // if (MD5($('#invite_code').val()) !== 'b0e53b10c1f55ede516b240036b88f40'
    // && MD5($('#invite_code').val()) !== '2ac7f43695eb0479d5846bb38eec59cc') {
    // $('#alert-wrapper').html(alert_markup('danger', '<strong>Sorry!</strong> Your invite code is incorrect.'));
    // } else         {
    $.post('https://script.google.com/macros/s/AKfycbxStTY65LP5I5pcBO8GvbeZkRDLDpphnZcdcJODDugESrQVd7qqmR1bUZ8LhhCgOgpplw/exec', data)
      .done(function (data) {
        console.log(data);
        if (data.result === "error") {
          $('#alert-wrapper').html(alert_markup('danger', data.message));
        } else {
          $('#alert-wrapper').html('');
          $form[0].reset();
          openModal(document.getElementById('rsvp-modal'));
        }
      })
      .fail(function (data) {
        console.log(data);
        $('#alert-wrapper').html(alert_markup('danger', '<strong>Scusa!</strong> C\'è stato un qualche problema con il server.'));
      });
    // }
  });
});
