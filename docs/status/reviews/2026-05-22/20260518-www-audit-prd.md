# LessJS www 目录内容审计报告与重组 PRD

## 项目信息

- **Language**: 中文
- **Programming Language**: LessJS 框架（Lit + TypeScript + Vite SSG）
- **Project Name**: `lessjs-www-restructure`
- **原始需求**: 全面审查 www 目录，识别过时/废弃文档，将导航重组为四部分（框架/引擎/RegistryHub/Blog），优化页面布局

---

## 一、当前状态分析

### 1.1 文件总览

| 类别 | 数量 | 位置 |
|------|------|------|
| 源路由 (.ts) | ~55 | `app/routes/` |
| 博客内容 (.md) | 44 | `content/blog/` |
| 构建产物 (.html) | 472 | `dist/` |
| 注册表组件页 | ~68 | `dist/registry/` (含 zh 镜像) |
| 决策记录页 | ~24 | `dist/decisions/` (含 zh 镜像) |
| 岛屿/组件 (.ts) | 9 | `app/islands/`, `app/components/` |
| 静态资源 | 18 | `public/` |

### 1.2 当前导航结构

**顶部导航栏（headerNav）**— 来自 `vite.config.ts`:

| 序号 | 标签 | 链接 | 分类 |
|------|------|------|------|
| 1 | Docs | `/guide/positioning` | 框架 |
| 2 | Architecture | `/guide/architecture` | 框架 |
| 3 | Registry | `/registry` | RegistryHub |
| 4 | Blog | `/blog` | Blog |
| 5 | UI | `/ui` | 孤立 |
| 6 | Roadmap | `/roadmap` | 孤立 |
| 7 | Community | `/community` | 孤立 |
| 8 | JSR | `https://jsr.io/@lessjs/core` | 外链 |

**侧边栏导航（navSections）**— 由路由文件 `meta.section` 自动生成:

| Section | 包含页面 |
|---------|---------|
| Start Here | Positioning, Getting Started, Standards & Registry |
| Core Model | Routing, SSG Rendering, DSD Rendering, Island Upgrade, Island Deep Dive, Package Compatibility, API Routes, RPC |
| Strategy | Content System, Comparison |
| Production | Security & Middleware, Configuration, Error Handling, Testing, Deployment, PWA Support |
| Packages | Design System (@lessjs/ui), Web Awesome |
| Roadmap & Decisions | Roadmap, Community |
| History | Contributing, Changelog |

### 1.3 问题清单

#### P0 — 导航混乱

| # | 问题 | 影响 |
|---|------|------|
| 1 | **headerNav 8 项过多**，用户无法快速定位。Docs 和 Architecture 本质同属框架文档，拆成两项误导用户。 | 用户迷路，首屏导航失效 |
| 2 | **UI、Roadmap、Community 无归属**。UI 展示页混在导航栏，Roadmap 是 meta 页面不该在 header，Community 只有 4 个外链不值得独立导航项。 | 导航噪音 |
| 3 | **侧边栏 section 过多（7 个）**，且分组逻辑与"框架/引擎/RegistryHub/Blog"四支柱不一致。"Strategy" 和 "History" 是元信息分类，不是产品维度。 | 信息架构与产品定位脱节 |
| 4 | **Comparison 页面没有 meta.section**，无法出现在侧边栏，成为孤岛页面。 | 死链接/孤岛 |
| 5 | **styling/web-awesome 孤立**。只有 UI 页面底部链接到它，没有从导航进入的路径。 | 孤岛页面 |

#### P1 — 内容过时/重复

| # | 问题 | 详情 |
|---|------|------|
| 6 | **Blog 与 Decisions 内容高度重叠** | 44 篇博客中至少 24 篇是 ADR 编号格式的内部决策记录（0001-0024），与 `/decisions` 路由的内容完全重复。用户不知道该看哪个。 |
| 7 | **版本号不一致** | Roadmap 页面写 v0.18.0 是当前版本，但首页显示 v0.19.0。多个页面的版本引用需要统一更新。 |
| 8 | **Changelog 超大且无分页** | 所有版本的 changelog 塞在一个页面，随着版本增长将不可维护。 |
| 9 | **Web Awesome 页面内容极薄** | 仅展示 4 个按钮变体，没有实际集成指南或使用价值，属于占位页面。 |
| 10 | **Community 页面只有 4 个外部链接** | 内容量不足以支撑独立页面，可合并到页脚。 |

#### P2 — 布局/体验优化

