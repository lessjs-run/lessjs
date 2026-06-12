# v0.38.0 Release Checklist

- [x] All `TASKS.md` required implementation items are complete or explicitly
      deferred by ADR/SOP update.
- [x] All `ACCEPTANCE.md` surface, product, consumer, and gate criteria are
      met.
- [x] Package and subpath inventory is recorded.
- [x] Product classifications are recorded.
- [x] ADRs cover new package names or intentional removals.
- [x] Root README, README.zh, website docs, package READMEs, and create
      templates agree.
- [x] Generated consumer smoke is recorded.
- [x] `deno task workflow:check` passes for `docs/next/v0.38.0/`.
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
- [x] `deno task dsd:check-report` passes.
- [x] `deno task publish:dry-run` passes before release closure.
- [x] Package versions are bumped only after implementation gates pass.
- [x] `dev` is pushed and non-JSR CI is green.
- [x] `dev` is merged or synced to `main`.
- [x] `main` non-JSR CI is green before tag/release.
- [x] JSR publish runs locally or in CI as best-effort telemetry only.
