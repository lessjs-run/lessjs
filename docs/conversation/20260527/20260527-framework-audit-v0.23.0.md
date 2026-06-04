# LessJS v0.23.0 框架可靠性 & 清洁度审计

> 审计日期：2026-05-27\
> 审计范围：`packages/core` · `packages/ui` · `packages/adapter-vite` · `www/`\
> 审计人：齐活林（Qi）· 交付总监

---

## TL;DR

框架主体结构清晰，package 分层合理（ADR-0050）。发现 **1 个 P0 级系统性缺陷**（DSD hydration 事件绑定失效）、**1 个 P0 级重复渲染问题**（engine/architecture.ts 双 search 组件）、**8 个 P1 设计债务**、**7 个 P2 清洁度问题**。总体评分：可靠性 6/10，清洁度 6/10。

---

## 一、可靠性审计

### P0: DSD Hydration 事件绑定系统性失效

| 属性     | 值                                                                        |
| -------- | ------------------------------------------------------------------------- |
| 影响范围 | 所有在 DSD 预渲染页面中使用 `@click`/`@keydown` 的组件                    |
| 根因文件 | `packages/core/src/dsd-element.ts:387-395` `_bindCurrentRenderTemplate()` |
| 子因文件 | `packages/core/src/template.ts:175-204` `applyRuntimeTemplateBindings()`  |
| 现象     | 组件 visible 但 click 无响应，静默失效                                    |
| 修复 SOP | SOP-007                                                                   |

**详细分析**见 `docs/conversation/20260527/20260527-dsd-hydration-event-binding-broken.md`。

**短期缓解**（已有，不应作为长期方案）：

- `less-search` 手动 `addEventListener` in `connectedCallback`
- 其他组件未处理，潜在受影响

**框架级修复**（SOP-007 Step 1）：

- `_bindCurrentRenderTemplate()` 检测 markers 缺失时回退到 `renderTemplateToString` + `innerHTML` 替换

### P0: engine/architecture.ts 重复渲染 Search 组件

| 属性 | 值                                                                                                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------- |
| 文件 | `www/app/routes/engine/architecture.ts:10, 324`                                                                       |
| 问题 | 同时通过内联 `<less-search>` 和 `_renderer.ts` 的 SEARCH_DSD 注入放置 search 组件，导致页面上出现**两个** search 按钮 |

`engine/architecture.ts` 在第 10 行 import `less-search.js` 并在第 324 行放置内联 `<less-search slot="header-actions">`。同时 `engine/_renderer.ts` 使用 `createSectionRenderer('engine')`，其 `wrap()` 方法通过 SEARCH_DSD 字符串注入第二个 `<less-search>`。两个组件争夺同一个覆盖层（各自的 `connectedCallback` 都执行 `document.querySelectorAll('.less-search-overlay').forEach(el => el.remove())`），导致行为不确定。

**修复**: 删除 `engine/architecture.ts` 中的内联 `<less-search>` 和第 10 行 import，让 `_renderer.ts` 统一处理。

### P1: Island 加载时序对 Shadow DOM 内容不可见

| 属性     | 值                                                                                            |
| -------- | --------------------------------------------------------------------------------------------- |
| 文件     | `packages/adapter-vite/src/entry-generators.ts:148`                                           |
| 问题     | `visible` strategy 使用 `document.querySelectorAll(tag)` 扫描，但无法穿透 closed shadow roots |
| 实际影响 | 低——LessJS 使用 open shadow roots                                                             |

**但潜在风险**：如果未来有组件使用 `mode: 'closed'`（虽然框架默认 open），island 检测将失效。建议在框架文档中明确此限制。

### P1: `connectedCallback` 调用顺序脆弱

| 属性 | 值                                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------- |
| 文件 | `packages/core/src/dsd-element.ts:210-234`                                                                             |
| 问题 | 子类在 `super.connectedCallback()` 调用的前后做额外操作，但依赖 DSD 内部状态（如 `_dsdHydrated`）在 `super` 执行后的值 |

当前 `LessSearch.connectedCallback()` 的方式：

```
_resetState() → super.connectedCallback() → addEventListener
```

