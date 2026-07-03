# Serving background sounds (Subliminal Maker)

The native app loads built-in background sounds (Fireplace, Rain, etc.) from your **production site** so they work without bundling. Do this once so `/sounds/` is live.

## 1. Deploy the site (so `/sounds/` is served)

The files in `public/sounds/` are already in the repo. When you build, Vite copies them into `dist/sounds/`, so they are served at `https://your-domain.com/sounds/`.

### If you use **auto-deploy** (Vercel, Netlify, etc.)

- **Nothing extra to do.** The next time you push and the site deploys, the build will include `public/sounds/` and your site will serve `/sounds/` (e.g. `https://paletteplot.com/sounds/Fireplace.wav`).
- Optional: trigger a redeploy from your dashboard (e.g. Vercel → Deployments → Redeploy) so the current commit is built and deployed.

### If you deploy **manually**

```bash
npm run build
```

Then deploy the **`dist`** folder (e.g. upload to your host or run your usual deploy script). The `dist` folder will contain `dist/sounds/*.wav`, which your host will serve at `/sounds/`.

### Check that it worked

After deployment, open in a browser:

- `https://paletteplot.com/sounds/Fireplace.wav`  
  (or your real domain)

You should get the file (or an audio player), not a 404.

---

## 2. If your production URL is not `https://paletteplot.com`

The native app uses `VITE_PUBLIC_ORIGIN` to know where to load sounds from. Default is `https://paletteplot.com`.

### Locally (optional)

In the project root, create or edit `.env`:

```env
VITE_PUBLIC_ORIGIN=https://your-real-domain.com
```

Use your real production URL (no trailing slash).

### On your deployment platform

Set the same variable in the host’s environment:

- **Vercel:** Project → Settings → Environment Variables → add `VITE_PUBLIC_ORIGIN` = `https://your-real-domain.com` (Production).
- **Netlify:** Site → Site settings → Environment variables → add `VITE_PUBLIC_ORIGIN` = `https://your-real-domain.com`.

Redeploy after changing env vars so the new value is used.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Deploy the app (push for auto-deploy, or `npm run build` and deploy `dist`). |
| 2 | Confirm `https://<your-domain>/sounds/Fireplace.wav` works. |
| 3 | If domain ≠ paletteplot.com, set `VITE_PUBLIC_ORIGIN=https://your-domain.com` in .env and in your host’s env, then redeploy. |

After that, the native app will load background sounds from your production site.

---

## Cloudflare “sounds” project (separate deployment)

If you host the WAV files on a **separate** Cloudflare Pages project (e.g. `sounds-1og.pages.dev`):

1. Set **`VITE_SOUNDS_ORIGIN`** in Codemagic (and any build that runs the app) to that project’s URL, e.g. `https://sounds-1og.pages.dev` (no trailing slash). The app will then load e.g. `https://sounds-1og.pages.dev/Fireplace.wav` (files at project root).

2. **CORS** – The app fetches those files from another origin (e.g. `capacitor://localhost` or your main domain). Cloudflare must send CORS headers or the response is opaque and decoding fails. When you upload the sound files to the sounds project, include a **`_headers`** file in the **root** of the upload with:

   ```
   /*
     Access-Control-Allow-Origin: *
   ```

   (The file is literally named `_headers` with no extension. One line is `/*`, the next is `  Access-Control-Allow-Origin: *`. Two spaces before the header.)

   A copy is in this repo at **`docs/sounds-project-headers.txt`** – rename it to `_headers` and put it in the root of your sounds project upload so every file is served with CORS and decoding works.
