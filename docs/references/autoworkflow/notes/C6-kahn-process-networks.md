# C6. Kahn Process Networks：确定性并发

> Kahn, G. "The Semantics of a Simple Language for Parallel Programming." _IFIP Congress_, 1974.

## 核心问题

多个并行任务之间，怎么保证**确定性**？给定同样的输入，不管任务怎么调度、哪个先跑、跑多快——输出必须一样。

这是并发编程的核心难题。也是我们 Cell DAG 的核心难题。

## Kahn 的答案：限制通信方式

传统并发：共享内存 + 锁。复杂、容易死锁、不确定。

Kahn Process Networks (KPN)：**只通过 FIFO 队列通信，没有共享状态。**

```
Process A ──→ [FIFO] ──→ Process B
              (队列)

A 往队列里放数据。
B 从队列里取数据，队列空了就阻塞等待。
A 和 B 之间没有其他交互方式。
```

## 为什么这保证确定性

两个进程之间的交互只有一种方式：**队列**。A 不能修改 B 的内存，B 不能打断 A 的执行。

数学上可以证明：给定相同的输入序列，KPN 无论怎么调度，输出序列是确定的。

这叫 **Kahn 确定性**：不是因为跑得快慢一样，是因为**唯一能改变 B 的行为的是 A 发来的数据**。没有隐藏通道。

## 对 Cell DAG 的意义

我们的 Cell 也是并行的——cell-02 和 cell-03 可以同时跑。

```
cell-01 → [证据队列] → cell-02
                      → cell-03
```

### Cell 之间的"队列"是什么？

不是真的 FIFO。是 **Cell Evidence Ledger**：

```
cell-01 完成后写入:
  docs/autoflow/cells/cell-01.json
  → { "id": "cell-01", "state": "merged", "gates": {...} }

cell-02 启动前读取:
  docs/autoflow/cells/cell-01.json
  → { "state": "merged" } → 可以开始
  → { "state": "failed" } → cancel
```

Cell Evidence Ledger 就是 Cell 之间的通信通道。像 KPN 的队列一样，它有明确的读/写接口，没有隐藏的共享状态。

### KPN 告诉我们什么

1. **共享状态是并发 bug 的根源。** Cell 之间不能直接改对方的文件。每个 Cell 在自己的 branch 上操作。
2. **通信通道要简单、单向、可审计。** Cell Evidence Ledger 就是这样一个通道。只写 JSON，只读 JSON。
3. **确定性来自限制，不是来自精巧。** 不是因为我们的调度算法好，是因为我们限制了 Cell 之间能做什么。

## 一个反例

如果 cell-02 和 cell-03 都在同一个文件上操作（都改了 STATUS.md），并且不通过队列协调——这就是非确定性并发。两个 Cell 改同一个文件的同一行，merge conflict。

KPN 的解决方案：**不要让两个 Cell 同时改同一个文件。** 用 DAG 串行化冲突的 Cell。

这恰好就是我们的 DAG 依赖：cell-02 和 cell-03 如果改了同一个文件的同一个区域，就不应该是并行的 Cell——应该串行，或者合并为一个 Cell。
