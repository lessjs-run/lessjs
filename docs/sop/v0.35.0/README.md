# v0.35.0 SOP: UI Shell and Design System Surface

> Status: Planned\
> Roadmap: UI Shell and Design System Surface

## Goal

Make the visible app shell and UI package good enough for real docs, blogs,
product pages, and dashboards.

## Entry Criteria

- v0.31.0 Application API is released.
- Rendering and server/data boundaries are no longer moving in ways that affect UI shell.
- ADR-0073, ADR-0074, ADR-0075, and ADR-0076 are re-read against current code.

## Tasks

- [ ] Audit AppShell/layout config against real www and starter needs.
- [ ] Decide `@openelement/ui/css` export shape.
- [ ] Separate Ocean components from browser-upgraded island components.
- [ ] Finalize token strategy using Open Props and first-party CSS.
- [ ] Add starter templates for docs, blog, product, and dashboard.
- [ ] Add visual docs for layout modes.
- [ ] Add Playwright screenshots for shell behavior.
- [ ] Ensure UI examples use `definePage()` and `defineIsland()`.

## Verification

- UI package tests
- www build
- Playwright e2e and screenshot checks
- create-template build
- publish dry-run

## Non-Goals

- No renderer rewrite.
- No data layer expansion.
- No marketing-only landing page work without functional starter proof.

## Exit Criteria

- AppShell is configurable without alias hacks.
- UI docs and starter templates are coherent.
- Visual behavior is browser-proven.
