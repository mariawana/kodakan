# Kodakan

A vintage film photobooth for the browser: 4 countdown frames, retro film filters with grain, colored strips (including a sprocket-hole film frame), and a downloadable photo strip. Everything runs client-side, so no photos are uploaded.

Made by Arao.

## Files

- `index.html` – page structure
- `style.css` – vintage film styling
- `app.js` – camera, countdown, filters, strip rendering

## Run locally

Camera access needs `localhost` or HTTPS:

```bash
cd photobooth
npx serve .
```

## Deploy to Vercel

**Option A: CLI**

```bash
npm i -g vercel
cd photobooth
vercel        # preview
vercel --prod # production
```
