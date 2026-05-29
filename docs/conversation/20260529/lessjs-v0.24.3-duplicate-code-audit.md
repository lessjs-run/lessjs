# LessJS v0.24.3 — 重复代码与冗余扫描报告

> **扫描日期**: 2026-05-29 | **扫描分支**: dev (19915451)\
> **扫描范围**: 132 个 packages 源文件 + 全部 www/app 路由文件\
> **扫描人员**: 全栈工程师团队 (主理人: 齐活林)

---

## 目录

1. [执行摘要](#一执行摘要)
2. [高优先级 — 重复类型定义](#二高优先级--重复类型定义)
3. [中优先级 — 已废弃但仍存在的代码](#三中优先级--已废弃但仍存在的代码)
4. [低优先级 — 设计选择可讨论项](#四低优先级--设计选择可讨论项)
5. [判定为合理的重复](#五判定为合理的重复)
6. [结论与行动建议](#六结论与行动建议)

---

## 一、执行摘要

### TL;DR

全仓库扫描发现 **8 个类型/函数在 2-3 个包中重复定义**，以及 **约 300 行废弃 dead code 仍在生产源码中**。核心问题是 **SOP-007 (v0.21.0) 从 core 提取 compat-check 时，未清理 core 中的原版类型**，导致两处维护同一份定义。

| 维度           | 评分 | 关键发现                                                      |
| -------------- | ---- | ------------------------------------------------------------- |
| 跨包类型一致性 | C+   | 8 个类型在 core/cem/compat-check/adapter-vite 中重复定义      |
| Legacy 清理    | C    | template.ts 613 行中有 300+ 行 @deprecated 代码，零生产消费者 |
| 适配器重复     | B    | 三个适配器框架差异合理，DsdHydration 接口共享即可             |
| 配置一致性     | A    | 单个 deno.lock，无 tsconfig 碎片，无测试框架混用              |
| 路由重复       | B+   | EN/ZH 页面结构重复属 i18n 设计选择，demo-* 文件是教学意图     |

### 发现分布

| 严重度 | 数量 | 说明                          |
| ------ | ---- | ----------------------------- |
| 🔴 高  | 5    | 跨包重复类型，修改需同步 N 处 |
| 🟡 中  | 2    | 废弃但仍在源码中的代码        |
| 🟢 低  | 2    | 设计选择，可讨论              |

---

## 二、高优先级 — 重复类型定义

### 2.1 `SignalLike` + `isSignalLike` 双份定义

| 项目           | 详细信息                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **位置 1**     | `packages/core/src/signal-like.ts` (v0.24.3 新建)                                                                          |
| **位置 2**     | `packages/core/src/template.ts` (原始定义)                                                                                 |
| **差异**       | `isSignalLike` 函数体完全相同。`SignalLike` 接口略有差异：signal-like.ts 用 `value: T`，template.ts 用 `readonly value: T` |
| **实际使用者** | `packages/core/src/index.ts` 只从 signal-like.ts 导出。template.ts 的版本无人导入                                          |
| **根因**       | v0.24.3 提取到 signal-like.ts 后，template.ts 中的原版未删除                                                               |

**影响**：同一包内维护两份定义，改一处容易忘另一处。`readonly` vs mutable 差异可能产生细微的类型行为不一致。

---

### 2.2 `ManifestDecision` / `SsrAdmissionDecision` 三份定义

| 项目           | 详细信息                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------- |
| **位置 1**     | `packages/core/src/types.ts`                                                                      |
| **位置 2**     | `packages/compat-check/src/types.ts`                                                              |
| **位置 3**     | `packages/adapter-vite/src/entry-descriptor.ts` (`SsrAdmissionDecision` 也在这一份)               |
| **差异**       | **完全相同** — 逐字节对比无差异                                                                   |
| **实际使用者** | adapter-vite 从 core 导入。compat-check 的定义未被任何人导入                                      |
| **根因**       | SOP-007 (v0.21.0) 从 core 提取 compat-check 时，原版留在 core 未删。adapter-vite 自己又定义了一份 |

**影响**：三个相同定义。如果将来要加字段（如 `renderPath: 'hybrid-ssr'`），改一处就会不一致。

---

### 2.3 6 个 Validation 类型双份定义

| 类型名                     | core/types.ts | compat-check/types.ts | 差异         |
| -------------------------- | :-----------: | :-------------------: | ------------ |
| `ValidationResult`         |      ✅       |          ✅           | **完全相同** |
| `ValidationError`          |      ✅       |          ✅           | **完全相同** |
| `ValidationWarning`        |      ✅       |          ✅           | 略有差异     |
| `ValidationDiagnostic`     |      ✅       |          ✅           | **完全相同** |
| `ValidatedTag`             |      ✅       |          ✅           | **完全相同** |
| `ManifestValidationReport` |      ✅       |          ✅           | **完全相同** |

**根因**：同上。SOP-007 从 core 提取 compat-check 时，原版留在 core。

---

### 2.4 `ComponentLayer` / `HydrationStrategy` 三份定义

| 项目           | 详细信息                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| **位置 1**     | `packages/core/src/types.ts`                                                                                     |
| **位置 2**     | `packages/cem/src/types.ts`                                                                                      |
| **位置 3**     | `packages/compat-check/src/types.ts`                                                                             |
| **差异**       | **完全相同** — `'dsd-static' \| 'dsd-interactive' \| 'pure-island'` 和 `'load' \| 'idle' \| 'visible' \| 'only'` |
| **实际使用者** | adapter-vite 从 core 导入。cem 和 compat-check 的内部使用各自定义                                                |
| **根因**       | 这些是核心 domain type，但每个包都自己定义了一份                                                                 |

**影响**：如果要加新策略（如 `HydrationStrategy = ... | 'media'`），需同步 3 处。

---

### 2.5 `isValidTagName` 双份实现

| 项目       | 详细信息                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------- |
| **位置 1** | `packages/cem/src/cem-parser.ts` — 仅检查 `TAG_NAME_REGEX.test(tagName)`                    |
| **位置 2** | `packages/compat-check/src/compatibility.ts` — 先检查正则，再检查 `tagName.includes('-')`   |
| **差异**   | compat-check 版本更严格（要求至少一个连字符）。这是 bug 还是有意为之？                      |
| **根因**   | compat-check 需要更严格的验证（WC 规范要求自定义元素名必须含连字符），但 cem 只做了格式检查 |

**注意**：此处两个实现**不等价**，合并时需确认 semantic 差异是故意还是遗漏。

---

## 三、中优先级 — 已废弃但仍存在的代码

### 3.1 `template.ts` 中的 7 个 @deprecated 函数

`packages/core/src/template.ts` 共 613 行，其中约 **300+ 行** 是以下已废弃 API 的定义和辅助代码：

| 函数           | 标记        | 替代方案                      |
| -------------- | ----------- | ----------------------------- |
| `classMap()`   | @deprecated | JSX `className` ternary       |
| `when()`       | @deprecated | JSX 三元 / `&&`               |
| `choose()`     | @deprecated | JSX switch/object-lookup      |
| `repeat()`     | @deprecated | JSX `Array.map()`             |
| `ref()`        | @deprecated | JSX `ref` prop                |
| `html`         | @deprecated | JSX 语法                      |
| `unsafeHTML()` | @deprecated | JSX `dangerouslySetInnerHTML` |

**实际使用情况**：

```
全仓库 0 处生产代码导入这些函数
仅 packages/core/__benchmarks__/core.bench.ts 中有 import
```

**讨论点**：

- template.ts 中还有 `renderTemplateToString`、`collectRuntimeTemplateBindings` 等 SSR 函数，它们是 DSD 渲染管线的实际实现——如果删除废弃 API，这些函数的实现逻辑是否也需要清理？
- `SignalLike` 类型在 template.ts 中被多处内部引用（`AttrValue`、`ContentValue` 等），删除时需小心处理依赖

---

### 3.2 `nav-filter.ts` 的 deprecated alias

`www/app/utils/nav-filter.ts` 中定义了三个已废弃的 alias：

```typescript
// @deprecated Use filterDocsNav, filterArchitectureNav, filterHubNav instead.
export const filterFrameworkNav = filterDocsNav; // 旧: Framework
export const filterEngineNav = filterArchitectureNav; // 旧: Engine
export const filterRegistryNav = filterHubNav; // 旧: Registry
```

**实际使用情况**：

- `filterFrameworkNav`: 35 处引用（所有 guide/ 路由页面）
- `filterEngineNav`: 16 处引用（所有 engine/ 路由页面）
- `filterRegistryNav`: 5 处引用（registry/ 页面）

**影响**：alias 本身无运行时开销，但名字和实际功能不一致（`filterEngineNav` 实际过滤的是 Architecture 板块），降低代码可读性。

---

## 四、低优先级 — 设计选择可讨论项

### 4.1 4 个 `demo-*.ts` Island 文件高度相似

| 文件                              | 行数 | 差异                                |
| --------------------------------- | ---- | ----------------------------------- |
| `www/app/islands/demo-idle.ts`    | 25   | strategy: `idle`，颜色 `#f59e0b`    |
| `www/app/islands/demo-load.ts`    | 25   | strategy: `load`，颜色 `#22c55e`    |
| `www/app/islands/demo-only.ts`    | 25   | strategy: `only`，颜色 `#ef4444`    |
| `www/app/islands/demo-visible.ts` | 25   | strategy: `visible`，颜色 `#3b82f6` |

**可合并方式**：参数化工厂函数 `createStrategyDemo(tagName, strategy, color, label, description)`，减少 100 行 → 25 行。

**讨论点**：当前独立文件使每种策略清晰可见，适合教学展示。合并后代码更简洁但需要额外的映射表。

---

### 4.2 EN/ZH Guide 页面结构重复

| 文件对                        | EN行数 | ZH行数 | 公共行 |
| ----------------------------- | ------ | ------ | ------ |
| `guide/jsx-components.tsx`    | 390    | 384    | ~80    |
| `guide/signal-reactivity.tsx` | 438    | 332    | ~80    |
| `guide/static-props.tsx`      | 330    | 360    | ~80    |
| `guide/migration-v0.24.tsx`   | 47     | 354    | ~12    |

**讨论点**：

- 共享的 ~80 行主要是 imports、骨架 HTML 结构、CSS——这是标准的 i18n 页面模式
- `migration-v0.24.tsx` 英文版只有 47 行骨架，中文版 354 行完整内容——英文版可能未完成
- 当前 LessJS 没有 i18n 内容管理层，这种重复是成本最低的实现方式

---

## 五、判定为合理的重复

以下重复经评估后**不属于冗余**，不建议合并：

| 项目                              | 判断依据                                                                                                                                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **三 adapter `dsd-hydration.ts`** | Lit/React/Vanilla 各自的 hydration 逻辑有框架特定差异（Lit 用 ReactiveElement 生命周期，React 用 createRoot，Vanilla 直接操作 shadowRoot）。接口层面去重（`DsdHydration` interface）有价值，实现层面合并反而增加复杂度 |
| **三 adapter `ssr.ts`**           | Lit 版 495 行处理 Lit 模板语法，React 版 161 行调用 ReactDOMServer，Vanilla 版 100 行处理字符串——职责完全不同                                                                                                          |
| **`page-styles.ts` 统一导入**     | 22+ 处 `openPropsTokenSheet + pageStyles` 导入是共享基础设施，不是重复                                                                                                                                                 |

---

## 六、结论与行动建议

### 优先级排序

| 顺序 | 行动                                                                            | 影响                                                      | 工作量 |
| ---- | ------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| 1    | **从 `template.ts` 删除 `SignalLike` + `isSignalLike`**                         | 同一包内去重                                              | 小     |
| 2    | **从 `compat-check/types.ts` 删除已在 core 的 6 个 validation 类型**            | 跨包去重，改为 `import type { ... } from '@lessjs/core'`  | 中     |
| 3    | **从 `compat-check/types.ts` 删除 `ManifestDecision` / `SsrAdmissionDecision`** | 同上                                                      | 小     |
| 4    | **从 `cem/types.ts` 删除 `ComponentLayer` / `HydrationStrategy`**               | 改为从 core 导入                                          | 小     |
| 5    | **从 `adapter-vite/entry-descriptor.ts` 删除 `SsrAdmissionDecision`**           | 改为从 core 导入                                          | 小     |
| 6    | **统一 `isValidTagName` 到一处**                                                | 确认 semantic 差异后决定合并或保留两份                    | 小     |
| 7    | **批量重命名 nav-filter deprecated alias**                                      | 50+ 处机械替换                                            | 中     |
| 8    | **评估是否删除 template.ts 废弃函数**                                           | template.ts 内部 SSR 函数仍依赖这些类型和工具，需深度审计 | 大     |

### 建议的 SOP 编号

以上行动建议作为 `docs/sop/v0.24.3/SOP-002-deduplicate-shared-types.md` 记录，与现有 `README.md` 中 Step 5 (Legacy Template Public Surface removal) 互补但不重叠——Step 5 处理 public API 层面的删除，本 SOP 处理内部类型定义层面的去重。

---

## 七、第二轮扫描：组织与文档层面（2026-05-29）

> 扫描覆盖：CLI 工具、路由页面、测试文件、配置结构、遗留 API 使用

### 7.1 两个 `less-add.ts` CLI — 同名不同事

| 文件                                        | 行数 | 职责                                                          |
| ------------------------------------------- | ---- | ------------------------------------------------------------- |
| `packages/compat-check/src/cli/less-add.ts` | 122  | 调用 `generateAddPlan()` — 生成安装计划（改哪些文件）         |
| `packages/hub/src/cli/less-add.ts`          | 558  | 调用 `buildInstallGuidance()` — 安装指引（如何 import、配置） |

两个文件同名 `less-add.ts`，名字暗示它们做同一件事，但实际职责不同：compat-check 的版本做 plan generation，hub 的版本做 install guidance。同名容易让开发者困惑"哪个是真的 less-add"。

另外还有 `packages/compat-check/src/less-add.ts`（232L，库实现），三者形成三角关系：库实现 → 两个 CLI 入口各取所需。

**建议**：hub 的 CLI 更名为 `less-install-guide.ts` 或两个 CLI 合并为一个统一入口，根据子命令分发。

---

### 7.2 `_hub-data-full.ts` — 3867 行数据文件放在 routes/ 下

`www/app/routes/registry/_hub-data-full.ts`：3867 行，全是 `type HubSnapshotMeta` 的自动生成数据，文件头注释：

```typescript
// Auto-generated by hub:scan - DO NOT EDIT
```

虽然 SSG 构建需要它在 routes 下被路由扫描器发现，但这是一个纯数据文件（零组件逻辑），放在 `routes/` 下语义不对。

**建议**：移到 `www/data/` 或 `www/content/registry/`，通过虚拟模块导入。

---

### 7.3 `changelog.ts` — 1956 行内联内容与 CHANGELOG.md 双写

`www/app/routes/changelog.ts` 1956 行，其中开头 ~20 行是组件骨架（import / class / styles），其余 1930+ 行是一个巨大的 `` `<div>...</div>` `` 字符串包含所有 changelog 版本条目。

而仓库里还有 `CHANGELOG.md`，两者内容重复。每次发版要改两个地方。

**建议**：changelog.ts 改为从 content layer 读取 `CHANGELOG.md`，或从 `docs/release/*.md` 动态拼接，消除双写。

---

### 7.4 判定为合理的项目

| 观察                                                                | 判定                               |
| ------------------------------------------------------------------- | ---------------------------------- |
| 三个 adapter `dsd-hydration.test.ts` (65-351L) 结构相似但测各自框架 | 各自框架行为不同，需独立           |
| `@prop()` / `` html` `` 全仓库扫描：0 处生产代码使用                | legacy 清理已完成                  |
| `app` package 仅 75 行 facade                                       | 设计收口，不是冗余                 |
| adapter-vite 27 个源文件，8200+ 行                                  | 复杂度集中在此包，可考虑拆但非紧急 |
| 所有路由页面有导航引用                                              | 无 orphan 页面                     |

---

## 八、第二轮行动建议

| 顺序 | 行动                                                             | 影响           | 工作量 | SOP     |
| ---- | ---------------------------------------------------------------- | -------------- | ------ | ------- |
| 9    | 重命名 hub CLI `less-add.ts` → `less-install-guide.ts`，消除歧义 | 降低认知负担   | 小     | SOP-003 |
| 10   | 将 `_hub-data-full.ts` 移出 `routes/`，改为虚拟模块导入          | 改善代码组织   | 中     | SOP-003 |
| 11   | changelog.ts 改为从 markdown 源读取，消除双写                    | 减少发版工作量 | 中     | SOP-003 |

### 建议的 SOP 编号

以上三项作为 `docs/sop/v0.24.3/SOP-003-cli-and-data-organization.md`。
