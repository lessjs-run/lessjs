# 2. Harel Statecharts：状态机的形式化

> Harel, D. "Statecharts: A Visual Formalism for Complex Systems." Science of Computer Programming, 1987.

## 核心问题

传统状态机（FSM）有一个致命缺陷：**状态数量随系统复杂度指数爆炸。**

举个例子：一个简单的 UI 组件，有"可见/隐藏"×"加载中/加载完"×"有错误/无错误"——3 个布尔状态，组合起来就是 2³ = 8 个状态。再多一个维度就是 16 个。再多就是 32 个。这是组合爆炸。

Harel 的解决方案：**层次化状态机 + 正交 + 广播通信。**

## 三个核心创新

### 1. 层次化状态（Hierarchy）

```
┌──────────────┐
│   evolving   │ ← 父状态
├──────────────┤
│ planned      │
│ next         │ ← 子状态
│ active       │
│ implemented  │
│ released     │
└──────────────┘
```

父状态 `evolving` 是一个抽象——只要系统在演化，就在这个状态里。子状态 `planned/next/active/...` 是具体阶段。

好处：高层逻辑（"系统在演化"）和低层逻辑（"当前处于哪个阶段"）分离。

### 2. 正交状态（Orthogonality）

系统可以同时处于多个独立的状态维度：

```
维度 A: workflow 状态    → active
维度 B: Cell 执行状态     → executing
维度 C: CI 状态          → passing
```

这三个维度互相独立。workflow 是 active 的时候，cell 可以是 executing 也可以是 merging。

### 3. 广播通信（Broadcast）

状态切换不是沉默的。每次转换都广播一个事件：

```
implemented → released
     ↓
事件: "version-released"
     ↓
Cell DAG 收到 → 评判决议条件是否满足 → 决定下一步
```

## 对 openElement 的贡献

### Cell 状态机的层次化

```
planned ──→ branched ──→ executing ──→ harness
                                           │
                          ┌────────────────┤
                          ↓                ↓
                       merging          failed
                          ↓
                       merged
```

`harness` 是一个父状态，内部有子状态 `running/passing/failing`。这样 `harness` 层面的逻辑（"正在验证"）和子层面的逻辑（"lint 过了，typecheck 炸了"）可以分开处理。

### 多维度正交

一个 Cell 同时有三个维度：

| 维度     | 状态空间                                |
| -------- | --------------------------------------- |
| 生命周期 | planned → branched → executing → merged |
| 风险评估 | low / medium / high / critical          |
| 依赖状态 | blocked / ready / completed             |

互不干扰，各管各的。

### 事件驱动 = 证据驱动

Harel 的广播通信映射到我们的架构就是：**状态转换不是悄悄的。每次转换都有证据，证据就是事件。**

```
Cell 从 executing → harness:running
     → 事件: cell-X-harness-started
     → 证据: CI run 已触发

Cell 从 harness:running → harness:passing
     → 事件: cell-X-all-gates-green
     → 证据: fmt✅ lint✅ typecheck✅ test✅
```

Harel 的状态转换是"发生了事件"驱动的。我们的是"有了证据"驱动的。同一个模式。
