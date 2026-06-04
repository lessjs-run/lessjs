---
title: 'Getting Started'
section: 'Guide'
label: 'Getting Started'
order: 1
---

# Getting Started

openElement is a JSX-first Web Components framework. Pages are written as JSX,
the framework renders them to Declarative Shadow DOM, and interactive parts are
upgraded as islands.

## Create a Project

```bash
deno run -A jsr:@openelement/create my-app
cd my-app
deno task dev
```

## Write a Page

```tsx
import { definePage } from '@openelement/app';

export default definePage(() => {
  return <main>Hello openElement</main>;
});
```

`definePage()` is the application-level API. The lower-level `DsdElement` class
still exists for library authors, but app routes should normally start here.

## Add an Island

```tsx
import { defineIsland } from '@openelement/app';
import { signal } from '@openelement/runtime';

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => <button onClick={() => count.value++}>Count: {count.value}</button>,
);
```

## Configure Vite

```ts
import { defineConfig } from 'vite';
import { openElement } from '@openelement/app/vite';

export default defineConfig({
  plugins: [openElement()],
});
```

The root `@openelement/app` package is for authoring. Build configuration lives
under `@openelement/app/vite`.
