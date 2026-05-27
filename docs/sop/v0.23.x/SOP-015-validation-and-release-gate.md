# SOP-015: 验证 + 发布门禁

> Version: v0.23.x
> Priority: P0
> Status: PLANNED
> Depends on: SOP-009~014 全部完成
> Blocks: 合并 main

## Objective

全量验证 v0.23.x 所有 SOP 的交付物，确认 12 道 CI 门禁全绿 + DX 评分提升，满足发布条件后合并到 main。

## Entry Criteria

- SOP-009~014 全部标记为 COMPLETED
- 所有 SOP 的 Quality Gates 通过
- `deno task typecheck && deno task test` 无错误

## Procedure

### Step 1: 全量 typecheck + test

**目标**：确认所有代码通过类型检查和测试。

**执行动作**：

- [ ] 运行完整检查：

```sh
deno task typecheck
deno task test
deno task lint
deno task fmt:check
```

**通过标准**：

- [ ] typecheck 0 errors
- [ ] test 全通过（含新增测试）
- [ ] lint 0 errors
- [ ] fmt 无未格式化文件

**是否污染工作区**：否

---

### Step 2: 12 道 CI 门禁验证

**目标**：确认 12 道 CI 门禁全绿。

**执行动作**：

- [ ] 逐项验证 CI 门禁：

| # | Gate | 命令/检查 |
|---|------|---------|
| 1 | fmt:check | `deno task fmt:check` |
| 2 | lint | `deno task lint` |
| 3 | typecheck | `deno task typecheck` |
| 4 | audit | `deno task audit` |
| 5 | test | `deno task test` |
| 6 | build | `deno task build` |
| 7 | dsd:check-report | `deno task dsd:check-report` |
| 8 | hub:validate | `deno task hub:validate` |
| 9 | hub:check-index | `deno task hub:check-index` |
| 10 | docs:check-strategy | `deno task docs:check-strategy` |
| 11 | graph:check | `deno task graph:check` |
| 12 | test:e2e | `deno task test:e2e` |

**通过标准**：

- [ ] 12/12 门禁全绿

**是否污染工作区**：否

---

### Step 3: DX 评分验证

**目标**：确认 DX 评分从 5/10 提升到 ≥ 7/10。

**执行动作**：

- [ ] 对照评估报告的 DX 维度逐项检查：

| DX 维度 | v0.23.0 基线 | v0.23.x 目标 | 验证方式 |
|---------|-------------|-------------|---------|
| 属性声明 | 10+ 行/属性 | 1 行/属性 | less-button 代码行数 |
| Signal 自动更新 | 不支持 | 支持 | `@prop()` 变化自动更新 DOM |
| 模板原语 | 无 | classMap/when/choose/repeat/ref | 使用示例运行 |
| 错误边界 | 无 | isErrorBoundary + onError | 测试通过 |
| 错误遥测 | 无 | onError hook | 集成测试通过 |
| 测试覆盖率 | Signals/StyleSheet 0% | > 80% | 覆盖率报告 |
| 类型安全 | 50+ any | < 10 any | rg 计数 |
| Package README | 5/10 | ≥ 8/10 | 人工审查 |

- [ ] 计算综合 DX 评分

**通过标准**：

- [ ] 综合 DX ≥ 7/10

**是否污染工作区**：否

---

### Step 4: 发布准备

**目标**：更新版本号 + changelog + 发布到 JSR。

**执行动作**：

- [ ] 更新 `deno.json` 版本号
- [ ] 更新 `CHANGELOG.md`
- [ ] 运行 `deno task build` 确认构建产物
- [ ] 发布到 JSR：`deno publish`
- [ ] 创建 git tag：`git tag v0.23.x`
- [ ] 合并到 main 分支

**通过标准**：

- [ ] JSR 发布成功
- [ ] git tag 创建
- [ ] main 分支包含所有变更

**是否污染工作区**：是（版本号 + changelog + tag）

## Quality Gates

| Gate | Criteria |
|------|----------|
| G1 | 12/12 CI 门禁全绿 |
| G2 | DX 评分 ≥ 7/10 |
| G3 | JSR 发布成功 |
| G4 | git tag 创建 |

## Exit Criteria

- v0.23.x 发布到 JSR
- DX 评分从 5/10 提升到 ≥ 7/10
- 12 道 CI 门禁全绿
- main 分支包含所有变更
