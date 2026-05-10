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
  const eventTitle = "Matrimonio Laura e Michele ♥️";
  const eventLocation = "Parrocchia Sacra Famiglia, Strada Vaciglio Centro 280, Modena";
  const startDateTime = "2026-09-26T15:30:00";
  const endDateTime = "2026-09-27T02:00:00";
  const eventTimeZone = "Europe/Rome";
  const eventNotes = "Sito web: https://lauraemichele.github.io/wed\n\nPer maggiori dettagli visita il sito web del matrimonio.";

  // Google Calendar - Use existing event link
  const googleUrl = "https://calendar.google.com/calendar/event?action=TEMPLATE&tmeid=YzVqM2ljMWs3NWg2NmI5bDZrc2owYjlrNjloMzJiYjI2Z3NqNmJiNDZjc200ZGI1NjhvM2FjOW83NCBmYW1pbHkxNzk4NDY4MDMwMjM5ODU4OTAwOUBn&tmsrc=family17984680302398589009%40group.calendar.google.com";

  // Outlook
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&startdt=${encodeURIComponent(startDateTime)}&enddt=${encodeURIComponent(endDateTime)}&location=${encodeURIComponent(eventLocation)}&body=${encodeURIComponent(eventNotes)}`;

  // Apple Calendar - Generate ICS file for better iOS compatibility
  function generateICS() {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Laura e Michele//Wedding//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${eventTitle}
X-WR-TIMEZONE:${eventTimeZone}
BEGIN:VEVENT
UID:matrimonio-laura-michele@lauraemichele.github.io
DTSTAMP:20260926T153000Z
DTSTART;TZID=${eventTimeZone}:20260926T153000
DTEND;TZID=${eventTimeZone}:20260927T020000
SUMMARY:${eventTitle}
LOCATION:${eventLocation}
DESCRIPTION:${eventNotes}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    return url;
  }

  // Assign URLs to links
  document.querySelectorAll('.buttons a.btn-cta').forEach((link) => {
    if (link.querySelector('.fa-google')) {
      link.href = googleUrl;
    } else if (link.querySelector('.fa-microsoft')) {
      link.href = outlookUrl;
    } else if (link.querySelector('.fa-apple')) {
      link.href = generateICS();
      link.download = 'matrimonio-laura-michele.ics';
    }
  });
}

// Show the photo upload section only on the wedding day or when debug override is active
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function showPhotoUploadSectionIfWeddingDay() {
  const today = new Date();
  const isWeddingDay =
    today.getFullYear() === 2026 &&
    today.getMonth() === 8 && // months are zero-based: 8 = September
    (today.getDate() === 26 || today.getDate() === 27);
  const isDebugOverride = getQueryParam('showPhotoUpload') === '1' || localStorage.getItem('showPhotoUpload') === '1';
  const section = document.getElementById('photo-upload-day');
  const navItems = document.querySelectorAll('.photo-upload-menu');
  const shouldShow = isWeddingDay || isDebugOverride;

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
}

// Initialize calendar links on page load
document.addEventListener("DOMContentLoaded", function () {
  generateCalendarLinks();
  showPhotoUploadSectionIfWeddingDay();
  
  // Prevent text selection on buttons
  document.querySelectorAll('.button, .btn-cta, .btn-whatsapp').forEach(button => {
    button.addEventListener('mousedown', function(e) {
      e.preventDefault();
    });
    button.addEventListener('click', function() {
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
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    document.getElementById("toTop").style.display = "block";
  } else {
    document.getElementById("toTop").style.display = "none";
  }
}

function alert_markup(alert_type, msg) {
  return '<div class="notification is-' + alert_type + '">' + msg + '<button class="delete"></button></div>';
}



// Preloader
$(document).ready(function ($) {
  $(".preloader-wrapper").fadeOut();
  $("body").removeClass("preloader-site");

  /********************** RSVP **********************/
  $('#rsvp-form').on('submit', function (e) {
    e.preventDefault();
    var data = $(this).serialize();

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
$(window).load(function () {
  var Body = $("body");
  Body.addClass("preloader-site");
});
