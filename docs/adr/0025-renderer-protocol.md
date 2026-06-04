# ADR-0025: Renderer Protocol

- Status: ACCEPTED
- Date: 2026-05-16
- Updated: 2026-05-16 (implementation status)

## Implementation Status

| Section                       | v0.15 Delivered | v0.16 Planned | Notes                                                                                     |
| ----------------------------- | --------------- | ------------- | ----------------------------------------------------------------------------------------- |
| §1 RendererProtocol           | ✅              | —             | `RenderAdapter` fully removed                                                             |
| §2 renderDsd() → RenderOutput | ❌ Types only   | ✅            | Return type still `Promise<string>`; `RenderOutput` type defined + exported               |
| §3 Module split               | ✅              | —             | 4 files as specified                                                                      |
| §4 DSD report output          | ❌              | ✅            | `DsdRenderCollector` works, `getReport()` works, but `dsd-report.json` not written by SSG |
| §5 Named adapters             | ✅              | —             | `registerAdapter` + `getAdapter` + `getRegisteredAdapters`                                |
| §6 create CLI                 | ✅              | —             | JSR resolution + project name validation                                                  |
| §7 customElementRegistry      | ✅              | —             | Type simplified to `boolean`                                                              |
| RenderHooks                   | ❌ Types only   | ✅            | Interface defined but not wired into pipeline                                             |
| RenderInput                   | ✅ Types only   | ✅            | Type defined + exported; not used as renderDsd() parameter                                |

## Context

ADR-0024 defined the strategic direction: LessJS is a Web Standards-first DSD/Web
Components application framework. v0.15's goal is to productize the existing DSD
renderer into a reusable rendering kernel.

The previous rendering interface (`RenderAdapter`) had three optional methods and
no error taxonomy:

```ts
interface RenderAdapter {
  isTemplate?: (value: unknown) => boolean;
  render?: (value: unknown, tagName: string) => Promise<string>;
  extractStyles?: (componentClass: CustomElementConstructor) => string | undefined;
}
```

Problems:

1. **No output contract** — `renderDsd()` returns a bare string. Errors,
   metrics, and hydration hints are lost or handled via side channels (collector
   mutation, console logs, HTML comments).
2. **No error classification** — instantiation failures, render crashes,
   nested CE errors, and style extraction failures are all handled ad-hoc inside
   a 360-line `renderDsd()` function.
3. **No lifecycle hooks** — adapters cannot observe or intervene in the
   render pipeline (before render, after render, on error).
4. **Single adapter only** — `adapter-registry.ts` stores one module-level
   variable. Multiple adapters or adapter composition is impossible.
5. **Metrics are afterthoughts** — `DsdRenderCollector` exists but its output
   is never persisted or reported.

## Decision

### 1. Replace `RenderAdapter` with `RendererProtocol`

`RenderAdapter` is fully removed — no aliases, no backward compatibility.

```ts
/** Structured error from the render pipeline */
interface RenderError {
  phase: 'instantiate' | 'render' | 'nested' | 'style' | 'serialize';
  tagName: string;
  message: string;
  recoverable: boolean;
}

/** Hydration hint emitted during SSR for client-side adapter use */
interface HydrationHint {
  tagName: string;
  layer: ComponentLayer;
  events?: HydrateEventDescriptor[];
  strategy?: IslandUpgradeStrategy;
}

/** Structured output from renderDsd() */
interface RenderOutput {
  html: string;
  errors: RenderError[];
  metrics: DsdRenderMetrics;
  hydrationHints: HydrationHint[];
}

/** Adapter interface for framework-specific rendering */
interface RendererProtocol {
  /** Adapter name for diagnostics and named lookup */
  name: string;
  /** Check if a value is a template type this adapter handles */
  isTemplate?: (value: unknown) => boolean;
  /** Render a template value to HTML string */
  render?: (value: unknown, tagName: string) => Promise<string>;
  /** Extract static CSS from a component class */
  extractStyles?: (componentClass: CustomElementConstructor) => string | undefined;
}

/** Lifecycle hooks for the render pipeline */
interface RenderHooks {
  beforeRender?(input: RenderInput): void | Promise<void>;
  afterRender?(output: RenderOutput): void | Promise<void>;
  onError?(error: RenderError): void | Promise<void>;
}

/** Input to a single renderDsd() call */
interface RenderInput {
  tagName: string;
  componentClass: CustomElementConstructor;
  props: Record<string, unknown>;
  dsdOptions?: DsdOptions;
  nestingDepth: number;
}
```

