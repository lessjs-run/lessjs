# LessJS 全盘审查报告

> **审查日期**: 2026-05-10 | **审查范围**: packages/ + docs/ 全量代码 + docs→www 重命名影响

---

## 一、代码审查发现

### 1.1 已修复的过时注释/文档

| # | 文件 | 问题 | 修复 |
|---|------|------|------|
| F1 | `content/nav/index.ts` | 注释声称 "Produces .less/nav-data.json" | 改为 "Data stored in ctx.navSections + virtual:less-nav" |
| F2 | `content/nav/scanner.ts` | 注释声称 "produces .less/nav-data.json" | 改为 "data stored in ctx.navSections (ADR 0010: no .less/ temp files)" |
| F3 | `content/index.ts:99` | 注释 "(or fallback to .less/ for backward compat)" — 实际代码**无 fallback** | 改为 "ADR 0010: ctx replaces .less/ temp files" |
| F4 | `core/entry-renderer.ts:186` | 注释声称 "headExtras is read from .less/head-extras.html at runtime" — 实际已用 `__LESS_HEAD_EXTRAS__` define 注入 | 更新为 "headExtras is injected via Vite define (ADR 0008 Phase A)" |
| F5 | `docs/guide/architecture.ts` | 两处 "emit .less/build-metadata.json" + "generate .less-client-entry.ts" | 改为 "store build metadata in ctx" + "generate virtual:less-client-entry" |
| F6 | `docs/guide/ssg.ts` | 中英文两处 ".less/build-metadata.json" | 改为 "build metadata 存入 ctx" / "stored in ctx" |
| F7 | `docs/changelog.ts` | ".less/sitemap-options.json" | 改为 "ctx.sitemapOptions" |

### 1.2 清理的构建残留

| # | 路径 | 大小 | 说明 |
|---|------|------|------|
| C1 | `docs/.less/` | ~16KB | 包含 blog-options.json、nav-data.json 等旧 IPC 文件。`.less/` 已在 .gitignore，本次清除本地残留 |
| C2 | `docs/dist/` | 5.9MB | SSG 构建产物。已在 .gitignore，本次清除本地残留 |

### 1.3 已确认无问题的项

| 检查项 | 结果 |
|--------|------|
| **kiss→less 残留命名** | packages/ 源码中零残留。docs/ 中仅在 changelog 历史记录出现（合理） |
| **TODO/FIXME/HACK** | 零发现 |
| **@deprecated 标记** | 零发现 |
| **globalThis 桥接引用** | 已在上一轮审计中清理完毕。剩余 globalThis 引用均为合法用途（DOM API、setTimeout、customElements 等） |
| **.less/ 文件写入** | 代码中不再写入 .less/ 目录。所有 .less/ 引用仅存在于注释中（已修复） |

### 1.4 已知设计问题（不修，记录备查）

| # | 严重度 | 问题 | 说明 |
|---|--------|------|------|
| D1 | 低 | `runtime-shim.ts` 含 `export { Hono } from 'hono'` | 与 `less-runtime.ts` 注释 "Hono is NOT re-exported here" 矛盾。但 runtime-shim 是自动生成的客户端 shim，Hono 导出可能被客户端 entry 使用。建议更新 less-runtime.ts 注释为 "Hono is NOT re-exported from the SSR-side less-runtime" |
| D2 | 低 | `types.ts` 和 `index.ts` 双重导出 `registerAdapter`/`getAdapter` | `types.ts:302` 和 `index.ts` 都 re-export `registerAdapter`/`getAdapter`。`types.ts` 本应是纯类型文件但混入了值导出。不影响功能，但违反单一导出路径原则 |
| D3 | 低 | `ssg-postprocess.ts` 中 `console.log/warn/error` 直接使用 | 未走 `createLogger`，但这是 CLI 工具代码（构建后输出表格），不是框架运行时，可以接受 |
| D4 | 低 | `create/cli.ts` 中 `.less/` 出现在 `.gitignore` 模板 | 这是脚手架模板，新项目的 .gitignore 需要忽略 .less/ 目录。保留合理 |
| D5 | 信息 | `build-ssg.ts` 886 行 | 单文件过大，建议未来拆分为 ssg-entry.ts + ssg-render.ts + ssg-postprocess-runner.ts |

