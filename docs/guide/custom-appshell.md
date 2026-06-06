# Custom AppShell

openElement v0.28.4 supports explicit application shells. Use this when a site should
not inherit the default documentation layout, or when different routes need
different outer shells.

## 1. Create A Shell Component

```tsx
/** @jsxImportSource @openelement/core */
import { DsdElement } from '@openelement/core';

export const tagName = 'site-layout';

export default class SiteLayout extends DsdElement {
  siteName = 'Field Notes';
  footerText = '';

  render() {
    return (
      <div class='site-layout'>
        <header>
          <a href='/'>{this.siteName}</a>
        </header>
        <main>
          <slot></slot>
        </main>
        {this.footerText && <footer>{this.footerText}</footer>}
      </div>
    );
  }
}

customElements.define(tagName, SiteLayout);
```

## 2. Configure The Shell

```ts
import { openElement } from '@openelement/app/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    openElement({
      appShell: {
        tagName: 'site-layout',
        import: './app/components/site-layout.tsx',
        props: {
          siteName: 'Field Notes',
          footerText: 'Built with openElement',
        },
      },
    }),
  ],
});
```

The SSG entry imports the configured module and renders `<site-layout>`. No alias
override for `@openelement/ui/open-layout` is needed.

## 3. Add Named Shells

v0.33 keeps the page descriptor focused on `route`, `head`, `renderIntent`,
`load`, `render`, and `error`. Route-specific wrapping should live in app shell
or renderer configuration instead of page metadata.

```ts
openElement({
  layouts: {
    default: {
      tagName: 'site-layout',
      import: './app/components/site-layout.tsx',
    },
    post: {
      tagName: 'post-layout',
      import: './app/components/post-layout.tsx',
    },
    bare: false,
  },
});
```

Use the default shell for ordinary routes. Use a custom `_renderer.ts` or a
dedicated app shell configuration when a subtree needs a different wrapper.
