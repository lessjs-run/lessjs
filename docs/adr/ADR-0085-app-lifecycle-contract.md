# ADR-0085: App Lifecycle Contract

- Status: Accepted
- Date: 2026-06-05

## Context

v0.31.0 made JSX-first helpers the default authoring API. The framework still
needed a precise lifecycle contract so later rendering, server, data, and UI
work would not invent separate route, load, error, redirect, or layout paths.

Mainstream frameworks converge on explicit lifecycle boundaries: file routes,
load/data phases, layout wrapping, route handlers, redirects, and not-found
handling. openElement needs the same clarity while preserving its own output
model: Web Components and Declarative Shadow DOM.

## Decision

v0.32.0 defines the application lifecycle around `definePage()`.

- `load()` receives structured params, request, environment, platform, and route
  source context.
- `render()` receives data, params, request, route, metadata, and public props.
- `error()` renders through the same VNode page contract when a page provides a
  fallback.
- `redirect()` and `notFound()` are typed lifecycle control helpers exported
  from `@openelement/app`.
- Generated request-time and SSG entries must catch lifecycle controls at the
  framework boundary.
- Route metadata, layout selection, revalidate, rendering intent, and streaming
  intent are exposed as structured metadata.

## Consequences

Positive:

- Application authors can stay in JSX and app-level helpers.
- v0.33 can implement rendering runtime behavior against a single lifecycle
  model.
- Redirect and not-found behavior no longer requires ad hoc strings or direct
  Hono usage.
- Page error rendering stays on the VNode/DSD renderer path.

Negative:

- Throwing control errors is a public convention that must remain stable.
- Generated entry tests must cover both request-time and SSG paths.

Neutral:

- v0.32 does not define cache freshness, streaming transport, or deployment
  host behavior. Those remain v0.33 scope.
