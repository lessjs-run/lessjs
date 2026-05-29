# SOP-014: Full Regression + Documentation Finalization

> Priority: P2 | Nature: 验证 + 文档 | Time: 1d

## Objective

全量 gate 通过 + 更新所有受影响的文档。

## Step-by-Step

### Step 1: 全量 Gate

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task graph:check
deno task test
deno task build
deno task dsd:check-report
deno task docs:check-current
```

### Step 2: 文档更新清单

| 文件                                 | 更新内容                                                             |
| ------------------------------------ | -------------------------------------------------------------------- |
| `docs/reference/core-api-surface.md` | 新增 `lessPipeline()`, SignalContext, `static head`, `static client` |
| `docs/arch/current-architecture.md`  | v0.24.4 → v0.25.0                                                    |
| `docs/status/STATUS.md`              | 当前版本线                                                           |
| `docs/roadmap/ROADMAP.md`            | v0.25 标记 COMPLETED                                                 |
| `CHANGELOG.md`                       | v0.25.0 full entry                                                   |
| `docs/release/0.25.0.md`             | Release note                                                         |
| `README.md`                          | 版本号 + API 示例更新                                                |

### Step 3: migration guide

创建 `www/app/routes/guide/migration-v0.25.tsx`：

- `less()` → `lessPipeline()`
- `island()` → `static client`
- `head-extras` → `static head`
- 字符串模板 → JSX

### Step 4: adapter-react/vanilla 审计

- [ ] 确认是否有 external consumers
- [ ] 如零使用 → 标记 @deprecated 或归档

### Step 5: 最终验证

- [ ] 14/14 SOP tasks 完成
- [ ] 全量 gate 通过
- [ ] docs truth 收敛
- [ ] Release note 就绪
