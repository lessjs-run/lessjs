# @lessjs/create

LessJS 项目脚手架。一键创建 Deno-first、DSD + Island 架构的全栈项目。

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app
deno task dev
```

## 生成的项目结构

```
my-app/
├── deno.json              # 开发/构建任务
├── vite.config.ts         # LessJS 插件配置（含 @lessjs/ui）
├── app/
│   ├── routes/
│   │   └── index.ts       # 首页（LitElement）
│   └── islands/
│       └── my-counter.ts  # 交互 Island 示例
```

## 生成配置

模板包含：

- **`packageIslands: ['@lessjs/ui']`** — 从 JSR 引入预构建 UI 组件
- **`ssr: { noExternal: ['@lessjs/ui'] }`** — 确保 UI 组件被 SSR 打包
- 一个带计数器 Island 的首页

## 构建管线

```bash
deno task dev        # 开发服务器，带 HMR
deno task build      # 生产构建（SSR + client + SSG）
```

## 添加更多 Islands

在 `app/islands/` 中创建文件：

```ts
import { html, LitElement } from 'lit';

export const tagName = 'my-greeting';

export default class MyGreeting extends LitElement {
  static override properties = { name: { type: String } };
  declare name: string;

  constructor() {
    super();
    this.name = 'World';
  }

  override render() {
    return html`
      <p>Hello, ${this.name}!</p>
    `;
  }
}

if (!customElements.get(tagName)) {
  customElements.define(tagName, MyGreeting);
}
```

在任何路由页面中使用：

```ts
render() {
  return html`<my-greeting name="LessJS"></my-greeting>`;
}
```

## 添加 API 路由

在 `app/routes/api/` 中创建文件：

```ts
import { Hono } from 'hono';

const app = new Hono();
app.get('/', (c) => c.json({ message: 'Hello from LessJS API!' }));

export default app;
```
