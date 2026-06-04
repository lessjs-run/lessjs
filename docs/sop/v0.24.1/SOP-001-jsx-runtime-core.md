# SOP-001: jsx-runtime 核心实现

> Version: v0.24.1
> Priority: P0
> Status: PLANNED
> Depends on: ADR-0057 ACCEPTED, v0.23.x exit criteria met

## Objective

实现 LessJS 的 jsx-runtime：`jsx()`/`jsxs()`/`jsxDEV()` + `Fragment`，返回纯 JavaScript VNode 对象。实现 `renderToString(vnode)` 将 VNode 树序列化为 DSD HTML 字符串。实现 `renderToDOM(vnode)` 将 VNode 树创建为真实 DOM 节点。

**核心约束**：VNode 是声明式描述，不是运行时渲染树。不做 VDOM diff。

## Non-Goals

- 不实现 VDOM diff
- 不实现合成事件（SOP-004）
- 不实现 static props / Signal 解包（SOP-002）
- 不实现组件迁移（SOP-005）
- 不修改现有 render-dsd.ts / render-nested.ts 逻辑

## Target Files

### 新增

| 文件                                     | 用途                                |
| ---------------------------------------- | ----------------------------------- |
| `packages/core/src/jsx-runtime.ts`       | jsx/jsxs/jsxDEV/Fragment 导出       |
| `packages/core/src/vnode.ts`             | VNode 接口定义 + 冻结条款           |
| `packages/core/src/jsx-render-string.ts` | renderToString(vnode) → HTML 字符串 |
| `packages/core/src/jsx-render-dom.ts`    | renderToDOM(vnode) → DOM 节点       |

### 修改

| 文件                         | 变更                                                                       |
| ---------------------------- | -------------------------------------------------------------------------- |
| `packages/core/src/index.ts` | 导出 jsx-runtime 公共 API                                                  |
| `packages/core/deno.json`    | 新增 `./jsx-runtime` 和 `./jsx-dev-runtime` 子路径导出                     |
| `deno.json`（根）            | `compilerOptions.jsx: "react-jsx"`, `jsxImportSource: "@openelement/core"` |

## Procedure

### Step 1: 定义 VNode 接口

**文件**: `packages/core/src/vnode.ts`

```typescript
/**
 * VNode — LessJS 声明式组件描述
 *
 * ⚠️ VNode 接口冻结条款 (ADR-0057 §1.1):
 * v1.0 前只允许以下 5 个字段，不增加 hooks/memo/suspense/context/portal。
 * 任何新字段提案必须走 ADR 流程，并证明它不引入 VDOM diff 语义。
 */
export interface VNode {
  tag: string | Function; // HTML 标签名 或 组件函数/类
  props: Record<string, any>; // 属性对象（含事件、class、style 等）
  children: (VNode | string)[]; // 子节点
  key?: string | number; // 列表渲染 key
  ref?: (el: Element) => void; // DOM 引用回调
}

export function isVNode(v: unknown): v is VNode {
  return (
    typeof v === 'object' && v !== null &&
    'tag' in v && 'props' in v && 'children' in v
  );
}
```

**验证**：

- [ ] `isVNode()` 单元测试通过
- [ ] VNode 接口只有 5 个字段，TypeScript 编译通过

### Step 2: 实现 jsx-runtime

**文件**: `packages/core/src/jsx-runtime.ts`

实现 `jsx()`、`jsxs()`、`jsxDEV()` 和 `Fragment`：

```typescript
import { VNode } from './vnode.ts';

export const Fragment = Symbol.for('lessjs.fragment');

export function jsx(
  tag: string | Function,
  props: Record<string, any>,
  key?: string | number,
): VNode {
  const { children, ...rest } = props;
  const childArray = Array.isArray(children) ? children : children != null ? [children] : [];
  return { tag, props: rest, children: childArray, key };
}

export function jsxs(
  tag: string | Function,
  props: Record<string, any>,
  key?: string | number,
): VNode {
  // 与 jsx 相同，但语义标记"有多个子节点"
  return jsx(tag, props, key);
}

export function jsxDEV(
  tag: string | Function,
  props: Record<string, any>,
  key?: string | number,
  source?: any,
  self?: any,
): VNode {
  const vnode = jsx(tag, props, key);
  // dev mode: 可附加 source 信息用于调试
  if (source) {
    (vnode as any).__source = source;
  }
  return vnode;
}
```

**验证**：

- [ ] `jsx('div', { class: 'a', children: 'hello' })` 返回正确的 VNode
- [ ] `jsxs('div', { children: ['a', 'b'] })` 返回正确的 VNode
- [ ] `jsxDEV` 附加 `__source` 信息
- [ ] `Fragment` 是 unique symbol

### Step 3: 实现 renderToString

**文件**: `packages/core/src/jsx-render-string.ts`

将 VNode 树递归序列化为 HTML 字符串，供 DSD 管线消费：

```typescript
import { isVNode, VNode } from './vnode.ts';
import { Fragment } from './jsx-runtime.ts';

export function renderToString(node: VNode | string | null | undefined): string {
  if (node == null || node === false) return '';
  if (typeof node === 'string') return escapeHtml(node);
  if (typeof node === 'number') return String(node);
  if (!isVNode(node)) return String(node);

  const { tag, props, children } = node;

  // Fragment: 只渲染子节点
  if (tag === Fragment || tag === Symbol.for('lessjs.fragment')) {
    return children.map(renderToString).join('');
  }

  // 组件函数/类：调用 render()（SOP-003 处理 DsdElement 类）
  if (typeof tag === 'function') {
    // v0.24.1: 仅支持函数组件的简单调用
    // DsdElement 类组件在 SOP-003 中处理
    const result = tag(props);
    return renderToString(result);
  }

  // HTML 标签
  const attrs = serializeAttrs(props);
  const childHtml = children.map(renderToString).join('');

  // 自闭合标签
  const voidElements = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ]);
  if (voidElements.has(tag)) {
    return `<${tag}${attrs}>`;
  }

  return `<${tag}${attrs}>${childHtml}</${tag}>`;
}
```

