# v0.33.0 SOP: Server/API Layer

> Status: Planned\
> Roadmap: Server/API Layer

## Goal

Make backend route files intentional without turning openElement into a heavy
backend platform.

## Entry Criteria

- v0.32.0 rendering mode semantics are stable.
- Hono remains the server substrate.
- API route behavior is documented from real code, not inferred.

## Tasks

- [ ] Audit current `api/*.ts` route handling and generated Hono wiring.
- [ ] Define a typed route helper for common JSON, redirect, HTML, and error responses.
- [ ] Define request context shape shared by page `load()` and API routes where appropriate.
- [ ] Document middleware order and scoping rules.
- [ ] Add cookie and header helper examples.
- [ ] Add structured error response tests.
- [ ] Add security defaults for common API responses.
- [ ] Add route handler docs and generated type examples.

## Verification

- route handler unit tests
- generated entry snapshot tests
- `deno task test`
- `deno task build`

## Non-Goals

- No full auth framework.
- No database ownership.
- No server runtime fork beyond Hono integration.

## Exit Criteria

- Users can build typed API routes without reading adapter internals.
- Middleware and error behavior are documented and tested.