| # | 问题 | 详情 |
|---|------|------|
| 11 | **首页 _renderer 与 guide _renderer 不一致** | 首页用 `index/_renderer.ts`，guide 用 `guide/_renderer.ts`，后者注入搜索和编辑链接，前者没有。 |
| 12 | **i18n 镜像产生 2x 页面** | 每个 en 页面都有 zh 镜像，但很多 zh 页面内容只是 en 的翻译占位。472 个 HTML 有一半是 zh。 |
| 13 | **搜索索引（search-index.json）可能包含废弃页面** | 如果不清理，搜索会导向已删除页面。 |
| 14 | **hub 数据文件冗余** | `_hub-data-full.ts` 和 `_hub-data.ts` 两个注册表数据源，需要确认是否需要合并。 |

---

## 二、目标导航结构

### 2.1 新四支柱导航

**原则**: 导航结构与 LessJS 的"三支柱 + Blog"定位对齐，砍掉元信息导航（Roadmap、Community、Contributing、Changelog 降级为页脚/子页面）。

```
┌──────────────────────────────────────────────────────┐
│  LessJS    框架  |  引擎  |  RegistryHub  |  Blog   │
└──────────────────────────────────────────────────────┘
```

| 导航项 | 链接 | 含义 |
|--------|------|------|
| **框架** | `/framework` (原 `/guide`) | 全栈框架能力：路由、SSG/ISR/SSR、API Routes、配置、部署、PWA |
| **引擎** | `/engine` (新分区) | WC 渲染引擎能力：DSD、Islands、多框架适配器、包兼容性 |
| **RegistryHub** | `/registry` | 保持现有，WC 包发现、搜索、安装、兼容性验证 |
| **Blog** | `/blog` | 保持现有，版本发布 + 技术文章 |

### 2.2 侧边栏重组

#### 框架（Framework）侧边栏

| Section | 页面 |
|---------|------|
| 快速开始 | Getting Started, Positioning |
| 核心功能 | Routing, SSG/ISR/SSR Rendering, API Routes (Hono), Content System |
| 生产就绪 | Configuration, Deployment, Security & Middleware, Error Handling, Testing, PWA Support |

#### 引擎（Engine）侧边栏

| Section | 页面 |
|---------|------|
| 核心原理 | Architecture, DSD Rendering, Island Upgrade, Island Deep Dive |
| 兼容性 | Package Compatibility, Standards & Registry |
| 参考 | API Reference (@lessjs/core), Design System (@lessjs/ui) |

#### RegistryHub 侧边栏

| Section | 页面 |
|---------|------|
| 浏览 | 包列表（已有） |
| 使用 | `less add` 安装, `less validate` 验证 |

---

## 三、内容分类方案

### 3.1 现有页面归类

| 当前页面 | 新归属 | 操作 |
|----------|--------|------|
| `/guide/positioning` | **框架** → 快速开始 | 保留，路由不变 |
| `/guide/getting-started` | **框架** → 快速开始 | 保留，路由不变 |
| `/guide/routing` | **框架** → 核心功能 | 保留 |
| `/guide/ssg` | **框架** → 核心功能 | 重命名标题为"SSG/ISR/SSR Rendering" |
| `/guide/api` | **框架** → 核心功能 | 保留 |
| `/guide/content-system` | **框架** → 核心功能 | 保留 |
| `/guide/configuration` | **框架** → 生产就绪 | 保留 |
| `/guide/deployment` | **框架** → 生产就绪 | 保留 |
| `/guide/security-middleware` | **框架** → 生产就绪 | 保留 |
| `/guide/error-handling` | **框架** → 生产就绪 | 保留 |
| `/guide/testing` | **框架** → 生产就绪 | 保留 |
| `/guide/pwa` | **框架** → 生产就绪 | 保留 |
| `/guide/architecture` | **引擎** → 核心原理 | **路由改为** `/engine/architecture` |
| `/guide/dsd` | **引擎** → 核心原理 | **路由改为** `/engine/dsd` |
| `/guide/islands` | **引擎** → 核心原理 | **路由改为** `/engine/islands` |
| `/guide/islands-deep` | **引擎** → 核心原理 | **路由改为** `/engine/islands-deep` |
| `/guide/package-compatibility` | **引擎** → 兼容性 | **路由改为** `/engine/package-compatibility` |
| `/guide/standards-registry` | **引擎** → 兼容性 | **路由改为** `/engine/standards-registry` |
| `/guide/comparison` | **引擎** → 核心原理 | **修复**: 添加 meta.section，**路由改为** `/engine/comparison` |
| `/guide/rpc` | **框架** → 核心功能 | 保留在框架 |
| `/registry` | **RegistryHub** | 保留，不变 |
| `/reference/core` | **引擎** → 参考 | **路由改为** `/engine/reference/core` |
| `/ui` | **引擎** → 参考 | 合并为引擎的子页面 `/engine/design-system` |
| `/styling/web-awesome` | — | **删除**（内容极薄，无实际价值） |
| `/roadmap` | — | **从导航移除**，降级为页脚链接 |
| `/community` | — | **从导航移除**，内容合并到页脚 |
| `/changelog` | — | **从导航移除**，降级为 `/blog` 下的子分类 |
| `/contributing` | — | **从导航移除**，降级为 GitHub README / 页脚链接 |
| `/decisions` | — | **从导航移除**，ADR 索引页降级为 `/blog` 子分类 |

