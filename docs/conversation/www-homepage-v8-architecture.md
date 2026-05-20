# LessJS 首页 v8 架构设计 + 任务分解

> 文档版本: 1.0 | 作者: 高见远 (Gao) | 日期: 2026-05-19
> 状态: DRAFT | 基于 PRD v1.0 (Xu, 2026-05-19)

---

## 1. 实现方案

### 1.1 只改一个文件

`www/app/routes/index/index.ts` — 修改其 `styles` (CSS) 和 `_renderZh` / `_renderEn` (HTML 模板)。

不引入新依赖，不创建新 Web Component。使用已有组件：`less-showcase-panel`、`less-callout`、`less-step-card`、`less-code-block`、`less-term-demo`、`less-search`、`less-layout`。

---

### 1.2 块级变更总览

| 区块            | v7 现状                                             | v8 改动                                                     | 涉及行号                       |
| --------------- | --------------------------------------------------- | ----------------------------------------------------------- | ------------------------------ |
| Hero            | Logo + h1 三支柱标题 + 长描述 + term-demo + 4 stats | Logo + 一行定位语 + 副标题 + CTA（移除 term-demo 和 stats） | CSS 213-298, HTML 790-817      |
| Code Strip      | 暗色代码对比                                        | 不变（仅去掉下方的 sec-divider）                            | HTML 845 删除                  |
| Benchmark       | 条形图 + 2 bench-stat + bench-note                  | +4 stat 卡片（从 Hero 移来）+ Astro 对比 callout            | CSS 536-564 增强, HTML 875-909 |
| Multi-framework | sec-lbl + sec-title + showcase                      | 去掉 sec-lbl，保留标题 + showcase                           | HTML 914-920                   |
| Bento Grid      | 1 大卡(全栈) + 2 小卡(WC引擎/Registry)              | 1 主导宽卡(WC引擎) + 2 小卡(全栈/Registry)                  | CSS 434-479 重写, HTML 848-870 |
| Quick Start     | 3 step-card 无说明                                  | +每步说明文字 + 底部 CTA                                    | CSS 566-597 增强, HTML 925-941 |
| Footer          | 暖灰完整 Footer                                     | 不变（仅 html 注释号修正）                                  | HTML 944                       |

---

### 1.3 HTML 区块重排序

```
v7 顺序:  Hero → CodeStrip → (divider) → Bento → (divider) → Benchmark → (divider) → MultiFw → (divider) → QuickStart → Footer
v8 顺序:  Hero → CodeStrip → BundleLine → Benchmark → MultiFw → GlowLine → Bento → QuickStart → Footer
```

具体改动（_renderZh 和 _renderEn 对称修改）：

- **删除 4 个 `<hr class="sec-divider">`**：当前分别位于行 845, 872, 911, 922（ZH）和 1047, 1074, 1113, 1124（EN）。
- **Bento Grid HTML 块**（当前行 848-870 ZH / 1051-1073 EN）移动到 **Multi-framework 之后**（新位置在 Quick Start 之前）。
- **Benchmark HTML 块**（当前行 875-909 ZH / 1078-1111 EN）移动到 **Code Strip 之后**。

---

### 1.4 CSS 类变更明细

#### 1.4.1 删除的 CSS 类

| 类名                                            | 当前行号 | 说明                                                 |
| ----------------------------------------------- | -------- | ---------------------------------------------------- |
| `.sec-divider`                                  | 406-413  | 通用分割线，v8 替代为区块专有过渡                    |
| `.stats`, `.stat`, `.stat strong`, `.stat span` | 279-298  | Hero 统计数据样式，移到 Benchmark 使用 `.bench-stat` |
| `less-term-demo`                                | 273-276  | CSS 块级样式，`less-term-demo` 元素从 Hero 移除      |

同步删除 `.sec-divider` 在响应式和 reduced-motion 中的引用（不涉及，`sec-divider` 无动画/响应式覆盖）。

#### 1.4.2 修改的 CSS 类

