# Wanderlust — Travel Booking Website

A simple, responsive travel booking website built with HTML, CSS, and JavaScript. No build step required.

## Features

- **Flight, hotel, and package booking** — tabbed search form on the homepage
- **Popular destinations** — click a card to pre-fill your search
- **Featured deals** — limited-time offers section
- **Booking flow** — search results, selection, and confirmation modal
- **My Bookings** — bookings saved in browser localStorage
- **Responsive design** — works on desktop and mobile

## Quick start

1. Open `index.html` in your browser (double-click or drag into a browser window).

   Or run a local server:

   ```bash
   # Python
   python -m http.server 8080

   # Node (if you have npx)
   npx serve .
   ```

2. Visit `http://localhost:8080` (or open the file directly).

## Project structure

```
├── index.html      # Main page
├── css/
│   └── styles.css  # Styles
├── js/
│   └── app.js      # Booking logic
└── README.md
```

## Notes

This is a front-end demo. Bookings are stored locally in your browser only — there is no real payment or backend.
