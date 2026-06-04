# LessJS v0.29.0 - Structured Renderer IR

> Version: v0.29.0\
> Status: Completed\
> ADR: [ADR-0077: Structured Render IR and Single Renderer Pipeline](../../adr/ADR-0077-structured-render-ir.md)\
> Output: one internal renderer model, one traversal pipeline, one serializer,
> and removed duplicate string-render paths.

## Summary

v0.29.0 is the renderer-kernel cleanup line. v0.28.6 cleans build, package,
metadata, and trust-boundary debt. v0.29.0 should remove the remaining renderer
duplication before the UI Shell work begins in v0.30.0.

The target is:

> one structured render model, one transform pipeline, one HTML serializer.

`renderToString()`, `renderDsdTree()`, and `renderDsd()` should stop owning
separate traversal semantics. They should become thin entrypoints into a shared
internal `RenderNode` pipeline.

## Entry Criteria

1. v0.28.6 is complete and core no longer owns a sanitizer npm dependency.
2. v0.30.0 UI Shell work has not started or is explicitly paused until the
   renderer IR lands.
3. Current renderer string-output fixtures are captured before migration.
4. Public `renderDsd()` return shape is treated as stable unless an ADR changes
   it.

## Goals

### 1. Introduce Internal Render IR

Add an internal `RenderNode` model that can represent:

- text
- element
- fragment
- trusted HTML
- DSD host
- event marker metadata
- light DOM and shadow DOM content

The IR is internal first. It should not become public API in v0.29.0 unless
explicitly accepted later.

### 2. Collapse Duplicate Traversals

Replace duplicated traversal in:

- `renderToString()`
- `renderDsdTree()`
- DSD wrapping paths inside `renderDsd()`

with one pipeline:

```text
VNode / component result / adapter result
  -> RenderNode IR
  -> DSD transform
  -> event marker transform
  -> HTML serializer
  -> RenderOutput
```

### 3. Make Trusted HTML a Node Type

Raw HTML should not be a magic string mode. It should be represented as an
explicit trusted node:

```ts
{ kind: 'trusted-html', value: html }
```

Default text and `innerHTML` behavior must remain escaped unless the caller
crosses an explicit trust boundary.

### 4. Move DSD Insertion to a Transform

Nested custom elements and DSD host rendering should be handled by a structured
transform, not by string insertion into serialized HTML.

The transform should own:

- custom element host detection
- shadow template construction
- light DOM placement
- style attachment
- hydration hint propagation

### 5. Keep Public Output Stable

The public `RenderOutput` contract should remain:

```ts
{
  html,
  errors,
  metrics,
  hydrationHints,
}
```

The internal model can change without forcing application authors to rewrite
call sites.

## Execution Order

1. Capture current renderer fixture outputs.
2. Add internal `RenderNode` types and serializer.
3. Convert VNode rendering into IR.
4. Convert DSD wrapping into an IR transform.
5. Convert event markers and hydration hints into IR metadata.
6. Rewire `renderToString()` through the serializer.
7. Rewire `renderDsdTree()` through the DSD transform.
8. Rewire `renderDsd()` through the same pipeline.
9. Remove duplicated traversal code.
10. Run full renderer, adapter-vite, build, and e2e gates.

## Verification

Focused gates:

- renderer IR unit tests
- HTML serializer escaping tests
- trusted HTML boundary tests
- nested DSD transform tests
- event marker transform tests
- `renderToString()` parity tests
- `renderDsdTree()` parity tests
- `renderDsd()` output tests

Full gates:

- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`
- `deno task build`
- `deno task dsd:check-report`
- `LESSJS_E2E_PORT=4175 CI=1 deno task test:e2e`
- `deno task publish:dry-run`

## Exit Criteria

v0.29.0 is complete only when:

- one internal renderer IR exists
- `renderToString()` and `renderDsdTree()` no longer duplicate traversal logic
- DSD insertion is a structured transform
- trusted HTML is represented explicitly
- default text/innerHTML escaping behavior is unchanged
- public `RenderOutput` remains stable
- renderer fixture parity passes
- full local gates pass

## Non-Goals

- No UI Shell component expansion.
- No package rebrand.
- No new public JSX syntax.
- No bundled sanitizer in `@openelement/core`.
- No router rewrite.
- No AppShell API expansion.
