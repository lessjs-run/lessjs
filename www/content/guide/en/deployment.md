---
title: 'Deployment'
section: 'Production'
label: 'Deployment'
order: 5
---

# Deployment

openElement is static-first. Framework output is ordinary HTML, JavaScript, and
assets by default. Runtime behavior enters explicitly through API routes,
server rendering, or future ISR/cache adapters.

## Build

```bash
deno task build
```

The output directory is `dist/`. Static hosts can serve this directory
directly.

## Static Platforms

- Cloudflare Pages: build command `deno task build`, output directory `dist`.
- Netlify: publish directory `dist`.
- Vercel: use the static output path with the "Other" preset.
- GitHub Pages: configure the Vite base path for repository subpaths.
- S3 or R2: upload `dist/` with cache headers.

For static platforms, request handling is owned by the host. openElement owns
the generated files, island chunks, metadata, and DSD HTML. CDN cache headers,
redirects, CSP, and compression are provider configuration.

## Nitro Runtime

The Framework product uses Vite + Nitro as the default runtime/deploy proof.
Generated apps can mount the openElement server entry through
`createOpenElementNitroHandler()` when API routes, SSR, or ISR/cache intent need
a server target.

Provider-specific Nitro presets are recipes, not new openElement products:

- Node/server: use Nitro's node preset for portable server output.
- Cloudflare Workers/Pages Functions: use a Nitro Cloudflare preset when the
  deployment needs edge request handling.
- Vercel/Netlify server functions: use the corresponding Nitro preset and keep
  platform cache configuration outside application code.

## API Routes

Runtime API behavior is separate from static output. Deploy API routes through
the Nitro/server adapter when your app needs dynamic behavior. Static pages can
still be hosted as files; API routes and ISR/cache intent require a runtime
target.

## Cache And ISR Intent

`renderIntent.revalidate` records cache/ISR intent. Static output proves the
page can be generated. A runtime adapter decides how that intent maps to
provider cache headers, edge storage, or regeneration.

## Production Checklist

- Run the full local gate before publishing.
- Preview `dist/` locally.
- Confirm base path and asset URLs.
- Configure CSP/security headers at the hosting layer.
- Choose static-only output or a Nitro runtime target deliberately.
- Deploy any runtime API separately from static pages when using a static host.
