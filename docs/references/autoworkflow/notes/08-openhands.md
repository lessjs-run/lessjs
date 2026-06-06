# 8. OpenHands：AI 编程 Agent 平台

> Wang et al. "OpenHands: An Open Platform for AI Software Developers as Generalist Agents." ICLR 2025.

## 核心范式：CodeAct

OpenHands 的核心创新是 **CodeAct**——把 AI 的推理结果直接表现为可执行代码：

```
传统 Agent:  LLM 推理 → 选择工具 → 调用工具 → 等待结果 → 再推理
CodeAct:     LLM 推理 → 生成代码 → 直接执行 → 观察结果
```

为什么这更好？因为跳过了一层抽象。传统 Agent 需要预先定义工具（"bump-version" 工具、"write-changelog" 工具），CodeAct 直接生成 bash 命令或 Python 脚本。

## CodeAct 对我们架构的意义

我们的 Cell 执行层可以采用 CodeAct 思路：

```python
# Cell: bump-version
# AI 不调用 "bump_version_tool()"
# 而是直接生成并执行代码：

import json, os

for pkg_dir in os.listdir("packages"):
    deno_json = f"packages/{pkg_dir}/deno.json"
    with open(deno_json) as f:
        config = json.load(f)
    config["version"] = "0.35.0"
    with open(deno_json, "w") as f:
        json.dump(config, f, indent=2)
```

区别在于灵活性。预定义工具只能做预设的事情。CodeAct 可以做任何 bash/Python 能做的事。

## OpenHands 的局限

### 1. 无状态持久化

OpenHands 的会话结束后，状态就丢失了。下次任务从头开始。

我们的 Answer：Cell Evidence Ledger 永久归档。

### 2. 无 Governance 驱动

OpenHands 不知道"这个 repo 的 SOP 是什么""roadmap 指向哪""该不该发版本"。

它只知道当前任务。它是近视的。

我们的 Answer：Governance 文档是长期记忆。

### 3. 无 Harness

OpenHands 靠 "AI 判断代码好不好" + 测试。没有 fmt/lint/typecheck/arch/graph 这类硬门禁。

我们的 Answer：Harness 是第一道防线。AI 只是负责"把代码写对"，Harness 负责"验证它确实对"。

## OpenHands + openElement 的互补

如果用 OpenHands 做 AI 编程，用 openElement 做仓库自演化：

```
openElement autoflow:report → 检测 drift → 创建 Cell
   ↓
OpenHands CodeAct → AI 在 branch 上修代码
   ↓
openElement Harness → 验证
   ↓
openElement autoflow:evolve → 合入 / 拒绝
```

OpenHands 擅长**在沙箱里写代码**。我们擅长**让仓库自己跑起来**。不是竞争，是互补。但我们的方向更窄更深——只做一件事：让这个仓库自己演化。
