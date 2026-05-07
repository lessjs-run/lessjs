# LessJS v0.7.0 — 稳定基线（P0 审计修复）

**发布日期**：2026-05-07

v0.7.0 是一次**稳定化发布**，修复了 2026-05-07 四维审计的全部 P0 发现。核心目标是消除不可信行为、建立工程纪律。本版本包含破坏性变更（XSS 修复、catch 行为变更），因此按 SemVer 0.x 约定升 MINOR。

## 变更概览

### 测试覆盖（新增 73 个测试）

| 模块 | 测试数 | 覆盖行数 |
|------|--------|---------|
| `render-dsd.ts` | 44 | 770 行（此前零覆盖）|
| `island.ts` | 29 | 321 行（此前零覆盖）|

**render-dsd.ts** — 覆盖 escapeHtml、escapeAttr、escapeAttrValue、serializeAttributes、renderDSD 全路径、L2 Nested DSD、XSS 安全、DSD options（delegatesFocus/serializable/slotAssignment/customElementRegistry）、pure-island layer、adapter protocol、边界情况。

**island.ts** — 覆盖 tagName 验证、元数据标记（`__island`/`__tagName`/`__layer`）、DSD opt-out、四种升级策略（eager/lazy/idle/visible）、幂等注册、connectedCallback 包装、getSSRProps、lessBind。

### Bug 修复

- **runtime-shim 一致性修复**：`runtime-shim.ts` 的 `serializeAttributes()` 改用 `escapeAttrValue()`，与 `render-dsd.ts` 保持一致。此前 null/undefined 值处理不一致。
- **headExtras/headFragments XSS 警告**：添加 `@security`/`@dangerous` JSDoc 标注。当注入内容包含 `<script>` 标签时，运行时打印 `console.warn` 提醒开发者注意 XSS 风险。
- **静默 catch 消除**：修复 6 处残余静默 catch 块，改为 `console.debug`/`console.warn`，使错误可观测。涉及文件：island.ts、render-dsd.ts、cli/build-ssg.ts、cli/build-client.ts。

### 基础设施

- **Pre-commit Hooks**：`.githooks/pre-commit` 自动运行 `deno fmt --check` + `deno lint` + `deno check`，通过 `deno task hooks:install` 启用。
- **CI adapter-lit 测试**：test.yml 新增 `test-adapter-lit` job。
- **CI 发布门禁**：publish.yml 添加 `needs: [test]` 依赖，测试不通过不能发布。
- **Cloudflare Pages 迁移**：从 GitHub Pages 迁移到 Cloudflare Pages Connect GitHub 模式。main → Production（lessjs.com），dev → Preview（每次推送自动分配 URL）。

## 破坏性变更

- **runtime-shim `serializeAttributes`**：现在通过 `escapeAttrValue` 处理 null/undefined，而非直接传给 `escapeAttr`。如果你之前依赖 null 被字符串化的行为，现在会输出空字符串。
- **静默 catch → 可观测错误**：此前吞没错误的代码现在会打印 `console.warn` 或 `console.debug`（带 `[LessJS]` 前缀）。如果错误监控将这些视为噪音，请调整日志过滤规则。

## 测试结果

```
354 passed, 0 failed
```

## 版本策略

完整的 v0.7 → v2.0 路线图详见 [ADR 0006: 版本号策略](https://lessjs.com/decisions/0006-version-strategy)。

**下一个版本**：v0.8.0 — P1 功能完善 + Island Manifest + Blog 开发启动。

## 升级方式

```bash
# 更新项目依赖
deno run -A jsr:@lessjs/create

# 安装 pre-commit hooks（推荐）
deno task hooks:install
```
