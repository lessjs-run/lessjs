# v0.37.6 Tasks

## A. Handler Boundary

- [x] Define the openElement universal request handler in
      `@openelement/protocols/runtime`.
- [x] Export the generated openElement handler from the current route pipeline.
- [x] Add a Nitro mount boundary that accepts a Nitro-like event and returns Web
      Response data.
- [x] Add mount-boundary proof tasks for Node and Workers presets.

## B. Real Nitro Output

- [x] Add a real Nitro server entry for an openElement proof app.
- [x] Build Node output through Nitro.
- [x] Run a Node runtime smoke against the generated output.
- [x] Build Cloudflare Workers output through Nitro.
- [x] Inspect a Workers-compatible runtime output.

## C. Route and Render Proof

- [x] Verify static asset and island chunk resolution from Nitro output.
- [x] Verify a static route emits zero framework JavaScript.
- [x] Verify an explicit island ships only its required client JavaScript.
- [x] Verify `load()` execution through the Nitro-mounted handler.
- [x] Verify layout composition.
- [x] Verify redirect, not-found, and error behavior.
- [x] Verify API route behavior.

## D. Cache and Ownership Mapping

- [x] Map ISR/cache intent to Nitro cache or route-rule primitives.
- [x] Add tests or documented blockers for unsupported cache behavior.
- [x] Record what remains Hono-owned, Nitro-owned, and openElement-owned.

## E. Release and Distribution

- [ ] Keep package version bumps until local v0.37.6 implementation gates pass.
- [ ] Run local release gates before release closure.
- [ ] Push `dev` and require non-JSR CI to pass.
- [ ] Merge/sync to `main` only after `dev` CI is green.
- [ ] Run or let JSR publish attempts execute as best-effort telemetry only.
