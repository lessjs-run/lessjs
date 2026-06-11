# v0.37.5 NextVersion

v0.37.5 defines the Protocol-First Runtime Architecture for openElement.

The release converts the previous "protocol type migration" plan into a real
module-boundary plan: openElement keeps Web Components application semantics as
the product center while Vite + Nitro become the default base engine for build,
server runtime, and deployment.

The v0.37.5 implementation must not start while v0.37.4 publish recovery is
still unclosed. Planning work, ADR work, and execution-package completion are
allowed.

## Scope

### A. Product Repositioning

- describe openElement as a Web Components application framework, not only by
  its historical DSD/shadow default;
- keep shadow/DSD as the default render mode;
- keep explicit light DOM opt-in as a first-class render mode;
- define Vite + Nitro as the default build/runtime/deployment engine;
- define protocols as the replacement boundary, not as a loose type bucket.

### B. Protocol Ports

- migrate renderer, component adapter, runtime adapter, route manifest, cache,
  storage, island, signal, and data contracts into `@openelement/protocols`
  incrementally;
- keep backward-compatible re-exports from original implementation packages
  where public imports already exist;
- add conformance test entry points for each accepted protocol surface.

### C. Nitro Proof Plan

- design the minimal openElement universal request handler shape;
- map openElement routes, layouts, `load()`, API routes, islands, static assets,
  and ISR intent to Nitro concepts;
- write the v0.37.6 proof plan for Node and Cloudflare Workers output.

### D. UI Coverage Deferral

- preserve the daisyUI interactive/form coverage plan, but move it behind the
  protocol/runtime pivot;
- keep the v0.37.4 pure CSS foundation as the current UI baseline.

## Related

- SOP: `docs/sop/v0.37.5/README.md`
- ADR: `docs/adr/ADR-0096-protocol-first-vite-nitro-runtime.md`
- Roadmap ADR: `docs/adr/ADR-0091-four-product-platform-roadmap.md`
