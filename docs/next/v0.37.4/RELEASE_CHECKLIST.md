# v0.37.4 Release Checklist

- [x] All TASKS.md items checked.
- [x] All ACCEPTANCE.md criteria met.
- [x] `deno task fmt:check` passes.
- [x] `deno task lint` passes.
- [x] `deno task typecheck` passes.
- [x] `deno task test` passes, including new ssg/router/protocols tests.
- [x] `deno task build` passes.
- [x] `deno task graph:check` passes, with ui no longer depending on router.
- [x] `deno task arch:check` passes.
- [x] `deno task dsd:check-report` passes.
- [x] `deno task publish:dry-run` passes for 20 packages.
- [x] `deno task hub:validate -- --strict` passes.
- [x] `deno task verify:configs` passes.
- [x] E2E gateway passes through `deno task test:e2e`.
- [x] Changelog updated.
- [x] Release note written.
- [x] JSR publish attempted through local or CI publish path.
- [x] JSR registry state recorded as a release-note caveat while resolver
      visibility is incomplete.
- [x] Release exit does not depend on live JSR 20/20 visibility or post-publish
      JSR consumer smoke under ADR-0097.
