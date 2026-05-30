# LessJS Framework Dependency Audit — v0.26.1

> 审计范围: 全部 56 个文件（10 UI 组件 + 8 Islands + 32 Routes + 2 Core）
> 审计维度: 10 类框架依赖检查

---

## Issue #1: Import from @lessjs/runtime instead of @lessjs/core

| File                                             | Issue                                                      | Severity | Fix recommendation                                                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `www/app/routes/index/index.tsx:7`               | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 统一为 `@lessjs/core`。`@lessjs/runtime` 是 facade，UI 组件和 island 都正确使用 `@lessjs/core`，仅 route 页面不一致 |
| `www/app/routes/404.tsx:5`                       | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/contributing.tsx:6`              | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/changelog.tsx:12`                | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/roadmap.tsx:7`                   | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/apilist.tsx:7`                   | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/guide/getting-started.tsx:4`     | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/guide/core-concepts.tsx:4`       | `import { DsdElement } from '@lessjs/runtime'`             | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/guide/routing-and-data.tsx:4`    | `import { DsdElement } from '@lessjs/runtime'`             | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/guide/islands-and-ssr.tsx:4`     | `import { DsdElement } from '@lessjs/runtime'`             | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/guide/architecture.tsx:11`       | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/guide/deployment.tsx:3`          | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/guide/api.tsx:3`                 | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/guide/error-handling.tsx:3`      | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/guide/configuration.tsx:4`       | `import { DsdElement } from '@lessjs/runtime'`             | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/guide/testing.tsx:4`             | `import { DsdElement } from '@lessjs/runtime'`             | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/architecture/architecture.tsx:5` | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/architecture/dsd.tsx:4`          | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/architecture/islands.tsx:3`      | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |
| `www/app/routes/architecture/comparison.tsx:6`   | `import { DsdElement, StyleSheet } from '@lessjs/runtime'` | MEDIUM   | 同上                                                                                                                |

**Summary**: 20 route files use `@lessjs/runtime`, while all UI components (`packages/ui/`) and all islands (`www/app/islands/`) correctly use `@lessjs/core`. 批量替换为 `@lessjs/core`。

---

## Issue #2: signal.value in render() (ADR-0062 violation)

| File                                    | Line    | Issue                                                                            | Severity | Fix recommendation                                                                                                             |
| --------------------------------------- | ------- | -------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `www/app/islands/less-toc.tsx`          | 165-166 | `this.#headings.value` 和 `this.#activeId.value` 在 render() 中直接读取 `.value` | HIGH     | Toc 组件的渲染模式需要重构: headings/activeId 应通过 `applyProps` 的信号绑定机制传递，或在 render() 外通过 effect 手动更新 DOM |
| `www/app/islands/reactive-showcase.tsx` | 147     | `this.#filtered.value.map(...)` 在 render() 中直接读取 `.value`                  | HIGH     | 改用 `<fore>` 或信号→DOM 绑定，当前模式在 render() 中展开 signal 会导致该组件在每次重新渲染时反复订阅                          |

**备注**: `home-console.tsx` 使用 computed signals 作为 JSX prop 传递（如 `class={this.#graphTabClass}`），这是正确的 ADR-0058/0059 模式。`less-theme-toggle.tsx` 正确地将 `this._theme` 作为信号 prop 传递而不读 `.value`。

---

## Issue #3: Not using consumeContext/provideContext where appropriate

| File                            | Issue                                                                                                                       | Severity | Fix recommendation                                                                                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `less-theme-toggle.tsx:131,214` | 直接 `document.documentElement.setAttribute('data-theme', theme)` 而非使用 `provideContext(THEME_CTX, ...)`                 | MEDIUM   | 使用 SignalContext 统一主题管理。当前直接操作 `document.documentElement` + `globalThis.dispatchEvent` 与 `home-console` 等组件的 `consumeContext()` 模式不统一 |
| `less-layout.tsx:913,920`       | 在 `connectedCallback` 中调用 `provideContext`，又在 `_propagateTheme` 中遍历所有子元素 `setAttribute('data-theme', theme)` | LOW      | `provideContext` 已经覆盖子组件，`_propagateTheme()` 中的 `setAttribute` 遍历是冗余操作。保留其中一种机制即可                                                  |

