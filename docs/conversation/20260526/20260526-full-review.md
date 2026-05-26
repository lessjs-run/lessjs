# LessJS v0.21.16 全面评审报告

> **日期**: 2026-05-26
> **范围**: 16 packages, 315 .ts files, 67K lines, 24 ADRs, 9 CI workflows

---

## 评分汇总

| 评审维度       | PM        | 架构师    | Engineer        | QA        |
| -------------- | --------- | --------- | --------------- | --------- |
| 定位清晰度     | 4/5       | —         | —               | —         |
| 文档完整度     | 3/5       | —         | —               | —         |
| 用户路径       | 3/5       | —         | —               | —         |
| 版本策略       | 4/5       | —         | —               | —         |
| 生态友好度     | 3/5       | —         | —               | —         |
| 包边界清晰度   | —         | 3/5       | —               | —         |
| 依赖方向       | —         | 4/5       | —               | —         |
| 技术选型一致性 | —         | 4/5       | —               | —         |
| ADR 一致性     | —         | 5/5       | —               | —         |
| 扩展性         | —         | 4/5       | —               | —         |
| 代码风格一致性 | —         | —         | 4/5             | —         |
| 类型安全       | —         | —         | 4/5             | —         |
| 错误处理       | —         | —         | 3/5             | —         |
| 模块内聚       | —         | —         | 3/5             | —         |
| 技术债务信号   | —         | —         | 4/5             | —         |
| 测试覆盖率感知 | —         | —         | —               | 3.5/5     |
| CI 配置质量    | —         | —         | —               | 3.5/5     |
| 质量门设计     | —         | —         | —               | 4/5       |
| 错误归因能力   | —         | —         | —               | 3/5       |
| 回归防护       | —         | —         | —               | 2.5/5     |
| **综合**       | **17/25** | **20/25** | **IS_PASS YES** | **3.4/5** |

---

## 🏆 三大亮点

### 1. ADR 纪律罕见优秀

ADR-0042~0048 的每个决策点完全落地到代码——import map → polyfill 分层 → CI gate 分离，可追溯性 100%。这是非常罕见的架构纪律。

### 2. core 包代码质量标杆

零 TODO/FIXME，类型体系完整（1462 行纯声明），模块内聚清晰。`errors.ts` 使用 `LessError` 基类 + `sourceError` 保存栈不遮蔽 `Error.cause`。

### 3. DSD Gate 设计精致

native/third-party 分层、双阈值（12/0）、环境变量覆盖、known error patterns 文档化——小模块做到专业级。

---

## 🔴 P0 — 必须修

| 问题                       | 发现者 | 详情                                                                                                                               |
| -------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **style-sheet 提取不完整** | 架构师 | `packages/core/src/style-sheet.ts` ≡ `packages/style-sheet/src/style-sheet.ts`（完全相同），零引用。SOP-007 声明了提取但代码未执行 |
| **缺少入门文档**           | PM     | `docs/guide/` 仅 1 篇（migrating-from-lit.md），无 quickstart、无部署指南                                                          |

## 🟡 P1 — 应该修

| 问题                                                                            | 发现者 |
| ------------------------------------------------------------------------------- | ------ |
| `adapter-vite/index.ts` (843行) 需拆分为 plugin/head-injection/subpath-resolver | 工程师 |
| `build-types.ts` / `virtual-ids.ts` 不应在 core（历史上的循环依赖修复塞进去的） | 架构师 |
| consumer-monitor 验证太浅 — 只检查 `index.html` 存在 + 含 `<html`               | QA     |
| 无覆盖率报告持久化 — 跑了 `--coverage` 但没生成 lcov                            | QA     |
| Phase 2/3 执行顺序注释与实际矛盾（ADR 0023 已反转但注释未更新）                 | 工程师 |

## 🟢 P2 — 建议修

| 问题                                                                     | 发现者 |
| ------------------------------------------------------------------------ | ------ |
| `lint.yml` 与 `sop-gate.yml` 完全重叠，应删除                            | QA     |
| UI 组件 `_esc`/`_escAttr` 在 `less-button.ts` 和 `less-dialog.ts` 中重复 | 工程师 |
| README 缺 vs Astro/Nuxt 直接对比                                         | PM     |
| i18n 仅 1 个测试文件，多语言切换/翻译回退无覆盖                          | QA     |
| 中英文 README 版本不同步                                                 | PM     |
| E2E 无 Playwright trace（应加 `trace: 'on-first-retry'`）                | QA     |
| CI deno cache 缺 `restore-keys` 回退策略                                 | QA     |
| Shoelace Tier 1 支持脆弱（case-by-case 手动修复）                        | PM     |

---

## 跨包发现

| 发现                            | 发现者 | 详情                                                                                     |
| ------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| CEM 类型不一致                  | 工程师 | `core` 有完整 CEM 类型，`hub/scanner.ts` 独立定义 `CemDeclaration`                       |
| core 承载构建时类型             | 架构师 | `build-types.ts`/`virtual-ids.ts` 因历史循环依赖在 core，违反 "core = pure runtime" 定位 |
| esbuild/Rolldown 共存冗余       | 架构师 | adapter-vite 使用 esbuild transform + Rolldown bundle，可统一                            |
| records.push(null!) placeholder | 工程师 | hub/scanner.ts:372 — 类型安全隐患                                                        |

---

## PM 三大产品行动

1. **P0：补入门文档** — 5min quickstart + 项目结构说明 + 静态部署指南
2. **P1：README 加竞品对比摘要** — 浓缩 strategy doc 中 vs Astro/Fresh/Next.js 分析
3. **P1：发布已验证兼容 WC 列表** — markdown 表格列出 Shoelace/Material Web 等库的 Tier 1/2 状态

## QA 三大改进

1. **高：启用覆盖率报告** — `deno coverage` + `upload-artifact`，最低阈值 core ≥ 80%
2. **高：增强 consumer-monitor** — 在生成的项目上跑 Playwright E2E，加 Slack 失败通知
3. **中：删除 lint.yml** — sop-gate.yml 已完全覆盖

## Architect 三大改进

1. **P0：完成 style-sheet 提取** — 消除重复代码，让 `@lessjs/style-sheet` 有实际引用
2. **P1：移出 build-types/virtual-ids** — 恢复到正确的包边界
3. **P2：adapter stub 数据驱动化** — 替换硬编码 OPTIONAL_PACKAGE_STUBS

## Engineer 三大改进

1. **P1：拆分 adapter-vite/index.ts** — less-plugin.ts + head-injection.ts + subpath-resolver.ts
2. **P1：更新 Phase 2/3 注释** — 与 ADR 0023 反序后的实际执行顺序一致
3. **P2：提取共享 `_esc`/`_escAttr`** — 消除 UI 组件中重复的 HTML 转义
