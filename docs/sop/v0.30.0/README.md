# LessJS v0.30.0 — @lessjs/ui DSD Shell 组件库

> **版本目标**：将 `@lessjs/ui` 从 "www 专用工具组件" 升级为 "DSD Shell 通用组件库"，
> 基于 daisyUI 5 compiled CSS fork + Open Props tokens + DSD 原生架构，
> 实现 Ocean 层（零 JS）+ Island 层（JSX/DsdElement 交互增强）的完整分层。

---

## 目录

- [1. 背景与动机](#1-背景与动机)
- [2. 架构决策](#2-架构决策)
- [3. 交付物清单](#3-交付物清单)
- [4. SOP 任务列表](#4-sop-任务列表)
- [5. 验收门禁](#5-验收门禁)
- [6. 风险与缓解](#6-风险与缓解)

---

## 1. 背景与动机

### 与 v0.28.6 / v0.29.0 的边界

v0.30.0 只处理 UI Shell 产品层，不承接 v0.28.6 的构建管线债务，也不承接
v0.29.0 的 renderer IR 重构。

| 版本    | 范围                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------- |
| v0.28.6 | package graph release runner、AST/manifest metadata、generated SSR entry 收敛、optional stubs、core dependency boundary |
| v0.29.0 | structured renderer IR、single traversal、DSD transform、trusted HTML node、single serializer                           |
| v0.30.0 | `@lessjs/ui/css`、Ocean/Island UI 双轨、daisyUI CSS fork、Open Props token 融合、DSD CSS 注入                           |

进入 v0.30.0 前，v0.28.6 和 v0.29.0 的 exit criteria 必须完成。否则 UI Shell
工作会叠加在不稳定的构建、发布和 renderer kernel 上。

### ADR 锚点

v0.30.0 由三份 ADR 约束：

- [ADR-0074: @lessjs/ui Dual-Track Ocean and Island Architecture](../../adr/ADR-0074-ui-dual-track-ocean-island.md)
- [ADR-0075: Fork daisyUI 5 Compiled CSS for DSD Shell Components](../../adr/ADR-0075-fork-daisyui-compiled-css.md)
- [ADR-0076: Open Props and daisyUI Token Merge](../../adr/ADR-0076-open-props-daisyui-token-merge.md)

### 现状问题

| 问题                                           | 影响                      |
| ---------------------------------------------- | ------------------------- |
| `@lessjs/ui` 只有 10 个组件，全部面向 www 站点 | 无法作为通用 Shell 组件库 |
| 组件使用 JSX + DsdElement（需 JS 运行时）      | Ocean 层无法零 JS 输出    |
| 没有独立的 CSS 组件样式                        | 组件样式与 JS 逻辑耦合    |
| 主题系统绑定 `less-layout` 传播                | 无法独立使用主题          |
| 没有 daisyUI 级别的组件丰富度                  | Shell 层需手写一切        |

### 行业洞察

- **Astro Shell** = 纯 HTML 模板 + CSS，零 JS，但无 Shadow DOM 封装
- **daisyUI 5** = CSS-only 组件库，50+ 组件，30+ 主题，micro CSS 按需加载
- **Open Props** = 超 400 个 CSS custom properties，覆盖间距/动画/渐变/阴影
- **DSD** = 声明式 Shadow DOM，HTML-first，SSG 直出，零 JS 渲染
- **空白地带** = 没有任何库同时做到 "CSS-only + DSD + 组件丰富 + Shadow DOM 封装"

### LessJS 的定位

```
LessJS = "DSD Shell 的 Astro"
         ┌─────────────────────────────┐
         │   Ocean Shell (零 JS)        │ ← @lessjs/ui 提供
         │   daisyUI CSS + Open Props   │
         │   DSD 封装 + slot 组合       │
         │                              │
         │   ┌────────────────────┐     │
         │   │  Island (有 JS)     │     │ ← @lessjs/adapter-vue/react 提供
         │   │  JSX + DsdElement   │     │
         │   │  adapter islands    │     │
         │   └────────────────────┘     │
         └─────────────────────────────┘
```

---

## 2. 架构决策

### ADR-0074: @lessjs/ui 双轨架构

**决策**：`@lessjs/ui` 分为两个子包：

| 子包             | 职责                                         | JS | 目标消费者   |
| ---------------- | -------------------------------------------- | -- | ------------ |
| `@lessjs/ui/css` | 纯 CSS 组件样式（daisyUI fork + Open Props） | ❌ | SSG 构建管线 |
| `@lessjs/ui`     | JSX + DsdElement 交互组件（Island）          | ✅ | 开发者运行时 |

#### `@lessjs/ui/css` — Ocean Shell CSS

```
@lessjs/ui/css/
├── tokens/
│   ├── properties.css       ← Open Props 核心子集
│   ├── theme-light.css      ← 亮色主题
│   └── theme-dark.css       ← 暗色主题
├── base/
│   ├── reset.css            ← DSD 适配 reset
│   └── typography.css       ← 排版 scale
├── components/
│   ├── button.css           ← :host 原生，零替换
│   ├── card.css
│   ├── navbar.css
│   ├── badge.css
│   ├── alert.css
│   ├── dialog.css
│   ├── accordion.css
│   ├── drawer.css
│   ├── hero.css
│   ├── avatar.css
│   ├── divider.css
│   ├── breadcrumb.css
│   ├── menu.css
│   ├── table.css
│   ├── tooltip.css
│   ├── progress.css
│   ├── skeleton.css
│   ├── stat.css
│   ├── footer.css
│   └── stack.css
├── utilities/
│   ├── layout.css           ← stack/grid/container
│   └── slotted.css          ← ::slotted() 公共规则
└── index.css                ← 全量导入（开发用）
```

**每个组件 CSS 从第一行就是 `:host` / `::slotted()`，不需要任何运行时转换。**

#### `@lessjs/ui` — Island 交互组件

保留现有 JSX + DsdElement 组件，作为 Island 层使用：

```
@lessjs/ui/
├── less-button.tsx       ← 有 JS 交互的按钮（loading 状态等）
├── less-dialog.tsx       ← 有 JS 交互的对话框
├── less-theme-toggle.tsx ← 主题切换 Island
├── less-hero-ping.tsx    ← API 状态 Island
├── less-layout.tsx       ← 应用布局 Island
├── less-input.tsx        ← 输入框 Island
├── ...
```

### ADR-0075: Fork daisyUI 编译后 CSS 策略

**决策**：Fork daisyUI 5 编译后 micro CSS，不 fork JSS 源码。

| 维度      | 决策                                | 理由                                       |
| --------- | ----------------------------------- | ------------------------------------------ |
| Fork 目标 | CDN/NPM 编译后 `.css` 文件          | 直接改 CSS，无需接手 Tailwind 插件构建管线 |
| 核心改造  | `:root` → `:host`，加 `::slotted()` | 适配 Shadow DOM                            |
| 删除内容  | Tailwind utility 依赖部分           | Shell 层不依赖 Tailwind                    |
| 保留内容  | 语义 class、主题变量、组件样式      | 核心价值                                   |
| 上游同步  | 手动搬运（非 git merge）            | 编译产物不能 merge，但变更可追踪           |
| 发布形式  | `@lessjs/ui/css/components/*.css`   | 集成到 @lessjs/ui 包内                     |

### ADR-0076: Open Props Token 融合策略

**决策**：Open Props 作为 token 基底，daisyUI 主题变量作为语义层。

```
Open Props (--size-N, --radius-N, --shadow-N, --font-*, --ease-*)
    ↓ 基础层
daisyUI tokens (--color-primary, --color-base-100, --color-success...)
    ↓ 语义层
LessJS 扩展 (--brand, --text-primary, --bg-surface, --border)
    ↓ 品牌层
```

**融合规则**：

1. Open Props 提供 spacing/radius/shadow/typography/easing → 无冲突，直接用
2. daisyUI 提供 color 主题变量 → 取代现有 `open-props-tokens.ts` 中的手动色板
3. LessJS 品牌变量保留 → `--brand`, `--brand-hover`, `--brand-light` 等

---

## 3. 交付物清单

### 3.1 ADR 文档

| ADR      | 标题                                             | 状态  |
| -------- | ------------------------------------------------ | ----- |
| ADR-0074 | @lessjs/ui 双轨架构：CSS-only Shell + JSX Island | Draft |
| ADR-0075 | Fork daisyUI 编译后 CSS 策略                     | Draft |
| ADR-0076 | Open Props Token 融合策略                        | Draft |

### 3.2 代码交付

| 交付物                                    | 描述                                     | SOP     |
| ----------------------------------------- | ---------------------------------------- | ------- |
| `packages/ui/css/`                        | CSS-only Shell 组件库                    | SOP-001 |
| daisyUI fork 工作副本                     | :host 适配后的 micro CSS                 | SOP-002 |
| `packages/ui/src/open-props-tokens.ts` v2 | 融合 daisyUI + Open Props 的 token sheet | SOP-003 |
| `packages/ui/deno.json` 更新              | 新增 `./css/*` 子路径导出                | SOP-004 |
| adapter-vite SSG 集成                     | DSD 模板自动注入 CSS                     | SOP-005 |
| create-less-app 模板更新                  | 新项目模板使用 @lessjs/ui/css            | SOP-006 |
| 现有组件迁移                              | less-card 等组件 CSS 抽离                | SOP-007 |

### 3.3 测试与验证

| 交付物               | 描述                          | SOP     |
| -------------------- | ----------------------------- | ------- |
| CSS 组件视觉回归测试 | 截图对比 light/dark 主题      | SOP-008 |
| DSD conformance 测试 | Shadow DOM 隔离验证           | SOP-008 |
| SSG 构建验证         | 零 JS Shell 输出验证          | SOP-008 |
| 性能基准             | Shell 页面 < 50KB CSS, 0KB JS | SOP-008 |

---

## 4. SOP 任务列表

### SOP-001: @lessjs/ui/css 包结构搭建

**目标**：创建 CSS-only Shell 组件库的目录结构和构建管线。

**步骤**：

- [ ] 1.1 创建 `packages/ui/css/` 目录结构（tokens/, base/, components/, utilities/）
- [ ] 1.2 编写 `css/tokens/properties.css` — Open Props 子集提取
  - 从 Open Props npm 包提取：spacing, radius, shadow, typography, easing
  - 只保留 `:host` 选择器格式
  - 预估：~80 行
- [ ] 1.3 编写 `css/tokens/theme-light.css` — 亮色主题变量
  - 基于 daisyUI light 主题 + LessJS 品牌扩展
  - 定义在 `:host` 上
  - 预估：~40 行
- [ ] 1.4 编写 `css/tokens/theme-dark.css` — 暗色主题变量
  - 基于 daisyUI dark 主题 + LessJS 品牌扩展
  - 定义在 `:host([data-theme="dark"])` 上
  - 预估：~40 行
- [ ] 1.5 编写 `css/base/reset.css` — DSD 适配的 reset
  - `:host { display: block; }` 基础
  - box-sizing normalize
  - 预估：~20 行
- [ ] 1.6 编写 `css/base/typography.css` — 排版 scale
  - h1-h6 字号/字重
  - body/p 文本样式
  - 预估：~50 行
- [ ] 1.7 编写 `css/utilities/layout.css` — stack/grid/container
  - `.stack` `.grid` `.container` `.section` 布局类
  - 预估：~40 行
- [ ] 1.8 编写 `css/utilities/slotted.css` — ::slotted() 公共规则
  - `::slotted(h1)` `::slotted(p)` `::slotted(a)` 基础样式
  - 预估：~30 行
- [ ] 1.9 编写 `css/index.css` — 全量导入入口（开发用）
- [ ] 1.10 验证：在空 HTML + DSD 中引入 index.css，确认变量生效

**交付物**：`packages/ui/css/` 完整目录 + 所有基础文件

**预估工时**：4-6 小时

---

### SOP-002: daisyUI 5 Fork 深度定制

**目标**：Fork daisyUI 5 编译后 micro CSS，深度定制为 DSD-ready 的 Ocean Shell 组件库。

**核心理解**：深度定制 ≠ 简单 `:host` 替换。它包括：

1. Ocean/Island 边界划分
2. 主题系统重构（Shadow DOM 穿透）
3. 复合组件 DOM 结构重设计
4. Tailwind utility → Open Props 逐条替换
5. `::slotted()` 限制的解决方案

---

#### Phase 0：Ocean/Island 组件分类决策

**目标**：明确哪些组件归 Ocean（零 JS）、哪些归 Island（有 JS）。

**分类标准**：

| 判定条件                                             | Ocean            | Island |
| ---------------------------------------------------- | ---------------- | ------ |
| 需要状态管理（open/close/active）                    | ❌               | ✅     |
| 需要事件监听（click/input/focus）                    | ❌               | ✅     |
| 可用原生 HTML 交互（`<details>`/`<dialog>`/popover） | ✅               | —      |
| 纯展示                                               | ✅               | —      |
| 需要焦点管理/无障碍增强                              | ❌               | ✅     |
| 需要动画时序控制                                     | 🟡 CSS-only 有限 | ✅     |

**v0.30.0 组件分类结果**：

| 组件         | 归属       | 理由                       | 备注                                |
| ------------ | ---------- | -------------------------- | ----------------------------------- |
| navbar       | **Ocean**  | 纯展示，布局               | 移动端汉堡菜单可 Island 增强        |
| menu         | **Ocean**  | 纯展示列表                 |                                     |
| breadcrumb   | **Ocean**  | 纯展示                     |                                     |
| footer       | **Ocean**  | 纯展示                     |                                     |
| card         | **Ocean**  | 纯展示                     |                                     |
| badge        | **Ocean**  | 纯展示                     |                                     |
| alert        | **Ocean**  | 纯展示                     | 关闭按钮需 Island 增强              |
| hero         | **Ocean**  | 纯展示                     |                                     |
| avatar       | **Ocean**  | 纯展示                     |                                     |
| divider      | **Ocean**  | 纯展示                     |                                     |
| stat         | **Ocean**  | 纯展示                     |                                     |
| table        | **Ocean**  | 纯展示                     | 排序/筛选需 Island                  |
| timeline     | **Ocean**  | 纯展示                     |                                     |
| button       | **Ocean**  | 链接/提交按钮              | loading 状态需 Island 增强          |
| progress     | **Ocean**  | CSS 动画即可               |                                     |
| skeleton     | **Ocean**  | CSS 动画即可               |                                     |
| accordion    | **Ocean**  | 原生 `<details>` 零 JS     | daisyUI 的 `details` 样式直接用     |
| **dialog**   | **Island** | 需焦点管理/无障碍/动画时序 | CSS-only 版仅提供静态壳样式         |
| **dropdown** | **Island** | 需要点击外部关闭/键盘导航  | CSS-only 版仅用 Popover API（有限） |
| **tooltip**  | **Island** | 需定位计算/延迟显示        | CSS-only 版仅用 Popover API（有限） |

**Ocean 组件 = 15 个，Island 组件 = 3 个（dialog/dropdown/tooltip）**

**Island 组件的 CSS 壳**：dialog/dropdown/tooltip 仍然提供 Ocean CSS（静态壳样式），
但交互逻辑由 Island 层实现。开发者可以选择只用 CSS 壳（无交互）或 Island 增强版。

---

#### Phase 1：下载与分析

- [ ] 2.1 下载 daisyUI 5 编译后 CSS 文件
  - 从 `npm/daisyui@5/src/components/*.css` 获取所有组件 CSS
  - 从 `npm/daisyui@5/src/base/*.css` 获取基础样式
  - 从 `npm/daisyui@5/src/theme/*.css` 获取主题变量
  - 从 `npm/daisyui@5/src/utilities/*.css` 获取 utility 样式

- [ ] 2.2 深度分析 daisyUI CSS 结构
  - [ ] 2.2.1 选择器分析
    - 统计所有 `:root` 出现位置及上下文
    - 统计所有 `html`/`body` 选择器
    - 统计所有 `[data-theme]` 选择器（**关键：主题切换机制**）
    - 统计所有后代选择器（`A B`）、子选择器（`A > B`）——标记 Shadow DOM 边界断裂点
  - [ ] 2.2.2 Tailwind 依赖分析
    - 统计对 Tailwind utility class 的依赖（`flex`, `items-center`, `gap-*`, `p-*` 等）
    - 生成 **Tailwind → Open Props 映射表**（见 2.6）
  - [ ] 2.2.3 复合组件 DOM 分析
    - 识别跨层级选择器（如 `.modal .modal-box`、`.dropdown .dropdown-content`）
    - 标记哪些组件假设了统一的 DOM 树（Shadow DOM 会打断）
  - [ ] 2.2.4 主题系统分析
    - daisyUI 主题变量定义位置（`:root`？`[data-theme]`？）
    - 主题切换机制（改属性？改 class？）
    - CSS variables 数量和继承链
  - 生成完整分析报告 `css/DAISYUI-ANALYSIS.md`

---

#### Phase 2：主题系统重构（Shadow DOM 穿透）

**核心问题**：daisyUI 主题通过 `[data-theme="dark"]` 选择器切换，但 Shadow DOM 内部看不到外部属性。

**重构方案**：

```css
/* ❌ daisyUI 原生方式（Shadow DOM 内无效） */
[data-theme='dark'] {
  --color-base-100: oklch(0.2 0 0);
}

/* ✅ LessJS DSD 方式（CSS variables 天然穿透 Shadow DOM） */
:root {
  /* 亮色默认 */
  --color-base-100: oklch(0.98 0 0);
  --color-primary: oklch(0.7 0.15 250);
  /* ... 所有 daisyUI 主题变量 ... */
}

:root[data-theme='dark'] {
  /* 暗色覆盖 */
  --color-base-100: oklch(0.2 0 0);
  --color-primary: oklch(0.6 0.2 280);
  /* ... 所有 daisyUI 主题变量 ... */
}
```

**关键原则**：

- 主题变量定义在 `:root`（全局），不在 `:host`（Shadow DOM 内）
- CSS custom properties **天然穿透 Shadow DOM 边界**，子组件自动继承
- `:host` 内只定义组件自身的非主题变量（如 `--card-padding`）

- [ ] 2.3 重构主题 CSS
  - [ ] 2.3.1 提取 daisyUI 所有主题变量到 `tokens/properties.css`
    - 定义在 `:root` 上（亮色默认）
    - 定义在 `:root[data-theme="dark"]` 上（暗色覆盖）
    - 保留 daisyUI 30+ 内置主题的变量定义
  - [ ] 2.3.2 编写 `tokens/theme-light.css` — 亮色主题（`:root` 默认）
  - [ ] 2.3.3 编写 `tokens/theme-dark.css` — 暗色主题（`:root[data-theme="dark"]`）
  - [ ] 2.3.4 验证：在 DSD 组件内 `var(--color-primary)` 能正确穿透
  - [ ] 2.3.5 验证：切换 `data-theme` 属性，Shadow DOM 内样式同步变化

---

#### Phase 3：选择器适配

- [ ] 2.4 编写选择器适配脚本
  - [ ] 2.4.1 `:root` → `:host` 替换
    - **排除**：主题变量定义文件（2.3 已处理，主题变量留在 `:root`）
    - **替换**：组件 CSS 内的 `:root` → `:host`
  - [ ] 2.4.2 `html` → `:host` 替换
  - [ ] 2.4.3 `body` → `:host` 替换
  - [ ] 2.4.4 `[data-theme]` 选择器处理
    - 组件 CSS 内的 `[data-theme="dark"]` → `:host([data-theme="dark"])`
    - **但**：主题变量已在 `:root` 层定义，组件内通常不需要重复定义
    - 移除组件内冗余的 `[data-theme]` 变量覆盖
  - [ ] 2.4.5 后代选择器边界检测
    - 标记所有 `.parent .child` 选择器
    - 评估是否会被 Shadow DOM 边界打断
    - 生成边界影响报告

---

#### Phase 4：复合组件 DOM 结构重设计

**核心问题**：daisyUI 部分组件的 CSS 依赖跨层级选择器，在 Shadow DOM 中会断裂。

- [ ] 2.5 逐组件评估并重设计

  **不需要重设计的组件**（纯展示，无跨层级选择器）：
  - [ ] 2.5.1 `navbar.css` — 确认无跨层级依赖
  - [ ] 2.5.2 `menu.css` — 确认无跨层级依赖
  - [ ] 2.5.3 `breadcrumb.css` — 确认无跨层级依赖
  - [ ] 2.5.4 `footer.css` — 确认无跨层级依赖
  - [ ] 2.5.5 `card.css` — 确认无跨层级依赖
  - [ ] 2.5.6 `badge.css` — 确认无跨层级依赖
  - [ ] 2.5.7 `alert.css` — 确认无跨层级依赖（关闭按钮除外）
  - [ ] 2.5.8 `hero.css` — 确认无跨层级依赖
  - [ ] 2.5.9 `avatar.css` — 确认无跨层级依赖
  - [ ] 2.5.10 `divider.css` — 确认无跨层级依赖
  - [ ] 2.5.11 `stat.css` — 确认无跨层级依赖
  - [ ] 2.5.12 `table.css` — 确认无跨层级依赖
  - [ ] 2.5.13 `timeline.css` — 确认无跨层级依赖
  - [ ] 2.5.14 `progress.css` — 确认无跨层级依赖
  - [ ] 2.5.15 `skeleton.css` — 确认无跨层级依赖

  **需要重设计的组件**（有跨层级选择器或交互依赖）：

  - [ ] 2.5.16 `button.css` — Ocean 版
    - daisyUI `btn` class 的变体（primary/secondary/ghost 等）全部是 CSS
    - loading 状态需 CSS-only 方案（`::after` 旋转动画）
    - Island 增强版在 `less-button.tsx` 中

  - [ ] 2.5.17 `accordion.css` — 原生 `<details>` 零 JS
    - daisyUI 的 collapse 组件基于 `<details>/<summary>`
    - Shadow DOM 内 `<details>` 样式可能需要 `::details-content` 选择器
    - 验证 `<details>` 在 Shadow DOM 内的功能和样式

  - [ ] 2.5.18 `dialog.css` — Ocean CSS 壳 + Island 增强
    - **Ocean CSS 壳**：`.dialog-backdrop`、`.dialog-box` 样式（纯展示）
    - **问题**：daisyUI 的 `.modal:is(dialog) .modal-box` 在 DSD 内失效
    - **解决**：将 `modal` 和 `modal-box` 放在**同一 Shadow Root 内**
    - **Island 增强**：`less-dialog.tsx` 实现焦点管理/ESC 关闭/动画时序

  - [ ] 2.5.19 `dropdown.css` — Ocean CSS 壳 + Island 增强
    - **Ocean CSS 壳**：仅用 Popover API（`popovertarget` 属性，零 JS）
    - **Island 增强**：`less-dropdown.tsx` 实现键盘导航/点击外部关闭
    - **注意**：Popover API 在 Shadow DOM 内行为需验证

  - [ ] 2.5.20 `tooltip.css` — Ocean CSS 壳 + Island 增强
    - **Ocean CSS 壳**：仅用 Popover API + CSS `:hover` 显示
    - **Island 增强**：`less-tooltip.tsx` 实现延迟/定位计算
    - **注意**：同 dropdown，Popover API 在 Shadow DOM 内需验证

---

#### Phase 5：::slotted() 适配

**核心问题**：`::slotted()` 只能选择 slot 的直接子元素，不能穿透嵌套。

- [ ] 2.6 为每个组件添加 `::slotted()` 规则

  **策略**：
  - 只对 slot 直接子元素添加 `::slotted()` 规则
  - 不尝试穿透嵌套（`::slotted(div p)` 无效）
  - 嵌套样式由用户自行在外部添加 class

  **公共规则**（`utilities/slotted.css`）：
  ```css
  ::slotted(h1), ::slotted(h2), ::slotted(h3) { ... }
  ::slotted(p) { ... }
  ::slotted(a) { ... }
  ::slotted(img) { ... }
  ::slotted(ul), ::slotted(ol) { ... }
  ```

  **组件特定规则**：
  - `card.css`：`::slotted([slot="title"])`、`::slotted([slot="footer"])`
  - `navbar.css`：`::slotted(a)`、`::slotted([slot="brand"])`
  - 其他组件按需添加

  - [ ] 2.6.1 编写 `utilities/slotted.css` 公共规则
  - [ ] 2.6.2 逐组件添加 `::slotted()` 规则
  - [ ] 2.6.3 验证：slot 内容样式正确渲染

---

#### Phase 6：Tailwind → Open Props 替换

**核心问题**：daisyUI CSS 中可能包含 Tailwind utility class 依赖，需要逐条替换。

- [ ] 2.7 建立 Tailwind → Open Props 映射表

  | Tailwind Utility  | Open Props / 原生 CSS 替换                        | 备注          |
  | ----------------- | ------------------------------------------------- | ------------- |
  | `flex`            | `display: flex`                                   | 原生 CSS      |
  | `grid`            | `display: grid`                                   | 原生 CSS      |
  | `items-center`    | `align-items: center`                             | 原生 CSS      |
  | `justify-between` | `justify-content: space-between`                  | 原生 CSS      |
  | `gap-*`           | `gap: var(--size-*)`                              | Open Props    |
  | `p-*`             | `padding: var(--size-*)`                          | Open Props    |
  | `m-*`             | `margin: var(--size-*)`                           | Open Props    |
  | `w-*`             | `width: var(--size-*)`                            | Open Props    |
  | `h-*`             | `height: var(--size-*)`                           | Open Props    |
  | `text-*`          | `font-size: var(--font-size-*)`                   | Open Props    |
  | `font-bold`       | `font-weight: var(--font-weight-7)`               | Open Props    |
  | `rounded-*`       | `border-radius: var(--radius-*)`                  | Open Props    |
  | `shadow-*`        | `box-shadow: var(--shadow-*)`                     | Open Props    |
  | `transition`      | `transition: all var(--duration-1) var(--ease-2)` | Open Props    |
  | `bg-*`            | `background: var(--color-base-*)`                 | daisyUI token |
  | `text-*` (颜色)   | `color: var(--color-base-content)`                | daisyUI token |

- [ ] 2.8 逐组件执行替换
  - [ ] 2.8.1 扫描每个组件 CSS 中的 utility class 使用
  - [ ] 2.8.2 替换为映射表中的等价声明
  - [ ] 2.8.3 移除不再需要的 utility class 定义
  - [ ] 2.8.4 验证替换后视觉效果一致

---

#### Phase 7：集成验证

- [ ] 2.9 每个组件独立 DSD 渲染验证
  - [ ] 2.9.1 创建测试页面：每个 Ocean 组件一个独立 `<template shadowrootmode="open">`
  - [ ] 2.9.2 亮色/暗色主题切换验证
  - [ ] 2.9.3 `::slotted()` 内容样式验证
  - [ ] 2.9.4 原生交互组件验证（`<details>` 折叠/展开、`<dialog>` 打开/关闭）
  - [ ] 2.9.5 Popover API 在 Shadow DOM 内验证
  - [ ] 2.9.6 多层 Shadow DOM 嵌套时 CSS variables 继承验证

**交付物**：

- `css/DAISYUI-ANALYSIS.md` 深度分析报告
- Ocean/Island 组件分类文档
- 主题系统重构方案
- 15 个 Ocean 组件 CSS（DSD-ready，:host 原生）
- 3 个 Island 组件 CSS 壳（静态样式）
- Tailwind → Open Props 映射表
- 选择器适配脚本
- 测试验证报告

**预估工时**：20-28 小时（原 12-16h，因深度定制步骤增加）

---

### SOP-003: Open Props Token 融合

**目标**：融合 Open Props + daisyUI 主题 + LessJS 品牌变量为统一 token 系统。

**步骤**：

- [ ] 3.1 定义三层 token 架构

  ```
  Layer 1: Open Props（基础设施）
    --size-N, --radius-N, --shadow-N, --font-*, --ease-*, --duration-*

  Layer 2: daisyUI 语义（主题系统）
    --color-primary, --color-secondary, --color-accent, --color-neutral
    --color-base-100/200/300, --color-base-content
    --color-info, --color-success, --color-warning, --color-error
    --border, --radius-box, --radius-field, --radius-selector
    --size-field, --size-selector

  Layer 3: LessJS 品牌（品牌标识）
    --brand, --brand-hover, --brand-light, --brand-deep
    --brand-subtle, --brand-glow, --brand-pale
  ```

- [ ] 3.2 更新 `open-props-tokens.ts`
  - 保留 Layer 1 Open Props 基础设施
  - 用 daisyUI 语义变量替换手动色板
  - 保留 LessJS 品牌变量
  - 确保 `:host([data-theme="dark"])` 覆盖完整
- [ ] 3.3 编写 `css/tokens/properties.css`
  - 从 `open-props-tokens.ts` 的 CSS 内容提取
  - 转为纯 `.css` 文件（无 JS 依赖）
- [ ] 3.4 编写 `css/tokens/theme-light.css` + `theme-dark.css`
  - daisyUI light/dark 主题变量
  - LessJS 品牌变量覆盖
- [ ] 3.5 Token 兼容性矩阵
  - 确保现有 `less-card` 等组件的 CSS 变量引用仍然有效
  - 旧变量名 → 新变量名映射表
  - 过渡期两种变量名共存
- [ ] 3.6 验证：现有 www 站点渲染无回归

**交付物**：

- 更新后的 `open-props-tokens.ts`
- `css/tokens/` 三个 CSS 文件
- Token 兼容性矩阵文档

**预估工时**：6-8 小时

---

### SOP-004: @lessjs/ui 包导出更新

**目标**：更新 `deno.json` 和 `package.json` 支持 CSS 子路径导出。

**步骤**：

- [ ] 4.1 更新 `packages/ui/deno.json`
  ```jsonc
  {
    "exports": {
      ".": "./src/index.ts",
      "./css": "./css/index.css",
      "./css/tokens/properties": "./css/tokens/properties.css",
      "./css/tokens/theme-light": "./css/tokens/theme-light.css",
      "./css/tokens/theme-dark": "./css/tokens/theme-dark.css",
      "./css/components/button": "./css/components/button.css",
      "./css/components/card": "./css/components/card.css",
      // ... 每个组件一个子路径
      "./css/base/reset": "./css/base/reset.css",
      "./css/base/typography": "./css/base/typography.css",
      "./css/utilities/layout": "./css/utilities/layout.css",
      // 保留现有 JSX 组件导出
      "./less-button": "./src/less-button.tsx"
      // ...
    }
  }
  ```
- [ ] 4.2 更新 `packages/ui/src/manifest.ts`
  - 新增 CSS 组件清单
  - 区分 Ocean CSS 组件 vs Island JSX 组件
- [ ] 4.3 更新 SSG package resolver
  - `packages/adapter-vite/src/ssg-package-resolver.ts`
  - 新增 `@lessjs/ui/css/*` 子路径解析
- [ ] 4.4 验证：`deno task build` 通过

**交付物**：更新后的 `deno.json` + `manifest.ts` + resolver

**预估工时**：2-3 小时

---

### SOP-005: adapter-vite SSG CSS 注入集成

**目标**：SSG 构建时自动将 @lessjs/ui/css 组件样式注入 DSD `<template>` 的 `<style>` 中。

**步骤**：

- [ ] 5.1 设计 CSS 注入策略

  **方案 A：构建时全量注入**
  - 分析每个 Ocean 组件引用了哪些 CSS 组件
  - 将用到的 CSS 内联到 `<template shadowrootmode="open">` 的 `<style>` 中
  - 优点：零网络请求，SSG 直出
  - 缺点：重复 CSS（多个同类组件各注入一份）

  **方案 B：构建时提取公共 CSS**
  - 分析所有 Ocean 组件，提取公共 CSS
  - tokens/base/utilities → `<head>` 全局 `<style>`
  - 组件 CSS → 各组件 `<template>` 内 `<style>`
  - 优点：无重复
  - 缺点：部分 CSS 不在 Shadow DOM 内，需 `:root` 定义

  **方案 C：构建时 CSS 分层**
  - tokens → `<head>` 全局（CSS variables 天然穿透 Shadow DOM）
  - base + 组件 CSS → 各组件 `<template>` 内
  - 优点：最优体积 + 正确隔离
  - 缺点：需区分 tokens 和组件 CSS

  **决策**：方案 C（tokens 全局 + 组件 Shadow DOM 内）

- [ ] 5.2 实现 CSS 分析器
  - 扫描 `.ocean` / `.tsx` 文件，识别使用的 CSS 类名
  - 映射到 `@lessjs/ui/css/components/*.css`
  - 输出依赖图：`{ component: ['button.css', 'card.css'] }`
- [ ] 5.3 实现 CSS 注入器
  - tokens CSS → 注入 `<head><style>` 全局
  - 组件 CSS → 注入对应 `<template shadowrootmode="open">` 的 `<style>`
  - `:host` 选择器保持不变
- [ ] 5.4 去重逻辑
  - 同类组件共享同一份 CSS → 只注入一次到第一个实例
  - 或：所有同类组件引用外部 `<style>` via `@import`
  - 权衡：SSG 场景下内联更可靠（无网络请求）
- [ ] 5.5 验证：SSG 输出 HTML 检查
  - `<head>` 含 tokens CSS
  - 每个 DSD `<template>` 含对应组件 CSS
  - 页面渲染正确，零 JS

**交付物**：adapter-vite CSS 注入管线

**预估工时**：8-12 小时

---

### SOP-006: create-less-app 模板更新

**目标**：新项目模板使用 @lessjs/ui/css 作为 Shell 组件库。

**步骤**：

- [ ] 6.1 更新 `packages/create/templates/default/`
  - `vite.config.ts` 中配置 `lessjs()` 插件识别 CSS 组件
  - 新增 `src/styles/ocean.css` 示例文件
    ```css
    @import '@lessjs/ui/css/tokens/properties';
    @import '@lessjs/ui/css/tokens/theme-light';
    @import '@lessjs/ui/css/base/reset';
    @import '@lessjs/ui/css/base/typography';
    ```
- [ ] 6.2 更新示例页面
  - `src/pages/index.ocean` 使用 CSS 组件
  - `<less-card>` + DSD + CSS 注入示例
  - Island 示例（`<vue-counter island>`）
- [ ] 6.3 更新 README 模板
  - Ocean + Island 分层说明
  - CSS 组件使用指南
  - 主题切换说明
- [ ] 6.4 验证：`deno run -A jsr:@lessjs/create` 生成项目可运行

**交付物**：更新后的 create 模板

**预估工时**：4-6 小时

---

### SOP-007: 现有 JSX 组件 CSS 抽离

**目标**：现有 10 个 JSX 组件的 CSS 抽离为独立的 `.css` 文件，与 JSX 逻辑解耦。

**步骤**：

- [ ] 7.1 `less-card.tsx` CSS 抽离
  - 提取 `sheet.replaceSync(...)` 中的 CSS → `css/components/card.css`
  - 更新 `LessCard` 使用 CSS import 或保留 inline（Island 场景）
  - 确保 Ocean 场景和 Island 场景都可使用 card 样式
- [ ] 7.2 `less-button.tsx` CSS 抽离
- [ ] 7.3 `less-input.tsx` CSS 抽离
- [ ] 7.4 `less-dialog.tsx` CSS 抽离
- [ ] 7.5 `less-callout.tsx` CSS 抽离
- [ ] 7.6 `less-code-block.tsx` CSS 抽离
- [ ] 7.7 `less-step-card.tsx` CSS 抽离
- [ ] 7.8 `less-hero-ping.tsx` CSS 抽离
- [ ] 7.9 `less-theme-toggle.tsx` CSS 抽离
- [ ] 7.10 `less-layout.tsx` CSS 抽离（最复杂，含导航/侧边栏/页脚）
- [ ] 7.11 `docs-page-styles.ts` CSS 抽离
- [ ] 7.12 验证：所有组件渲染无回归
  - Ocean 路径：CSS 文件 → SSG 注入 → 零 JS 渲染
  - Island 路径：JSX 组件 → DsdElement → 有 JS 渲染

**交付物**：10 个组件的独立 CSS 文件 + JSX 组件保留 inline CSS（双轨）

**预估工时**：6-8 小时

---

### SOP-008: 测试与验证

**目标**：建立完整的测试和验证体系。

**步骤**：

- [ ] 8.1 CSS 组件单元测试
  - 每个 CSS 组件在独立 DSD 中渲染验证
  - 亮色/暗色主题切换验证
  - `::slotted()` 内容样式验证
  - 测试框架：Playwright 截图对比
- [ ] 8.2 DSD Conformance 测试
  - `shadowrootmode="open"` 存在
  - CSS variables 穿透 Shadow DOM 验证
  - slot 投影正确
  - 无全局样式泄露
- [ ] 8.3 SSG 构建验证
  - `deno task build` 成功
  - 输出 HTML 包含正确的 `<template shadowrootmode="open">`
  - 输出 HTML 的 `<style>` 内容正确
  - 零 JS 的 Shell 页面渲染正确
- [ ] 8.4 性能基准
  - Shell 页面 CSS < 50KB（gzip）
  - Shell 页面 JS = 0KB
  - FCP < 1s
  - LCP < 1.5s
- [ ] 8.5 回归测试
  - 现有 www 站点渲染无回归
  - 现有 Island 组件功能无回归
  - 主题切换功能正常
- [ ] 8.6 跨浏览器验证
  - Chrome/Edge (latest)
  - Firefox (latest)
  - Safari (latest)
  - DSD 支持度检查

**交付物**：测试套件 + 性能报告 + 兼容性报告

**预估工时**：6-8 小时

---

## 5. 验收门禁

v0.30.0 发布前必须通过以下门禁：

| #   | 门禁                    | 标准                                          | 验证方式            |
| --- | ----------------------- | --------------------------------------------- | ------------------- |
| G1  | ADR 文档完整            | ADR-0074/0075/0076 全部完成                   | 文件存在 + 内容审核 |
| G2  | CSS 组件库可用          | 15 个 Ocean 组件 + 3 个 Island CSS 壳渲染正确 | 视觉测试            |
| G3  | DSD 零 JS 输出          | Shell 页面无 JS 依赖                          | HTML 审查           |
| G4  | 主题切换穿透 Shadow DOM | light/dark 切换 + Shadow DOM 内变量生效       | 手动测试            |
| G5  | 复合组件 DOM 结构正确   | dialog/dropdown/tooltip 选择器不断裂          | E2E 测试            |
| G6  | Tailwind 依赖完全移除   | 组件 CSS 中无 Tailwind utility class          | 代码审查            |
| G7  | 现有组件无回归          | www 站点渲染正确                              | E2E 测试            |
| G8  | 性能达标                | Shell CSS < 50KB, JS = 0KB                    | Lighthouse          |
| G9  | SOP 全部完成            | SOP-001 ~ SOP-008 所有 ✅                     | 任务列表            |
| G10 | CI 全绿                 | fmt/lint/typecheck/test/build                 | GitHub Actions      |

---

## 6. 风险与缓解

| 风险                                            | 概率  | 影响  | 缓解                                                                    |
| ----------------------------------------------- | ----- | ----- | ----------------------------------------------------------------------- |
| daisyUI CSS 中 Tailwind 依赖比预期深            | 🟡 中 | 🔴 高 | SOP-002 Phase 6 逐条映射替换                                            |
| `:host` 替换导致选择器特异性变化                | 🟡 中 | 🟡 中 | 逐组件验证，调整特异性                                                  |
| **主题变量在 Shadow DOM 内不生效**              | 🟡 中 | 🔴 高 | 主题变量定义在 `:root`，靠 CSS variables 继承穿透；SOP-002 Phase 2 重构 |
| **复合组件选择器在 DSD 内断裂**                 | 🔴 高 | 🔴 高 | modal/drawer 等所有子元素放同一 Shadow Root；SOP-002 Phase 4 重设计     |
| **`::slotted()` 无法穿透嵌套**                  | 🟡 中 | 🟡 中 | 只对直接子元素添加规则；嵌套样式由用户自行处理                          |
| **Popover API 在 Shadow DOM 内行为异常**        | 🟡 中 | 🟡 中 | Phase 7 验证；降级到 Island 实现                                        |
| **dialog/dropdown/tooltip 的 Ocean 壳功能有限** | 🟢 低 | 🟡 中 | 文档明确 Ocean 版限制，引导使用 Island 增强版                           |
| daisyUI 更新频繁，手动搬运成本高                | 🟡 中 | 🟡 中 | 锁定 v5.x，按季度同步；深度定制后差异大，上游变更影响小                 |
| 现有 www 组件迁移导致回归                       | 🟡 中 | 🟡 中 | 双轨并存，逐步迁移                                                      |
| adapter-vite CSS 注入管线复杂度超预期           | 🟡 中 | 🔴 高 | Phase 1 可先手动内联，后续自动化                                        |
| CSS 体积重复膨胀（多个同类组件）                | 🟡 中 | 🟡 中 | tokens 全局共享，组件 CSS 去重                                          |
| **表单元素 UA 样式在 Shadow DOM 内难自定义**    | 🟡 中 | 🟡 中 | 表单组件归 Island，Ocean 只做展示壳                                     |

---

## 附录 A: 执行顺序

```
Week 1:
  SOP-002 (daisyUI fork 分析) → SOP-001 (包结构) → SOP-003 (token 融合)

Week 2:
  SOP-002 (组件适配 1-10) → SOP-007 (现有组件 CSS 抽离)

Week 3:
  SOP-002 (组件适配 11-20) → SOP-004 (包导出) → SOP-005 (SSG 集成)

Week 4:
  SOP-006 (create 模板) → SOP-008 (测试验证) → ADR 文档 → 发布
```

## 附录 B: 依赖关系

```
SOP-001 ──→ SOP-002 ──→ SOP-004 ──→ SOP-005 ──→ SOP-006
   │            │                                  │
   └──→ SOP-003 ──→ SOP-007 ──────────────────────┘
                                     │
                                  SOP-008 (依赖所有 SOP)
```

## 附录 C: 总工时预估

| SOP      | 工时       |
| -------- | ---------- |
| SOP-001  | 4-6h       |
| SOP-002  | 20-28h     |
| SOP-003  | 6-8h       |
| SOP-004  | 2-3h       |
| SOP-005  | 8-12h      |
| SOP-006  | 4-6h       |
| SOP-007  | 6-8h       |
| SOP-008  | 6-8h       |
| ADR 文档 | 3-4h       |
| **合计** | **59-83h** |

> 按 4h/天有效开发时间计，约 **15-21 个工作日**（3-5 周）。
