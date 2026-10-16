# My Hub

A responsive, installable dashboard for opening and sharing your application links. It uses static HTML, CSS, vanilla JavaScript, JSON, and a service worker; there is no backend or build step.

## Run locally

Serve the project over HTTP rather than opening `index.html` as a file. Service workers require a secure context: HTTPS in production, or localhost during development.

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Install the PWA

Deploy the complete project over HTTPS. Supported browsers offer an **Install** button in the dashboard when their install prompt is available. On iOS, use **Share → Add to Home Screen**. The app manifest, local icons, and service worker enable standalone installation.

The service worker caches the dashboard shell, application list, styles, script, and local icons. The dashboard and its application list remain available offline after the first successful online load. Opening hosted applications still requires an internet connection. If a page cannot be loaded from cache, the service worker shows `offline.html`.

When a new service worker version activates in an already controlled tab, the dashboard refreshes once to use the updated files.

## Application links

Edit `data/applications.json` to add or update dashboard cards. Each record supports:

- `id`: unique key
- `name`: application name
- `description`: short summary
- `url`: HTTP or HTTPS destination
- `icon`: Bootstrap Icons class
- `color`: one of `tint-mint`, `tint-blue`, `tint-violet`, `tint-amber`, `tint-lilac`, `tint-sky`, `tint-rose`, or `tint-teal`

Each card opens its destination in a new tab and has a **Copy link** button. Clipboard access is available on HTTPS and localhost. After changing the dashboard shell or app data, update the `CACHE_VERSION` in `service-worker.js` so existing installations download the new cached files.

## Deployment

Deploy the whole folder as a static site, such as GitHub Pages or Vercel, and keep the relative paths intact. For GitHub Pages under a repository subpath, the relative manifest, service-worker, and asset URLs are scoped to that subpath.
