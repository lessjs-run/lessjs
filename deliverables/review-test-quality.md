# LessJS 测试质量审查报告

> 审查日期：2026-05-12 | 审查人：严过关（QA 工程师）

---

## 一、总体评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 测试覆盖广度 | ⭐⭐⭐⭐ | 10 个包中有 8 个有充足的单元测试，1 个基本覆盖 |
| 测试深度 | ⭐⭐⭐⭐ | 边界用例覆盖良好，包含错误路径、异常场景 |
| 测试基础设施 | ⭐⭐⭐⭐⭐ | CI 完整（10 个并行 job + E2E + 构建验证） |
| E2E 测试 | ⭐⭐⭐⭐ | 9 个 spec 文件覆盖核心用户场景 |
| 测试可维护性 | ⭐⭐⭐⭐ | 代码清晰，命名规范，mock 策略合理 |

**综合评级：B+（良好）** — 测试生态相对完整，但存在部分包无测试和有限的覆盖率量化。

---

## 二、各包测试质量详细分析

### 2.1 @lessjs/core — ⭐⭐⭐⭐⭐（优秀）

**测试文件**（6 个）：
- `render-dsd.test.ts` — 核心 DSD 渲染（含 escape 函数、DSD 选项、adapter protocol、错误处理、边界场景）
- `ssr-handler.test.ts`（已合并到 `render-dsd.test.ts`，v0.13 删除原文件）
- `island.test.ts` — Island 体系
- `context.test.ts` — 上下文管理
- `errors.test.ts` — 错误处理
- `types.test.ts` — 类型检查

**亮点**：
- render-dsd 测试非常全面：escape 函数覆盖了所有特殊字符组合
- 错误路径测试：构造异常、渲染异常、null 返回值、非字符串返回值
- adapter protocol 的 extractStyles 异常捕获验证
- 边界场景：深嵌套 HTML、大属性值（10KB）、只读属性
- XSS 测试验证（`<script>alert("xss")</script>` 被正确转义）

**潜在不足**：
- 无 end-to-end 集成测试验证 core 与其他包的交互

### 2.2 @lessjs/adapter-vite — ⭐⭐⭐⭐（良好）

**测试文件**（12 个）：
- `build-context.test.ts`
- `build-manifest.test.ts`
- `build.test.ts`
- `entry-descriptor.test.ts`
- `entry-generators.test.ts`
- `entry-renderer.test.ts`
- `index-plugin.test.ts`
- `island-manifest.test.ts`
- `island-transform.test.ts`
- `route-scanner.test.ts`
- `ssg-integration.test.ts`
- `ssg-postprocess.test.ts`
- `ssg-smoke.test.ts`
- `static-paths.test.ts`

**亮点**：
- 全包最高测试文件数（14 个），覆盖构建管线各环节
- 包含集成测试（`ssg-integration.test.ts`）
- 烟雾测试（`ssg-smoke.test.ts`）验证构建基本流程

**潜在不足**：
- 部分测试依赖实际文件系统，可能产生测试间耦合
- `ssg-smoke.test.ts` 作为烟雾测试可能测试深度不够

### 2.3 @lessjs/signals — ⭐⭐⭐⭐⭐（优秀）

**测试文件**（8 个）：
- `signal.test.ts` — signal 读写、subscribe/unsubscribe
- `computed.test.ts` — 计算属性
- `effect.test.ts` — 副作用
- `island-effect.test.ts` — Island 生命周期
- `channel.test.ts` — 通道
- `batch-untracked.test.ts` — 批量更新
- `native-signal.test.ts` — 原生 Signal 兼容
- `theme-signal.test.ts` — 主题信号

**亮点**：
- 测试覆盖率高：所有核心 API（signal/computed/effect/islandEffect/batch/untracked）都有独立测试
- signal 测试全面覆盖初始值类型（number/string/object/null/undefined）
- subscribe/unsubscribe 多订阅者场景验证
- 包含主题和组件集成测试

### 2.4 @lessjs/ui — ⭐⭐⭐⭐（良好）

**测试文件**（2 个）：
- `components.test.ts` — 组件测试
- `smoke.test.ts` — 烟雾测试

