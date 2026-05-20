# LessJS 产品愿景与路线战略

> 2026-05-18 v3 | 基于ADR-0033架构定位讨论修正 | 状态：Active
>
> v1过度倾向乐观叙事。v2基于差距评估重写。v3纠正关键误判：
> (1) 承认已有后端能力(Hono+API Route)、(2) 承认已是混合岛屿、
> (3) **LessJS不是SSG框架——SSG只是渲染引擎的当前模式**、
> (4) 三支柱模型：全栈框架 + 通用WC渲染引擎 + Registry Hub

## 零、我是谁、我要什么

LessJS 的当前和可预见的唯一消费者是其作者本人。

近期能做的事：**个人博客**，页面上自如混用多种 WC UI 库（Shoelace / Media Chrome / @lessjs/ui / Material Web 等）。

远期要做的事：**CRM 等数据驱动应用**。这需要 LessJS 从纯 SSG 引擎进化为全栈框架。

中间路径：博客验证引擎能力，CRM 驱动全栈能力生长。不是先做框架再找用户，而是自己做用户、边用边建。

---

## 一、产品定义：三大支柱

### 支柱 1：WC 通用渲染引擎

**核心能力**：自动处理任何 Web Component 的 SSG/SSR 渲染，基于 Declarative Shadow DOM（DSD）。

**两层渲染模型**（本次讨论的关键认知更新）：

| 层级               | 行为                                        | 条件                     | 覆盖范围      | 价值            |
| ------------------ | ------------------------------------------- | ------------------------ | ------------- | --------------- |
| **Tier 2（默认）** | 输出 `<my-comp>` 标签，浏览器 JS 升级后渲染 | 无条件                   | 所有 WC，100% | 可用性兜底      |
| **Tier 1（增强）** | 预渲染 shadow DOM 为 DSD 模板               | 通过 adapter 或 Hub 验证 | 已验证组件    | JS 加载前有视觉 |

**诚实的评估**：

- Tier 2 技术上 100% 正确——任何 WC 标签放在 SSG 输出里就是合法 HTML，浏览器一定会升级它
- 但 Tier 2 本身**不构成差异化**——一个普通 HTML 文件 + `<script type="module">` 就能做到同样的事
- Tier 1（DSD 预渲染）才是引擎的价值所在，但目前对第三方 WC 仍然脆弱——每个新库都可能冒出新问题（Shoelace 的 CSS 变量、嵌套 button、slot 内容错位……）
- 第三方 WC 的 shadow DOM 内部结构天然不可预测，"通用"的意思是"有通用框架"，不是"所有 WC 零成本适配"

**退路**：DSD 搞不定就回 SD，SD 不行就 Tier 2 client-only。总是能用的，只是体验分层。

### 支柱 2：WC Registry Hub

**核心能力**：Web Component 注册中心，用户提交、发现、安装第三方 WC。

**两种定位**：

| 定位              | 体验                                           | 价值     | 可行性                 |
| ----------------- | ---------------------------------------------- | -------- | ---------------------- |
| **A. 安装即渲染** | `less install @scope/pkg` → 自动 Tier 1/2 渲染 | 差异化强 | 依赖引擎 Tier 1 覆盖率 |
| **B. 展示型目录** | 类 webcomponents.org → 浏览、搜索              | 差异化弱 | 技术简单               |

**诚实的评估**：

- "安装即渲染"是很好的故事，但前提是 Tier 1 覆盖率够高。如果大多数 WC 落到 Tier 2（无预渲染），体验和 `npm install` 没本质区别
- Hub 的更现实价值可能是**验证和兼容性报告**——"这个 WC 在 LessJS 里能 SSR / 不能 SSR / 需要额外配置"
- webcomponents.org 半死不活是事实，但"它死了"不等于"市场需要替代品"——WC 开发者可能已习惯 npm + GitHub 发现方式
- 作为单人项目，Hub 的社区冷启动是经典鸡生蛋问题

**近期策略**：先把 Hub 做成自己可用的工具——快速发现和验证 WC 库的兼容性。社区化是远期目标。

### 支柱 3：全栈框架

**核心能力**：以 Web 标准 + Deno 为基础的现代全栈框架。

**核心哲学**：

