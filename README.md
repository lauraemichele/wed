# Wedding Invitation Landing Page

A beautiful, responsive wedding invitation website for Laura and Michele's special day on September 26, 2026.

## Features

- **Main Information**: Displays wedding details and couple information
- **Countdown Timer**: Live countdown to the wedding day
- **Time and Place Info**: Venue details with location information
- **Add to Calendar**: Direct integration with Google Calendar
- **Map Directions**: Google Maps integration for navigation
- **Send Message**: WhatsApp API integration for RSVPs
- **Photo Upload**: Special feature for guests to upload wedding photos (available on wedding day)

## Technology Stack

- **Hosting**: GitHub Pages
- **CSS Framework**: Bulma CSS
- **JavaScript Libraries**:
  - jQuery
  - jQuery Countdown
  - AOS (Animate On Scroll)
- **Fonts**: Google Fonts (Rouge Script, Raleway)

## Live Preview

View the live site at: [https://lauraemichele.github.io/wed/](https://lauraemichele.github.io/wed/)

## Development

### Running Locally

To run the site locally for development:

1. Clone the repository
2. Open `index.html` in your browser, or use a local server to avoid CORS issues:

   ```bash
   # Using Python (if available)
   python -m http.server 8000

   # Or using Node.js with http-server
   npx http-server

   # Then visit http://localhost:8000
   ```

### Debugging Hidden Menu Features

The hidden sections are normally visible only after the wedding-day cutoff (from 26 September 2026 at 18:00 CEST). To debug or preview these features:

- Visit: [index.html?showHiddenMenu=1](index.html?showHiddenMenu=1)
- Or set in browser console: `localStorage.setItem('showHiddenMenu', '1')` and refresh

This will display the hidden sections and menu items, allowing you to preview the photo upload and recipes content.