**分析**：
- 组件库有 8 个 UI 组件（layout/button/card/input/code-block/dialog/theme-toggle/hero-ping），仅 2 个测试文件
- components.test.ts 可能覆盖多个组件实例化
- smoke.test.ts 快速验证基本功能
- **缺口**：每个组件缺少独立的交互测试、属性变更测试、DSD hydration 测试

### 2.5 @lessjs/content — ⭐⭐⭐⭐（良好）

**测试文件**（4 个）：
- `markdown.test.ts` — Markdown 解析
- `nav.test.ts` — 导航扫描
- `routes.test.ts` — 路由生成
- `sitemap.test.ts` — Sitemap 生成

**分析**：
- 每个子模块（Blog/Nav/Sitemap）都有独立测试
- markdown + routes 覆盖了内容管线的核心路径
- **缺口**：未验证 blog 插件与 lessjs() 入口的组合集成

### 2.6 @lessjs/adapter-lit — ⭐⭐⭐（中等）

**测试文件**（3 个）：
- `dsd-hydration.test.ts` — DSD 水合
- `escape-consistency.test.ts` — 转义一致性
- `ssr.test.ts` — SSR 渲染

**分析**：
- 基础覆盖存在，但 Lit SSR adapter 是框架关键路径
- 需要更多集成场景测试（如 Lit TemplateResult 到 DSD 的完整转换）

### 2.7 @lessjs/rpc — ⭐⭐（基础）

**测试文件**（1 个）：
- `smoke.test.ts` — 烟雾测试

**分析**：
- RPC 模块作为独立的 fetch/RPC 工具包，1 个烟雾测试覆盖明显不足
- **高风险缺口**：缺少请求/响应序列化测试、错误处理测试、超时测试

### 2.8 @lessjs/create — ⭐⭐（基础）

**测试文件**（1 个）：
- `cli.test.ts` — CLI 测试

**分析**：
- 脚手架 CLI 是用户首次接触的工具，需要更多场景验证
- **缺口**：缺少模板生成验证、文件名过滤测试、错误输入处理测试

### 2.9 @lessjs/i18n — ⭐⭐⭐（中等）

**测试文件**（1 个）：
- `i18n.test.ts` — i18n 功能测试

**分析**：
- 单一测试文件覆盖了基本 i18n 功能
- **缺口**：locale 展开、语言切换、SSG 场景的集成测试

### 2.10 @lessjs/app — ⭐（不足）

**测试文件**：无

**分析**：
- `@lessjs/app` 是统一的入口包（`lessjs()`），组合 core + content + i18n
- **关键风险**：无任何测试验证整合后的行为
- 作为用户主要 API 入口，缺少测试是严重缺口

---

## 三、E2E 测试分析

**Playwright E2E 测试**（9 个 spec 文件）：

| 文件 | 覆盖场景 | 评估 |
|------|---------|------|
| `accessibility-performance.spec.ts` | 可访问性和性能 | ✅ 高价值 |
| `dsd-layers.spec.ts` | DSD 分层渲染 | ✅ 核心功能 |
| `i18n-locale.spec.ts` | 国际化 locale | ✅ 关键路径 |
| `islands-reactivity.spec.ts` | Island 响应式 | ✅ 核心功能 |
| `navigation-routing.spec.ts` | 导航与路由 | ✅ 核心功能 |
| `nested-ce.spec.ts` | 嵌套自定义元素 | ✅ 独特卖点 |
| `seo-meta.spec.ts` | SEO meta 标签 | ✅ 高价值 |
| `theme-system.spec.ts` | 主题切换 | ✅ 核心功能 |
| `view-transitions-speculation.spec.ts` | View Transitions | ✅ 高级特性 |

**E2E 质量分析**：
- 覆盖了框架的 9 个关键用户场景
- 采用 chromium 浏览器，配置合理（retries、timeout、parallel）
- 基于 SSG 构建产物测试，真实反映用户场景
- **缺口**：缺少跨浏览器测试（firefox/webkit），缺少表单组件提交的 E2E 测试

---

## 四、测试基础设施评估

### CI 配置（test.yml）
- **9 个并行 job**：typecheck + test-core + test-adapter-vite + test-rpc + test-ui + test-create + test-i18n + test-content + test-adapter-lit + build-www
- **优点**：
  - 每个包独立测试，隔离性好
  - 利用 actions/cache 加速依赖安装
  - Deno 2.x 版本统一
