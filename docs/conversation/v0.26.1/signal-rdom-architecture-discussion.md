# v0.26.1 — DSD-First RDOM Signal Architecture Discussion

> Date: 2026-05-30\
> Participants: Zhi (Lead), AI (Architect)\
> Context: `dev.lessjs.pages.dev` 白屏修复 + 信号架构路线讨论

---

## Background

2026-05-30 上午，`dev.lessjs.pages.dev` 出现白屏。经过多轮调试和 `git bisect`，定位到提交 `7989e8e8`（ADR-0058: Real DOM Signal Binding）移除了 `_hyrateExistingDom()` 中的 `effect(() => render())`。

恢复该 effect 后页面恢复正常，但暴露出更深的架构问题：LessJS 需要明确的信号路由——VDOM 还是 RDOM？

---

## Root Cause Analysis

### Blank screen regression chain

```
7989e8e8 (ADR-0058)
  ↓
移除 effect(() => render()) from _hyrateExistingDom()
  ↓
信号变化（theme/locale/nav-items）无响应机制
  ↓
less-layout.connectedCallback() 触发 provideContext() + setAttribute()
  ↓
信号 changes → render() 输出的 VNode 已过时
  ↓
浏览器 layout engine 对 DSD shadow DOM 计算 0×0 host rect
  ↓
docs-home / less-layout collapse → 白屏
```

### Two separate failure modes

| # | Failure | Mechanism |
|---|---------|-----------|
| 1 | Structural Signal Gap | `render()` 中 signal 决定 VNode *树结构*，per-prop 绑定只能更新属性，不能增删子树 |
| 2 | Browser Layout Quirk | DSD shadow DOM 内容（正确的 DOM 树）→ host `getBoundingClientRect()` 返回 0×0。只有 CSR 重渲（appendChild）触发正确 layout |

---

## Architecture Discussion

### Zhi: 方案 A——属性驱动 + CSS 管视觉

> "HTML管理骨架 css管视觉 他们两个负责绝大部分内容 js管理所有数据和原子化更新以及通讯"

```
HTML = skeleton (generated once by SSG/DSD)
CSS  = visual state (attribute-driven)
JS   = data + atomic updates + communication (signal→DOM attribute)
```

这是 **Real DOM (RDOM)** 路线，与 SolidJS、Svelte 5、Vue Vapor 一致。

### Key insight

per-prop signal→DOM 绑定（`applyProps` 中 `effect(() => setAttribute(...))`）已经存在且工作正常。问题不在于缺少机制，而在于**组件作者在 `render()` 中把 signal 用于结构性决策**，迫使框架必须做全量重渲。

修复不在于框架层，在于组件层：
- 不要在 `render()` 里用 `theme === 'dark' ? <Dark/> : <Light/>`——用 `data-theme={signal}` + CSS
- 不要在 `render()` 里 `.map()` signal 数组——用 `<For each={signal}>`
- 不要在 `render()` 里 `{locale === 'zh' ? '指南' : 'Guide'}`——用 reactive text node

### Framework comparison

| Framework | Render mechanism | Reactive updates | VNode? |
|-----------|-----------------|------------------|--------|
| **LessJS (current)** | `effect(() => render() + replace)` | Full re-render | Yes |
| **LessJS (target)** | `render()` once → DSD/SSG | Per-prop effect bindings | No |
| SolidJS | Compile-time DOM bindings | Per-node effect + DOM API | No |
| Lit | `render()` via tagged template | Lit directive + effect | Partial |
| Svelte 5 | Compile-time `$state` | Compile-time DOM bindings | No |
| Vue Vapor | Compile-time elimination | Compile-time DOM bindings | No |

LessJS is uniquely positioned: **DSD gives zero-JS first paint**, so the framework only needs to handle *reactive updates after hydration*. This is a simpler problem than what Solid/Svelte solve (they must handle initial render too).

---

## Decision

### Phase 1 (v0.26.1): Hotfix + Layout fix

- Restore `effect(() => render())` as temporary fix
- Fix DSD layout: `:host { display: block }` everywhere
- Fix `Unexpected identifier 'as'` in DSD polyfill
- Disable SW registration (stale cache blank screen)

**Files**: `dsd-element.ts`, `open-props-tokens.ts`, `index/index.tsx`, `ssg-postprocess.ts`, `ssg-render.ts`

### Phase 2-4 (v0.26.1 → v0.27): RDOM migration

1. Convert all components to attribute-only signal access:
   - `less-layout`: theme → `data-theme` + CSS, nav → `<For>`
   - `home-console`: loading → CSS opacity + `<Show>`
   - Others: audit + fix
2. Make `Show`/`For` work in DSD hydration path
3. Remove `effect(() => render())` entirely
4. Add component author guide + lint rules

### Long-term: Zero effect, zero VNode diff

The end state: LessJS components never call `effect(() => render())`. All reactive updates are per-prop DOM bindings or DOM-element-level text node updates. The `render()` method is a one-time initializer, and DSD handles the first paint.

---

## Related Documents

- [ADR-0062: DSD-First Real DOM Signal Architecture](../../adr/ADR-0062-dsd-first-rdom-signal-architecture.md)
- [SOP-002: Signal-to-CSS-Driven Visual Migration](../v0.26.1/SOP-002-signal-to-css-driven-visual.md)
- [SOP-001: Real DOM Signal Binding](../v0.26.1/SOP-001-real-dom-signal-binding.md) (superseded)
- [ADR-0058: Real DOM Signal Binding](../../adr/0058-real-dom-signal-binding.md) (superseded by ADR-0062)
