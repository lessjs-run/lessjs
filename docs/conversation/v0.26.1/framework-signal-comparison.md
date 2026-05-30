# 跨框架信号/响应式系统比较报告

**面向 LessJS v0.26.x 架构决策**
**日期**: 2026-05-30
**基础信号库**: alien-signals (Push-Pull-Push 混合模型, 双向链表依赖追踪)

---

## 目录

1. [总体对比矩阵](#1-总体对比矩阵)
2. [SolidJS 信号系统](#2-solidjs-信号系统)
3. [Svelte 5 Runes](#3-svelte-5-runes)
4. [Vue 3.6 Vapor Mode (Alien Signals)](#4-vue-36-vapor-mode-alien-signals)
5. [Preact Signals](#5-preact-signals)
6. [Lit Reactive System](#6-lit-reactive-system)
7. [LessJS 可采用的模式与应避免的坑](#7-lessjs-可采用的模式与应避免的坑)
8. [总结: LessJS 信号架构建议](#8-总结-lessjs-信号架构建议)

---

## 1. 总体对比矩阵

| 维度 | SolidJS | Svelte 5 | Vue Vapor | Preact Signals | Lit |
|------|---------|----------|-----------|----------------|-----|
| **信号原语** | createSignal (getter/setter) | $state (透明读写) | ref() / signal() | signal() (.value) | @state / Signal.State |
| **派生** | createMemo | $derived | computed() | computed() | (无原生) |
| **副作用** | createEffect | $effect | watchEffect / effect() | effect() | ReactiveController + requestUpdate |
| **上下文** | createContext + Provider (Owner树查找) | setContext/getContext (引用传递) | provide/inject (原型链) | createContext + Provider (Props传递) | @provide/@consume (DOM事件) |
| **上下文响应式** | ✅ 返回原始信号getter引用 | ✅ 存储$state对象引用 | ✅ inject获取原始ref引用 | ✅ 传递signal对象引用 | ✅ subscribe模式 |
| **DOM绑定** | 编译时JSX→DOM操作 | 编译时template→$.template_effect | 编译时template→DOM操作 | 运行时JSX (HOC/Hook) | 运行时 (LitElement) |
| **虚拟DOM** | ❌ 无VDOM | ❌ 无VDOM | ❌ 无VDOM (Vapor) | Preact有VDOM, signals绕过部分 | ✅ 有 (lit-html) |
| **原子更新** | ✅ 精确到文本节点 | ✅ 编译时静态分析+运行时effect | ✅ signal→effect→DOM | ✅ signal.value→组件重渲染 | ❌ requestUpdate→全组件 |
| **Effect清理** | onCleanup + createRoot | effect return函数 + $effect.root | effectScope + scope.stop() | effect返回dispose + batch | hostDisconnected |
| **批量更新** | batch() | 自动(await边界) | batch() 内置 | batch() | await this.updateComplete |

---

## 2. SolidJS 信号系统

### 2.1 信号原语

```typescript
// 创建信号: 返回 [getter函数, setter函数]
const [count, setCount] = createSignal(0);

// 读取: 调用getter函数 (在响应式上下文中自动注册为依赖)
count(); // 0

// 写入: 直接值 或 函数更新
setCount(5);
setCount(c => c + 1);

// 相等性检查: 默认===, 可自定义或设为false强制更新
const [name, setName] = createSignal("Bob", {
  equals: (prev, next) => prev.length === next.length
});
```

**内部架构: Signal + Computation 双向依赖**
```
Signal (状态源)  ◄────────►  Computation (计算单元)
  observers[]                 sources[]
  observerSlots[]             sourceSlots[]
```

- **读取时**: `readSignal()` 检测全局 `Listener` (当前执行的Computation) → 建立双向链接
- **写入时**: `writeSignal()` → 遍历 observers → 标记 STALE → PUSH 通知
- **observerSlots**: O(1) 时间删除依赖 (当Computation重新执行时清理旧依赖)
- **版本号系统**: Link.version 实现 O(1) 判断是否需要更新

### 2.2 派生信号 (createMemo)

```typescript
const doubleCount = createMemo(() => count() * 2);
// 惰性求值: 仅在依赖变化且被读取时重新计算
// pure: true → 作为派生，有自己独立的observers去通知下游
```

- **惰性求值**: Memo只在被读取(`getValue`)时才检查脏标记并重新计算
- **纯计算特性**: Memo的`pure=true`. 写入Signal时标记Memo为STALE, 读取Memo时再递归检查依赖
- **下游传播**: 如果Memo自己也有observers, 变化会沿依赖图向下传播

### 2.3 副作用 (createEffect)

```typescript
createEffect(() => {
  console.log("count is", count()); // 自动追踪count
  onCleanup(() => console.log("cleaning up previous run"));
});
```

- **首次执行**: 设置Listener → 运行fn → 自动收集依赖
- **重新执行**: 写入Signal → PUSH标记Computation为STALE → 调度器在microtask执行
- **清理**: 重新执行前先运行上次注册的`onCleanup`

### 2.4 上下文 (createContext + useContext)

```typescript
// 创建
const CounterContext = createContext<number>(0);

// 提供者组件
<CounterContext.Provider value={count()}>
  <Child />
</CounterContext.Provider>

// 消费者 (返回的是Provider指定的value值)
const value = useContext(CounterContext);
```

**关键发现: useContext 的连接机制**

useContext实现:
```typescript
export function useContext<T>(context: Context<T>): T {
  let value: undefined | T;
  return Owner && Owner.context && 
    (value = Owner.context[context.id]) !== undefined
    ? value
    : context.defaultValue;
}
```

- **沿Owner树向上查找**: 不是组件树, 是Owner树 (createRoot/createEffect/createMemo构建)
- **返回原始引用**: 如果Provider传入的是getter函数, useContext返回的就是该getter函数引用
- **最佳实践**: Provider传入`value={count}` (getter函数) → 子组件`useContext`获得的是getter函数 → 调用时(`value()`)实时获取最新值
- **不是副本**: Context存储的是引用传递, 不是值的快照

### 2.5 JSX 编译: 编译时 → 直接DOM操作

```
输入JSX:
<div>Hello {name()}</div>

编译输出:
const _tmpl$ = _$template(`<div>Hello </div>`);  // 静态模板一次解析
const _el$ = _tmpl$.cloneNode(true);            // 组件实例clone
// 动态内容:
_$insert(_el$, name, null);  // 直接对DOM文本节点创建响应式绑定
```

- **babel-plugin-jsx-dom-expressions**: JSX → DOM操作的编译器
- **模板提取**: 静态HTML序列化为``解析 → 实例用`cloneNode`克隆
- **动态绑定**: `{expr}`编译为直接信号绑定, 无需Diff/Patch
- **内置组件优化**: `<For>`, `<Show>`, `<Switch>`等在编译时特殊处理

### 2.6 Effect清理策略

```typescript
// onCleanup: 注册到当前Owner
createEffect(() => {
  const timer = setInterval(fn, 1000);
  onCleanup(() => clearInterval(timer));
});

// createRoot: 手动管理生命周期
const dispose = createRoot(dispose => {
  createEffect(() => { /* ... */ });
  return dispose; // 返回销毁函数
});
dispose(); // 手动清理所有子作用域

// getOwner: 获取当前Owner, 用于高级场景
const owner = getOwner();
runWithOwner(owner, () => { /* ... */ });
```

**Owner树清理规则**:
1. 遍历子节点 → 先执行子节点onCleanup
2. 递归清理owned子节点
3. 父Owner销毁时自动清理所有子树

---

## 3. Svelte 5 Runes

### 3.1 信号原语 ($state)

```svelte
<script>
  let count = $state(0);     // 透明读写, 不需要.value
  let user = $state({        // 深度代理 (默认)
    name: 'Justin',
    tags: ['sv', 'ts']
  });
</script>

<button onclick={() => count++}>clicks: {count}</button>
```

**编译产物**:
```javascript
let count = $.state(0);
// 读取编译为 $.get(count) — 注册依赖
// 写入编译为 $.set(count, value) — 通知更新
// 模板编译为 $.template_effect(() => $.set_text(text, `clicks: ${$.get(count)}`))
```

**关键设计**:
- 普通变量读写, 编译器在读写处重写为signal调用
- **$state.raw**: 跳过代理, 用于不需要深度响应的大对象
- **$state.snapshot**: 获取纯副本, 用于API传递
- **$state.eager**: 强制同步刷新, 用户交互场景

### 3.2 派生 ($derived)

```javascript
let doubled = $derived(count * 2);       // 单表达式
let total = $derived.by(() => {          // 多语句
  let sum = 0;
  for (const n of numbers) sum += n;
  return sum;
});
```

- **惰性求值**: 依赖变化不立即计算, 仅在被读取时计算
- **纯度约束**: 编译器拒绝内含变异的代码
- **引用相等优化**: 计算结果与上次===相等则跳过下游通知
- **可覆盖派生**(since 5.25): `let likes = $derived(post.likes)` 可被临时赋值

### 3.3 副作用 ($effect / $effect.pre)

```javascript
$effect(() => {
  document.title = `count: ${count}`;
  return () => cleanup(); // 清理函数
});

// $effect.pre: DOM更新前运行
$effect.pre(() => {
  autoscroll = atBottom();
});
```

- **依赖规则**: 只有同步读取注册为依赖, setTimeout/Promise内不追踪
- **清理**: effect return的清理函数在下次执行前和unmount时调用
- **untrack(fn)**: 包裹读取但不注册依赖

### 3.4 上下文 (setContext/getContext)

```javascript
// 创建类型安全上下文 (Svelte 5.40+)
export const [getUserContext, setUserContext] = createContext<User>();

// 父组件
let counter = $state({ count: 0 });
setUserContext(counter);

// 子组件
const counter = getCounter();
// counter.count 变化 → 自动触发子组件响应式更新
```

**关键机制**:
- **引用传递**: 传递$state对象的引用, 消费方直接访问源
- **不能重新赋值**: `counter = { count: 1 }` 会断开链接
- **原始值需函数包装**: `getCounter(() => count)` 
- **生命周期**: context绑定在组件树实例上, 组件销毁时消失
- **SSR安全**: Context作用域绑定组件树, 不同请求间隔离

### 3.5 $effect.root

```javascript
class Settings {
  theme = $state<'light' | 'dark'>('light');
  #cleanup: () => void;

  constructor() {
    this.#cleanup = $effect.root(() => {
      $effect(() => localStorage.setItem('theme', this.theme));
    });
  }
  destroy() { this.#cleanup(); }
}
```

- 在组件生命周期之外创建effect作用域
- 返回清理函数, 手动控制销毁

### 3.6 编译器智能优化

```javascript
// 如果count从未被写入, 编译器剥离$state层
// let count = 0 保持为普通let, 不产生signal开销
```

**编译时vs运行时**:
- Svelte 4: 编译时静态分析 → `$:`推导依赖 → 提取到.js文件时失效
- Svelte 5: 运行时signal动态追踪 → 提取逻辑到.js不破坏响应式 → 组件内外行为一致

---

## 4. Vue 3.6 Vapor Mode (Alien Signals)

### 4.1 信号原语

```typescript
// 传统API (仍可用)
const count = ref(0);
const doubled = computed(() => count.value * 2);

// 新signal API (底层更高性能)
const fastCount = signal(0);
const fastDoubled = computed(() => fastCount() * 2);
```

**内部: 基于alien-signals的Push-Pull-Push三阶段模型**

```
阶段1: PUSH (标记脏值)
  signal更新 → 遍历订阅者 → 标记computed/effect为'dirty'
  只标记, 不计算

阶段2: PULL (惰性计算)  
  访问computed → 检查dirty → 递归检查依赖链
  不脏则不重新计算

阶段3: PUSH (触发更新)
  computed值变化 → 推送给依赖的effect → 执行副作用
  值相等性检查, 相同值不触发
```

**核心数据结构 — 双向链表**:
```typescript
interface Link {
  version: number;              // 版本号 (O(1)判断是否需要更新)
  dep: ReactiveNode;            // 依赖方向
  sub: ReactiveNode;            // 订阅方向
  prevSub / nextSub: Link;      // 双向链接 (订阅者侧)
  prevDep / nextDep: Link;      // 双向链接 (依赖侧)
}

interface ReactiveNode {
  deps / depsTail: Link;        // 依赖链表
  subs / subsTail: Link;        // 订阅者链表
  flags: ReactiveFlags;         // 状态标记
}
```

**性能优势**:
- O(1) 插入/删除 (vs Set/Map的O(log n))
- 减少GC压力 (消除Dep类实例, 内存减少×300,011)
- 版本标记实现O(1)脏值检查

### 4.2 Effect生命周期

```typescript
export class ReactiveEffect<T> {
  run(): T {
    if (!this.active) return this.fn();
    cleanup(this);                  // 清理旧依赖
    const prevSub = startTracking(this); // 开始追踪新依赖
    try { return this.fn(); }
    finally { endTracking(this, prevSub); }
  }
}
```

**effectScope**:
```typescript
const scope = effectScope();
scope.run(() => {
  effect(() => console.log(x()));
  effect(() => console.log(y()));
});
scope.stop(); // 一次性停止所有effect
```

### 4.3 Vapor Mode: 信号直接绑定DOM (无VDOM)

**编译对比**:

传统VDOM:
```javascript
function render(_ctx) {
  return _createElementVNode("button", { onClick }, 
    "Count: " + _toDisplayString(_ctx.count));
}
```

Vapor Mode:
```javascript
const t0 = template("<button>Count: </button>");
function render(_ctx) {
  const n0 = t0();
  effect(() => {
    setText(n0.firstChild.nextSibling, _ctx.count());
  });
  on(n0, "click", _ctx.increment);
  return n0;
}
```

**核心机制**: Signal变化 → 依赖追踪 → effect执行 → 直接DOM更新 (setText/setAttr)
**完全跳过**: VNode创建 → Diff → Patch

### 4.4 Provide/Inject

- 基于原型链或运行时查找
- inject获取的值是原始ref对象引用
- 保持传统Vue的provide/inject语义 (非Vapor Mode特有)

---

## 5. Preact Signals

### 5.1 信号原语

```javascript
import { signal, computed, effect } from '@preact/signals-core';

const count = signal(0);
console.log(count.value);  // 0 — 读取
count.value = 1;           // 写入 — 相等时(===)不触发更新

// peek(): 读取但不订阅
const current = count.peek();

const doubled = computed(() => count.value * 2); // 惰性求值

const dispose = effect(() => {
  console.log(doubled.value);
  return () => cleanup(); // 返回清理函数
});
dispose(); // 手动停止
```

### 5.2 JSX集成 (Preact)

**直接绑定到文本节点**:
```jsx
// 优化模式: 信号直接传入JSX
<p>{count}</p>  // 文本直接更新, 组件不重新渲染

// 非优化模式: 访问.value
<p>{count.value}</p>  // 触发组件重新渲染
```

**工作原理**:
- Preact检测到signal直接传入JSX位置 → 跳过VDOM diff
- 直接绑定信号到DOM文本节点 → signal变化时原位更新
- 通过Preact的options hooks系统深度接入

### 5.3 React集成 (@preact/signals-react)

- 基于 `useSyncExternalStore` 订阅signal变化
- 组件内访问`.value` → React组件重新渲染
- V3移除了基于React内部机制的自动追踪
- 可选的Babel插件 `@preact/signals-react-transform` 用于构建时优化

### 5.4 批量更新

```javascript
import { batch, untracked } from '@preact/signals-core';

batch(() => {
  todos.value = [...todos.value, newTodo];
  text.value = '';
}); // 回调结束一次性刷新

// 嵌套batch: 最外层结束才刷新
```

### 5.5 上下文模式

```javascript
// 工厂函数封装signals
function createAppState() {
  const todos = signal([]);
  const completed = computed(() => todos.value.filter(t => t.done).length);
  return { todos, completed, addTodo, removeTodo };
}

// 通过Context传递
const AppState = createContext();
<AppState.Provider value={createAppState()}>
  <App />
</AppState.Provider>
```

- 通过props/context传递signal对象引用
- 消费方直接读取`.value` → 自动订阅
- 不是框架内置的"响应式上下文", 而是模式层面的使用方式

---

## 6. Lit Reactive System

### 6.1 响应式属性

```typescript
import { LitElement, html } from 'lit';
import { property, state } from 'lit/decorators.js';

class MyElement extends LitElement {
  @property({ type: String })
  name = 'World';         // 公共属性 (有attribute映射)

  @state()
  private _count = 0;     // 内部状态 (无attribute)
}
```

- **@property**: 响应式公共属性, 支持attribute ↔ property同步
- **@state**: 内部响应式状态, 变化时触发更新
- **响应式更新周期**: property变化 → `requestUpdate()` → `shouldUpdate()` → `render()` → `updated()`
- **浅层响应**: 仅检测属性引用变化, 对象内部突变需手动调用requestUpdate

### 6.2 ReactiveController (Effect-like模式)

```typescript
class ClockController implements ReactiveController {
  hostConnected() { /* 设置监听器 */ }
  hostUpdated()   { /* DOM更新后读取 */ }
  hostDisconnected() { /* 清理监听器 */ }
  
  onStateChange() {
    this.host.requestUpdate(); // 手动触发更新
  }
}
```

- **本质**: 通过生命周期钩子 + 手动requestUpdate实现"effect"
- **非自动追踪**: 不自动收集依赖, 需要显式调用requestUpdate
- **与指令配合**: 控制器可有指令, 指令可以是控制器

### 6.3 Context协议

```typescript
// 创建上下文
const loggerContext = createContext<Logger>('logger');

// 提供方
@provide({ context: loggerContext })
@state()
private _logger: Logger;

// 或控制器方式
private _provider = new ContextProvider(this, {
  context: loggerContext, initialValue: myLogger
});
this._provider.setValue(newLogger); // 动态更新

// 消费方
@consume({ context: loggerContext, subscribe: true })
@property({ attribute: false })
public logger?: Logger;

// 或控制器方式
private _logger = new ContextConsumer(this, {
  context: loggerContext, subscribe: true,
  callback: (value) => { /* 更新逻辑 */ }
});
```

**核心机制**:
- **基于DOM事件**: 消费者触发`context-request`事件(冒泡) → 提供者监听并返回callback
- **跨框架互操作**: 任何DOM元素(React/Vue/原生)都可参与
- **subscribe模式**: 提供者值变化时自动通知订阅者
- **ContextRoot**: 解决提供者后于消费者出现的情况

### 6.4 @lit-labs/signals (TC39 Signal 集成)

```typescript
import { SignalWatcher } from '@lit-labs/signals';
import { Signal } from 'signal-polyfill';

class MyElement extends SignalWatcher(LitElement) {
  private count = new Signal.State(0);
}
```

- **SignalWatcher mixin**: 自动观察TC39 Signal变化 → 调用requestUpdate
- **未来方向**: 信号感知的repeat()指令, 信号支持的@property(), 批量effect
- **愿景**: TC39信号成为JS原生类型 → DOM原生支持信号绑定

---

## 7. LessJS 可采用的模式与应避免的坑

### 7.1 应采用的核心模式

#### A. 继承 Alien Signals 的 Push-Pull-Push 架构 (已采用)

LessJS已基于alien-signals, 这是正确选择。它的三阶段模型兼具Push的及时性和Pull的精确性:
- **Push**: Signal变化立即标记依赖为脏 → 快速传播
- **Pull**: Computed惰性计算 → 避免不必要的计算
- **Push**: 值变化推送Effect → 精确更新

#### B. 借鉴 SolidJS 的 JSX 编译策略

```
静态模板提取 → template() + cloneNode()
动态绑定 → 编译时生成 direct DOM update 代码
```

LessJS的DSD编译已部分实现此模式, 需要完善:
1. 静态HTML提取为模板 (当前DSD已做)
2. JSX动态表达式编译为signal→DOM绑定 (当前依赖运行时)
3. 内置组件 (<For>, <Show>) 编译优化

#### C. 借鉴 SolidJS 的 Context 设计

```
Provider → Owner树context对象上设置引用
useContext → 沿Owner树向上查找, 返回原始引用
```

LessJS应该:
- Context返回的是**信号对象的引用**, 不是值的快照
- 基于Owner树(而非组件树)管理context生命周期
- Context值变化时通过信号自动传播, 不需要专门的context订阅

#### D. 借鉴 Svelte 5 的 Effect清理

```javascript
$effect(() => {
  const timer = setInterval(fn, 1000);
  return () => clearInterval(timer); // 简洁优雅
});
```

比SolidJS的`onCleanup`方式更直观。但我们需要确保:
- LessJS的effect()每次都返回dispose函数
- 组件unmount时自动dispose其作用域内的effect
- 支持手动scope管理

#### E. 借鉴 Preact Signals 的批量更新API

```javascript
batch(() => {
  // 多次写入, 一次刷新
});
```

通过alien-signals的`batch()`或`startBatch()/endBatch()`实现。

### 7.2 应避免的坑

#### A. ❌ Svelte 5 的解构陷阱

```javascript
const user = $state({ name: 'J' });
const { name } = user; // 失去响应性!
```

LessJS如果允许信号值的解构, 需要确保解构后的值仍然保持响应式(通过getter或proxy)。

#### B. ❌ Lit的浅层响应

```typescript
@state()
private _obj = { nested: 'value' };
_obj.nested = 'new'; // ❌ 不触发更新
```

LessJS应该确保深层响应, 至少对对象/数组提供原型级修改的自动追踪。

#### C. ❌ Preact Signals 的 .value 语法

```javascript
const count = signal(0);
<p>{count.value}</p> // 组件重新渲染 (不优化)
<p>{count}</p>       // 文本直接更新 (需编译器识别)
```

LessJS使用函数调用 `count()` 的模式优于 `.value`:
- 更明确地区分读信号和读普通值
- 与SolidJS一致, 开发者更容易理解
- alien-signals原生使用 `signal()` 调用模式

#### D. ❌ Svelte 5 的 deep proxy 开销

Svelte 5默认对$state对象做深度代理。LessJS应该:
- 使用 alien-signals 的 `signal()` + 不可变更新模式
- 或者提供显式的 `deepSignal()` API (需要深度响应时)
- 而非默认开启deep proxy

#### E. ❌ 编译时魔法 vs 运行时明确性

```javascript
// Svelte 5: 编译器重写, 行为不透明
let count = $state(0); // 看着像普通变量
count++;               // 实际触发signal更新

// SolidJS: 运行时明确
const [count, setCount] = createSignal(0);
setCount(count() + 1); // 明确知道是信号操作
```

LessJS选择SolidJS路线(运行时明确)是正确的。DSD编译只是优化, 不改变API语义。

#### F. ❌ Lit的基于DOM事件的Context

Lit的Context通过DOM事件冒泡实现, 虽然提供了跨框架互操作, 但:
- 性能开销 (事件监听/分发)
- 异步性质 (可能有竞态条件)
- LessJS不需要跨框架互操作

应坚持SolidJS的Owner树查找模式(纯同步, O(n)沿树向上)。

#### G. ❌ React useSyncExternalStore 模式

Preact Signals在React中被迫使用useSyncExternalStore, 导致:
- 信号绑定到组件级重渲染, 丢失原子更新
- 无法实现精确的DOM节点更新

LessJS的Real DOM架构必须避免这种降级, 确保信号变化精确到具体DOM绑定。

---

## 8. 总结: LessJS 信号架构建议

### 8.1 信号层

```typescript
// 基于 alien-signals
import { signal, computed, effect, batch, untrack } from 'alien-signals';

// 基础原语
const count = signal(0);           // 创建
count();                           // 读取 (注册依赖)
count.set(5);                      // 写入 (通知更新)
count.set(c => c + 1);             // 函数更新

// 派生
const doubled = computed(() => count() * 2);

// 副作用
const dispose = effect(() => {
  console.log(doubled());
  return () => {/* cleanup */};
});
dispose();                         // 手动停止
```

### 8.2 编译层 (JSX → Signal+DOM)

```tsx
// 源码
function Counter() {
  const [count, setCount] = createSignal(0);
  return <div>Count: {count()}</div>;
}

// DSD编译输出
// 1. 静态模板 (仅在SSR/客户端首次执行)
// const tmpl = template(`<div>Count: <!--slot--></div>`);

// 2. 动态绑定 (每个实例)
// const el = tmpl.cloneNode(true);
// effect(() => { el.childNodes[/*slotIndex*/].data = count(); });
// return el;
```

### 8.3 Context层

```typescript
// 创建
const ThemeContext = createContext<Theme>(defaultTheme);

// 提供
<ThemeContext.Provider value={currentTheme}>
  <Child />
</ThemeContext.Provider>

// 消费 (返回的就是Provider传入的值, signal getter的引用)
const theme = useContext(ThemeContext);
// theme() 实时获取最新主题
```

Context沿Owner树查找, 返回原始引用, 值变化通过信号传播。

### 8.4 生命周期管理

```typescript
// 组件级 effect
function Component() {
  effect(() => {
    const timer = setInterval(fn, 1000);
    return () => clearInterval(timer); // 组件unmount自动dispose
  });
}

// 手动scope
const scope = createScope();
scope.run(() => {
  effect(() => {/* ... */});
});
scope.dispose();

// 批量更新
batch(() => {
  signal1.set(value1);
  signal2.set(value2);
});
```

### 8.5 与 alien-signals 的映射关系

| LessJS 概念 | alien-signals API | 说明 |
|------------|------------------|------|
| createSignal | signal(initialValue) | 返回getter/setter |
| createMemo | computed(fn) | 惰性派生 |
| createEffect | effect(fn) | 自动追踪副作用 |
| batch() | startBatch()/endBatch() | 批量更新 |
| untrack() | untrack(fn) | 读取不订阅 |
| createContext | 自定义实现 | 基于Owner树查找 |

### 8.6 关键决策总结

| 决策 | 选择 | 理由 |
|------|------|------|
| 信号库 | alien-signals | 已集成, Push-Pull-Push, O(1)删除 |
| DOM模式 | Real DOM (无VDOM) | 已选择, 与信号原子更新匹配 |
| 编译策略 | DSD (JSX→Signal+DOM) | 编译时提取静态, 运行时绑定动态 |
| Context机制 | Owner树查找 + 信号引用 | 同步O(n), 保持响应式链接 |
| 信号调用 | 函数调用 count() | 明确性 > 透明度, 与alien-signals一致 |
| 深度响应 | 不可变更新(默认) | 避免deep proxy开销 |
| Effect管理 | dispose函数 + scope | 显式管理, 防内存泄漏 |
| 批量更新 | batch()/startBatch | 多次写入一次刷新 |

---

*本报告基于 2026-05-30 各框架最新文档和源码分析编写。*