- **潜在问题**：
  - 9 个并行 job 共享缓存键但无互斥锁，可能出现缓存竞争

### Lint & Format（lint.yml）
- 正确配置了 deno fmt + deno lint
- 存在已知 issue：Deno fmt 在处理 HTML tagged template 时会 panic
  - 已通过 `skip www/` 规避
  - 跟踪上游 bug（#30948, #32954）

### Pre-commit Hooks
- 通过 `.githooks/` 目录管理
- 运行 `deno fmt --check` + `deno lint` + `deno check`
- 不运行完整测试，保持快速反馈

### Deno 测试配置
- `deno.json` 中 test 命令覆盖了所有权限（--allow-read/write/env/net/run）
- 可采用 `deno test --coverage` 获取代码覆盖率报告
- 当前未启用覆盖率收集，无法量化覆盖率百分比

---

## 五、测试问题清单（按严重级别）

### Critical（关键问题）

| # | 问题 | 影响包 | 建议 |
|---|------|--------|------|
| C1 | @lessjs/app 无任何测试 | app | 添加 lessjs() 整合测试，验证 core+content+i18n 组合 |
| C2 | @lessjs/rpc 仅 1 个烟雾测试 | rpc | 添加 request/response 序列化、错误处理、超时测试 |

### Major（主要问题）

| # | 问题 | 影响包 | 建议 |
|---|------|--------|------|
| M1 | @lessjs/create 仅 1 个 CLI 测试 | create | 添加模板生成验证、文件名过滤、错误输入测试 |
| M2 | @lessjs/ui 8 组件仅 2 测试文件 | ui | 为每个组件添加独立渲染测试和属性测试 |
| M3 | 缺少代码覆盖率报告配置 | 全局 | 在 CI 中添加 `deno test --coverage` 并生成覆盖率报告 |
| M4 | E2E 仅 chromium 浏览器 | e2e | 添加 firefox 和 webkit 浏览器项目（至少关键路径） |

### Minor（次要问题）

| # | 问题 | 影响包 | 建议 |
|---|------|--------|------|
| N1 | adapter-lit 测试深度不足 | adapter-lit | 添加更多 Lit TemplateResult 集成场景 |
| N2 | 部分测试使用 waitForEffects(50ms) 硬编码等待 | signals | 改用更可靠的 flush 机制而非 setTimeout |
| N3 | lint.yml 跳过 www/ 目录 | www | 跟踪 Deno 上游 bug，修复后启用 www/ 目录检查 |
| N4 | 无性能/基准测试 | 全局 | 考虑添加 DSD 渲染性能基准测试 |

---

## 六、改进建议（优先级排序）

1. **【P0】补齐 @lessjs/app 测试** — 统一入口整合测试，覆盖 lessjs() 组合 core+content+i18n 的场景
2. **【P0】增强 @lessjs/rpc 测试** — 至少覆盖请求/响应处理、错误路径和超时场景
3. **【P1】启用覆盖率收集** — 在 CI 中加入 `deno test --coverage`，量化全包覆盖率
4. **【P1】增强 UI 组件测试** — 为 8 个组件编写独立渲染测试
5. **【P2】扩展 E2E 浏览器矩阵** — 添加 firefox 测试关键用户路径
6. **【P2】添加性能基准测试** — 监控 DSD 渲染性能随版本变化

---

## 七、总结

LessJS 的测试生态整体质量良好，核心包（core/adapter-vite/signals）的测试覆盖充分且质量高。CI 基础设施完善，包含 9 个并行测试 job、E2E 测试和 pre-commit hooks。

**主要薄弱环节**：
- `@lessjs/app`（统一入口）无任何测试 — **最关键的缺口**
- `@lessjs/rpc` 和 `@lessjs/create` 测试覆盖严重不足
- 缺少量化的覆盖率报告

**优势**：
- 核心渲染管线（DSD、SSR、Island）测试完整
- 边界场景和错误路径覆盖良好
- E2E 测试覆盖 9 个关键用户场景
- CI 架构设计合理，模块隔离性强

> 建议在下一个版本中优先解决 P0/P1 问题，尤其是补齐 @lessjs/app 的整合测试，并引入 Deno 的 `--coverage` 标志来量化测试覆盖率。
