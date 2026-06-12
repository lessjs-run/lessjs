# @openelement/core

Advanced openElement runtime kernel.

Most users should start from `@openelement/app`, `@openelement/elements`, or
`@openelement/ui`. `@openelement/core` owns low-level primitives used by those
products:

- JSX and VNode runtime primitives.
- DSD rendering through `renderDsd()` and `renderDsdStream()`.
- The `OpenElement` Elements authoring API, backed by the existing
  `DsdElement` implementation.
- Static props, event hydration, island metadata, and SSR context helpers.
- Unified errors, signal-like utilities, and DOM rendering helpers.

ADR-0102 defines `@openelement/elements` and `OpenElement` as the first-run
Elements package and authoring name. v0.40 keeps `DsdElement` and the
`@openelement/core` `OpenElement` export for compatibility while new component
authoring docs should start from `@openelement/elements`.

This package does not contain Vite, CLI, or build orchestration logic.

## Install

```bash
deno add jsr:@openelement/core
```

## Low-Level Component Authoring

Prefer `@openelement/elements` for new components. This core import path remains
available for compatibility and framework internals.

```tsx
import { OpenElement } from '@openelement/elements';
import { signal } from '@openelement/signals';

class MyButton extends OpenElement {
  static props = { variant: String, disabled: Boolean };
  #clicks = signal(0);

  render() {
    return (
      <button
        className={this.variant === 'primary' ? 'btn btn-primary' : 'btn'}
        disabled={this.disabled}
        onClick={() => this.#clicks.value++}
      >
        Clicks: {this.#clicks}
      </button>
    );
  }
}
```

## Public API

`DsdElement` is a v0.40 compatibility export, not the first-run Elements name.

```ts
import {
  bindSsrProps,
  defineIsland,
  DsdElement,
  ErrorBoundary,
  Fragment,
  getSsrProps,
  isSignalLike,
  isVNode,
  OpenElement,
  OpenElementError,
  renderDsd,
  renderDsdStream,
  renderToDom,
  SsrRenderError,
  unwrapSignalLike,
  VNode,
} from '@openelement/core';
```

## License

MIT
