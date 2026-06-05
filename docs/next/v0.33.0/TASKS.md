# v0.33.0 Tasks

## Page API

- [ ] Make object-form `definePage({ ... })` the default docs and create
      template path.
- [ ] Add structured page `head` fields and normalize them into the existing
      page descriptor.
- [ ] Add structured `route` fields where they can be type-backed and generated
      without route-source guessing.
- [ ] Add `renderIntent` as the explicit public alias for route render intent.
- [ ] Keep current `title`, `description`, `rendering`, `streaming`,
      `revalidate`, `load`, `render`, and `error` fields compatible.

## Trust Boundary

- [ ] Add an explicitly named raw/trusted head API such as `trustedHeadHtml` or
      `dangerouslyHeadFragments`.
- [ ] Ensure ordinary `head` data is structured and escaped or serialized by the
      framework.
- [ ] Add tests that raw head fragments cannot be mistaken for safe structured
      head data.

## Island API

- [ ] Add `defineIslandMetadata()` or `defineIslandConfig()`.
- [ ] Keep `export const openElement = ...` island metadata compatible.
- [ ] Add `ssr?: boolean` to app-level island options.
- [ ] Normalize old and new island metadata into one descriptor path.

## Generated Entry And Templates

- [ ] Prove old and new page intent forms produce equivalent lifecycle metadata
      where they express the same behavior.
- [ ] Update create templates to use object-form pages and explicit island
      metadata.
- [ ] Update generated entry snapshots for structured head, route, render
      intent, and island SSR metadata.

## Documentation

- [ ] Update README, package docs, guide docs, and website examples.
- [ ] Update status, roadmap, changelog, and release note only after
      implementation proof.
- [ ] Keep v0.34 AutoFlow2 described as planned, not shipped.

## Workflow

- [ ] Keep `workflow:check` passing against `docs/next/v0.33.0/`.
- [ ] Add evidence notes in this package when implementation gates pass.
- [ ] Do not start v0.34 until the v0.33 API surface is implemented and
      documented.