### 2. `renderDsd()` returns `RenderOutput` (DEFERRED to v0.16)

> **v0.15 status**: Types (`RenderOutput`, `RenderError`, `HydrationHint`) are defined
> and exported from `@openelement/core`, but `renderDsd()` still returns `Promise<string>`.
> The return type change is deferred to v0.16 so it can be done together with
> `RenderHooks` integration — avoiding two consecutive breaking changes to the same
> function signature.

The function signature changes from:

```ts
renderDsd(...): Promise<string>
```

to:

```ts
renderDsd(...): Promise<RenderOutput>
```

No backward-compatible wrapper is provided — LessJS is pre-1.0 and breaks are
acceptable.

### 3. Split `render-dsd.ts` into focused modules

| File                    | Responsibility                                  |
| ----------------------- | ----------------------------------------------- |
| `render-dsd.ts`         | Pipeline orchestration + public API             |
| `render-instantiate.ts` | Component instantiation + prop injection        |
| `render-serialize.ts`   | Attribute serialization + DSD template wrapping |
| `render-errors.ts`      | Error types + RenderError classification        |

### 4. DSD report output (DEFERRED to v0.16)

> **v0.15 status**: `DsdRenderCollector` is implemented and `getReport()` returns
> structured metrics. However, the SSG pipeline does not yet write `dsd-report.json`.
> This is deferred to v0.16 because the report format depends on `RenderOutput`
> (§2), which is also deferred.

`DsdRenderCollector.getReport()` output is written to `dsd-report.json` during
SSG builds. The SSG CLI (`adapter-vite/src/cli/ssg-render.ts`) calls
`Deno.writeTextFile()` after all pages are rendered.

### 5. Adapter registry supports named adapters

```ts
function registerAdapter(adapter: RendererProtocol | undefined): void;
function getAdapter(name?: string): RendererProtocol | undefined;
function getRegisteredAdapters(): readonly RendererProtocol[];
```

The default adapter is the last one registered. Named lookup enables future
multi-adapter scenarios (e.g., Lit for some components, vanilla for others).

### 6. `create` CLI improvements

- Fix JSR remote version resolution (handle API errors gracefully)
- Update scaffold template to reference `@openelement/core@^0.15.0`
- Add `app/routes/about.ts` template for a more complete scaffold

### 7. `DsdOptions.customElementRegistry` simplified

Type changed from `boolean | string` to `boolean` to match the WHATWG HTML
Living Standard, where `shadowrootcustomelementregistry` is a boolean content
attribute with no value.

## Consequences

### Positive

- Structured output enables tooling (diff reports, CI gates on error count,
  hydration optimization).
- Error taxonomy makes debugging SSR failures systematic.
- Module split makes `renderDsd()` maintainable and testable.
- DSD report gives build-time visibility into rendering performance.
- Named adapters unblock future multi-adapter support without committing to it
  now.
- Clean codebase with no dead backward-compatibility code.

### Negative

- Breaking change to `renderDsd()` return type.
- Breaking change: `RenderAdapter` removed entirely — all adapters must
  implement `RendererProtocol` (add `name: string`).
- Breaking change: `DsdOptions.customElementRegistry` no longer accepts strings.
- `render-dsd.ts` split touches a core hot path — requires careful regression
  testing.

### Neutral

- `RenderHooks` are defined but not yet used in v0.15. They exist as
  extension points for v0.16 (package protocol observers).

## Validation

- [x] All existing tests pass after refactoring (54 tests, v0.15)
- [x] Types for `RenderOutput`, `RenderError`, `HydrationHint`, `RenderInput` defined and exported
- [ ] `renderDsd()` returns `RenderOutput` instead of `string` (v0.16)
- [ ] `dsd-report.json` is generated during `deno task build:ssg` (v0.16)
- [ ] `RenderHooks` wired into render pipeline (v0.16)
- [x] `deno run -A jsr:@openelement/create test-app` produces a working scaffold
- [x] `deno task typecheck && deno lint && deno fmt --check` all pass
- [x] Zero `RenderAdapter` references in codebase
