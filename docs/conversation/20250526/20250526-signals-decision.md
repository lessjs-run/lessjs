# LessJS Signals 方案决策

> **日期**: 2026-05-26
> **范畴**: `@lessjs/signals` 包的去留与技术选型
> **前提**: pre-1.0，API 变更可接受

---

## 1. 现状审计

### 1.1 代码构成（903 行，6 文件）

| 层 | 文件 | 行数 | 职责 | 是否 LessJS 特有 |
|----|------|:---:|------|:---:|
| Engine | `engine.ts` | 94 | 类型定义 + 单例 + 原生 Signal 检测 | ❌ 通用 |
| Engine | `polyfill.ts` | 413 | TC39 Signal 提案的 DAG polyfill | ❌ 通用 |
| Framework | `framework.ts` | 107 | `.value` getter/setter wrapper | ❌ 通用 |
| Sugar | `sugar.ts` | 188 | islandEffect/channel/themeSignal/untracked | ✅ LessJS 特有 |
| Types | `types.ts` | 49 | WritableSignal/ReadonlySignal/Unsubscribe | ❌ 通用 |
| Barrel | `index.ts` | 52 | re-export | ❌ 通用 |

### 1.2 sugar.ts 使用情况

| 功能 | 生产代码引用 | 测试引用 | 判定 |
|------|:---:|:---:|------|
| `islandEffect()` | 0 | 仅自己的测试文件 | **死代码** |
| `channel()` | 0 | 仅自己的测试文件 | **死代码** |
| `themeSignal` | 0 | 仅自己的测试文件 | **死代码** |
| `untracked()` | 0 | 自己的测试 | **死代码** |
| `batch()` | — | — | **已被标记废弃（no-op）** |

`@lessjs/signals/sugar` 的 188 行在所有生产代码中无消费者。

### 1.3 唯一的生产引用

```ts
// packages/core/src/index.ts:45
export { computed, effect, signal } from '@lessjs/signals/framework';
```

整个 `@lessjs/signals` 包（903 行）存在的意义：给 `core` 提供 `signal`/`computed`/`effect` 三个函数的 re-export。

### 1.4 core 现有依赖

```json
// packages/core/deno.json
"imports": {
  "parse5": "npm:parse5@7.0.0",
  "@lessjs/signals": "jsr:@lessjs/signals@^0.21.16",
  "@lessjs/signals/framework": "jsr:@lessjs/signals@^0.21.16/framework"
}
```

core 从来不是"零依赖"。已经有 `parse5`。

### 1.5 DsdElement 的手动订阅管理

ReactiveHost 协议通过以下手动代码桥接信号与 DOM：

| 代码 | 行 | 职责 |
|------|:---:|------|
| `_signalUnsubscribers[]` | 3 | 手动维护清理列表 |
| `_reactiveUpdateQueued` | 3 | 手动防重复批处理的 flag |
| `subscribeTo()` | 12 | 手动逐个调用 signal.subscribe() |
| `requestReactiveUpdate()` | 3 | 手动排入微任务队列 |
| `_scheduleReactiveUpdate()` | 15 | 手动 queueMicrotask 批处理 |
| `_subscribeTemplateSignals()` | 8 | 手动递归遍历 TemplateResult 收集所有 signal |
| `_disposeSignalSubscriptions()` | 5 | 手动遍历数组逐个 dispose |

这些 ~50 行的手动管理代码可以用 `effect()` 替换：
- alien 的 `effect()` 自动追踪依赖图（不需要 `collectTemplateSignals`）
- alien 内部处理微任务批处理（不需要 `_scheduleReactiveUpdate`）
- `effect()` 返回 dispose 函数（不需要 `_signalUnsubscribers[]`）

### 1.6 template.ts 的信号集成

| 代码 | 行 | 职责 |
|------|:---:|------|
| `isSignalLike()` | 8 | duck-type 检测（.value + .subscribe） |
| `collectTemplateSignals()` | 22 | 递归遍历收集 signal |
| `resolveSignalValue()` | 3 | `.value` 取值 |

---

## 2. 三个方案

### 2.1 方案 A：继续自研

保持 `@lessjs/signals` 全部代码。

| 利 | 弊 |
|----|----|
| 完全受控，不受外部 breaking change 影响 | 520 行非核心 DAG 算法 + wrapper 持续维护 |
| TC39 提案 100% 对齐（原生优先降级） | TC39 提案停滞在 Stage 1 已 2 年，浏览器原生预计 2027+ |
| API 零改动 | 新增功能（如 effectScope）需要自行实现 |
| polyfill.ts 的 DAG 维护（epoch 溢出保护、duplicate unwatch 等）已是历史遗留 |

### 2.2 方案 B：换 preact/signals-core

删除 `@lessjs/signals`，用 `@preact/signals-core`。

| 利 | 弊 |
|----|----|
| `.value` API 完全相同，零代码改动 | 4.4KB（比 alien 大 3KB） |
| 内置 batch() + effectScope() | 维护节奏偏慢（Preact 团队优先级不在此） |
| 427 万周下载，Preact/SolidJS 概念源 | 算法相比 alien 偏旧（纯 Pull-based） |
| LessJS 唯一能零破坏替代的社区方案 | |

