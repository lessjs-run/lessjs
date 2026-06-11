# v0.37.5 Acceptance Criteria

v0.37.5 can be called complete only when all criteria below are true.

## Architecture

- ADR-0096 and ADR-0098 are accepted and linked from status, roadmap, SOP, and
  this NextVersion package.
- openElement's product description is updated to Web Components application
  framework powered by Vite + Nitro.
- DSD/shadow is documented as the default render mode, not the entire product
  identity.
- Light DOM remains documented as explicit opt-in.

## Protocols

- `@openelement/protocols` contains the first accepted protocol groups for
  renderer, component adapter, runtime adapter, route manifest, island metadata,
  cache/storage intent, signal interoperability, and data adapter boundaries.
- Existing public imports continue to work through re-exports where applicable.
- `graph:check` reports no package cycles.
- `arch:check` reports no contract violations.

## Conformance

- Renderer conformance tests run against the current openElement renderer.
- Runtime adapter conformance skeleton proves the fetch-compatible boundary.
- Cache adapter conformance checks cover baseline memory behavior.
- Protocol tests run in `deno task test`.

## Nitro Readiness

- A v0.37.6 proof plan exists for Vite + Nitro runtime integration.
- The plan covers Node and Cloudflare Workers output.
- The plan covers route handling, static assets, island chunks, and ISR/cache
  intent mapping.

## Release Truth

- v0.37.4 repository-controlled release evidence is accepted before v0.37.5
  implementation starts.
- v0.37.4 JSR publish state is recorded as best-effort distribution telemetry
  and does not block v0.37.5 under ADR-0097.
- v0.37.5 does not publish, tag, or claim release closure without passing the
  release gate order in `docs/status/STATUS.md`.
