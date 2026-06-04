# WWW 首页重构 + 六项缺陷修复方案

- Date: 2026-05-19
- Status: PROPOSED
- Scope: `www/app/` 全站首页、布局、导航、搜索、多语言

---

## 问题清单

| # | 问题                                          | 严重性 | 根因                                                                                              |
| - | --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| 1 | 首页底部 CTA 横幅视觉效果差                   | P1     | 设计未对齐现代标准；孤立紫色块无过渡                                                              |
| 2 | 首页 SearchButton 重复渲染                    | P0     | `DocsHome extends LitElement` 而非 `DsdLitElement`，SSG 产出 DSD HTML + 客户端 Lit 重渲染双重输出 |
| 3 | Registry Hub 无法切换中文                     | P1     | 硬编码 `locale="en"` 但 `.locales=['en','zh']` 导致切换器显示但目标路由不存在                     |
| 4 | 四区域 sidebar 未区分，blog/registry 显示全量 | P1     | 缺少 `filterRegistryNav()` / `filterBlogNav()`，且路由未调用过滤                                  |
| 5 | 桌面端 sidebar 紧贴左侧                       | P2     | `.layout-body` 无 max-width 居中约束，sidebar 贴 viewport 边缘                                    |
| 6 | Blog 页面缺少 SearchButton                    | P1     | Blog 无 `_renderer.ts`，且 Lit template 中未注入 `<less-search>`                                  |

---

## 问题 2 详解：首页 SearchButton 重复渲染

### 事实链

```
DocsHome extends LitElement          ← 首页组件用 LitElement，不是 DsdLitElement
  └─ template 包含 <less-search slot="header-actions">
       └─ LessSearch extends DsdLitElement   ← 搜索组件用 DsdLitElement
```

SSG 渲染流程：

1. SSG 调用 `DocsHome.render()` 的 SSR 版本 → 输出完整 HTML
2. `less-search` 的 SSR 也被调用 → 输出包含 `<template shadowrootmode="open">` 的 DSD HTML
3. 浏览器解析 HTML → `less-search` 的 DSD 被实例化为 shadow root → **第一个搜索按钮出现**
4. 客户端 JS 加载 → `DocsHome` (LitElement) 升级 → Lit 接管并重新渲染 template → 创建新的 `<less-search>`
5. 旧的 `<less-search>` 被 Lit 移除，但新 `<less-search>` 没有 DSD → `_dsdHydrated=false` → `render()` 执行 → **第二个搜索按钮出现**
6. 在移除旧元素和创建新元素之间，短暂地**两个按钮同时存在**

### 根因

`DocsHome` 用的是 `LitElement` 而非 `DsdLitElement`。`LitElement` 不会感知 DSD，客户端升级时总是重新渲染整个 template，导致 slotted 子元素被"重建"一次。而 `DsdLitElement` 在检测到 DSD 时会跳过 `render()`，避免双重输出。

### 修复方向

**方案 A**（推荐）：`DocsHome` 改为继承 `DsdLitElement`，这样 SSG 产出的 DSD HTML 会被保留，客户端不会重渲染 template 里的 `<less-search>`。

**方案 B**：保持 `LitElement` 不变，但在客户端升级前用 CSS 隐藏 SSR 输出（`[ssr] .search-trigger { display: none }`），升级后自动恢复。不推荐——只是掩盖问题。

---

## 首页重构方案

### 设计哲学

**精密 · 震撼 · 呼吸感 · 技术的尊严**

参考：Linear.app / Vercel.com / Astro.build / Stripe.com

### 新首页结构（自上而下）