如果 `super.connectedCallback()` 的变化改变了 `_resetState` 或 `addEventListener` 的前提假设，组件会静默出错。建议提供显式的生命周期钩子（如 `onDedHydrated` / `onCsrRendered`），而非依赖调用顺序。

### P1: 手动 DSD 模板与 `render()` 输出漂移

| 属性 | 值                                                                          |
| ---- | --------------------------------------------------------------------------- |
| 文件 | `www/app/shared/section-renderer.ts:26-27`                                  |
| 问题 | SEARCH_DSD 是硬编码的静态 HTML 字符串，与 `less-search.render()` 输出不同步 |

当 `less-search.render()` 的模板结构变更时，SEARCH_DSD 需要手动更新。这是一个已知的维护陷阱。SOP-007 Step 3-4 通过将 search 集成到 less-layout 来消除这一重复。

### P1: SEARCH_DSD CSS 变量与实际组件不匹配

| 属性 | 值                                                                             |
| ---- | ------------------------------------------------------------------------------ |
| 文件 | `www/app/shared/section-renderer.ts:26-27` vs `www/app/islands/less-search.ts` |
| 问题 | 静态 DSD 模板使用的 CSS 变量名与实际组件 `StyleSheet` 中的不同                 |

| 属性       | SEARCH_DSD (静态)                              | less-search render() (运行时)      |
| ---------- | ---------------------------------------------- | ---------------------------------- |
| 颜色 token | `--border`, `--text-muted`, `--text-secondary` | `--gray-3`, `--gray-5`, `--gray-7` |
| 间距       | `0.375rem`, `0.5rem` 硬编码                    | `var(--size-2)`, `var(--size-3)`   |
| 字体大小   | `0.6875rem` 硬编码                             | `var(--font-size-00)`              |

这意味着 DSD 初始渲染的按钮样式与 JS 升级后的样式**视觉上不同**——违反了 DSD "首屏与升级后一致" 的前提。同时也解释了为什么 search 在子页面上看起来"不太对"。

### P1: SEARCH_DSD 在两处重复定义

| 属性 | 值                                                                                          |
| ---- | ------------------------------------------------------------------------------------------- |
| 文件 | `www/app/shared/section-renderer.ts:26-27` + `www/app/routes/registry/_renderer.ts:119-120` |
| 问题 | 约 50 行 CSS + HTML 在两个文件中逐字重复                                                    |

### P1: wrap() 字符串操作脆弱

| 属性 | 值                                                                                                       |
| ---- | -------------------------------------------------------------------------------------------------------- |
| 文件 | `www/app/shared/section-renderer.ts:42-63`                                                               |
| 问题 | 使用 `html.indexOf('<open-layout')` 定位标签闭合 `>`，对包含 less-layout 模板的代码块/示例内容产生误匹配 |

### P1: _propagateTheme() 应提升到框架基类

| 属性 | 值                                                                                                                                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 文件 | `packages/ui/src\/open-layout.ts:961-978`                                                                                                  |
| 问题 | 主题传播是框架级关注点，不应是 less-layout 的私有方法。当前同时 walk light DOM + shadow DOM，在 `_loadContent` 中被调用两次（立即 + rAF） |

### P1: "home" 属性语义错误

| 属性 | 值                                                                                                                                                          |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 文件 | `packages/ui/src\/open-layout.ts:631`                                                                                                                        |
| 问题 | `home` 属性的实际作用是抑制侧边栏，但被 `contributing.ts`, `changelog.ts`, `404.ts`, `roadmap.ts` 等非首页页面使用。应重命名为 `no-sidebar` 或 `full-width` |

---

## 二、清洁度审计

### P2-1: Search 放置分散且不一致

| 属性                             | 状态                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| 使用 `<less-search slot>` 的页面 | 仅 6 个（404, changelog, roadmap, registry/_renderer, engine/architecture, index/index） |
| 使用 SEARCH_DSD 注入的页面       | 9 个 section（通过 createSectionRenderer）                                               |
| 完全没有 search 的页面           | 其余独立页面                                                                             |

**问题**：三种不同方式放置 search 组件，且覆盖不完整。SOP-007 统一为 less-layout 内置方案。

### P2-2: Vite config 中测试改动未回退

