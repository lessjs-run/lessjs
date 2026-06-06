# C5. Pnueli 时态逻辑：程序的数学化

> Pnueli, A. "The Temporal Logic of Programs." _FOCS 1977_. IEEE.
> （1996 年 Turing Award）

## 核心问题

怎么用数学描述一个程序的**行为**？

传统方式：看输入→输出。但这只能描述"算出了什么"，不能描述"过程是怎样的"。

Pnueli 的贡献：**用时态逻辑描述程序在时间维度上的行为。**

## 不是"发生了什么"，是"什么必须永远成立"

传统逻辑：`x = 5`（在这个时刻，x 等于 5）

时态逻辑：`□(x < 10)`（在所有时刻，x 都不超过 10）

| 符号    | 含义         | 直觉                      |
| ------- | ------------ | ------------------------- |
| `□P`    | Always P     | "P 永远成立"              |
| `◇P`    | Eventually P | "P 最终会成立"            |
| `P U Q` | P Until Q    | "P 一直成立，直到 Q 成立" |
| `○P`    | Next P       | "下一个时刻，P 成立"      |

## 用在我们系统上

Cell 执行的要求不再用自然语言说"必须全绿"，而是用时态逻辑精确描述：

```
□(cell_state = executing → ◇(cell_state = harness))
```

> "任何时候，如果 cell 进入 executing，它最终必须进入 harness。"

```
□(harness_pass → ◇(cell_state = merging))
```

> "任何时候，如果 harness 全绿，cell 最终必须进入 merging。"

```
□¬(cell_state = merging ∧ upstream = failed)
```

> "cell 永远不能在上游失败的情况下 merge。"

## 为什么时态逻辑重要

目前我们的门禁是**快照式的**：typecheck 在这个时刻过了，但下一秒有人 push 了新代码，就不知道了。

Pnueli 的框架让我们可以写**跨时间的约束**：

```
□(main_branch.head ≠ tagged_version → state = drifted)
```

翻译成人话："如果 main branch 的最新提交不是一个已标记的 release 版本，系统必须报告 drifted。"

这种约束不是"跑一遍 typecheck 看看"——是"在任何时间点，系统必须满足这个性质"。

## 对应到 Harness

现阶段的 Harness 是离散的——每次 push 跑一遍，跑了就过了。

有了时态逻辑，Harness 可以升级为**持续约束**：

```
□(package_version = status_version)
□(docs_next_version_file_count = 8)
□¬(public_api_change ∧ ¬approved_adr)
```

这就是 v0.35 的 autoflow:check 要做的事：不只是"跑一遍看看"，而是"每次操作前验证这些不变量是否成立"。
