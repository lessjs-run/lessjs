# ADR-0082: JSX-first Application API

- Status: ACCEPTED
- Date: 2026-06-05
- Target: v0.31.0

## Context

v0.30.0 and v0.30.1 cleaned the renderer, metadata, trust boundary, package graph,
and active openElement naming. After that cleanup, the default app code still
looked like runtime plumbing:

```tsx
import { DsdElement, type VNode } from '@openelement/runtime';

export default class HomePage extends DsdElement {
  render(): VNode {
    return <main>Hello openElement</main>;
  }
}
```

That is a correct runtime primitive, but it is not a good application-level API.
Mainstream frameworks make the page authoring surface smaller than their runtime
internals:

- Next.js exposes file-route pages, layouts, route handlers, and revalidation.
- SvelteKit exposes page/server `load` and endpoint modules.
- Astro exposes page components, islands, and static/server rendering mode.
- Nuxt exposes pages, server routes, data helpers, and app config.

openElement should follow that separation while keeping Web Components and
Declarative Shadow DOM as the output model.

## Decision

`@openelement/app` becomes the application authoring package.

It exports:

- `definePage()`
- `defineIsland()`
- `defineElement()`
- `defineLayout()`

The Vite configuration facade moves to:

```ts
import { openElement } from '@openelement/app/vite';
```

The recommended page API becomes:

```tsx
import { definePage } from '@openelement/app';

export default definePage(() => {
  return <main>Hello openElement</main>;
});
```

The object form carries route data and metadata:

```tsx
export default definePage({
  title: 'Post',
  description: 'A static post page',
  layout: 'post',
  revalidate: 300,
  async load({ params }) {
    return { slug: params.slug };
  },
  render({ data }) {
    return <article>{data.slug}</article>;
  },
});
```

The adapter-vite generated entry must read `default.openElementPage` and wire it
into SSR and SSG:

- call `load()` before render;
- pass data and request through internal `__openElement*` props;
- keep internal props out of SSR host attributes and `data-ssr-props`;
- read `title`, `description`, `layout`, and `revalidate` from structured page
  descriptors;
- continue to support named `meta` and named `revalidate` during the 0.x line.

## Consequences

Positive:

- Application code is shorter and closer to the mental model used by modern
  file-route frameworks.
- `@openelement/app` no longer mixes runtime authoring and Vite-only imports in
  the same public root.
- Route data and metadata become structured page descriptors instead of ad hoc
  conventions.
- New projects teach the API openElement wants to freeze later.

Negative:

- Existing users importing `openElement()` from `@openelement/app` must switch to
  `@openelement/app/vite`.
- Tooling, docs, and consumer import maps must add the explicit subpath.
- `DsdElement` remains public, so docs must be clear that it is a runtime
  primitive, not the default app tutorial path.

Neutral:

- This ADR does not add a built-in ORM, auth layer, or backend platform.
- This ADR does not change the cleaned renderer model: JSX -> VNode -> RenderNode
  -> DSD HTML or DOM.

## Verification

v0.31.0 is complete only when:

- `@openelement/app` exports authoring helpers only at the root.
- `@openelement/app/vite` exports `openElement()`.
- adapter-vite tests prove `definePage()` descriptors feed SSR and SSG wiring.
- create-template tests prove new projects use `definePage()`, `defineIsland()`,
  and `@openelement/app/vite`.
- www docs and package READMEs teach the new split.
- full local release gates pass before the package version is called released.
