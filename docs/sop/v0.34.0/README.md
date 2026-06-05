# v0.34.0 SOP: Server Routes and Mutations

> Status: Planned\
> Roadmap: Server Routes and Mutations\
> ADR: ADR-0084

## Goal

Make server routes, request context, responses, and mutations first-class
without turning openElement into a heavy backend platform.

## Entry Criteria

- v0.32.0 lifecycle context is stable.
- v0.33.0 rendering runtime and deploy boundaries are stable.
- Hono remains the server substrate.

## Tasks

- [ ] Audit current `api/*.ts` route handling and generated Hono wiring.
- [ ] Define typed helpers for JSON, redirect, HTML, empty, and structured error
      responses.
- [ ] Define request context shared by page `load()` and API routes where it is
      genuinely common.
- [ ] Document middleware order, route scoping, and handler precedence.
- [ ] Add cookie and header helpers or examples at the openElement boundary.
- [ ] Define mutation/action patterns for forms and server-side state changes.
- [ ] Add security defaults for common API and mutation responses.
- [ ] Add route handler docs and generated type examples.

## Verification

- server route unit tests
- mutation/action fixture tests
- generated entry snapshot tests
- `deno task test`
- `deno task build`

## Non-Goals

- No full auth framework.
- No database ownership.
- No ORM recipes; those belong to v0.35.
- No server runtime fork beyond Hono integration.
- No package surface reset.

## Exit Criteria

- Users can build typed server routes and form mutations without reading adapter
  internals.
- Middleware, context, response, and error behavior are documented and tested.
- v0.35 data recipes can reuse the server context without redefining it.
