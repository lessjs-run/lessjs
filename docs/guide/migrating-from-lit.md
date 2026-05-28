# 从 Lit 迁移到 DsdElement + Signals (v0.24.1)

## 快速对照

| Lit                          | DsdElement + Signals (v0.24.1+)        |
| ---------------------------- | -------------------------------------- |
| `LitElement`                 | `DsdElement`                           |
| `@state() count = 0`         | `count = signal(0)`                    |
| `@property() name`           | `static props = { name: String }`      |
| `render()` → TemplateResult  | `render()` → JSX (VNode)               |
| `@click=${handler}`          | `onClick={handler}`                    |
| `static styles = css\`...\`` | `static styles = new StyleSheet()`     |
| `firstUpdated()`             | `connectedCallback()`                  |
| `updated()`                  | `effect()` auto-tracking               |
| `requestUpdate()`            | `this.update()` or signal auto-trigger |

## 示例对照

### Lit Counter

```ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('my-counter')
class MyCounter extends LitElement {
  @state() count = 0;
  static styles = css\`button { font-size: 1.5rem; }\`;
  render() {
    return html\`<button @click=\${() => this.count++}>Count: \${this.count}</button>\`;
  }
}
```

### DsdElement Counter

```ts
import { DsdElement, html, signal, StyleSheet } from '@lessjs/core';

class MyCounter extends DsdElement {
  #count = signal(0);
  static styles = new StyleSheet();
  static { this.styles.replaceSync('button { font-size: 1.5rem; }'); }
  render() {
    return html\`<button @click=\${() => this.#count.value++}>Count: \${this.#count}</button>\`;
  }
}
customElements.define('my-counter', MyCounter);
```

## 关键差异

1. **static props 替代装饰器**：`static props = { name: String }` 替代 `@property()`
2. **JSX 替代 html 模板**：`render()` 返回 JSX（VNode），不再使用 `html\`...\``
3. **CSS 用 StyleSheet**：`new StyleSheet()` + `replaceSync()` 替代 Lit `css\`...\``
4. **effect() 自动追踪**：信号变化通过 `effect()` 自动触发 VNode re-render（替代 _patchBindings）
5. **事件绑定**：`onClick={handler}` 替代 `@click=${handler}`，底层原生 addEventListener
6. **render() 返回类型**：`string | VNode`

## 迁移检查清单

- [ ] 基类：`LitElement` → `DsdElement`
- [ ] 状态：`@state()` → `field = signal(init)`
- [ ] 属性：`@property()` → `static props = { name: Type }`
- [ ] 模板：Lit `html` → LessJS JSX (`<div>...</div>`)
- [ ] 事件：`@click=${fn}` → `onClick={fn}`
- [ ] 样式：`css\`...\``→`new StyleSheet()`+`replaceSync()`
- [ ] 生命周期：`firstUpdated()` → `connectedCallback()`
- [ ] 刷新：`requestUpdate()` → 信号变化自动触发或 `this.update()`
