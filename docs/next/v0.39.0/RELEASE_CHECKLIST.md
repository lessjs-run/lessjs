# v0.39.0 Release Checklist

- [ ] All `TASKS.md` required implementation items are complete or explicitly
      deferred by ADR/SOP update.
- [ ] All `ACCEPTANCE.md` product, runtime, docs, consumer, and gate criteria
      are met.
- [x] Generated app smoke evidence is recorded.
- [x] Deployment/runtime evidence is recorded.
- [ ] Root README, README.zh, website docs, package READMEs, and generated
      templates agree.
- [ ] Migration notes are recorded for intentional 0.x behavior changes.
- [ ] `deno task workflow:check` passes for `docs/next/v0.39.0/`.
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
