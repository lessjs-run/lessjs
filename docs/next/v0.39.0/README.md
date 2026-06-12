# v0.39.0 NextVersion

v0.39.0 is the Full-Stack Framework RC line.

It starts from the v0.38.0 product surface reset and proves that the documented
framework surface works as a generated, deployable, consumer-verified app
without silently expanding package scope before v1.0.

## Scope

### Generated App Proof

- [ ] Generate or refresh the starter app path using the v0.38 first-run
      surface.
- [ ] Prove pages, layouts, islands, API routes, static output, SSR/ISR intent,
      assets, and zero-JS defaults through a repeatable smoke.
- [ ] Verify starter import maps and tasks do not expose archived/internal
      surfaces as first-run APIs.

### Deployment Proof

- [ ] Validate the documented Vite + Nitro runtime/deploy path.
- [ ] Record platform boundaries for request/response, assets, cache intent,
      API routes, and island chunks.
- [ ] Keep provider-specific behavior in recipes or adapter boundaries.

### Docs And Consumer Surface

- [ ] Align root docs, website guide/API/deployment pages, package READMEs, and
      generated templates with the RC surface.
- [ ] Record migration notes for any intentional 0.x breaking behavior.
- [ ] Prove consumer smoke against the RC surface before package bump.

## Current Evidence

- v0.38.0 is tagged and released.
- All 20 workspace packages are aligned to `0.38.0`.
- The v0.38 product map defines product, advanced, internal, and archived
  surfaces.
- JSR publish is telemetry only under ADR-0097.

## Related

- SOP: `docs/sop/v0.39.0/README.md`
- Prior line: `docs/next/v0.38.0/`
- Product map: `docs/next/v0.38.0/PRODUCT_MAP.md`
- Roadmap: `docs/roadmap/ROADMAP.md`
- Status: `docs/status/STATUS.md`
