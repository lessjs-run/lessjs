# @openelement/core

Advanced openElement runtime kernel.

Most users should start from `@openelement/app`, `@openelement/ui`, or the
future Elements product surface. `@openelement/core` owns low-level primitives
used by those products:

- JSX and VNode runtime primitives.
- DSD rendering through `renderDsd()` and `renderDsdStream()`.
- The `OpenElement` Elements authoring API, backed by the existing
  `DsdElement` implementation.
- Static props, event hydration, island metadata, and SSR context helpers.
- Unified errors, signal-like utilities, and DOM rendering helpers.

ADR-0099 defines the public Elements direction as `@openelement/elements` and
`OpenElement`. v0.40 exposes `OpenElement` as the product-facing authoring name
while the implementation remains compatible with `DsdElement`.

This package does not contain Vite, CLI, or build orchestration logic.

## Install

```bash
deno add jsr:@openelement/core
```

## Component Authoring

```tsx
import { OpenElement } from '@openelement/core';
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
