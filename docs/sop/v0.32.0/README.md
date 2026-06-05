# v0.32.0 SOP: App Lifecycle Contract

> Status: Implemented, pending repository release closure\
> Roadmap: App Lifecycle Contract\
> ADR: ADR-0084, ADR-0085\
> NextVersion: `docs/next/v0.32.0/`\
> Workflow: `docs/governance/PROJECT_WORKFLOW.md`

## Goal

Define the stable page, layout, island, and route lifecycle that later rendering,
server, data, and UI work must use.

## Entry Criteria

- v0.31.0 Application API is released.
- `definePage()`, `defineIsland()`, `defineElement()`, and `defineLayout()` are
  the documented authoring entrypoints.
- Current route scanning and generated entry behavior are understood from code,
  tests, and docs.

## Tasks

- [x] Audit current page descriptor, route meta, route params, and `load()`
      behavior.
- [x] Define the lifecycle order for route match, params, context, `load()`,
      render, layout wrapping, error, not-found, and redirect handling.
- [x] Define route-level render intent as lifecycle metadata only; runtime cache
      and deploy behavior belongs to v0.33.
- [x] Align page function and object forms to one descriptor shape.
- [x] Ensure layout and AppShell selection use structured route data, not alias
      hacks or generated-code inference.
- [x] Add lifecycle fixtures for static pages, dynamic params, nested layout,
      `load()`, error, not-found, and redirect.
- [x] Update current docs, create template docs, and www examples to teach the
      lifecycle before runtime modes.

## Implementation Evidence

- `@openelement/app` exports `redirect()`, `notFound()`,
  `OpenElementRedirect`, `OpenElementNotFound`, and lifecycle type guards.
- `definePage()` render context now includes `route` and `meta`.
- `definePage()` supports an `error()` renderer that returns VNodes through the
  same renderer pipeline.
- Generated Hono entries catch lifecycle redirect and not-found controls.
- SSG `renderRoute()` returns structured redirect and not-found output.
- `routeInfo` exposes file path, revalidate, rendering intent, and streaming
  intent for v0.33.
- AutoWorkflow and `docs/next/v0.32.0/` define the release execution package.

## Verification

- `deno task workflow:check`
- `deno task docs:check-current`
- `deno task docs:check-strategy`
- `deno task arch:check`
- `deno task graph:check`
- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`
- `deno task build`
- `deno task dsd:check-report`
- `deno task publish:dry-run`
- `deno task test:e2e`

## Non-Goals

- No ISR cache adapter work.
- No deployment recipes.
- No data library recipes.
- No UI Shell redesign.
- No package surface reset.

## Exit Criteria

- Every documented page lifecycle hook is implemented and tested.
- Later rendering and server SOPs can depend on a single lifecycle contract.
- Users can understand how a route becomes rendered output without reading
  adapter internals.
