# www/ Content Model Audit — v0.27.0

## 1. innerHTML 使用情况

### .tsx 文件

| 文件                                        | 行号 | 模式                                            | 判定                                  |
| ------------------------------------------- | ---- | ----------------------------------------------- | ------------------------------------- |
| `routes/blog/[slug].tsx`                    | 105  | `innerHTML={post.html}`                         | **OK** — build-time markdown->html    |
| `routes/blog/[slug].tsx`                    | 158  | `innerHTML={post.html}`                         | **OK** — build-time markdown->html    |
| `islands/less-search.tsx`                   | 282  | `results.innerHTML = this._getResultsHtml()`    | **RUNTIME** — 搜索结果动态更新        |
| `islands/less-search.tsx`                   | 320  | `resultsDiv.innerHTML = this._getResultsHtml()` | **RUNTIME** — 同上                    |
| `routes/registry/[package]/[component].tsx` | 520  | `innerHTML={sanitizeSnapshot(tag.ssrSnapshot)}` | **OK** — 经 `sanitizeSnapshot()` 处理 |

### .ts 文件

| 文件                               | 行号                            | 模式                                         | 判定                           |
| ---------------------------------- | ------------------------------- | -------------------------------------------- | ------------------------------ |
| `islands/demo-idle.ts`             | 21                              | `this.shadowRoot!.innerHTML = this.render()` | **LEGACY** — demo island       |
| `islands/demo-visible.ts`          | 21                              | `this.shadowRoot!.innerHTML = this.render()` | **LEGACY** — demo island       |
| `islands/demo-only.ts`             | 21                              | `this.shadowRoot!.innerHTML = this.render()` | **LEGACY** — demo island       |
| `islands/demo-load.ts`             | 21                              | `this.shadowRoot!.innerHTML = this.render()` | **LEGACY** — demo island       |
| `islands/media-chrome-showcase.ts` | 52,62,69                        | `this.shadowRoot.innerHTML = this.render()`  | **LEGACY** — showcase island   |
| `data/_generated-blog-data.ts`     | 412,414,429,431,650,652,684,686 | `content`/`html` 字段包含 HTML 字符串        | **OK** — build-time 生成的数据 |

**结论**: 3 个 RUNTIME 风险点（`less-search.tsx` x2, `sanitizeSnapshot` x1），5 个 LEGACY island。`less-search.tsx` 应迁移到 JSX/signal 渲染，`demo-*` 和 `media-chrome-showcase` 可删除或用 JSX 重写。

---

## 2. 残留 `@lessjs/runtime` 导入

所有 .tsx 路由文件已迁移至 `@lessjs/core`。以下文件仍使用 `@lessjs/runtime`：

| 文件                       | 行号 | 导入                       |
| -------------------------- | ---- | -------------------------- |
| `islands/scroll-reveal.ts` | 7-8  | `DsdElement`, `StyleSheet` |
| `islands/demo-visible.ts`  | 5    | `defineIsland`             |
| `islands/demo-only.ts`     | 5    | `defineIsland`             |
| `islands/demo-load.ts`     | 5    | `defineIsland`             |
| `islands/demo-idle.ts`     | 5    | `defineIsland`             |

**代码示例中的 `@lessjs/runtime` 引用（文档，非真实导入）**:

- `routes/architecture/islands.tsx:122` — 代码示例
- `content/architecture/zh/islands.md:81` — MD 内容

**结论**: 5 个 .ts island 文件未迁移。`demo-*` 是 demo/legacy 代码。`scroll-reveal.ts` 需迁移。

---

## 3. 硬编码 #hex 颜色

排除语法高亮、swatches（`design-system.tsx`）、COMPAT_COLORS 对象（`registry/`）：

### 样式中的硬编码颜色