### 3.2 Blog 内容清理

| 操作 | 博客文章 | 原因 |
|------|----------|------|
| **保留** | `2026-04-30-*`, `2026-05-02-*` ... 所有版本发布日志 | 版本历史，用户会搜索 |
| **保留** | `deployment/cloudflare-guide.md` | 实际部署指南，有价值 |
| **保留** | `design/design-review.md`, `design/homepage-v2.md` | 设计决策文档 |
| **合并到 Decisions** | `0001-*` 至 `0024-*` (24 篇 ADR 编号博客) | 与 `/decisions` 完全重复，博客不应承载 ADR |
| **归档** | `adr-0008-0009-*`, `adr-0009-*`, `core-architecture-simplification-report.md` | 内部过程文档，非面向用户 |
| **删除** | `0008-implementation-plan.md` | 与 `0008-eliminate-createserver-globalthis-bridges.md` 编号冲突，实现计划已是过时快照 |

### 3.3 死链接/孤岛检测

| 页面 | 问题 | 修复方案 |
|------|------|----------|
| `/guide/comparison` | 无 meta.section，不在侧边栏 | 添加 meta，归入引擎 |
| `/styling/web-awesome` | 仅从 /ui 底部链接可达 | 删除或合并到引擎 Design System 页 |
| Roadmap 底部链接 `/docs/decisions/adr-0006-version-roadmap` | `/docs/` 前缀不存在，应为 `/decisions/` | 修复链接 |
| Roadmap 底部链接 `/docs/decisions/adr-0007-npm-publishing-strategy` | 同上 | 修复链接 |
| Roadmap 底部链接 `/docs/architecture` | `/docs/` 前缀不存在 | 修复为 `/guide/architecture` |

---

## 四、页面布局优化建议

### 4.1 首页优化

| 当前 | 建议 |
|------|------|
| 无搜索按钮 | 注入 `less-search` 组件（与 guide _renderer 对齐） |
| 无 "Edit this page" 链接 | 不需要，首页无文档编辑需求 |
| hero CTA 指向 `/guide/getting-started` | 改为指向 `/framework/getting-started`（新路由后） |

### 4.2 Guide/Engine 页面统一布局

所有 `/framework/` 和 `/engine/` 路由共享 `_renderer.ts`：
- 搜索按钮注入（已有）
- "Edit this page" 注入（已有）
- 侧边栏按分区自动分组（已有 navSections 机制，只需修改 meta.section）

### 4.3 Registry 页面

- 保持当前布局不变
- 添加侧边栏"使用指南"链接到引擎相关页面

### 4.4 Blog 页面

- 添加分类标签：`release` / `adr` / `guide` / `design`
- 版本发布日志自动从 changelog 同步（避免手动维护两处）

---

## 五、优先级排列

### P0 — 必做（导航重组核心）

1. **修改 headerNav 为四项**: 框架 / 引擎 / RegistryHub / Blog
2. **创建 `/engine/` 路由目录**，将引擎相关页面从 `/guide/` 迁移
3. **修改所有引擎相关页面的 meta.section**，对齐新侧边栏分组
4. **修复 `/guide/comparison` 的孤岛问题**，添加 meta.section
5. **从 headerNav 移除 UI、Roadmap、Community**
6. **修复 Roadmap 页面的死链接**（`/docs/` → 正确路径）

### P1 — 应做（内容清理）

7. **Blog ADR 去重**: 将 0001-0024 编号的博客标记为 ADR 重定向，或在博客列表中隐藏
8. **统一版本号引用**: 确认当前版本（v0.19.0 vs v0.18.0），全站统一
9. **删除 `/styling/web-awesome`** 页面（或合并入引擎 Design System 页面）
10. **Community 内容合并到页脚**，删除独立页面
11. **Roadmap 降级**: 从主导航移除，改为页脚链接
12. **Contributing 降级**: 从侧边栏移除，改为页脚链接
13. **Changelog 降级**: 从侧边栏移除，改为 Blog 子分类

