# v0.33.0 Design: AI-Readable API Foundation

## Design Goal

The public Application API should expose intent in structured declarations. A
tool should be able to inspect a page, island, or app config and answer:

- what route shape the page expects;
- what head data or trusted head fragments it contributes;
- what rendering mode is intended;
- whether an island is SSR-capable or client-only;
- which metadata is public, internal, trusted, or dangerous.

The design is conservative: add explicit object fields and aliases while keeping
the v0.31-v0.32 API compatible.

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
    mode: 'ssg',
  },
  async load({ params }) {
    return { slug: params.slug };
  },
  render({ data }) {
    return <article>{data.slug}</article>;
  },
});
```

The exact field shapes may be refined during implementation, but the contract
must stay explicit and type-backed.

## Head Trust Boundary

Head data should use structured fields by default. Raw or pre-trusted head HTML
must use names that make risk visible, for example:

- `trustedHeadHtml`;
- `dangerouslyHeadFragments`;
- a typed `trustedHead()` helper if implementation evidence proves it clearer.

Generic `head` must not silently accept raw HTML unless the field name exposes
the trust boundary.

## Island Metadata Direction

Island metadata should have a named helper such as:

```tsx
export const island = defineIslandConfig({
  tagName: 'open-counter',
  ssr: true,
  hydrate: 'visible',
});
```

The legacy `export const openElement = ...` island metadata remains compatible.
The new helper should feed the same descriptor path so generated entries do not
grow a parallel metadata source.

## App-Level Island SSR

App-level island options should accept an explicit `ssr?: boolean` field. This
keeps "server-rendered island" versus "client-only island" readable in source
and generated metadata.

## Compatibility

Do not remove:

- function-form `definePage(() => ...)`;
- current object-form fields from v0.31-v0.32;
- `export const openElement = ...` metadata;
- existing hydration strategy names.

New fields must normalize into the same internal descriptor model as old fields.
Generated entry tests must prove equivalence where old and new forms express the
same intent.

## Non-Goals

v0.33 does not implement AutoFlow2, runtime deploy behavior, server mutations,
data recipes, UI starter productization, or package-surface reset.
