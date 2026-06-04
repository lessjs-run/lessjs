# @openelement/app

JSX-first application authoring API for openElement.

Use the package root in route, island, and component modules:

```tsx
import { definePage } from '@openelement/app';

export default definePage(() => {
  return <main>Hello openElement</main>;
});
```

Use the `/vite` subpath in `vite.config.ts`:

```ts
import { openElement } from '@openelement/app/vite';
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

## Authoring API

```tsx
import { defineElement, defineIsland, defineLayout, definePage } from '@openelement/app';
```

- `definePage(render)` creates a file-route page from a JSX function.
- `definePage({ load, render, title, description, layout, revalidate })` creates a page with route data and metadata.
- `defineIsland(tagName, render, options)` creates a browser-upgraded island.
- `defineElement(tagName, render)` creates a DSD component.
- `defineLayout(tagName, render)` is the layout-specific form of `defineElement()`.

`DsdElement` remains the runtime primitive in `@openelement/core`, but application
authors should start from this package.

## Install

```bash
deno add jsr:@openelement/app
```

## License

MIT
