# v0.37.1 NextVersion

v0.37.1 implements the DsdElement shadow/light contract from ADR-0092.

Scope:

- keep DsdElement shadow/DSD as the default rendering mode;
- add explicit `static renderMode = 'light'` opt-in;
- make SSR light mode serialize rendered content into host light DOM;
- make CSR light mode render into the host without calling `attachShadow()`;
- document that island `dsd: false`, `hydrate: "only"`, and `pure-island`
  remain client-only or island semantics, not DsdElement light DOM.

## Related

- SOP: `docs/sop/v0.37.1/README.md`
- ADR: `docs/adr/ADR-0092-dsdelement-render-mode.md`
- Roadmap ADR: `docs/adr/ADR-0091-four-product-platform-roadmap.md`