| 属性   | 状态                                                                  |
| ------ | --------------------------------------------------------------------- |
| commit | `baa60d14` "test: remove Home from headerNav to verify CF deployment" |
| 文件   | `www/vite.config.ts:141`                                              |
| 改动   | headerNav 中移除了 `{ href: '/', label: 'Home' }`                     |

这是一个临时测试改动，应在验证 CF 部署正常后回退。SOP-007 Step 6 处理。

### P2-3: 路由页面 openPropsTokenSheet 已补但模式不 DRY

| 属性       | 状态                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| v0.23.0 前 | 31 个路由文件缺失 `openPropsTokenSheet`                                                              |
| v0.23.0 修 | 批量补上 `import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens'` 并加入 `static styles` |

虽然已修复，但每个文件都写重复的 import 不符合 DRY 原则。建议：框架提供 `PageBase` 基类或 `createPage` 工厂函数，将 `openPropsTokenSheet` + 常用配置作为默认值。减少路由文件的样板代码量。

### P2-4: less-layout 属性传递链过长

| 属性   | 状态                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------- |
| 传递链 | `vite.config.ts` → `virtual:less-nav` → 各路由 `nav-items='${JSON.stringify(navSections)}'` → `less-layout`         |
| 问题   | `nav-items`、`header-nav`、`locales`、`locale`、`current-path` 等 5+ 个属性需在每个路由文件中手动序列化为 JSON 属性 |

大量重复的 `JSON.stringify` 调用和属性传递。如果 SSG 阶段能通过 `injectProps` 自动将这些值 set 到 layout 实例上（而非通过 HTML 属性），可消除大量样板代码。

### P2-5: StyleSheet 使用模式不一致

| 属性 | 状态                         |
| ---- | ---------------------------- |
| 问题 | 路由文件间样式定义模式差异大 |

- 部分使用原始字符串：`static override styles = [openPropsTokenSheet, pageStyles]`
- 部分包装为 `StyleSheet`：`pageSheet.replaceSync(pageStyles)`
- `contributing.ts` 有三个样式表，其中 `pageStyles` 被应用了两次
- `404.ts` 定义了 `pageSheet` 但未在 `static styles` 中使用（死代码）

### P2-6: nav-filter.ts 遗留别名

| 属性 | 状态                                                 |
| ---- | ---------------------------------------------------- |
| 文件 | `www/app/utils/nav-filter.ts:54-57`                  |
| 别名 | `filterFrameworkNav` → 应迁移到 `filterDocsNav`      |
| 别名 | `filterEngineNav` → 应迁移到 `filterArchitectureNav` |
| 别名 | `filterRegistryNav` → 应迁移到 `filterHubNav`        |

### P2-7: less-layout 硬编码 www 特定内容

| 属性 | 状态                                                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------- |
| 文件 | `packages/ui/src\/open-layout.ts`                                                                                  |
| 问题 | `_icon()` 的导航标签到 SVG 映射、页脚文本、`MOBILE_TAB_LIMIT = 5` 等属于 www 特定配置，不应硬编码在框架 UI 组件中 |

建议通过 HTML 属性或 CSS 自定义属性使其可配置。

---

## 三、Package 边界审计

### 当前状态

```
@openelement/core          — runtime kernel + DsdElement + template engine
@openelement/ui            — UI components (less-layout, less-code-block, etc.)
@openelement/adapter-vite  — Vite plugin + SSG/SSR build pipeline
@openelement/content       — content plugin (nav, blog, sitemap)
@openelement/i18n          — i18n plugin
@openelement/protocols     — shared types + virtual module IDs
@openelement/app           — app facade (consumer entry point)
```

### 边界分析

| 边界                | 判定       | 说明                                                               |
| ------------------- | ---------- | ------------------------------------------------------------------ |
| core ↔ adapter-vite | ✅ Clean   | core 不依赖 adapter-vite，符合底层不依赖上层的原则                 |
| content → protocols | ✅ Clean   | 已迁移到 protocols，不再导入 adapter-vite/build-context            |
| i18n → protocols    | ✅ Clean   | 同上                                                               |
| ui → core           | ✅ Clean   | ui 单向依赖 core，无反向引用                                       |
| www → ui            | ⚠️ Partial | less-search 需要通过 slot 注入到 less-layout，但不是框架层面解决的 |

