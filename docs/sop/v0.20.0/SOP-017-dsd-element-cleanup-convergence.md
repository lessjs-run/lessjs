# SOP-017: DsdElement Cleanup Convergence

> Version: v0.20.0\
> Date: 2026-05-22\
> Scope: DsdElement contract, first-party UI components, www docs, Registry Hub data\
> Status: IMPLEMENTED

## Objective

Close the remaining gap between the v0.20 Ocean-Island architecture and the
actual public/code surface:

1. DsdElement owns the common re-render path for native DSD components.
2. First-party UI and Ocean components stop duplicating shadow DOM replacement
   logic.
3. Public route examples no longer mix Lit imports with DsdElement classes.
4. Registry generated data is synchronized with scanner source metadata.

## Non-Goals

- Do not remove `@lessjs/adapter-lit`; it remains the compatibility and pure
  island path.
- Do not migrate high-state islands that intentionally use Lit.
- Do not rewrite historical changelog or ADR examples that document previous
  versions.

## Cleanup Rules

### 1. DsdElement Update Contract

`DsdElement` provides:

- `update()` for synchronous string-rendered shadow DOM refresh.
- `requestUpdate()` as a tiny ReactiveController-compatible alias.
- Rebinding of `static hydrateEvents` after every update.

Components should call `this.update()` instead of repeating:

```ts
this.shadowRoot.innerHTML = this.render();
this._hydrateEvents();
```

### 2. UI Component Convergence

The following first-party components use the shared update contract:

- `less-button`
- `less-callout`
- `less-step-card`
- `less-toc`

Any future DsdElement component that needs full re-render should use the same
method.

### 3. Documentation Examples

Current framework examples should prefer:

```ts
import { DsdElement } from '@lessjs/core';

export class Page extends DsdElement {
  render(): string {
    return `<main>Hello</main>`;
  }
}
```

Do not teach `html`, `LitElement`, or `DsdLitElement` as the default for Ocean
or page components.

### 4. Registry Hub Data

After changing `packages/hub/src/scanner.ts`, run:

```sh
deno task hub:scan
deno task hub:validate --strict --json
deno task hub:check-index
```

Generated Registry data must not claim first-party UI is based on
`DsdLitElement`.

## Verification Checklist

- `deno fmt --check`
- `deno task lint`
- `deno task typecheck`
- `deno test packages/core/__tests__/dsd-element.test.ts`
- `deno task hub:validate --strict --json`
- `deno task hub:check-index`
- `deno task docs:check-strategy`
- `deno task test`
- `deno task build`
- `deno task dsd:check-report`

## Residual Boundaries

Lit references are acceptable only in:

- `packages/adapter-lit`
- adapter compatibility tests
- pure island examples or historical docs
- older changelog/ADR sections that describe past releases

They are not acceptable in current Ocean component source, current page
component examples, or first-party Hub metadata.
