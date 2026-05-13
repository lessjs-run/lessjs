# LessJS 产品维度审核报告

**审核日期**: 2026-05-14
**审核范围**: 项目定位与差异化、文档质量、开源合规性、用户体验、版本管理
**整体评分**: B

---

## 评分概览

| 审核项 | 评分 | 说明 |
|--------|------|------|
| 项目定位与差异化 | A- | 定位清晰，差异化显著，竞品分析诚实 |
| 文档质量 | B | 包级文档优秀，入门体验尚可，存在信息不一致 |
| 开源合规性 | C+ | LICENSE 基本完备，但缺失关键社区治理文件 |
| 用户体验 | B- | 脚手架简洁，但错误提示和引导不足 |
| 版本管理 | C+ | 统一版本号有逻辑，但发布流程和 README 存在严重不一致 |

---

## 1. 项目定位与差异化 — A-

### 1.1 核心价值主张

LessJS 的三大支柱定位清晰且自洽：

1. **Deno-first**：与 Fresh 形成直接竞争，但以 Web Components 替代 Preact/JSX，差异化路径明确
2. **DSD + Island**：以 Declarative Shadow DOM 实现零 JS 首屏，Island 架构渐进增强，与 Astro 的 0 KB JS 理念相近但技术栈完全不同
3. **HTML 先于 JavaScript 存在**：不是"SSR 也支持 DSD"，而是 DSD 是渲染管线的根本，这是与所有竞品的核心区分

### 1.2 竞品对比

项目提供了翔实的竞品对比页面（`www/app/routes/guide/comparison.ts`），涵盖 LessJS / Astro / Fresh / Next.js 的 12 个维度，且诚实标注了自身局限：

- 明确承认 Ecosystem 为 "Emerging"
- 明确标注 SSR (request-time) 为 "No (by design)"
- 明确标注 Package Registry 为 "JSR only"

定位页面（`www/app/routes/guide/positioning.ts`）列出了 5 条设计原则和 3 个工程取舍，不仅写优势也写代价，这在开源项目中属于较高水平。

### 1.3 差异化评估

**优势**：
- Deno + DSD + Island 的组合目前无直接竞品（Fresh 用 Preact，Astro 用 .astro 语法）
- "Islands Are Upgrades, Not Hydration" 的理念有说服力
- Framework-agnostic core（Lit 是 adapter 不是依赖）架构前瞻

**风险**：
- JSR-only 分发限制了 npm 用户触达
- DSD 浏览器兼容性要求（Chrome 90+、Safari 16.4+、Firefox 123+）排除了部分场景
- 对 Lit 的实际依赖较重（adapter-lit + ui 均基于 Lit），"pluggable" 声明与实际有距离

---

## 2. 文档质量 — B

### 2.1 README

**根目录 README** (`README.md` + `README.en.md`)：
- 双语（中英）支持，覆盖良好
- 架构图 ASCII 清晰，包版本表、渲染管线、SSG 构建管线描述完整
- Quick Start 3 步即可上手，门槛低

**严重问题**：
- **README 版本表与实际版本严重不一致**：README 中记录的是旧版本（core 0.13.0、adapter-vite 0.3.0 等），实际各包均已升至 0.14.0（见下方版本管理章节）
- **README 标题 "从 v0.12 到 v0.13 的变化" 已过时**：当前版本已到 0.14.0，该章节应更新或移除
- ADR 链接 `/blog/` 是相对路径，在 GitHub 上无法直接点击跳转

### 2.2 包级文档

所有 10 个包均有 README，且质量较高：

| 包 | 评价 | 备注 |
|---|---|---|
| @lessjs/core | 优秀 | 导出路径、API 示例、渲染模型完整 |
| @lessjs/adapter-vite | 优秀 | 插件表、配置选项表、SSG 三阶段说明清晰 |
| @lessjs/adapter-lit | 良好 | DSD Hydration Mixin 用法完整 |
| @lessjs/content | 良好 | 推荐用法 + 独立用法双路径 |
| @lessjs/i18n | 良好 | 与 app 集成和独立使用都有说明 |
| @lessjs/app | 良好 | 伞包用法、选项表完整 |
| @lessjs/ui | 良好 | 8 个组件清单 + 设计令牌说明 |
| @lessjs/signal | 一般 | API 示例完整但缺少高级用法（如 islandEffect 生命周期） |
| @lessjs/rpc | 良好 | 用法 + 重试配置 + 失败数据流完整 |
| @lessjs/create | 良好 | 项目结构 + 添加 Islands/API 路由说明 |

### 2.3 文档站点

文档站点（`www/`）路由结构丰富：

