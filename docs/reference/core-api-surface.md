# LessJS Core API Surface — v0.24.3 (HARDENED)

> Status: **HARDENED**\
> Version: v0.24.3\
> Scope: `@lessjs/core` public exports\
> Last hardened: 2026-05-29

This page is the **authoritative API surface reference**. Any API listed here
must not be removed or changed in signature without an ADR. Any API not listed
here is either internal or removed.

---

## Component Authoring

| API                     | Signature                              | Stability                         |
| ----------------------- | -------------------------------------- | --------------------------------- |
| `DsdElement`            | `class DsdElement extends HTMLElement` | HARDENED                          |
| `render()`              | `(): string \| VNode`                  | HARDENED — TemplateResult removed |
| `static props`          | `static props = { name: PropDecl }`    | HARDENED                          |
| `_getLocale(fallback?)` | `(fallback?: string): string`          | STABLE                            |
| `onDsdHydrated()`       | `(): void`                             | STABLE                            |
| `onCsrRendered()`       | `(): void`                             | STABLE                            |

## JSX Runtime

| API                               | Signature                            | Stability                 |
| --------------------------------- | ------------------------------------ | ------------------------- |
| `jsx(tag, props, ...children)`    | `(tag, props?, ...children): VNode`  | HARDENED                  |
| `jsxs(tag, props, children)`      | `(tag, props, children): VNode`      | HARDENED                  |
| `jsxDEV(tag, props, ...children)` | `(tag, props?, ...children): VNode`  | HARDENED                  |
| `Fragment`                        | `unique symbol`                      | HARDENED                  |
| `VNode`                           | `{ tag, props, children, key, ref }` | HARDENED — 5-field frozen |
| `isVNode(value)`                  | `(unknown): value is VNode`          | HARDENED                  |
| `renderToString(vnode)`           | `(VNode): string`                    | HARDENED                  |
| `renderToDOM(vnode, signal?)`     | `(VNode, AbortSignal?): Node`        | HARDENED                  |

## Signal Utilities

| API                       | Signature                                          | Stability |
| ------------------------- | -------------------------------------------------- | --------- |
| `SignalLike<T>`           | `{ readonly value: T; subscribe(fn): () => void }` | HARDENED  |
| `isSignalLike(value)`     | `(unknown): value is SignalLike`                   | HARDENED  |
| `unwrapSignalLike(value)` | `<T>(T): T extends SignalLike<infer V> ? V : T`    | HARDENED  |

## DSD Rendering

| API                                     | Signature                                                         | Stability |
| --------------------------------------- | ----------------------------------------------------------------- | --------- |
| `renderDSD(components, options?)`       | `(RenderDSDComponent[], RenderDSDOptions?): RenderOutput`         | HARDENED  |
| `renderDSDStream(components, options?)` | `(RenderDSDComponent[], RenderDSDStreamOptions?): ReadableStream` | STABLE    |

## Islands

| API                                | Signature                                            | Stability |
| ---------------------------------- | ---------------------------------------------------- | --------- |
| `island(tagName, Class, options?)` | `(string, Constructor, IslandOptions?): Constructor` | HARDENED  |
| `lessBind(host)`                   | `(HTMLElement): LessBindResult`                      | STABLE    |
| `getSSRProps(el)`                  | `(HTMLElement): Record<string, unknown>`             | STABLE    |

## Navigation

| API                         | Signature                                          | Stability |
| --------------------------- | -------------------------------------------------- | --------- |
| `navigate(url, options?)`   | `(string, NavigateOptions?): Promise<void>`        | STABLE    |
| `onNavigate(callback)`      | `(fn: (url: string) => void): () => void`          | STABLE    |
| `matchRoute(pattern, path)` | `(string, string): Record<string, string> \| null` | STABLE    |
| `hasNavigationApi()`        | `(): boolean`                                      | STABLE    |

## Error Handling

| API                   | Signature                                 | Stability |
| --------------------- | ----------------------------------------- | --------- |
| `ErrorBoundary`       | `abstract class extends DsdElement`       | STABLE    |
| `LessError`           | `{ code, severity, phase, message, ... }` | STABLE    |
| `RenderError`         | `extends LessError`                       | STABLE    |
| `SsrRenderError`      | `extends LessError`                       | STABLE    |
| `BuildError`          | `extends LessError`                       | STABLE    |
| `IslandRenderError`   | `extends LessError`                       | STABLE    |
| `NavigationError`     | `extends LessError`                       | STABLE    |
| `PropValidationError` | `extends LessError`                       | STABLE    |

