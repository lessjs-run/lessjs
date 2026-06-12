# v0.39.0 Release Checklist

- [ ] All `TASKS.md` required implementation items are complete or explicitly
      deferred by ADR/SOP update.
- [ ] All `ACCEPTANCE.md` product, runtime, docs, consumer, and gate criteria
      are met.
- [x] Generated app smoke evidence is recorded.
- [x] Deployment/runtime evidence is recorded.
- [x] ADR-0099 exists and is listed in the ADR index.
- [x] Root README, README.zh, website docs, package READMEs, and generated
      templates agree.
- [x] README.md and README.zh report package line `0.39.0` and active line
      `v0.39.0`.
- [x] README.zh has no mojibake/replacement text.
- [x] Public docs present `openElement = Elements + UI + Framework +
      Protocols`.
- [x] Migration notes are recorded for intentional 0.x behavior changes.
- [x] `deno task workflow:check` passes for `docs/next/v0.39.0/`.
- [x] `deno task docs:check-public` passes.
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
- [ ] Package versions are bumped only after implementation gates pass.
- [ ] `dev` is pushed and non-JSR CI is green.
- [ ] `dev` is merged or synced to `main`.
- [ ] `main` non-JSR CI is green before tag/release.
- [ ] JSR publish runs locally or in CI as best-effort telemetry only.
