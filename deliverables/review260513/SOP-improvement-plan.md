# LessJS SOP Improvement Plan

> 基于 2026-05-13 全团队审计（产品/架构/工程/QA）的综合 SOP 改进计划
>
> 来源：`review260513/` — 5 份审计报告

---

## SOP 1: Release Workflow

### 问题
- `publish.yml` 中 `@lessjs/adapter-vite` 出现两次（重复发布）
- `deno task publish` 使用 `--allow-dirty`（可能发布未提交更改）
- 无 `publish:dry-run` 预检
- README 版本表发布后未同步更新

### 新 SOP
```
1. Pre-release
   a. 运行 deno task publish:dry-run (新增) — 预检版本号和发布配置
   b. 确认 git status 干净 (不允许 --allow-dirty)
   c. 更新 README.md + README.en.md 的版本表

2. Release
   a. 创建 git tag v0.x.0
   b. 合并到 main
   c. CI 自动触发 publish.yml (修复 adapter-vite 重复)

3. Post-release
   a. 在 blog/ 创建发布说明博文
   b. 更新 CHANGELOG (新增 CHANGELOG.md 文件)
```

### 文件变更
| 文件 | 变更 |
|------|------|
| `.github/workflows/publish.yml:66` | 删除重复的 `@lessjs/adapter-vite` |
| `deno.json` | 移除 `--allow-dirty`，添加 `publish:dry-run` task |
| 根目录 `CHANGELOG.md` | 新建（集中变更日志，替代分散 blog 记录） |
| `README.md` `README.en.md` | 版本表改为：`<version-from-denojson>` 动态标记 |
| `.github/workflows/publish.yml` | 添加 `git status --porcelain` 预检 |

---

## SOP 2: Code Cleanup Cadence

### 问题
- `core/src/constants.ts` 为空文件
- `core/src/strategy-recommender.ts` 零引用 → 死代码
- `rpc` 包无 src 导出函数
- `signals` 包命名不一致（`@lessjs/signal` vs `@lessjs/signals`）
- `html-escape.ts` 中 `wrapInDocument` 和 `renderSsrError` 部分重复

### 新 SOP
每 v0.x.0 发布前执行：
```
1. Scan dead exports
   find packages/ -name "*.ts" | xargs grep -l "^export" | check usage

2. Delete empty files
   - Check for files with only comments (constants.ts)

3. Check unused code
   - grep for exported symbols, confirm at least one import exists

4. Verify package exports
   - Every package/src/ must have at least one non-index.ts file with code
```

### 文件变更
| 文件 | 变更 |
|------|------|
| `packages/core/src/constants.ts` | 删除文件 |
| `packages/core/deno.json` | 删除 `./constants` 导出路径 |
| `packages/core/src/strategy-recommender.ts` | 删除或添加 `@deprecated` / TODO 标记 |
| `packages/signals/deno.json` | 发布名统一为 `@lessjs/signals` |
| `packages/core/src/html-escape.ts` | 合并 `wrapInDocument` 和 `renderSsrError` |

---

## SOP 3: Test Coverage Minimum

### 问题
| 包 | 源文件 | 测试文件 | 覆盖率 |
|---|--------|---------|--------|
| content | 11 | 4 | 36% |
| i18n | 5 | 1 | 20% |
| ui | 15 | 2 | 13% |
| ssg-render.ts | NEW | 0 | 0% |
| ssg.ts (CLI) | NEW | 0 | 0% |

### 新 SOP
```
覆盖标准：
  P0 包 (core, adapter-vite, adapter-lit): ≥60% 源文件有测试
  P1 包 (content, i18n, ui, signals): ≥40%
  P2 包 (app, create, rpc): ≥30%

新增文件必须有对应测试：
  cli/ssg-render.ts → __tests__/ssg-render.test.ts
  cli/ssg.ts → __tests__/ssg-cli.test.ts

测试运行：
  每次 push 前: deno test packages/$changed_pkg/
  CI: deno test packages/ 必须全部通过
```

### 文件变更
| 新文件 | 测试内容 |
|--------|---------|
| `packages/adapter-vite/__tests__/ssg-render.test.ts` | ssgRender() 单元测试（mock SSR bundle）|
| `packages/adapter-vite/__tests__/ssg-cli.test.ts` | CLI 参数解析 + 加载错误处理 |
| `packages/content/__tests__/blog-data.test.ts` | loadBlogData + markdown 解析 |
| `packages/content/__tests__/nav-scanner.test.ts` | scanNavData + extractMeta |
| `packages/i18n/__tests__/i18n-routes.test.ts` | i18nStaticPaths + switchLocale |
| `packages/ui/__tests__/components.test.ts` | 组件渲染快照测试 |

---

## SOP 4: Open Source Governance

### 问题
- `@lessjs/app` 缺失 LICENSE 文件
- 无 CODE_OF_CONDUCT.md
- 根目录无 CONTRIBUTING.md
- 无 SECURITY.md
- 无 CHANGELOG.md
- 无 Issue/PR 模板
- 无 FUNDING.yml

