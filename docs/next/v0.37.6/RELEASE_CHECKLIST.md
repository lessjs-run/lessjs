# v0.37.6 Release Checklist

- [ ] All `TASKS.md` required implementation items are complete or explicitly
      deferred by ADR/SOP update.
- [ ] All `ACCEPTANCE.md` runtime, route, render, ownership, and gate criteria
      are met.
- [ ] Real Nitro Node output proof is recorded.
- [ ] Real Nitro Cloudflare Workers output proof is recorded or a concrete
      blocker is accepted.
- [ ] Static asset, island chunk, zero-JS, explicit island JS, lifecycle, and
      API route checks are recorded.
- [ ] ISR/cache mapping is tested or documented with blockers.
- [ ] `deno task workflow:check` passes for `docs/next/v0.37.6/`.
- [ ] `deno task graph:check` passes.
- [ ] `deno task arch:check` passes.
- [ ] `deno task docs:check-current` passes.
- [ ] `deno task docs:check-strategy` passes.
- [ ] `deno task fmt:check` passes.
- [ ] `deno task lint` passes.
- [ ] `deno task typecheck` passes.
- [ ] `deno task test` passes.
- [ ] `deno task build` passes.
- [ ] `deno task publish:dry-run` passes before release closure.
- [ ] Package versions are bumped only after implementation gates pass.
- [ ] `dev` is pushed and non-JSR CI is green.
- [ ] `dev` is merged or synced to `main`.
- [ ] `main` non-JSR CI is green before tag/release.
- [ ] JSR publish runs locally or in CI as best-effort telemetry only.
