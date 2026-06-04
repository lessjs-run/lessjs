# @openelement/app

Recommended openElement application entry.

`openElement()` combines `@openelement/adapter-vite`, `@openelement/content`, and
`@openelement/i18n` with one shared build context. Use this package for normal apps.

## Install

```bash
deno add jsr:@openelement/app
```

## Usage

```ts
import { openElement } from '@openelement/app';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    openElement({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      packageIslands: ['@openelement/ui'],
      content: { blog: { contentDir: 'content/blog' } },
      i18n: { locales: ['en', 'zh'], defaultLocale: 'en' },
    }),
  ],
});
```

## What It Does

1. Creates a shared `OpenElementBuildContext`.
2. Installs the Vite adapter through `createOpenPlugin(options, ctx)`.
3. Adds content plugins when `content` is configured.
4. Adds i18n route expansion when `i18n` is configured.

## Registry Boundary

`packageIslands` is explicit configuration today. A future `open add` command
may update it automatically, but only after validating a package manifest and
showing the user the config diff.

## License

MIT
