# 3. Rainbow：架构驱动的自适应

> Garlan et al. "Rainbow: Architecture-Based Self-Adaptation with Reusable Infrastructure." CMU, 2004.

## 核心问题

MAPE-K 告诉你"做四步循环"，但没告诉你：

- 系统怎么**描述自己**？
- 怎么**知道自己偏离了目标**？
- 怎么**选择正确的修正策略**？

Rainbow 回答了这三个问题。答案：**架构模型。**

## Rainbow 的四个层次

```
层 4: Strategy (策略)      → "如果响应时间 > 500ms，加一个服务器"
层 3: Architecture Model   → "系统有 3 个 Web 服务 + 1 个数据库"
层 2: Translation          → 把架构描述翻译成可执行操作
层 1: System               → 实际的运行系统
```

**关键创新在层 3：Architecture Model。** Rainbow 要求系统有一份明确的、机器可读的架构自描述。不只是"文档"——是系统自己读的。

## 自适应循环

```
System ──→ Model Manager ──→ Architecture Evaluator
                                      ↓
                               Constraint Analyzer
                                      ↓
                               Adaptation Engine
                                      ↓
                               Strategy Executor
                                      ↓
                                System (apply changes)
```

1. **Model Manager**：持续更新架构模型（哪些组件在运行、负载如何）
2. **Architecture Evaluator**：对比"实际状态"和"目标状态"
3. **Constraint Analyzer**：判断偏离是否违反了约束
4. **Adaptation Engine**：选择修正策略
5. **Strategy Executor**：执行修正

## 对 openElement 的直接映射

Rainbow 的设计可以 1:1 映射到我们的架构：

| Rainbow                | openElement                                        |
| ---------------------- | -------------------------------------------------- |
| Architecture Model     | Governance 文档（STATUS.md, ROADMAP.md, SOP, ADR） |
| Model Manager          | `autoflow:report` reader 层                        |
| Architecture Evaluator | State Machine (`determineState`)                   |
| Constraint Analyzer    | Harness (fmt/lint/typecheck/test/build)            |
| Adaptation Engine      | Cell 规划引擎（拆 DAG）                            |
| Strategy Executor      | Git Branch 上的 Cell 执行                          |
| System                 | 代码仓库本身                                       |

## 核心洞察

Rainbow 告诉我们：**自适应系统的关键是"系统知道自己的样子"。**

一个不自知的系统，自适应就是盲目的。它不知道什么是对、什么是错、什么是目标。

我们的 Governance 文档就是 openElement 的 Architecture Model。STATUS.md 告诉系统"当前是 v0.34，处于 implemented 状态"。ROADMAP.md 告诉系统"下一步是 v0.35"。SOP 告诉系统"v0.35 需要完成这 9 个任务"。

正是因为有这些文档，AI 才知道"该做什么"。不是因为 AI 聪明，是因为系统**描述了它自己**。

## Rainbow 的局限

Rainbow 假设架构模型是预先写好的、静态的。它没解决怎么让系统**自己更新自己的架构模型**。

我们要做的比 Rainbow 多一步：Cell 不仅要修正代码，还要同步更新 Governance 文档。bump 版本的同时更新 STATUS.md。写完 changelog 的同时更新 ROADMAP.md。**文档是知识库，知识库必须和代码保持同步。**