| 类名          | 当前行号 | 变更内容                                                                                              |
| ------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `.hero-desc`  | 228-234  | 从"长描述"改为"副标题"，保留基础样式但 font-size 可能调整                                             |
| `.hero h1`    | 213-220  | Hero h1 改为更短文本，可保留品牌色 `<em>` 高亮                                                        |
| `.hero h1 em` | 221-226  | 品牌色渐变高亮保留，用于"零 JS 首屏"和"多框架共存"                                                    |
| `.cards`      | 434-438  | 从 `2fr 1fr` + `:first-child grid-row: 1/3` 改为 `1fr 1fr`（两行布局）+ 第一行全宽的 WC Engine 主导卡 |
| `.card`       | 443-456  | 基础 `.card` 保留，新增 `.card-dominant` 变体                                                         |
| `.qs`         | 567-572  | 保留基础结构，增强 `.qs-step-card` 内新增描述行样式                                                   |
| `.sec-title`  | 422-428  | 保留不变（Benchmark/Bento/QuickStart 仍使用）                                                         |
| `.bench-note` | 531-536  | 内容更新为 Astro 对比 + 技术注脚                                                                      |

#### 1.4.3 新增的 CSS 类

| 类名                          | 说明                                                                             | 区块间位置              |
| ----------------------------- | -------------------------------------------------------------------------------- | ----------------------- |
| `.turn-line`                  | 品牌色渐变细线 (`#534AB7 → transparent`)，暗→浅翻转                              | Code Strip → Benchmark  |
| `.turn-glow`                  | 品牌色光晕分割 (`radial-gradient`)，浅→浅微变化                                  | Multi-framework → Bento |
| `.card-dominant`              | WC Engine 主导卡：全宽、品牌色淡背景 `rgba(83,74,183,0.04)`、左侧 2px 品牌色竖线 | Bento 第一行            |
| `.card-dominant .card-accent` | 左侧 2px 品牌色竖线伪元素，hover 时发光                                          | Bento                   |
| `.card-pills`                 | Pill 标签容器 flex                                                               | Bento WC Engine 卡内    |
| `.card-pill`                  | 单个 pill: `DSD` / `Island` / `Multi-adapter`，品牌色淡底 + 圆角                 | Bento                   |
| `.bench-astro`                | Astro 对比说明小字 callout，hover 展开样式                                       | Benchmark 底部          |
| `.qs-desc`                    | Quick Start 每个步骤的描述文字                                                   | Quick Start             |
| `.qs-cta`                     | Quick Start 底部 CTA 按钮                                                        | Quick Start             |
| `.qs-cta a`                   | CTA 按钮样式，复刻 `.hero-pri` 逻辑但浅色背景下                                  | Quick Start             |
| `.sec-no-label`               | 新节样式（Multi-framework 专用）：去掉 label 区域但保留标题 + 内容               | 全局                    |

---

### 1.5 HTML 模板变更（行号级）

#### Hero（_renderZh: 行 801-815 → v8）

```diff
- <h1>全栈框架 <em>+</em> WC 引擎 <em>+</em> Registry Hub</h1>
- <p class="hero-desc">
-   Declarative Shadow DOM 零 JS 首屏。Island 架构按需升级交互。Hono API Route 提供后端能力。Registry Hub 一键发现安装 WC 组件。
- </p>
+ <h1>全栈框架 · <em>零 JS 首屏</em> · <em>多框架共存</em></h1>
+ <p class="hero-desc">DSD 原生渲染，浏览器零 JS 看到完整页面</p>
  <div class="hero-actions">
    <a class="hero-pri" href="/guide/getting-started">开始使用 →</a>
    <a class="hero-sec" href="/guide/positioning">理解定位</a>
  </div>
- <less-term-demo></less-term-demo>
- <div class="stats">
-   <div class="stat"><strong>v0.19.0</strong><span>最新版本</span></div>
-   <div class="stat"><strong>681</strong><span>测试通过</span></div>
-   <div class="stat"><strong>13</strong><span>个包</span></div>
-   <div class="stat"><strong>1</strong><span>运行时依赖</span></div>
- </div>
```

#### Benchmark 增强（新增 stats + Astro 对比）

