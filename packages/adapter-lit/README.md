# @lessjs/adapter-lit

Lit 适配器 — 在 LessJS SSR 管线中渲染 Lit 模板为 Declarative Shadow DOM。

## 安装

```bash
deno add jsr:@lessjs/adapter-lit
```

## 导出路径

```json
{
  ".": "./src/index.ts",             // 适配器 + DSD Mixin
  "./ssr": "./src/ssr.ts",           // SSR 转换工具
  "./dsd-hydration": "./src/dsd-hydration.ts" // DSD Hydration Mixin
}
```

## `.` — 主入口

```ts
// 安装/卸载 Lit SSR 适配器
import { installLitAdapter, uninstallLitAdapter } from '@lessjs/adapter-lit';

installLitAdapter(); // 注册 Lit TemplateResult → DSD HTML 转换

// Lit TemplateResult 检测
import { isLitTemplateResult, renderLitToString } from '@lessjs/adapter-lit';

// DSD Hydration
import { DsdLitElement, WithDsdHydration } from '@lessjs/adapter-lit';
import type { DsdHydration, DsdHydrationMixin } from '@lessjs/adapter-lit';
```

## 功能

- **Lit TemplateResult SSR**：将 `html` 模板字面量渲染为 DSD HTML。无 @lit-labs/ssr 依赖，产生干净的 DSD HTML（不含 <!--lit-part--> 标记）。
- **属性绑定保留**：`.prop=${val}` 转换为 kebab-case HTML 属性 + JSON 序列化
- **安全转义**：复用 `@lessjs/core` 的 `escapeHtml` / `escapeAttrValue`
- **WithDsdHydration Mixin**：桥接 DSD hydration gap，消除重复渲染

## 使用

```ts
// vite.config.ts — 注册 Lit 适配器
import { installLitAdapter } from '@lessjs/adapter-lit';
import { less } from '@lessjs/adapter-vite';
import { defineConfig } from 'vite';

installLitAdapter();

export default defineConfig({
  plugins: [less({ routesDir: 'app/routes' })],
});
```

### DSD Interactive 组件

```ts
import { DsdLitElement } from '@lessjs/adapter-lit';

class MyToggle extends DsdLitElement {
  static hydrateEvents = [
    { selector: 'button.toggle', event: 'click', method: '_handleToggle' },
  ];

  _handleToggle() {
    this.classList.toggle('active');
  }

  render() {
    return html`<button class="toggle">Toggle</button>`;
  }
}
customElements.define('my-toggle', MyToggle);
```

### WithDsdHydration Mixin（组合模式）

```ts
import { LitElement, html } from 'lit';
import { WithDsdHydration } from '@lessjs/adapter-lit';

class MyComponent extends WithDsdHydration(LitElement) {
  // ...
}
```

## `./ssr` — SSR 工具

```ts
import { installLitAdapter, uninstallLitAdapter, isLitTemplateResult, renderLitToString } from '@lessjs/adapter-lit/ssr';
```

`installLitAdapter()` 会 patch `@lessjs/core` 的渲染管线以识别和处理 Lit `TemplateResult` 值。在 SSR bundle 入口中调用一次即可。

## 架构

```
@lessjs/core        renderDSD() — 只接受 render(): string
@lessjs/adapter-lit 将 TemplateResult → string
@lessjs/ui          LitElement 组件（Lit + 设计令牌）
```

## 许可

MIT