- **Guide**：18 个指南页面（positioning、getting-started、architecture、routing、islands、ssg、dsd、api、rpc、i18n、pwa、deployment 等）
- **Reference**：core API 参考页面
- **Blog**：41 篇文章（含 ADR、版本发布、设计评审等）
- **Community**：GitHub / Issues / JSR / Discussions 链接
- **Contributing**：开发环境设置 + 发布流程

**问题列表**：

| # | 问题 | 文件路径 | 严重度 |
|---|------|----------|--------|
| D1 | Getting Started 没有说明 `deno install` 步骤，新用户可能卡在依赖安装 | `www/app/routes/guide/getting-started.ts` | 中 |
| D2 | API 文档页面内容较薄，缺少完整的 API 参考表 | `www/app/routes/guide/api.ts` | 中 |
| D3 | Comparison 页面没有 SvelteKit 对比（README 中提到了但文档站未覆盖） | `www/app/routes/guide/comparison.ts` | 低 |
| D4 | 文档站中部分页面无英文版本（如 comparison 只有英文） | 多处 | 低 |
| D5 | 无搜索功能说明，大量文档内容难以快速定位 | www 全局 | 中 |
| D6 | `guide/design-philosophy` 在导航中链接但路由文件不存在 | `getting-started.ts` 第 137/251 行引用 | 高 |

### 2.4 Getting Started 体验评估

3 步上手流程（create → dev → build）简洁有效。但存在以下不足：

1. 脚手架无交互式选项（不选择模板、不选择 TS/JS），虽符合 KISS 原则但降低了发现性
2. 没有说明创建后的下一步引导（如"添加你的第一个 Island"）
3. 缺少从零手动配置的指南（不使用 create 脚手架时如何搭建项目）

---

## 3. 开源合规性 — C+

### 3.1 LICENSE

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 根目录 LICENSE | ✅ MIT | `Copyright (c) 2026 Zhi` |
| @lessjs/core LICENSE | ✅ MIT | 与根目录一致 |
| @lessjs/adapter-vite LICENSE | ✅ MIT | 与根目录一致 |
| @lessjs/adapter-lit LICENSE | ✅ MIT | 与根目录一致 |
| @lessjs/content LICENSE | ✅ MIT | 与根目录一致 |
| @lessjs/i18n LICENSE | ✅ MIT | 与根目录一致 |
| @lessjs/app LICENSE | ❌ 缺失 | `packages/app/` 目录下无 LICENSE 文件 |
| @lessjs/ui LICENSE | ✅ MIT | 与根目录一致 |
| @lessjs/signal LICENSE | ✅ MIT | 与根目录一致 |
| @lessjs/rpc LICENSE | ✅ MIT | 与根目录一致 |
| @lessjs/create LICENSE | ✅ MIT | 与根目录一致 |

**关键问题**：`@lessjs/app` 缺少 LICENSE 文件。该包的 `deno.json` 中 `publish.include` 声明了 `["src/**", "deno.json", "LICENSE"]`，但实际文件不存在，可能导致 JSR 发布包含空 LICENSE 或发布失败。

### 3.2 缺失的社区治理文件

| 文件 | 状态 | 影响 |
|------|------|------|
| CODE_OF_CONDUCT.md | ❌ 缺失 | 开源项目标准实践，保护社区健康发展 |
| CONTRIBUTING.md（根目录） | ❌ 缺失 | 虽有文档站 contributing 页面，但根目录无文件，GitHub 上贡献者无法直接看到 |
| SECURITY.md | ❌ 缺失 | 安全漏洞报告渠道不明确 |
| CHANGELOG.md | ❌ 缺失 | 无集中变更日志，版本变更分散在 blog 中 |

### 3.3 依赖许可证兼容性

主依赖许可证情况：

| 依赖 | 许可证 | 与 MIT 兼容 |
|------|--------|------------|
| lit | BSD-3-Clause | ✅ |
| parse5 | MIT | ✅ |
| hono | MIT | ✅ |
| vite | MIT | ✅ |
| esbuild | MIT | ✅ |
| marked | MIT | ✅ |
| gray-matter | MIT | ✅ |

所有依赖均与 MIT 兼容，无合规风险。

### 3.4 .github 目录

仅包含 `workflows/` 子目录（5 个 CI/CD workflow），缺少：
- `ISSUE_TEMPLATE/` — Issue 模板
- `PULL_REQUEST_TEMPLATE.md` — PR 模板
- `FUNDING.yml` — 赞助信息
- `CODEOWNERS` — 代码所有权

---

## 4. 用户体验 — B-

### 4.1 脚手架体验 (`@lessjs/create`)

**优点**：
- 一行命令 `deno run -A jsr:@lessjs/create my-app` 极简
- 本地/JSR 远程双模式版本解析（ADR 0016），用户无需关心版本号
- 路径安全检查（拒绝在当前目录外创建项目）
- 目录已存在检查

