# LessJS v0.14.0

> 33 commits since v0.13 (a5ff77e → a04a7e5)

---

## 中文

### 架构

- **ESM-native SSG 管线**：Phase 3 改为纯 ESM 运行，不依赖 Vite。SSR bundle 自带 `importmap.json`，跨 runtime 解析 bare specifier。
- **Phase 重排**：构建顺序从 `Phase 1 → Phase 2 → Phase 3` 改为 `Phase 1 → Phase 3 → Phase 2 → Inject`。SSG 不再等待 client bundle。
- **共享 `ssg-render.ts`**：SSG 渲染管线抽成零 Vite 依赖的共享模块，`build-ssg.ts` 和 `cli/ssg.ts` 共用。
- **独立 SSG CLI**：`cli/ssg.ts` 可脱离 Vite 单独运行 Phase 3。
- **URLPattern**：`extractParams()` 用 WHATWG `URLPattern` 替代手写路由参数解析。
- **Phase 2 可选**：零 island 的项目跳过 client 打包。

### 官网 (lessjs.run)

- 首页 v5：交互终端、代码对比、性能基准、架构图、Bundle 对比、快速开始
- 品牌色系统：`#4752c4` 全站统一
- 移动端适配：760px / 480px 断点
- Cloudflare Pages 部署：`/api/term` 函数 + Hono
- 25 篇 ADR 从旧 `decisions/` 迁入 blog 管线
- 文档全面审计：API reference 重写、guide 页面修复、Cloudflare 部署指南
- 发布博文：v0.12.0、v0.13.0

### Bug 修复

- Prism CSS 404、counter hydration、重复渲染（DSD 模式）
- Cloudflare Functions CORS（OPTIONS 预检）
- Terminal island：从 light DOM 重构为 Shadow DOM + `DsdLitElement`
- Functions 目录：从 `src-tmp/` 移回仓库根目录

### 代码质量

- **统一版本号**：全部 10 个包统一为 `0.14.0`（之前碎片化在 `0.1.1`–`0.13.0`）
- **清理死代码**：删除 `constants.ts`（空文件）、`strategy-recommender.ts`（零引用）
- **`@lessjs/signals` 命名统一**：从 `@lessjs/signal` 改为 `@lessjs/signals`
- **`validateSafeUrl` 加固**：新增 `vbscript:` / `file:` 协议检测、URL 解码归一化、畸形编码检测
- **修复 publish 重复**：`publish.yml` 删除重复的 `@lessjs/adapter-vite` 条目
- **移除 `--allow-dirty`**：所有 publish task 不再使用 `--allow-dirty`
- **新增 `publish:dry-run`**：发布前预检
- **补充 `app/LICENSE`**：`@lessjs/app` 补全 MIT License
- **新增 SSG 测试**：`ssg-render.test.ts`（7用例） + `ssg-cli.test.ts`
- **修复导航链接**：`/guide/design-philosophy` → `/guide/architecture`
- **README 版本表更新**：全部 10 包版本更新为 `0.14.0`
- **CI lint 净化**：async lint、无用 import、process import 全部修掉
- **移除 `package.json`**：仓库不再包含 package.json（纯 Deno workspace）

---

## English

### Architecture

- **ESM-native SSG pipeline**: Phase 3 runs as pure ESM, Vite-independent. SSR bundle ships `importmap.json` for cross-runtime bare specifier resolution.
- **Phase reordering**: Build order changed from `Phase 1 → Phase 2 → Phase 3` to `Phase 1 → Phase 3 → Phase 2 → Inject`. SSG no longer waits for client bundle.
- **Shared `ssg-render.ts`**: SSG rendering pipeline extracted to a zero-Vite-dependency module shared by `build-ssg.ts` and standalone `cli/ssg.ts`.
- **Standalone SSG CLI**: `cli/ssg.ts` runs Phase 3 independently of Vite.
- **URLPattern**: `extractParams()` replaced hand-rolled route parsing with WHATWG `URLPattern`.
- **Optional Phase 2**: Client bundle is skipped for projects with zero islands.

### Website (lessjs.run)

- Homepage v5: interactive terminal island, code comparison, benchmarks, architecture diagram, bundle size comparison, quick start CTA
- Brand colour system: `#4752c4` unified across the site
- Mobile responsive: 760px / 480px breakpoints
- Cloudflare Pages deployment: `/api/term` function with Hono
- 25 ADRs migrated from `decisions/` directory into blog pipeline
- Full doc audit: API reference rewrite, guide page fixes, Cloudflare deployment guide
- Release blog posts: v0.12.0, v0.13.0

### Bug Fixes

- Prism CSS 404, counter hydration (removed random IDs), duplicate rendering (DSD pattern)
- Cloudflare Functions CORS (OPTIONS preflight)
- Terminal island: restructured from light DOM to Shadow DOM with `DsdLitElement`
- Functions directory: moved from `src-tmp/` to repo root

### Code Quality

- **Unified versioning**: All 10 packages unified to `0.14.0` (was fragmented across `0.1.1`–`0.13.0`).
- **Dead code removed**: `constants.ts` (empty), `strategy-recommender.ts` (zero references).
- **`@lessjs/signals` naming**: Standardised to `@lessjs/signals` (was `@lessjs/signal`).
- **`validateSafeUrl` hardened**: Added `vbscript:` / `file:` protocol checks, URL decode normalisation, malformed encoding detection.
- **Duplicate publish fixed**: `publish.yml` duplicate `@lessjs/adapter-vite` entry removed.
- **`--allow-dirty` removed**: All publish tasks no longer use `--allow-dirty`.
- **`publish:dry-run` added**: Pre-flight check for releases.
- **`app/LICENSE` added**: `@lessjs/app` now includes MIT License.
- **SSG tests added**: `ssg-render.test.ts` (7 cases) + `ssg-cli.test.ts`.
- **Navigation link fixed**: `/guide/design-philosophy` → `/guide/architecture`.
- **README version table**: All 10 package versions updated to `0.14.0`.
- **CI lint zeroed**: All lint errors fixed (async lint, unused imports, process import).
- **`package.json` removed**: No package.json files remain (pure Deno workspace).