### 2.3 方案 C：换 alien-signals

删除 `@lessjs/signals`，用 `alien-signals` + 35 行 `.value` wrapper。

| 利 | 弊 |
|----|----|
| 1.6KB 最小体积 | 需要 35 行 wrapper 层 |
| 780 万周下载，Vue 3.6 核心算法 | 由单人主要维护（Johnson Chu, StackBlitz） |
| Push-Pull 混合算法 + 迭代栈，性能最优 | `.value` wrapper 引入了薄的间接层 |
| 极活跃维护（2026.05 新版本） | |
| 跨语言移植（Golang, Rust, Dart, Lua, C#, Java） | |
| 内置 effectScope() | 不支持 batch()（LessJS 已废掉自己的 batch，影响极小） |

---

## 3. 选项对比

| 维度 | A: 自研 | B: preact | C: alien + wrapper |
|------|:---:|:---:|:---:|
| **代码变化** | 0 | -903 + 0 | -903 + 35 |
| **净行数** | 0 | -903 | -868 |
| **API 破坏** | 无 | 🟢 零 | 🟢 零（wrapper 保持 .value） |
| **包体积变化** | 0 | +3KB | -2.4KB |
| **batch()** | ❌ 已废弃 | ✅ 内置 | ❌ 不支持 |
| **effectScope()** | ❌ 需自实现 | ✅ 内置 | ✅ 内置 |
| **维护负担** | 🔴 520 行 DAG | 🟢 零 | 🟢 35 行 wrapper |
| **TC39 对齐** | 🟢 100% | 🟡 灵感源 | 🟡 算法级 |
| **社区背书** | 无 | 🟢 427万/周 | 🟢 780万/周 |
| **算法先进性** | 🟡 TC39 标准 | 🟡 纯 Pull | 🟢 Push-Pull 混合 |
| **维护者风险** | 无 | 🟡 Preact 团队 | 🟡 单人（但 Vue 3.6 背书） |
| **框架 API 层** | ✅ 自有 | ✅ 自有 | ✅ 自有（wrapper） |

---

## 4. 框架 API 层的考量

### 4.1 其他框架怎么做

| 框架 | Signal API | 底层引擎 | 策略 |
|------|----------|---------|------|
| **Vue 3.6** | `ref()` → `.value` | alien-signals（借算法） | 自有 API + 借社区引擎 |
| **SolidJS** | `createSignal()` → `[get, set]` | 完全自研 | 自有 API + 自研引擎 |
| **Svelte 5** | `$state()` | 完全自研（编译器） | 自有 API + 自研引擎 |
| **Preact** | `signal()` → `.value` | @preact/signals-core | 自有 API + 自研引擎 |
| **Angular** | `signal()` → `signal()` | 自研 | 自有 API + 自研引擎 |

**没有框架裸用外部 signals API。** Vue 是最接近的类比——借了 alien 的算法但保留了 `ref.value`。理由相同：框架 API 表面积是 UX，不是实现细节。`.value` getter/setter 比 `count()`/`count(1)` 函数调用更符合 JS 直觉。

### 4.2 为什么推荐 wrapper

LessJS 用 alien 裸引擎 + 35 行 wrapper 的模式就是 Vue 模式。wrapper 提供了：
- `.value` 语法一致性（所有消费者代码不变）
- `subscribe()` 方法（ReactiveHost 协议依赖它）
- brand symbol（`isSignalLike()` 检测的锚点）
- 未来 TC39 语法对齐的单一换装点

裸用 alien 意味着 LessJS 的 signal API 由外部库定义——框架不应该把 API 主权交给实现层。

---

## 5. 为什么 alien 优于 preact

做这个比较的前提是：两个方案都需要加自己的 API wrapper（preact 虽然 `.value` 同款，但也需要 brand symbol + subscribe 集成）。在均需 wrapper 的情况下：

| 关键维度 | alien | preact | 对 LessJS 的影响 |
|---------|:---:|:---:|------|
| 体积 | 1.6KB | 4.4KB | 3KB 差异在 SSR bundle（360KB）中不可见 |
| 算法 | Push-Pull 混合 | 纯 Pull | 信号深度 ≤2，两者性能等价 |
| 维护活跃度 | 🔥 极活跃 | 🟢 偏慢 | alien 修复更快，preact 更稳定 |
| batch() | ❌ | ✅ | LessJS 已废掉 batch，影响为零 |
| effectScope() | ✅ | ✅ | 等价 |

**选择 alien 的决定性因素**：维护活跃度。preact/signals-core 更新频率 ~2-3 月/次，bug fix 可能排队数月。alien 的 StackBlitz + Vue 3.6 背书意味着持续投入。体积和算法差异在 LessJS 使用场景中不可见。

---

## 6. 社区立场

