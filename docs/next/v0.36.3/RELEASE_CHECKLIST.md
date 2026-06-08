# v0.36.3 Release Checklist

## Pre-Release

- [ ] All 10 SOP tasks marked complete
- [ ] `deno task gate` passes (12 gates)
- [ ] `deno task test:e2e` passes (Chromium)
- [ ] All NextVersion docs complete

## Version Bump

- [ ] Bump all 20 packages to 0.36.3
- [ ] `deno task graph:check` verifies alignment
- [ ] `deno task autoflow:check` passes

## Publish

- [ ] `deno task publish:dry-run` succeeds
- [ ] GitHub release created: `gh release create v0.36.3`

## Branch Flow

- [ ] Push dev, wait for CI green
- [ ] Merge dev → main
- [ ] Wait for main CI green
- [ ] Tag `v0.36.3` on main
- [ ] Push tag

## Post-Release

- [ ] Update STATUS.md: current → v0.36.3, next → v0.36.4
- [ ] Mark v0.36.3 Done in ROADMAP.md
- [ ] Update changelog and release note
