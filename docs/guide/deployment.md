# Deployment Guide

openElement builds static-first applications with Declarative Shadow DOM.
This guide covers deploying to common hosting platforms.

## Build for Production

```bash
deno task build
```

This produces:

- `www/dist/` — Static HTML + assets (SSG output)
- `www/dist/client/` — Client-side JavaScript bundles
- `www/dist/server/` — Server entry point (for SSR/ISR)

## Static Hosting (SSG)

For pure static sites (no server-side rendering), upload `www/dist/` to any
static host.

### Netlify

```toml
# netlify.toml
[build]
  command = "deno task build"
  publish = "www/dist"
```

### Vercel

```json
{
  "buildCommand": "deno task build",
  "outputDirectory": "www/dist",
  "framework": null
}
```

### GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
      - run: deno task build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./www/dist
```

## Deno Deploy

For server-side rendering with ISR support:

```typescript
// deploy.ts
import { Hono } from 'hono';
import { serve } from 'https://deno.land/std/http/server.ts';

const app = new Hono();

// Serve static assets
app.use('/client/*', async (c) => {
  const path = new URL(`./www/dist${c.req.path}`, import.meta.url);
  const file = await Deno.readFile(path);
  return c.body(file);
});

// SSR fallback
app.get('*', async (c) => {
  // Dynamic import of server entry
  const { renderRoute } = await import('./www/dist/server/entry.js');
  const html = await renderRoute(c.req.path);
  return c.html(html);
});

serve(app.fetch);
```

Deploy:

```bash
deployctl deploy --project=my-app deploy.ts
```

## Cloudflare Workers

```typescript
// worker.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('*', async (c) => {
  // Use Workers KV for ISR cache
  const cache = await KV.get(`isr:${c.req.path}`);
  if (cache) return c.html(cache);

  const { renderRoute } = await import('./dist/server/entry.js');
  const html = await renderRoute(c.req.path);
  await KV.put(`isr:${c.req.path}`, html, { expirationTtl: 3600 });
  return c.html(html);
});

export default app;
```

## Docker

```dockerfile
FROM denoland/deno:2.7.0

WORKDIR /app
COPY . .
RUN deno task build

EXPOSE 8000
CMD ["deno", "run", "--allow-read", "--allow-net", "--allow-env", "deploy.ts"]
```

## ISR (Incremental Static Regeneration)

openElement supports ISR via the `IsrCache` interface. The built-in
`MemoryIsrCache` works for single-instance deployments. For multi-instance,
implement a shared cache adapter (Redis, Deno KV, filesystem).

```typescript
import { MemoryIsrCache } from '@openelement/core';

const cache = new MemoryIsrCache();

// Pages define revalidation in their route config:
export default definePage({
  route: { path: '/blog/[slug]' },
  renderIntent: {
    mode: 'isr',
    revalidate: 60, // seconds
  },
});
```