alien-signals 不是 Vue 的组织下属包。作者 Johnson Chu 是 StackBlitz 工程师（恰好也是 Vue 响应式代码的作者），但 alien 是他独立维护的纯 JS 库。Golang、Rust、Dart、Lua、C#、Java 都有其移植——一个 Vue 定制库不会有这种跨语言扩散。

LessJS 是 DSD/WC 赛道，不是通用框架。使用 alien 不产生阵营归属问题。

---

## 7. 迁移方案

### 7.1 删除

```
packages/signals/              整个目录（903 行 + 8 测试文件）
```

### 7.2 新建

`packages/core/src/signals.ts`（~40 行）：

```ts
import {
  signal as _signal,
  computed as _computed,
  effect,
} from 'alien-signals';

export const SIGNAL_BRAND = Symbol('lessjs:signal');

export { effect };

export function signal<T>(v: T) {
  const s = _signal(v);
  return {
    [SIGNAL_BRAND]: true,
    get value(): T { return s(); },
    set value(n: T) { s(n); },
    subscribe(fn: (v: T) => void) {
      return effect(() => fn(s()));
    },
  };
}

export function computed<T>(fn: () => T) {
  const c = _computed(fn);
  return {
    [SIGNAL_BRAND]: true,
    get value(): T { return c(); },
    subscribe(fn2: (v: T) => void) {
      return effect(() => fn2(c()));
    },
  };
}
```

### 7.3 修改

| 文件 | 改动 |
|------|------|
| `core/deno.json` | 删 `@lessjs/signals` imports，加 `alien-signals` |
| `core/src/index.ts` | `from '@lessjs/signals/framework'` → `from './signals.js'` |
| `core/src/template.ts` | `isSignalLike()` 更新为 alien brand 检测 + `.value` 兼容 |
| `core/src/dsd-element.ts` | 简化 ReactiveHost 手动订阅管理，用 `effect()` 替代 |
| `deno.json` (root) | 删 workspace member `packages/signals` |
| `deno.json` (root) | 删 signals 相关 imports alias |
| `create/cli.ts` | 模板字符串不变（wrapper 保持 `.value`） |

### 7.4 净变化

| 操作 | 行数 |
|------|:---:|
| 删除 `@lessjs/signals` | -903 |
| DsdElement 简化 | -50 |
| template.ts 简化 | -33 |
| 新建 `core/src/signals.ts` | +40 |
| 其他文件调整 | ~10 |
| **净删** | **~936 行** |

---

## 8. DsdElement 调度系统：全量借 effect()

### 当前手动调度

```ts
// ~50 行手动代码
_signalUnsubscribers: Array<() => void> = [];
_reactiveUpdateQueued = false;

subscribeTo(source) { ... }
requestReactiveUpdate() { this._scheduleReactiveUpdate(); }
_scheduleReactiveUpdate() {
  if (this._reactiveUpdateQueued) return;
  this._reactiveUpdateQueued = true;
  queueMicrotask(() => {
    this._reactiveUpdateQueued = false;
    if (!this.isConnected) return;
    this._initialRenderDone ? this._patchBindings() : this._renderIntoShadowRoot();
  });
}
_subscribeTemplateSignals(result) { /* 手动递归遍历 collectTemplateSignals */ }
_disposeSignalSubscriptions() { for (const u of this._signalUnsubscribers.splice(0)) u(); }
```

### 换 effect() 后

```ts
// ~5 行
connectedCallback() {
  this._disposeEffect = effect(() => {
    if (!this.isConnected) return;
    this._patchBindings(this.render());
  });
}
disconnectedCallback() { this._disposeEffect?.(); }
```

alien 的 `effect()` 自动处理：依赖追踪、微任务批处理、防重复触发、清理。`collectTemplateSignals` 不再需要——`effect()` 自动知道 `render()` 里读了哪些 signal。

---

## 9. 风险

| 风险 | 缓解 |
|------|------|
| alien-signals 由单人维护，可能停更 | API 表面积 3 个函数，wrapper 层隔离，切换 preact 约半小时 |
| wrapper 引入了薄的间接层 | 35 行，纯 getter/setter 代理，无额外逻辑，性能影响为零 |
| alien 不支持 batch() | LessJS 已废掉自己的 batch，DsdElement 用 queueMicrotask 批处理，无影响 |

---

## 10. 结论

**推荐方案 C：alien-signals 引擎 + 35 行 `.value` wrapper。**

- 删 `@lessjs/signals` 包，净减 ~936 行
- 保留 `.value` API（零消费者破坏）
- 借 alien 的 Push-Pull 引擎（Vue 3.6 同款）
- 借 alien 的 `effect()`（替换 DsdElement ~50 行手动调度）
- 借 alien 的 `effectScope()`（无需自实现）
- 框架保持自己的 API surface（品牌层隔离实现细节）

**不推荐裸用 alien**：框架应该有 API 层。Vue 没有让用户写 `count()`/`count(1)`，LessJS 也不该。

**不推荐继续自研**：520 行 DAG 代码不是核心竞争力——它是 TC39 提案的工程实现，alien 团队更擅长维护。

> 全仓库客体化审计见 [20250526-reification-audit.md](./20250526-reification-audit.md)