| 文件                        | 行号           | 颜色                      | 用途             |
| --------------------------- | -------------- | ------------------------- | ---------------- |
| `roadmap.tsx`               | 23             | `#11131a`                 | 页面背景         |
| `roadmap.tsx`               | 60,104,167,207 | `#fff`                    | 卡片背景         |
| `docs/index.tsx`            | 52             | `#fff`                    | 卡片背景         |
| `hub/index.tsx`             | 48             | `#fff`                    | 卡片背景         |
| `registry/index.tsx`        | 154            | `#fff`                    | 选中标签文字     |
| `registry/index.tsx`        | 277,282,294    | `#22c55e/#ef4444/#6366f1` | 状态文字颜色     |
| `registry/index.tsx`        | 563,571        | `#22c55e/#f59e0b`         | 模板字符串内内联 |
| `[package]/[component].tsx` | 186,198        | `#fff`                    | 卡片/容器背景    |

### SVG 图形（`home-console.tsx`）

大量 `#7C6FF5`, `#FFFFFF`, `#60EFFF`, `#00FF87`, `#FB7185`, `#05070B`, `#8E92A2`, `#E9ECEF` — SVG 艺术图形，**可接受**。

### 代码示例中的颜色（文档）

`configuration.tsx:118,122,247,251` 中 `#050505` — 文档代码示例，**可接受**。

**结论**: `roadmap.tsx:#11131a` 页面背景和 4 处 `#fff` 卡片背景应改为 design token。`registry/` 状态颜色应抽出为 token 变量。

---

## 4. `var(--xxx, #fallback)` 模式

**未发现任何残留**。所有 `var()` 调用均无 fallback 色值。此项已清理完毕。

---

## 5. `_esc()` 使用

**未发现**任何 `_esc()` 调用。此项已清理完毕。

---

## 6. Thin loader / `[page]` 残留

**未发现**任何 `[page]` 引用或 `[page].tsx` 文件。路由系统已全部迁移至新内容模型。

---

## 7. MD 内容文件清单

### `content/architecture/`

| 语言  | 文件数 | 对应路由                               |
| ----- | ------ | -------------------------------------- |
| `en/` | 9      | `routes/architecture/*.tsx` (9 routes) |
| `zh/` | 9      | 同上（i18n）                           |

### `content/guide/`

| 语言  | 文件数 | 对应路由                        |
| ----- | ------ | ------------------------------- |
| `en/` | 9      | `routes/guide/*.tsx` (9 routes) |
| `zh/` | 9      | 同上（i18n）                    |

**孤儿文件**: `content/guide/getting-started.en.md` — 应删除或移至 `content/guide/en/getting-started.md`。这是内容模型迁移遗留的旧文件。

### `content/blog/`（43 文件）

- 版本公告: 13 个（2026-04 至 2026-05）
- ADR 系列: 21 个（0001-0024，adr-0008-0009 等）
- 专题: `core-architecture-simplification-report.md`
- 子目录: `deployment/` (1), `design/` (2)

所有文件均与 `_generated-blog-data.ts` 中的条目对应，无孤儿。

---

## 总结

| 检查项                | 状态         | 问题数                  |
| --------------------- | ------------ | ----------------------- |
| innerHTML 残留        | 需处理       | 3 runtime + 5 legacy    |
| @lessjs/runtime 导入  | 未完成       | 5 文件未迁移            |
| 硬编码颜色            | 部分残留     | ~10 处需令牌化          |
| var(--xxx, #fallback) | 已清理       | 0                       |
| _esc() 使用           | 已清理       | 0                       |
| [page] 残留           | 已清理       | 0                       |
| MD 内容孤儿           | 1 个孤儿文件 | `getting-started.en.md` |

**高优先级**: `less-search.tsx` innerHTML 迁移、`scroll-reveal.ts` 迁移至 `@lessjs/core`。
**中优先级**: 删除 `getting-started.en.md` 孤儿文件、清理 `demo-*` legacy islands。
**低优先级**: `#fff` 和 `#11131a` 硬编码颜色令牌化。
