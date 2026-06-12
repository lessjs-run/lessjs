# v0.38.0 Release Checklist

- [ ] All `TASKS.md` required implementation items are complete or explicitly
      deferred by ADR/SOP update.
- [ ] All `ACCEPTANCE.md` surface, product, consumer, and gate criteria are
      met.
- [ ] Package and subpath inventory is recorded.
- [ ] Product classifications are recorded.
- [ ] ADRs cover new package names or intentional removals.
- [ ] Root README, README.zh, website docs, package READMEs, and create
      templates agree.
- [ ] Generated consumer smoke is recorded.
- [ ] `deno task workflow:check` passes for `docs/next/v0.38.0/`.
- [ ] `deno task graph:check` passes.
- [ ] `deno task arch:check` passes.
- [ ] `deno task docs:check-current` passes.
- [ ] `deno task docs:check-strategy` passes.
- [ ] `deno task fmt:check` passes.
- [ ] `deno task lint` passes.
- [ ] `deno task typecheck` passes.
- [ ] `deno task test` passes.
- [ ] `deno task test:e2e` passes.
- [ ] `deno task build` passes.
- [ ] `deno task dsd:check-report` passes.
- [ ] `deno task publish:dry-run` passes before release closure.
- [ ] Package versions are bumped only after implementation gates pass.
- [ ] `dev` is pushed and non-JSR CI is green.
- [ ] `dev` is merged or synced to `main`.
- [ ] `main` non-JSR CI is green before tag/release.
- [ ] JSR publish runs locally or in CI as best-effort telemetry only.
