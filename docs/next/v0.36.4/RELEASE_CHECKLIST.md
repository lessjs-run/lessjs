# v0.36.4 Release Checklist

## Pre-Release

- [ ] `test:e2e:browsers` passes (Chromium + Firefox + WebKit)
- [ ] Known browser limitations documented
- [ ] CI workflow updated for cross-browser gate

## Version Bump

- [ ] Bump all 20 packages to 0.36.4
- [ ] `deno task graph:check` verifies alignment

## Branch Flow

- [ ] Push dev, wait for CI green
- [ ] Merge dev → main
- [ ] Wait for main CI green
- [ ] Tag `v0.36.4` on main