```
Web Standards First, Deno Second
├── DSD（渲染核心）— 已实现
├── Signals（响应核心）— 已实现，TC39 提案对齐
├── ESM（模块核心）— 已实现
├── Islands（架构核心）— 已实现
├── Custom Elements + Slots（组件核心）— 已实现
└── Modern Web APIs（fetch, streams, URLPattern）— 部分实现
```

**任务分层**：

| 任务类型                | 技术组合                                 | 场景                |
| ----------------------- | ---------------------------------------- | ------------------- |
| **轻量（博客/文档站）** | WC UI 库 + Hono + LessJS SSG/SSR/Signals | 内容为主，交互为辅  |
| **重型（CRM/仪表盘）**  | 部分 Islands → React/Vue + Supabase      | 复杂交互 + 数据驱动 |

**Supabase 定位**：生态伙伴，不自建。Supabase Edge Functions 基于 Deno + Hono，和 LessJS 天然对齐。LessJS 提供前端渲染，Supabase 提供 DB + Auth + Realtime + Storage。

**诚实的评估**：

- LessJS **现在不是全栈框架**。它是 SSG 引擎 + WC 渲染层。缺少 API Route、请求时 SSR、后端服务集成
- "轻量用 WC + Hono，重型切 React/Vue + Supabase"——逻辑正确，但有切换成本：用户需要同时理解 LessJS 的 Islands/Signals/DSD 和 React/Vue 的体系
- Hono API Route、Supabase 集成、Edge SSR——每一项都不是"加个插件"，需要设计路由系统、请求上下文、部署适配层

---

## 二、当前真实状态（不美化 — v3 修正）

### 定位声明

> **LessJS = 全栈框架 + 通用WC渲染引擎 + Registry Hub**
>
> 以 Web Components 为一等公民的全栈开发平台。

**不是SSG框架**。SSG只是渲染引擎的当前使用方式，不是框架身份。
`renderDSD()` **架构上**是渲染时机无关的——build-time (SSG) / ISR / request-time (SSR)
用的是同一套引擎。**当前实现**: SSG only, ISR/SSR 计划中。

### 架构模型：SSG Islands（Build-Time SSR）

当前是**静态站点生成器 + 岛屿架构**，不是 request-time SSR 框架。
`renderDSD()` 在 `deno task build` 时运行，生成带 `<template shadowrootmode="open">`
的静态 HTML。这是 **build-time SSR** — "SSR" 描述的是"把组件 shadow DOM 渲染成 HTML"这个行为，
不是"每个请求时渲染"这个时机。

### 后端能力：已有（不是零）

| 能力              | 状态 | 证据                                 |
| ----------------- | ---- | ------------------------------------ |
| Hono 开发服务器   | ✅   | `entry-renderer.ts`                  |
| API 路由约定      | ✅   | `app/routes/api/*.ts` → Hono sub-app |
| 路由扫描 API 发现 | ✅   | `getRouteType()` 检测 `api/` 前缀    |
| API 路由渲染      | ✅   | `renderApiRoute()` 挂载 Hono sub-app |
| 运行中的 API      | ✅   | `/api/term`                          |
| `@lessjs/rpc`     | ✅   | 客户端 fetch 抽象                    |
| CF Pages 部署     | ✅   | 静态资源 + serverless functions      |

缺少的：数据库客户端、认证、ISR 缓存层、请求上下文注入。

### 混合岛屿：已有（但缺策略选择）

同一页面已支持 Lit + React + Vanilla 共存，各自独立 hydration。
当前是二值模型：`ssr:true` → DSD预渲染+hydrate / `ssr:false` → client-only。
缺少 `client:load/idle/visible/only` 策略（见 ADR-0033）。

### 能力评分

