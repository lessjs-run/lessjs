# @lessjs/runtime

Component authoring facade (v0.27.0) — the single import for writing LessJS components.

`@lessjs/runtime` re-exports the complete authoring surface from the runtime
kernel (`@lessjs/core`), signals engine (`@lessjs/signals`), and stylesheet
abstraction (`@lessjs/style-sheet`).

**Use `@lessjs/runtime` as your only import when writing LessJS components.**

## Install

```bash
deno add jsr:@lessjs/runtime
```

## Usage

```tsx
import { DsdElement, signal, StyleSheet } from '@lessjs/runtime';

class MyButton extends DsdElement {
  static props = { disabled: Boolean };
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

export const tagName = 'my-button';
customElements.define(tagName, MyButton);
```

## Exports

From `@lessjs/core`: `DsdElement`, `Fragment`, `VNode`, `isVNode`,
`renderToString`, `renderToDom`, `isSignalLike`, `unwrapSignalLike`,
`ErrorBoundary`, `LessError`, `escapeHtml`, `escapeAttr`, `defineIsland`, `bindEvents`, `getSsrProps`.

From `@lessjs/core/jsx-runtime`: `jsx`, `jsxs`, `jsxDEV`, `For`, `Show`.

From `@lessjs/signals`: `signal`, `computed`, `effect`.

From `@lessjs/style-sheet`: `StyleSheet`.

## License

MIT