```
┌─────────────────────────────────────────────────────┐
│  ① HERO — 沉浸式暗色开场                             │
│  ┌─────────────────────────────────────────────┐    │
│  │  品牌Logo + 一行定位语                       │    │
│  │  呼吸光晕动画（品牌色径向渐变）               │    │
│  │  CTA: 两个按钮 + 终端代码片段                 │    │
│  │  下方: 关键数字条 (3-4个 stat)               │    │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  ② CODE STRIP — 代码对比 (SSR → DSD 零JS)           │
│  左: 你写的组件代码  |  右: SSG 输出的纯净 HTML       │
├─────────────────────────────────────────────────────┤
│  ③ THREE PILLARS — Bento Grid                       │
│  ┌───────────────┐ ┌─────────┐                     │
│  │  Framework    │ │ Engine  │                     │
│  │  (大卡 2fr)   │ ├─────────┤                     │
│  │              │ │Registry │                     │
│  └───────────────┘ └─────────┘                     │
├─────────────────────────────────────────────────────┤
│  ④ BENCHMARK — 性能对比表格                          │
├─────────────────────────────────────────────────────┤
│  ⑤ MULTI-FRAMEWORK — Tab 切换 (Shoelace/React/Media)│
├─────────────────────────────────────────────────────┤
│  ⑥ LIVE DEMO — 交互式计数器 + DSD 输出 + Bundle     │
├─────────────────────────────────────────────────────┤
│  ⑦ QUICK START — 纵向时间轴                          │
├─────────────────────────────────────────────────────┤
│  ⑧ FOOTER — 替代当前 CTA 横幅                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  简洁暗色区: Logo + Slogan + 社交链接       │    │
│  │  不再用全宽紫色块                            │    │
│  │  可选: 轻量级 CTA (一行代码 + 一个按钮)      │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### ① HERO 升级

**现状问题**：Hero 区信息密度高但视觉层次平，所有内容争抢注意力。

**升级方案**：

- 定位语精简到 **一行**，用品牌色渐变高亮关键词
- CTA 按钮加大（48px 高度），主按钮用品牌色填充，次按钮用 ghost 样式
- 终端代码片段改为**打字机动画**（逐字出现 `deno run -A jsr:@openelement/create my-app`）
- 呼吸光晕从 `box-shadow` 改为 `radial-gradient` + `@keyframes`，更柔和
- stat 数字条改为**计数器动画**（数字从 0 跳到目标值），使用 `IntersectionObserver`

### ② CODE STRIP 升级

- 代码卡片加大圆角（20px）
- 左右两个卡片之间加一个 **→ 箭头动画**，表示"写代码 → 得到纯净 HTML"的转化
- "0KB JS" 标签用品牌色高亮

### ③ BENTO GRID 升级

- 大卡内加微妙的**网格线背景**（CSS `background-image` 细线），增加技术质感
- 卡片 hover 时有**品牌色边框渐显**效果（`border-color` transition）
- 每张卡片右上角加一个**微型 SVG icon** 代表该支柱

### ⑧ FOOTER 替代 CTA

**现状**：全宽紫色渐变块，视觉上像硬贴上去的补丁。

**替代方案 A**（推荐）：**暗色极简 Footer**

```
┌─────────────────────────────────────────┐
│  ◁ LessJS                               │
│  "Less is More" — 零JS首屏的全栈框架     │
│                                         │
│  $ deno run -A jsr:@openelement/create my-app │
│  [Get Started →]                        │
│                                         │
│  GitHub · Twitter · Discord              │
│  MIT License · 2026                      │
└─────────────────────────────────────────┘
```

- 暗色背景 `#0d0d12`（与 hero 呼应）
- 品牌色用于链接和按钮，不是大面积渐变
- 底部和顶部形成暗色"书立"效果，中间是浅色/白色内容区

**替代方案 B**：**保留 CTA 但融入整体**

- CTA 区与 Quick Start 合并，作为 Quick Start 的"行动终点"
- 不再全宽，改为 max-width 容器内
- 渐变变淡：从 `linear-gradient(135deg, #534AB7, #6d5ce8)` 改为更柔和的 `linear-gradient(135deg, #534AB7 0%, #7c6dd8 50%, var(--less-bg-base) 100%)`

---

## 六项缺陷修复方案

### Fix #1: 底部 CTA 视觉升级

**方案**：采用 Footer 替代方案 A（见上方 ⑧）

**涉及文件**：