**问题列表**：

| # | 问题 | 文件路径 | 严重度 |
|---|------|----------|--------|
| UX1 | 无交互式选项：无法选择是否包含 blog/i18n，模板固定 | `packages/create/cli.ts` | 中 |
| UX2 | 生成的 `vite.config.ts` 包含硬编码的 JSR URL alias（lessUiAliases），对新手困惑 | `packages/create/cli.ts:153-166` | 高 |
| UX3 | 无 `deno install` 后续步骤提示，新项目可能缺少 node_modules | `packages/create/cli.ts:305-308` | 中 |
| UX4 | 生成模板没有 `content/blog/` 目录，但 vite.config.ts 配置了 blog contentDir | `packages/create/cli.ts` | 中 |
| UX5 | 错误提示为纯 console.error，无颜色高亮 | `packages/create/cli.ts:260-261` | 低 |

### 4.2 开发命令体验

| 命令 | 评价 |
|------|------|
| `deno task dev` | 清晰，默认 5173 端口，HMR 正常 |
| `deno task build` | 三阶段 SSG 构建，无进度指示 |
| `deno task preview` | 生产构建预览 |
| `deno task test` | 标准 Deno test 命令 |

**问题**：
- 构建过程无进度条或阶段提示，用户在 3 阶段 SSG 过程中可能误以为卡住
- `deno task build:docs` 与 `deno task build` 等价但命名不一致（docs vs 主项目）

### 4.3 错误信息质量

**优点**：
- 自定义错误类 `LessError` / `SsrRenderError` 提供结构化错误码和 HTTP 状态码
- `toJSON()` 方法便于 API 层消费
- Phase 校验错误明确（"Phase 2 called before Phase 1 completed"）
- JSR fetch 错误包含 URL 和原始错误信息

**问题**：

| # | 问题 | 文件路径 | 严重度 |
|---|------|----------|--------|
| UX6 | 部分错误使用 `throw new Error()` 而非 `LessError`，缺少 code 和 statusCode | `adapter-vite/src/build-context.ts:161,171` | 中 |
| UX7 | SSG 构建失败的错误信息 `Build failed:` 过于简略 | `adapter-vite/src/cli/build.ts:18` | 中 |
| UX8 | SSR bundle 未找到错误未提示可能的修复方法 | `adapter-vite/src/cli/ssg.ts:59` | 低 |
| UX9 | 自定义元素标签缺少连字符的错误信息良好，但其他路由错误缺少修复提示 | `adapter-vite/src/entry-renderer.ts:373` | 低 |

---

## 5. 版本管理 — C+

### 5.1 版本号现状

**当前实际版本**：所有 10 个包均为 `0.14.0`（统一版本号策略）

**README 中记录的版本**（严重过时）：

| 包 | README 版本 | 实际版本 | 偏差 |
|---|------------|---------|------|
| @lessjs/core | 0.13.0 | 0.14.0 | 1 minor |
| @lessjs/adapter-vite | 0.3.0 | 0.14.0 | 11 minor |
| @lessjs/adapter-lit | 0.8.0 | 0.14.0 | 6 minor |
| @lessjs/content | 0.3.3 | 0.14.0 | 11 minor |
| @lessjs/i18n | 0.1.1 | 0.14.0 | 13 minor |
| @lessjs/app | 0.3.1 | 0.14.0 | 11 minor |
| @lessjs/ui | 0.7.1 | 0.14.0 | 7 minor |
| @lessjs/signals | 0.6.2 | 0.14.0 | 8 minor |
| @lessjs/rpc | 0.6.1 | 0.14.0 | 8 minor |
| @lessjs/create | 0.7.0 | 0.14.0 | 7 minor |

这是一个严重的文档一致性问题。README 中的版本表完全过时，会误导用户。

### 5.2 统一版本号策略评估

从 0.14.0 开始，所有包采用统一版本号。这是 monorepo 常见做法（如 Angular、Babel），优缺点：

**优点**：
- 简化发布协调，避免版本矩阵问题
- `deno task publish` 一键发布所有包
- 用户无需关心包间版本兼容性

**缺点**：
- 每次发布即使只改一个包也要升全部版本号
- 语义化版本对单个包失去精确含义
- JSR 上的版本跳跃可能让用户困惑

### 5.3 发布流程评估

**CI/CD**：
- `publish.yml`：自动检测 JSR 是否已存在对应版本，存在则跳过，不存在则发布
- `publish-manual.yml`：手动发布入口
- `test.yml`：发布前自动跑测试

**问题列表**：

