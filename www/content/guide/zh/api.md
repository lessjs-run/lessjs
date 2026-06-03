---
title: 'API 参考'
section: '参考'
label: 'API'
order: 70
---

## 核心 API

### renderDsd(input, options?)

唯一的渲染入口。将自定义元素渲染为 DSD HTML。

```ts
import { renderDsd } from '@lessjs/core';

// 按标签名 — 自动从 customElements 注册表查找
const result = await renderDsd('less-layout', {
  props: {
    currentPath: '/zh/guide/getting-started',
    locale: 'zh',
  },
});

// 按类 — 直接使用
const result = await renderDsd(MyComponent, {
  props: { title: '你好' },
});

// result: { html: string, errors: [], metrics: {...}, hydrationHints: [] }
console.log(result.html);
```

**参数:**

| 参数      | 类型                                 | 描述                           |
| --------- | ------------------------------------ | ------------------------------ |
| `input`   | `string \| CustomElementConstructor` | 标签名（自动查注册表）或组件类 |
| `options` | `RenderDsdOptions`                   | 渲染选项对象                   |

**返回:** `Promise<RenderOutput>` — 包含 `html`、`errors`、`metrics`、`hydrationHints`。

### renderDsdTree(node)

异步 VNode 树转 HTML 字符串。处理嵌套自定义元素的 DSD 渲染。

```ts
import { renderDsdTree } from '@lessjs/core';
import { jsx } from '@lessjs/core/jsx-runtime';

const vnode = jsx('div', { class: 'greeting', children: 'hello' });
const html = await renderDsdTree(vnode);
// → '<div class="greeting">hello</div>'
```

**参数:**

| 参数   | 类型      | 描述                     |
| ------ | --------- | ------------------------ |
| `node` | `unknown` | VNode、字符串、数字或片段 |

**返回:** `Promise<string>` — 转义后的 HTML 字符串，已注册自定义元素包含 DSD。

## 组件模型

### DsdElement

所有 DSD 原生组件的基类。

```tsx
import { DsdElement } from '@lessjs/core';
import { signal } from '@lessjs/signals';

class MyCounter extends DsdElement {
  static override styles = StyleSheet.create(`
    :host { display: block; }
    button { padding: 8px 16px; }
  `);

  #count = signal(0);

  render() {
    return (
      <div>
        <span data-signal='count'>{this.#count.value}</span>
        <button data-on-click='_increment'>+</button>
      </div>
    );
  }

  _increment() {
    this.#count.value++;
  }
}

customElements.define('my-counter', MyCounter);
```

### Fragment

不产生额外 DOM 的空包装器：

```tsx
render() {
  return (
    <>
      <span>一</span>
      <span>二</span>
    </>
  )
}
```

## JSX 运行时 (Subpath)

从 `@lessjs/core/jsx-runtime` 导入：

```ts
import { For, jsx, jsxDEV, jsxs, Show } from '@lessjs/core/jsx-runtime';
```

### For

信号数组的列表渲染：

```tsx
<For each={this.#items}>
  {(item) => <li>{item.name}</li>}
</For>;
```

### Show

条件渲染：

```tsx
<Show when={this.#loading}>
  <Spinner />
  <Content />
</Show>;
```

## 信号

从 `@lessjs/signals` 导入：

```ts
import { computed, effect, signal } from '@lessjs/signals';

const count = signal(0);
const double = computed(() => count.value * 2);

effect(() => {
  console.log('count 变了:', count.value);
});
```

## Islands

```tsx
// 创建 island
import { defineIsland } from '@lessjs/core';

defineIsland('my-widget', {
  tagName: 'my-widget',
  strategy: 'idle', // load | idle | visible | only
});
```

```tsx
// 在页面中使用
<my-widget client:idle />;
```

水合策略：`client:load`（立即）、`client:idle`（空闲时）、`client:visible`（可见时）、`client:only`（仅 CSR，无 SSR）。

## wrapInDocument

将内容包装为完整 HTML 文档：

```ts
import { wrapInDocument } from '@lessjs/core';

const html = wrapInDocument(content, {
  title: '我的页面',
  lang: 'zh',
  headExtras: '<link rel="stylesheet" href="/styles.css">',
});
```
