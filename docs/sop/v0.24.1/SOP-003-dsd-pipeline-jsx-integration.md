# SOP-003: DSD 管线接入 JSX

> Version: v0.24.1
> Priority: P0
> Status: PLANNED
> Depends on: SOP-001 (jsx-runtime core), SOP-002 (static props)

## Objective

让 DSD 渲染管线（`render-dsd.ts` / `render-nested.ts`）消费 JSX render() 输出的 VNode，使 `<template shadowrootmode="open">` 内容由 `renderToString(vnode)` 生成。

**核心原则**：不修改 DSD 管线核心逻辑，只在 render() 输出消费层做适配。

## Non-Goals

- 不重构 render-dsd.ts / render-nested.ts 的核心流程
- 不修改 SSG 路由扫描 / 入口渲染器的逻辑（除非必要）
- 不处理非 DsdElement 类组件的 JSX 渲染

## Target Files

### 修改

| 文件                               | 变更                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `packages/core/src/dsd-element.ts` | render() 返回值类型扩展为 `string \| VNode \| TemplateResult`；connectedCallback 中调用 renderToString |
| `packages/core/src/render-dsd.ts`  | 新增 VNode → DSD HTML 的消费路径（与现有 TemplateResult 路径并列）                                     |

## Procedure

### Step 1: 扩展 DsdElement.render() 返回类型

**文件**: `packages/core/src/dsd-element.ts`

当前 render() 返回 `string | TemplateResult`。扩展为：

```typescript
abstract class DsdElement extends HTMLElement {
  // render() 现在可以返回 VNode
  abstract render(): string | TemplateResult | VNode;
}
```

**验证**：

- [ ] TypeScript 编译通过
- [ ] 现有返回 string / TemplateResult 的组件不受影响

### Step 2: DsdElement 识别 VNode 输出并转换

**文件**: `packages/core/src/dsd-element.ts`

在 `_bindCurrentRenderTemplate()` 和 DSD hydration 路径中，识别 VNode 输出：

```typescript
private _resolveRenderOutput(result: string | TemplateResult | VNode): string {
  if (typeof result === 'string') return result;
  if (isVNode(result)) return renderToString(result);
  if (isTemplateResult(result)) return renderTemplateToString(result);
  return String(result);
}
```

**关键**：无论 render() 返回什么，最终都转为字符串。DSD 管线只消费字符串。

**验证**：

- [ ] render() 返回 VNode → `_resolveRenderOutput()` 输出正确 HTML
- [ ] render() 返回 string → 直接返回
- [ ] render() 返回 TemplateResult → 走现有路径

### Step 3: render-dsd.ts 新增 VNode 消费路径

**文件**: `packages/core/src/render-dsd.ts`

在 `renderDSD()` / `renderComponent()` 中，识别 VNode 类型的 render 输出：

```typescript
// 现有逻辑：render() 返回 string 或 TemplateResult
// 新增逻辑：render() 返回 VNode

function resolveTemplateContent(result: unknown): string {
  if (typeof result === 'string') return result;
  if (isVNode(result)) return renderToString(result);
  if (isTemplateResult(result)) return renderTemplateToString(result);
  return '';
}
```

**验证**：

- [ ] `renderDSD()` 对 VNode 组件输出与 string 组件结构一致的 DSD HTML
- [ ] `<template shadowrootmode="open">` 内容正确包含 JSX 渲染的 HTML
- [ ] 嵌套组件（render-nested.ts）正确处理 VNode 子组件

### Step 4: SSR 输出等价性验证

**目标**：确认 JSX 路径的 DSD 输出与 html 路径的 DSD 输出在结构上等价。

**方法**：

1. 选择 3 个已有组件
2. 分别用 html 和 JSX 编写 render()
3. 对比 `renderDSD()` 的输出
4. 允许空白差异，不允许结构差异

**验证**：

- [ ] 3 个组件的 SSR 输出等价性确认
- [ ] `deno task dsd:check-report` 通过

### Step 5: Hydration 路径适配

**文件**: `packages/core/src/dsd-element.ts`

在 connectedCallback 的 DSD hydration 路径中：

1. 现有逻辑：检测 `<template shadowrootmode>` 是否已存在
2. JSX 适配：hydrate 时 render() 返回 VNode → `renderToDOM()` → 绑定事件 + Signal
3. 不替换已有的 shadow DOM 内容（DSD 优先），只在需要时做定点更新

**注意**：这是最敏感的部分。现有的 `_initialRenderDone` 合约必须被严格遵守。

**验证**：

- [ ] DSD 模式下 JSX 组件正确 hydrate
- [ ] Signal 变化后定点更新正常
- [ ] 事件监听不丢失（_initialRenderDone 合约验证）
- [ ] `_patchBindings` 在 JSX 路径下正常工作

## Rollback

如果 DSD 管线与 JSX 的集成出现无法在 v0.24.1 内解决的问题：

1. render() 返回类型扩展保留
2. VNode 路径标记为 `@experimental`
3. html tagged template 继续作为默认渲染路径