- `www/app/routes/index/index.ts` — 删除 `.cta` CSS 块和 HTML，新增 `.site-footer` 区块
- 可能新建 `www/app/islands/typing-animation.ts` — 打字机效果

### Fix #2: SearchButton 重复渲染

**方案**：`DocsHome` 改为继承 `DsdLitElement`

**涉及文件**：

- `www/app/routes/index/index.ts` — `class DocsHome extends LitElement` → `class DocsHome extends DsdLitElement`
- 需增加 `import { DsdLitElement } from '@openelement/adapter-lit'`
- `render()` 方法开头加 DSD 保护：`if (this._dsdHydrated) return nothing;` — 或由 `DsdLitElement` 基类自动处理
- 验证 SSG 输出是否包含正确的 DSD `<template shadowrootmode="open">`

**风险评估**：改基类是 breaking change，需测试：

- SSG 输出是否完整
- 客户端 hydration 是否正常
- 所有 slotted 子元素（`less-search`, `less-term-demo` 等）是否正常工作

### Fix #3: Registry Hub 多语言

**方案**：两步走

**Step 1**（立即）：移除 Registry 的假多语言声明

```typescript
// registry/index.ts — 修改前
locale = 'en'.locales = "${['en', 'zh']}";

// 修改后
locale = 'en'.locales = "${['en']}"; // 只声明英文，隐藏切换器
```

**Step 2**（后续）：实现 Registry 中文渲染

- 为 `registry/index.ts`、`registry/[package].ts`、`registry/[package]/[component].ts` 添加 `_renderZh()` 方法
- 创建路由 `/zh/registry`（如果路由系统支持 locale 前缀）

### Fix #4: Sidebar 四区域过滤

**方案**：

1. 扩展 `www/app/utils/nav-filter.ts`：

```typescript
/** Section titles shown in the registry sidebar. */
const REGISTRY_SECTIONS = ['Reference']; // 或 Registry 专属的 section

/** Section titles shown in the blog sidebar. */
const BLOG_SECTIONS = ['History'];

export function filterRegistryNav(navSections) { ... }
export function filterBlogNav(navSections) { ... }
```

2. 在 blog 和 registry 路由中调用对应过滤函数

**涉及文件**：

- `www/app/utils/nav-filter.ts` — 新增两个过滤函数
- `www/app/routes/blog/index.ts` — 导入并使用 `filterBlogNav()`
- `www/app/routes/blog/[slug].ts` — 同上
- `www/app/routes/registry/index.ts` — 导入并使用 `filterRegistryNav()`
- `www/app/routes/registry/[package].ts` — 同上
- `www/app/routes/registry/[package]/[component].ts` — 同上

### Fix #5: Sidebar 桌面端位置

**方案 A**（推荐）：整体居中布局

```css
.layout-body {
  max-width: 1400px;
  margin: 0 auto;
  /* sidebar + content 一起居中 */
}
```

**方案 B**：仅 sidebar 加左 padding

```css
.docs-sidebar {
  padding: var(--less-size-6) var(--less-size-5) var(--less-size-6) var(--less-size-8);
}
```

**推荐方案 A**——和 Vercel/Astro 一致，整体视觉更平衡。

**涉及文件**：

- `packages/ui/src\/open-layout.ts` — 修改 `.layout-body` CSS

### Fix #6: Blog SearchButton 缺失

**方案**：为 Blog 添加搜索注入

**方案 A**（推荐）：创建 `www/app/routes/blog/_renderer.ts`，与 guide/engine/registry 一致：

```typescript
const renderer: LessRenderer = {
  wrap(html: string, ctx) {
    const layoutOpen = html.indexOf('<open-layout');
    if (layoutOpen >= 0) {
      const closeGt = html.indexOf('>', layoutOpen);
      if (closeGt > 0) {
        html = html.slice(0, closeGt + 1) +
          '<less-search slot="header-actions"></less-search>' +
          html.slice(closeGt + 1);
      }
    }
    return html;
  },
};
```

