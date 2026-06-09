# v0.37.1 SOP: DsdElement Shadow and Light Contract

> Status: Implemented\
> Roadmap: Four-Product Validation Train\
> Depends on: v0.37.0\
> NextVersion: `docs/next/v0.37.1/`\
> ADR: ADR-0091, plus a dedicated DsdElement rendering-mode ADR if API changes
> are required.

## Goal

Turn DsdElement into a clear elements product surface while keeping DSD/shadow
DOM as the default and adding an explicit light DOM opt-in contract.

## Entry Criteria

- v0.37.0 doctrine reset is complete.
- The difference between `shadow-dsd`, `light-ssr`, and `client-only` is
  documented.
- Existing `dsd: false`, `hydrate: "only"`, and `pure-island` behavior has been
  audited before reuse.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0092: DsdElement Render Mode Contract.
- ADR-0039: DsdElement + Signals Reactive Architecture.
- ADR-0077: Structured Render IR and Single Renderer Pipeline.

## Step-by-Step Tasks

1. Audit current DsdElement server and client behavior for shadow root creation,
   DSD hydration, event hydration, signal hydration, styles, and update hooks.
2. Audit current render IR support for host light children and current
   `lightDom` inputs.
3. Decide the public light DOM opt-in API through ADR before implementation.
4. Add tests proving default DSD output still emits `<template
   shadowrootmode="open">`.
5. Add tests proving explicit light DOM output omits the shadow template and
   serializes content in the host.
6. Add client-side tests proving light DOM mode does not force
   `attachShadow()`.
7. Document event, signal, style, and slot behavior for both shadow and light
   modes.
8. Update Lit-to-DsdElement migration docs with the shadow/light distinction.

## Verification

- DsdElement unit tests.
- renderDsd/render IR tests.
- docs strategy and current docs checks.
- full local gate ladder before release.

## Non-Goals

- Do not make light DOM the default.
- Do not equate `dsd: false` with light DOM without explicit migration.
- Do not introduce Lit as a dependency.
- Do not add a new elements package unless a separate ADR approves it.

## Exit Criteria

- DsdElement has one documented default mode and one documented light opt-in
  mode.
- Shadow/DSD behavior remains backward-compatible by default.
- Light mode is proven by SSR and client upgrade tests.

## AutoFlow Boundary

AutoFlow may run and report tests for both rendering modes. It must not choose
the public API name for the light DOM opt-in.
