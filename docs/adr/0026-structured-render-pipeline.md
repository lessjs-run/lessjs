# ADR-0026: Structured Render Pipeline (v0.16)

- Status: PROPOSED
- Date: 2026-05-16
- Supersedes: ADR-0025 §2, §4 (deferred items)

## Context

ADR-0025 defined the Renderer Protocol and was partially delivered in v0.15:

- **Delivered**: `RendererProtocol` interface, named adapters, module split, type
  definitions (`RenderOutput`, `RenderError`, `HydrationHint`, `RenderInput`,
  `RenderHooks`), `customElementRegistry` simplification.
- **Deferred**: `renderDsd()` return type change, `dsd-report.json` writing,
  `RenderHooks` integration.

These were deferred for good reason: changing `renderDsd()` return type is a
breaking change that should happen once, together with `RenderHooks` integration,
rather than as two separate breaking changes.

Now is the time to complete the pipeline.

## Decision

### 1. Change `renderDsd()` return type to `Promise<RenderOutput>`

Current:

```ts
export async function renderDsd(...): Promise<string>
```

New:

```ts
export async function renderDsd(...): Promise<RenderOutput>
```

All callers must destructure:

```ts
const { html, errors, metrics, hydrationHints } = await renderDsd(...)
```

No backward-compatible wrapper. Pre-1.0, breaks are acceptable.

**Affected callers** (must update):

- `adapter-vite/src/cli/ssg-render.ts` — use `out.html` for page output
- `adapter-vite/src/entry-renderer.ts` — generated SSR entry code
- `core/src/render-nested.ts` — propagate errors + hints up
- `core/__tests__/render-dsd.test.ts` — update assertions
- `adapter-lit/src/ssr.ts` — Lit SSR rendering pipeline

### 2. Wire `RenderHooks` into the render pipeline

Add optional `hooks?: RenderHooks` parameter to `renderDsd()`:

```ts
export async function renderDsd(
  tagName: string,
  componentClass: CustomElementConstructor,
  props: Record<string, unknown> = {},
  sourceInfo?: { route?: string; source?: string },
  dsdOptions?: DsdOptions,
  collector?: DsdRenderCollector,
  nestingDepth = 0,
  hooks?: RenderHooks, // NEW
): Promise<RenderOutput>;
```

Pipeline calls:

1. `hooks.beforeRender(input)` — before instantiation
2. `hooks.afterRender(output)` — after serialization
3. `hooks.onError(error)` — on any `RenderError`

### 3. Write `dsd-report.json` during SSG builds

After all pages are rendered, `ssg-render.ts` aggregates metrics from each
`RenderOutput` and writes a single `dsd-report.json` to the output directory.

```ts
interface DsdBuildReport {
  version: 1;
  timestamp: string;
  totalPages: number;
  totalErrors: number;
  errors: RenderError[];
  metrics: DsdReport;
}
```

This enables CI gates: `if (report.totalErrors > 0) process.exit(1)`.

### 4. Package islands SSR registration via `beforeRender` hook

Current limitation: package islands (e.g., `@lessjs/ui` components) are not
registered in SSR's `customElements` registry, so `renderDsd()` cannot
instantiate them.

With `RenderHooks`, `adapter-vite` can provide a `beforeRender` hook that
lazy-imports and registers package island components on demand:

```ts
const hooks: RenderHooks = {
  beforeRender(input) {
    if (!customElements.get(input.tagName)) {
      // Lazy import + register package island
    }
  },
};
```

This avoids hardcoding package imports in the SSR entry and solves the JSR
specifier resolution issue in Vite's server module runner.

### 5. Pre-publish version consistency check

Add a `deno task check:versions` script that verifies:

- All `packages/*/deno.json` have the same version
- `deno.lock` is up to date
- Cross-package `@lessjs/*@^X.Y.Z` references match the current version

Run this in CI and as a pre-publish gate.

### 6. Playwright E2E baseline

Set up `@playwright/test` in the monorepo for browser-level validation:

- `packages/adapter-vite/__tests__/e2e/` — E2E test directory
- First test: scaffold → build → serve → verify DSD output in real browser
- No legacy DOM diff/test presets — Playwright is the only browser test framework

## Consequences

### Positive

- `renderDsd()` output is fully structured — errors, metrics, hints are
  machine-readable and can drive CI gates, tooling, and hydration optimization.
- `RenderHooks` enable adapter-level intervention without modifying core pipeline.
- `dsd-report.json` gives SSG builds visibility into rendering performance.
- Package islands work in SSR via hooks, not hardcoded imports.
- Pre-publish checks prevent version drift.
- Playwright validates real browser behavior, not just unit tests.

### Negative

- Breaking change to `renderDsd()` return type (second and final — combined with
  hooks, no further signature changes expected).
- Playwright adds CI time and a new dependency.
- `dsd-report.json` format is v1 — may need to evolve.

### Neutral

- `RenderHooks.onError` replaces ad-hoc error handling inside `renderDsd()`.
- The `collector?: DsdRenderCollector` parameter may be removed in a future
  version since `RenderOutput.metrics` subsumes it.

## Validation

- [ ] `renderDsd()` returns `Promise<RenderOutput>` and all callers updated
- [ ] `RenderHooks.beforeRender` / `afterRender` / `onError` fire correctly
- [ ] `dsd-report.json` is written after SSG build
- [ ] Package island renders in SSR via `beforeRender` hook
- [ ] `deno task check:versions` passes
- [ ] At least 1 Playwright E2E test passing
- [ ] All existing unit tests pass
- [ ] `deno task typecheck && deno lint && deno fmt --check` all pass
