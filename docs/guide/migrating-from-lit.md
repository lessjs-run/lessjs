# 从 Lit 迁移到 DsdElement + Signals

## 快速对照

| Lit | DsdElement + Signals |
|-----|---------------------|
| `LitElement` | `DsdElement` |
| `@state() count = 0` | `#count = signal(0)` |
| `@property() name` | `signal('')` + `attributeChangedCallback` |
| `render()` → TemplateResult | `render()` → `html\`...\`` |
| `@click=${handler}` | `@click=${handler}` (相同!) |
| `static styles = css\`...\`` | `static styles = new StyleSheet()` |
| `firstUpdated()` | `connectedCallback()` |
| `updated()` | signal.subscribe() |
| `requestUpdate()` | `this.update()` |

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

1. **无装饰器**：DsdElement 用原生 JS private field `#name = signal(value)`
2. **无 @property()**：attribute→signal 映射需要手动在 attributeChangedCallback 中处理
3. **CSS 用 StyleSheet**：`new StyleSheet()` + `replaceSync()` 替代 Lit `css\`...\``
4. **无 updated()**：信号变化通过 microtask 批处理自动触发 _patchBindings()
5. **render() 返回类型**：`string | TemplateResult`，比 Lit 的 `TemplateResult` 更灵活

## 迁移检查清单

- [ ] 基类：`LitElement` → `DsdElement`
- [ ] 状态：`@state()` → `#field = signal(init)`
- [ ] 属性：`@property()` → `signal()` + `attributeChangedCallback`
- [ ] 模板：Lit `html` → `@lessjs/core` `html`
- [ ] 事件：`@click=${fn}`（相同语法！）
- [ ] 样式：`css\`...\`` → `new StyleSheet()` + `replaceSync()`
- [ ] 生命周期：`firstUpdated()` → `connectedCallback()`
- [ ] 手动刷新：`requestUpdate()` → `this.update()`
