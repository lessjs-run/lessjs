# @lessjs/ui

LessJS UI 组件库 — 基于 Lit + Declarative Shadow DOM 的 Web Components。

## 安装

```bash
deno add jsr:@lessjs/ui
```

## 导出路径

```json
{
  ".": "./src/index.ts",                     // 所有组件 + 入口
  "./less-button": "./src/less-button.ts",
  "./less-input": "./src/less-input.ts",
  "./less-card": "./src/less-card.ts",
  "./less-code-block": "./src/less-code-block.ts",
  "./less-layout": "./src/less-layout.ts",
  "./less-theme-toggle": "./src/less-theme-toggle.ts",
  "./less-hero-ping": "./src/less-hero-ping.ts",
  "./less-dialog": "./src/less-dialog.ts",
  "./design-tokens": "./src/design-tokens.ts",
  "./tokens/colors": "./src/tokens/colors.ts",
  "./tokens/color-values": "./src/tokens/color-values.ts"
}
```

## 组件清单

| 组件 | 标签名 | 说明 |
|------|--------|------|
| LessButton | `less-button` | 按钮（formAssociated, :state(disabled)） |
| LessInput | `less-input` | 输入框（:state(invalid), ARIA） |
| LessCard | `less-card` | 卡片容器 |
| LessCodeBlock | `less-code-block` | 代码块（Prism 高亮 + 复制） |
| LessLayout | `less-layout` | 页面布局（sidebar + header + footer） |
| LessThemeToggle | `less-theme-toggle` | Dark/Light 主题切换 |
| LessHeroPing | `less-hero-ping` | API 状态指示器 |
| LessDialog | `less-dialog` | 原生 dialog + ::backdrop + inert |

## 使用

```ts
// vite.config.ts — 注册三方 Island
import { less } from '@lessjs/adapter-vite';

export default defineConfig({
  plugins: [
    less({
      packageIslands: ['@lessjs/ui'],
    }),
  ],
});
```

```html
<less-button variant="primary" type="submit">Submit</less-button>
<less-input label="Email" type="email" required></less-input>
<less-theme-toggle></less-theme-toggle>
```

## 设计令牌

所有组件使用 CSS 自定义属性，支持 Dark/Light 主题切换：

```ts
import { lessRootColorCSS } from '@lessjs/ui/tokens/colors';
```

## 许可

MIT
