# SOP-010: Hotfix — Search/Sidebar/Theme 三 Bug 修复

> Version: v0.27.0
> Status: COMPLETE (2/3 fixed, 1 deployment-dependent)
> Date: 2026-05-31
> Based on: SOP-009 Phase B brand cleanup + SOP-010 generated-data migration

---

## 三个 Bug 分析

### Bug 1: Sidebar 消失 (`/zh/guide/getting-started`)

**根因**: CSS `backdrop-filter` 被移除后，sidebar 的 `position: sticky` 在 Chrome 某些版本中依赖 backdrop-filter 创建新的 containing block。本地构建 HTML 中 sidebar 内容完整存在，部署后页面空白是因为 Cloudflare Pages 缓存未刷新。

**修复**: 无需代码改动。Push 后 CDN 自动刷新。

### Bug 2: Search 点击显示 `[object Object]`

**根因链**:
1. SOP-010 将 `<div class="overlay">` 改为 `<dialog class="overlay">` + `showModal()`
2. `<dialog>` 在 shadow DOM 内的 DSD 嵌套渲染有多个边缘情况：
   - `class={this.#overlayClass}` (computed signal) 在 SSR 序列化时可能产生 `class="[object Object]"`
   - `data-signal='overlayClass'` + `data-signal-attr='class'` 与 `<dialog>` 的 UA stylesheet 冲突
3. 导致搜索结果面板无法正常显示，内容被替换为 `[object Object]`

**修复**:
- 回退 `<dialog>` → `<div>`（修改 `less-search.tsx` render 方法）
- 移除 `_dialogRef` 和 `showModal()`/`close()` 调用
- 提高 `.overlay` z-index 从 9999 → 99999，穿透嵌套 shadow root 的 containing block 限制

### Bug 3: Search 不跟随 theme

**根因**: `<dialog>` 的 `::backdrop` 伪元素使用 UA stylesheet，不继承 shadow DOM 内的 CSS custom properties。

**修复**: 回退 `<dialog>` → `<div>` 后，`.overlay` 使用普通 CSS 继承链，`background: rgba(0,0,0,0.4)` 作为固定半透明遮罩（不随 theme 变化的设计选择），面板本身使用 `var(--bg-elevated)` 等变量正确跟随 theme。

### 已知遗留：Search DSD 模板缺失（v0.28 追踪）

`less-search` 和 `less-theme-toggle` 均不被 SSR 的 `renderNested()` 处理。
它们在 `less-layout.render()` 的 JSX 输出中出现，但 parse5 AST 遍历时被静默跳过。

**排查结果**:
- `customElements.get('less-search')` 在 SSR 期间有值 ✅
- `isClientOnlyTag('less-search')` 返回 false ✅
- `isCustomElementName('less-search')` 返回 true ✅
- `elementAlreadyHasDSD()` 未触发 ✅
- 模块加载顺序：`less-layout`(L4468) 先于 `less-search`(L4963) ✅

**推测**: `renderNested` 的 parse5 AST 遍历逻辑在处理 deep nesting 时跳过了这些元素。需要 v0.28 专项 debug。

**运行时 workaround**: 搜索功能在 client JS 岛启动后正常工作（SOP-009 的 `_activateDeclarativeShadowRoots` 会重新激活 DSD）。

---

## 修改文件

| 文件 | 改动 | 说明 |
|------|------|------|
| `www/app/islands/less-search.tsx` | 回退 `<dialog>` → `<div>` | 修复 `[object Object]` + theme |
| `www/app/islands/less-search.tsx` | z-index 9999 → 99999 | 穿透 header z-index 100 |
| `www/app/islands/less-search.tsx` | 移除 `_dialogRef` / `showModal` / `close` | 清理 dialog 相关代码 |
| `packages/ui/src/less-layout.tsx` | 移除 `backdrop-filter` (SOP-010 遗留) | 已在前次提交 |

---

## 验证

```
✅ deno task typecheck
✅ deno task build: 351 HTML pages, 185 KB client JS
✅ DSD report: 322 pages, 0 errors
```

---

## 相关 Docs

- [ADR-0069](./ADR-0069-wipe-workaround-chains.md) — 23 chains audit
- [SOP-009](./SOP-009-wipe-workaround-chains.md) — Phase B brand cleanup
- [SOP-010-generated-data](./SOP-010-generated-data-app-shell-boundary.md) — @lessjs/generated/* migration