**方案 B**：在 blog 的 Lit template 中直接加入 `<less-search slot="header-actions">`（和首页一样）。但这种方式在 SSG 环境下可能和 `_renderer.ts` 注入冲突，如果后续补了 `_renderer.ts` 的话。

**涉及文件**：

- 新建 `www/app/routes/blog/_renderer.ts`

---

## 实施优先级

| 优先级 | 任务                           | 原因                           |
| ------ | ------------------------------ | ------------------------------ |
| P0     | Fix #2: SearchButton 重复渲染  | 用户可见 Bug，影响所有首页访客 |
| P0     | Fix #6: Blog SearchButton 缺失 | 功能缺失                       |
| P1     | Fix #4: Sidebar 四区域过滤     | 导航混乱影响用户定位           |
| P1     | Fix #3: Registry 多语言        | 切换器误导（Step 1 立即修）    |
| P1     | Fix #1: 首页底部 CTA → Footer  | 视觉品质                       |
| P2     | Fix #5: Sidebar 居中           | 视觉微调                       |

**首页重构（①-⑧）**应在以上修复完成后作为独立迭代进行，因为涉及大量 CSS/HTML 重写。

---

## 首页重构视觉参考

### 色彩体系

```
品牌色:     #534AB7 (主) / #6d5ce8 (亮) / #8b7cf6 (淡)
暗色背景:   #0a0a0f (hero/footer) / #0d0d12 (代码卡片) / #111116 (surface)
浅色背景:   #ffffff (内容区) / #f8f9fa (subtle)
文字色:     #f8f9fa (primary on dark) / #1a1a2e (primary on light)
            #adb5bd (muted) / #6c757d (tertiary)
边框色:     rgba(255,255,255,0.06) (dark) / #e9ecef (light)
```

### 动效体系

| 元素             | 动效                         | 时长 | 缓动          |
| ---------------- | ---------------------------- | ---- | ------------- |
| Hero 光晕        | `radial-gradient` scale 呼吸 | 8s   | `ease-in-out` |
| 代码打字机       | 逐字出现                     | 2s   | `steps(1)`    |
| Stat 计数器      | 数字 0→目标                  | 1.5s | `ease-out`    |
| Bento 卡片 hover | 品牌色边框渐显               | 0.2s | `ease`        |
| 滚动揭示         | `opacity + translateY`       | 0.4s | `ease-out`    |
| Footer 进入      | `fadeIn`                     | 0.6s | `ease-out`    |

### 无障碍

- 所有动效遵守 `prefers-reduced-motion: reduce` → 禁用动画
- 品牌色文字在暗色背景上的对比度 ≥ 4.5:1
- `:focus-visible` 轮廓统一使用品牌色
- 语义化 HTML：`<header>`, `<main>`, `<section>`, `<footer>`
- `role` 和 `aria-label` 用于自定义交互组件

---

## 验收标准

1. ✅ 首页无 SearchButton 重复渲染
2. ✅ Blog 页面显示 SearchButton
3. ✅ Registry 切换器不再误导（Step 1）
4. ✅ Blog/Registry sidebar 只显示各自相关 section
5. ✅ 首页 Footer 替代 CTA，视觉与 Hero 呼应
6. ✅ 桌面端 sidebar 不紧贴左边缘
7. ✅ Lighthouse 四项总分 ≥ 370（Production build）
8. ✅ `prefers-reduced-motion` 所有动效可禁用
9. ✅ 暗色模式所有文字对比度 ≥ 4.5:1

---

## 全站页面统一设计体系 (2026-05-19 追加)

### 设计审计发现

对 www 所有页面类型进行审计后，发现以下系统性不一致：

