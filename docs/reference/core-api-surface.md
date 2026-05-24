# LessJS Core API Surface

Status: v0.21.x hardening baseline\
Scope: `@lessjs/core`

This page classifies the public surface before v0.22.0 starts. The goal is to keep the Core API useful without letting adapter internals accidentally become user contracts.

## Stable Userland API

These APIs are safe for application and component authors.

| API                                     | Role                                                         | Stability rule                                            |
| --------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| `DsdElement`                            | Zero-dependency custom element base for DSD and Reactive DSD | Breaking lifecycle changes require migration notes.       |
| `html()`                                | Safe template authoring primitive                            | Escapes interpolated values by default.                   |
| `unsafeHTML()`                          | Explicit trusted-HTML escape hatch                           | Must stay visibly unsafe and opt-in.                      |
| `renderDSD()`                           | Synchronous component-to-DSD renderer entrypoint             | Output shape remains `RenderOutput`.                      |
| `renderDSDStream()`                     | Streaming DSD renderer entrypoint                            | Streaming chunks remain explicit.                         |
| `signal()`, `computed()`, `effect()`    | Single-import reactive authoring DX                          | Re-exported from `@lessjs/signals/framework`.             |
| `StyleSheet`                            | SSR-safe stylesheet abstraction                              | May delegate to native `CSSStyleSheet` in browsers.       |
| `island()` and `lessBind()`             | Island declaration helpers                                   | Strategy vocabulary is `load`, `idle`, `visible`, `only`. |
| `MemoryIsrCache`, `createIsrCacheKey()` | v0.21 ISR contract and local cache                           | Production KV adapters are v0.22 work, not v0.21.x scope. |

## Stable Data Contracts

| API                   | Role                                                                    | Stability rule                                                         |
| --------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `RenderOutput`        | `renderDSD()` result with `html`, `errors`, `metrics`, `hydrationHints` | Fields are additive unless versioned.                                  |
| `RenderError`         | Machine-readable render error                                           | `code`, `severity`, `phase`, and `recoverable` are gate-facing fields. |
| `DsdBuildReport`      | Build-time DSD evidence                                                 | Used by `dsd:check-report`; thresholds must be finite.                 |
| `LessPackageManifest` | LessJS package metadata                                                 | Schema changes need versioned migration.                               |
| `RegistryIndex`       | Package registry output                                                 | Deterministic output required for Hub checks.                          |

## Experimental Framework API

These are real contracts, but they are still mostly framework or adapter author surfaces.

| API                                                            | Role                                                         | Constraint                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| `RendererProtocol`                                             | Adapter bridge for non-native template results               | Keep small: `isTemplate`, `render`, `extractStyles`.  |
| `registerAdapter()`, `getAdapter()`, `getRegisteredAdapters()` | Adapter registry                                             | Do not expose build orchestration through core.       |
| `ReactiveHost`                                                 | Protocol implemented by `DsdElement` for signal subscription | Framework protocol, not a general reactive runtime.   |
| CEM parser/classifier APIs                                     | Package metadata ingestion                                   | Prefer CEM-compatible data over proprietary metadata. |
| `generateAddPlan()`                                            | Less Add planning helper                                     | CLI and Hub integration surface.                      |

## Internal Or Build-Time API

These are exported for monorepo package coordination and should not be taught as first-line user APIs.

| API                          | Role                                             | Constraint                                                           |
| ---------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| virtual module IDs           | Shared IDs for adapter/content/i18n coordination | Keep stable inside monorepo packages.                                |
| build types                  | Avoid adapter/content circular dependencies      | Do not expand into a broad build framework.                          |
| low-level security constants | Internal validation support                      | Document user-facing safety through `html` and `unsafeHTML` instead. |

## Deprecated Compatibility API

`HydrateEventDescriptor` is retained as a compatibility type only. The v0.21 event model is `html` template event binding:

```ts
render() {
  return html`<button @click=${this.handleClick}>Save</button>`;
}
```

Do not add new examples or generated code using `hydrateEvents`.

## Core API Design Decision

The v0.21.x rule is: only stabilize contracts that are useful across standards-shaped Web Component rendering. Full-stack conveniences remain outside core unless they are backed by a reusable platform boundary.

This keeps `@lessjs/core` focused on:

- DSD rendering
- safe template authoring
- Reactive DSD host protocol
- island admission evidence
- package metadata contracts
- ISR cache key and local cache contract

It deliberately excludes auth, ORM, sessions, permissions, RPC, and deployment runtime policy.
