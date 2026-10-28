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

**Option B: GitHub**

1. Push the `photobooth` folder to a GitHub repo.
2. In Vercel, click **Add New → Project** and import the repo.
3. Framework preset: **Other**. Leave build command and output directory empty.
4. Deploy.

Vercel serves over HTTPS, which the camera API requires. In project settings you can rename the project to `kodakan` to get `kodakan.vercel.app` if it's free.
