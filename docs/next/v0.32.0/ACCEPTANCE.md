# v0.32.0 Acceptance Criteria

v0.32.0 is accepted only if all criteria below are satisfied.

## Product Criteria

- App authors can define a page without importing `DsdElement`.
- Page render context contains route and metadata.
- Page load context contains params, request, env, platform, and route source.
- Redirect and not-found are public lifecycle helpers.
- Page error rendering uses VNode output, not a parallel string pipeline.
- SSG `routeInfo` exposes lifecycle metadata for v0.33 runtime work.

## Architecture Criteria

- No compatibility shim is added for obsolete string rendering.
- Generated code is declarative glue; lifecycle behavior lives in real modules
  or structured helpers.
- AppShell selection continues to use structured route metadata.
- The renderer remains JSX/VNode/RenderNode/DSD.

## Evidence Criteria

- API unit tests cover `definePage()` context and lifecycle helpers.
- Generated-entry tests cover lifecycle wiring.
- Docs gates pass.
- Architecture and package graph gates pass.
- Full local tests pass before bumping package versions.
- Release note and changelog are written after implementation proof.
