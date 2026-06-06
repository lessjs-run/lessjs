# AutoFlow2 Architecture Redesign — v1

> **Status**: Proposal\
> **Target**: v0.35.0 AutoFlow2 Harness Gate → v1.0.0 Self-Evolving Workflow\
> **Research basis**: C1-C6, 01-09, A1 (15 papers)\
> **Current baseline**: v0.34.0 read-only sidecar kernel\
> **Date**: 2026-06-06

---

## 目录

1. [设计原则提取](#1-设计原则提取) (13 条原则，15 篇论文)
2. [系统架构](#2-系统架构)
3. [Cell 生命周期状态机](#3-cell-生命周期状态机)
4. [Cell DAG 调度器](#4-cell-dag-调度器)
5. [证据模型](#5-证据模型)
6. [演化循环](#6-演化循环)
7. [安全与非目标](#7-安全与非目标)
8. [版本路线图](#8-版本路线图)
9. [v0.35 具体实施计划](#9-v035-具体实施计划)

---

## 1. 设计原则提取

从 15 篇研究论文中提取的、直接指导架构设计的机制。

### 1.1 自描述的指令带 (C1 von Neumann)

> von Neumann 的自复制机有三部分：构造臂（按指令操作）、指令带（"怎么造一个我"的完整描述）、复制机（把指令带复制一份给子代）。
> 关键悖论：指令带必须同时包含"构造指令"和"复制指令"——如果只包含构造指令，子代就会丢失复制能力，第一代能造子代，子代不能造孙代。

**映射到我们**：Governance 文档（STATUS.md / ROADMAP.md / SOP / ADR）就是系统的"指令带"。如果指令带不完整，系统就不知道如何复制自己（创建下一个版本周期）。

von Neumann 区分了**通用计算机**（给定程序，算出结果）和**通用构造器**（给定蓝图，造出实物）。OpenHands 是通用计算机——给任务写代码。我们做的是**通用演化器**——给蓝图自己演化。

**设计约束**：

- Cell 必须能够修改 Governance 文档。bump-version cell 更新 STATUS.md。changelog cell 更新 ROADMAP.md。文档不是给人看的——是系统自描述
- **Cell 必须能够创建新的 Cell**。von Neumann 的复制机证明：如果系统不能复制指令带，演化到一半就停了。version-bump cell 完成后，必须有能力 spawn 一个新的 changelog cell
- 指令带的**局部性**：每个 Cell 只需要知道自己的依赖和输出，不需要知道整个版本周期的全貌。von Neumann 的细胞不知道自己在造完整机器，只知道邻居状态

### 1.2 Class 4 行为目标 + 计算等价原理 (C2 Langton/Wolfram)

> Langton 证明：自复制不需要 von Neumann 的 29 状态，8 种就够了。简单规则产生自复制行为。
> Wolfram 的 Rule 110（一种 Class 4 的一维细胞自动机，仅 8 条规则）被证明是**图灵完备的**。
> **计算等价原理**：几乎所有不是明显简单的系统，计算能力都一样——图灵完备。蚂蚁群落、人脑、Rule 110——计算能力完全等价。

**映射到我们**：

- Langton：Cell 类型不需要很多。低风险（bump/changelog/fmt）三类可能覆盖 90% 的机械操作
- Wolfram：如果 Rule 110 那么简单的规则都能达到图灵完备，那么 AI + State Machine + Git + Harness 拼起来，几乎一定会产生比单独组件复杂得多的涌现行为——**不是设计出来的，是涌现出来的**
- Class 4 是我们的目标：持续演化，有模式，但不可归约为简单周期。Class 1 = 一潭死水，Class 3 = 不可预测的混乱——都不行

**设计约束**：

- Cell 类型 ≤ 12 种。规则是局部的（Cell 只知道自己的依赖和输出）。宏观行为（版本发布）从局部 Cell 完成中涌现
- **不可预测 ≠ 不可控制**。Class 4 的长程行为不可预测，但 Harness 是 guardrail：不管涌现出什么复杂行为，fmt/lint/typecheck/test 门禁一视同仁。你可以不可预测，但不能不合规

### 1.3 对抗熵增 (C3 Lehman + C4 Brooks)

> Lehman 第七定律：不维护 = 质量下降。Brooks：偶然困难能消灭，本质困难不能。

**映射到我们**：Harness = 持续运行的熵检测器（对抗 Lehman 第七定律）。Cell 处理偶然困难（bump/changelog/fmt），人类处理本质困难（API 设计、架构决策）。

**设计约束**：Cell risk 分类即 Brooks 边界。low-risk = 纯偶然，high-risk = 触及本质。Harness 是硬门槛，不可绕过。

### 1.4 时态不变量 (C5 Pnueli)

> □(harness_pass → ◇cell_merge) — "任何时候，如果 harness 全绿，cell 最终必须进入 merge。"

**映射到我们**：autoflow:check 不只是"跑一遍看看"，而是"每次操作前验证这些不变量是否成立"。系统必须能表达跨时间的约束。

**设计约束**：invariant checker 模块独立存在。不可通过的单次快照取代持续约束。

### 1.5 确定性通信通道 (C6 Kahn)

> 共享状态是并发 bug 的根源。KPN 只通过 FIFO 队列通信。

**映射到我们**：Cell 之间只通过 Cell Evidence Ledger（JSON 文件）通信。没有共享内存，没有全局状态。并行 Cell 不能编辑同一个文件的同一个区域——由 DAG 串行化解决。

**设计约束**：Cell Evidence Ledger 是唯一通信机制。两个 Cell 编辑同一文件 → 必须串行。冲突检测在 DAG 构建阶段完成。

### 1.6 MAPE-K 闭环 (01)

> Kephart & Chess 的核心洞察：MAPE-K 最大的贡献不是四个步骤本身——而是 **Knowledge 作为闭环的核心**。在大多数监控系统中，Monitor → Alert → 人处理 → 结束。人走了，知识也走了。MAPE-K 要求每次决策都回到 Knowledge 层。

> 2003 年 IBM 用这个思想让服务器自调参数。我们现在把它搬到软件工程：**让仓库自己管自己的版本、文档、测试、发布。**

**映射到我们**：autoflow:report = Monitor。State Machine = Analyze。Scheduler = Plan。Cell Executor = Execute。Governance 文档 + Evidence Ledger = Knowledge。闭环不是一次性的——是持续运行的。

对比 OpenHands：

```
OpenHands:  Task → Execute → Done（一次性，无记忆）
我们:       Knowledge → Monitor → Analyze → Plan → Execute → Knowledge（闭环，有记忆）
```

OpenHands 不知道"这个 repo 的 SOP 是什么""该不该发版本"——它只知道当前任务，是近视的。我们有 Governance 文档作为长期记忆。

**设计约束**：整个系统就是 MAPE-K 的实例化。每个阶段的输出回到 Knowledge 层。**自治不意味着失控**——MAPE-K 强调自主系统需要人为定义的策略（policy），我们的 Harness 就是 policy 的编码化。

### 1.7 架构驱动的自适应 (03 Rainbow)

> 自适应系统的关键是"系统知道自己的样子"。

**映射到我们**：Governance 文档 = Architecture Model。Rainbow 的 Model Manager → 我们的 reader 层。Architecture Evaluator → 我们的 state machine。Adaptation Engine → 我们的 scheduler。

**设计约束**：必须有一份机器可读的架构自描述。STATUS.md 必须结构化到足以被程序消费。

### 1.8 广播通信与证据驱动转换 (02 Harel Statecharts)

> Harel 的三项创新：层次化状态（解决组合爆炸）、正交状态（多维度独立演进）、**广播通信**（每次状态转换都广播事件）。传统 FSM 的致命缺陷：n 个布尔维度的状态 = 2^n 组合——这是指数爆炸。Harel 用层次 + 正交把复杂度从 O(2^n) 降到 O(n)。

> 关键：**状态切换不是沉默的。** 每次转换都广播一个事件，事件可以在状态机之间传播。implemented → released 广播 "version-released" 事件 → Cell DAG 收到 → 评判决议条件。

**映射到我们**：

- Cell 状态机用层次化：`harness` 是父状态，内含 `running/passing/failing` 子状态。父层面的逻辑（"正在验证"）和子层面（"lint 过了，typecheck 炸了"）分离
- 正交维度：每个 Cell 同时有生命周期 × 风险评估 × 依赖状态三个独立维度——不是 4×4×3=48 个状态，是 3 条独立的状态线
- **广播 = 证据驱动**：状态转换不是偷偷发生的。Cell 从 executing → harness:running → 广播事件 "cell-X-harness-started" → 写入 Evidence Ledger → 下游 Cell 可感知。Harel 的"事件驱动转换"≡ 我们的"证据驱动转换"

**设计约束**：状态机必须是数据（不是 if-else 链），使得 fast-check 可读、使得 Model-Based Testing 可生成路径。每次合法状态转换必须同时写入一条事件到 Evidence Ledger。

### 1.9 持久化执行 (04 Durable Execution)

> 崩溃后从断点继续，而不是重来。Event Sourcing + Replay。

**映射到我们**：Cell Evidence Ledger 采用 Event Sourcing 模式。不是保存"当前状态"快照，而是保存完整事件序列。崩溃恢复 = 读事件流 → 重建状态 → 继续。

**设计约束**：Ledger 是 append-only 的 JSON 数组。每个 Cell 有两个文件：`events.jsonl`（事件流）和 `state.json`（派生缓存，可重建）。

### 1.10 基于模型的测试 (06)

> 不是你写测试，是你定义模型，框架生成测试。

**映射到我们**：Cell 状态机有 ~20 个状态和 ~30 条合法转换——手动写测试覆盖不了所有路径。用 Model-Based Testing 从状态模型自动生成测试。

**设计约束**：状态机定义必须是数据（不是 if-else 链），使得 fast-check 可以读取它来生成测试路径。

### 1.11 进化循环 (A1 AlphaEvolve)

> LLM generates → Evaluator → Programs DB → 进化算法选优 → 下一轮。

> AlphaEvolve 在 Borg 上运行了一年多，持续回收 0.7% 的全球计算资源。**不是一次性优化——是一个持续运行的自我改进系统。** 这正是我们想要的形式。

**映射到我们**：autoflow:report 检测 drift → LLM generates code on branch → Harness evaluates → Cell Evidence Ledger stores → Scheduler 选优 → 下一轮。Harness 全绿 = fitness 满分。

区别：AlphaEvolve 优化算法性能（跑得更快），我们优化仓库完整性（版本对齐、文档同步、门禁全绿）。循环结构完全一致，区别在 optimization target。

**设计约束**：System 必须能测量自己的进化质量（一次通过率、平均修复轮次、从感知到发布延迟）。

### 1.12 CodeAct 执行范式 (08 OpenHands)

> OpenHands 的核心创新是 **CodeAct**：跳过工具抽象，LLM 直接生成并执行代码。传统 Agent 需要预定义工具（"bump-version tool"），CodeAct 直接生成 bash/Python 操作文件——灵活性和通用性强一个数量级。

> OpenHands 的三个致命局限：(1) 无状态持久化——会话结束状态丢失，下次从头开始；(2) 无 Governance 驱动——不知道 repo 的 SOP/roadmap/发布规则，只知当前任务；(3) 无 Harness——靠"AI 判断代码好不好"，没有 fmt/lint/typecheck/arch/graph 硬门禁。

**映射到我们**：我们的 Cell 执行层采用 CodeAct 范式——不是调用 `bump_version_tool()`，而是生成直接操作 deno.json 的脚本。OpenHands 擅长"在沙箱里写代码"，我们擅长"让仓库自己跑起来"——互补而非竞争。

我们的三个应对：(1) Cell Evidence Ledger = 永久状态持久化；(2) Governance 文档 = 长期记忆；(3) Harness = 第一道防线，AI 负责"把代码写对"，Harness 负责"验证它确实对"。

**设计约束**：Cell executor 不依赖预定义的工具集。CodeAct 生成脚本 → 在隔离 branch 上运行 → Harness 验证。如果 Harness 失败 → 在同一个 branch 上修复（不重来）。

### 1.13 基准测试与过拟合 (09 SWE-bench)

> SWE-bench 收集了 2294 个真实 GitHub issue，配测试用例让 AI 修。2024 年最高分 Claude 3.5 Sonnet ~50%，人类工程师 ~67%。2025 年 OpenAI 宣布放弃 SWE-bench Verified——**不是因为太简单，是因为 AI 模型开始针对特定模式过拟合**。真实软件工程不是单文件修复，是多文件重构、跨版本维护、governance 验证。

**映射到我们**：

- 自己就是试验田：不跑 SWE-bench 数据集，让 openElement 自己演化几个版本，看 AI 能不能正确维护它
- 度量维度远超 SWE-bench：不只是"代码对不对"（测试通过），还有 12 道门禁（fmt/lint/typecheck/test/arch/graph/workflow/docs/dsd/publish/e2e）
- 过拟合应对：**不优化 AI 模型本身。优化 Governance 文档的质量。** 好的文档 = 好的"题目"，AI 学会读好文档而不是背特定模式——可迁移性更强

**设计约束**：度量系统独立于执行系统。`metrics.ts` 记录每个版本周期的 fitness 数据，生成跨版本 trend report。

---

## 2. 系统架构

### 2.1 组件图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          MAPE-K LOOP                                │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ MONITOR  │───→│ ANALYZE  │───→│  PLAN    │───→│ EXECUTE  │      │
│  │          │    │          │    │          │    │          │      │
│  │ reporters│    │ state    │    │ scheduler│    │ executor │      │
│  │ readers  │    │ machine  │    │ dag      │    │ git-ops  │      │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘      │
│       │               │               │               │            │
│       │    Harel broadcast events (每次状态转换都写入)  │            │
│       │               │               │               │            │
│       └───────────────┴───────┬───────┴───────────────┘            │
│                               │                                     │
│                        ┌──────┴──────┐                              │
│                        │  KNOWLEDGE  │  ← MAPE-K 核心 (不是循环)    │
│                        │             │                              │
│                        │ governance  │  ← von Neumann 指令带        │
│                        │ evidence    │  ← Kahn 通信通道             │
│                        │ ledger      │  ← Durable Execution 重放    │
│                        │ invariants  │  ← Pnueli 持续约束           │
│                        │ metrics     │  ← SWE-bench 多维度度量      │
│                        └─────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 模块清单

```
tools/autoflow/
├── mod.ts                          # CLI entry (v0.34, 保留)
├── mod-evolve.ts                   # CLI entry: autoflow:evolve (v0.35+)
├── mod-check.ts                    # CLI entry: autoflow:check (v0.35)
│
├── state-machine.ts                # Workflow 状态机 (v0.34, 保留)
├── cell-state-machine.ts           # Cell 生命周期状态机 [NEW v0.35]
├── invariant-checker.ts            # 时态不变量检查器 [NEW v0.35]
│
├── scheduler.ts                    # Cell DAG 调度器 [NEW v0.35]
├── dag-builder.ts                  # DAG 构建器 (从 evidence 生成) [NEW v0.35]
├── conflict-detector.ts            # 文件冲突检测 [NEW v0.36]
│
├── evidence-ledger.ts              # 证据账本读写 [NEW v0.35]
├── event-sourcing.ts              # Event Sourcing: 事件追加 + 重放 [NEW v0.35]
│
├── executor.ts                     # Cell 执行引擎 [NEW v0.36]
├── git-ops.ts                      # Git 操作封装 [NEW v0.36]
├── harness-runner.ts               # Harness 运行器 [NEW v0.35]
│
├── metrics.ts                      # 演化质量度量 [NEW v0.36]
├── evolution-tracker.ts            # 跨版本演化追踪 [NEW v0.37]
│
├── cells.ts                        # Evidence cells (v0.34, 扩展)
├── reporter.ts                     # JSON + Markdown 报告 (v0.34, 保留)
│
├── readers/                        # (v0.34, 保留)
│   ├── status.ts
│   ├── sop.ts
│   ├── nextversion.ts
│   ├── roadmap.ts
│   ├── package-graph.ts
│   └── adr.ts
│
├── __tests__/                      # 测试文件
│   ├── state-machine.test.ts       # (v0.34, 保留)
│   ├── cells.test.ts               # (v0.34, 保留)
│   ├── integration.test.ts         # (v0.34, 保留)
│   ├── cell-state-machine.test.ts  # [NEW v0.35] — 含模型测试
│   ├── invariant-checker.test.ts   # [NEW v0.35]
│   ├── dag-builder.test.ts         # [NEW v0.35]
│   ├── scheduler.test.ts           # [NEW v0.35]
│   ├── evidence-ledger.test.ts     # [NEW v0.35]
│   ├── harness-runner.test.ts      # [NEW v0.35]
│   └── evolution-e2e.test.ts       # [NEW v0.36]
│
└── fixtures/
    └── cell-states/                 # [NEW v0.35] — Cell 状态机测试 fixtures
        ├── planned/
        ├── branched/
        ├── executing/
        ├── harness-passing/
        ├── harness-failing/
        ├── merging/
        ├── merged/
        ├── failed/
        ├── retrying/
        └── cancelled/
```

### 2.3 模块通信

```
autoflow:report (v0.34)
  → readers → state-machine.ts → reporter
  → 输出: JSON / summary

autoflow:check (v0.35)
  → readers → state-machine.ts → invariant-checker.ts
  → 输出: exit 0 (pass) / exit 1 (fail) + violation list

autoflow:evolve (v0.36+)
  → readers → state-machine.ts → dag-builder.ts →
  → scheduler.ts → executor.ts → git-ops.ts → harness-runner.ts →
  → evidence-ledger.ts → event-sourcing.ts →
  → LOOP (back to readers if more cells)
```

**关键通信约束**（Kahn 原则 + Harel 广播）：

- 模块之间只通过函数返回值通信，无共享可变状态
- Evidence Ledger 是唯一的外部状态持久化点，也是 Harel 广播通道——每次状态转换写入一条事件
- 并行 Cell 通过各自的 JSON 文件通信（Kahn 队列），不发消息、不改共享内存
- 上游 Cell 状态变更 → 写入事件 → 下游 Cell 轮询 Ledger 感知 → 级联决策

### 2.4 v0.34 → v0.35 演进

```
v0.34: autoflow:report
       只读。输出 JSON/Summary。不做任何 change。

v0.35: autoflow:report (保留) + autoflow:check (新增)
       只读。输出 exit code。CI 阻断。
       新增: cell-state-machine, invariant-checker, harness-runner, evidence-ledger

v0.36: autoflow:report + autoflow:check + autoflow:evolve (新增)
       可写（需要 --allow-run --allow-write）。
       新增: executor, git-ops, dag-builder, scheduler, conflict-detector
```

---

## 3. Cell 生命周期状态机

采用 **Harel Statecharts** 风格：层次化 + 正交状态。

### 3.1 状态定义

```
CellLifecycle (层次化父状态)
│
├── planned              # Cell 已创建，等待调度
│   └── [event: cell-planned] → branched
│
├── branched             # git branch 已创建
│   └── [event: branch-created] → executing
│
├── executing            # AI 正在 branch 上写代码
│   ├── codegen          # LLM 正在生成代码
│   ├── committed        # 代码已 commit
│   └── [event: code-committed] → harness
│
├── harness (父状态)     # Harness 门禁验证
│   ├── pending          # CI 尚未触发
│   ├── running          # CI 正在运行
│   │   ├── fmt-running
│   │   ├── lint-running
│   │   ├── typecheck-running
│   │   ├── test-running
│   │   └── build-running
│   ├── passing          # 所有门禁通过
│   └── failing          # 至少一道门禁失败
│       └── [event: harness-failed] → failed
│
├── merging              # 正在 merge
│   └── [event: merge-success] → merged
│
├── merged               # 已 merge 到 dev
│   └── (终端状态)
│
├── failed (父状态)      # 执行失败
│   ├── retriable        # 可以重试
│   │   └── [event: retry-approved] → branched
│   ├── non-retriable    # 不可重试（如上游失败、文件冲突不可解）
│   │   └── (终端状态)
│   └── cancelled        # 被上游级联取消
│       └── (终端状态)
```

### 3.2 正交维度

每个 Cell 同时有三个独立的状态维度（Harel 正交）：

```typescript
interface CellState {
  /** 生命周期维度 */
  lifecycle: CellLifecycleState;

  /** 风险评估维度 */
  risk: 'low' | 'medium' | 'high' | 'critical';

  /** 依赖状态维度 */
  dependency: 'blocked' | 'ready' | 'completed';
}
```

这三个维度互不影响、各自独立演进。`lifecycle` 变化不改变 `risk`，`dependency` 变化不改变 `lifecycle`（除非依赖失败导致级联取消——这是事件驱动的副作用）。

### 3.3 合法转换表

```typescript
type CellEvent =
  | { type: 'plan' }
  | { type: 'branch'; branchName: string }
  | { type: 'code-committed'; commitSha: string }
  | { type: 'harness-passed'; runId: string }
  | { type: 'harness-failed'; runId: string; failures: HarnessFailure[] }
  | { type: 'merge-success'; mergeSha: string }
  | { type: 'merge-failed'; reason: string }
  | { type: 'retry'; round: number }
  | { type: 'upstream-failed'; upstreamId: string }
  | { type: 'max-retries-exceeded' }
  | { type: 'conflict-unresolvable'; conflictingCell: string };

// 合法转换映射 (lifecycle 维度)
const CELL_TRANSITIONS: Record<CellLifecycleState, CellLifecycleState[]> = {
  'planned': ['branched'],
  'branched': ['executing', 'cancelled'],
  'executing': ['harness:pending', 'failed:non-retriable'],
  'harness:pending': ['harness:running', 'cancelled'],
  'harness:running': ['harness:passing', 'harness:failing', 'cancelled'],
  'harness:passing': ['merging'],
  'harness:failing': ['failed:retriable', 'failed:non-retriable'],
  'merging': ['merged', 'failed:non-retriable'],
  'merged': [], // 终端
  'failed:retriable': ['branched', 'failed:non-retriable'], // 重试或放弃
  'failed:non-retriable': [], // 终端
  'cancelled': [], // 终端
};
```

### 3.4 事件驱动的转换触发

```typescript
function applyEvent(state: CellState, event: CellEvent): CellState {
  switch (event.type) {
    case 'plan':
      assertLifecycle(state, 'planned');
      return { ...state, lifecycle: 'branched' };

    case 'branch':
      assertLifecycle(state, 'planned');
      return { ...state, lifecycle: 'branched' };

    case 'code-committed':
      assertLifecycle(state, 'executing');
      return { ...state, lifecycle: 'harness:pending' };

    case 'harness-passed':
      assertLifecycle(state, 'harness:running');
      return { ...state, lifecycle: 'merging' };

    case 'harness-failed':
      assertLifecycle(state, 'harness:running');
      const retriable = event.failures.every((f) => f.retriable);
      return {
        ...state,
        lifecycle: retriable ? 'failed:retriable' : 'failed:non-retriable',
      };

    case 'upstream-failed':
      // 级联取消：上游失败 → 本 Cell 直接 cancelled
      return { ...state, lifecycle: 'cancelled' };

    case 'retry':
      assertLifecycle(state, 'failed:retriable');
      return { ...state, lifecycle: 'branched' };

    case 'max-retries-exceeded':
      assertLifecycle(state, 'failed:retriable');
      return { ...state, lifecycle: 'failed:non-retriable' };

    default:
      throw new IllegalTransitionError(state.lifecycle, event.type);
  }
}
```

### 3.5 重试策略

```
retry 条件:
  1. 失败原因不是"上游失败"（上游失败 = cancelled，不可重试）
  2. 失败原因不是"不可解的文件冲突"
  3. 重试次数 < MAX_RETRIES (默认 2)

retry-1:
  AI 读失败日志 → 分析原因 → 在同一 branch 上修复 → commit → harness → merge

retry-2 (最后一次):
  同上。如果还失败 → failed:non-retriable → 人工介入

级联场景:
  cell-01 (bump-version) 失败
    → cell-02 (changelog, 依赖 cell-01) → cancelled (不可重试，因为上游失败了)
    → cell-03 (fmt, 不依赖 cell-01) → 正常执行
```

---

## 4. Cell DAG 调度器

### 4.1 从 Evidence 到 DAG

```typescript
interface CellSpec {
  id: string;
  type: CellType;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  files: string[];         // 预期要编辑的文件
  requiresHumanReview: boolean;
}

interface DagNode {
  cell: CellSpec;
  dependencies: string[];  // 依赖的 cell id 列表
  dependents: string[];    // 被哪些 cell 依赖
  priority: number;        // 执行优先级 (0 = 最高)
}

// DAG 构建规则
function buildDag(evidence: AutoFlowEvidence): DagNode[] { ... }
```

**DAG 构建算法**：

1. 从 evidence drift 报告生成候选 Cell 列表：
   - `version-bump` cell: 当 STATUS 声明版本 ≠ 包图实际版本
   - `changelog` cell: 当 SOP task 完成但 changelog 缺失条目
   - `sop-check` cell: 当 SOP checkbox `[ ]` → `[x]` 完成后需要证据更新
   - `doc-align` cell: 当 STATUS/ROADMAP/SOP 之间存在版本不一致
   - `fmt-fix` cell: 当 `deno fmt --check` 失败
   - `lint-fix` cell: 当 `deno lint` 失败（且可自动修复）

2. 为每个 Cell 计算 `files`（预期修改的文件列表）

3. 构建依赖：
   - `dep(cell-A, cell-B)` 当且仅当 `cell-A.files ∩ cell-B.files ≠ ∅`
   - OR `cell-A.type = 'version-bump'` 且 `cell-B.needsAlignedVersion = true`（如 changelog → 需要 bump 后的版本号）

4. 拓扑排序 → 并行组：
   - 同层无依赖 Cell 可以并行
   - 有依赖的 Cell 必须等待上游完成

```
示例 DAG:

cell-01 (version-bump) [files: 19 deno.json, STATUS.md]
  ├── cell-02 (changelog)   [files: docs/changelog/]        ← depends on cell-01
  ├── cell-03 (doc-align)   [files: docs/status/STATUS.md]   ← depends on cell-01 (same file)
  └── cell-04 (fmt-fix)     [files: packages/*/src/**]        ← parallel (no shared files)

执行组:
  Wave 1: [cell-01]
  Wave 2: [cell-02, cell-03, cell-04] (cell-02 和 cell-03 都依赖 cell-01，
           但 cell-02 和 cell-03 不共享文件，可以并行)
```

### 4.2 并行 vs 串行策略

```typescript
interface Schedule {
  waves: CellId[][]; // 每个 wave 内的 cell 并行执行
}

function schedule(dag: DagNode[]): Schedule {
  // 1. 拓扑排序
  const sorted = topologicalSort(dag);

  // 2. 分组：同一层级无相互依赖的 cell 归入同一 wave
  const waves: CellId[][] = [];
  let wave: CellId[] = [];

  for (const node of sorted) {
    // 检查 node 是否依赖当前 wave 中的任何 cell
    const conflictsWithCurrentWave = node.dependencies.some(
      (dep) => wave.includes(dep),
    );

    if (conflictsWithCurrentWave || wave.length >= MAX_PARALLEL) {
      waves.push(wave);
      wave = [];
    }
    wave.push(node.cell.id);
  }
  if (wave.length > 0) waves.push(wave);

  return { waves };
}
```

**MAX_PARALLEL 限制**：默认 3。原因：CI 资源有限 + 太多并行 branch 增加 merge conflict 概率。

### 4.3 冲突检测 (Kahn 原则)

```typescript
interface ConflictReport {
  conflicts: Conflict[];
  safeToParallel: boolean;
}

interface Conflict {
  cellA: string;
  cellB: string;
  overlappingFiles: string[];
}

function detectConflicts(dag: DagNode[]): ConflictReport {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < dag.length; i++) {
    for (let j = i + 1; j < dag.length; j++) {
      const overlappingFiles = dag[i].cell.files.filter(
        (f) => dag[j].cell.files.includes(f),
      );

      if (overlappingFiles.length > 0) {
        conflicts.push({
          cellA: dag[i].cell.id,
          cellB: dag[j].cell.id,
          overlappingFiles,
        });
      }
    }
  }

  return {
    conflicts,
    safeToParallel: conflicts.length === 0,
  };
}
```

**如果有冲突**：

1. 优先：合并两个 Cell 为一个（一个 Cell 做两件事）
2. 次选：串行化 → 在 DAG 中添加依赖 → cell-B depends on cell-A
3. 不可行：标记为需人工处理

### 4.4 调度算法伪代码

```typescript
async function runScheduler(dag: DagNode[], options: SchedulerOptions): Promise<void> {
  const schedule = schedule(dag);
  const ledger = new EvidenceLedger(options.ledgerDir);

  for (const wave of schedule.waves) {
    // 并行启动 wave 内的所有 cell
    const promises = wave.map((cellId) => {
      const node = dag.find((n) => n.cell.id === cellId)!;

      // 检查依赖：所有上游都 merged 了吗？
      const upstreamStates = node.dependencies.map(
        (depId) => ledger.getCellState(depId),
      );
      const allUpstreamMerged = upstreamStates.every(
        (s) => s.lifecycle === 'merged',
      );

      if (!allUpstreamMerged) {
        ledger.recordEvent(cellId, {
          type: 'upstream-failed',
          upstreamId: upstreamStates.find((s) => s.lifecycle !== 'merged')!.cellId,
        });
        return; // 级联取消
      }

      // 启动 cell 执行
      return executeCell(cellId, node.cell, options);
    });

    // 等待 wave 内所有 cell 完成
    await Promise.allSettled(promises);

    // 检查 wave 结果：有失败的吗？需要重试吗？
    for (const cellId of wave) {
      const state = ledger.getCellState(cellId);
      if (state.lifecycle === 'failed:retriable' && state.retryCount < options.maxRetries) {
        // 下一轮重试（在后续 wave 中插入）
        schedule.waves.push([cellId]);
      }
    }
  }
}
```

---

## 5. 证据模型

> Harel 的广播通信映射到我们：每次状态转换 = 一条 Evidence 事件写入 Ledger。事件不是可选的——是状态机的输出。

```typescript
// Harel 广播映射
// Cell 状态转换 ──broadcast──→ Evidence Event ──write──→ Evidence Ledger
//
//   executing → harness:running  → event: 'harness-started'
//   harness:running → harness:passing → event: 'all-gates-green'
//   merging → merged              → event: 'cell-merged'
//   harness:running → harness:failing → event: 'gate-failed' (含具体 gate)
//
// 下游 Cell 通过轮询 Ledger 感知这些事件 → 做出级联决策
```

### 5.1 证据类型

```typescript
type Evidence =
  | CellCreated
  | BranchCreated
  | CodeCommitted
  | HarnessStarted
  | HarnessGateResult
  | HarnessCompleted
  | MergeStarted
  | MergeCompleted
  | CellFailed
  | CellRetried
  | CellCancelled
  | CellMerged;

interface CellCreated {
  type: 'cell-created';
  timestamp: string; // ISO 8601
  cellId: string;
  cellType: CellType;
  risk: RiskLevel;
  branchName: string;
  targetVersion: string;
}

interface BranchCreated {
  type: 'branch-created';
  timestamp: string;
  cellId: string;
  branchName: string; // autoflow/cell-v0.35.0-001
  baseCommit: string; // SHA
}

interface CodeCommitted {
  type: 'code-committed';
  timestamp: string;
  cellId: string;
  commitSha: string;
  filesChanged: number;
  additions: number;
  deletions: number;
}

interface HarnessGateResult {
  type: 'harness-gate-result';
  timestamp: string;
  cellId: string;
  runId: string;
  gate: string; // 'fmt:check' | 'lint' | 'typecheck' | 'test' | ...
  passed: boolean;
  durationMs: number;
  output?: string; // 失败时的错误输出（截断）
}

interface CellMerged {
  type: 'cell-merged';
  timestamp: string;
  cellId: string;
  mergeSha: string;
  versionCycle: string; // 'v0.35.0'
}
```

### 5.2 证据账本存储

```typescript
// 文件结构
// docs/autoflow/cells/cell-v0.35.0-001/
//   ├── events.jsonl     ← Event Sourcing 事件流 (append-only)
//   └── state.json        ← 派生状态快照 (可从 events 重建)

class EvidenceLedger {
  private ledgerDir: string;

  constructor(ledgerDir: string) {
    this.ledgerDir = ledgerDir;
  }

  /** 追一条事件到事件流 (Kahn: 写入通信通道) */
  appendEvent(cellId: string, event: Evidence): void {
    const eventsPath = `${this.ledgerDir}/${cellId}/events.jsonl`;
    const dir = path.dirname(eventsPath);
    if (!existsSync(dir)) Deno.mkdirSync(dir, { recursive: true });

    const line = JSON.stringify(event) + '\n';
    Deno.writeTextFileSync(eventsPath, line, { append: true });

    // 更新派生状态
    this.rebuildState(cellId);
  }

  /** 从事件流重建 Cell 状态 (Durable Execution: Replay) */
  rebuildState(cellId: string): CellState {
    const events = this.readAllEvents(cellId);
    let state: CellState = initialCellState(cellId);

    for (const event of events) {
      state = applyCellEvent(state, event);
    }

    // 缓存派生状态
    const statePath = `${this.ledgerDir}/${cellId}/state.json`;
    Deno.writeTextFileSync(statePath, JSON.stringify(state, null, 2));

    return state;
  }

  /** 读取所有事件 */
  readAllEvents(cellId: string): Evidence[] {
    const eventsPath = `${this.ledgerDir}/${cellId}/events.jsonl`;
    try {
      const text = Deno.readTextFileSync(eventsPath);
      return text.trim().split('\n').filter(Boolean).map(JSON.parse);
    } catch {
      return [];
    }
  }

  /** 获取当前状态（优先读缓存） */
  getCellState(cellId: string): CellState {
    const statePath = `${this.ledgerDir}/${cellId}/state.json`;
    try {
      return JSON.parse(Deno.readTextFileSync(statePath));
    } catch {
      return this.rebuildState(cellId);
    }
  }

  /** 列出所有 cell */
  listCells(): string[] {
    const dirs = [...Deno.readDirSync(this.ledgerDir)];
    return dirs.filter((d) => d.isDirectory).map((d) => d.name);
  }
}
```

### 5.3 时态不变量 (Pnueli)

```typescript
// 不变量定义
interface Invariant {
  id: string;
  description: string; // 人类可读
  formula: InvariantFormula; // 执行引擎可读
  severity: 'error' | 'warning';
}

type InvariantFormula =
  | Always<InvariantFormula> // □P
  | Eventually<InvariantFormula> // ◇P
  | Implies<InvariantFormula, InvariantFormula> // P → Q
  | Not<InvariantFormula> // ¬P
  | Predicate; // 原子谓词

interface Predicate {
  type: 'predicate';
  name: string;
  params: Record<string, unknown>;
}

// 不变量注册表
const INVARIANTS: Invariant[] = [
  {
    id: 'I-CELL-MERGE-REQUIRES-HARNESS',
    description: 'Cell 不能在 harness 全绿之前 merge',
    formula: {
      type: 'always',
      operand: {
        type: 'implies',
        antecedent: { type: 'predicate', name: 'cell-is-merging', params: {} },
        consequent: { type: 'predicate', name: 'harness-all-passing', params: {} },
      },
    },
    severity: 'error',
  },
  {
    id: 'I-UPSTREAM-FAIL-CANCELS-DOWNSTREAM',
    description: '上游 cell 失败 → 下游 cell 取消',
    formula: {
      type: 'always',
      operand: {
        type: 'implies',
        antecedent: { type: 'predicate', name: 'upstream-failed', params: {} },
        consequent: { type: 'predicate', name: 'downstream-cancelled', params: {} },
      },
    },
    severity: 'error',
  },
  {
    id: 'I-VERSION-ALIGNMENT',
    description: '所有包版本必须与 STATUS.md 声明一致',
    formula: {
      type: 'always',
      operand: { type: 'predicate', name: 'all-packages-aligned', params: {} },
    },
    severity: 'error',
  },
  {
    id: 'I-NO-SELF-MODIFICATION',
    description: 'autoflow Cell 不能修改 tools/autoflow/ 和 .github/workflows/',
    formula: {
      type: 'always',
      operand: {
        type: 'not',
        operand: { type: 'predicate', name: 'cell-modifies-harness-files', params: {} },
      },
    },
    severity: 'error',
  },
  {
    id: 'I-CELL-EVENTUALLY-COMPLETES',
    description: '一旦创建，Cell 最终必须进入 merged/failed/cancelled',
    formula: {
      type: 'always',
      operand: {
        type: 'implies',
        antecedent: { type: 'predicate', name: 'cell-created', params: {} },
        consequent: {
          type: 'eventually',
          operand: { type: 'predicate', name: 'cell-terminal', params: {} },
        },
      },
    },
    severity: 'warning',
  },
];

// 不变量检查器
class InvariantChecker {
  checkAll(ledger: EvidenceLedger): InvariantCheckReport {
    const cells = ledger.listCells();
    const violations: InvariantViolation[] = [];

    for (const invariant of INVARIANTS) {
      for (const cellId of cells) {
        const state = ledger.getCellState(cellId);
        if (!this.evaluate(invariant.formula, state, ledger)) {
          violations.push({
            invariantId: invariant.id,
            cellId,
            severity: invariant.severity,
            description: invariant.description,
          });
        }
      }
    }

    return {
      passed: violations.filter((v) => v.severity === 'error').length === 0,
      violations,
    };
  }

  private evaluate(
    formula: InvariantFormula,
    state: CellState,
    ledger: EvidenceLedger,
  ): boolean {
    // 简化的不变量求值引擎
    // 完整实现需要 LTL model checker 或运行时验证
    switch (formula.type) {
      case 'predicate':
        return PREDICATE_REGISTRY[formula.name](state, ledger, formula.params);
      case 'not':
        return !this.evaluate(formula.operand, state, ledger);
      case 'implies':
        return !this.evaluate(formula.antecedent, state, ledger) ||
          this.evaluate(formula.consequent, state, ledger);
      case 'always':
        // 运行时：检查当前状态 + 历史事件链
        return this.checkHistory(formula.operand, state, ledger);
      case 'eventually':
        // 运行时：检查未来事件（简化：检查事件流中是否出现过）
        return ledger.readAllEvents(state.cellId).some(
          (e) => e.type === formula.operand.type,
        );
    }
  }
}
```

---

## 6. 演化循环

### 6.1 MAPE-K 映射

> Kephart & Chess 的关键洞察不在四个步骤，而在 **Knowledge 作为闭环的核心**。在大多数监控系统中，Monitor → Alert → 人处理 → 结束——人走了，知识也走了。MAPE-K 要求每次决策回写到 Knowledge，形成持续学习闭环。
> 我们的 Knowledge 层 = Governance 文档 + Evidence Ledger + Invariant Registry + Metrics History。它就是 von Neumann 的"指令带"——系统的自描述，必须完整到足以让系统复制自己（启动新版本周期）。

```
┌──────────────────────────────────────────────────────────────┐
│                       MAPE-K LOOP                            │
│                                                              │
│  MONITOR                    ANALYZE                          │
│  ┌─────────────────┐       ┌──────────────────┐             │
│  │ autoflow:report │──────→│ state-machine.ts │             │
│  │ - STATUS/ROADMAP│       │ determineState() │             │
│  │ - SOP/NextVer   │       │ detectDrift()    │             │
│  │ - package-graph │       │ classifyRisk()   │             │
│  │ - ADR           │       └────────┬─────────┘             │
│  └─────────────────┘                │                       │
│                                     ▼                       │
│  KNOWLEDGE                    PLAN                          │
│  ┌─────────────────┐       ┌──────────────────┐             │
│  │ Governance docs │◄──────│ dag-builder.ts   │             │
│  │ Evidence Ledger │       │ scheduler.ts     │             │
│  │ Invariant reg.  │       │ conflict-detector│             │
│  │ Metrics history │       └────────┬─────────┘             │
│  └────────┬────────┘                │                       │
│           ▲                         ▼                       │
│           │              EXECUTE                            │
│           │              ┌──────────────────┐               │
│           └──────────────│ executor.ts      │               │
│                          │ git-ops.ts       │               │
│                          │ harness-runner   │               │
│                          │ evidence-ledger  │               │
│                          └──────────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Rainbow 映射

| Rainbow 组件           | openElement 实现                                  |
| ---------------------- | ------------------------------------------------- |
| Architecture Model     | Governance 文档 (STATUS.md, ROADMAP.md, SOP, ADR) |
| Model Manager          | `readers/` + `autoflow:report` pipeline           |
| Architecture Evaluator | `state-machine.ts` (determineState)               |
| Constraint Analyzer    | `invariant-checker.ts` + Harness gates            |
| Adaptation Engine      | `dag-builder.ts` + `scheduler.ts`                 |
| Strategy Executor      | `executor.ts` + `git-ops.ts`                      |
| System                 | 代码仓库本身                                      |

**Rainbow 的局限我们解决了**：Rainbow 假设架构模型是静态的、预先写好的。我们的 Cell 在修正代码的同时也更新 Governance 文档（bump cell 更新 STATUS.md 版本行，changelog cell 更新 ROADMAP.md 状态列）。**文档和代码同步演化。**

### 6.3 AlphaEvolve 映射

| AlphaEvolve       | openElement                                            |
| ----------------- | ------------------------------------------------------ |
| Prompt Sampler    | `autoflow:report` → 发现 drift → 生成候选 Cell         |
| LLM (Flash + Pro) | AI 在 branch 上写代码 (CodeAct 风格)                   |
| Evaluator         | Harness (fmt/lint/typecheck/test/build/arch/graph/...) |
| Programs DB       | Cell Evidence Ledger (events.jsonl)                    |
| 进化算法          | DAG 依赖 + 状态机：失败 → 修复 → 重试                  |
| Fitness metric    | 所有门禁全绿 = fitness 满分                            |

### 6.4 演化质量度量

```typescript
interface EvolutionMetrics {
  versionCycle: string;

  // AlphaEvolve-style fitness
  firstPassRate: number; // Cell 一次通过比例 (0-1)
  avgRetriesPerCell: number; // 平均修复轮次
  totalCellsAttempted: number;
  totalCellsMerged: number;
  totalCellsFailed: number;

  // 速度度量
  driftDetectionLatencyMs: number; // drift 被检测到的延迟
  fromDriftToMergeMs: number; // 从检测到修复合入的延迟
  totalCycleDurationMs: number; // 版本周期总耗时

  // 质量度量
  harnessPassRate: { [gateName: string]: number };
  mergeConflictsEncountered: number;
  rollbacks: number; // 发布了但需撤回的次数

  // 跨版本追踪
  complexityTrend: number[]; // 治理文档行数 / SOP 任务数 趋势
  driftRecurrenceRate: number; // 某类 drift 重复出现的频率
}
```

> 对比 SWE-bench（只度量"代码对不对"，单文件/单 issue）：我们的度量覆盖全部 12 道门禁 + 跨版本趋势。SWE-bench 的教训：AI 会过拟合特定模式 → **我们不优化模型，优化 Governance 文档质量**。openElement 自己就是试验田——不跑标准数据集，自己演化几个版本来自证能力。

---

## 7. 安全与非目标

### 7.1 必须人工介入的场景

| 场景             | 原因                                                | 触发条件                                                        |
| ---------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| ADR 写入         | 属于 Brooks 的本质困难——架构 trade-off 需要人的判断 | Cell type = `write-adr` → 强制 human review                     |
| 公共 API 变更    | 影响所有消费者的 breaking change                    | `risk = 'critical'` → 强制 human review                         |
| 删除包           | 不可逆操作                                          | `risk = 'critical'` → 强制 human review                         |
| 发布 tag         | 一旦 push 就不可删除（GitHub 政策）                 | Cell type = `tag-release` → 强制 human confirmation             |
| Harness 自身修改 | Harness 是锁，修改锁需要钥匙                        | 任何 Cell 修改 `tools/autoflow/` 或 `.github/workflows/` → 拒绝 |
| 连续重试失败     | 系统卡在重复失败的循环                              | retry count ≥ MAX_RETRIES → 停止，标记 `failed:non-retriable`   |
| 冲突不可解       | 两个 Cell 改了同一个文件的同一区域                  | conflict-detector 报告 → 停止，人工解决                         |

### 7.2 永远不能自动化的操作

```
❌ 修改 tools/autoflow/ 下的任何文件
❌ 修改 .github/workflows/ 下的任何文件
❌ 修改 deno.json 中的 tasks 定义
❌ git push --force 或 git reset --hard main
❌ 发布 tag (可以生成 tag 草稿，但需人工确认)
❌ 删除/归档包
❌ 修改 public API contract (需要 ADR)
❌ 覆盖人工 review 拒绝的决策
```

### 7.3 优雅降级

| 故障场景             | 降级行为                                                              |
| -------------------- | --------------------------------------------------------------------- |
| CI 不可用            | Harness 状态保持 `pending`，Cell 不 merge，等待 CI 恢复               |
| Evidence Ledger 损坏 | 从 `events.jsonl` 重建（Durable Execution replay），报 warning        |
| Git remote 不可达    | Cell 不执行，报 `branch-creation-failed`                              |
| LLM (AI) 不可用      | 只 run `autoflow:report` + `autoflow:check`，不 run `autoflow:evolve` |
| 磁盘空间不足         | 拒绝创建新的 cell branch，报 `resources-exhausted`                    |

---

## 8. 版本路线图

> 此节已同步至 `docs/roadmap/ROADMAP.md` 和 `docs/status/STATUS.md`。
> ADR-0088 是此路线图的正式决策记录。

### v0.35.0 — AutoFlow2 Harness Gate

**目标**：让 autoflow 从"参谋"变成"守门员"。CI 阻断。

**交付物**：

- `cell-state-machine.ts` — Harel 12 状态 + 3 正交维度 + 广播事件
- `invariant-checker.ts` — 8 条 Pnueli 时态不变量
- `evidence-ledger.ts` + `event-sourcing.ts` — Durable Execution
- `harness-runner.ts` — 12 gate 统一运行器
- `mod-check.ts` — CLI: exit 0/1
- Model-Based Testing (fast-check)
- CI 集成

**论文支撑**：C5, 01, 03, 04, 02, 06

### v0.36.0 — AutoFlow2 Cell Execution + TDD + Cross-Review

**目标**：让 autoflow 能自己修复 drift。Cell 执行三子阶段。

**交付物**：

- `executor.ts` — Cell 执行引擎（testgen → implement → review）
- `git-ops.ts` — Git 操作封装（Kahn 隔离）
- `dag-builder.ts` — evidence → DAG
- `scheduler.ts` — 拓扑排序 + wave 并行 + 级联取消
- `conflict-detector.ts` — 文件冲突 → 串行化
- `deno task autoflow:evolve --dry-run`

**论文支撑**：R1/R7 (TDD+LLM), R2 (CodeAgent EMNLP 2024), R3/R9/R11/R12 (Self-Healing/APR ICSE 2025), C6 (Kahn), C1 (von Neumann), 05 (Git)

### v0.37.0 — AutoFlow2 Evolution Loop

**目标**：闭环 MAPE-K。多版本连续运行。

**交付物**：

- `evolution-tracker.ts` — 跨版本度量
- `metrics.ts` — AlphaEvolve fitness + SWE-bench 多维
- `deno task autoflow:evolve` — 正式启用（允许 merge）
- 版本周期自动推进
- Evolution quality trend report

**论文支撑**：A1 (AlphaEvolve), 09 (SWE-bench), 01 (MAPE-K Knowledge), C3 (Lehman)

### v0.38.0 — Rendering Runtime + Deployment

**目标**：恢复产品功能。AutoFlow 管理机械操作。

**论文支撑**：R4 (Signal-First), DSD WHATWG, Islands Architecture

### v0.39.0 — Server/Data/UI Product Closure

**论文支撑**：AutoFlow evidence from v0.35-0.37

### v0.40.0 — Public Surface Reset (AI-Assisted)

**Human decision, AI-generated evidence analysis.**

**论文支撑**：R5/R6 (AI architecture: 85% human-in-the-loop)

### v0.41.0 — v1 Release Candidate

### v1.0.0 — Stable Engine + AutoFlow Default

**条件**：至少 3 个自主版本周期 (v0.35-0.37) 的证据。

### 只能在运行几个版本周期后回答的问题

1. 最优 MAX_PARALLEL 值
2. 最高频 Cell 类型
3. AI 自动修复的实际成功率
4. 不变量误报率
5. 演化质量是否真的在跨版本改善
6. 最优 version cycle trigger 策略
7. LLM review 在真实 autoflow 场景下的准确率

---

## 9. v0.35 具体实施计划

### 9.1 文件结构

```
tools/autoflow/
├── mod.ts                          # (保留) autoflow:report
├── mod-check.ts                    # [NEW] autoflow:check CLI
│
├── state-machine.ts                # (保留) workflow 状态机
├── cell-state-machine.ts           # [NEW] Cell 生命周期状态机
├── invariant-checker.ts            # [NEW] 时态不变量检查器
│
├── evidence-ledger.ts              # [NEW] 证据账本
├── event-sourcing.ts               # [NEW] Event Sourcing 核心
├── harness-runner.ts               # [NEW] Harness 门禁运行器
│
├── cells.ts                        # (保留, 可能扩展)
├── reporter.ts                     # (保留)
│
├── readers/                        # (保留)
│   └── ... (同 v0.34)
│
├── __tests__/
│   ├── cell-state-machine.test.ts  # [NEW]
│   ├── invariant-checker.test.ts   # [NEW]
│   ├── evidence-ledger.test.ts     # [NEW]
│   ├── event-sourcing.test.ts      # [NEW]
│   ├── harness-runner.test.ts      # [NEW]
│   └── (保留 v0.34 测试)
│
└── fixtures/
    └── cell-states/                 # [NEW]
        ├── planned/
        │   └── events.jsonl        # 空文件
        ├── executing/
        │   └── events.jsonl        # cell-created → branch-created
        ├── harness-passing/
        │   └── events.jsonl        # ... → code-committed → all gates pass
        ├── harness-failing/
        │   └── events.jsonl        # ... → code-committed → lint failed
        └── merged/
            └── events.jsonl        # ... → merge-success
```

### 9.2 Deno 任务

```json
{
  "tasks": {
    "autoflow:report": "deno run --allow-read tools/autoflow/mod.ts",
    "autoflow:report:json": "deno run --allow-read tools/autoflow/mod.ts --json",
    "autoflow:check": "deno run --allow-read tools/autoflow/mod-check.ts",
    "autoflow:check:strict": "deno run --allow-read tools/autoflow/mod-check.ts --strict",
    "autoflow:test": "deno test --allow-read --allow-write tools/autoflow/__tests__/",
    "autoflow:test:model": "deno test --allow-read --allow-write tools/autoflow/__tests__/cell-state-machine.test.ts"
  }
}
```

### 9.3 类型签名汇总

```typescript
// ---- cell-state-machine.ts ----

type CellLifecycleState =
  | 'planned'
  | 'branched'
  | 'executing'
  | 'harness:pending'
  | 'harness:running'
  | 'harness:passing'
  | 'harness:failing'
  | 'merging'
  | 'merged'
  | 'failed:retriable'
  | 'failed:non-retriable'
  | 'cancelled';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

type CellType =
  | 'version-bump'
  | 'changelog'
  | 'sop-check'
  | 'doc-align'
  | 'fmt-fix'
  | 'lint-fix'
  | 'typecheck-fix'
  | 'test-add'
  | 'readme-update'
  | 'release-note'
  | 'dep-update'
  | 'adr-write'; // human review required

interface CellState {
  cellId: string;
  lifecycle: CellLifecycleState;
  risk: RiskLevel;
  dependency: 'blocked' | 'ready' | 'completed';
  cellType: CellType;
  versionCycle: string;
  retryCount: number;
  branchName: string | null;
  lastCommitSha: string | null;
  harnessResults: HarnessGateResult[];
  createdAt: string;
  updatedAt: string;
}

interface CellEvent {
  type: CellEventType;
  timestamp: string;
  payload: Record<string, unknown>;
}

function createCellState(type: CellType, version: string, risk: RiskLevel): CellState;
function applyCellEvent(state: CellState, event: CellEvent): CellState;
function isTerminal(state: CellState): boolean;
function canRetry(state: CellState): boolean;

// ---- invariant-checker.ts ----

interface Invariant {
  id: string;
  description: string;
  formula: InvariantFormula;
  severity: 'error' | 'warning';
}

interface InvariantCheckReport {
  passed: boolean; // 是否有 severity='error' 的违例
  violations: InvariantViolation[];
}

interface InvariantViolation {
  invariantId: string;
  cellId?: string;
  severity: 'error' | 'warning';
  description: string;
  detail?: string;
}

function checkAllInvariants(ledger: EvidenceLedger, projectRoot: string): InvariantCheckReport;

// ---- evidence-ledger.ts ----

class EvidenceLedger {
  constructor(ledgerDir: string);
  appendEvent(cellId: string, event: CellEvent): void;
  getCellState(cellId: string): CellState;
  rebuildState(cellId: string): CellState;
  listCells(): string[];
  readAllEvents(cellId: string): CellEvent[];
  getCellsForCycle(version: string): CellState[];
}

// ---- harness-runner.ts ----

interface HarnessGateResult {
  gate: string; // 'fmt:check' | 'lint' | 'typecheck' | 'test' | ...
  passed: boolean;
  durationMs: number;
  output: string; // stdout (截断)
}

interface HarnessRunResult {
  allPassed: boolean;
  failedGates: HarnessGateResult[];
  passedGates: HarnessGateResult[];
  totalDurationMs: number;
}

function runAllGates(projectRoot: string): HarnessRunResult;
function runSpecificGate(projectRoot: string, gate: string): HarnessGateResult;
```

### 9.4 测试策略

#### 9.4.1 Model-Based Testing (来自论文 06)

```typescript
// cell-state-machine.test.ts

import { fc, testProp } from 'jsr:@std/testing/quickcheck'; // or npm:fast-check
import {
  applyCellEvent,
  CELL_TRANSITIONS,
  type CellEvent,
  type CellLifecycleState,
  createCellState,
} from '../cell-state-machine.ts';

// 定义合法的命令（操作）
class PlanCellCommand {
  check(state: CellState): boolean {
    return state.lifecycle === 'planned';
  }
  run(state: CellState): CellState {
    return applyCellEvent(state, {
      type: 'plan',
      timestamp: new Date().toISOString(),
      payload: {},
    });
  }
  toString() {
    return 'plan';
  }
}

class HarnessPassCommand {
  check(state: CellState): boolean {
    return state.lifecycle === 'harness:running';
  }
  run(state: CellState): CellState {
    return applyCellEvent(state, {
      type: 'harness-passed',
      timestamp: new Date().toISOString(),
      payload: { runId: 'ci-run-1' },
    });
  }
  toString() {
    return 'harness-pass';
  }
}

// ... 为每个合法事件定义一个 Command 类

// 模型级不变式
const CELL_INVARIANT = {
  // 终端状态不可再变迁
  'terminal-stable': (state: CellState) => {
    const terminals: CellLifecycleState[] = ['merged', 'failed:non-retriable', 'cancelled'];
    // 终端状态上没有可用的 command (check 全部返回 false)
  },
  // lifecycle 不能是 undefined
  'lifecycle-defined': (state: CellState) => {
    return state.lifecycle !== undefined;
  },
  // retry count 只能增加
  'retry-monotonic': (before: CellState, after: CellState) => {
    return after.retryCount >= before.retryCount;
  },
};

// 模型测试：自动生成所有合法命令序列并验证不变式
Deno.test('cell-state-machine: model-based — all paths valid', () => {
  const model = {
    initialState: createCellState('version-bump', 'v0.35.0', 'low'),
    commands: [
      new PlanCellCommand(),
      new BranchCommand(),
      new CodeCommitCommand(),
      new HarnessPassCommand(),
      new HarnessFailCommand(),
      new MergeCommand(),
      new RetryCommand(),
      new UpstreamFailCommand(),
    ],
    invariants: CELL_INVARIANT,
  };

  // fast-check 自动生成 100+ 个测试路径
  fc.assert(
    fc.property(
      fc.commands(model.commands, { maxCommands: 10 }),
      (cmds) => {
        fc.modelRun(() => ({
          model: { ...model.initialState },
          real: { ...model.initialState },
        }), cmds);
      },
    ),
  );
});
```

#### 9.4.2 传统单元测试

```typescript
// 覆盖所有合法转换
for (const [from, toList] of Object.entries(CELL_TRANSITIONS)) {
  for (const to of toList) {
    Deno.test(`cell: ${from} → ${to} is legal`, () => {
      assertCanTransition(from, to);
    });
  }
}

// 覆盖每个终端状态不再变迁
for (const terminal of ['merged', 'failed:non-retriable', 'cancelled']) {
  Deno.test(`cell: ${terminal} is terminal — no transitions`, () => {
    for (const state of ALL_STATES) {
      assertFalse(canTransition(terminal, state));
    }
  });
}

// 覆盖重试逻辑
Deno.test('cell: retry count increments', () => { ... });
Deno.test('cell: max retries exceeded → non-retriable', () => { ... });
Deno.test('cell: upstream failure → cancelled (not retriable)', () => { ... });
```

#### 9.4.3 Fixture 测试

```
fixtures/cell-states/planned/events.jsonl     → 空
fixtures/cell-states/executing/events.jsonl   → cell-created, branch-created
fixtures/cell-states/harness-passing/events.jsonl → ..., code-committed, harness-gate-result × 12 all pass
fixtures/cell-states/harness-failing/events.jsonl → ..., code-committed, lint: fail
fixtures/cell-states/merged/events.jsonl      → ..., merge-success
```

每个 fixture 包含一个 `events.jsonl` 文件和期望的 `state.json`。

```typescript
Deno.test('ledger: replay "executing" fixture', () => {
  const ledger = new EvidenceLedger('fixtures/cell-states/executing/');
  const events = ledger.readAllEvents('cell-001');
  assertEquals(events.length, 2);
  assertEquals(events[0].type, 'cell-created');
  assertEquals(events[1].type, 'branch-created');

  const state = ledger.rebuildState('cell-001');
  assertEquals(state.lifecycle, 'executing');
});
```

### 9.5 mod-check.ts 骨架

```typescript
/**
 * AutoFlow2 Harness Gate — v0.35.0
 *
 * Reads governance documents and checks invariants.
 * Exit 0 = all invariants pass, Exit 1 = violations found.
 *
 * Usage:
 *   deno run --allow-read tools/autoflow/mod-check.ts
 *   deno run --allow-read tools/autoflow/mod-check.ts --strict  # warnings → errors
 */

import { readStatus } from './readers/status.ts';
import { readSop } from './readers/sop.ts';
import { readNextVersion } from './readers/nextversion.ts';
import { readRoadmap } from './readers/roadmap.ts';
import { readPackageGraph } from './readers/package-graph.ts';
import { checkAllInvariants } from './invariant-checker.ts';
import { EvidenceLedger } from './evidence-ledger.ts';

function main(): void {
  const strict = Deno.args.includes('--strict');
  const rootDir = Deno.cwd();
  const ledgerDir = `${rootDir}/docs/autoflow/cells`;

  // Check governance invariants (real-time)
  const status = readStatus(rootDir);
  const sop = readSop(rootDir, status.currentVersion);
  const nextVersion = readNextVersion(rootDir, status.nextVersionPath);
  const roadmap = readRoadmap(rootDir);
  const packageGraph = readPackageGraph(rootDir, status.currentVersion);

  // ... build evidence from readers ...

  // Check cell ledger invariants (historical)
  const ledger = new EvidenceLedger(ledgerDir);
  const report = checkAllInvariants(ledger, rootDir);

  if (report.passed) {
    console.log('✅ autoflow:check passed');
    console.log(`   ${report.violations.filter((v) => v.severity === 'warning').length} warnings`);
    Deno.exit(0);
  } else {
    const errors = report.violations.filter((v) => v.severity === 'error');
    console.error(`❌ autoflow:check failed: ${errors.length} violation(s)`);
    for (const v of errors) {
      console.error(`   [${v.invariantId}] ${v.description}`);
    }
    Deno.exit(1);
  }
}

main();
```

---

## 附录 A: 参考论文映射表

| 论文                   | 核心机制                    | 架构中的直接使用                                     |
| ---------------------- | --------------------------- | ---------------------------------------------------- |
| C1 von Neumann         | 自描述指令带 + 通用构造器   | Governance = 指令带；Cell 必须能创建 Cell            |
| C2 Langton/Wolfram     | Class 4 涌现 + 计算等价原理 | Cell ≤ 12 种；不可预测但 Harness 可控                |
| C3 Lehman              | 熵增对抗                    | Harness = 持续熵检测；周期性剪枝 (v0.38)             |
| C4 Brooks              | 本质/偶然分离               | Cell risk 分类 = Brooks 边界                         |
| C5 Pnueli              | 时态不变量                  | invariant-checker.ts；8 条不变式；跨时间约束         |
| C6 Kahn                | 确定性并发 + 队列通信       | Evidence Ledger = 通信通道；冲突串行化               |
| 01 MAPE-K              | Knowledge 作为闭环核心      | 整个系统 = MAPE-K；OpenHands(一次性) vs 我们(闭环)   |
| 02 Harel               | 层次化 + 正交 + 广播        | cell-state-machine.ts；Evidence Ledger = 广播通道    |
| 03 Rainbow             | 架构驱动自适应              | Governance = Architecture Model；Cell 同步更新文档   |
| 04 Durable Execution   | 事件溯源 + Replay           | evidence-ledger.ts + event-sourcing.ts；崩溃恢复     |
| 05 Git Internals       | 分支隔离 + 快照回滚         | git-ops.ts；branch = Cell 安全气囊                   |
| 06 Model-Based Testing | 模型生成测试                | cell-state-machine.test.ts 的 model-based 测试       |
| 07 Semantic Release    | 证据驱动发布                | Cell + Harness 全绿 = 发布证据                       |
| 08 OpenHands           | CodeAct + 三大局限          | Cell 执行用 CodeAct；我们解决持久化/记忆/Harness     |
| 09 SWE-bench           | 多维度度量 + 过拟合警示     | metrics.ts 12 维度；自己当试验田；优化文档不优化模型 |
| A1 AlphaEvolve         | 进化循环结构                | 演化循环结构参考；Harness = fitness function         |

## 附录 B: 不变量注册表（全部 8 条）

| ID                                 | 不变量                                              | 类型    | 映射到 C5    |
| ---------------------------------- | --------------------------------------------------- | ------- | ------------ |
| I-CELL-MERGE-REQUIRES-HARNESS      | □(cell-merge → harness-pass)                        | error   | □(P → Q)     |
| I-UPSTREAM-FAIL-CANCELS-DOWNSTREAM | □(upstream-fail → ◇downstream-cancel)               | error   | □(P → ◇Q)    |
| I-VERSION-ALIGNMENT                | □(all-packages-aligned)                             | error   | □P           |
| I-NO-SELF-MODIFICATION             | □¬(cell-modifies-harness)                           | error   | □¬P          |
| I-CELL-EVENTUALLY-COMPLETES        | □(cell-created → ◇cell-terminal)                    | warning | □(P → ◇Q)    |
| I-RETRY-LIMIT                      | □¬(retry > MAX_RETRIES)                             | error   | □¬P          |
| I-STATUS-MATCHES-REALITY           | □(status-version = graph-version ∨ state = drifted) | error   | □(P ∨ Q)     |
| I-NO-PARALLEL-CONFLICT             | □¬(∃cell-A, B: wave-same ∧ files-overlap)           | error   | □¬(∃x: P(x)) |
