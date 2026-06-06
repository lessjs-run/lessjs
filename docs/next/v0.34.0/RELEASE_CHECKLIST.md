# v0.34.0 Release Checklist

## Before Bump

- [ ] SOP tasks completed.
- [ ] NextVersion tasks completed.
- [ ] Local implementation gates pass.
- [ ] `deno task autoflow:report` runs against real repo (JSON + summary).
- [ ] `deno test tools/autoflow/` passes.
- [ ] `deno test` passes (all 1314+).
- [ ] Website and current docs updated.

## Bump and Docs

- [ ] All packages aligned to v0.34.0.
- [ ] Changelog written.
- [ ] Release note written.
- [ ] Consumer smoke passes.
- [ ] Publish dry-run passes.

## Remote Closure

- [ ] Push `dev`.
- [ ] Wait for all `dev` CI jobs.
- [ ] Merge `dev` into `main`.
- [ ] Wait for all `main` CI jobs.
- [ ] Create and push `v0.34.0` tag.
- [ ] Publish GitHub release note.
