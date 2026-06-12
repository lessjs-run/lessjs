# SOP v0.39.0 - Framework RC + Four-Product Matrix Reset

## Objective

Validate the release-candidate framework surface on top of the v0.38 product
map while applying ADR-0099's four-product matrix reset before v1.0 API freeze
work begins.

v0.39.0 must prove that a generated openElement app can use the documented
first-run surface end to end: app authoring, pages, layouts, islands, API
routes, static/SSR/ISR intent, Vite + Nitro build/runtime output, docs, deploy
guidance, consumer smoke, and release gates. It must also align public docs on
`openElement = Elements + UI + Framework + Protocols`, record the Elements /
`OpenElement` direction, and add a README integrity gate.

## Entry Criteria

- v0.38.0 is tagged, released, and merged to `main`.
- All 20 workspace packages are aligned to `0.38.0`.
- v0.38.0 product, advanced, internal, and archived package classifications are
  recorded.
- ADR-0100 restores JSR publish as a v0.39+ release exit gate.

## Workflow Anchors

- NextVersion package: `docs/next/v0.39.0/`
- ADR-0093: SSR/ISR runtime contract
- ADR-0096: protocol-first Vite + Nitro runtime
- ADR-0097: historical JSR best-effort release gate
- ADR-0099: four-product matrix and Elements reset
- ADR-0100: JSR publish exit gate restored

## Scope

- Use the v0.38 first-run product surface as the default public API.
- Update the public target to the ADR-0099 matrix: Elements, UI, Framework, and
  Protocols.
- Record `@openelement/elements` and `OpenElement` as the future Elements
  direction, with migration notes required before code removal or rename.
- Validate generated starter app behavior from `@openelement/create`.
- Validate deployment/runtime evidence through the documented Vite + Nitro
  path.
- Align website, docs, package READMEs, and migration guidance with the RC
  surface.
- Add public docs integrity checks for README version truth and mojibake.
- Hand off heavy-framework island work to a Preact-first v0.40 proof.
- Keep Hub, RPC, direct SSG, CEM, and compat-check out of first-run product
  docs unless an ADR changes their disposition.

## Non-Goals

- No new package name without ADR approval.
- No ORM, auth, database, or backend platform ownership.
- No hidden compatibility shims for removed or archived 0.x surfaces.
- No package version bump until implementation gates pass.
- No Web Awesome implementation, preset, or current UI strategy.
- No Preact, Vue, React, or Svelte adapter implementation in this line.
- No default signal engine swap in this line; Preact Signals must first pass
  protocol conformance as a v0.40 candidate.
- No long-term public `DsdElement` compatibility alias commitment.

## Required Gates

- `deno task workflow:check`
- `deno task docs:check-public`
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
- live or CI JSR publish success

## Exit Criteria

- v0.39.0 NextVersion package records implementation, docs, risk, test, and
  release evidence.
- Local gates pass after implementation and again after package bump.
- `dev` non-JSR CI passes before merge or sync to `main`.
- `main` non-JSR CI passes before tag/release.
- JSR publish succeeds locally or in CI before release closure.
- v0.40 handoff is documented as Elements productization plus Preact island
  priority, with Hub and broad island compatibility frozen until after v1.0
  unless a later ADR changes the scope.
