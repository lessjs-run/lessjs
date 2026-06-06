# v0.33.0 SOP: Strict AI-Readable API Reset

> Status: Next\
> Roadmap: Strict AI-Readable API Reset\
> ADR: ADR-0086\
> NextVersion: `docs/next/v0.33.0/`\
> Workflow: `docs/governance/PROJECT_WORKFLOW.md`

## Goal

Make app, page, island, head, route, and render intent explicit,
machine-readable, and single-path before AutoFlow2 starts judging workflow
state.

## Entry Criteria

- v0.32.0 lifecycle semantics are stable.
- `docs/next/v0.33.0/` exists and matches this SOP.
- Current page and island descriptors are understood from code, tests, and docs.
- v0.33 is allowed to remove v0.31-v0.32 authoring shortcuts.

## Tasks

- [x] Make object-form `definePage({ route, head, renderIntent, load, render, error })`
      the only page authoring path.
- [x] Remove function-form `definePage(() => ...)`.
- [x] Remove top-level page `title`, `description`, `meta`, `rendering`,
      `streaming`, and `revalidate`.
- [x] Add structured page fields: `head`, `route`, and `renderIntent`.
- [x] Add explicit raw head boundary: `head.dangerouslyHeadFragments`.
- [x] Add `defineIslandConfig({ ssr, dsd, hydrate })`.
- [x] Reject old object-literal `export const openElement = { ... }` island metadata.
- [x] Add `ssr?: boolean` to app-level island options and runtime island metadata.
- [x] Update generated entry code to read only `head` and `renderIntent`.
- [x] Update create templates, docs examples, and www examples to the canonical path.

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
- Old v0.31-v0.32 page and island authoring shortcuts are rejected.
- Generated projects use the new object-form page path and still build.
- v0.34 AutoFlow2 sidecar can read page/island/build intent without relying on
  ad hoc inference.
