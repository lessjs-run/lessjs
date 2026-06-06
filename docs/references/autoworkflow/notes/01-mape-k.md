# 1. MAPE-K：自主计算的四步循环

> Kephart & Chess. "The Vision of Autonomic Computing." IEEE Computer, 2003.

## 核心思想

IBM 在 2003 年提出一个根本性问题：

```
如果系统越来越复杂，人管不动了，怎么办？
```

答案：让系统自己管自己。就像人体的自主神经系统——心跳、呼吸、体温调节，都不需要你有意识地去控制。

## MAPE-K 循环

```
Monitor  →  Analyze  →  Plan  →  Execute
   ↑                              ↓
   └─────── Knowledge ────────────┘
```

| 阶段          | 做什么                                | 对应我们                                     |
| ------------- | ------------------------------------- | -------------------------------------------- |
| **Monitor**   | 收集系统状态（CPU、内存、日志、指标） | `autoflow:report` 读 STATUS/ROADMAP/SOP/包图 |
| **Analyze**   | 判断是否有问题（是否偏离了期望状态）  | 状态机判定：drifted? implemented?            |
| **Plan**      | 制定修正方案（要做什么、怎么做）      | 拆 Cell DAG                                  |
| **Execute**   | 执行方案，并观察效果                  | 在 git branch 上执行 → Harness 验证          |
| **Knowledge** | 共享的知识库（系统模型、历史数据）    | Governance 文档 + Cell Evidence Ledger       |

## 关键洞察

MAPE-K 最大的贡献不是这四个步骤本身——而是 **Knowledge（知识库）作为闭环的核心**。

在大多数监控系统中，Monitor → Alert → 人处理 → 结束了。人走了，知识也走了。

MAPE-K 要求：**每一次决策都回到 Knowledge 层记录下来，形成持续学习的闭环。**

这恰好是我们 Architecture 的核心差异：

```
OpenHands:  Task → Execute → Done（一次性）
我们:       Knowledge → Monitor → Analyze → Plan → Execute → Knowledge（闭环）
```

## 对 openElement 的贡献

1. **闭环思维**：不是"AI 写代码然后人 review"，而是"AI 读状态 → AI 决定 → AI 执行 → AI 验证 → 状态更新 → 下一轮"
2. **Knowledge 层**：Governance 文档不只是给人看的——它们是机器的知识库。STATUS.md / ROADMAP.md / SOP 就是这个 Knowledge 层的具体实现
3. **自治不意味着失控**：MAPE-K 强调自主系统仍然需要人为定义的策略（policy）。我们的 Harness 就是 policy 的编码化

## 历史背景

2003 年 IBM 提这个的时候，CPU 利用率是主要监控对象。他们想象的是服务器自己调参数。

我们现在把这个思想搬到软件工程本身：**让仓库自己管自己的版本、文档、测试、发布。**

20 年前 IBM 想让服务器自动扩缩容。20 年后我们想让代码仓库自己演化。同一个思想，不同的应用域。
