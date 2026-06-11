# v0.37.5 SOP: Protocol-First Runtime Architecture

> Status: Planned after v0.37.4 repository-controlled gates are accepted\
> Roadmap: Vite + Nitro powered Web Components application framework\
> Depends on: v0.37.4 local/non-JSR release evidence, ADR-0096, ADR-0097

## Goal

Turn `@openelement/protocols` into the real replacement boundary for the
framework while adopting Vite + Nitro as the default base engine for build,
server runtime, and deployment.

This release does not implement the Nitro runtime proof. It prepares the
protocols, docs, and conformance tests required for v0.37.6 to prove the
runtime integration.

## Entry Criteria

- v0.37.4 implementation is complete.
- v0.37.4 repository-controlled gates, AutoFlow evidence, changelog/release
  notes, dev/main non-JSR CI, and package graph evidence are accepted.
- v0.37.4 JSR publish has been attempted or scheduled through CI, with any
  registry failure recorded as an external distribution caveat.
- ADR-0096 is accepted.
- ADR-0097 is accepted.
- `docs/next/v0.37.5/` contains the full required NextVersion package.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0092: DsdElement Render Mode Contract.
- ADR-0093: SSR / ISR Runtime Contract.
- ADR-0095: Data / Database Boundary.
- ADR-0096: Protocol-First Vite + Nitro Runtime Architecture.
- ADR-0097: JSR Best-Effort Release Gate.
- ADR-0098: EntryDescriptor Route Manifest Contract.

## Step-by-Step Tasks

### A. Governance and Product Language

1. [ ] Update status, roadmap, SOP, and docs language to describe openElement as
       a Web Components application framework powered by Vite + Nitro.
2. [ ] Keep shadow/DSD as the default render mode and light DOM as explicit
       opt-in.
3. [ ] Keep v0.37.4 JSR state recorded as best-effort distribution telemetry,
       not as a v0.37.5 entry blocker.

### B. Protocol Inventory and Migration

1. [ ] Inventory renderer, component, route, island, runtime, cache, storage,
       signal, and data contracts currently spread across implementation
       packages.
2. [ ] Move runtime-free contracts into `@openelement/protocols`.
3. [ ] Add backward-compatible re-exports where imports are already public.
4. [ ] Keep Vite, Nitro, Hono, Node, Deno, and DOM implementations out of
       `@openelement/protocols`.

### C. Conformance Suites

1. [ ] Add `runRendererConformance(impl)`.
2. [ ] Add component adapter conformance skeleton.
3. [ ] Add runtime adapter conformance skeleton for fetch-compatible handlers.
4. [ ] Add cache adapter conformance checks.
5. [ ] Run baseline conformance against current openElement implementations.

### D. Nitro Runtime Proof Plan

1. [ ] Define the universal request handler shape.
2. [ ] Map openElement route/load/layout/error/API behavior to Nitro handler
       execution.
3. [ ] Map static assets and island chunks to Nitro output.
4. [ ] Map ISR/cache intent to Nitro route rules/cache primitives without
       replacing openElement semantics.
5. [ ] Create the v0.37.6 proof plan for Node and Cloudflare Workers.

### E. UI Coverage Deferral

1. [ ] Preserve the daisyUI interactive/form component list as a later UI
       product slice.
2. [ ] Do not expand UI implementation during this protocol/runtime release.

## Verification

- `deno task graph:check`
- `deno task arch:check`
- `deno task docs:check-current`
- `deno task docs:check-strategy`
- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`
- `deno task build`
- `deno task publish:dry-run`

`deno task workflow:check` continues to check v0.37.4 until
`tools/project-constants.ts` moves to v0.37.5 after the v0.37.4
repository-controlled exit evidence is accepted.

## Non-Goals

- No Nitro production proof in v0.37.5.
- No new top-level package.
- No package split or merge.
- No React/Vue/Svelte default renderer.
- No replacement of Web Components as the default component model.
- No claim that Vite is short-term replaceable.
- No Tailwind runtime.
- No built-in ORM, auth, or database platform.

## Exit Criteria

- ADR-0096 is reflected in status, roadmap, SOP, and NextVersion docs.
- `@openelement/protocols` owns the first accepted protocol groups.
- Backward-compatible imports still work.
- Conformance suites exist and pass against baseline implementations.
- v0.37.6 has a concrete Vite + Nitro proof plan.
- v0.37.5 can proceed after v0.37.4 repository-controlled release evidence is
  accepted; JSR visibility does not block it under ADR-0097.

## AutoFlow Boundary

AutoFlow may check protocol conformance suite results, package graph health,
and release evidence. It must not choose runtime defaults, approve public API
resets, or declare deployment support before v0.37.6 proof exists.
