# SOP-007: DSD Hydration Event Binding 修复

> Version: v0.23.0  
> Priority: P0 (blocking)  
> Status: IN PROGRESS  
> Depends on: ADR-0039 (DsdElement Signals & Reactive)  
> Related: `docs/conversation/20260527/20260527-dsd-hydration-event-binding-broken.md`

## Objective

修复 LessJS DSD hydration 路径上所有声明式事件绑定（`@click`/`@keydown` 等）系统性失效的问题。确保框架不依赖 imperative workaround，各组件通过 `html` 模板声明的 `@event` 绑定在 DSD 预渲染页面上正常工作。

## Current Problem

DSD 模式下 `_bindCurrentRenderTemplate()` 调用 `applyRuntimeTemplateBindings()`，该方法通过 `querySelectorAll('[data-less-event-N]')` 定位需要绑定事件的 DOM 节点。但静态 DSD HTML 由 SSG 生成时不含 `data-less-event-N` 标记——这些标记仅在 CSR 路径的 `renderTemplateToString(result, {runtimeMarkers: true})` 中生成。导致所有使用 `@click`/`@keydown` 的组件在 DSD 页面上**事件绑定静默失败**。

详细分析见 [DSD Hydration 事件绑定系统性失效分析](../conversation/20260527/20260527-dsd-hydration-event-binding-broken.md)。

## Procedure

### Step 1: 修复核心 DSD hydration 逻辑

**文件**: `packages/core/src/dsd-element.ts`  
**方法**: `_bindCurrentRenderTemplate()` (line 387-395)

- [ ] 在 `_bindTemplateRuntime(result)` 之前，检测 DSD 静态模板是否包含 `data-less-event-N` markers
- [ ] 若 markers 缺失且有声明式事件绑定 → 调用 `renderTemplateToString(result, { runtimeMarkers: true })` 替换 `shadowRoot.innerHTML`
- [ ] 然后执行正常的 `_bindTemplateRuntime(result)` 和 `_subscribeTemplateSignals(result)`

**Implementation sketch:**

```typescript
private _bindCurrentRenderTemplate(): void {
    this._disposeTemplateRuntime();
    this._disposeSignalSubscriptions();

    const result = this.render();
    if (!isTemplateResult(result) || !this.shadowRoot) return;

    // 检测 DSD 模板是否包含 hydration markers
    const bindings = collectRuntimeTemplateBindings(result);
    if (bindings.events.length > 0) {
        const hasMarkers = bindings.events.some(b =>
            this.shadowRoot!.querySelector(`[data-less-event-${b.index}]`)
        );
        if (!hasMarkers) {
            this.shadowRoot.innerHTML = renderTemplateToString(
                result, { runtimeMarkers: true }
            );
        }
    }

    this._bindTemplateRuntime(result);
    this._subscribeTemplateSignals(result);
}
```

**Acceptance:**
- [ ] 所有带 `@click` 的组件在 DSD 页面上通过 Playwright 验证 `click` 事件生效
- [ ] innerHTML 替换不产生视觉闪烁（CLS < 0.01）
- [ ] 信号驱动的增量更新（`_patchBindings`）不受影响

### Step 2: 清理 Search 组件的 imperative workaround

**文件**: `www/app/islands/less-search.ts`

- [ ] 移除 `_onTriggerClick` 字段和 imperative `addEventListener` (line 217, 231-232)
- [ ] 移除 `disconnectedCallback` 中的 `removeEventListener` (line 239)
- [ ] 保留 `_onKeydown` document-level 绑定（Cmd+K 是全局行为，不属于组件 shadow DOM 事件）

**Acceptance:**
- [ ] Search 在所有页面上通过 `@click` 模板绑定工作
- [ ] Cmd+K 快捷键全局可用
- [ ] 搜索覆盖层在 SPA 导航后正确清理

### Step 3: 将 Search 组件集成到 less-layout（统一放置）

**文件**: `packages/ui/src/less-layout.ts`

- [ ] 添加 `show-search` 属性支持（布尔属性，默认 true）
- [ ] 当 `show-search` 为 true 时，`less-layout` 在 header 中渲染 `<less-search>` DSD 模板
- [ ] Search 组件通过 `<slot name="header-actions">` 的默认内容机制，或在 header right 区域直接输出

**文件**: `www/vite.config.ts`

- [ ] 在 `packageIslands` 中确保 `less-search` 作为 package island 被正确处理
- [ ] 或通过 app-level 共享 import 确保 search island 在 client bundle 中

**Acceptance:**
- [ ] 所有使用 `less-layout` 的页面自动获得 search 功能
- [ ] 无需各页面手动添加 `<less-search slot="header-actions">`
- [ ] Search 在首页和子页面上行为一致

### Step 4: 清理 section-renderer 的 SEARCH_DSD 注入

**文件**: `www/app/shared/section-renderer.ts`

- [ ] 移除 SEARCH_DSD 常量定义 (line 26-27)
- [ ] 移除 `wrap()` 方法中的 SEARCH_DSD 注入逻辑 (line 56-63)
- [ ] 保留 `edit-url` 注入逻辑

**Acceptance:**
- [ ] SSG 构建产物中不再包含手写静态 SEARCH_DSD HTML
- [ ] Search 模板由 `less-layout` 统一生成，保证 DSD 和 SSR 输出一致

### Step 5: 构建与验证

- [ ] 运行 `deno task build:docs` 确保 SSG 构建无错误
- [ ] 运行 `deno task test:e2e` 确保所有测试通过
- [ ] 手动验证：首页 → 子页面 → SPA 导航后搜索功能正常
- [ ] 手动验证：Cmd+K 快捷键在所有页面上可用
- [ ] 检查构建产物中的 search 相关 DSD 模板是否正确包含 `data-less-event-N` 标记

### Step 6: 回退 Home 测试改动

**文件**: `www/vite.config.ts`

- [ ] 恢复 `{ href: '/', label: 'Home' }` 到 headerNav 数组首位

## Quality Gates

| Gate | Criteria |
|------|----------|
| G1: DSD hydration working | `@click` bindings verified on ≥ 3 components via Playwright |
| G2: No visual regression | CLS < 0.01, no FOUC in e2e screenshots |
| G3: Search universal | Search works on all pages (home, docs, guide, engine, hub, blog) |
| G4: No imperative hacks | Zero `addEventListener` calls for template-defined events in app code |
| G5: SSG build passes | `deno task build:docs` exits 0 with correct page count |
| G6: e2e passes | All existing e2e tests pass |
| G7: Bundle size OK | Search island chunk size within 10% of current |

## Dependencies

- 依赖 `collectRuntimeTemplateBindings` 导出（已存在，位于 `template.ts:157`）
- 依赖 `renderTemplateToString` 的 `runtimeMarkers` 选项（已存在，位于 `template.ts:115`）
- 不引入新依赖