### P2 — 可做（体验优化）

14. **首页注入搜索组件**
15. **Blog 添加分类标签系统**
16. **Changelog 自动从 git tags 生成**
17. **合并 `_hub-data-full.ts` 和 `_hub-data.ts`**
18. **zh 镜像页面内容质量审计**（确认翻译完整性）
19. **搜索索引更新**（删除废弃页面后重建）

---

## 六、技术实施要点

### 6.1 路由迁移策略

由于当前所有页面使用文件系统路由（`app/routes/` 目录结构即路由），需要：

1. 创建 `app/routes/engine/` 目录
2. 将引擎相关 `.ts` 文件从 `app/routes/guide/` 移至 `app/routes/engine/`
3. 添加 `app/routes/engine/_renderer.ts`（复制 guide 的 renderer）
4. 所有旧 URL 需要重定向（在 `404.ts` 或服务端配置中处理）

### 6.2 headerNav 配置变更

```typescript
// vite.config.ts 中 content.nav.headerNav 修改为：
headerNav: [
  { href: '/guide/positioning', label: 'Framework' },
  { href: '/engine/architecture', label: 'Engine' },
  { href: '/registry', label: 'RegistryHub' },
  { href: '/blog', label: 'Blog' },
],
```

### 6.3 meta.section 值统一

| 新 section 值 | 用途 | 页面 |
|---------------|------|------|
| `Quick Start` | 框架 → 快速开始 | positioning, getting-started |
| `Core` | 框架 → 核心功能 | routing, ssg, api, content-system, rpc |
| `Production` | 框架 → 生产就绪 | configuration, deployment, security-middleware, error-handling, testing, pwa |
| `Principles` | 引擎 → 核心原理 | architecture, dsd, islands, islands-deep, comparison |
| `Compatibility` | 引擎 → 兼容性 | package-compatibility, standards-registry |
| `Reference` | 引擎 → 参考 | reference/core, design-system |

### 6.4 重定向映射

| 旧 URL | 新 URL | 类型 |
|--------|--------|------|
| `/guide/architecture` | `/engine/architecture` | 301 |
| `/guide/dsd` | `/engine/dsd` | 301 |
| `/guide/islands` | `/engine/islands` | 301 |
| `/guide/islands-deep` | `/engine/islands-deep` | 301 |
| `/guide/package-compatibility` | `/engine/package-compatibility` | 301 |
| `/guide/standards-registry` | `/engine/standards-registry` | 301 |
| `/guide/comparison` | `/engine/comparison` | 301 |
| `/reference/core` | `/engine/reference/core` | 301 |
| `/ui` | `/engine/design-system` | 301 |
| `/styling/web-awesome` | `/engine/design-system` (或 410) | 301/410 |
| `/roadmap` | 保留 URL，从导航移除 | — |
| `/community` | 首页页脚 | 301 → `/` |
| `/contributing` | 首页页脚 | 301 → `/` |

---

## 七、Open Questions

1. **`/guide/` 还是 `/framework/`？** 当前所有框架文档在 `/guide/` 下。是否需要改为 `/framework/` 以与导航标签对齐？改动更大但更一致。建议保持 `/guide/` 不变，通过 meta.section 分组即可，避免大规模路由变更。

2. **引擎页面是否必须物理迁移到 `/engine/` 目录？** 也可以保持 `/guide/` 物理位置不变，仅通过 meta.section 重分组。但这样 URL 不变，与导航标签不一致。建议迁移，URL 是用户的心智模型。

3. **Decisions 页面的去留？** 24 个 ADR 页面与博客高度重复。方案 A：删除博客中的 ADR，只保留 `/decisions/`；方案 B：删除 `/decisions/` 路由，ADR 只在博客中展示。建议方案 A（保留独立的 Decisions 区域，博客中的 ADR 改为重定向）。

4. **zh 镜像是否需要同步重构？** zh 路由目前只有一个自定义页面（`zh/decisions/20260515-1-renderer-kernel-registry-sop.ts`），其余 zh 页面由 i18n 机制自动生成。重构后 zh 页面会自动跟随，但需要验证翻译内容更新。

5. **`_hub-data-full.ts` vs `_hub-data.ts`** 两个注册表数据文件的关系需要确认。如果 `_hub-data-full.ts` 是开发模式用的完整数据，`_hub-data.ts` 是生产精简版，则合并可能破坏开发体验。
