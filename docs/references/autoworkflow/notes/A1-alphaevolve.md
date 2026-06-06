# A1. AlphaEvolve：LLM 驱动的进化编码 Agent

> Novikov et al. "AlphaEvolve: A Coding Agent for Scientific and Algorithmic Discovery." DeepMind, 2025.

## 核心架构

AlphaEvolve 不是"写一次代码就跑"的 Agent。它是**持续生成、评估、优选的进化循环**：

```
Prompt Sampler → LLM (Flash + Pro) → Evaluator → Programs DB
     ↑                                              │
     └────────── 进化算法：优者入选 ────────────────┘
```

## 与普通 AI 编程的区别

|      | 普通 Copilot | AlphaEvolve            |
| ---- | ------------ | ---------------------- |
| 生成 | 一次         | 循环迭代               |
| 评估 | 人看         | 自动 metric            |
| 选择 | 人挑         | 进化算法（遗传算法）   |
| 目标 | "跑通就行"   | "比上一代更好"         |
| 输出 | 一个方案     | 一代比一代强的方案序列 |

AlphaEvolve 不仅找对方案——它**持续寻找更优方案**。

## 我们的架构本质上是同一件事

| AlphaEvolve    | openElement                              |
| -------------- | ---------------------------------------- |
| Prompt Sampler | autoflow:report → 发现 drift → 生成 Cell |
| LLM generates  | AI 在 branch 上写代码                    |
| Evaluator      | Harness（fmt/lint/typecheck/test/build） |
| Programs DB    | Cell Evidence Ledger                     |
| 进化算法       | DAG 依赖 + 状态机：失败→修复→重试        |
| Fitness metric | 全部门禁全绿 = fitness 满分              |

## 关键差异

AlphaEvolve 优化的是**算法性能**（跑得更快、算得更准）。我们优化的是**仓库完整性**（版本对齐、文档同步、门禁全绿）。

两者的进化循环结构完全一致。区别在于 optimization target。

## 数据中心的案例

AlphaEvolve 在 Borg（Google 的集群调度器）上运行了一年多，持续回收 0.7% 的全球计算资源。**这不是一次性的优化成果——是一个持续运行的、自我改进的系统。**

这正是我们想要的形式：不是"AI 帮我发一个版本"，而是"AI 持续维护这个仓库，每个版本都比上一个更干净"。
