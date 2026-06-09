# v0.36.4 Release Checklist

## Pre-Release

- [x] `test:e2e:browsers` passes (Chromium + Firefox + WebKit)
- [x] Known browser limitations documented
- [x] CI workflow updated for cross-browser gate

## Version Bump

- [x] Bump all 20 packages to 0.36.4
- [x] `deno task graph:check` verifies alignment

## Branch Flow

- [x] Push dev, wait for CI green
- [x] Merge dev -> main
- [x] Wait for main CI green
- [ ] Tag `v0.36.4` on main
