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
  const eventTitle = "Matrimonio Laura e Michele";
  const eventLocation = "Parrocchia Sacra Famiglia, Strada Vaciglio Centro 280, Modena";
  const startDateTime = "2026-09-26T15:30:00";
  const endDateTime = "2026-09-26T18:00:00";
  const eventNotes = "Sito web: https://lauraemichele.netlify.app\n\nPer maggiori dettagli visita il sito web del matrimonio.";

  // Google Calendar
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=20260926T153000Z/20260926T180000Z&location=${encodeURIComponent(eventLocation)}&details=${encodeURIComponent(eventNotes)}`;

  // Outlook
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&startdt=${startDateTime}&enddt=${endDateTime}&location=${encodeURIComponent(eventLocation)}&body=${encodeURIComponent(eventNotes)}`;

  // Apple Calendar - Generate ICS file for better iOS compatibility
  function generateICS() {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Laura e Michele//Wedding//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${eventTitle}
X-WR-TIMEZONE:Europe/Rome
BEGIN:VEVENT
UID:matrimonio-laura-michele@lauraemichele.netlify.app
DTSTAMP:20260926T153000Z
DTSTART:20260926T153000Z
DTEND:20260926T180000Z
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

// Initialize calendar links on page load
document.addEventListener("DOMContentLoaded", function () {
  generateCalendarLinks();

  event.preventDefault();
  $("html, body").animate(
    {
      scrollTop: $($.attr(this, "href")).offset().top
    },
    500
  );
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

    $('#alert-wrapper').html(alert_markup('info', '<strong>Solo un secondo!</strong> Stiamo salvando i tuoi dati.'));

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
