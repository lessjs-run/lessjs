# @openelement/i18n

Build-time i18n support for openElement SSG apps.

## Install

```bash
deno add jsr:@openelement/i18n
```

## Recommended Usage

Configure i18n through the unified Vite facade:

```ts
import { openElement } from '@openelement/app/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    openElement({
      i18n: {
        locales: ['en', 'zh'],
        defaultLocale: 'en',
      },
    }),
  ],
});
```

## Features

- SSG locale expansion for every configured locale and static route.
- `i18nStaticPaths()` for dynamic route locale expansion.
- `switchLocale()` for generating alternate locale links.
- Integration with `open-layout` language switching.

## Route Helpers

```ts
import { i18nStaticPaths, switchLocale } from '@openelement/i18n';

export function getStaticPaths() {
  return i18nStaticPaths();
}

const enPath = switchLocale('/zh/about', 'en');
```

## Advanced Direct Use

Direct plugin use is for framework internals and adapter experiments. Normal
applications should configure i18n through `openElement()` so i18n, content,
route scanning, and SSG share one build context.

## License

MIT
