---
title: 'Deployment'
section: 'Production'
label: 'Deployment'
order: 5
---

# Deployment

openElement is static-first. Build output is ordinary HTML, JavaScript, and
assets that can be hosted on any static platform.

## Build

```bash
deno task build
```

The output directory is `dist/`.

## Static Platforms

- Cloudflare Pages: build command `deno task build`, output directory `dist`.
- Netlify: publish directory `dist`.
- Vercel: use the static output path with the "Other" preset.
- GitHub Pages: configure the Vite base path for repository subpaths.
- S3 or R2: upload `dist/` with cache headers.

## API Routes

Runtime API behavior is separate from static output. Deploy API routes through
the platform adapter or future server/API layer when your app needs dynamic
behavior.

## Production Checklist

- Run the full local gate before publishing.
- Preview `dist/` locally.
- Confirm base path and asset URLs.
- Configure CSP/security headers at the hosting layer.
- Deploy any runtime API separately from static pages.
