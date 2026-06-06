# 4. Durable Execution：工作流持久化

> Temporal.io. Durable Execution documentation. 参考：Reinke et al. "Durable Functions: Semantics for Stateful Serverless." OOPSLA 2021.

## 核心问题

如果一个长时间运行的工作流在中间步骤崩溃了，怎么办？

传统做法：

```
step1 → step2 → 💥 crash → 全部重来
```

重来意味着幂等性噩梦：step1 可能已经发了邮件、扣了钱、写了数据库。重来 = 重复操作。

## Durable Execution 的答案

**把工作流状态持久化到外部存储。崩溃后从断点继续，而不是重来。**

```
step1 ✅ → [保存状态到 DB]
step2 中 → 💥 crash
    ↓
恢复: 从 DB 读状态 → "step1 已经完成了，step2 重试"
```

三个关键机制：

### 1. Event Sourcing（事件溯源）

不保存"当前状态"，保存"所有事件序列"：

```
事件流: cell-created → branch-created → commit-pushed → ci-triggered → ci-passed
```

给定事件流，可以重建任何时刻的状态。事件是不可变的——只追加，不修改。

### 2. Replay（重放）

恢复时不是"读状态"而是"重放事件"：

```python
def rebuild_state(cell_id):
    events = db.query("SELECT * FROM events WHERE cell_id = ?", cell_id)
    state = State()
    for event in events:
        state = state.apply(event)
    return state
```

重放是确定性的：同样的输入 → 同样的输出。没有副作用。

### 3. Exactly-Once 语义

不重试 = 任务可能丢失。重试但不保护 = 任务可能重复（发了两次邮件）。

Durable Execution 保证：**同一逻辑只会执行成功一次。** 靠事件去重和幂等性键实现。

## 对 openElement 的贡献

### Cell Evidence Ledger = Event Sourcing

```
docs/autoflow/cells/cell-v0.35.0-001.json
```

每个 Cell 的 JSON 文件就是这个 Cell 的事件日志。不是"当前状态快照"，而是"发生了什么的完整记录"。

### Branch 的持久化

```
autoflow/cell-<id> → push to origin → CI runs → 
  ✅ → merge → delete branch
  ❌ → close → delete remote branch
```

Branch 本身不是持久的，但 Cell Evidence Ledger 是。Branch 被删了，证据还在。

### 崩溃恢复

```
AI 在执行 cell-04（bump 版本号）
  → 改了 13 个 deno.json
  → deno task typecheck 还在跑
  → 💥 AI 进程崩溃

恢复:
  → 读 Cell Evidence Ledger
  → "cell-04 在 executing 阶段，typecheck 结果未知"
  → 重新检出分支 autoflow/cell-04
  → 重新跑 typecheck（确定性的）
  → 继续
```

因为 typecheck 是确定性的（同样的代码 → 同样的结果），不需要从头来。

## 关键限制

Durable Execution 要求**每一步都是确定性的**。不确定的操作（网络调用、随机数）需要特殊处理。

我们的 Harness 门禁恰好都是确定性的：

- `deno fmt --check` = 确定性
- `deno lint` = 确定性
- `deno test` = 确定性（假设测试不依赖随机数或网络）
- `deno check` = 确定性

这是设计，不是巧合。确定性门禁 = 可以安全重放。
