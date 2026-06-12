# v0.37.6 Release Checklist

- [x] All `TASKS.md` required implementation items are complete or explicitly
      deferred by ADR/SOP update.
- [x] All `ACCEPTANCE.md` runtime, route, render, ownership, and gate criteria
      are met.
- [x] Real Nitro Node output proof is recorded.
- [x] Real Nitro Cloudflare Workers output proof is recorded or a concrete
      blocker is accepted.
- [x] Static asset, island chunk, zero-JS, explicit island JS, lifecycle, and
      API route checks are recorded.
- [x] ISR/cache mapping is tested or documented with blockers.
- [x] `deno task workflow:check` passes for `docs/next/v0.37.6/`.
- [x] `deno task graph:check` passes.
- [x] `deno task arch:check` passes.
- [x] `deno task docs:check-current` passes.
- [x] `deno task docs:check-strategy` passes.
- [x] `deno task fmt:check` passes.
- [x] `deno task lint` passes.
- [x] `deno task typecheck` passes.
- [x] `deno task test` passes.
- [x] `deno task test:e2e` passes.
- [x] `deno task build` passes.
- [x] `deno task publish:dry-run` passes before release closure.
- [x] Package versions are bumped only after implementation gates pass.
- [x] `dev` is pushed and non-JSR CI is green.
- [x] `dev` is merged or synced to `main`.
- [x] `main` non-JSR CI is green before tag/release.
- [x] JSR publish runs locally or in CI as best-effort telemetry only.