在 `.bench-grid` 区域（当前行 896-904 ZH）添加 4 个 stat 卡片：

```html
<!-- 新增：4 stat 卡片，从 Hero 移来 -->
<div class="bench-grid">
  <div class="bench-stat">
    <h4><span class="brand">v0.19.0</span></h4>
    <p>最新版本</p>
  </div>
  <div class="bench-stat">
    <h4><span class="brand">681</span> tests</h4>
    <p>全部通过</p>
  </div>
  <div class="bench-stat">
    <h4><span class="brand">13</span> packages</h4>
    <p>monorepo</p>
  </div>
  <div class="bench-stat">
    <h4><span class="brand">1</span> runtime dep</h4>
    <p>零外部依赖链</p>
  </div>
</div>
```

Astro 对比说明（放在 `.bench-note` 中或作为单独的 `.bench-astro` callout）：

```html
<less-callout>
  <p>
    Unlike Astro, LessJS achieves zero-JS without a "no-JS-by-default" policy — DSD is a browser
    primitive, not a convention.
  </p>
</less-callout>
```

#### Multi-framework 去 Label

```diff
- <h2 class="sec-lbl">多框架</h2>
+ <!-- sec-lbl removed: showcase section doesn't need reading navigation -->
```

#### Bento Grid 重组

```diff
- <div class="cards">
-   <div class="card">
-     <div class="card-icon" style="background:#E6F1FB;color:#185FA5;">F</div>
-     <h3>全栈框架</h3>
-     <p>文件约定路由 + Hono API Route + Serverless 部署。SSG/ISR/SSR 同一套渲染引擎。</p>
-   </div>
-   <div class="card">
-     <div class="card-icon" style="background:var(--less-brand-subtle, #EEEDFE);color:var(--less-brand, #534AB7);">D</div>
-     <h3>WC 渲染引擎</h3>
-     <p>DSD 零 JS 首屏，Lit/React/Vanilla 适配器共存。</p>
-   </div>
-   <div class="card">
-     <div class="card-icon" style="background:#E1F5EE;color:#0F6E56;">I</div>
-     <h3>Registry Hub</h3>
-     <p>Web Component 发现、验证、一键安装。</p>
-   </div>
- </div>
+ <div class="cards">
+   <div class="card card-dominant">
+     <div class="card-icon" style="background:var(--less-brand-subtle, #EEEDFE);color:var(--less-brand, #534AB7);">D</div>
+     <h3>WC 渲染引擎</h3>
+     <p>DSD 零 JS 首屏，Lit/React/Vanilla 适配器共存。</p>
+     <div class="card-pills">
+       <span class="card-pill">DSD</span>
+       <span class="card-pill">Island</span>
+       <span class="card-pill">Multi-adapter</span>
+     </div>
+   </div>
+   <div class="card">
+     <div class="card-icon" style="background:#E6F1FB;color:#185FA5;">F</div>
+     <h3>全栈框架</h3>
+     <p>文件约定路由 + Hono API Route + Serverless 部署。</p>
+   </div>
+   <div class="card">
+     <div class="card-icon" style="background:#E1F5EE;color:#0F6E56;">I</div>
+     <h3>Registry Hub</h3>
+     <p>Web Component 发现、验证、一键安装。</p>
+   </div>
+ </div>
```

注意：WC Engine 卡现在独占第一行（`grid-column: 1 / -1`），两张小卡在第二行并排。

#### Quick Start 增强

```diff
  <div class="qs-step-card">
-   <less-step-card step="1" label="创建"><code>deno run -A jsr:@lessjs/create my-app</code></less-step-card>
+   <less-step-card step="1" label="创建"><code>deno run -A jsr:@lessjs/create my-app</code></less-step-card>
+   <p class="qs-desc">脚手架包含：路由 + SSG + Island 示例</p>
  </div>
  <div class="qs-step-card">
    <less-step-card step="2" label="开发"><code>cd my-app &amp;&amp; deno task dev</code></less-step-card>
+   <p class="qs-desc">热更新 + DSD 实时预览 → localhost:5173</p>
  </div>
  <div class="qs-step-card">
    <less-step-card step="3" label="构建"><code>deno task build → dist/</code></less-step-card>
+   <p class="qs-desc">纯静态文件，部署到任何 Serverless 平台</p>
  </div>
+ <div class="qs-cta">
+   <a href="/guide/getting-started">开始使用 →</a>
+ </div>
```