| 能力                           | 状态                   | 诚实评分            |
| ------------------------------ | ---------------------- | ------------------- |
| SSG 静态站点生成               | ✅ 稳定                | 9/10                |
| Lit adapter DSD SSR            | ✅ 稳定                | 8/10                |
| Vanilla adapter                | ✅ 可用                | 7/10                |
| React adapter                  | ✅ 可用                | 6/10                |
| 第三方 WC Tier 2（标签输出）   | ✅ 零配置              | 10/10（但无差异化） |
| 第三方 WC Tier 1（DSD 预渲染） | ⚠️ 脆弱                | 4/10                |
| Signals（通信层）              | ✅ 可用                | 6/10                |
| Signals（渲染层渗透）          | ❌ 未做                | 2/10                |
| Islands 架构                   | ✅ 稳定                | 7/10                |
| Islands hydration 策略         | ❌ 只有 ssr:true/false | 2/10                |
| Registry Hub（基础设施）       | ✅ 可用                | 6/10                |
| Registry Hub（快照稳定性）     | ⚠️ 刚修了好几轮 bug    | 4/10                |
| API Route（Hono）              | ✅ 已有                | 6/10                |
| ISR 缓存层                     | ❌ 不存在              | 0/10                |
| 请求时 SSR                     | ❌ 不存在              | 0/10                |
| Vue adapter                    | ❌ 不存在              | 0/10                |
| Supabase 集成                  | ❌ 不存在              | 0/10                |
| Edge runtime 适配              | ❌ 仅静态 CDN          | 1/10                |

**加权平均：~6.5/10**（v3 三支柱模型：框架60% + 引擎75% + Hub65%）

---

## 三、竞品格局（精简 — v3 增补 Fresh）

| 产品                  | WC 原生        | 全栈    | DSD | Signals | Islands     | 框架绑定    |
| --------------------- | -------------- | ------- | --- | ------- | ----------- | ----------- |
| **Astro**             | ❌ 当普通元素  | ✅ 成熟 | ❌  | ❌      | ✅ 多策略   | 多框架共存  |
| **Fresh**             | ❌ Preact-only | ✅      | ❌  | Preact  | ✅ 原生     | Preact 绑定 |
| **Enhance**           | ✅             | 部分    | ❌  | ❌      | 部分        | WC 原生     |
| **Lit SSR**           | ✅ 仅 Lit      | ❌ 库   | ❌  | ❌      | ❌          | Lit 绑定    |
| **Next.js**           | ❌             | ✅      | ❌  | ❌      | 部分（RSC） | React 绑定  |
| **webcomponents.org** | ✅ 展示        | ❌      | ❌  | ❌      | ❌          | 无框架      |

**市场空白**：没有人同时做到 WC 原生 + DSD + 全栈能力。LessJS 的目标位置。

**vs Fresh**：Fresh = 全栈框架（Preact锁定）。LessJS = 全栈框架 + WC渲染引擎 + Hub。
框架层是同级竞品，但 LessJS 多了渲染引擎和 Hub 两个支柱。

**vs Astro**：Astro = 全栈框架（多框架但WC二等公民）。LessJS = 全栈框架 + WC原生引擎。
Astro 在框架层更成熟，但 WC 在 Astro 里当普通 HTML 元素处理，没有 DSD 预渲染。

**vs Next.js**：Next = 全栈框架（React绑定）。LessJS = 全栈框架 + WC跨框架引擎。
Next 在 React 生态内无可匹敌，但无法做零 runtime 首屏和跨框架组件。

**核心差异化**（三支柱视角）：

1. **Pillar 2 独有价值**：DSD 零 runtime 首屏 — Astro 不做 WC 原生，Fresh 不做 DSD，
   Next 必须加载 React runtime。这是浏览器原生能力，无法通过工程优化追平
2. **Pillar 2+3 组合**：渲染引擎 + Registry 一体 — 安装即渲染，验证即分层
3. **Pillar 1 差异**：WC 原生全栈 — 不是"全栈框架 + WC 容忍"，而是"WC 是一等公民"

**"为什么选 WC 不选 React"的三个答案**：

1. **样式隔离** — Shadow DOM 是浏览器机制，不是约定。团队再大也不会崩
2. **跨框架** — Shoelace/Material Web 写一次，React/Vue/Angular/Svelte 都能用
3. **零 JS 首屏** — DSD 是浏览器原生 HTML，不需要任何 runtime 解析

---

## 四、差异化（诚实版 v3）

### 真正的壁垒（别人短期内不会做的）

1. **DSD 自动渲染引擎** — Astro 不做 WC 原生，Enhance 不做 DSD，Fresh 不做 WC，
   Lit SSR 只管 Lit。受众可能比想象的小，但对 WC 重度用户是刚需

2. **Signals-Islands 一体** — TC39 Signals 向 Stage 2 推进中。先发优势在，
   但不是技术壁垒——Astro/Nuxt 愿意的话也能加

3. **Registry + Engine 一体** — 最独特的组合，但依赖前两者成立

