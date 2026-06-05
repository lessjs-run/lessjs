# v0.33.0 Release Checklist

## Before Bump

- [ ] SOP tasks completed.
- [ ] NextVersion tasks completed.
- [ ] Local implementation gates pass.
- [ ] Website and current docs updated.
- [ ] Compatibility evidence for old page and island APIs recorded.

## Bump and Docs

- [ ] All packages aligned to v0.33.0.
- [ ] Changelog written.
- [ ] Release note written.
- [ ] Consumer smoke passes.
- [ ] Publish dry-run passes.

## Remote Closure

- [ ] Push `dev`.
- [ ] Wait for all `dev` CI jobs.
- [ ] Merge `dev` into `main`.
- [ ] Wait for all `main` CI jobs.
- [ ] Create and push `v0.33.0` tag.
- [ ] Publish GitHub release note.
