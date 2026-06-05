# v0.33.0 SOP: AI-Readable API Foundation

> Status: Next\
> Roadmap: AI-Readable API Foundation\
> ADR: ADR-0086\
> NextVersion: `docs/next/v0.33.0/`\
> Workflow: `docs/governance/PROJECT_WORKFLOW.md`

## Goal

Make app, page, island, head, route, and render intent explicit and
machine-readable before AutoFlow2 starts judging workflow state.

## Entry Criteria

- v0.32.0 lifecycle semantics are stable.
- `docs/next/v0.33.0/` exists and matches this SOP.
- Current page and island descriptors are understood from code, tests, and docs.
- Existing v0.31-v0.32 APIs remain supported during this release.

## Tasks

- [ ] Make object-form `definePage({ ... })` the default docs and create
      template path.
- [ ] Add structured page fields: `head`, `route`, and `renderIntent`.
- [ ] Normalize old and new page fields into one descriptor path.
- [ ] Add explicitly named trusted/raw head APIs such as `trustedHeadHtml` or
      `dangerouslyHeadFragments`.
- [ ] Add `defineIslandMetadata()` or `defineIslandConfig()`.
- [ ] Keep old `export const openElement = ...` island metadata compatible.
- [ ] Add `ssr?: boolean` to app-level island options.
- [ ] Normalize old and new island metadata into one descriptor path.
- [ ] Add generated-entry tests proving old and new page intent forms produce
      equivalent lifecycle metadata where they express the same behavior.
- [ ] Update create templates and docs examples only after the API exists.

## Verification

- targeted `@openelement/app` API tests
- targeted generated-entry metadata tests
- create-template build tests
- `deno task workflow:check`
- `deno task arch:check`
- `deno task graph:check`
- `deno task docs:check-current`
- `deno task docs:check-strategy`
- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`
- `deno task build`

## Non-Goals

- No AutoFlow2 sidecar implementation.
- No AutoFlow2 CI blocker.
- No ISR/cache/deploy expansion.
- No server mutation API.
- No data library recipes.
- No UI Shell redesign.
- No package surface reset.

## Exit Criteria

- New page and island intent APIs are implemented, typed, documented, and
  tested.
- Old v0.31-v0.32 page and island APIs remain compatible.
- Generated projects use the new object-form page path and still build.
- v0.34 AutoFlow2 sidecar can read page/island/build intent without relying on
  ad hoc inference.
