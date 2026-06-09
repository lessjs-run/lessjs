# ADR-0092: DsdElement Render Mode Contract

- Status: Accepted
- Date: 2026-06-09
- Target: v0.37.1
- Depends on: ADR-0091

## Context

ADR-0091 keeps DsdElement shadow/DSD-first while allowing a future explicit
light DOM opt-in. The current implementation already has two related but
different concepts:

- `renderDsd()` accepts `lightDom` children so host light children can be
  preserved for slot projection.
- island metadata such as `dsd: false`, `hydrate: "only"`, and historical
  `pure-island` language describes client-only or island behavior, not a
  DsdElement light DOM mode.

Those concepts must not be presented as a DsdElement light DOM API. v0.37.1
needs a small, explicit contract that keeps the default unchanged.

## Decision

Add a static DsdElement rendering mode:

```ts
class MyElement extends DsdElement {
  static renderMode = 'light';
}
```

Supported values:

- `shadow`: default. SSR emits Declarative Shadow DOM with
  `<template shadowrootmode="open">`; CSR creates or reuses a shadow root.
- `light`: explicit opt-in. SSR serializes rendered content into the host light
  DOM and does not emit a shadow template; CSR renders into the element itself
  and does not call `attachShadow()`.

The option is intentionally named `renderMode`, not `dsd`, so it cannot be
confused with island `dsd: false`.

## Consequences

Positive:

- The default DSD/shadow behavior remains backward-compatible.
- Light DOM is explicit and testable in both SSR and CSR.
- CSS-first UI and document-layout use cases get a standards-friendly path
  without pretending islands are light DOM.

Negative:

- Light mode does not get `adoptedStyleSheets`; styles must come from global
  CSS, inline render output, or a later explicit style contract.
- Components that rely on shadow-only APIs must stay in the default mode.

## Non-Goals

- Do not make light DOM the default.
- Do not rename island `dsd`, `hydrate`, or SSR admission metadata.
- Do not add a new elements package in this ADR.
- Do not claim that `dsd: false`, `hydrate: "only"`, or `pure-island` is the
  same as DsdElement light DOM.
