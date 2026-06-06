# v0.33.0 Design: Strict AI-Readable API Reset

## Design Goal

The public Application API should expose intent in structured declarations and
should have one authoring path. v0.33.0 is intentionally breaking: a tool should
be able to inspect a page, island, or app config and answer:

- what route shape the page expects;
- what head data or trusted head fragments it contributes;
- what rendering mode is intended;
- whether an island is SSR-capable or client-only;
- which metadata is public, internal, trusted, or dangerous.

The design is strict: remove v0.31-v0.32 shortcuts and keep only the canonical
object descriptor.

## Page Descriptor Direction

The docs and create template should prefer object-form pages:

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: {
    path: '/posts/:slug',
  },
  head: {
    title: 'Post',
    description: 'A post page',
  },
  renderIntent: {
    mode: 'static',
    streaming: 'auto',
    revalidate: false,
  },
  async load({ params }) {
    return { slug: params.slug };
  },
  render({ data }) {
    return <article>{data.slug}</article>;
  },
});
```

The `route` field is AI-readable intent metadata only. File-system route
scanning remains the source of real URL matching.

## Head Trust Boundary

Head data must use structured fields by default:

- `head.title`;
- `head.description`;
- `head.meta`;
- `head.dangerouslyHeadFragments`.

Raw route-local head fragments only enter through
`head.dangerouslyHeadFragments` so the trust boundary is explicit at the call
site.

## Island Metadata Direction

Island metadata uses one named helper:

```tsx
export const openElement = defineIslandConfig({
  ssr: true,
  dsd: true,
  hydrate: 'visible',
});
```

The export name remains `openElement`, but the value must be returned by
`defineIslandConfig(...)`. The old object-literal metadata path is rejected by
the adapter scanner.

## App-Level Island SSR

App-level island options should accept an explicit `ssr?: boolean` field. This
keeps "server-rendered island" versus "client-only island" readable in source
and generated metadata.

## Breaking Changes

Remove:

- function-form `definePage(() => ...)`;
- top-level page `title`, `description`, `meta`, `rendering`, `streaming`, and
  `revalidate`;
- non-canonical page descriptor fields such as `layout` and `styles`;
- object-literal island metadata such as `export const openElement = { ... }`.

Do not remove `load`, `render`, `error`, hydration strategy names, or
file-system route scanning. Layout composition remains an app shell / renderer
configuration concern, not a page descriptor field.

## Non-Goals

v0.33 does not implement AutoFlow2, runtime deploy behavior, server mutations,
data recipes, UI starter productization, or package-surface reset.
