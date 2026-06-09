# v0.36.4 Tasks - Firefox/WebKit Cross-Browser Proof

## Investigation

- [x] Install Firefox and WebKit Playwright browsers
- [x] Run `test:e2e:browsers` to identify all failures
- [x] Investigate Firefox search/theme token wait timeout root cause
- [x] Investigate WebKit console error count failures
- [x] Investigate WebKit stability/timeout failures

## Fixes

- [x] Fix or document Firefox search panel theme token behavior
- [x] Fix or document WebKit-specific behavior differences
- [x] Ensure `test:e2e:browsers` passes on all 3 browsers

## CI Integration

- [x] Update CI workflow to run `test:e2e:browsers` as a release gate
- [x] Document any remaining browser-specific known limitations

## Release

- [x] Bump all 20 packages to 0.36.4
- [x] Run all release gates
- [ ] Update STATUS.md, ROADMAP.md, changelog, release note
