# Migrating From Lit To DsdElement

> Current for v0.30.0.

LessJS native components use the `DsdElement` + JSX/VNode contract. Lit remains
supported at the adapter boundary, but LessJS core no longer accepts
string-returning or TemplateResult-returning components as its native public
contract.

## Quick Comparison

| Lit                          | LessJS native component            |
| ---------------------------- | ---------------------------------- |
| `LitElement`                 | `DsdElement`                       |
| `@state() count = 0`         | `count = signal(0)`                |
| `@property() name`           | `static props = { name: String }`  |
| `render() -> TemplateResult` | `render() -> VNode \| null`        |
| `@click=${handler}`          | `onClick={handler}`                |
| `static styles = css\`...\`` | `static styles = new StyleSheet()` |
| `requestUpdate()`            | signal update or `this.update()`   |

## Lit Counter

```ts
import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('my-counter')
class MyCounter extends LitElement {
  @state()
  count = 0;

  static styles = css`
    button {
      font-size: 1.5rem;
    }
  `;

  render() {
    return html`
      <button @click="${() => this.count++}">Count: ${this.count}</button>
    `;
  }
}
```

## LessJS Native Counter

```tsx
import { DsdElement, type VNode } from '@lessjs/core';
import { signal } from '@lessjs/signals';
import { StyleSheet } from '@lessjs/style-sheet';

class MyCounter extends DsdElement {
  #count = signal(0);

  static styles = new StyleSheet();

  static {
    this.styles.replaceSync(`
      button {
        font-size: 1.5rem;
      }
    `);
  }

  render(): VNode {
    return (
      <button onClick={() => this.#count.value++}>
        Count: {this.#count.value}
      </button>
    );
  }
}

customElements.define('my-counter', MyCounter);
```

## Migration Checklist

- Replace `LitElement` inheritance with `DsdElement`.
- Replace decorators with `static props` and plain class fields.
- Replace `html` templates with JSX.
- Replace Lit event expressions with JSX event props such as `onClick`.
- Replace Lit `css` templates with `StyleSheet`.
- Return `VNode | null` from native LessJS `render()`.
- Keep Lit TemplateResult values inside `@lessjs/adapter-lit`; do not pass them
  into core as native LessJS component output.
