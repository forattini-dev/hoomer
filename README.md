# Hoomer — Floor Plan Editor

A JavaScript 2D floor plan editor with JSON export/import and integrated 3D viewing mode.

## Run Locally

```bash
pnpm install
pnpm dev
```

- `pnpm dev`: rebuilds on changes and launches `live-server`.

## Build for GitHub Pages

```bash
pnpm build:pages
```

This generates:
- `dist/app.js` (app bundle)
- `dist/index.html` (static entrypoint with relative `./app.js` path)
- `dist/.nojekyll`

You can preview locally:

```bash
pnpm serve:pages
```

## Automated GitHub Pages Deployment

Workflow included in:

- `.github/workflows/gh-pages.yml`

Flow:
1. Triggered on push to `main` (or manual run from Actions).
2. Installs dependencies with pnpm.
3. Runs `pnpm build:pages`.
4. Uploads the `dist` directory.
5. Publishes to GitHub Pages.

## Repository Settings

- In **GitHub → Settings → Pages**, set **Source: GitHub Actions**.
