# v0.37.1 Acceptance

- Default DsdElement SSR still emits `<template shadowrootmode="open">`.
- Default DsdElement CSR still creates an open shadow root.
- `static renderMode = 'light'` SSR omits `<template shadowrootmode>`.
- `static renderMode = 'light'` CSR leaves `shadowRoot` null and renders into
  host light DOM.
- `renderMode` is documented as separate from island `dsd: false`,
  `hydrate: "only"`, and `pure-island`.
- ADR-0092 is accepted and linked from the ADR index.