| 问题                                                   | 影响页面                                                               | 严重性 |
| ------------------------------------------------------ | ---------------------------------------------------------------------- | ------ |
| SearchButton 注入方式不统一                            | 首页(直接) / guide+engine+registry(renderer) / blog+404+其他(缺失)     | P0     |
| Sidebar 导航未过滤                                     | registry / blog / decisions / changelog / contributing / roadmap / 404 | P1     |
| 404 页面显示全量 sidebar                               | 404                                                                    | P1     |
| 首页硬编码颜色而非 CSS 变量                            | 首页                                                                   | P2     |
| 代码块背景色不一致                                     | 首页(#0d0d12) vs 其他(#1a1a2e)                                         | P2     |
| Registry 假多语言                                      | registry                                                               | P1     |
| unused islands (less-toc, scroll-reveal, api-consumer) | 全站                                                                   | P3     |

### 统一设计体系

#### 一、视觉节奏：三幕式

```
第一幕 (Hero):  深色 (#09090b → #0d0d1a)  — 震撼开场，唯一高潮
第二幕 (叙事):  浅色 (#ffffff → #f8f9fa)   — 内容驱动，品牌色分割
第三幕 (Footer): 暖灰 (#F1EFE8)            — 安静谢幕，不抢戏
```

关键原则：**一部好电影只需要一个高潮**。Hero 是爆点，Footer 是散场灯亮。

#### 二、各页面类型设计规格

##### 1. Homepage (首页)

| 属性         | 规格                                                 |
| ------------ | ---------------------------------------------------- |
| 基类         | `DsdLitElement` (修复 #2)                            |
| Header       | 深色沉浸式，品牌色呼吸光晕                           |
| Sidebar      | 隐藏 (home 属性)                                     |
| SearchButton | `<less-search slot="header-actions">` — 由 DSD 保护  |
| Footer       | 暖灰底 (#F1EFE8) + 2px 品牌色呼吸线 + 小 terminal 窗 |
| CTA          | 移除全宽紫色块，融入 Footer                          |
| 颜色         | 全部改为 CSS 变量引用                                |

**Footer 新设计**：

```
┌─ 2px 品牌色呼吸线 ──────────────────────────────────────┐
│  <less/>  — Web that weighs less, does more             │
│  ─────────────────────────────────────────────────────── │
│  Framework    Engine       Community    ┌──────────────┐│
│  Quick start  Architecture GitHub      │$ npx create  ││
│  Core         Compat.      Blog        │  ✓ scaffolded││
│  Production   API ref.     Registry    │  → npm dev   ││
│                                        └──────────────┘│
│  ─────────────────────────────────────────────────────── │
│  MIT License · Made with less        EN │ ☀/☾          │
└─────────────────────────────────────────────────────────┘
```

- 暖灰底 `#F1EFE8`，与叙事段落的纯白有微妙区分但不跳戏
- 品牌色只做一条 2px 细线 + 一个深色 terminal 窗
- 暗色仅此两处，呼应 Hero 但不复制

##### 2. Guide Pages (框架文档)

| 属性         | 规格                                                           |
| ------------ | -------------------------------------------------------------- |
| 基类         | `LitElement` (SSG only，无需改)                                |
| Background   | `#ffffff` (内容区)                                             |
| Sidebar      | 过滤：`filterFrameworkNav()` — Quick Start / Core / Production |
| SearchButton | `_renderer.ts` 注入 (保持现有模式)                             |
| i18n         | 双语渲染                                                       |
| Edit link    | `_renderer.ts` 注入                                            |

##### 3. Engine Pages (引擎文档)

| 属性         | 规格                                                               |
| ------------ | ------------------------------------------------------------------ |
| 基类         | `LitElement` (SSG only)                                            |
| Background   | `#ffffff`                                                          |
| Sidebar      | 过滤：`filterEngineNav()` — Principles / Compatibility / Reference |
| SearchButton | `_renderer.ts` 注入                                                |
| i18n         | 双语渲染                                                           |
| Edit link    | `_renderer.ts` 注入                                                |

##### 4. Registry Hub

| 属性         | 规格                                                        |
| ------------ | ----------------------------------------------------------- |
| 基类         | `LitElement` (SSG only)                                     |
| Background   | `#ffffff`                                                   |
| Sidebar      | **新增过滤**：`filterRegistryNav()` — Registry section only |
| SearchButton | `_renderer.ts` 注入 (保持)                                  |
| i18n         | **Step 1**：`locales=['en']` 只声明英文，隐藏切换器         |

##### 5. Blog

| 属性         | 规格                                                   |
| ------------ | ------------------------------------------------------ |
| 基类         | `LitElement` (SSG only)                                |
| Background   | `#ffffff`                                              |
| Sidebar      | **新增过滤**：`filterBlogNav()` — History section only |
| SearchButton | **新增 `_renderer.ts`** 注入                           |
| i18n         | 双语渲染                                               |

##### 6. 404 Page

| 属性         | 规格                           |
| ------------ | ------------------------------ |
| 基类         | `LitElement`                   |
| Background   | `#ffffff` 居中内容             |
| Sidebar      | **隐藏** (添加 `home` 属性)    |
| SearchButton | **新增 `_renderer.ts`** 注入   |
| i18n         | 移除假切换器，`locales=['en']` |

##### 7. Standalone Pages (changelog / contributing / roadmap / decisions)

| 属性         | 规格                              |
| ------------ | --------------------------------- |
| 基类         | `LitElement`                      |
| Background   | `#ffffff`                         |
| Sidebar      | **隐藏** (这些页面不需要侧边导航) |
| SearchButton | 无 (独立页面不需要)               |
| i18n         | 保持现有                          |

#### 三、Sidebar 居中方案

```css
.layout-body {
  max-width: 1400px;
  margin: 0 auto;
}
```

整体居中，与 Vercel/Astro 一致，sidebar 不再紧贴 viewport 左缘。

#### 四、代码块背景统一

所有代码块统一使用 CSS 变量 `--less-code-bg`：

- 亮色模式：`#1a1a2e` (深靛蓝，品牌调性)
- 暗色模式：`#0d0d12` (近黑)

首页硬编码的 `#0d0d12` 和 `#0d0d0f` 全部改为变量引用。

#### 五、SearchButton 统一注入策略

所有需要 SearchButton 的页面通过 `_renderer.ts` 统一注入：

- guide/_renderer.ts ✅ 已有
- engine/_renderer.ts ✅ 已有
- registry/_renderer.ts ✅ 已有
- **blog/_renderer.ts** — 新建
- **404 页** — 新建 `_renderer.ts` 或直接在 template 中注入

首页特殊处理：改为 `DsdLitElement` 后，template 中的 `<less-search>` 由 DSD 保护。

#### 六、待清理

- `less-toc` island：未使用但已实现，保留待后续启用
- `scroll-reveal` island：未使用，保留
- `api-consumer` island：未使用，保留
- `counter-island`：仅用于首页 demo，保留

#### 七、实施清单

| 优先级 | 任务                                  | 涉及文件                                                                                            |
| ------ | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| P0     | DocsHome → DsdLitElement              | `www/app/routes/index/index.ts`                                                                     |
| P0     | Blog 添加 _renderer.ts + SearchButton | 新建 `www/app/routes/blog/_renderer.ts`                                                             |
| P1     | nav-filter 添加 Registry/Blog 过滤    | `www/app/utils/nav-filter.ts`                                                                       |
| P1     | Registry/Blog 路由调用过滤            | `www/app/routes/registry/index.ts`, `www/app/routes/blog/index.ts`, `www/app/routes/blog/[slug].ts` |
| P1     | Registry 移除假多语言                 | `www/app/routes/registry/index.ts`                                                                  |
| P1     | 首页 CTA → 新 Footer                  | `www/app/routes/index/index.ts`                                                                     |
| P1     | 404 页隐藏 sidebar                    | `www/app/routes/404.ts`                                                                             |
| P1     | 404 添加 SearchButton                 | 新建 `www/app/routes/_shared-renderer.ts` 或 404 template 内                                        |
| P2     | Sidebar 居中                          | `packages/ui/src\/open-layout.ts`                                                                    |
| P2     | 首页硬编码颜色 → CSS 变量             | `www/app/routes/index/index.ts`                                                                     |
| P2     | Standalone 页面隐藏 sidebar           | `www/app/routes/changelog.ts`, `contributing.ts`, `roadmap.ts`                                      |
