# Nexus Hub — Personal Application Launcher

A responsive personal dashboard built with HTML5, Bootstrap 5.3, CSS3, vanilla JavaScript ES6, and JSON. No login, logout, registration, or backend is required.

## Run locally
Because the application loads `data/applications.json` with `fetch`, run it through a local static server rather than opening `index.html` directly.

### Option 1: VS Code
Install the Live Server extension, right-click `index.html`, and choose **Open with Live Server**.

### Option 2: Python
From this folder, run:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`.

## Customize applications
Edit `data/applications.json`. Replace every sample/placeholder URL with the actual deployed URL for your application. Keep IDs unique.

Each record supports:
- `id`: unique key
- `name`: app title
- `description`: short summary
- `category`: category label
- `url`: deployed HTTP/HTTPS URL
- `icon`: Bootstrap Icon class, e.g. `bi-window`
- `color`: one of `tint-mint`, `tint-blue`, `tint-violet`, `tint-amber`, `tint-lilac`, `tint-sky`, `tint-rose`, `tint-teal`
- `favorite`: optional initial favorite hint (favorites are managed in browser storage)

## Features
- Search, category filters, favorites, recently opened
- Grid and list layouts
- Dark mode
- Add applications from the UI (saved in the current browser)
- New-tab launch by default; the gear/preferences shortcut toggles same-tab launch
- Responsive desktop, tablet, and mobile UI

## Deployment
Upload the whole folder to GitHub Pages or deploy it to Vercel as a static site. If using GitHub Pages under a repository subpath, keep relative asset paths as provided. External CSS/icons/fonts use CDNs.

## Important
- This is a personal launcher, not an authentication/security boundary.
- Applications added through the UI are stored in that browser's `localStorage` only. They do not automatically update the JSON file or sync across browsers/devices.
- Use only URLs you trust. Replace example links before regular use.
