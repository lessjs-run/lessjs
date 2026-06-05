# v0.36.0 SOP: UI Shell and Starter Productization

> Status: Planned\
> Roadmap: UI Shell and Starter Productization\
> ADR: ADR-0084

## Goal

Make the visible app shell, UI package, and starter templates good enough for
real docs, blogs, product pages, and dashboards.

## Entry Criteria

- v0.32.0 lifecycle semantics are stable.
- v0.33.0 rendering modes are deployable.
- v0.34.0 server context is stable.
- v0.35.0 data recipes can feed starter examples.
- ADR-0073, ADR-0074, ADR-0075, and ADR-0076 are re-read against current code.

## Tasks

- [ ] Audit AppShell and layout config against real www and starter needs.
- [ ] Ensure AppShell is configurable without alias hacks.
- [ ] Decide `@openelement/ui/css` export shape.
- [ ] Separate Ocean components from browser-upgraded island components.
- [ ] Finalize token strategy using Open Props and first-party CSS.
- [ ] Add starter templates for docs, blog, product, and dashboard.
- [ ] Ensure starter templates use v0.32 lifecycle, v0.33 rendering, v0.34
      server, and v0.35 data patterns where relevant.
- [ ] Add visual docs and Playwright screenshots for layout modes.
- [ ] Ensure UI examples use `definePage()` and `defineIsland()`.

## Verification

- UI package tests
- starter template builds
- www build
- Playwright e2e and screenshot checks
- publish dry-run for package metadata only if UI exports change

## Non-Goals

- No renderer rewrite.
- No data layer expansion.
- No package surface reset.
- No marketing-only landing page work without functional starter proof.

## Exit Criteria

- AppShell is a first-class configuration surface.
- UI docs and starter templates are coherent with the v0.32-v0.35 product path.
- Visual behavior is browser-proven.
