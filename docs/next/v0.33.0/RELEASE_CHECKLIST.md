# v0.33.0 Release Checklist

## Before Bump

- [x] SOP tasks completed.
- [x] NextVersion tasks completed.
- [x] Local implementation gates pass.
- [x] Website and current docs updated.
- [x] Rejection evidence for old page and island authoring APIs recorded.

## Bump and Docs

- [x] All packages aligned to v0.33.0.
- [x] Changelog written.
- [x] Release note written.
- [x] Consumer smoke passes.
- [x] Publish dry-run passes.

## Remote Closure

- [ ] Push `dev`.
- [ ] Wait for all `dev` CI jobs.
- [ ] Merge `dev` into `main`.
- [ ] Wait for all `main` CI jobs.
- [ ] Create and push `v0.33.0` tag.
- [ ] Publish GitHub release note.