---

### 1.6 过渡设计实现

```
Hero ─────────────── 无过渡（暗色连续）
  ↓
Code Strip ───────── 无过渡（暗色连续，代码对比区自明）
  ↓
.turn-line ──────── 品牌色渐变线 (#534AB7 → transparent, 1px height)
  ↓                 表示暗→浅"幕布升起"
Benchmark ───────── 浅色
  ↓
无过渡 ──────────── Benchmark → Multi-framework 直接滚入
  ↓
Multi-framework ─── 浅色（无 sec-label，标题作为视觉入口）
  ↓
.turn-glow ──────── 品牌色光晕细线 (radial-gradient)
  ↓                 表示"展示结束，回到阅读"
Bento Grid ──────── 浅色
  ↓
无过渡 ──────────── Bento → Quick Start 自然滚动（均为浅色）
  ↓
Quick Start ─────── 浅色 → 暖灰渐变背景过渡
  ↓
Footer ──────────── 暖灰 (#F1EFE8)
```

---

### 1.7 新增 CSS 规范

```css
/* ── Transition: dark → light (Code Strip → Benchmark) ── */
.turn-line {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--less-brand, #534ab7) 50%, transparent);
  opacity: 0.3;
  border: none;
  margin-top: 0;
  margin-bottom: 0;
}

/* ── Transition: showcase → narrative (Multi-framework → Bento) ── */
.turn-glow {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  height: 1px;
  background: radial-gradient(
    ellipse at 50% 50%,
    var(--less-brand-glow, rgba(83, 74, 183, 0.25)),
    transparent 70%
  );
  border: none;
}

/* ── Bento: WC Engine dominant card ── */
.card-dominant {
  grid-column: 1 / -1;
  background: rgba(83, 74, 183, 0.04);
  border-left: 2px solid var(--less-brand, #534ab7);
  position: relative;
}
.card-dominant:hover {
  border-left-color: var(--less-brand-light, #6d5ce8);
  box-shadow: 0 0 16px var(--less-brand-glow, rgba(83, 74, 183, 0.15)) inset;
}

/* ── Bento: pill labels ── */
.card-pills {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}
.card-pill {
  display: inline-flex;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--less-brand, #534ab7);
  background: rgba(83, 74, 183, 0.08);
  border: 1px solid rgba(83, 74, 183, 0.15);
}

/* ── Quick Start: step description ── */
.qs-desc {
  font-size: 12px;
  color: var(--less-text-muted);
  margin: 4px 0 0;
  line-height: 1.5;
}

/* ── Quick Start: bottom CTA ── */
.qs-cta {
  text-align: center;
  margin-top: 12px;
}
.qs-cta a {
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 24px;
  border-radius: var(--less-radius-md, 8px);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  color: #fff;
  background: linear-gradient(135deg, var(--less-brand, #534ab7), var(--less-brand-light, #6d5ce8));
  box-shadow: var(--less-shadow-brand-md, 0 4px 20px rgba(83, 74, 183, 0.3));
  transition:
    transform var(--less-duration-micro, 150ms) var(--less-easing-default, ease-out),
    box-shadow var(--less-duration-micro, 150ms) var(--less-easing-default, ease-out);
}
.qs-cta a:hover {
  transform: translateY(-1px);
  box-shadow: var(--less-shadow-brand-lg, 0 8px 32px rgba(83, 74, 183, 0.4));
}

/* ── Benchmark: Astro comparison callout ── */
.bench-astro {
  margin-top: 16px;
  padding: 12px 16px;
  border: 1px solid var(--less-border);
  border-radius: var(--less-radius-md, 8px);
  background: var(--less-bg-surface);
  font-size: 12px;
  color: var(--less-text-secondary);
  line-height: 1.6;
}
```

---

