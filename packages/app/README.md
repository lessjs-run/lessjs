# @lessjs/app

Recommended LessJS application entry.

`lessjs()` combines `@lessjs/adapter-vite`, `@lessjs/content`, and
`@lessjs/i18n` with one shared build context. Use this package for normal apps.

## Install

```bash
deno add jsr:@lessjs/app
```

## Usage

```ts
import { lessjs } from '@lessjs/app';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    lessjs({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      packageIslands: ['@lessjs/ui'],
      content: { blog: { contentDir: 'content/blog' } },
      i18n: { locales: ['en', 'zh'], defaultLocale: 'en' },
    }),
  ],
});
```

## What It Does

1. Creates a shared `LessBuildContext`.
2. Installs the Vite adapter through `less(options, ctx)`.
3. Adds content plugins when `content` is configured.
4. Adds i18n route expansion when `i18n` is configured.

## Registry Boundary

`packageIslands` is explicit configuration today. A future `less add` command
may update it automatically, but only after validating a package manifest and
showing the user the config diff.

## License

MIT