| # | 问题 | 文件路径 | 严重度 |
|---|------|----------|--------|
| V1 | publish.yml 中 @lessjs/adapter-vite 出现两次（第 63 和 66 行），重复发布 | `.github/workflows/publish.yml:63,66` | 高 |
| V2 | `deno task publish` 使用 `--allow-dirty`，可能发布包含未提交更改的包 | `deno.json:41-49` | 中 |
| V3 | 无 `changeset` 或类似的变更日志自动生成工具 | 全局 | 中 |
| V4 | 无 `deno task publish:dry-run` 预检命令 | `deno.json` | 低 |
| V5 | `publish:signal` task 名与包名 `@lessjs/signal` 一致，但 README 和架构图使用 `@lessjs/signals`（复数），命名不一致 | `deno.json:45` vs `README.md:47` | 高 |

### 5.4 包命名不一致

| 位置 | 名称 |
|------|------|
| `packages/signals/deno.json` | `@lessjs/signal`（单数） |
| README.md 架构图和版本表 | `@lessjs/signals`（复数） |
| `deno.json` publish task | `publish:signal`（单数） |
| `@lessjs/create` 生成的 deno.json | `@lessjs/signal`（单数） |
| README.en.md | `@lessjs/signals`（复数） |

JSR 发布名为 `@lessjs/signal`，但文档中统称 `@lessjs/signals`。这会导致用户搜索不到包或导入了错误的包名。

---

## 改进建议（按优先级排序）

### P0 — 必须修复

1. **更新 README 版本表**：将 `README.md` 和 `README.en.md` 中的版本号更新为 0.14.0，或改为动态引用（考虑从 deno.json 读取）
   - 文件：`README.md:39-49`、`README.en.md:39-49`

2. **修复 publish.yml 重复发布**：删除第 66 行重复的 `@lessjs/adapter-vite` 发布
   - 文件：`.github/workflows/publish.yml:66`

3. **补充 @lessjs/app LICENSE 文件**：创建与根目录一致的 MIT LICENSE
   - 文件：`packages/app/LICENSE`（需新建）

4. **统一 signal/signals 命名**：选择一种命名并在所有位置保持一致
   - 涉及：`README.md`、`README.en.md`、`packages/signals/deno.json`

### P1 — 应当修复

5. **添加 CODE_OF_CONDUCT.md**：采用 Contributor Covenant 或其他标准行为准则
6. **添加 CONTRIBUTING.md 到根目录**：将文档站的贡献指南内容同步到根目录文件
7. **更新或移除 README 中的 "从 v0.12 到 v0.13 的变化" 章节**：当前版本为 0.14.0
8. **修复 guide/design-philosophy 路由缺失**：getting-started 页面导航链接指向不存在的页面
   - 文件：`www/app/routes/guide/getting-started.ts:137,251`
9. **简化 create 脚手架生成的 vite.config.ts**：移除硬编码 JSR URL alias，考虑自动解析
   - 文件：`packages/create/cli.ts:153-166`
10. **添加构建进度指示**：在 SSG 三阶段构建中输出阶段标识

### P2 — 建议改进

11. **添加 SECURITY.md**：说明安全漏洞报告流程
12. **添加 GitHub Issue/PR 模板**：降低贡献门槛
13. **为脚手架添加交互式选项**：是否包含 blog、i18n、选择默认 UI 库等
14. **改进 SSG 错误信息**：提供修复建议而非仅报错
15. **添加 `deno task publish:dry-run`**：发布前预检
16. **添加 Changeset 工具**：自动化变更日志生成
17. **文档站添加搜索功能**：大量内容难以导航
18. **Comparison 页面增加 SvelteKit 行**：README 中提及但文档站未覆盖
19. **统一 `deno task build:docs` 命名**：与 `deno task build` 消除歧义

---

## 总结

LessJS 在项目定位和架构理念上表现出色——DSD + Island 的差异化路径清晰，竞品分析诚实，设计原则有深度。包级文档覆盖全面，文档站内容丰富（41 篇 blog + 18 个 guide 页面）。

主要短板集中在**工程治理**层面：README 版本信息严重过时、@lessjs/app 缺失 LICENSE、signal/signals 命名不一致、publish.yml 重复发布等问题直接影响用户信任。开源社区治理文件（CODE_OF_CONDUCT、CONTRIBUTING、SECURITY）全部缺失，对于一个已发布到 0.14.0 的框架来说不够成熟。

用户体验方面，3 步上手的门槛很低，但脚手架生成的配置文件包含大量硬编码 JSR URL，对新用户理解造成障碍。构建过程缺少进度指示，错误信息的可操作性有待提升。

建议优先修复 P0 级问题（版本不一致、LICENSE 缺失、重复发布、命名不一致），这些直接影响项目可信度和用户首次使用体验。
