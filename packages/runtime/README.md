# @openelement/runtime

Component authoring facade: the single import for writing LessJS components.

`@openelement/runtime` re-exports the complete authoring surface from the runtime
kernel (`@openelement/core`), signals engine (`@openelement/signals`), and stylesheet
abstraction (`@openelement/style-sheet`).

**Use `@openelement/runtime` as your only import when writing LessJS components.**

## Install

```bash
deno add jsr:@openelement/runtime
```

## Usage

```tsx
import { DsdElement, signal, StyleSheet } from '@openelement/runtime';

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

From `@openelement/core`: `DsdElement`, `Fragment`, `VNode`, `isVNode`,
`renderDsdTree`, `renderToDom`, `isSignalLike`, `unwrapSignalLike`,
`ErrorBoundary`, `LessError`, `escapeHtml`, `escapeAttr`, `defineIsland`, `bindEvents`, `getSsrProps`.

From `@openelement/core/jsx-runtime`: `jsx`, `jsxs`, `jsxDEV`, `For`, `Show`.

From `@openelement/signals`: `signal`, `computed`, `effect`.

From `@openelement/style-sheet`: `StyleSheet`.

## License

MIT
