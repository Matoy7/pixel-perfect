# PIXEL PERFECT

Mobile-only Hebrew (RTL) browser puzzle game: find the hidden black pixel.

Live: https://matoy7.github.io/pixel-perfect/

## Stack
React + Vite + TypeScript, plain CSS. Static build deployed to GitHub Pages by
`.github/workflows/deploy.yml` on every push to `main`.

```bash
npm install
npm run dev      # local dev (also reachable from a phone on the same network)
npm run build
```

## Art pipeline
Original artwork lives in `art/`. Game-ready layers in `public/assets/` are
generated from it, e.g. the welcome screen:

```bash
python3 scripts/extract_welcome.py art/welcome-original.png
```

(requires `opencv-python`, `numpy`, `pillow`)
