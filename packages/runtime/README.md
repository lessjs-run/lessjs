# @lessjs/runtime

Component authoring facade — the single import for writing LessJS components.

`@lessjs/runtime` re-exports the complete authoring surface from the runtime
kernel (`@lessjs/core`), signals engine (`@lessjs/signals`), and stylesheet
abstraction (`@lessjs/style-sheet`).

**Use `@lessjs/runtime` as your only import when writing LessJS components.**

## Install

```bash
deno add jsr:@lessjs/runtime
```

## Usage

```ts
import { DsdElement, html, signal, StyleSheet } from '@lessjs/runtime';

export const tagName = 'my-component';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  button { cursor: pointer; }
`);

export default class MyComponent extends DsdElement {
  static override styles = styles;
  count = signal(0);

  override render() {
    return html`
      <button @click="${() => this.count.value++}">
        Count: ${this.count}
      </button>
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, MyComponent);
}
```

## Exports

| Export                   | Source Package        | Description                                  |
| ------------------------ | --------------------- | -------------------------------------------- |
| `DsdElement`             | `@lessjs/core`        | Zero-framework base class for DSD components |
| `html`                   | `@lessjs/core`        | Safe HTML template interpolation             |
| `unsafeHTML`             | `@lessjs/core`        | Mark a string as pre-sanitized HTML          |
| `isSignalLike`           | `@lessjs/core`        | Type guard for signal-like objects           |
| `isTemplateResult`       | `@lessjs/core`        | Type guard for template results              |
| `renderTemplateToString` | `@lessjs/core`        | Render a template result to string           |
| `escapeHtml`             | `@lessjs/core`        | Escape HTML special characters               |
| `escapeAttr`             | `@lessjs/core`        | Escape attribute values                      |
| `escapeAttrValue`        | `@lessjs/core`        | Escape attribute values (alias)              |
| `signal`                 | `@lessjs/signals`     | Create a writable signal                     |
| `computed`               | `@lessjs/signals`     | Create a computed (derived) signal           |
| `effect`                 | `@lessjs/signals`     | Run a side-effect when signals change        |
| `StyleSheet`             | `@lessjs/style-sheet` | Cross-environment CSSStyleSheet              |
| `SignalLike`             | `@lessjs/core`        | Signal-like interface type                   |
| `TemplateResult`         | `@lessjs/core`        | Template result type                         |
| `TemplateValue`          | `@lessjs/core`        | Template value union type                    |
| `UnsafeHtmlValue`        | `@lessjs/core`        | Unsafe HTML value type                       |
| `SafeHtml`               | `@lessjs/core`        | Safe HTML type                               |
| `UnsafeHtml`             | `@lessjs/core`        | Unsafe HTML type                             |
| `StyleSheetLike`         | `@lessjs/style-sheet` | StyleSheet interface type                    |
| `StyleSheetRule`         | `@lessjs/style-sheet` | StyleSheet rule type                         |

## Architecture

`@lessjs/runtime` is a pure re-export facade. It owns no implementation.
The canonical owners remain:

- `@lessjs/core` — runtime kernel
- `@lessjs/signals` — signals facade over alien-signals
- `@lessjs/style-sheet` — CSSStyleSheet abstraction

## License

MIT
