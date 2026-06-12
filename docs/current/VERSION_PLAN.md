# v0.40.0 Version Plan - Product-Line Reset + AutoFlow3 Boundary

## Objective

Make `dev` the focused product-line branch for the v1 path while keeping the
old v0.39 architecture evidence frozen on `arch/v0.39-line`.

Current package and release-gate truth remains `v0.39.0`; this plan is the
active execution bridge toward the `v0.40.0` product-line reset.

The product target remains:

```text
openElement = Elements + UI + Framework + Protocols
```

## Scope

- Treat Elements, UI, Framework, and Protocols as the only first-class product
  lines.
- Keep supporting packages visible as advanced or implementation surfaces, not
  first-run products.
- Record Preact as the v0.40 heavy-framework island priority.
- Treat `@preact/signals-core` only as a `SignalEngine` candidate pending
  protocol conformance, bundle, SSR/CSR, and consumer-smoke evidence.
- Collapse active planning into this version plan instead of adding another
  SOP plus NextVersion dossier.
- Introduce AutoFlow3 as the single gate and evidence control plane.

## Non-Goals

- No physical package deletion in the first reset.
- No Hub revival.
- No Vue, React, Svelte, or generic heavy-island expansion.
- No Web Awesome implementation or default UI strategy change.
- No default signal-engine swap.
- No AutoFlow authority over minor, major, or v1 scope decisions.

## Tasks

- [x] Freeze the v0.39 architecture line at `arch/v0.39-line`.
- [x] Add ADR-0101 for product-line reset and AutoFlow3 governance boundaries.
- [x] Replace stale Vue adapter planning with Preact island priority.
- [x] Add AutoFlow3 policy registry for gate tiers and version authority.
- [x] Add AutoFlow3 command entry points for dev, push, CI, patch release,
      minor planning, and approved release execution.
- [x] Point hooks and gate CI at AutoFlow3.
- [ ] Move historical SOP and NextVersion files into archive in a dedicated
      cleanup after current gates are stable.
- [ ] Implement `@openelement/elements` and `OpenElement`.
- [ ] Implement the Preact island proof.

## Acceptance

- Public docs agree that Preact, not Vue, is the v0.40 heavy-island priority.
- Current workflow checks require this version plan as the active planning
  document.
- AutoFlow3 policy tests prove patch automation is allowed only for bounded
  mechanical changes.
- Minor and major release commands fail without approved ADR and version-plan
  evidence.
- CI has one gate workflow entry point: AutoFlow3.

## Test Matrix

```bash
deno task workflow:check
deno task docs:check-public
deno task docs:check-current
deno task docs:check-strategy
deno task autoflow:test
deno task autoflow:dev --dry-run
deno task autoflow:push --dry-run
deno task autoflow:ci --dry-run
deno task autoflow:patch-release --dry-run
```

Release work still requires the full repository gate list and JSR publish
evidence before closure.
