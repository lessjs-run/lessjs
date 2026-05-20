# ADR-0033: Architecture Positioning — Three-Pillar Model

- Status: Accepted
- Date: 2026-05-18
- Target: v0.20.x
- Related: ADR-0030 (Hub Architecture), ADR-0032 (Playwright Snapshots)

## Context

After completing v0.19.0 (Hub MVP + Component Browser), we need an honest
assessment of where LessJS stands relative to its stated goal:

> An SSR rendering engine that renders mainstream frontend framework components
> via Declarative Shadow DOM with streaming render, a registry for one-click
> install of supported components, islands architecture where lightweight parts
> use framework-native rendering and heavyweight parts can be isolated with
> React/Vue, and backend integration with Supabase etc.

This ADR records the architectural reality, honest gaps, and the three-pillar
positioning that emerges from both.

## Decision

### Three-Pillar Architecture

LessJS is **not** an "SSG framework" — that label confuses the current
rendering mode with the framework's identity. SSG is one mode of the rendering
engine, not the framework's definition.

LessJS has three cores, each independently valuable:

```
LessJS 三支柱
│
├── 1. 全栈框架 (Full-Stack Framework)
│   ├── 路由系统（文件约定 + Hono）
│   ├── API Route（app/routes/api/*.ts → Hono sub-app → serverless）
│   ├── 开发服务器（Vite dev + Hono）
│   ├── 构建管线（Vite build + SSG/ISR/SSR + client bundle）
│   ├── 部署适配（CF Pages / Deno Deploy）
│   └── 请求上下文（auth / env / DB client）— TODO
│
├── 2. 通用WC渲染引擎 (Universal WC SSR/SSG Rendering Engine)
│   ├── DSD字符串渲染（renderDSD — pure string concatenation）
│   ├── 多框架适配器（Lit / React / Vanilla → Vue）
│   ├── Tier 1/2 渲染策略（DSD预渲染 vs 标签输出）
│   ├── Hydration策略（client:load/idle/visible/only）— TODO
│   ├── 渲染时机无关（build-time / ISR / request-time 同一套引擎）
│   └── 兼容性分类 + 验证
│
└── 3. Registry Hub
    ├── 包发现 + 搜索
    ├── 兼容性验证 + 报告
    ├── 组件预览渲染（Playwright snapshots）
    ├── 一键安装（less add）
    └── 社区提交 — future
```

### Pillar 1: 全栈框架

**定位**：以 Hono + Deno + Web Standards 为基础的现代全栈框架。

**不是SSG框架**。SSG只是渲染引擎的当前使用方式。框架层提供的是：

| 能力            | 状态 | 说明                                                       |
| --------------- | ---- | ---------------------------------------------------------- |
| 文件约定路由    | ✅   | `app/routes/` 自动扫描 + Hono 挂载                         |
| API Route       | ✅   | `app/routes/api/*.ts` → Hono sub-app，`/api/term` 已在运行 |
| 开发服务器      | ✅   | Vite HMR + Hono 中间件                                     |
| 构建管线        | ✅   | Phase 1 SSR → Phase 2 client → Phase 3 SSG                 |
| Serverless 部署 | ✅   | CF Pages Functions 天然支持                                |
| `@lessjs/rpc`   | ✅   | 客户端 fetch 抽象 + retry + abort                          |
| 请求上下文      | ❌   | 缺 env/auth/DB 注入                                        |
| ISR             | ❌   | 缺 stale-while-revalidate 缓存层                           |
| Supabase 集成   | ❌   | 缺 auth/DB/realtime                                        |

**vs Fresh**：Fresh 也是全栈框架（Deno + Preact + Island）。LessJS 的差异在
Pillar 2（WC渲染引擎）和 Pillar 3（Hub），不在框架层本身。

### Pillar 2: 通用WC渲染引擎

**定位**：将任何 Web Component 的 shadow DOM 渲染成 DSD HTML 的通用引擎。

**关键认知：渲染引擎与渲染时机无关。**

```
renderDSD(component, props) → DSD HTML string

这个函数不关心什么时候被调用：
├── Build-time（当前SSG）→ deno task build 时调用
├── ISR（下一步）→ 缓存过期时后台调用
└── Request-time（远期）→ 每次请求时调用
```

引擎是同一套，只是调用时机不同。所以"SSG框架"这个标签是错的——
引擎本身是通用的，SSG只是它的一个使用模式。

**已有的引擎能力**：

| 能力             | 状态                                                       |
| ---------------- | ---------------------------------------------------------- |
| DSD字符串渲染    | ✅ `renderDSD()` — 纯字符串拼接                            |
| 命名适配器协议   | ✅ `registerAdapter()` + `RendererProtocol`                |
| Lit adapter      | ✅ 完整 SSR + hydration                                    |
| React adapter    | ✅ `renderToStaticMarkup()` + `DsdReactElement`            |
| Vanilla adapter  | ✅ `render(): string` 组件                                 |
| Tier 1/2 分类    | ✅ DSD预渲染 vs 标签输出                                   |
| 嵌套组件渲染     | ✅ `renderNestedCustomElements()`                          |
| 兼容性分类       | ✅ ssr-capable / client-only / rejected / experimental-dom |
| Vue adapter      | ❌                                                         |
| Hydration 策略   | ❌ 只有 ssr:true/false                                     |
| Streaming output | ❌                                                         |

