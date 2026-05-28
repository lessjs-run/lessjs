# @lessjs/core

Pure LessJS runtime package (v0.24.3).

`@lessjs/core` owns the platform-facing runtime primitives:

- **JSX + Signal component model** — `jsx()`, `jsxs()`, `VNode`, `renderToString()`, `renderToDOM()`
- **DsdElement** — zero-framework base class for DSD components
- **static props** — ES2022 class fields for reactive properties
- **DSD rendering** — `renderDSD()`, `renderDSDByName()`, `renderDSDStream()`
- **Unified errors** — LessError hierarchy, ErrorBoundary, telemetry
- **Signal utilities** — `isSignalLike()`, `unwrapSignalLike()`
- **Island metadata** — island detection, strategy, hydration
- **Navigation** — SPA helpers
- **SSR context** — per-request context, escaping, structured errors

It does not contain Vite, CLI, or build orchestration logic.

## Install

```bash
deno add jsr:@lessjs/core
```

## Component Authoring

```tsx
import { DsdElement, signal } from '@lessjs/runtime';

class MyButton extends DsdElement {
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
  DsdElement,
  ErrorBoundary,
  Fragment,
  getSSRProps,
  island,
  isSignalLike,
  isVNode,
  jsx,
  jsxs,
  lessBind,
  LessError,
  renderDSD,
  renderDSDByName,
  renderDSDStream,
  renderToDOM,
  renderToString,
  SsrRenderError,
  unwrapSignalLike,
  VNode,
} from '@lessjs/core';
```

## License

MIT
