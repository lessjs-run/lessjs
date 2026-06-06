# 5. Git Internals：作为安全原语的版本控制

> Chacon & Straub. "Pro Git." 第 10 章：Git Internals.
> gitworkflows(7) — Git 官方文档：分布式工作流。

## 核心问题

为什么 git 而不是文件系统锁、Docker 快照、或者数据库事务？

因为 git 的三个属性恰好是自演化系统需要的：

## Git 的三层对象模型

```
commit  ← 快照 + 元数据（作者、时间、消息）
  ↓ 指向
tree    ← 目录结构
  ↓ 指向
blob    ← 文件内容（SHA-1 内容寻址）
```

### 为什么这个模型适合我们？

1. **内容寻址**：git 用 SHA-1 做 key。相同内容 → 相同 hash。这天然支持去重和完整性校验。
2. **不可变性**：commit 一旦创建就不可修改。`git commit --amend` 实际上是创建新 commit，旧的不动。
3. **DAG 而非链表**：git 的提交历史是 DAG，不是线性链。分支是 DAG 的叶子节点。

### 直接对应

| Git 概念             | Cell 概念                |
| -------------------- | ------------------------ |
| branch               | Cell 的隔离空间          |
| commit               | 一次原子操作             |
| merge (fast-forward) | cell 通过 harness 后合入 |
| `git reset --hard`   | 炸了，回滚               |

## 为什么 Branch 不是完美的

### 冲突

```
cell-02: 改了 STATUS.md 标题
cell-03: 也改了 STATUS.md 标题
→ merge conflict
```

DAG 依赖可以避免一部分：让 cell-02 先跑，cell-03 在 cell-02 的 merge 之后才分支。但并行 cell 仍然可能冲突。

### 解决方案：小 Cell + 快合入

- Cell 越原子，冲突概率越低
- Merge 越快（全绿即合），冲突窗口越小
- 如果真的冲突了：AI 解决冲突 → 重新验证 → 再合

Git 的 `rerere`（reuse recorded resolution）可以学习冲突解决模式——这又是一个"知识库"的概念。

## Git 分支模型的选择

### GitHub Flow（我们用它）

```
dev ←── autoflow/cell-01
         ↓ CI 全绿
       fast-forward merge
         ↓
       delete branch
```

极简。适合我们。

### Git Flow（不用）

```
main ←── develop ←── feature/xxx
          ↓             ↓
       release/1.0   hotfix/urgent
```

太重。额外的 release/hotfix 分支对我们的自动化没用——release 本来就是证据驱动的，不需要专门的分支。

## Git 作为安全原语

```
❌ 直接改文件              ← 没有回滚点
❌ 文件系统锁               ← 死锁风险
✅ Git branch + fast-forward merge ← 隔离、可回滚、可审计
```

**Branch 是 Cell 的安全气囊。** 不是为了防止事故，是为了事故发生了人能活下来。

炸了的 Cell 就是被 delete 的 branch。主干干干净净，连 `git revert` 都不用。Commit 历史里不会有"修复上次自动发布的 bug"这种烂记录。
