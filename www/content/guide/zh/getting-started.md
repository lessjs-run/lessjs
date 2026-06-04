---
title: '快速开始'
section: '指南'
label: '快速开始'
order: 1
---

# 快速开始

openElement 是 JSX-first 的 Web Components 应用框架。页面用 JSX 编写，框架把它渲染为
Declarative Shadow DOM，需要交互的部分再作为 islands 升级。

## 创建项目

```bash
deno run -A jsr:@openelement/create my-app
cd my-app
deno task dev
```

## 编写页面

```tsx
import { definePage } from '@openelement/app';

export default definePage(() => {
  return <main>Hello openElement</main>;
});
```

`definePage()` 是应用层 API。底层 `DsdElement` 仍然存在，但应用路由默认应该从这里开始。

## 添加 island

```tsx
import { defineIsland } from '@openelement/app';
import { signal } from '@openelement/runtime';

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => <button onClick={() => count.value++}>Count: {count.value}</button>,
);
```

## 配置 Vite

```ts
import { defineConfig } from 'vite';
import { openElement } from '@openelement/app/vite';

export default defineConfig({
  plugins: [openElement()],
});
```

根入口 `@openelement/app` 用于应用编写。构建配置入口是 `@openelement/app/vite`。