**正确示例**: `home-console.tsx:134-136` 使用 `consumeContext(THEME_CTX)` 并通过 `theme.subscribe()` 同步。`www/app/routes/index/index.tsx:168-170` 同样正确使用。

---

## Issue #4: Raw setAttribute where signal-driven binding would be better

| File                        | Line                                                                | Issue  | Severity                                                                                                   | Fix recommendation |
| --------------------------- | ------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- | ------------------ |
| `less-theme-toggle.tsx:131` | `this.setAttribute('data-theme', this._theme.value)`                | MEDIUM | data-theme 已经在 render() 中通过 `data-theme={this._theme}` 作为信号 prop 传递，`setAttribute` 是冗余操作 |                    |
| `less-theme-toggle.tsx:243` | `this.setAttribute('data-theme', theme)`                            | MEDIUM | 同上                                                                                                       |                    |
| `less-dialog.tsx:216`       | `child.setAttribute('inert', '')` — 手动管理 inert 属性             | LOW    | 可以设计为信号驱动，但当前模态框 inert 管理是正确的事件驱动模式，优先级低                                  |                    |
| `less-layout.tsx:1059`      | `el.setAttribute('data-theme', theme)` — _propagateTheme 中遍历设置 | LOW    | 冗余于 provideContext 机制                                                                                 |                    |

---

## Issue #5: innerHTML writing (where renderToDom or slot should be used)

| File                      | Line                                                            | Issue  | Severity                                                                            | Fix recommendation |
| ------------------------- | --------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- | ------------------ |
| `less-code-block.tsx:232` | `highlightedCode.innerHTML = html;` — 注入 Prism 高亮 HTML      | MEDIUM | 使用 `renderToDom()` + 创建文本节点的片段，或使用 DOMPurify sanitize 后再 innerHTML |                    |
| `less-search.tsx:278`     | `results.innerHTML = this._getResultsHtml();` — 搜索结果列表    | MEDIUM | 搜索结果应使用 `renderToDom()` 生成真实 DOM，避免 HTML 字符串拼接                   |                    |
| `less-search.tsx:316`     | `resultsDiv.innerHTML = this._getResultsHtml();` — 同上         | MEDIUM | 同上                                                                                |                    |
| `less-term.tsx:131`       | `div.innerHTML = this._sanitizeTermHtml(htmlStr);` — 终端输出行 | MEDIUM | 使用 `renderToDom()` + 暴露 `_localCommands` 字符串到安全 DOM                       |                    |
| `less-term.tsx:211`       | `out.innerHTML = '';` — 清空终端输出                            | LOW    | 使用 `out.replaceChildren()` 或 `while(out.firstChild) out.removeChild(...)`        |                    |

**备注**: `dsd-element.ts:498` 中使用 `this.shadowRoot!.innerHTML = result;` 是框架级字符串渲染路径，属于 DsdElement 内部实现，不在审计范围内。

---

## Issue #6: Custom DOM utilities that duplicate web platform API

| File                      | Line                                                                | Issue  | Severity                                                                                                                                       | Fix recommendation |
| ------------------------- | ------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `less-search.tsx:343-348` | 自定义 `_escapeHtml()` 和 `_escapeAttr()`                           | LOW    | 已有 `shared/escape.js` 中的 `_esc()` 和 `_escAttr()` 工具，应复用而非重复实现                                                                 |                    |
| `less-term.tsx:89-91`     | 自定义静态 `_escapeHtml()`                                          | LOW    | 同上，使用 `import { _esc } from './shared/escape.js'`                                                                                         |                    |
| `less-term.tsx:136-149`   | 自定义 `_sanitizeTermHtml()` HTML 清理器                            | MEDIUM | 这个自定义 sanitizer 基于 `innerHTML` + 白名单过滤，有潜在 XSS 风险。应使用标准 sanitizer（如 DOMPurify）或使用 `renderToDom()` 替代字符串拼接 |                    |
| `changelog.tsx:159-252`   | 自建 Markdown 渲染器 `renderChangelog()`, `renderInline()`, `esc()` | LOW    | 使用 `@lessjs/content` 的标准 markdown 处理管线。当前代码是自包含的 SSR 渲染器，接受                                                           |                    |

