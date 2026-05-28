# @lessjs/runtime

Component authoring facade (v0.24.3) — the single import for writing LessJS components.

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

From `@lessjs/core`: `DsdElement`, `jsx`, `jsxs`, `Fragment`, `VNode`, `isVNode`,
`renderToString`, `renderToDOM`, `isSignalLike`, `unwrapSignalLike`,
`ErrorBoundary`, `LessError`, `escapeHtml`, `escapeAttr`, `island`, `lessBind`.

From `@lessjs/signals`: `signal`, `computed`, `effect`.

From `@lessjs/style-sheet`: `StyleSheet`.

## License

MIT
