# AutoWorkflow 参考文献库

自演化架构的理论基础，按依赖关系组织。来源以经同行评议的期刊/会议论文为主，arXiv 补充。

## 论文图谱（25 篇）

```
Layer 1: 元理论
├── P1  — von Neumann (1966)    细胞自动机与原初自复制
├── P2  — Langton (1984)        人工生命中的自复制环
├── P3  — Wolfram (2002)        细胞自动机分类与计算等价

Layer 2: 控制论与自适应
├── P4  — Kephart & Chess (IEEE Computer 2003)   自主计算 MAPE-K
├── P5  — Oreizy et al. (IEEE IS 1999)           架构驱动的自适应
├── P6  — Kramer & Magee (FOSE 2007)             自管理系统的架构挑战
├── P7  — Hellerstein et al. (Wiley 2004)        反馈控制理论在计算系统中的应用

Layer 3: 形式化方法
├── P8  — Harel (SCP 1987)        Statecharts：状态机的层次化与正交
├── P9  — Pnueli (FOCS 1977)      时态逻辑（程序性质的数学描述）
├── P10 — Lamport (Addison-Wesley) TLA+：用数学描述系统行为
├── P11 — Jackson (TOSEM 2002)     Alloy：轻量级形式化建模

Layer 4: 软件演化
├── P12 — Lehman (IEEE 1980)      软件演化定律
├── P13 — Brooks (IEEE Computer 1987)  没有银弹：本质复杂性 vs 偶然复杂性
├── P14 — Godfrey & German (2008) 软件演化的过去现在未来

Layer 5: 并发、工作流与持久化
├── P15 — Kahn (IFIP 1974)        Kahn Process Networks（确定性并发）
├── P16 — Lee & Messerschmitt (IEEE TSP 1987)  SDF 静态调度
├── P17 — Reinke et al. (OOPSLA 2021)  Durable Functions 的形式化语义

Layer 6: 持续集成与交付
├── P18 — Humble & Farley (Addison-Wesley 2010)  持续交付
├── P19 — Duvall et al. (Addison-Wesley 2007)    持续集成模式

Layer 7: Agent 与知识系统
├── P20 — Jennings (CACM 2001)    Agent 驱动的复杂软件构建
├── P21 — Rich & Waters (IEEE Computer 1988)  自动编程：神话与现实

Layer 8: AI 软件工程
├── P22 — OpenHands (ICLR 2025)    AI 编程 Agent 平台
├── P23 — SWE-bench (ICLR 2024)    AI 软件工程基准
├── P24 — Jimenez et al. (ICLR 2024)  SWE-bench 原始论文

Layer 9: 软件仓库挖掘
├── P25 — Hassan (IEEE TSE 2008)   挖掘软件仓库以辅助演化
```

## 阅读顺序

1. P1 → P2 → P3 （细胞自动机：什么是"细胞"）
2. P4 → P5 → P6 → P7 （自适应：怎么让系统自我管理）
3. P8 → P9 → P10 → P11 （形式化：怎么精确描述状态）
4. P12 → P13 → P14 （演化：软件怎么老化、怎么重生）
5. P15 → P16 → P17 （并发：怎么调度互相依赖的任务）
6. P18 → P19 （工程：怎么安全地持续交付）
7. P20 → P21 （Agent：AI 在软件工程的角色）
8. P22 → P23 → P24 → P25 （前沿：当下 AI 软件工程的边界）