### 1.8 Bento Grid 响应式调整

当前 `.cards` 响应式在行 732-737：

```css
/* 修改前 (v7) */
.cards {
  grid-template-columns: 1fr;
}
.card:first-child {
  grid-row: auto;
}

/* 修改后 (v8) — WC Engine 主导卡在移动端也独占一行，两张小卡并排 */
.cards {
  grid-template-columns: 1fr 1fr;
}
.card-dominant {
  grid-column: 1 / -1;
}
```

480px 以下：全部单列：

```css
.cards {
  grid-template-columns: 1fr;
}
```

---

## 2. 文件列表

| 文件                            | 改动类型 | 说明                                   |
| ------------------------------- | -------- | -------------------------------------- |
| `www/app/routes/index/index.ts` | 修改     | CSS styles + _renderZh() + _renderEn() |

仅此一个文件。`less-term-demo` island 保留（不删除组件，仅从 Hero 移除引用）。

---

## 3. CSS 类完整变更表

### 删除

- `.sec-divider`
- `.stats`, `.stat`, `.stat strong`, `.stat span`
- `less-term-demo { ... }`

### 新增

- `.turn-line`
- `.turn-glow`
- `.card-dominant`
- `.card-pills`
- `.card-pill`
- `.bench-astro`
- `.qs-desc`
- `.qs-cta`, `.qs-cta a`

### 修改

- `.hero h1` — 文本变短，保持 CSS 不变
- `.hero-desc` — 从长描述变为副标题，可能调整 font-size
- `.cards` — grid-template 从 `2fr 1fr` 改为 `1fr 1fr`
- `.card:first-child` — 移除 `grid-row: 1/3`
- `.sec-title` — Multi-framework 区块的 label 删除，标题保留
- `.qs` — 保留时间轴结构，步骤卡片内新增 `.qs-desc`
- `.bench-note` — 内容从纯技术注脚改为 Astro 对比 + 注脚
- `.bench-grid` — 扩展为 4 列（移动端 2 列）

### 保留不变

- `.hero`, `.hero-inner`, `.hero-lockup`, `.hero-actions`, `.hero-pri`, `.hero-sec`
- `.code-strip`, `.code-strip-inner`, `.code-strip-header`, `.code-strip-label`, `.code-strip-arrow`, `.zero-badge`, `.code-compare`, `.code-pane`, `.code-bar`
- `.bench`, `.bench-row`, `.bench-lbl`, `.bench-track`, `.bench-fill`, `.bench-stat`
- `.site-footer`, `.site-footer-inner`, `.footer-brand`, `.footer-sep`, `.footer-grid`, `.footer-col`, `.footer-col-title`, `.footer-terminal`, `.footer-bottom`
- 所有 `@keyframes`、`:focus-visible`、`@media (prefers-reduced-motion)`、响应式媒体查询（除 `.cards` 调整外）

---

## 4. 任务列表

### 任务 1: Hero 精简化

**依赖**: 无
**文件**: `index.ts`
**改动范围**: CSS 213-276, 279-298; HTML Zh 801-815, En 1003-1018

**具体操作**:

1. 修改 `_renderZh` 行 801: h1 内容改为 `全栈框架 · <em>零 JS 首屏</em> · <em>多框架共存</em>`
2. 修改行 802-804: `.hero-desc` 改为 `DSD 原生渲染，浏览器零 JS 看到完整页面`
3. 删除行 809: `<less-term-demo></less-term-demo>`
4. 删除行 810-815: 整个 `.stats` div
5. 删除 CSS 行 273-276: `less-term-demo` 样式块
6. 删除 CSS 行 279-298: `.stats`, `.stat`, `.stat strong`, `.stat span`
7. 对称修改 `_renderEn` 行 1003-1018

**验收标准**:

- Hero 区域只有 Logo + h1 + 副标题 + CTA 按钮
- `less-term-demo` 和 stats 不再渲染
- TypeScript 编译无错误

---

### 任务 2: 区块重新排序 + 移除 sec-divider

**依赖**: 任务 1 完成（避免行号冲突）
**文件**: `index.ts`
**改动范围**: CSS 401-431, HTML 845-941 (Zh), 1047-1143 (En)