## HTML Escaping

| API                      | Signature           | Stability |
| ------------------------ | ------------------- | --------- |
| `escapeHtml(str)`        | `(string): string`  | HARDENED  |
| `escapeAttr(value)`      | `(string): string`  | HARDENED  |
| `escapeAttrValue(value)` | `(unknown): string` | HARDENED  |

## Tag Validation

| API                    | Signature           | Stability                               |
| ---------------------- | ------------------- | --------------------------------------- |
| `isValidTagName(name)` | `(string): boolean` | HARDENED — includes reserved name check |

## Logging

| API                  | Signature                      | Stability |
| -------------------- | ------------------------------ | --------- |
| `createLogger(name)` | `(string): LessLogger`         | STABLE    |
| `LessLogger`         | `{ info, warn, error, debug }` | STABLE    |
| `LogLevel`           | `enum`                         | STABLE    |

## Data Contracts (Types)

| API                        | Role                                                         | Stability |
| -------------------------- | ------------------------------------------------------------ | --------- |
| `RenderOutput`             | `renderDSD()` result                                         | HARDENED  |
| `RenderError`              | Machine-readable error                                       | HARDENED  |
| `DsdBuildReport`           | Build-time DSD evidence                                      | HARDENED  |
| `LessPackageManifest`      | Package metadata                                             | HARDENED  |
| `ComponentLayer`           | `'dsd-static' \| 'dsd-interactive' \| 'pure-island'`         | HARDENED  |
| `HydrationStrategy`        | `'load' \| 'idle' \| 'visible' \| 'only'`                    | HARDENED  |
| `StrategySource`           | `'directive' \| 'island-options' \| 'manifest' \| 'default'` | HARDENED  |
| `ManifestDecision`         | SSR admission decision                                       | HARDENED  |
| `SsrAdmissionDecision`     | Per-tag SSR decision                                         | HARDENED  |
| `ValidationResult`         | Manifest validation result                                   | HARDENED  |
| `ValidationError`          | Validation error                                             | HARDENED  |
| `ValidationWarning`        | Validation warning                                           | HARDENED  |
| `ValidationDiagnostic`     | Single diagnostic                                            | HARDENED  |
| `ValidatedTag`             | Per-tag validation                                           | HARDENED  |
| `ManifestValidationReport` | Full validation report                                       | HARDENED  |

## Removed in v0.24.x

| Removed                     | In      | Replacement              |
| --------------------------- | ------- | ------------------------ |
| `html()`                    | v0.24.1 | JSX `<div>...</div>`     |
| `unsafeHTML()`              | v0.24.1 | Inline JSX               |
| `classMap()`                | v0.24.1 | JSX className ternary    |
| `when()`                    | v0.24.1 | JSX ternary / `&&`       |
| `choose()`                  | v0.24.1 | JSX switch/object-lookup |
| `repeat()`                  | v0.24.1 | JSX `Array.map()`        |
| `ref()` (template DSL)      | v0.24.1 | JSX `ref` prop           |
| `@prop()` decorator         | v0.24.1 | `static props`           |
| `TemplateResult`            | v0.24.3 | `VNode`                  |
| `isTemplateResult`          | v0.24.3 | `isVNode()`              |
| `renderTemplateToString`    | v0.24.3 | `renderToString()`       |
| `template.ts` (entire file) | v0.24.3 | —                        |
| `filterFrameworkNav`        | v0.24.3 | `filterDocsNav`          |
| `filterEngineNav`           | v0.24.3 | `filterArchitectureNav`  |
| `filterRegistryNav`         | v0.24.3 | `filterHubNav`           |

## Stability Levels

| Level        | Meaning                                                            |
| ------------ | ------------------------------------------------------------------ |
| **HARDENED** | Will not change signature or behavior without ADR + migration path |
| **STABLE**   | May add optional params; breaking changes require release notes    |
| **INTERNAL** | Not listed here; may change at any time                            |
