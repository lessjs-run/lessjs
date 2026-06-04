# SOP-003: v0.28.2 Deprecated Purge + Hardening

> Version: v0.28.2
> Date: 2026-06-02
> Status: Implemented in the v0.28.3 release train
> Input: v0.28.0 repository audit findings plus the v0.28.1 hygiene baseline
> Output: deprecated adapter purge, render contract cleanup, HTML/head security hardening,
> Hub permission and CDN cleanup, SSR bundle-policy reduction, changelog, and release note

## Summary

v0.28.2 was converted from a planning SOP into an implementation pass. The work
removes deprecated compatibility paths and closes the P0/P1 hardening items that
were too risky to leave for the v1.0 freeze.

The package bump is intentionally shipped with v0.28.3. v0.28.2 and v0.28.3
land as one coherent patch line so the workspace does not publish an
intermediate state with lockfile and MDX work still open.

## Implemented Changes

### Adapter Registry Purge

- Removed module-level `registerAdapter`, `getAdapter`, and
  `getRegisteredAdapters` exports from `@openelement/core`.
- Added `getDefaultRegistry()` for the shared registry path.
- Updated Lit, React, Vanilla, Vite SSR generation, and tests to register
  adapters through `getDefaultRegistry().register(...)`.
- Kept `createAdapterRegistry()` as the isolated registry API.

### DSD Render Contract

- Added `RenderDsdOptions`.
- Converted internal render paths to object-form `renderDsd(vnode, options)`.
- Preserved legacy positional handling during the pre-1.0 window so existing
  callers are not broken beyond the explicit adapter-helper removal.
- Updated stream rendering, JSX rendering, generated SSR entry code, and tests.

### Event And HTML Safety

- Expanded DOM event aliases for double-click, focus, mouse, and pointer
  events.
- Preserved multi-handler binding on the same VNode during hydration.
- Made `innerHTML` safe by default in string and DOM renderers.
- Added explicit `rawHtml: true` opt-in for trusted HTML and still route that
  content through sanitizer policy.
- Sanitized `data-signal-html` DOM updates before assignment.

### Head Injection And URL Hardening

- Sanitized `headExtras` and `inject.headFragments` with `sanitize-html`.
- Rejected structured injected attributes whose names start with `on`.
- Kept style support in head fragments with an explicit sanitizer policy.
- Added safe URL-scheme validation for `less-layout` header, sidebar, GitHub,
  edit, and localized links.

### Hub And Build Cleanup

- Moved Hub snapshot CDN resolution behind `LESS_CDN_BASE`, defaulting npm
  package URLs to jsDelivr while preserving explicit self-hosted and esm.sh
  options.
- Changed `hub:scan` from all-permission execution to the least-privilege
  read/write/net/env/run set used by the scanner.
- Reduced default SSR `noExternal` to LessJS workspace packages plus
  `alien-signals`; Lit and React now stay external unless explicitly opted in.
- Replaced generated TypeScript regex scanning for client-only tags with a
  dynamic file-URL import of the generated module.
- Preserved user resolve aliases when `LessBuildContext.reset()` resets phase
  metadata.

### Rewrite Notes

- v0.27/v0.26 implementation-anchor comments were removed from touched runtime,
  build, and README files.
- Production source and CLI `console.log` callsites were rewritten to
  `console.info` or left only in tests, docs, examples, and generated fixtures.
- The v0.28.2 changelog and release note were added under `docs/changelog/` and
  `docs/release/`.

## Verification

The affected local tests were run before the full release gate:

- core DSD, event hydration, DOM renderer, and string renderer tests
- adapter-vite head injection tests
- UI URL-safety tests
- router tests

The final release gate passed and is recorded in `docs/release/v0.28.3.md`
because v0.28.3 ships the final package bump and lockfile for both SOP-003 and
SOP-004.

## Exit Criteria

- Deprecated adapter compatibility exports are removed.
- The internal DSD render pipeline uses structured options.
- HTML, signal HTML, head fragments, and layout links have sanitizer or scheme
  guards.
- Hub scanner permissions are least privilege.
- SSR default bundling no longer pulls Lit and React into the vanilla path.
- Release documentation exists for v0.28.2.
- v0.28.3 completed the package bump and full local gate.
