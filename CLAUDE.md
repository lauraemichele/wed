# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static wedding invitation site for Laura & Michele (26 September 2026), hosted on GitHub Pages at https://lauraemichele.github.io/wed/. Italian-language UI. No build step — plain HTML/CSS/JS.

## Local development

Serve the directory with any static server so relative paths and the ICS blob work correctly:

```powershell
python -m http.server 8000
# or
npx http-server
```

To preview the photo-upload section outside the wedding window, append `?showPhotoUpload=1` to the URL or run `localStorage.setItem('showPhotoUpload', '1')` in the console. See `showPhotoUploadSectionIfWeddingDay` in `js/main.js`.

## Deployment

`.github/workflows/static.yml` deploys the repo root to GitHub Pages on every push to `master`. Before upload it runs `sed -i "s|%IBAN%|${{ secrets.IBAN }}|g" index.html`, replacing the literal `%IBAN%` placeholder in `index.html` with the `IBAN` GitHub Actions secret. Do not commit the real IBAN — keep the placeholder in `index.html`.

## Architecture notes

- **Single page** (`index.html`) with anchor-linked sections: `#time`, `#location`, `#lista`, `#rsvp`, and the conditionally-shown `#photo-upload-day`. The mobile burger nav and desktop hero menu mirror each other; both must be updated together when sections change.
- **Countdown** uses jQuery Countdown (`js/jquery.coundown.js`). The target date is hardcoded inline in `index.html` (`weddingdate = '09/26/2026 15:30:00'`) — keep it in sync with the displayed date and with the calendar/ICS values in `js/main.js`.
- **Single "Aggiungi al calendario" button** (`#add-to-calendar`) — `generateCalendarLinks()` in `js/main.js` upgrades the href at runtime:
  - **Android Chrome** (UA-sniffed; excludes Edge/Samsung Internet/Firefox/Opera): swapped to a content-URI intent targeting the Google Calendar package (`intent://com.android.calendar/events#Intent;scheme=content;package=com.google.android.calendar;action=android.intent.action.INSERT;...;end`) with string/long extras for title/location/begin/end. `target="_blank"` is removed since it breaks intent dispatch on Chrome. `browser_fallback_url` points to the static `.ics` — so if Google Calendar isn't installed the user gets the file instead of being bounced to the web Google Calendar.
  - **Everyone else**: href stays as the HTML default `matrimonio-laura-michele.ics`. iOS Safari opens it in Calendar.app directly; Android non-Chrome downloads then prompts to open; desktop downloads.
  - The `.ics` file at the repo root is the source of truth for Apple/iCal imports. The intent URL has its own hardcoded UTC timestamps in the JS, so event date/time lives in three places to keep in sync: `index.html` (`weddingdate`), `matrimonio-laura-michele.ics`, and `generateCalendarLinks()`.
- **RSVP form** POSTs `name` + `allergie` fields to a Google Apps Script Web App URL embedded in `js/main.js`. On success a modal (`#rsvp-modal`) opens. There is no client-side validation beyond `required`.
- **Photo upload section** is hidden by default and only revealed on 26–27 September 2026 (or via the debug overrides above). It links to a Google Drive folder, despite UI copy mentioning OneDrive.
- **Styling** uses Bulma 0.9.4 + bulma-tooltip from CDN, FontAwesome 7 from CDN, plus local CSS in `css/` (`main.css`, `rsvp.css`, `jquery.countdown.css`). Custom fonts live in `fonts/` — only `Rinnero.ttf` and `KGOneMoreLightBIG.ttf` are actively used (see recent commit `db9e504`); other font files may be vestigial.
- **AOS** (Animate On Scroll) is loaded from CDN at the bottom of `index.html` and initialized inline. Section reveals use `data-aos="fade-up"` / `fade-left` / `fade-right` / `zoom-in`.
- `image/old/` holds unused legacy assets from the original template — safe to ignore when looking for active imagery.