4. **多框架 WC 适配** — Fresh 绑 Preact，Astro 把 WC 当普通元素。
   LessJS 让 Lit/React/Vanilla（+未来 Vue）以 WC 形式共存并独立 hydration

### 不是壁垒的

- SSG/SSR 能力：所有全栈框架都有
- 多框架支持：Astro 做得更多更成熟
- 静态部署：所有框架都支持
- Hono API Route：Fresh 也用 Preact SSR

### 差异化够不够硬？

**对大众开发者可能不够硬，对 WC 重度用户够硬**。

但当前消费者只有作者本人，所以判断标准是：
**LessJS 自己做 CRM 时够不够用**。如果够用，至少证明了一个人能从这个框架里获得真实价值。

**v3 新增认知**：差异化不是"有没有"，是"强不强"。DSD 零 runtime 首屏是最硬的差异化——
这是浏览器原生能力，不是框架特性。其他框架无法通过工程优化追平这一点。

---

## 五、WC 渲染策略详解

### Tier 2：SSG 基线（默认行为）

```
用户写 <sl-button variant="primary">Click</sl-button>

构建时：原样输出标签
运行时：HTML 解析 → JS 加载 → customElements.define() → 升级

结果：所有 WC 100% 可用，零配置
代价：JS 加载前无视觉（FOUC）
```

这不需要引擎做任何事。一个 HTML 文件就能做到。但 LessJS 的价值在于：**路由扫描、代码分割、Islands 声明、构建报告**——这些是围绕渲染的工程能力。

### Tier 1：DSD 预渲染（增强行为）

```
构建时：
  1. Playwright 打开组件页面
  2. 等待 WC 升级 + shadow DOM 就绪
  3. 捕获 shadowRoot.innerHTML
  4. 包装为 <template shadowrootmode="open">

输出：
  <sl-button variant="primary">
    <template shadowrootmode="open">
      ...预渲染的 shadow DOM...
    </template>
    Click
  </sl-button>

运行时：HTML 解析 → 立即显示视觉 → JS 加载 → 水合接管
```

**已知陷阱**（从 Shoelace 修复中学到的）：

| 问题                       | 原因                                                    | 解决方案                    |
| -------------------------- | ------------------------------------------------------- | --------------------------- |
| CSS 变量缺失 → 组件透明    | Playwright 只捕获元素标记，不含外部 CSS                 | 注入 `light.css`            |
| 嵌套 `<button>` → 渲染崩坏 | shadowHtml 中的 `<button>` 和 WC 自身的 `<button>` 冲突 | 降级 `<button>` → `<div>`   |
| slot 内容为空              | demoAttrs/demoSlots 丢失                                | 在最终 HTML 中恢复          |
| 快照体积膨胀               | shadow DOM 深度嵌套                                     | button→div 降级显著减小体积 |

**关键认知**：Tier 1 对每个第三方库都是一件一个案的手工活。不是"验证通过就自动跑"，是"每个新库都可能冒出新问题"。这不是 bug，是第三方 WC 的 shadow DOM 内部结构天然不可预测。

### 退路链条

```
Tier 1 DSD 预渲染  →  最好
       ↓ 搞不定
Tier 1 SD 预渲染（不包装为 shadowrootmode）  →  可接受
       ↓ 搞不定
Tier 2 标签输出 + 浏览器升级  →  总是能用的
```

---

## 六、全栈框架路径（从 SSG 到全栈 — v3 修正）

### 当前架构

```
构建时：扫描路由 → SSG 生成静态 HTML（含 DSD 预渲染）→ 部署到 CF Pages
请求时（静态页面）：CF Pages 直接返回 HTML
请求时（API）：Hono handler → 返回 JSON（已有，如 /api/term）
请求时（动态页面）：无（ISR / request-time SSR 尚未实现）
```

### 目标架构

```
构建时：扫描路由 → SSG 生成静态页面 → 部署
请求时（静态页面）：CF Pages 直接返回 HTML
请求时（动态页面）：ISR 检查 stale → 后台重新 renderDSD() → 返回缓存/新 HTML
请求时（API）：Hono handler → 返回 JSON
请求时（需要实时数据的页面）：request-time renderDSD() → 返回 HTML
```

### ISR vs SSR：为什么 ISR 更适合 LessJS