---

## 二、docs → www 重命名影响分析

### 2.1 需要修改的文件清单

#### 核心配置（必改）

| 文件 | 涉及内容 |
|------|---------|
| `deno.json` | `tasks.dev`、`tasks.build`、`tasks.preview`、`tasks.clean` 中 `docs` → `www` |
| `.gitignore` | `docs/vite-build-*.txt` → `www/vite-build-*.txt` |
| `docs/vite.config.ts` → `www/vite.config.ts` | 文件本身重命名 |
| `docs/CNAME` → `www/CNAME` | 文件本身重命名 |
| `docs/package.json` → `www/package.json` | 文件本身重命名 |
| `docs/public/` → `www/public/` | 整个目录重命名 |
| `docs/content/` → `www/content/` | 整个目录重命名 |
| `docs/app/` → `www/app/` | 整个目录重命名 |
| `docs/e2e/` → `www/e2e/` | 整个目录重命名 |
| `docs/decisions/` → `www/decisions/` | 整个目录重命名 |

#### CI/CD 工作流（必改）

| 文件 | 涉及内容 |
|------|---------|
| `.github/workflows/lint.yml` | 注释中 `docs/` 引用（2 处 TODO） |
| `.github/workflows/test.yml` | `build-docs` job 中 `deno task build:docs`（间接通过 deno.json） |

#### 文档站内部引用（必改）

| 文件 | 内容 |
|------|------|
| `www/app/routes/guide/_renderer.ts` | `GITHUB_EDIT_BASE` 含 `docs/app/routes` |
| `www/app/components/decision-document-page.ts` | `docs/decisions/${decision.id}` |
| `www/app/routes/decisions/index.ts` | `docs/decisions` |
| `www/app/routes/changelog.ts` | 多处 `docs/` 路径引用 |
| `www/app/routes/contributing.ts` | `docs` 关键词 |

#### 包代码中的注释（可选改）

| 文件 | 内容 |
|------|------|
| `packages/content/sitemap/generator.ts:95` | 注释 `e.g., 'docs/dist'` → `'www/dist'` |

### 2.2 影响统计

| 类别 | 数量 |
|------|------|
| 目录重命名 | 1 (`docs/` → `www/`) |
| deno.json 任务改动 | 4 |
| CI 工作流改动 | 2 |
| 文档站源码改动 | ~5 |
| 包代码注释改动 | 1 |
| .gitignore 改动 | 1 |

### 2.3 风险评估

| 风险 | 等级 | 说明 |
|------|------|------|
| 构建脚本断裂 | **中** | deno.json 中所有 `docs` 路径需一次性改完，否则 `deno task dev/build/preview` 失败 |
| Git 历史断裂 | **低** | `git log --follow` 可跟踪，但 diff 会变大 |
| 外部链接失效 | **低** | GitHub 上 README 等如有 `docs/` 相对路径会失效，但本项目无此情况 |
| 搜索引擎影响 | **无** | lessjs.org 是部署产物路径，不受源码目录名影响 |

### 2.4 建议

**推荐执行 `docs/` → `www/` 重命名**。理由：
1. `www/` 更准确地表达了"这是 LessJS 框架的官网"而非"这是文档"
2. 与 Astro (`www/`)、Next.js (`www/`) 等框架项目惯例一致
3. 本项目 `www/` 不只是文档，还包含博客、社区、演示等完整网站功能
4. 改动量可控（~12 个文件），一次性可完成

---

## 三、审查执行记录

- 已修复 7 处过时注释（F1-F7）
- 已清理 2 个构建残留目录（C1-C2）
- 已通过 `deno check` 验证所有修改
- 记录 5 个设计问题（D1-D5，不影响功能）
- 完成 docs→www 重命名影响分析

---

*报告由齐活林（Qi）· 交付总监 生成*
