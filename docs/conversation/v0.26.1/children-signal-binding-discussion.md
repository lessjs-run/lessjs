# v0.26.1 Children Signal Binding & Control Flow 补全

日期: 2026-05-30\
前置: [ADR-0058 讨论](../v0.26.1/signal-reactivity-loop-discussion.md)\
状态: 讨论完成

---

## 背景

ADR-0058 消灭了 `effect(() => render())` VDOM 循环，实现了 props 层的 Signal→DOM 直接绑定。`className={signal}`、`data-foo={signal}` 等属性级绑定已就绪。

但这只覆盖了 JSX 的 **prop 层**。Children 层的 signal 值——`{signal}` 动态文本、`{signal ? A : B}` 条件渲染、`.map(item => <li>{item}</li>)` 列表渲染——仍然被静态展开，signal 变化后不更新。

---

## 问题：为什么 Children 层丢失了 signal

react-jsx transform 的语义：

```jsx
<div>Count: {count.value}</div>
```

编译为：

```js
jsx("div", null, "Count: ", count.value)
//                                  ↑ 此时已求值，signal 身份丢失
```

`count.value` 在 `jsx()` 调用时被求值为 `0` 或 `42`——一个 plain number。到 `renderToDom` 拿到 children 数组时，它看到的是 `["Count: ", 42]`，无法区分 `42` 是字面量还是 signal 快照。

### 已存在的 rescue 路径

`renderToDom` 已有 `isSignalLike(node)` 分支（line 179），但它做的是**静态展开**：

```typescript
if (isSignalLike(node)) {
    return renderToDom((node as { value: unknown }).value, signal);
    // ↑ 展开后不再追踪 signal 变化
}
```

这个分支把 signal value 提取出来作为静态值创建 TextNode，之后 signal 变了这条路径永远不会再走。

**修复方案**：不提取 value 后创建静态 TextNode，而是创建 TextNode + effect 绑定。

---

## 方案：VNode 层特判 + 控制流组件

### 1. Children 动态文本（最小改动）

`renderToDom` 中 `isSignalLike(node)` 分支改为：

```typescript
if (isSignalLike(node)) {
    const textNode = document.createTextNode(String(node.value));
    const dispose = effect(() => {
        textNode.textContent = String(node.value);
    });
    if (signal) signal.addEventListener('abort', dispose, { once: true });
    return textNode;
}
```

覆盖 `{count.value}`、`{name.value}` 等所有直接在 JSX children 中使用的 signal 值。

### 2. `<Show when={signal}>` 条件渲染

新增 VNode-level 内置组件。在 `renderToDom` 中遇到 `<Show>` 标签时，不创建真实 DOM 元素，而是作为控制流指令处理：

```typescript
if (tag === Show) {
    const container = document.createComment('show');
    const dispose = effect(() => {
        const child = props.when ? children[0] : children[1];
        // replace container's nextSibling with rendered child
    });
    if (signal) signal.addEventListener('abort', dispose, { once: true });
    return container;
}
```

用法：

```jsx
<Show when={this._loading}>
    <Spinner/>
    <Content/>
</Show>
```

### 3. `<For each={signal}>` 列表渲染

```typescript
if (tag === For) {
    const container = document.createComment('for');
    const dispose = effect(() => {
        const items = props.each;
        // reconcile children with item array
    });
    if (signal) signal.addEventListener('abort', dispose, { once: true });
    return container;
}
```

用法：

```jsx
<For each={this._items}>
    {(item: Item) => <li>{item.name}</li>}
</For>
```

---

## 与 SolidJS 的对比

| | SolidJS | LessJS ADR-0058 后 | 本次补全后 |
|---|---|---|---|
| 属性绑定 | compile-time effect | ✅ ADR-0058 | ✅ |
| 动态文本 | compile-time effect | ❌ | ✅ renderToDom |
| 条件渲染 | compile-time `<Show>` | ❌ | ✅ VNode `<Show>` |
| 列表渲染 | compile-time `<For>` | ❌ | ✅ VNode `<For>` |
| 实现方式 | Babel plugin | DOM renderer 特判 | DOM renderer 特判 |

**SolidJS 用编译器做，LessJS 用 VNode renderer 做。殊途同归。**

区别是 Solid 的 `<Show>` / `<For>` 是通用的（任何 JSX 编译目标都能用），LessJS 的是 `renderToDom` 的特判——它们必须在有 `renderToDom` 的环境中运行（即 CSR/SSG client 路径）。SSR 路径需要对应的 `renderToString` 特判。

---

## 结论

三个补全项全部在 `jsx-render-dom.ts` 中实现，无需改动 JSX transform、无需回退 VDOM、无需组件代码变更。新增 `<Show>` / `<For>` 两个 `Symbol` 标记的内置组件。
