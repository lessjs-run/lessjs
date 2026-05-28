# LessJS Core API Surface

Status: v0.24.1\
Scope: `@lessjs/core`

This page classifies the public surface of `@lessjs/core` after the v0.24.1 JSX+Signal migration (ADR-0057). The `html` tagged template DSL, `@prop()` decorator, and TemplateResult types have been removed.

## Stable Userland API

These APIs are safe for application and component authors.

| API                                      | Role                                                     | Stability rule                                           |
| ---------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| `DsdElement`                             | Zero-dependency custom element base for DSD              | Breaking lifecycle changes require migration notes.      |
| `jsx()` / `jsxs()` / `jsxDEV()`          | JSX factory functions — VNode creation                   | Return shape is frozen VNode interface.                  |
| `Fragment`                               | Symbol for grouping children without wrapper DOM         | Equivalent to `<>...</>` in JSX.                         |
| `VNode` / `isVNode()`                    | 5-field interface + type guard                           | tag/props/children/key/ref frozen until v1.0.            |
| `renderToString(vnode)`                  | VNode → HTML string for SSR/SSG                          | Skips `on*` event props; escapes text content.           |
| `renderToDOM(vnode, signal?)`            | VNode → real DOM nodes for CSR/hydration                 | Events via addEventListener; SVG via createElementNS.    |
| `static props`                           | ES2022 class fields replacing `@prop()` decorator        | `static props = { name: Type }` in DsdElement.           |
| `renderDSD()`                            | Synchronous component → DSD HTML entrypoint              | Output shape remains `RenderOutput`.                     |
| `renderDSDStream()`                      | Streaming DSD renderer entrypoint                        | Streaming chunks remain explicit.                        |
| `signal()` / `computed()` / `effect()`   | Reactive primitives (re-exported from `@lessjs/signals`) | `effect()` used by DsdElement for VNode signal tracking. |
| `StyleSheet`                             | SSR-safe stylesheet abstraction                          | May delegate to native `CSSStyleSheet` in browsers.      |
| `island()` / `lessBind()`                | Island declaration helpers                               | Strategy vocabulary: `load`, `idle`, `visible`, `only`.  |
| `MemoryIsrCache` / `createIsrCacheKey()` | ISR contract and local cache                             | Production KV adapters are v0.25 work.                   |

## Stable Data Contracts

| API                   | Role                                                                    | Stability rule                                                     |
| --------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `RenderOutput`        | `renderDSD()` result with `html`, `errors`, `metrics`, `hydrationHints` | Fields are additive unless versioned.                              |
| `RenderError`         | Machine-readable render error                                           | `code`, `severity`, `phase`, `recoverable` are gate-facing fields. |
| `DsdBuildReport`      | Build-time DSD evidence                                                 | Used by `dsd:check-report`; thresholds must be finite.             |
| `LessPackageManifest` | LessJS package metadata                                                 | Schema changes need versioned migration.                           |
| `RegistryIndex`       | Package registry output                                                 | Deterministic output required for Hub checks.                      |

## Removed in v0.24.1

| Removed API                           | Replacement                                    |
| ------------------------------------- | ---------------------------------------------- |
| `html()`                              | JSX syntax: `<div>...</div>`                   |
| `unsafeHTML()`                        | Inline JSX with trusted content                |
| `classMap()`                          | JSX className with template literals / ternary |
| `when()`                              | JSX ternary or `&&` expressions                |
| `choose()`                            | JSX switch/object-lookup or ternary            |
| `repeat()`                            | JSX `Array.map()`                              |
| `ref()`                               | JSX `ref` prop                                 |
| `@prop()` decorator                   | `static props = { name: Type }` class fields   |
| `TemplateResult` / `isTemplateResult` | `VNode` / `isVNode()`                          |
| `PropertyOptions`                     | `PropDecl` / `PropType<D>` / `PropsFrom<P>`    |
| `renderTemplateToString`              | `renderToString()`                             |
| `TemplateValue` / `AttrValue` / etc.  | Not needed — JSX handles these natively        |

## Experimental Framework API

These are real contracts, but still mostly for framework or adapter authors.

| API                                                              | Role                                                         | Constraint                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| `RendererProtocol`                                               | Adapter bridge for non-native template results               | Keep small: `isTemplate`, `render`, `extractStyles`.  |
| `registerAdapter()` / `getAdapter()` / `getRegisteredAdapters()` | Adapter registry                                             | Do not expose build orchestration through core.       |
| `ReactiveHost`                                                   | Protocol implemented by `DsdElement` for signal subscription | Framework protocol, not a general reactive runtime.   |
| CEM parser/classifier APIs                                       | Package metadata ingestion                                   | Prefer CEM-compatible data over proprietary metadata. |
| `generateAddPlan()`                                              | Less Add planning helper                                     | CLI and Hub integration surface.                      |

## Internal Or Build-Time API

These are exported for monorepo package coordination and should not be taught as first-line user APIs.

| API                                   | Role                                             | Constraint                                                             |
| ------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| virtual module IDs                    | Shared IDs for adapter/content/i18n coordination | Keep stable inside monorepo packages.                                  |
| build types                           | Avoid adapter/content circular dependencies      | Do not expand into a broad build framework.                            |
| `PropDecl` / `PropType` / `PropsFrom` | static props type system                         | TypeScript type deduction; exported for component authors who need it. |

## JSX Authoring Model (v0.24.1)

```tsx
import { DsdElement } from '@lessjs/runtime';
import { signal } from '@lessjs/runtime';

class CounterElement extends DsdElement {
  count = signal(0);

  render() {
    return (
      <button onClick={() => this.count.value++}>
        Count: {this.count}
      </button>
    );
  }
}

customElements.define('my-counter', CounterElement);
```

- JSX `{}` expressions auto-unwrap Signal values via `valueOf()` + `Symbol.toPrimitive`.
- Use `unwrap(signal)` for explicit unwrapping in edge cases (e.g., passing signal to non-JSX code).
- Event handlers (`onClick`, `onInput`) are bound via native `addEventListener` with `AbortSignal` cleanup.
- `effect()` wraps `render()` in `DsdElement._renderIntoShadowRoot()` for auto-reactive re-render.

## Core Design Decision

v0.24.1 keeps `@lessjs/core` focused on:

- DSD rendering (VNode + TemplateResult paths in parallel)
- JSX component authoring (VNode creation + SSR/CSR rendering)
- Reactive DSD host protocol (signal → effect → DOM re-render)
- Island admission evidence
- Package metadata contracts
- ISR cache key and local cache contract

It deliberately excludes auth, ORM, sessions, permissions, RPC, and deployment runtime policy.