**关键点**：

- `renderToString` 不依赖 DOM API——纯字符串操作
- `escapeHtml` 复用现有 `html-escape.ts`
- 自闭合标签正确处理
- `class` prop → `class` attribute（不是 `className`）
- `onClick` → 不序列化（事件在 CSR 路径处理）

**验证**：

- [ ] 简单标签: `renderToString({ tag: 'div', props: { class: 'a' }, children: ['hello'] })` → `<div class="a">hello</div>`
- [ ] 自闭合: `renderToString({ tag: 'br', props: {}, children: [] })` → `<br>`
- [ ] 嵌套: 多层 VNode 嵌套正确序列化
- [ ] null/undefined/false 子节点正确跳过
- [ ] 特殊字符转义（XSS 安全）

### Step 4: 实现 renderToDOM

**文件**: `packages/core/src/jsx-render-dom.ts`

将 VNode 树创建为真实 DOM 节点（CSR 路径）：

```typescript
import { isVNode, VNode } from './vnode.ts';
import { Fragment } from './jsx-runtime.ts';

export function renderToDOM(node: VNode | string, container?: Element): Node {
  if (typeof node === 'string') return document.createTextNode(node);
  if (typeof node === 'number') return document.createTextNode(String(node));
  if (!isVNode(node)) return document.createTextNode(String(node));

  const { tag, props, children } = node;

  // Fragment
  if (tag === Fragment || tag === Symbol.for('lessjs.fragment')) {
    const frag = document.createDocumentFragment();
    children.forEach((child) => frag.appendChild(renderToDOM(child)));
    return frag;
  }

  // HTML 元素
  if (typeof tag === 'string') {
    const el = document.createElement(tag);
    applyProps(el, props);
    children.forEach((child) => el.appendChild(renderToDOM(child)));
    return el;
  }

  // 组件函数
  if (typeof tag === 'function') {
    const result = tag(props);
    return renderToDOM(result);
  }

  return document.createTextNode('');
}

function applyProps(el: Element, props: Record<string, any>): void {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;

    // 事件属性
    if (key.startsWith('on') && typeof value === 'function') {
      const eventType = key.slice(2).toLowerCase();
      el.addEventListener(eventType, value);
      continue;
    }

    // ref 回调
    if (key === 'ref' && typeof value === 'function') {
      value(el);
      continue;
    }

    // style 对象
    if (key === 'style' && typeof value === 'object') {
      Object.assign((el as HTMLElement).style, value);
      continue;
    }

    // 布尔属性
    if (typeof value === 'boolean') {
      if (value) el.setAttribute(key, '');
      else el.removeAttribute(key);
      continue;
    }

    // 通用属性
    if (value != null) {
      el.setAttribute(key, String(value));
    }
  }
}
```

**验证**：

- [ ] 简单元素创建: `renderToDOM({ tag: 'div', props: {}, children: ['hi'] })` → `<div>hi</div>`
- [ ] 事件绑定: `onClick` handler 通过 `addEventListener` 正确绑定
- [ ] ref 回调: `ref` 函数被调用并传入元素
- [ ] 布尔属性: `disabled: true` → `disabled=""`，`disabled: false` → 无属性
- [ ] style 对象: `{ color: 'red' }` → 正确设置

### Step 5: 配置 JSX 编译

**文件**: `deno.json`（根）

```jsonc
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@openelement/core"
  }
}
```

**文件**: `packages/core/deno.json`

新增子路径导出：

```jsonc
{
  "exports": {
    // ... 现有导出 ...
    "./jsx-runtime": "./src/jsx-runtime.ts",
    "./jsx-dev-runtime": "./src/jsx-runtime.ts"
  }
}
```

**验证**：

- [ ] `.tsx` 文件中的 JSX 语法编译通过
- [ ] `import { jsx } from "@openelement/core/jsx-runtime"` 工作正常
- [ ] `deno task typecheck` 通过

### Step 6: 单元测试

**文件**: `packages/core/__tests__/jsx-runtime.test.ts`

测试覆盖：

1. `jsx()` / `jsxs()` 返回正确 VNode 结构
2. `renderToString()` 输出正确 HTML 字符串
3. `renderToDOM()` 创建正确 DOM 结构
4. 自闭合标签
5. null / undefined / false 子节点处理
6. 特殊字符转义
7. Fragment 处理
8. 事件属性在 renderToString 中被忽略（不序列化到 HTML）
9. 事件属性在 renderToDOM 中通过 addEventListener 绑定

**验证**：

- [ ] 所有测试通过
- [ ] `deno task test` 无回归

### Step 7: 验证 SSR 输出等价性

**目标**：确认 `renderToString(vnode)` 的输出与现有 `render()` → string 路径的输出在结构上等价。

**方法**：

- 选择 3 个现有组件（简单/中等/复杂）
- 用 JSX 重写 render() 方法
- 对比 `renderToString(render())` 与 `renderDSD()` 的 HTML 输出
- 允许空白差异，不允许结构差异

**验证**：

- [ ] SSR 输出等价性确认（3 个样本组件）

## Rollback

如果 jsx-runtime 实现无法在 v0.24.1 时间线内完成：

1. 保留已实现的 jsx-runtime 代码（不删除）
2. 标记为 `@experimental`
3. html tagged template 保持主路径
4. 在 v0.25.x 继续完成
