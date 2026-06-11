# v0.37.6 Acceptance Criteria

v0.37.6 can be called complete only when the repository proves the following
criteria.

## Runtime Proof

- A real Nitro server entry can mount an openElement universal request handler.
- Node output is built and smoke-tested.
- Cloudflare Workers output is built and smoke-tested or blocked with concrete
  evidence and an accepted follow-up.
- The proof uses openElement route/render semantics, not generic Nitro-only
  routes.

## Route and Render Semantics

- Static routes preserve the zero-framework-JS default.
- Explicit islands emit the expected client JavaScript and no unrelated island
  chunks.
- Static assets and island chunks resolve from Nitro output.
- `load()`, layout composition, redirects, not-found, errors, and API routes
  behave through the Nitro-mounted handler.

## Protocol Ownership

- openElement remains the owner of application, component, route, render,
  island, DSD/shadow, and light opt-in semantics.
- Nitro ownership is limited to runtime delivery, preset output, serving, and
  supported cache primitives.
- Any Hono ownership that remains is documented as implementation detail or
  deferred replacement work.

## Gates

- `deno task workflow:check`
- `deno task graph:check`
- `deno task arch:check`
- `deno task docs:check-current`
- `deno task docs:check-strategy`
- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`
- `deno task build`
- `deno task publish:dry-run`

## Release Truth

- `dev` non-JSR CI is green before merge/sync to `main`.
- `main` non-JSR CI is green before tag/release.
- JSR publish and JSR visibility are recorded honestly but do not block version
  exit under ADR-0097.