```
SSG:  build一次 → 永久静态 → 内容变了要重新build+deploy
ISR:  build一次 → 访问时检查stale → 后台重新渲染 → 下次访问看到新内容
SSR:  每次访问 → 都渲染 → 永远最新但最慢
```

`renderDSD()` 是纯字符串拼接，一次渲染 ~1-5ms。ISR 逻辑：

1. 访问页面 → 返回缓存 HTML
2. 检查 `revalidate: 60` → 超过60秒则后台重新 `renderDSD()`
3. 下次访问返回新 HTML

99% 请求命中缓存，1% 触发重新渲染。比 request-time SSR 高效得多。

### 缺失能力（修正版）

| 能力           | 当前状态               | 优先级 | 说明                            |
| -------------- | ---------------------- | ------ | ------------------------------- |
| Hydration 策略 | ❌ 只有 ssr:true/false | **P0** | `client:load/idle/visible/only` |
| ISR 缓存层     | ❌ 不存在              | P1     | stale-while-revalidate          |
| Vue adapter    | ❌ 不存在              | P1     | 完成主流框架覆盖                |
| Supabase 集成  | ❌ 不存在              | P2     | Auth + DB + Realtime            |
| 请求时 SSR     | ❌ 不存在              | P2     | 仅限需要实时数据的页面          |
| 公开 Hub 服务  | ❌ 本地 MVP            | P3     | 基础设施 + 社区                 |

### 技术对齐优势

LessJS 选择 Deno + Hono + Web Standards 的技术栈，和 Supabase + Cloudflare 的技术栈高度重合：

```
LessJS          Supabase           CF Pages
──────          ────────           ────────
Deno runtime    Deno runtime       Edge Runtime
Hono (可选)      Hono (官方推荐)     Hono (兼容)
ESM             ESM                ESM
Web APIs        Web APIs           Web APIs
```

这不是巧合——这是"Web Standards First"哲学的直接结果。选择对齐 Web 标准的框架，生态兼容性自然出现。

---

## 七、路线图（修订版 v3）

### 近期：v0.19.x 完成（当前）

- Hub Component Browser 稳定
- Shoelace 快照修复完成
- Playwright 替代 happy-dom（ADR-0032）
- 博客可用 LessJS 构建

### 中期：v0.20.x — Islands 策略 + 全栈地基

**Islands 升级**（P0）：

- Hydration 策略指令：`client:load` / `client:idle` / `client:visible` / `client:only`
- 取代当前二值 `ssr:true/false` 模型
- 允许同一页面不同组件使用不同 hydration 策略

**渲染引擎**：

- Tier 2 默认行为在文档和 CLI 中明确化
- Tier 1 快照对 Shoelace 全量验证
- 更多 WC 库的 Playwright 快照（Material Web 等）

**全栈地基**：

- Hono API Route 正式化（已有原型，完善 dev/build 一致性）
- 请求上下文注入机制
- `less dev` 支持 API route 热重载（已有基础）

**博客验证**：

- 用 LessJS 构建个人博客
- 页面混用 Shoelace + Media Chrome + @lessjs/ui
- 发现并修复真实使用中的问题

### 中期：v0.21.x — 全栈框架成型

- ISR 缓存层（stale-while-revalidate）
- 请求时 SSR（dynamic route → Edge SSR）
- Supabase 集成模板（Auth + DB）
- adapter-vue 启动
- Signals → 渲染层渗透（signal-to-DOM 绑定实验）

### 远期：v0.22.x — 生态完善

- adapter-vue 正式
- Deno Deploy 适配
- Hub 社区提交流程成熟
- Tier 1 扩展到更多 WC 库

### 远期：v1.0.0 — API 冻结

- 所有核心 API 稳定
- 完整文档 + 迁移指南
- v0.x → v1.0 兼容性承诺

---

## 八、风险与开放问题

### 高风险

1. **Tier 1 脆弱性** — 每个第三方 WC 库可能需要独立的快照修复。这不是工程失误，是 shadow DOM 不可预测性的必然结果。需要建立"快照修复 SOP"来降低每次新库接入的成本

2. **全栈能力的工程量** — ISR + Vue adapter + Supabase 集成，三条线同时推进风险太大。必须严格排序：hydration策略 → ISR → Vue → Supabase

