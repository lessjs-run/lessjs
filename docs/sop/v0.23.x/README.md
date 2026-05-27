# LessJS v0.23.x - DX Leap: Reactive Properties + Template Primitives + Error Architecture

> Status: PLANNED
> Target: transform LessJS from "架构严谨但 DX 残缺" 到 "架构严谨且 DX 成熟"
> Governing ADRs: ADR-0051, ADR-0052, ADR-0053

## Mission

v0.23.x 是 LessJS 的 **DX 飞跃版本**。深度评估报告（2026-05-27）给出了一句残酷但准确的总结：

> "架构 8.5 分，DX 5 分，潜力 9 分——现在要做的不是增加功能，而是让已有的架构'好用'。"

本版本聚焦三个 ADR，解决评估报告认定的 Top 关键问题：

| # | 评估问题                               | 严重级别 | 对应 ADR | 对应 SOP |
| - | -------------------------------------- | -------- | -------- | -------- |
| 1 | Signal-DOM 集成极浅，无自动响应式更新  | **P0**   | ADR-0052 | SOP-010  |
| 2 | 无响应式属性系统，样板代码泛滥         | **P0**   | ADR-0052 | SOP-010  |
| 3 | 无错误边界、两套断裂错误系统           | **P1**   | ADR-0053 | SOP-011  |
| 4 | html 模板缺少 classMap/when/repeat/ref | **P1**   | ADR-0051 | SOP-009  |
| 5 | Signals/StyleSheet 包零测试            | **P0**   | —        | SOP-012  |
| 6 | 50+ 处 `any` 类型 + types.ts 1462 行   | **P1**   | —        | SOP-013  |
| 7 | Package README 严重过时                | **P1**   | —        | SOP-014  |
| 8 | SSG resolver 缺 runtime 导致 CI 全炸   | **P0**   | —        | SOP-016  |
| 9 | 外部包子路径 external 不完整系统修复   | **P0**   | ADR-0054 | SOP-017  |

> **编号说明**：SOP-001~009 已被 v0.23.0 占用，v0.23.x 的 DX SOP 从 SOP-009 开始编号（与 v0.23.0 的 SOP-009 不同目录，无冲突）。

## Scope Boundary

| Included                                           | Excluded in v0.23.x                     |
| -------------------------------------------------- | --------------------------------------- |
| `@prop()` 响应式属性装饰器                         | less-layout God Component 拆分（v0.25） |
| `html` 模板强化（classMap/when/choose/repeat/ref） | UI 组件库扩展到 25+（v0.25）            |
| 统一错误架构（4 层）                               | Edge Full-Stack（v0.26+）               |
| Signals/StyleSheet 测试补全                        | 边缘部署（v0.26+）                      |
| `any` 类型消除 + types.ts 拆分                     | ISR/SSR 运行时模式                      |
| Package README 更新                                | 多浏览器 E2E（v0.25）                   |

## Release Order

| Step | SOP     | Priority | Purpose                           | Must Finish Before                |
| ---- | ------- | -------- | --------------------------------- | --------------------------------- |
| 0    | PREP    | P0       | 基线测量 + 分支创建               | 任何代码变更                      |
| 1    | SOP-009 | P1       | html 模板强化                     | SOP-010（@prop 需要 classMap）    |
| 2    | SOP-010 | P0       | @prop() + Signal-DOM 深度集成     | SOP-011（错误边界需要响应式属性） |
| 3    | SOP-011 | P1       | 统一错误架构                      | SOP-015（验证需要错误系统）       |
| 4    | SOP-012 | P0       | 测试覆盖补全                      | SOP-015（覆盖率门槛）             |
| 5    | SOP-013 | P1       | 类型安全硬化                      | SOP-015（typecheck 门禁）         |
| 6    | SOP-014 | P1       | Package README 更新               | 发布                              |
| 7    | SOP-015 | P0       | 验证 + 发布门禁                   | 合并 main                         |
| 8    | SOP-016 | P0       | SSG Package Resolver runtime 修复 | CI consumer-smoke 通过            |
| 9    | SOP-017 | P0       | AST-based external specifier 修复 | CI consumer-smoke 无外部包子路径问题 |

## Entry Criteria

- v0.23.0 已发布到 JSR 或 dev 分支处于可发布状态
- ADR-0051、ADR-0052、ADR-0053 状态为 ACCEPTED
- 12 道 CI 门禁在 dev 分支上全绿
- `deno task graph:check` 无违规

## Execution Rules

1. **SOP-009 先于 SOP-010**：`classMap()` 是 `@prop()` 模板集成的前提
2. **SOP-010 是核心**：占据本版本 60% 的 DX 收益，优先分配资源
3. **每步验证**：每个 Step 完成后必须跑 `deno task typecheck && deno task test`
4. **不破坏 `render(): string`**：纯字符串渲染组件继续工作，@prop 是 opt-in
5. **适配器平等**：SOP-009 的模板原语是框架无关默认，Lit/FAST 保持等价适配器地位

## Exit Criteria

- `@prop()` 装饰器可将属性声明从 10+ 行降到 1 行
- Signal 值变化自动触发 DOM 更新，无需手动 `this.update()`
- `html` 模板支持 `classMap`/`when`/`choose`/`repeat`/`ref` 五个原语
- 模板缓存基于 `TemplateStringsArray` identity
- 所有框架错误统一继承 `LessError`，含 `code`/`severity`/`phase`/`recoverable`
- 错误边界可阻止子组件渲染失败向上传播
- `@lessjs/signals` 和 `@lessjs/style-sheet` 测试覆盖 > 80%
- `any` 类型减少到 < 10 处（从 50+）
- Package README 与当前 API 一致
- 12 道 CI 门禁全绿
- 综合评估 DX 评分从 5/10 提升到 ≥ 7/10

## File Index

| File                                     | Content                                               |
| ---------------------------------------- | ----------------------------------------------------- |
| `SOP-009-html-template-strengthening.md` | html 模板强化：classMap/when/choose/repeat/ref + 缓存 |
| `SOP-010-signal-dom-deep-integration.md` | @prop() 装饰器 + Signal→DOM 自动绑定                  |
| `SOP-011-unified-error-handling.md`      | 四层统一错误架构                                      |
| `SOP-012-test-coverage-supplement.md`    | Signals/StyleSheet 测试补全                           |
| `SOP-013-type-safety-hardening.md`       | any 消除 + types.ts 拆分                              |
| `SOP-014-package-readme-update.md`       | Package README 更新                                   |
| `SOP-015-validation-and-release-gate.md` | 验证 + 发布门禁                                       |

## Related

- ADR-0051: Self-Built `html` Template System Strengthening
- ADR-0052: Signal-DOM Deep Integration — Reactive Property Binding
- ADR-0053: Unified Error Handling Architecture
- ADR-0039: DsdElement + Signals Reactive Architecture (前置)
- ADR-0035: SSG Resilient Rendering (bare-tag 先例)
- Deep Evaluation Report 2026-05-27