### 建议

- **ADR-0050 中 `app` 依赖 `adapter-vite/build-context`** 的问题尚未解决。如果是纯 facade 包，不应导入 adapter 内部类型
- `@openelement/ui` 作为 UI 组件库，可以接受 `show-search` 等配置属性，通过 attribute 驱动行为，不引入新依赖

---

## 四、主题系统审计

### `_propagateTheme()` 当前实现 (less-layout.ts)

v0.23.0 修复后同时 walk light DOM 和 shadow DOM。这个方案**功能正确**但有两个问题：

1. **属于框架级关注点**：主题传播不应是 less-layout 的私有方法，而是 `DsdElement` 应该提供的通用能力
2. **性能**：每次主题切换遍历所有子孙元素，在大 DOM 树上可能产生性能问题

**建议**：将主题传播提升到 `DsdElement` 基类作为可选协议（如 `DsdElement.themeable = true`），使用 MutationObserver 或 CSS `color-scheme` + `light-dark()` 函数（更现代的方案）。

---

## 五、i18n 系统审计

### 当前状态

- SSG 正确生成了 `/en/` 和 `/zh/` 两套页面
- `less-layout` 的 `_localizePath()` 正确识别当前 locale 并调整链接
- `_loadContent()` 在 SPA 导航后正确同步 locale
- lang-switch 通过 `data-nav` 走 SPA 导航（v0.23.0 修复）

### 当前短板

- **内容覆盖不完整**：大量页面只有 en 版本，zh 页面缺少翻译。这不是框架问题，是内容工作
- **locale 检测**：默认 locale 为 en，通过 URL 路径区分。缺少浏览器语言偏好检测（`Accept-Language` header 或 `navigator.language`）

---

## 六、总体评分

| 维度             | 评分 | 评语                                                      |
| ---------------- | ---- | --------------------------------------------------------- |
| 核心运行时可靠性 | 6/10 | DSD hydration 是核心路径，P0 bug 拉低评分                 |
| 构建管线可靠性   | 8/10 | SSG 稳定，island 加载机制设计良好                         |
| 代码清洁度       | 6/10 | 架构清晰但模板重复、CSS 漂移、死代码、遗留别名普遍存在    |
| Package 架构     | 8/10 | ADR-0050 方向正确，部分迁移待完成                         |
| www 站点质量     | 5/10 | 内容不完整 + search 放置分散 + CSS 不匹配 + 重复渲染      |
| 框架自用度       | 4/10 | 多个组件通过 workaround 绕过框架；search 三种不同放置方式 |

**加权总分：6.0/10** （已计入 Explore-2 审计发现的新问题后从 6.5 下调）

---

## 七、优先修复顺序

| 优先级 | 项目                                | 所属 SOP                                 |
| ------ | ----------------------------------- | ---------------------------------------- |
| **P0** | DSD hydration 事件绑定修复          | SOP-007 Step 1                           |
| **P0** | engine/architecture.ts 重复 search  | SOP-007（集成到 less-layout 后自然消除） |
| **P1** | SEARCH_DSD CSS 变量与实际组件对齐   | SOP-007 Step 3-4                         |
| **P1** | Search 组件统一放置到 less-layout   | SOP-007 Step 3                           |
| **P1** | 清理 imperative workaround          | SOP-007 Step 2, 4                        |
| **P1** | _propagateTheme() 提升到 DsdElement | 新 SOP                                   |
| **P1** | "home" 属性重命名为 "no-sidebar"    | 新 SOP                                   |
| **P2** | 回退 Home 测试改动                  | SOP-007 Step 6                           |
| **P2** | 统一路由文件 StyleSheet 模式        | 新 SOP                                   |
| **P2** | 清理 nav-filter.ts 遗留别名         | 新 SOP                                   |
| **P2** | less-layout 硬编码内容可配置化      | 新 SOP                                   |
| **P2** | 提供 PageBase 减少模板代码          | 新 SOP                                   |
| **P3** | 主题传播提升到 DsdElement           | 新 SOP                                   |
| **P3** | 添加浏览器语言检测                  | 新 SOP                                   |