---

## Issue #7: Not using AbortController for event cleanup

| File                        | Issue                                                                               | Severity | Fix recommendation                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `less-search.tsx:225,229`   | `document.addEventListener('keydown', ...)` / `removeEventListener(...)` — 手动管理 | LOW      | 可以使用 AbortController 传递 signal 到 addEventListener 的第三个参数，在 disconnect 时 abort |
| `less-layout.tsx:964-971`   | `details.addEventListener('toggle', ...)` + 组件级手动管理                          | LOW      | 当前实现正确（在 `_setupDetailsToggle` 中绑定），disconnect 时 effectScope 自动清理           |
| `less-layout.tsx:1024-1025` | `document.addEventListener('click', ...)` + `removeEventListener` 手动管理          | LOW      | 见上                                                                                          |

**总体评价**: 大多数组件的事件清理机制正确。`dsd-element.ts` 中的 `effectScope()` 提供了自动清理。手动 `addEventListener/removeEventListener` 配对无明显遗漏。

---

## Issue #8: CustomEvent not used where it should be for cross-component communication

| File                             | Issue                                               | Severity | Fix recommendation                   |
| -------------------------------- | --------------------------------------------------- | -------- | ------------------------------------ |
| `less-button.tsx:227`            | ✅ 正确使用 `CustomEvent('less-click')`             | NONE     | —                                    |
| `less-input.tsx:218,228,238,242` | ✅ 正确使用 `CustomEvent('less-input', ...)` 等     | NONE     | —                                    |
| `less-dialog.tsx:241`            | ✅ 正确使用 `CustomEvent('less-dialog-close', ...)` | NONE     | —                                    |
| `less-theme-toggle.tsx:231`      | ✅ 正确使用 `CustomEvent('less:theme-change', ...)` | NONE     | —                                    |
| `counter-island.tsx`             | ❌ 无事件派发                                       | LOW      | 计数器是自包含组件，不需要跨组件通信 |
| `home-console.tsx`               | ❌ 无事件派发                                       | LOW      | 自包含面板，不需要                   |

**总体评价**: 跨组件通信的 CustomEvent 使用规范。`counter-island` 和 `home-console` 作为演示组件不需要派发事件。

---

## Issue #9: Static styles not including openPropsTokenSheet

| File                                       | Issue                                                                                                                   | Severity | Fix recommendation                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `packages/ui/src/less-button.tsx:136`      | 使用 `--gray-*`, `--brand`, `--size-*`, `--font-*` 等 Open Props token，但 `static styles` 不包含 `openPropsTokenSheet` | HIGH     | 作为独立分发的 UI 组件，应包含 `openPropsTokenSheet` 确保独立使用时 token 可用 |
| `packages/ui/src/less-card.tsx:79`         | 同上（使用 `--gray-*`, `--size-*`, `--radius-*`）                                                                       | HIGH     | 同上                                                                           |
| `packages/ui/src/less-dialog.tsx:117`      | 同上（使用 `--gray-*`, `--size-*`, `--radius-*`, `--font-*`）                                                           | HIGH     | 同上                                                                           |
| `packages/ui/src/less-input.tsx:110`       | 同上                                                                                                                    | HIGH     | 同上                                                                           |
| `packages/ui/src/less-step-card.tsx:83`    | 同上                                                                                                                    | HIGH     | 同上                                                                           |
| `packages/ui/src/less-theme-toggle.tsx:75` | 同上                                                                                                                    | HIGH     | 同上                                                                           |
| `packages/ui/src/less-code-block.tsx:129`  | 同上                                                                                                                    | HIGH     | 同上                                                                           |
| `packages/ui/src/less-hero-ping.tsx:77`    | 同上                                                                                                                    | HIGH     | 同上                                                                           |
| `packages/ui/src/less-callout.tsx:60`      | 同上                                                                                                                    | HIGH     | 同上                                                                           |
| `www/app/islands/counter-island.tsx:73`    | Island 组件使用 Open Props token，但不包含 `openPropsTokenSheet`                                                        | MEDIUM   | 作为 www 项目内的 island，可能从 less-layout 继承，但为防御性应添加            |
| `www/app/islands/api-consumer.tsx:130`     | Island 组件使用 Open Props token，但不包含 `openPropsTokenSheet`                                                        | MEDIUM   | 同上                                                                           |

