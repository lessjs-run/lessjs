# v0.37.3 SOP: Data and Database Boundary

> Status: Planned\
> Roadmap: Four-Product Validation Train\
> Depends on: v0.37.0, v0.37.2

## Goal

Define data and database integration boundaries without making openElement an
ORM, auth platform, or database framework.

## Entry Criteria

- Page `load()` and API route contexts are implementation-proven.
- SSR/ISR runtime boundaries are documented.
- Database ownership has been explicitly rejected by ADR-0091.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0085: App Lifecycle Contract.

## Step-by-Step Tasks

1. Audit current page `load()` context, API route context, middleware context,
   redirects, errors, and generated data resolution.
2. Identify shared request/data fields that are genuinely common between page
   load and API routes.
3. Define a minimal data adapter recipe shape for examples.
4. Add recipes for file/memory data first.
5. Add optional recipes for Deno KV and Cloudflare KV/D1 only as examples after
   the boundary is stable.
6. Document mutation/action patterns for forms without inventing an ORM.
7. Add fixture apps proving `load()`, API route data, and one external adapter
   recipe can build.
8. Add risk notes for secrets, connection lifetimes, transactions, and runtime
   portability.

## Verification

- type tests for context and recipe interfaces.
- API route tests.
- generated fixture build.
- docs checks.
- full local gate ladder before release.

## Non-Goals

- No built-in ORM.
- No schema migration tool.
- No default database.
- No auth/session framework.
- No query builder ownership.

## Exit Criteria

- Data/database docs are useful for real apps without pretending openElement is
  a backend platform.
- At least one recipe smoke proves the boundary.
- v0.37.6 can include a data-backed starter path.

## AutoFlow Boundary

AutoFlow may run adapter recipe smoke and detect docs/test drift. It must not
choose database defaults or security policy.
