# 7. Semantic Release：证据驱动的自动发布

> semantic-release.js.org
> Conventional Commits 规范

## 核心思想

**不要让人类决定版本号和 changelog。让 commit 历史决定。**

```
commit: "feat: add new API"      → minor bump
commit: "fix: crash on null"     → patch bump
commit: "feat!: remove old API"  → major bump (BREAKING CHANGE)
```

规则是机械的、确定性的。人拍脑袋决定版本号 → 出错。程序读 commit → 不会错。

## semantic-release 的流水线

```
git push
  ↓
semantic-release 读 commits
  ↓
判定版本号
  ↓
生成 CHANGELOG
  ↓
git tag
  ↓
npm publish
  ↓
GitHub Release
```

## 对我们架构的意义

semantic-release 证明了：**机械性的发布决策可以自动化，而且比人更可靠。**

我们做的事情本质上就是 semantic-release 的泛化：

| semantic-release       | openElement self-evolution               |
| ---------------------- | ---------------------------------------- |
| 读 commit message      | 读 Governance 文档（STATUS/ROADMAP/SOP） |
| 判定 minor/patch/major | 判定"该不该发""发什么版本"               |
| 生成 changelog         | 从 SOP 任务自动生成 changelog            |
| tag + publish          | 证据驱动：全绿 = tag + publish           |

区别：

- semantic-release 只看 commit message（一句话）
- 我们看整套 Governance 文档（SOP 任务证据、包图对齐、门禁结果）

输入不同，逻辑相同。

## 为什么需要比语义版本更丰富的证据

semantic-release 的一个盲区：

```
commit: "feat: add autoflow report"
  → minor bump → 0.34.0

但 SOP 还有 3 个任务没完成。
测试有 12 个没过。
docs:check-strategy 炸了。

semantic-release 不关心这些。它只看 commit message。
```

我们的系统关心。不是因为更聪明，是因为输入更丰富。SOP、STATUS、ROADMAP、包图、门禁结果——它们一起构成了"该不该发"的完整证据。

## 反模式需要注意

semantic-release 有一个陷阱：**它鼓励把发布质量交给 commit message 的规范程度。**

如果一个团队 commit message 写得烂："fix stuff" / "update" / "wip"——semantic-release 要么猜错版本，要么完全无法工作。

我们的系统没有这个陷阱——因为我们不靠自然语言推断。我们靠结构化证据：SOP 的 `[x]`、包图的 version 字段、门禁的 exit code。

这也是为什么 v0.33 要做"AI-readable API"——不是为了让 AI 能读代码，是为了让 AI 能读证据。
