# LessJS 客体化审计：手写代码 → 社区方案

> **日期**: 2026-05-26
> **审计范围**: `packages/` 下所有源码

---

## 审计方法

对 `packages/` 下所有 `.ts` 文件扫描，识别可以客体化（用社区维护方案替换手写代码）的模块。判定标准：社区方案体积 ≤ 手写代码、功能更健壮、Deno 兼容。

---

## 发现

| #  | 模块                | 文件                            | 行数  | 当前做法                     |    判定     | 推荐方案                       | 收益                              |
| -- | ------------------- | ------------------------------- | :---: | ---------------------------- | :---------: | ------------------------------ | --------------------------------- |
| 1  | **Signals**         | `packages/signals/`             |  903  | 自研 TC39 DAG polyfill       |  ✅ 客体化  | alien-signals + 35 行 wrapper  | -868 行，借 Vue 3.6 引擎          |
| 2  | **Schema 校验**     | `hub/src/schema.ts`             |  459  | 手写 typeof 链校验           |  ✅ 客体化  | Valibot                        | -400 行，自动类型推导             |
| 3  | **Manifest 校验**   | `core/src/validate-manifest.ts` |  466  | 手写字段校验 + tagName regex |  ✅ 客体化  | Valibot                        | -420 行                           |
| 4  | **DsdElement 调度** | `core/src/dsd-element.ts`       |  ~50  | 手写微任务 + 订阅数组管理    |  ✅ 客体化  | alien `effect()`               | -45 行（含在 #1）                 |
| 5  | **模板信号收集**    | `core/src/template.ts`          |  ~33  | 手写递归收集 + 值解析        |  ✅ 客体化  | alien `effect()` + brand check | -33 行（含在 #1）                 |
| 6  | **HTML 转义**       | `core/src/html-escape.ts`       |  229  | 手写 escapeHtml/escapeAttr   |   ❌ 不换   | —                              | `escape-html` 2KB，体积等价，不值 |
| 7  | **CEM 解析**        | `core/src/cem-parser.ts`        |  458  | 手写 JSON 遍历 + schema 推断 |   ❌ 不换   | —                              | 社区无合适 Deno 兼容方案          |
| 8  | **安全工具**        | `core/src/security.ts`          |  31   | DANGEROUS_KEYS + script 检测 |   ❌ 不换   | —                              | 极简，引入库是过度工程            |
| 9  | **HTML 净化**       | `content/src/blog/markdown.ts`  |   —   | sanitize-html                | ✅ 已客体化 | —                              | —                                 |
| 10 | **导航扫描**        | `content/src/nav/scanner.ts`    | 200+  | 手写文件系统遍历             |   ❌ 不换   | —                              | 胶水代码，无现成替代              |
| 11 | **i18n**            | `i18n/src/index.ts`             |  85   | Minimal 实现                 |   🟡 未来   | i18next                        | 当前体量小，需要复数/格式化时再换 |
| 12 | **DSD 渲染**        | `core/src/render-dsd.ts`        |  430  | 手写 DSD 渲染管线            |   ❌ 不换   | —                              | 核心竞争力，不应客体化            |
| 13 | **Build 工具链**    | `adapter-vite/src/`             | 2000+ | Vite/Rolldown/Hono           | ✅ 已客体化 | —                              | —                                 |
| 14 | **DOM 模拟**        | `core/src/dom-simulation.ts`    |   —   | happy-dom                    | ✅ 已客体化 | —                              | —                                 |
| 15 | **Markdown**        | `content/src/blog/markdown.ts`  |   —   | gray-matter + marked         | ✅ 已客体化 | —                              | —                                 |

---

## 详细分析

### ✅ #1：Signals → alien-signals

详见 [20260526-signals-decision.md](./20260526-signals-decision.md)。

### ✅ #2-3：Schema/Manifest 校验 → Valibot

`hub/src/schema.ts`（459 行）和 `core/src/validate-manifest.ts`（466 行）共 925 行手写 JSON 校验。

**当前做法**：逐字段 `typeof x !== 'string'` + regex + 自定义错误消息。

**Valibot 替代**：

```ts
import * as v from 'valibot';

const HubPackageSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  scope: v.string(),
  version: v.pipe(v.string(), v.nonEmpty()),
  manifestHash: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
  tags: v.array(v.object({
    tagName: v.pipe(v.string(), v.regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/)),
    compatibility: v.union([
      v.literal('ssr-capable'),
      v.literal('client-only'),
      v.literal('rejected'),
      v.literal('experimental-dom'),
    ]),
    // ...
  })),
  // ...
});

// 自动推断 TypeScript 类型
type HubPackage = v.InferOutput<typeof HubPackageSchema>;

// 校验
const result = v.safeParse(HubPackageSchema, data);
if (!result.success) {
  // result.issues 是结构化错误列表
}
```

**收益**：Valibot ~3KB，tree-shakeable，纯 JS 无 eval，Deno 原生支持。Schema 定义同时产出 TS 类型 + 运行时校验——不再手写两套。

### ❌ #6：HTML 转义为什么不动

`escape-html` npm 包 2KB，`html-escape.ts` 229 行。两者体积相当。手写版零依赖、零版本漂移风险。`escapeAttr` 的引号转义逻辑是 LessJS 特有的 DSD 输出需求——不值得换。

### ❌ #7：CEM 解析为什么不动

`cem-parser.ts` 解析 Custom Element Manifest JSON——这是 LessJS Hub 管线的专有格式。社区有 `@custom-elements-manifest/analyzer` 但那是**生成**工具（TypeScript → CEM JSON），不是**消费**工具（CEM JSON → LessJS 内部结构）。没有合适替代品。

### 🟡 #11：i18n 为什么现在不换

`i18n/src/index.ts` 仅 85 行。当前需求简单（多语言路由 + 内容文件映射）。i18next（50KB+）是过度工程。如果将来需要复数规则、日期/数字格式化、动态命名空间加载，再评估切换。

---

## 汇总

| 类别          | 模块数 |  行数  |
| ------------- | :----: | :----: |
| ✅ 建议客体化 |   5    | ~1,911 |
| ✅ 已客体化   |   5    |  保持  |
| ❌ 不需客体化 |   5    | ~1,203 |
| 🟡 未来考虑   |   1    |   85   |

**总净删潜力**：~1,750 行手工代码，替换为 ~3KB 社区维护包。
