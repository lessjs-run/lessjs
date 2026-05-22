# SOP-013: Lit 依赖彻底清理（Ocean-Island 架构收尾）

| 项目         | 内容                                                               |
| ------------ | ------------------------------------------------------------------ |
| **版本**     | v0.20.0 Ocean-Island                                               |
| **状态**     | 已完成                                                             |
| **依赖**     | SOP-001~012（组件已迁移到 DsdElement，本 SOP 清理残留 Lit import） |
| **前置 ADR** | ADR-0036 Ocean-Island Architecture                                 |

---

## 目标

**`@lessjs/ui` 和 `www/` 中零行 `from 'lit'`**。所有 Ocean 组件使用纯 `DsdElement` + `CSSStyleSheet`，无框架依赖。仅当组件需要 reactivity（状态管理、响应式更新）时，通过 `@lessjs/adapter-lit` 按需接入 Lit。

## 原则

1. **Ocean = DSD + 零框架**：`render(): string`，`static styles = new StyleSheet()`
2. **Island = 按需接框架**：只有真正需要 `requestUpdate()`、`@property`、`@state` 的组件才保留 Lit
3. **CSS = 纯字符串或 StyleSheet**：不用 Lit 的 `css` tagged template
4. **adapter-lit 是外部适配器**：保留，但不被框架内部依赖

---

## 清理清单

### A. Token 层（7 文件）— `css` → 纯字符串 + `StyleSheet`

| #  | 文件                                   | 当前                                                        | 目标                                   |
| -- | -------------------------------------- | ----------------------------------------------------------- | -------------------------------------- |
| A1 | `packages/ui/src/tokens/spacing.ts`    | `import { css } from 'lit'` → `export const X = css\`...\`` | `export const X = \`...\``（纯字符串） |
| A2 | `packages/ui/src/tokens/typography.ts` | 同上                                                        | 同上                                   |
| A3 | `packages/ui/src/tokens/effects.ts`    | 同上                                                        | 同上                                   |
| A4 | `packages/ui/src/tokens/radius.ts`     | 同上                                                        | 同上                                   |
| A5 | `packages/ui/src/tokens/animation.ts`  | 同上                                                        | 同上                                   |
| A6 | `packages/ui/src/design-tokens.ts`     | `import { css, CSSResult } from 'lit'`，插值组合            | 组合字符串 → `new StyleSheet()`        |
| A7 | `packages/ui/deno.json`                | 可能声明 `lit` 依赖                                         | 移除 `lit`（如果没有其他引用）         |

**关键设计决策**：Token 文件导出**纯 CSS 字符串**（不创建 StyleSheet），由消费方决定如何使用。`design-tokens.ts` 作为组合入口，用 `new StyleSheet()` 创建最终的 merged token sheet。

### B. UI 组件层（1 文件）— `LitElement` → `DsdElement`

| #  | 文件                                | 当前                                                                                | 目标                                                                                 |
| -- | ----------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| B1 | `packages/ui/src/less-hero-ping.ts` | `class HeroPing extends LitElement`，`html\`...\``，`css\`...\``，`requestUpdate()` | `class HeroPing extends DsdElement`，`render(): string`，`StyleSheet`，手动 DOM 更新 |

**HeroPing 迁移要点**：

- `static styles` → `static styles = new StyleSheet()` + `replaceSync()`
- `render()` 返回 HTML 字符串 + `${}` 插值
- `@click` → `static hydrateEvents`
- `requestUpdate()` → 手动 `this.shadowRoot!.querySelector(...)` 更新 DOM
- `?disabled` → 手动 setAttribute

### C. www 组件层（8 文件 → 6 迁移 + 2 保留）

| #  | 文件                                     | 判定                                             | 目标                             |
| -- | ---------------------------------------- | ------------------------------------------------ | -------------------------------- |
| C1 | `www/app/components/page-styles.ts`      | Ocean（纯 CSS）                                  | `css` → 纯字符串                 |
| C2 | `www/app/islands/less-toc.ts`            | Ocean（IntersectionObserver，无 Lit reactivity） | `LitElement` → `DsdElement`      |
| C3 | `www/app/islands/scroll-reveal.ts`       | Ocean（IntersectionObserver，无 Lit reactivity） | `LitElement` → `DsdElement`      |
| C4 | `www/app/islands/less-showcase-panel.ts` | Ocean（DsdLitElement → DsdElement）              | 改为 `extends DsdElement`        |
| C5 | `www/app/islands/less-term.ts`           | Ocean（DsdLitElement → DsdElement）              | 改为 `extends DsdElement`        |
| C6 | `www/app/islands/shoelace-showcase.ts`   | Ocean（静态展示）                                | `LitElement` → `DsdElement`      |
| C7 | `www/app/islands/api-consumer.ts`        | **Island**（fetch + 状态更新 → 需要 reactivity） | **保留 Lit**（通过 adapter-lit） |
| C8 | `www/app/islands/counter-island.ts`      | **Island**（点击计数 → 需要 reactivity）         | **保留 Lit**（通过 adapter-lit） |

**Island 保留判定标准**：

- 有 `@state` / `@property` 装饰器
- 调用 `this.requestUpdate()`
- 渲染逻辑依赖运行时状态变化
- 不满足以上条件 → 就是 Ocean，必须迁移

### D. 脚手架模板（1 文件，2 组件）

| #  | 文件                          | 当前                                                          | 目标                                                          |
| -- | ----------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| D1 | `packages/create/cli.ts` 模板 | `HomePage extends LitElement`、`MyCounter extends LitElement` | `HomePage extends DsdElement`、`MyCounter extends DsdElement` |

### E. 依赖清理

| #  | 文件                        | 操作                                                          |
| -- | --------------------------- | ------------------------------------------------------------- |
| E1 | `packages/ui/deno.json`     | 检查并移除 `lit` import（如果 token 和 hero-ping 是最后引用） |
| E2 | `packages/create/deno.json` | 检查模板不再引用 `lit`，移除对应 import map entry             |

---

## 禁止行为

- ❌ 禁止用字符串替换 hack 模拟 Lit reactivity（如 `eval()`、正则替换 template）
- ❌ 禁止在 Ocean 组件里保留 `import { html } from 'lit'`
- ❌ 禁止删除 `@lessjs/adapter-lit` 包
- ❌ 禁止在没有 reactivity 需求的组件上保留 Lit

---

## 验证标准

1. `grep -rn "from 'lit'" packages/ui/src/` 返回空（零结果）
2. `grep -rn "from 'lit'" www/app/components/ www/app/islands/less-toc.ts www/app/islands/scroll-reveal.ts www/app/islands/less-showcase-panel.ts www/app/islands/less-term.ts www/app/islands/shoelace-showcase.ts` 返回空
3. 全量测试通过（`deno test packages/`）
4. `deno fmt` + `deno lint` 通过
5. create-less 模板生成的项目可构建
6. `less-hero-ping` 点击 Ping Server 按钮后状态正确更新（手动 DOM 操作）
7. `less-toc` IntersectionObserver 正确高亮当前章节