**ISR vs SSR vs SSG — 引擎视角**：

| 模式        | 何时调用 renderDSD() | 数据新鲜度        | 需要服务器   |
| ----------- | -------------------- | ----------------- | ------------ |
| SSG（当前） | build 时             | 构建时快照        | ❌           |
| ISR         | 缓存过期时           | 可配置 stale 时间 | ✅ edge fn   |
| SSR         | 每次请求             | 实时              | ✅ always-on |

**决策**：ISR 是最自然的下一步，因为 `renderDSD()` 是纯字符串拼接
（~1-5ms），ISR 的 99% 缓存命中 / 1% 重新渲染模式非常匹配。

### Pillar 3: Registry Hub

**定位**：Web Component 发现、验证、安装的一站式服务。

| 能力                             | 状态                            |
| -------------------------------- | ------------------------------- |
| 包搜索 + 过滤                    | ✅                              |
| 兼容性验证 + 报告                | ✅                              |
| 组件预览（Playwright snapshots） | ✅                              |
| `less add` 一键安装              | ✅                              |
| 组件详情页 + API reference       | ✅                              |
| SSR/client 分层显示              | ✅                              |
| 公开 Hub 服务                    | ❌ 本地 MVP                     |
| 社区提交流程                     | ⚠️ submitter 存在，缺 CI 自动化 |

### Honest Completion Assessment

| Pillar          | Completion | Key gap                                           |
| --------------- | ---------- | ------------------------------------------------- |
| 1. 全栈框架     | **60%**    | Hono+API ✅; 缺 ISR/auth/DB/context               |
| 2. WC渲染引擎   | **75%**    | DSD+3 adapters ✅; 缺 Vue/hydration策略/streaming |
| 3. Registry Hub | **65%**    | 本地 MVP 完整; 缺公开服务                         |
| **Overall**     | **~65%**   |                                                   |

### Positioning Statement

> **LessJS = 全栈框架 + 通用WC渲染引擎 + Registry Hub**
>
> 以 Web Components 为一等公民的全栈开发平台：
>
> - 全栈框架提供路由、API、部署
> - WC渲染引擎提供 DSD 零JS首屏 + 多框架适配
> - Hub 提供组件发现与一键安装

**Not**: "SSG框架" — SSG 是引擎的当前模式，不是框架身份
**Not**: "Islands框架" — Islands 是架构特征，不是全部

**vs Fresh**：Fresh = 全栈框架（Preact锁定）。LessJS = 全栈框架 + WC渲染引擎 + Hub
**vs Astro**：Astro = 全栈框架（多框架但WC二等公民）。LessJS = 全栈框架 + WC原生引擎
**vs Next.js**：Next = 全栈框架（React绑定）。LessJS = 全栈框架 + WC跨框架引擎

**"为什么选WC不选React"的三个答案**：

1. **样式隔离** — Shadow DOM 是浏览器机制，不是约定
2. **跨框架** — Shoelace/Material Web 写一次，React/Vue/Angular/Svelte 都能用
3. **零JS首屏** — DSD 是浏览器原生 HTML，不需要任何 runtime

### Path to Completion

| Priority | Pillar | What                                                   | Why                       |
| -------- | ------ | ------------------------------------------------------ | ------------------------- |
| P0       | 2      | Hydration strategies (`client:load/idle/visible/only`) | 引擎从能用变好用          |
| P1       | 1      | ISR (stale-while-revalidate cache layer)               | 框架从SSG到全栈的关键一步 |
| P1       | 2      | Vue adapter                                            | 引擎完成主流框架覆盖      |
| P2       | 1      | Request context (auth/env/DB)                          | 框架全栈能力闭环          |
| P2       | 1      | Supabase integration                                   | 框架后端集成              |
| P3       | 3      | Public Hub service                                     | 生态从本地到社区          |

## Consequences

### Positive

- Three-pillar model is clearer than "SSG Islands" — each pillar independently valuable
- Correcting "SSG框架" label — the engine is universal, SSG is one mode
- Acknowledging backend capability — Hono+API routes already work
- Clear next step per pillar: hydration (P2), ISR (P1), Hub service (P3)

### Negative

- Three pillars is ambitious for a solo project — must sequence strictly
- "全栈框架" label invites comparison with Next.js/Fresh which are far more mature
- 65% overall means significant work remains across all three pillars
- Vue adapter is a significant engineering effort

### Risks

- If hydration strategies are not meaningfully different from ssr:true/false,
  they add complexity without value
- ISR requires edge runtime support — CF Pages Functions can do it but
  implementation is non-trivial
- Three-pillar scope may feel unfocused — each pillar must be independently
  useful to avoid "jack of all trades, master of none"
- The "why WC over React" question has good answers but may not convince
  developers who haven't felt the pain of style leakage or framework lock-in
