# @openelement/runtime

Runtime convenience facade for low-level openElement primitives.

Most applications should start from `@openelement/app`:

```tsx
import { defineIsland, definePage } from '@openelement/app';
```

Use `@openelement/runtime` when you need direct access to the current element
base class, signals, or stylesheet primitive in library code. ADR-0099 defines
the future public Elements direction as `@openelement/elements` and
`OpenElement`; this package remains a facade while that product surface is
implemented.

## Install

```bash
deno add jsr:@openelement/runtime
```

## Usage

```tsx
import { DsdElement, signal, StyleSheet } from '@openelement/runtime';

class MyButton extends DsdElement {
  static props = { disabled: Boolean };
  static styles = [StyleSheet.fromCss('.btn { font: inherit; }')];

  #clicks = signal(0);

  render() {
    return (
      <button
        className='btn'
        disabled={this.disabled}
        onClick={() => this.#clicks.value++}
      >
        Clicks: {this.#clicks}
      </button>
    );
  }
}

customElements.define('my-button', MyButton);
```

## Exports

From `@openelement/core`: `DsdElement`, `Fragment`, `VNode`, `isVNode`,
`renderDsdTree`, `renderToDom`, `isSignalLike`, `unwrapSignalLike`,
`ErrorBoundary`, `OpenElementError`, `escapeHtml`, `escapeAttr`, `defineIsland`,
`bindSsrProps`, `getSsrProps`.

From `@openelement/core/jsx-runtime`: `jsx`, `jsxs`, `jsxDEV`, `For`, `Show`.

From `@openelement/signals`: `signal`, `computed`, `effect`.

From `@openelement/style-sheet`: `StyleSheet`.

## License

MIT
