# v0.36.4 SOP: Firefox/WebKit Cross-Browser Proof

> Status: Planned\
> Roadmap: Firefox/WebKit Cross-Browser Proof\
> NextVersion: `docs/next/v0.36.4/`

## Goal

Resolve Firefox/WebKit cross-browser E2E gaps identified during v0.36.2
Chromium-only release. Establish `test:e2e:browsers` as a stable release gate.

## Tasks

- [ ] Investigate Firefox search/theme token wait timeout root cause.
- [ ] Fix or document Firefox search panel theme token behavior.
- [ ] Investigate WebKit console error count failures.
- [ ] Investigate WebKit stability/timeout failures.
- [ ] Fix or document WebKit-specific behavior differences.
- [ ] Ensure `test:e2e:browsers` passes Chromium + Firefox + WebKit.
- [ ] Update CI workflow to run `test:e2e:browsers` as a release gate.
- [ ] Document any remaining browser-specific known limitations.
- [ ] Bump all 20 packages to 0.36.4.

## Verification

Required release gates:

```bash
deno task workflow:check
deno task fmt:check
deno task lint
deno task typecheck
deno task graph:check
deno task autoflow:test
deno task autoflow:health
deno task autoflow:check
deno task test
deno task build
deno task dsd:check-report
deno task publish:dry-run
deno task test:e2e
deno task test:e2e:browsers
```

## Non-Goals

- Do not change SSG engine or adapter-vite architecture.
- Do not start Server/Data/UI/starter/Hub product closure (deferred to v0.37.0).

## Exit Criteria

- `test:e2e:browsers` passes on Chromium, Firefox, and WebKit.
- Root cause of each Firefox/WebKit failure is documented.
- Any remaining browser-specific limitations are recorded as known issues.
- CI workflow includes cross-browser E2E as a gate.
- All release gates pass.

## Related

- [ADR-0086: AI-Readable Architecture and AutoFlow Roadmap](../../adr/ADR-0086-ai-readable-architecture-and-autoflow2-roadmap.md)