### 新 SOP
```
所有 MIT 项目在 v1.0.0 前必须具备：

必需 (发布前检查):
  ├── LICENSE (每个发布到 JSR 的包)
  ├── CODE_OF_CONDUCT.md
  └── CONTRIBUTING.md (根目录，与文档站同步)

推荐:
  ├── SECURITY.md
  ├── CHANGELOG.md
  ├── .github/ISSUE_TEMPLATE/
  ├── .github/PULL_REQUEST_TEMPLATE.md
  └── .github/FUNDING.yml
```

### 文件变更
| 文件 | 动作 |
|------|------|
| `packages/app/LICENSE` | 新建（复制根目录 MIT LICENSE）|
| `CODE_OF_CONDUCT.md` | 新建（Contributor Covenant v2.1）|
| `CONTRIBUTING.md` | 新建（从文档站 contributing 页面同步内容）|
| `SECURITY.md` | 新建（安全漏洞报告流程）|
| `CHANGELOG.md` | 新建（从 blog 发布说明聚合）|
| `.github/ISSUE_TEMPLATE/bug_report.md` | 新建 |
| `.github/ISSUE_TEMPLATE/feature_request.md` | 新建 |
| `.github/PULL_REQUEST_TEMPLATE.md` | 新建 |
| `.github/FUNDING.yml` | 新建 |

---

## SOP 5: Documentation Sync

### 问题
- README 版本表过时（与 `deno.json` 版本号脱节）
- README "从 v0.12 到 v0.13 的变化" 已过时
- ADR 链接 `/blog/` 在 GitHub 上不可点击
- `guide/design-philosophy` 导航链接不存在（getting-started.ts:137,251）
- 脚手架生成的 vite.config.ts 含硬编码 JSR URL
- Getting Started 无 `deno install` 步骤

### 新 SOP
```
发布时自动检查：
  1. README.md 版本表 = packages/core/deno.json 的 version
  2. README 中的 "变化" 章节更新到当前版本
  3. ADR 链接使用绝对 URL (https://lessjs.run/blog/...)
  4. 导航链接全部有效（deno check www/app/routes/）

文档质量门槛：
  - 所有路由链接有效（无 404）
  - 脚手架生成的配置文件无硬编码版本号
  - 包级 README 的 API 示例可编译通过
```

### 文件变更
| 文件 | 变更 |
|------|------|
| `README.md` | 版本表改为自动生成；更新变化章节 |
| `README.en.md` | 同上 |
| `www/app/routes/guide/getting-started.ts:137,251` | 修复/删除 design-philosophy 导航链接 |
| `packages/create/cli.ts:153-166` | 移除硬编码 JSR URL alias |
| `packages/create/cli.ts` | 添加 `deno install` 步骤提示 |

---

## SOP 6: Architecture Hygiene

### 问题
- `headExtras` / `inject.headFragments` 无 HTML 消毒（MAJ-1）
- `constants.ts` 空文件（MIN-1）
- `strategy-recommender.ts` 死代码（MIN-2）
- `DsdComponent` 索引签名过宽（MIN-3）
- `LessMiddleware` 使用 `any`（MIN-4）
- `dispatchDataPlugin` 使用 `(fn as any)`（MIN-5）
- `validateSafeUrl` 仅检查 javascript: 和 data:（MIN-9）
- `signal` vs `signals` 命名不一致

### 新 SOP
每个里程碑前执行的架构清理清单：
```
□ 扫描所有空文件（仅有注释无代码）
□ 扫描死导出（export 但无 import）
□ 审计所有 `any` 类型，确认有 `deno-lint-ignore` 注释
□ 审计所有显式不安全操作（@dangerous、innerHTML）
□ 运行 deno lint packages/ — 0 error
□ 运行 deno check packages/*/ — 所有包通过
```

---

## Implementation Priority

| Priority | SOP | 工作量 | 影响 |
|----------|-----|--------|------|
| **P0** | SOP-1 Release (publish fix + dry-run) | 1d | 直接防止发布错误 |
| **P0** | SOP-4 License + governance files | 0.5d | 开源合规性 |
| **P0** | SOP-2 constants.ts + dead code | 0.5d | 代码整洁 |
| **P1** | SOP-3 Test coverage (ssg-render + ssg-cli) | 1.5d | CI 质量 |
| **P1** | SOP-5 Doc sync (README, nav link, scaffold) | 1d | 用户体验 |
| **P1** | SOP-6 Architecture hygiene (security, types) | 1d | 架构健康 |
| **P2** | SOP-3 Content/i18n/ui test coverage | 2d | 测试覆盖 |
| **P2** | SOP-4 Issue/PR templates + FUNDING | 0.5d | 社区治理 |
| **P2** | SOP-6 signal/signals naming consistency | 0.5d | 命名规范 |

**Total P0**: 2d — 发布前必须完成  
**Total P0+P1**: 5.5d — 建议 v0.14.1 前完成  
**Total P0+P1+P2**: 8.5d — 建议 v0.15.0 前完成
