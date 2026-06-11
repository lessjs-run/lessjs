# v0.37.4 Release Checklist

- [ ] All TASKS.md items checked.
- [ ] All ACCEPTANCE.md criteria met.
- [ ] `deno task fmt:check` passes.
- [ ] `deno task lint` passes.
- [ ] `deno task typecheck` passes.
- [ ] `deno task test` passes (including new ssg/router/protocols tests).
- [ ] `deno task build` passes.
- [ ] `deno task graph:check` passes (ui no longer depends on router).
- [ ] `deno task arch:check` passes.
- [ ] `deno task dsd:check-report` passes.
- [ ] `deno task publish:dry-run` passes (20 packages).
- [ ] `deno task hub:validate -- --strict` passes.
- [ ] `deno task verify:configs` passes.
- [ ] E2E gateway passes (`deno task test:e2e`).
- [ ] Changelog updated.
- [ ] Release note written.
- [ ] JSR publish recovery reaches 20/20 packages at `0.37.4`.
- [ ] Post-publish consumer smoke passes against the freshly published
      `0.37.4` package line.