**具体操作**:

1. 删除 HTML 行 845: 第一个 `<hr class="sec-divider">`（Zh）
2. 删除 HTML 行 872: 第二个 `<hr class="sec-divider">`（Zh）
3. 删除 HTML 行 911: 第三个 `<hr class="sec-divider">`（Zh）
4. 删除 HTML 行 922: 第四个 `<hr class="sec-divider">`（Zh）
5. 将 Benchmark HTML 块（行 875-909）移到 Code Strip 之后
6. 将 Bento Grid HTML 块（行 848-870）移到 Multi-framework 之后、Quick Start 之前
7. 在 Code Strip → Benchmark 之间插入 `.turn-line` 分割线
8. 在 Multi-framework → Bento 之间插入 `.turn-glow` 分割线
9. 删除 CSS 行 406-413: `.sec-divider` 类
10. 新增 CSS: `.turn-line` 和 `.turn-glow` 类（见 1.7 节规范）
11. 对称修改 `_renderEn`

**验收标准**:

- 区块顺序: Hero → Code Strip → Benchmark → Multi-framework → Bento → Quick Start
- 无 `<hr class="sec-divider">` 残留
- `.turn-line` 和 `.turn-glow` 渲染正确
- TypeScript 编译无错误

---

### 任务 3: Benchmark 增强（stats 迁移 + Astro 对比）

**依赖**: 任务 2 完成（Benchmark 已移到正确位置）
**文件**: `index.ts`
**改动范围**: CSS 536-564, HTML Benchmark 区块

**具体操作**:

1. 在 Benchmark `.bench-grid` 中添加 4 个 stat 卡片（从 Hero 移来的数据）
2. 更新 `.bench-grid` CSS: `grid-template-columns` 从 `1fr 1fr` 改为 `repeat(4, 1fr)`（桌面端 4 列），移动端可改为 `1fr 1fr`
3. 新增 `<less-callout>` Astro 对比说明（放在 bench-note 之后）
4. 新增 CSS `.bench-astro` 样式（见 1.7 节）
5. 更新 `.bench-note` 文本（添加"工程优化无法替代浏览器原生能力"措辞）
6. 对称修改 `_renderEn`

**验收标准**:

- Benchmark 区域显示 4 个 stat 卡片（版本号、测试数、包数、依赖数）
- Astro 对比 callout 渲染
- 响应式: 桌面 4 列 stat，移动端 2 列
- TypeScript 编译无错误

---

### 任务 4: Bento Grid 视觉层级重构

**依赖**: 任务 2 完成（Bento 已移到正确位置）
**文件**: `index.ts`
**改动范围**: CSS 434-479, HTML Bento 区块（新位置为 Multi-framework 之后）

**具体操作**:

1. 修改 `.cards` CSS 行 434-438: `grid-template-columns` 从 `2fr 1fr` 改为 `1fr 1fr`
2. 删除 CSS 行 440-442: `.card:first-child { grid-row: 1/3; }`
3. 新增 CSS `.card-dominant` 样式（见 1.7 节）
4. 新增 CSS `.card-pills` 和 `.card-pill` 样式（见 1.7 节）
5. 修改 HTML: WC Engine 卡移到第一位，添加 `card-dominant` 类和 pill 标签
6. 调整 HTML 卡片顺序: WC Engine(主导) → 全栈框架(小) → Registry Hub(小)
7. 修改响应式 CSS 行 732-737: `.cards` 改为 `grid-template-columns: 1fr 1fr`，`.card-dominant` 添加 `grid-column: 1 / -1`
8. 对称修改 `_renderEn`

**验收标准**:

- WC Engine 卡独占第一行，品牌色淡背景 + 左侧竖线
- 两张小卡在第二行并排
- 3 个 pill 标签 (DSD/Island/Multi-adapter) 渲染在 WC Engine 卡内
- Hover 效果: 主导卡左侧竖线发光
- 响应式正常
- TypeScript 编译无错误

---

### 任务 5: Quick Start 增强 + Footer 衔接

