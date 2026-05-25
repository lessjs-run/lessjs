# SOP-016: SSR HTMLElement Polyfill 自包含策略

> **版本**: 1.0
> **日期**: 2026-05-25
> **状态**: accepted
> **适用范围**: LessJS v0.21.12
> **关联 ADR**: ADR-0042, ADR-0044, ADR-0046
> **前置**: [SOP-014 构建管线 Clean Architecture](./SOP-014-build-pipeline-clean-arch.md)

---

## 1. 问题

SOP-014 Clean Architecture 重构后，`output.banner` 中的 `customElements` polyfill 使用 no-op 方法（`define` 不存储，`get` 永远返回 `undefined`），导致 SSG 渲染时 `renderDSDByName()` 无法查找到注册的组件类，所有组件输出为空白标签。

同时，`HTMLElement` polyfill 从 `@lit-labs/ssr-dom-shim`（完整实现）退化为裸 `class HTMLElement {}`（零方法），违反 `@lessjs/core` 自包含原则。

## 2. 方案

### 2.1 HTMLElement: `@lessjs/core` 自包含

`packages/core/src/dsd-element.ts` 的 `_HTMLElement` fallback 改为最小 SSR-safe stub 类 `_SsrHTMLElementStub`，包含 6 个成员，并赋值到 `globalThis.HTMLElement`。

```ts
const _SsrHTMLElementStub = class {
  hasAttribute(_name: string): boolean {
    return false;
  }
  getAttribute(_name: string): string | null {
    return null;
  }
  setAttribute(_name: string, _value: string): void {}
  removeAttribute(_name: string): void {}
  get tagName(): string {
    return '';
  }
  get isConnected(): boolean {
    return false;
  }
};

const _HTMLElement = typeof HTMLElement !== 'undefined'
  ? HTMLElement
  : ((globalThis as Record<string, unknown>).HTMLElement =
    _SsrHTMLElementStub as unknown as typeof HTMLElement);
```

### 2.2 customElements: Map-backed polyfill

`packages/adapter-vite/src/cli/build-ssg.ts` 的 `output.banner` 中 customElements polyfill 改为 Map 实现，`define()` 存储、`get()` 返回注册的类。

```js
const __lessCeRegistry = new Map();
globalThis.customElements = {
  define(name, ctor, _opts) {
    __lessCeRegistry.set(name, ctor);
  },
  get(name) {
    return __lessCeRegistry.get(name);
  },
  whenDefined(name) {
    return Promise.resolve(__lessCeRegistry.get(name));
  },
  upgrade(_root) {},
};
```

### 2.3 执行顺序保证

```
1. output.banner → customElements (Map-backed)
2. ESM graph → @lessjs/core/dsd-element.ts → _SsrHTMLElementStub → globalThis.HTMLElement
3. Entry code body → CSSStyleSheet polyfill
4. Deno import() → happy-dom Window → SSG render
```

## 3. 变更文件

| # | 文件                                         | 操作   | 说明                                    |
| - | -------------------------------------------- | ------ | --------------------------------------- |
| 1 | `packages/core/src/dsd-element.ts`           | MODIFY | `_SsrHTMLElementStub` 替代裸 `class {}` |
| 2 | `packages/adapter-vite/src/cli/build-ssg.ts` | MODIFY | Map-backed customElements polyfill      |
| 3 | `packages/content/deno.json`                 | MODIFY | 添加 `section-matter` 传递依赖          |

## 4. 验证

| 检查项   | 命令                    | 结果             |
| -------- | ----------------------- | ---------------- |
| 格式     | `deno fmt`              | ✅ 2 files       |
| CLI 测试 | `deno test cli.test.ts` | ✅ 15/15 passed  |
| 类型检查 | `deno task typecheck`   | ✅ core packages |

## 5. 架构原则

- **`@lessjs/core` 自包含**: 拥有 `DsdElement` 的包必须自己提供 SSR-safe 的 `HTMLElement` 基类
- **最小 stub**: SSR stub 只提供内部代码实际调用的方法，不模拟完整 DOM
- **polyfill 分层**: HTMLElement (core) → customElements (banner) → CSSStyleSheet (entry) → happy-dom (ssgRender)