**正确示例**:

- `less-layout.tsx:443` — 包含 `openPropsTokenSheet` ✅
- `less-search.tsx:164` — 包含 ✅
- `less-term.tsx:80` — 包含 ✅
- `less-toc.tsx:76` — 包含 ✅
- `shoelace-showcase.tsx:64` — 包含 ✅
- `home-console.tsx:115` — 包含 ✅
- `reactive-showcase.tsx:86` — 包含 ✅

---

## Issue #10: Complex signal patterns / computed signal in render()

| File                                | Line                                                                                      | Issue | Severity                                                                                                   | Fix recommendation |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------- | ------------------ |
| `reactive-showcase.tsx:120,124,127` | `computed(() => ...)` 内联在 JSX 中创建 — 每次 render() 调用创建新的 computed signal 实例 | HIGH  | 将 computed 声明移到渲染方法外部（如 `home-console.tsx:121-129` 的做法），避免每次渲染创建新的 effect 订阅 |                    |
| `reactive-showcase.tsx:147`         | `this.#filtered.value.map(...)` — `.value` + `.map()` 在 JSX 中                           | HIGH  | 见 Issue #2，同时应使用 `<fore each={this.#filtered}>` 控制流组件替代 `.map()`                             |                    |

**正确示例**: `home-console.tsx:121-129` 在类字段中声明 computed signals，render() 中仅通过 JSX prop 传递信号引用。

---

## Summary Statistics

| Category                                  | Issues Found | HIGH   | MEDIUM | LOW    |
| ----------------------------------------- | ------------ | ------ | ------ | ------ |
| #1: @lessjs/runtime import                | 20           | 0      | 20     | 0      |
| #2: signal.value in render()              | 2            | 2      | 0      | 0      |
| #3: Missing consumeContext/provideContext | 2            | 0      | 1      | 1      |
| #4: Raw setAttribute                      | 4            | 0      | 2      | 2      |
| #5: innerHTML writing                     | 5            | 0      | 4      | 1      |
| #6: Custom DOM utilities                  | 4            | 0      | 1      | 3      |
| #7: Missing AbortController               | 2            | 0      | 0      | 2      |
| #8: Missing CustomEvent                   | 2            | 0      | 0      | 2      |
| #9: Missing openPropsTokenSheet           | 11           | 9      | 2      | 0      |
| #10: Complex signal patterns              | 2            | 2      | 0      | 0      |
| **TOTAL**                                 | **54**       | **13** | **30** | **11** |

## Top Priority Fixes

1. **#9 (HIGH × 9)**: 所有 `@lessjs/ui` 组件必须包含 `openPropsTokenSheet` — 这是最高影响的问题，影响独立使用场景
2. **#2 (HIGH × 2)**: `less-toc.tsx` 和 `reactive-showcase.tsx` 违反 ADR-0062，需要在 render() 中去掉 `.value` 读取
3. **#10 (HIGH × 2)**: `reactive-showcase.tsx` 在 render() 中创建 `computed()` 实例，应移到类字段声明
4. **#1 (MEDIUM × 20)**: 批量替换 route 页面的 `@lessjs/runtime` → `@lessjs/core`
5. **#5 (MEDIUM × 4)**: 替换 innerHTML 写入为 `renderToDom()` 或 DOM API
