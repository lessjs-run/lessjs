# v0.37.6 SOP: Vite + Nitro Runtime Proof

> Status: Planned\
> Roadmap: Protocol-First Runtime Architecture\
> Depends on: v0.37.5, ADR-0096, ADR-0098

## Goal

Prove that Vite + Nitro can become openElement's default base engine for build,
production runtime, and deployment without replacing openElement application,
component, route, render, island, or light/shadow semantics.

Execution dossier: `docs/next/v0.37.6/`.

## Entry Criteria

- v0.37.5 protocol boundaries and route manifest contracts are complete.
- v0.37.5 protocol boundaries and conformance skeletons exist.
- ADR-0096 is accepted.
- ADR-0098 is accepted.
- A universal request handler contract exists in `@openelement/protocols`.
- JSR publish state is recorded as best-effort distribution telemetry under
  ADR-0097, not as a version-exit gate.

## ADR Links

- ADR-0096: Protocol-First Vite + Nitro Runtime Architecture.
- ADR-0093: SSR / ISR Runtime Contract.
- ADR-0092: DsdElement Render Mode Contract.
- ADR-0098: EntryDescriptor Route Manifest Contract.
- ADR-0097: JSR Best-Effort Release Gate.

## Step-by-Step Tasks

1. Define the openElement universal request handler.
2. Generate or expose that handler from the current file route pipeline.
3. Mount the handler in a Nitro server entry.
4. Prove Node output.
5. Prove Cloudflare Workers output.
6. Verify static assets and island chunks resolve from Nitro output.
7. Verify a static route emits zero framework JavaScript.
8. Verify an explicit island ships only its required client JavaScript.
9. Verify `load()`, layout, redirect, not-found, and error behavior.
10. Verify API route behavior through the Nitro-mounted handler.
11. Map ISR/cache intent to Nitro cache or route-rule primitives.
12. Record what remains Hono-owned, Nitro-owned, and openElement-owned.
13. Keep JSR publish attempts best-effort and record failures as distribution
    caveats only.

## Verification

- generated proof app build through Vite + Nitro.
- Node runtime smoke.
- Cloudflare Workers runtime smoke.
- static zero-JS output check.
- island JS output check.
- SSR/ISR/cache mapping tests.
- `deno task graph:check`
- `deno task arch:check`
- `deno task test`
- `deno task build`
- best-effort local or CI JSR publish attempt recorded separately from exit
  evidence

## Non-Goals

- No final public package reset.
- No v1 API freeze.
- No built-in database adapter default.
- No auth framework.
- No requirement that users author Nitro routes directly.
- No replacement of Web Components as the default component model.

## Exit Criteria

- Nitro can run an openElement app through at least Node and Cloudflare Workers.
- openElement route/render/island semantics are preserved.
- Static zero-JS and explicit island JS are both proven.
- ISR/cache intent mapping is documented with tests or blockers.
- JSR publish state is recorded, but JSR availability is not an exit criterion.
- v0.38 product reset can proceed from runtime evidence rather than speculation.

## AutoFlow Boundary

AutoFlow may run proof builds and collect evidence. It must not declare general
platform support beyond tested Nitro presets.
