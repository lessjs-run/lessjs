# v0.33.0 Acceptance Criteria

v0.33.0 is accepted only if all criteria below are satisfied.

## Product Criteria

- New docs and create templates use object-form `definePage({ ... })`.
- Page descriptors expose structured `head`, `route`, and `renderIntent` intent.
- Island metadata has an explicit helper while old `openElement` metadata still
  works.
- App-level island options expose `ssr?: boolean`.
- Raw or trusted head insertion uses an intentionally dangerous or trusted name.
- Old v0.31-v0.32 page and island APIs remain compatible.

## Architecture Criteria

- New page fields normalize into the existing page descriptor path.
- New island metadata normalizes into the existing island descriptor path.
- Generated entries remain declarative wiring.
- The renderer remains JSX -> VNode -> RenderNode -> DSD HTML or DOM.
- No AutoFlow2 runtime code is required for v0.33.

## Evidence Criteria

- Unit tests cover new page fields and old API compatibility.
- Unit tests cover island metadata helper and `ssr?: boolean`.
- Generated-entry tests prove equivalent lifecycle metadata for old and new
  page intent forms.
- Create-template tests prove generated projects use the new docs path and
  still build.
- Docs gates pass.
- Architecture and package graph gates pass.
- Full local tests pass before package bump.
- Changelog and release note are written after implementation proof.
