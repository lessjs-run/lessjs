# 9. SWE-bench：AI 软件工程能力的度量

> Jimenez et al. "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" ICLR 2024.
> OpenAI. "Introducing SWE-bench Verified." 2024.
> OpenAI. "Why We No Longer Evaluate on SWE-bench Verified." 2025.

## 核心思想

怎么知道一个 AI 会不会写代码？给它真实的 GitHub issue，让它修。

SWE-bench 从 12 个知名 Python 仓库（Django, Flask, scikit-learn 等）收集了 2294 个真实 issue，每个 issue 配了测试用例。AI 修了之后跑测试看对不对。

## SWE-bench Verified

原始 SWE-bench 有一个问题：部分 issue 描述不清，或者测试用例不够精确。SWE-bench Verified 过滤掉这些问题，剩下 500 个高质量任务。

2024 年的成绩：

- Claude 3.5 Sonnet: ~50%（当时最高）
- 人类软件工程师: ~67%

## 为什么 OpenAI 不再用它

2025 年 OpenAI 发了一篇声明，解释为什么要放弃 SWE-bench Verified：

**不是因为太简单了，而是因为基准测试会过拟合。**

AI 模型开始针对 SWE-bench 的特定模式做优化——而不是真的变聪明。这就像学生背答案而不是学知识。

另一个原因：SWE-bench 任务都是 **单文件修改、单 issue 修复**。真实软件工程是：多文件重构、跨版本维护、governance 验证。

## 对我们的意义

### 1. 我们的系统应该自己在真实任务上证明自己

不是跑 SWE-bench 数据集。是让 openElement 自己演化几个版本，看 AI 能不能正确维护它。自己就是试验田。

### 2. 度量什么？

SWE-bench 只度量"代码写得对不对"（跑测试）。我们的度量应该是：

| 指标               | 含义                                  |
| ------------------ | ------------------------------------- |
| 一次通过率         | Cell 不经人工修正直接 merge 的比例    |
| 平均修正次数       | Cell 失败后需要几轮修复才能通过       |
| 从感知到发布的延迟 | autoflow 发现 drift 到 tag 发布的时间 |
| 回滚次数           | 发布了但要撤回的次数                  |

### 3. Harness 本身是度量的一部分

SWE-bench 只有测试做度量。我们有 12 道门禁（fmt, lint, typecheck, test, arch, graph, workflow, docs:check-current, docs:check-strategy, dsd:check-report, publish:dry-run, consumer smoke）。

AI 不仅要"写对代码"，还要"代码符合这个项目的所有治理规则"。

### 4. 过拟合问题

如果我们的 AI 只针对 openElement 做优化，那它学到的就是 openElement 特有的模式，不是通用的软件工程能力。

解决：不优化模型本身。优化 Governance 文档的质量。好的 Governance 文档 = 好的"题目"。AI 学会读好的文档，而不是背特定仓库的模式。
