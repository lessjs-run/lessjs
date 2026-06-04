# Custom AppShell

LessJS v0.28.4 supports explicit application shells. Use this when a site should
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
import { lessjs } from '@openelement/app';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    lessjs({
      appShell: {
        tagName: 'site-layout',
        import: './app/components/site-layout.tsx',
        props: {
          siteName: 'Field Notes',
          footerText: 'Built with LessJS',
        },
      },
    }),
  ],
});
```

The SSG entry imports the configured module and renders `<site-layout>`. No alias
override for `@openelement/ui/less-layout` is needed.

## 3. Add Route-Level Layouts

```tsx
// app/routes/blog/[slug].tsx
export const meta = {
  layout: 'post',
};

export const tagName = 'blog-post-page';
```

```ts
lessjs({
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

`meta.layout = 'post'` selects `<post-layout>`. `meta.layout = false` renders the
route content directly.
