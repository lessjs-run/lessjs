# LessJS v0.26.0 — Reactive Pragmatic Improvements

> Status: PLANNED\
> Target: Route params 响应式 + data-keep-alive + computed 文档\
> Depends on: v0.25.0 (declarative DX)\
> Governing ADR: ADR-0059\
> See also: `docs/conversation/20260629/v0.25.0-0.26.0-declarative-reactive-roadmap.md`

## Mission

务实改进响应式体验：SPA 导航后路由参数自动更新，input focus 不丢失。

```
Before v0.26.0
  SPA 导航后 _getRouteParams() 仍是旧值
  signal 变更 → 全量 shadow DOM 替换 → input focus 丢失
  computed() 有实现但无人知

After v0.26.0
  this.params 随 SPA 导航自动更新
  data-keep-alive 元素 preserve DOM identity on re-render
  computed() 文档 + 示例（让已有功能被看见）
```

## What We're NOT Doing (Honest Assessment)

| Excluded                 | Why                                                                   |
| ------------------------ | --------------------------------------------------------------------- |
| SignalContext 跨组件状态 | `computed()` 当前 0 处生产使用；跨组件订阅是过度设计                  |
| `static data` SSG fetch  | content system 已处理数据获取                                         |
| `static middleware`      | 0 处使用                                                              |
| SignalQuery              | Promise 风格已够用                                                    |
| VDOM diff                | shadow DOM 场景 full re-render 代价低，`data-keep-alive` 解决具体痛点 |

## Task Groups

| Group | Task                                  | Priority | Nature     | Time |
| ----- | ------------------------------------- | -------- | ---------- | ---- |
| TG-01 | Route params reactive (`this.params`) | P0       | 新 feature | 1d   |
| TG-02 | `data-keep-alive` 细粒度 DOM          | P1       | 修 bug     | 1d   |
| TG-03 | `computed()` 文档 + 示例              | P2       | 文档       | 0.5d |
| TG-04 | 全量回归 + docs                       | P2       | 验证       | 1d   |

## Step-by-Step

### Step 1: Baseline

```bash
deno task fmt:check && deno task lint && deno task typecheck && deno task graph:check && deno task test
```

记录基线。

### Step 2: TG-01 Route Params Reactive

1. 在 `packages/core/src/navigation.ts` 新增 `useRouteParams()` 函数
   - 内部用 signal 存储当前 params
   - `onNavigate()` 回调 → set signal → `effect()` re-render
2. DsdElement 基类暴露 `this.params` getter
   - 读取 `useRouteParams()` 的当前值
   - 随 SPA 导航自动更新
3. 机制：复用现有 VNode effect tracking，不新增渲染路径

```typescript
// 实现草图
function useRouteParams(): Readonly<Record<string, string>> {
  const params = signal<Record<string, string>>({});
  onNavigate((url) => {
    const matched = matchRoute(currentRoute, url);
    params.value = matched || {};
  });
  return params.value; // signal-based, auto-tracking in render()
}
```

4. DsdElement:

```typescript
get params(): Readonly<Record<string, string>> {
  return useRouteParams();
}
```

**Acceptance**:

- [ ] SPA 导航后 `this.params` 自动更新并触发 re-render
- [ ] `effect()` 追踪正确，无内存泄漏

### Step 3: TG-02 data-keep-alive

1. 在 `_renderIntoShadowRoot` 的 VNode re-render 路径（effect callback）中增加 keep-alive 检测
2. 算法：
   ```typescript
   // renderToDom 或 effect 回调中
   const existing = shadowRoot.querySelector('[data-keep-alive]');
   const newEl = renderToDom(newVnode);
   if (existing && existing.tagName === newEl.tagName && existing.hasAttribute('data-keep-alive')) {
     // Patch attributes only, preserve DOM node
     for (const [attr, value] of Object.entries(newProps)) {
       if (value == null) existing.removeAttribute(attr);
       else existing.setAttribute(attr, String(value));
     }
     return; // skip removeChild + appendChild
   }
   ```
3. 新增测试：input focus 在 signal 变更后保持不变

**Acceptance**:

- [ ] `data-keep-alive` 元素在 re-render 后保持 DOM identity
- [ ] input focus 不丢失
- [ ] CSS transition 不中断

### Step 4: TG-03 computed() 文档

1. 在 `www/app/routes/guide/signal-reactivity.tsx` 新增 `computed()` 章节
2. 示例：filterable list, derived state
3. `docs/reference/core-api-surface.md` 补充 computed 条目

**Acceptance**:

- [ ] computed() 有完整文档和代码示例

### Step 5: TG-04 Full Regression

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task graph:check
deno task test
deno task build
```

## Quality Gates

| Gate | Criteria                                               |
| ---- | ------------------------------------------------------ |
| G1   | SPA 导航后 `this.params` 自动更新并触发 re-render      |
| G2   | `data-keep-alive` 元素在 re-render 后保持 DOM identity |
| G3   | input focus 在 `data-keep-alive` 场景下不丢失          |
| G4   | 现有组件零修改正常工作                                 |
| G5   | 全量 gate 通过                                         |
