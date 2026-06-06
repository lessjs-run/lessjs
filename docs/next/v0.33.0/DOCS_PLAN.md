# v0.33.0 Docs Plan

## Current Docs

- Update `docs/status/STATUS.md` only when v0.33 implementation evidence exists.
- Update `docs/roadmap/ROADMAP.md` to keep v0.34 AutoFlow2 sidecar planned.
- Update `docs/arch/current-architecture.md` with AI-readable page and island
  metadata once implemented.
- Update `docs/sop/v0.33.0/README.md` from planned tasks to implementation
  evidence after gates pass.

## Website

- Update getting-started examples to use only object-form `definePage({ ... })`.
- Add structured head, route, and render intent examples only after the fields
  exist in code.
- Add island metadata helper examples only after the helper exists in code.
- Remove old `definePage(() => ...)` and `export const openElement = { ... }`
  examples from current website surfaces.
- Keep AutoFlow2 described as upcoming infrastructure, not shipped product.

## Template Docs

- Update create-template examples to object-form pages.
- Ensure generated island examples use the explicit metadata helper when
  implemented.
- Mark v0.33 migration as a breaking rewrite to canonical descriptors.

## Release Docs

After implementation gates pass:

- add `docs/changelog/v0.33.0.md`;
- add `docs/release/v0.33.0.md`;
- update `docs/changelog/README.md`;
- update package version state to v0.33.0.
