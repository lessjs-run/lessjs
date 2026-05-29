# Current Architecture — v0.24.3

> Status: **CURRENT (HARDENED)**\
> Version line: v0.24.3\
> Governing decisions: ADR-0057 (JSX+Signal), ADR-0058 (TemplateResult removal)\
> Last hardened: 2026-05-29

## Architecture Center

LessJS is a **DSD-first Web Components application framework**.

The architecture is designed around deterministic output:

- static-first rendering;
- Declarative Shadow DOM;
- explicit island upgrade boundaries;
- package metadata instead of runtime guessing;
- generated projects as release artifacts;
- package graph gates before publish.

LessJS is not trying to become a generic server framework. Hono, Vite, Deno,
JSR, and Web Platform APIs are the substrate. LessJS owns the Web Component and
DSD application layer above that substrate.

## Layer Model

```text
tools and release gates
  create, package graph checker, publish workflow, smoke tests,
  docs:check-current, dist:check-object-object

product facades
  app configuration facade, runtime authoring facade

build adapters
  adapter-vite, SSG phases, Vite integration, generated source

framework adapters
  adapter-lit, adapter-react, adapter-vanilla

feature packages
  content, i18n, hub, ui, cem, compat-check

implementation packages
  signals (facade over alien-signals), style-sheet (cross-env CSSStyleSheet)

runtime kernel
  core: DsdElement, JSX runtime, renderDsd, islands, navigation, logger,
  static props, error boundary, signal-like utilities, tag validation

protocols
  shared build contracts, virtual ids, future diagnostics/schema primitives
```

Dependencies must point downward or sideways through explicit protocols. A
feature package must not depend on an adapter implementation just to share a
type. The runtime kernel must not import a concrete reactive engine or build
adapter.

## Current Packages (18 total)

| Package                   | Role                                | Key fact                          |
| ------------------------- | ----------------------------------- | --------------------------------- |
| `@lessjs/core`            | runtime kernel                      | DSD+JSX+VNode; 0 npm dependencies |
| `@lessjs/protocols`       | shared contracts                    | zero-dependency pure types        |
| `@lessjs/signals`         | signal facade over `alien-signals`  | owns public signal contract       |
| `@lessjs/style-sheet`     | CSSStyleSheet cross-env abstraction | browser=zero-overhead, SSR=shim   |
| `@lessjs/adapter-vite`    | Vite adapter + SSG                  | owns build pipeline               |
| `@lessjs/app`             | configuration facade                | single Vite config entry          |
| `@lessjs/content`         | content feature                     | markdown, nav, blog, sitemap      |
| `@lessjs/i18n`            | i18n feature                        | locale data + static path helpers |
| `@lessjs/ui`              | DSD component library               | 10 components, all JSX            |
| `@lessjs/cem`             | CEM parser                          | canonical CEM shape owner         |
| `@lessjs/compat-check`    | compatibility classifier            | canonical compatibility owner     |
| `@lessjs/hub`             | registry + trust evidence           | Playwright real-browser snapshots |
| `@lessjs/create`          | project scaffolding                 | generated project contract        |
| `@lessjs/rpc`             | RPC primitives                      | zero-dependency utility           |
| `@lessjs/runtime`         | authoring facade                    | single-import convenience         |
| `@lessjs/adapter-lit`     | Lit interop                         | Lit TemplateResult → DSD          |
| `@lessjs/adapter-react`   | React interop                       | React tree → DSD                  |
| `@lessjs/adapter-vanilla` | vanilla WC interop                  | HTMLElement → DSD                 |

## Component Model (v0.24.3)

As of v0.24.3 (ADR-0058), **only two render paths exist**:

```typescript
class MyComponent extends DsdElement {
  render(): string | VNode {
    // JSX — the primary authoring model
    return <div class='my-component'>Hello</div>;

    // string — low-level DSD escape hatch
    return '<div class="my-component">Hello</div>';
  }
}
```

**TemplateResult is removed.** The `html` tagged template DSL, `@prop()`
decorator, and all TemplateResult-related types no longer exist.

Reactive updates use `effect()` for VNode signal tracking. The old
`_patchBindings()` fine-grained patching system is removed.

## DsdElement Render Pipeline

```
render() → string | VNode
              │
    ┌─────────┴──────────┐
    │                    │
  string              VNode
    │                    │
  innerHTML          renderToDom()
  (platform)         (JSX→DOM, events, SVG ns)
                         │
                    effect() for signal tracking
```

## Why `@lessjs/protocols` Exists

`content` and `i18n` need to communicate with the build context, but must not
import `@lessjs/adapter-vite` internals. `@lessjs/protocols` owns these
dependency-light contracts: build context interfaces, virtual module ids,
and future diagnostic shapes.

## Why `@lessjs/core` Must Stay Small

Core owns: DsdElement, JSX runtime, renderDsd, islands, navigation, logger,
static props, error boundary, signal-like utilities.

Core must NOT own: Vite build contracts, virtual module ids, signal engine
implementation, CEM parser, compatibility classifier, single-import convenience.

## Why Signals Are A Facade

LessJS wraps `alien-signals` — it does not own the low-level algorithm.
The `@lessjs/signals` facade provides: `.value` R/W, `subscribe()`,
`effect()` for VNode tracking, `signal()`, `computed()`.

## Type Canonicalization (SOP-002)

12 types that were duplicated across 2-3 packages are now canonical at
`@lessjs/core`:

| Type                                                                                    | Previously duplicated in                              |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `SignalLike`, `isSignalLike`                                                            | `core/template.ts` (deleted)                          |
| `ManifestDecision`, `SsrAdmissionDecision`                                              | `compat-check`, `adapter-vite`                        |
| `ValidationResult/Error/Warning/Diagnostic`, `ValidatedTag`, `ManifestValidationReport` | `compat-check`                                        |
| `ComponentLayer`, `HydrationStrategy`                                                   | `cem`, `compat-check`                                 |
| `StrategySource`                                                                        | `compat-check`, `adapter-vite`                        |
| `isValidTagName`                                                                        | `cem`, `compat-check` (two different impls → unified) |

## Release Gates

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
deno task graph:check
deno task docs:check-current
deno task dist:check-object-object
```

## No Backward Compatibility

v0.23-v0.24 is an architecture transformation phase. Breaking import moves and
API removals are acceptable when they reduce architecture debt and are
documented.

## Next Architecture Work (v0.24.4)

1. Declarative build pipeline API
2. Type-safe route parameters
3. ssg-render.ts + entry-renderer.ts decomposition