3. **差异化对大众开发者够不够** — 对 WC 重度用户够，但这类人可能本来就够少。个人项目阶段这不是问题，但如果未来想让其他人用，需要找到更具体的"选择 LessJS 而不是 Astro"的场景

4. **DSD 浏览器兼容性** — DSD 支持已达 98%+，但 Safari 16.4 之前不支持。如果目标用户群有旧 Safari 用户，需要 polyfill 降级

### 中风险

5. **Hydration 策略实现复杂度** — `client:visible` 需要 IntersectionObserver，`client:idle` 需要 requestIdleCallback。看似简单但边界情况多（SSG 输出时元素不在 DOM 中、视口检测时机等）

6. **Vue 适配器 DX** — Vue 响应式和 WC Shadow DOM 有天然摩擦，和 React 适配器面临的问题类似但不同

7. **TC39 Signals 节奏** — 提案向 Stage 2 推进中，API 可能变化。LessJS 的 polyfill 层可以吸收变化，但需要跟进

8. **Supabase 集成深度** — Auth/Realtime/Storage 需要服务端运行时，必须先有 ISR 和请求上下文

### 开放问题

9. **Hydration 策略是声明式还是约定式** — Astro 用 `client:load` 属性，LessJS 是用 `less.hydrate` 字段还是新语法？需要在 ADR 中确定

10. **博客 → CRM 的技术路径** — 博客验证 SSG + WC 渲染，CRM 需要 ISR + API + Auth。什么时候切换？用什么信号判断"SSG 引擎够稳了，可以开始做全栈"？

11. **品牌定位** — "LessJS" 暗示"更少的 JS"，但核心叙事是"WC 全栈引擎"。名字和定位是否匹配？要不要改名？当前不做决定，等 v1.0 前再考虑

12. **Tier 1 的边界在哪** — "通用 WC DSD 预渲染"的理想很美好，但每个新库的接入成本不可忽视。什么时候该说"这个库不支持 Tier 1，用 Tier 2 就好"？

---

## 九、决策记录

本节记录战略讨论中形成的关键决策，供未来参考。

| 日期       | 决策                                               | 上下文                                                               |
| ---------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| 2026-05-18 | WC 渲染重构为 Tier 1/2 两层模型                    | 之前把"自动 SSR"理解为单一目标，实际应分层：Tier 2 兜底、Tier 1 增强 |
| 2026-05-18 | DSD 搞不定可回退 SD                                | "实在不行拉倒回 SD 也行"——回退链条：DSD → SD → Tier 2 client-only    |
| 2026-05-18 | 消费者是作者本人                                   | "真实消费者就我一个"——产品决策以"我自己够不够用"为准                 |
| 2026-05-18 | 近期目标是个人博客                                 | 博客验证引擎能力，页面上自如混用多种 WC UI 库                        |
| 2026-05-18 | 远期目标是 CRM 等数据驱动应用                      | CRM 需要 ISR + API + Auth + DB → 驱动全栈能力生长                    |
| 2026-05-18 | 全栈路径：Hydration策略 → ISR → Vue → Supabase     | 严格排序，四条线不能并行推进                                         |
| 2026-05-18 | Supabase 是生态伙伴不自建                          | Deno + Hono 技术栈对齐，不自建 Auth/DB/Realtime                      |
| 2026-05-18 | 不急着做全栈，先稳固引擎                           | "先把 DSD 引擎做到真正稳定、Hub 做到真正可用"                        |
| 2026-05-18 | 定位为 SSG Islands（非 streaming SSR）             | ADR-0033：当前是 build-time SSR，不是 request-time                   |
| 2026-05-18 | 承认已有后端能力（Hono + API Route）               | ADR-0033：纠正"后端零基础"误判                                       |
| 2026-05-18 | 承认已是混合岛屿（缺策略选择）                     | ADR-0033：Lit+React+Vanilla 共存，但只有 ssr:true/false              |
| 2026-05-18 | ISR 优于 request-time SSR                          | ADR-0033：renderDSD() 是纯字符串拼接，ISR 的 99%/1% 缓存模式更匹配   |
| 2026-05-18 | Hydration 策略是 P0 优先级                         | ADR-0033：从二值模型到 client:load/idle/visible/only                 |
| 2026-05-18 | 定位声明：全栈框架 + 通用WC渲染引擎 + Registry Hub | ADR-0033 v3：三支柱模型取代"SSG框架"标签                             |
