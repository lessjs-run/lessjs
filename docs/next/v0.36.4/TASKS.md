# v0.36.4 Tasks — Firefox/WebKit Cross-Browser Proof

## Investigation

- [ ] Install Firefox and WebKit Playwright browsers
- [ ] Run `test:e2e:browsers` to identify all failures
- [ ] Investigate Firefox search/theme token wait timeout root cause
- [ ] Investigate WebKit console error count failures
- [ ] Investigate WebKit stability/timeout failures

## Fixes

- [ ] Fix or document Firefox search panel theme token behavior
- [ ] Fix or document WebKit-specific behavior differences
- [ ] Ensure `test:e2e:browsers` passes on all 3 browsers

## CI Integration

- [ ] Update CI workflow to run `test:e2e:browsers` as a release gate
- [ ] Document any remaining browser-specific known limitations

## Release

- [ ] Bump all 20 packages to 0.36.4
- [ ] Run all release gates
- [ ] Update STATUS.md, ROADMAP.md, changelog, release note
