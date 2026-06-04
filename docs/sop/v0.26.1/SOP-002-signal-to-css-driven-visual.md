# SOP-002: Signal-to-CSS-Driven Visual Migration

Status: completed (Phase 1) / in-progress (Phase 2-4)\
Target version: v0.26.1 (Phase 1) → v0.27.0 (Phase 2-4)\
Owner: `@openelement/core` + `@openelement/ui` + `www/app`\
前置: [ADR-0062](../../adr/ADR-0062-dsd-first-rdom-signal-architecture.md)\
取代: SOP-001（被 ADR-0062 修订）

---

## Objective

将 `less-layout`、`home-console`、`counter-island` 等组件从"signal 决定 VNode 结构"迁移到"signal 驱动 CSS 属性"，消除 `effect(() => render())` 对 DSD 水合路径的依赖。

---

## Problem Statement

SOP-001 移除了 `_hyrateExistingDom()` 中的 `effect(() => render())`，但两个 gap 未被覆盖：

1. **结构性 signal**（theme/locale/nav-items）在 `render()` 中决定 VNode 树结构，per-prop 绑定无法处理
2. **浏览器布局问题**：DSD shadow DOM 内容渲染后 host 元素 bounding rect 为 0×0

**v0.26.1 追加发现**：深度审计揭示了三个额外 bug：

| Bug    | 发现                                                                                  |
| ------ | ------------------------------------------------------------------------------------- |
| **G1** | `_walkAndBind` → `applyProps` 不传 AbortSignal，effect 永不清理（内存泄漏）           |
| **G2** | `consumeContext` 返回 `signal(v)` 副本，provider 更新消费者看不到                     |
| **B1** | DSD polyfill 模板字符串含 TypeScript `as` 断言，注入 HTML `<script>` 后浏览器解析失败 |

1. **结构性 signal**（theme/locale/nav-items）在 `render()` 中决定 VNode 树结构，per-prop 绑定无法处理
2. **浏览器布局问题**：DSD shadow DOM 内容渲染后 host 元素 bounding rect 为 0×0

当前 hotfix（`3b69bb5a`）恢复了 `effect(() => render())`，但这是 VDOM 全量重建——与 RDOM 路线矛盾。

---

## Phase 1: 修复 DSD 布局（v0.26.1，已完成）

### 改动文件

| 文件                                           | 改动                                                                                             | 目的                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `packages/ui/src/open-props-tokens.ts`         | `:host { display: block; min-height: 1px; contain: layout style }`                               | 所有组件默认 block + 安全网                                  |
| `www/app/routes/index/index.tsx`               | `heroSheet` 加 `:host { display: block }`                                                        | docs-home DSD 模板有 block                                   |
| `packages/adapter-vite/src/ssg-postprocess.ts` | CSS 注入 `docs-home{display:block}`                                                              | 全局兜底                                                     |
| `packages/adapter-vite/src/ssg-postprocess.ts` | 移除 `tpl.parentNode as HTMLElement`                                                             | 修复 B1: DSD polyfill 内联 JS 含 TS `as` 语法错误            |
| `packages/core/src/dsd-element.ts`             | `_hyrateExistingDom`: AbortController → `_walkAndBind` 传 signal → `applyProps` 绑定 effect 清理 | 修复 G1: effect 内存泄漏                                     |
| `packages/core/src/dsd-element.ts`             | `_layoutWorkaroundReRender()` 替代 `effect(() => render())`                                      | 一次性 DOM 替换（浏览器 workaround），之后 per-prop 绑定接管 |
| `packages/core/src/signal-context.ts`          | `consumeContext` 返回 `contexts.get(key)` 源 signal                                              | 修复 G2: provider 更新 → consumer 响应                       |
| `packages/ui/src/less-theme-toggle.tsx`        | `data-theme={this._theme}` + CSS `[data-theme]` 选择器                                           | render() 零 signal.value 读取                                |

### 验证

- `getBoundingClientRect().height = 1537px` 对 `docs-home` 和 `less-layout`
- 3/3 刷新稳定，0 JS errors，199KB 截图
- Nav 可点击，主题切换正常
- `data-theme="dark"` 属性通过 signal prop 正确绑定

---

## Phase 2: 组件迁移到属性驱动（v0.26.1 → v0.27）

### 规则

```
✅ DO:  render() 只返回一个不变的元素树，signal 只出现在 prop={signal} 位置
✅ DO:  视觉状态通过 CSS 和 data-* 属性切换
✅ DO:  条件渲染用 <Show when={signal}>，列表用 <For each={signal}>
❌ DON'T: render() 中访问 signal 决定返回哪个元素（{dark ? <Dark/> : <Light/>}）
❌ DON'T: render() 中 .map() 遍历 signal 值生成元素
```

### 组件迁移清单

#### Step 1: less-layout

| 属性/状态 | 当前方式                            | 目标方式                                    |
| --------- | ----------------------------------- | ------------------------------------------- |
| theme     | `{theme==='dark'?<DarkC>:<LightC>}` | `data-theme={themeSignal}` + CSS 覆盖式主题 |
| locale    | 条件文本渲染                        | reactive text node 或 `<Show>`              |
| nav-items | `.map()` + 条件渲染                 | `<For each={navSignal}>`                    |

**改动文件**: `packages/ui/src/less-layout.tsx`

**迁移前**（概念）:

```tsx
render() {
  const theme = consumeTheme(); // signal
  const locale = this._locale(); // signal
  if (theme === 'dark') {
    return <div class="dark-layout">...</div>;
  }
  return <div class="light-layout">...</div>;
}
```

**迁移后**:

```tsx
render() {
  return (
    <div class="app-layout" data-theme={this.#themeSignal} home="">
      <header class="app-header" part="header">
        <nav class="header-inner">
          <a class="logo" href="/">LESSJS</a>
          <nav class="header-nav" part="nav">
            <For each={this.#navSignal}>
              {(item: NavItem) => (
                <a href={item.href} data-nav={item.path}>{item.label}</a>
              )}
            </For>
          </nav>
        </nav>
      </header>
      <div class="layout-body">
        <main class="layout-main"><slot/></main>
      </div>
    </div>
  );
}
```

CSS:

```css
.app-layout {
  background: var(--bg-base, #f8f9fa);
  color: var(--text-primary, #212529);
}
.app-layout[data-theme='dark'] {
  background: var(--bg-obsidian, #040508);
  color: var(--text-primary, #e9ecef);
}
.app-header {
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid var(--border);
}
.app-layout[data-theme='dark'] .app-header {
  background: rgba(9, 11, 17, 0.88);
  border-bottom-color: var(--border-futuristic);
}
```

#### Step 2: home-console

| 属性/状态 | 当前方式         | 目标方式                              |
| --------- | ---------------- | ------------------------------------- |
| loading   | 条件渲染不同子树 | `<Show when={loading}>` + CSS opacity |
| count     | 直接在文本中访问 | ✅ 已经是 reactive text node          |

**改动文件**: `www/app/islands/home-console.tsx`

#### Step 3: counter-island

已使用 reactive text node（`{this.#count}`），无需改动。

#### Step 4: less-theme-toggle

已使用 per-prop 绑定（`class={signalValue}`），无需改动。

---

## Phase 3: 删除 `effect(() => render())`（v0.27）

### 改动文件

`packages/core/src/dsd-element.ts`:

```diff
- import { effect, signal } from '@openelement/signals';
+ import { signal } from '@openelement/signals';

- private _vnodeEffectDispose?: () => void;

  private _hyrateExistingDom(): void {
    // ... _walkAndBind ...
-   // (remove the entire effect(() => render()) block)
  }

  private _disposeSignalSubscriptions(): void {
-   if (this._vnodeEffectDispose) {
-     this._vnodeEffectDispose();
-     this._vnodeEffectDispose = undefined;
-   }
  }
```

### Phase 3 前置条件

- [ ] Phase 2 全部完成
- [ ] `Show`/`For` 支持 DSD 水合路径
- [ ] `docs-home` 添加 `:host { display: block }` 到 DSD CSS
- [ ] CI 全部门禁通过（typecheck, test, lint, fmt, dsd:check-report, e2e）
- [ ] `dev.lessjs.pages.dev` 手动验证：首屏渲染 + 刷新 + nav 点击 + 主题切换

---

## Phase 4: 文档 & 门禁（v0.27）

### 新增/更新文件

| 文件                                   | 内容                                                           |
| -------------------------------------- | -------------------------------------------------------------- |
| `docs/guide/component-author-guide.md` | 组件编写规则：render() 只做初始化，signal 只能出现在 prop 位置 |
| `docs/adr/ADR-0062.md`                 | 将状态从 PROPOSED 改为 ACCEPTED                                |
| `docs/sop/v0.26.1/SOP-002.md`          | 将状态从 proposed 改为 completed                               |
| `packages/core/src/dsd-element.ts`     | `effect(() => render())` 加 `@deprecated` 注释                 |

### 门禁

- `deno lint` 必须拒绝 `render()` 中访问 signal 做分支判断（如果 lint rule 可用）
- E2E 测试必须覆盖：DSD 首屏渲染 → JS 升级 → 布局不变 → nav 可点击 → 主题切换正常

---

## Rollback

如果迁移后出现回归：

1. `git revert` Phase 3 提交，恢复 `effect(() => render())`
2. 不改动 Phase 1/2 的迁移代码（它们本身是改进）
3. 重新评估哪些组件需要结构性 signal，逐个解决后重新删除 effect

---

## Gap Status (v0.26.1)

| #  | Gap                                     | 修复方案                                                                                                               | 状态  |
| -- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----- |
| G1 | Effect 内存泄漏                         | effectScope 自动捕获 → `_scopeDispose()` 一键清理                                                                      | ✅    |
| G2 | consumeContext 死拷贝                   | 返回 contexts Map 源 signal，不建副本                                                                                  | ✅    |
| G3 | DSD 文本节点                            | `_walkAndBind` 检测 signal 子节点 → `effect(() => textNode.textContent)`                                               | ✅    |
| G4 | Show/For DSD                            | SSR 展开或 comment-marker hydration                                                                                    | ⚠️ P2 |
| G5 | effectScope 暴露 + AbortController 清理 | alien-signals → `@openelement/signals` facade；`dsd-element.ts` 删除 `_templateAbortController`/`_signalUnsubscribers` | ✅    |
| G6 | JSX.Element 类型                        | `children: unknown[]` → `(string \| VNode)[]`                                                                          | ✅    |

### G5 重构对比

```
之前:
  _templateAbortController = new AbortController()
  _walkAndBind(root, vnode, abortController.signal)
  _signalUnsubscribers.push(unsubscribe)
  disconnectedCallback:
    _disposeTemplateRuntime()  // abort
    _disposeSignalSubscriptions()  // iterate unsubscribe

现在:
  _scopeDispose = effectScope(() => {
    _walkAndBind(root, vnode)   // effects auto-captured
    _layoutWorkaroundReRender() // renderToDom effects also captured
  })
  disconnectedCallback:
    _scopeDispose()  // one call → all effects cleaned up
```

净减少 ~40 行代码，逻辑从手动跟踪变成框架原生能力。
