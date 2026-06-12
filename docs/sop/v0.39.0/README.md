# SOP v0.39.0 - Full-Stack Framework RC

## Objective

Validate the release-candidate framework surface on top of the v0.38 product
map before v1.0 API freeze work begins.

v0.39.0 must prove that a generated openElement app can use the documented
first-run surface end to end: app authoring, pages, layouts, islands, API
routes, static/SSR/ISR intent, Vite + Nitro build/runtime output, docs, deploy
guidance, consumer smoke, and release gates.

## Entry Criteria

- v0.38.0 is tagged, released, and merged to `main`.
- All 20 workspace packages are aligned to `0.38.0`.
- v0.38.0 product, advanced, internal, and archived package classifications are
  recorded.
- JSR publish/visibility state is telemetry only under ADR-0097.

## Workflow Anchors

- NextVersion package: `docs/next/v0.39.0/`
- ADR-0093: SSR/ISR runtime contract
- ADR-0096: protocol-first Vite + Nitro runtime
- ADR-0097: JSR best-effort release gate

## Scope

- Use the v0.38 first-run product surface as the default public API.
- Validate generated starter app behavior from `@openelement/create`.
- Validate deployment/runtime evidence through the documented Vite + Nitro
  path.
- Align website, docs, package READMEs, and migration guidance with the RC
  surface.
- Keep Hub, RPC, direct SSG, CEM, and compat-check out of first-run product
  docs unless an ADR changes their disposition.

## Non-Goals

- No new package name without ADR approval.
- No ORM, auth, database, or backend platform ownership.
- No hidden compatibility shims for removed or archived 0.x surfaces.
- No package version bump until implementation gates pass.

## Required Gates

- `deno task workflow:check`
- `deno task graph:check`
- `deno task arch:check`
- `deno task docs:check-current`
- `deno task docs:check-strategy`
- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`
- `deno task test:e2e`
- `deno task build`
- `deno task dsd:check-report`
- generated consumer smoke
- publish dry-run

## Exit Criteria

- v0.39.0 NextVersion package records implementation, docs, risk, test, and
  release evidence.
- Local gates pass after implementation and again after package bump.
- `dev` non-JSR CI passes before merge or sync to `main`.
- `main` non-JSR CI passes before tag/release.
- JSR publish is attempted locally or in CI as best-effort telemetry.