**依赖**: 任务 2 完成
**文件**: `index.ts`
**改动范围**: CSS 566-597, HTML Quick Start 区块, HTML Footer

**具体操作**:

1. 在 `_renderZh` 和 `_renderEn` 的每个 `.qs-step-card` 内 `<less-step-card>` 之后添加 `<p class="qs-desc">`
   - Step 1: 脚手架包含：路由 + SSG + Island 示例
   - Step 2: 热更新 + DSD 实时预览 → localhost:5173
   - Step 3: 纯静态文件，部署到任何 Serverless 平台
2. 在 `.qs` div 之后、`</div><!-- sec-bd -->` 之前添加 `.qs-cta` CTA 按钮
3. 新增 CSS `.qs-desc` 样式（见 1.7 节）
4. 新增 CSS `.qs-cta` 和 `.qs-cta a` 样式（见 1.7 节）
5. 修正 Footer 注释号: `<!-- ═══ III. Footer -->` 改为 `<!-- ═══ VI. Footer -->`（因为现在它是第 6 个区块）
6. Quick Start 区域添加暖灰渐变背景过渡: `.sec` 的最后一个区块添加 `background: linear-gradient(180deg, #ffffff 0%, #F1EFE8 100%); padding-bottom: 2rem;`

**验收标准**:

- 每个 Quick Start 步骤显示说明文字
- 底部品牌色 CTA 按钮渲染
- 渐变过渡到 Footer 暖灰
- TypeScript 编译无错误

---

### 任务依赖图

```
任务1 (Hero 精简) ──────┐
                        ├──→ 任务2 (排序+去divider) ──┬──→ 任务3 (Benchmark)
                        │                            ├──→ 任务4 (Bento)
                        │                            └──→ 任务5 (QuickStart)
```

任务 1 应先完成（减少 Hero DOM 避免后续排序时携带冗余内容）。任务 2-5 在任务 1 完成后可并行进行，但必须在同一文件上顺序操作以避免冲突。

**建议执行顺序**: 1 → 2 → 3 → 4 → 5（串行，因为所有改动在同一文件）

---

## 5. 待明确事项

以下问题在 PRD 中标注为"待确认"或架构设计过程中发现的设计歧义：

| #      | 问题                                                                                     | PRD 建议                                            | 架构判断                                                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Q1** | Astro 对比措辞："无法追平"是否太 aggressive？                                            | 改为"工程优化无法替代浏览器原生能力"                | **采纳 PRD 建议**。使用 `less-callout` 组件 + 解释性文字                                                                                          |
| **Q2** | Benchmark 是否保留 Fresh 和 Next.js 数据？                                               | 保留，标注测试条件                                  | **保留**。条形图数据不变，在 `.bench-note` 中标注测试条件                                                                                         |
| **Q3** | WC Engine 卡片的 DSD/Island/Multi-adapter 子内容是否与 Code Strip/Multi-framework 重复？ | 不重复，Code Strip 是演示，Bento 是解释系统架构     | **采纳 PRD 判断**。Pill 标签仅作为快速标签，不展开内容                                                                                            |
| **Q4** | Quick Start 底部 CTA 是否与 Hero CTA 重复？                                              | 不重复，Hero CTA 是"了解"，Quick Start CTA 是"行动" | **采纳 PRD 判断**。两个 CTA 同样指向 `/guide/getting-started`，但位于不同心理阶段                                                                 |
| **Q5** | `less-term-demo` 完全移除还是保留组件仅移除引用？                                        | PRD 说移到 Code Strip 下方                          | **架构判断**: 移除 Hero 中的引用即可，组件文件保留不删。如需在 P2 阶段恢复到其他位置，组件已就绪                                                  |
| **Q6** | Bento Grid 的 `.cards` 桌面端是否应该 `1fr 1fr` 还是允许第一个卡全宽？                   | PRD 说 WC Engine 全宽或 2fr                         | **采用 `1fr 1fr` + `.card-dominant { grid-column: 1 / -1 }`**。WC Engine 卡使用 `grid-column: 1 / -1` 独占第一行，两张小卡在第二行 `1fr 1fr` 并排 |
| **Q7** | Quick Start 渐变过渡到 Footer：是 Quick Start 的 `.sec` 加渐变还是 Footer 顶部加渐变？   | PRD 说"Quick Start 白色 → 渐变过渡到 Footer 暖灰"   | **在 `.sec` 最后一个区块（Quick Start）添加渐变背景**。Footer 本身保持纯暖灰，渐变在 Quick Start 区块底部完成                                     |
| **Q8** | Code Strip 的 DSD 行高亮动画（1.5s 品牌色脉冲）是否需要 JS 实现？                        | P1 建议                                             | **P1 优先级，任务分解中未包含**。如需实现，建议用 IntersectionObserver + CSS 动画，不需要新依赖。P0 任务中不实现                                  |

