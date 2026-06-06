# v0.33.0 Tasks

## Page API

- [x] Make object-form `definePage({ ... })` the only page authoring path.
- [x] Remove function-form `definePage(() => ...)`.
- [x] Add structured page `head` fields and normalize them into the existing
      page descriptor.
- [x] Add structured `route` fields as intent metadata; file routing remains
      scanner-owned.
- [x] Add `renderIntent` as the only public route render intent field.
- [x] Remove top-level `title`, `description`, `meta`, `rendering`,
      `streaming`, and `revalidate`.

## Trust Boundary

- [x] Add `head.dangerouslyHeadFragments` as the explicit raw head API.
- [x] Ensure ordinary `head` data is structured and escaped or serialized by the
      framework.
- [x] Add tests that raw head fragments cannot be mistaken for safe structured
      head data.

## Island API

- [x] Add `defineIslandConfig()`.
- [x] Reject object-literal `export const openElement = { ... }` island metadata.
- [x] Add `ssr?: boolean` to app-level island options.
- [x] Keep `defineIsland(..., { hydrate, dsd, ssr })` aligned with runtime metadata.

## Generated Entry And Templates

- [x] Prove the new page descriptor feeds lifecycle metadata.
- [x] Update create templates to use object-form pages and explicit island
      metadata.
- [x] Update generated entry snapshots for structured head, route, render
      intent, and island SSR metadata.

## Documentation

- [x] Update README, package docs, guide docs, and website examples.
- [x] Remove old function-form page and object-literal island metadata examples
      from current docs and website surfaces.
- [x] Update status, roadmap, changelog, and release note after
      implementation proof.
- [x] Keep v0.34 AutoFlow2 described as planned, not shipped.

## Workflow

- [x] Keep `workflow:check` passing against `docs/next/v0.33.0/`.
- [x] Add evidence notes in this package when implementation gates pass.
- [x] Do not start v0.34 until the v0.33 API surface is implemented and
      documented.