---

## 6. 不变约束（显式确认）

以下内容在 v8 中**不改**，对齐 PRD 第 8 节"不改组件、不改技术栈、不改数据"：

| 约束                             | 说明                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 不引入新 npm/JSR 依赖            | 已有依赖: `lit`, `@lessjs/adapter-lit`, `@lessjs/ui`                                                                                                |
| 不创建新 Web Component           | 已有组件不变: `less-showcase-panel`, `less-callout`, `less-step-card`, `less-code-block`, `less-term-demo`, `less-search`, `less-layout`            |
| 不修改设计 tokens                | `--less-brand-*`, `--less-space-*`, `--less-radius-*`, `--less-duration-*`, `--less-easing-*`, `--less-shadow-*`, `--less-font-size-*` 全部保持不变 |
| 不修改 less-showcase-panel       | 三 Tab 交互逻辑（Lit/React/Vanilla）完整保留                                                                                                        |
| 不修改 less-step-card            | 步骤卡片组件 API 不变                                                                                                                               |
| 不修改 less-layout / less-search | 全局布局和搜索功能不变                                                                                                                              |
| 仅修改一个文件                   | `www/app/routes/index/index.ts`                                                                                                                     |

---

## 附录 A: 与 PRD 优先级对齐

| PRD 优先级 | 改动                                | 架构任务                  |
| ---------- | ----------------------------------- | ------------------------- |
| P0         | 区块重排序                          | 任务 2                    |
| P0         | Hero 精简（移除 stats + term-demo） | 任务 1                    |
| P0         | Bento Grid 视觉层级                 | 任务 4                    |
| P0         | 打破统一节奏（禁用 sec-divider）    | 任务 2                    |
| P0         | Quick Start 增强                    | 任务 5                    |
| P1         | Benchmark Astro 对比                | 任务 3                    |
| P1         | Stat 数字计数动画                   | 不含（JS 逻辑，超出范围） |
| P1         | Code Strip DSD 行高亮动画           | 不含（JS 逻辑，超出范围） |
| P1         | Multi-framework 去掉 section label  | 任务 2（合并到排序任务）  |
| P1         | Hero 定位语改为一行                 | 任务 1                    |
| P2         | Hero 背景微粒子动画                 | 不含                      |
| P2         | Bento 卡片网格线背景                | 不含                      |
| P2         | Quick Start 一键复制按钮            | 不含                      |
| P2         | 全页滚动进度条                      | 不含                      |

---

## 附录 B: 区块注释号更新

修改 `_renderZh` 和 `_renderEn` 中的区块注释，对齐新顺序：

```
v7 (旧)                          v8 (新)
<!-- ═══ I. Hero       -->       <!-- ═══ I. Hero              -->
<!-- ═══ II. Code Strip -->       <!-- ═══ II. Code Strip        -->
<!-- ═══ III. Bento Grid -->       <!-- ═══ III. Benchmark        -->
<!-- ═══ IV. Benchmark  -->       <!-- ═══ IV. Multi-framework   -->
<!-- ═══ V. Multi-fw    -->       <!-- ═══ V. Bento Grid         -->
<!-- ═══ VI. Quick Start -->       <!-- ═══ VI. Quick Start + Footer -->
<!-- ═══ III. Footer    -->       (footer comment merged into VI)
```
