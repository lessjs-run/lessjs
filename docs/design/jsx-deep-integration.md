# JSX + static props + Signal 深度集成（v0.24.1 实现回顾）

> 版本: v2.0 | 日期: 2026-05-29 | 状态: IMPLEMENTED
>
> 前置分析于 v1.0 (2026-05-28)，v2.0 反映 v0.24.1 实际实现结果。

## 前置分析：html 模板系统局限

### template.ts 核心机制

```
html`<div class="static" .id=${val} @click=${fn}>${text}</div>`
       └── strings ──────────┘      └─ values ──────┘
```

- **TemplateResult** = `{ kind, strings, values, [Symbol] }` — 不可变数据结构
- **Binding sigils**: `@`=事件, `.`=属性, `?`=布尔属性, 无=文本内容
- **SSR 渲染**: `renderTemplateToString()` → 遍历预解析的 slots，生成 HTML 字符串 + runtime markers
- **CSR 补丁**: `_patchBindings()` → 查询 `data-less-b` markers，只更新变化的 Signal 值
- **值解析**: `renderContent()` 已自动对 SignalLike 调用 `.value`

### prop.ts 核心机制

```
@prop() count = 0
  ↓ initializeProps()
  ↓ createPropSignal(0) → { value, subscribe }
  ↓ installPropAccessor → defineProperty(instance, 'count', { get/set })
  ↓ 注册 observedAttributes → attributeChangedCallback → handlePropAttributeChange
```

- **内部 Signal**: 每个 @prop() 创建私有 Signal，通过 accessor 暴露
- **属性同步**: `attributeChangedCallback → sig.value = converted`
- **reflect**: `sig.subscribe → reflectToAttribute(instance, key, sig.value)`
- **当前行为**: `this.count` 返回 `sig.value`（原始值），NOT the Signal

### 关键矛盾点

@prop() 的 accessor 返回原始值，但模板运行时（`renderContent`, `_patchBindings`）依赖 **SignalLike对象** 来实现自动解包和精细补丁。当前设计下，@prop() 属性在模板中表现为静态值，无法触发 `isSignalLike` 检测，导致 `_patchBindings` 无法进行精确 DOM 更新。

---

## 1. JSX → TemplateResult 完整映射表

### 1.1 编译目标

JSX 编译到 `html` tagged template`` 调用。不需要新的运行时。

```tsx
// Input
class MyButton extends DsdElement {
  @prop()
  count = 0;
  render() {
    return (
      <div class='counter'>
        <button onClick={() => this.count--}>-</button>
        <span>{this.count}</span>
        <button onClick={() => this.count++}>+</button>
      </div>
    );
  }
}
```

```ts
// Output (compiled)
class MyButton extends DsdElement {
  @prop()
  count = 0;
  render() {
    return html`
      <div class="counter">
        <button @click="${() => this.count.set((v) => v - 1)}">-</button>
        <span>${this.count}</span>
        <button @click="${() => this.count.set((v) => v + 1)}">+</button>
      </div>
    `;
  }
}
```

### 1.2 元素映射

| JSX 语法             | 编译产物                           | 说明                             |
| -------------------- | ---------------------------------- | -------------------------------- |
| `<div />`            | `html\`<div></div>\``              | 空元素                           |
| `<div>text</div>`    | `html\`<div>text</div>\``          | 静态文本内联到 strings           |
| `<div>{expr}</div>`  | `html\`<div>${expr}</div>\``       | 动态文本放到 values              |
| `<div><span/></div>` | `html\`<div><span></span></div>\`` | 嵌套静态元素内联                 |
| `<div>{child}</div>` | `html\`<div>${child}</div>\``      | 子组件结果放入 values            |
| `<custom-el />`      | `html\`<custom-el></custom-el>\``  | 自定义元素 tag 名保持 kebab-case |
| `<></>` (Fragment)   | `html\` ${child1}${child2}\``      | 多个 children 串联               |

### 1.3 属性映射

| JSX 语法                      | 编译产物                               | 语义                                            |
| ----------------------------- | -------------------------------------- | ----------------------------------------------- |
| `class="static"`              | `html\`class="static"\``               | 静态属性（内联到 strings）                      |
| `id="foo"`                    | `html\`id="foo"\``                     | 静态属性                                        |
| `id={expr}`                   | `html\` .id=${expr}\``                 | **动态属性**.sigil → property binding           |
| `hidden={expr}`               | `html\` ?hidden=${expr}\``             | **布尔属性**.? sigil                            |
| `class={classMap(obj)}`       | `html\` class=${classMap(obj)}\``      | classMap 在 class 位置 → renderBinding 特殊处理 |
| `style="color:red"`           | `html\`style="color:red"\``            | 静态样式内联                                    |
| `style={obj}`                 | `html\` style=${styleObjToStr(obj)}\`` | 对象→字符串转换（编译时）                       |
| `${`...${}`}` (string interp) | `html\` ${expr}\``                     | JSX 不支持模板字符串属性，此非标准语法忽略      |

### 1.4 事件映射

JSX 的 `onEventName` → html template 的 `@eventname`:

| JSX                  | 模板                 | 说明                                  |
| -------------------- | -------------------- | ------------------------------------- |
| `onClick={fn}`       | `@click=${fn}`       | 映射: remove 'on', lowercase          |
| `onInput={fn}`       | `@input=${fn}`       |                                       |
| `onChange={fn}`      | `@change=${fn}`      |                                       |
| `onSubmit={fn}`      | `@submit=${fn}`      |                                       |
| `onKeyDown={fn}`     | `@keydown=${fn}`     | CamelCase → lowercase                 |
| `onFocus={fn}`       | `@focus=${fn}`       |                                       |
| `onBlur={fn}`        | `@blur=${fn}`        |                                       |
| `onMouseEnter={fn}`  | `@mouseenter=${fn}`  | 注意: mouseenter, mouseleave 完整映射 |
| `onScroll={fn}`      | `@scroll=${fn}`      |                                       |
| `onPointerDown={fn}` | `@pointerdown=${fn}` |                                       |
| `onCustomEvent={fn}` | `@customevent=${fn}` | 自定义事件也支持                      |

**编译规则**: `on${CamelCase}` → `@${lowercase(CamelCase)}`

### 1.5 指令映射

| 指令                | JSX 写法                | 模板产物                                  | 说明                                            |
| ------------------- | ----------------------- | ----------------------------------------- | ----------------------------------------------- |
| `classMap(obj)`     | `class={classMap(obj)}` | `class=${classMap(obj)}`                  | 保持不变，运行时特判                            |
| `when(cond, t, f)`  | `{cond ? <A/> : <B/>}`  | 三元表达式求值                            | JSX 直接用 JS 表达式，编译时不转换              |
| `choose(k, cases)`  | `{switchExpr}`          | switch/对象查找                           | JSX 中用 JS 原生 switch                         |
| `repeat(items, fn)` | `{items.map(...)}`      | Array of TemplateResult                   | `.map()` 返回数组，renderContent 已支持数组展平 |
| `unsafeHTML(str)`   | `{unsafeHTML(str)}`     | `${unsafeHTML(str)}`                      | 保持函数调用                                    |
| `ref(cb)`           | `ref={(el) => ...}`     | `${ref((el) => ...)}` (新增 # sigil 支持) | 见下节                                          |

### 1.6 ref 绑定（新增机能）

当前 `ref()` 返回 RefDirective 但无渲染/补丁逻辑。JSX 中需要完整支持：

```tsx
<div ref={(el) => this.domEl = el} />;
```

→

```ts
html`
  <div #="${ref((el) => this.domEl = el)}" />
`;
```

新增 `#` **sigil**（ref 指令）:

- SSR: `renderTemplateToString` 对 `#` sigil 输出 `data-less-ref-{index}` marker
- CSR: `applyRuntimeTemplateBindings` 查询 `[data-less-ref-N]`，移除 marker，调用 `callback(element)`

**实现**:

```ts
// template.ts 扩展

// detectBinding 中已有 sigil 检测，需新增 '#' 字符
// detectBinding regex: /(^|[\s<])([@.?]?)([A-Za-z_][\w:.-]*)\s*=\s*(["']?)$/
// → /(^|[\s<])([@.?#]?)([A-Za-z_][\w:.-]*)\s*=\s*(["']?)$/

// renderBinding 新增:
if (binding.sigil === '#') {
  return runtimeMarkers ? `data-less-ref-${index}` : '';
}

// RuntimeTemplateBindings 新增 refs:
export interface RefBinding {
  index: number;
  callback: (element: Element) => void;
}

// applyRuntimeTemplateBindings 新增:
for (const binding of bindings.refs) {
  const marker = `data-less-ref-${binding.index}`;
  const elements = root.querySelectorAll(`[${marker}]`);
  for (const element of elements) {
    element.removeAttribute(marker);
    binding.callback(element);
  }
}
```

### 1.7 Spread Attributes（不支持）

```tsx
<div {...props} />;
```

**原因**: html tagged template 的属性位置由静态 strings 定义，编译时无法从 strings 中动态注入属性。
`detectBinding` 需要静态字符串中的属性名来解析 sigil。

**替代方案**:

1. 编译时展开已知键 → `.prop` 绑定
2. 运行时 helper `spreadToElement(element, props)` 在 `onConnected` hook 中使用

### 1.8 不支持/有差异的场景

| JSX 语法                                   | 状态                   | 说明                                       |
| ------------------------------------------ | ---------------------- | ------------------------------------------ |
| `<{TagName} />` 动态标签名                 | 不支持                 | 模板标签名来自 static strings              |
| `<Comp>{data => ...}</Comp>` 函数 children | 不支持                 | values 不接受函数                          |
| `{...props}` spread                        | 不支持（替代方案可行） | 见上                                       |
| `<Suspense>` / `<ErrorBoundary>`           | 不支持                 | 需要额外的运行时基础设施                   |
| Context / Provider                         | 不支持                 | WC 用 attributes/events 替代               |
| 条件渲染 `{cond && <X/>}`                  | 支持                   | JS 表达式，编译时不转换                    |
| 列表渲染 `{arr.map(...)}`                  | 支持                   | JS `.map()`，返回数组由 renderContent 展平 |
| `key` 属性                                 | 编译时剥离             | key 用于 diff 提示，不进入输出             |

---

## 2. Signal 自动解包方案

### 2.1 核心问题

@prop() 的 accessor 当前返回**原始值**，而模板运行时依赖 **SignalLike 对象** 实现解包和补丁。

```ts
// 当前行为
count = 0;
// this.count → 0 (number, NOT Signal)
// 模板中 {this.count} → 数字，isSignalLike() → false
// _patchBindings 找不到 Signal → 不做精细补丁
```

### 2.2 推荐方案：Signal-as-Value + valueOf 自动解包

**修改 `createPropSignal`**，让 Signal 对象实现 valueOf/Symbol.toPrimitive/toString：

```ts
function createPropSignal(initialValue: unknown): PropSignal {
  let _value = initialValue;
  const listeners = new Set<(v: unknown) => void>();

  const sig = {
    get value() {
      return _value;
    },
    set value(v: unknown) {
      if (Object.is(_value, v)) return;
      _value = v;
      for (const fn of listeners) fn(v);
    },
    subscribe(fn: (v: unknown) => void): () => void {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    // === Auto-unwrap for expressions and JSX ===
    valueOf() {
      return _value;
    },
    [Symbol.toPrimitive](hint: string) {
      if (hint === 'string') return String(_value);
      return hint === 'number' ? Number(_value) : _value;
    },
    toString() {
      return String(_value);
    },

    // === Convenience: batch update ===
    set(updater: (v: unknown) => unknown): void {
      this.value = updater(_value);
    },
  };

  return sig;
}
```

**修改 `installPropAccessor`**，让 accessor 返回 Signal 对象（不是原始值）：

```ts
function installPropAccessor(instance, key, sigMap) {
  const sig = sigMap.signals.get(key)!;
  Object.defineProperty(instance, key, {
    get(): unknown {
      return sig;
    }, // ← 返回 Signal 对象
    set(v: unknown) {
      sig.value = v;
    },
  });
}
```

### 2.3 效果对比

```ts
class MyCounter extends DsdElement {
  @prop() count = 0;
  
  test() {
    // === 向后兼容（valueOf 自动解包）===
    if (this.count > 5) { ... }     // valueOf() → _value > 5 ✓
    const total = this.count + 10;   // valueOf() → _value + 10 ✓
    `Count: ${this.count}`;          // toString() → "Count: 0" ✓
    
    // === 显式 Signal API ===
    this.count;                       // Signal 对象
    this.count.value;                 // 原始值（读）
    this.count.value = 10;           // 原始值（写），触发订阅者
    this.count.set(v => v + 1);      // 便捷函数式更新
    
    // === 模板中 ===
    // {this.count} → Signal 对象
    // → renderContent() → resolveSignalValue() → 读取 .value → 自动解包
    // → _patchBindings() → isSignalLike() → 找到 Signal → 精确补丁
  }
}
```

### 2.4 备选方案对比

| 方案                          | 描述                                               | 优点                                                 | 缺点                                                   |
| ----------------------------- | -------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| **A: valueOf 自动解包** ★推荐 | Signal 实现 valueOf/toPrimitive                    | 向后兼容、零编译负担、JSX 中 `{this.count}` 直接可用 | valueOf 是 JavaScript 的隐式类型转换，调试时可能困惑   |
| B: 编译时 `.value` 插入       | 编译时将 `{this.count}` → `{this.count.value}`     | 显式、可预测                                         | 需要编译器知道哪些是 Signal 属性、析构失效、调用链复杂 |
| C: Proxy 包装                 | `this.count` 返回 Proxy，`.value` 返回内部值       | 透明                                                 | Proxy 开销、SSR 难题、信号追踪误触发                   |
| D: 保持现状                   | `this.count` 返回原始值，`this._count` 返回 Signal | 零改动                                               | API 冗余、模板中需区分写法                             |

### 2.5 valueOf 的注意事项

- `console.log(this.count)` 在 Chrome DevTools 中显示为原始值（DevTools 内部使用 valueOf）
- `JSON.stringify({count: this.count})` 中 Signal 不会自动展开（JSON.stringify 不调用 valueOf），需显式 `.value`
- `typeof this.count === 'object'` → true，类型守卫需用 `isSignalLike()`
- TypeScript 类型: `@prop() count: number` → 类型签名建议为 `Signal<number>`（编译后）

---

## 3. @prop() + JSX 双向绑定设计

### 3.1 单向绑定（Property → DOM）

JSX 自动使用 `.prop` sigil：

```tsx
<input .value={this.name} />
```

→

```ts
html`
  <input .value="${this.name}" />
`;
```

运行时 `applyRuntimeTemplateBindings`:

```ts
element.value = this.name.value; // or: element.value = valueOf(this.name)
```

### 3.2 双向绑定（DOM → Property）

```tsx
<input
  .value={this.name}
  @input=${(e) => this.name.value = e.target.value}
/>
```

编译为：

```ts
html`
  <input .value="${this.name}" @input="${(e) => this.name.value = e.target.value}" />
`;
```

### 3.3 双向绑定辅助宏

提供编译时语法糖：

```tsx
{/* 编译时简写 */}
<input bind:value={this.name} />;
```

编译为：

```ts
html`
  <input .value="${this.name}" @input="${(e) => {
    this.name.value = e.target.value;
  }}" />
`;
```

映射表：

| bind:attr       | 事件                            | 属性绑定    |
| --------------- | ------------------------------- | ----------- |
| `bind:value`    | `@input` + `e.target.value`     | `.value`    |
| `bind:checked`  | `@change` + `e.target.checked`  | `.checked`  |
| `bind:selected` | `@change` + `e.target.selected` | `.selected` |

### 3.4 Reflect 联动

@prop() 已有的 reflect 机制与双向绑定无冲突：

```
用户输入 → sig.value = newValue
  → sig.subscribe 触发
    → reflectToAttribute(instance, key, sig.value, options)  // 如果 reflect=true
    → instance.requestReactiveUpdate()  // 调度 DOM 补丁
```

### 3.5 完整示例

```tsx
class NameForm extends DsdElement {
  @prop() firstName = '';
  @prop() lastName = '';
  @prop({ type: Boolean, reflect: true }) submitted = false;

  render() {
    return (
      <form @submit=${this.#handleSubmit}>
        <label>
          First: <input bind:value={this.firstName} />
        </label>
        <label>
          Last: <input bind:value={this.lastName} />
        </label>
        <button type="submit" .disabled={this.submitted}>
          Submit
        </button>
      </form>
    );
  }

  #handleSubmit = (e: Event) => {
    e.preventDefault();
    this.submitted.set(v => true);  // reflect 自动更新 HTML attribute
  };
}
```

---

## 4. 事件绑定系统设计

### 4.1 绑定策略：直接绑定（非委托）

继承当前系统：每个 `@event` 绑定直接 addEventListener 到目标元素。

```
renderTemplateToString → data-less-event-N marker
applyRuntimeTemplateBindings → querySelector → element.addEventListener(event, handler, {signal})
```

**为什么不用事件委托**:

1. LessJS 使用 Shadow DOM，事件已天然隔离
2. DSD 路径下元素已存在于 DOM，querySelector 零成本
3. 委托需要额外的事件冒泡和 target 匹配逻辑
4. Web Component 最佳实践是直接绑定

### 4.2 handler 的 this 绑定

当前系统: `binding.handler.call(host, event)` — handler 以 host (DsdElement 实例) 为 this。

```ts
// applyRuntimeTemplateBindings (现有):
element.addEventListener(
  binding.eventName,
  ((event: Event) => binding.handler.call(host, event)) as EventListener,
  signal ? { signal } : undefined,
);
```

JSX 中使用箭头函数可避免 this 问题：

```tsx
<button onClick={() => this.handleClick()}>Click</button>
<button onClick={this.#handleClick}>Click</button>  // #private 方法天然绑定 this
```

### 4.3 自定义事件

```tsx
<div
  onMyEvent=${(e) => console.log(e.detail)}
/>
```

→

```ts
html`
  <div @myevent="${(e) => console.log(e.detail)}" />
`;
```

### 4.4 事件选项

对于需要 `{capture, passive, once}` 的情况，JSX 语法：

```tsx
{/* capture 阶段 */}
<div onClickCapture={fn} /> → html`<div @click=${fn} />`
{/* once */}
<div onClickOnce={fn} /> → html`<div @click=${fn} />`
```

编译时识别后缀并 emit 相应处理。但当前 html template 不支持事件选项传递。建议：

**短期**：用户在 handler 内部控制

```tsx
<div
  onClick={(e) => {
    e.stopPropagation();
    handler();
  }}
/>;
```

**长期**：扩展 TemplateResult 支持事件选项

```ts
export interface RuntimeEventBinding {
  index: number;
  eventName: string;
  handler: EventListener;
  options?: AddEventListenerOptions; // 新增
}
```

### 4.5 完整事件映射表

| JSX 属性           | html 模板        | Event Name      |
| ------------------ | ---------------- | --------------- |
| `onClick`          | `@click`         | `click`         |
| `onDblClick`       | `@dblclick`      | `dblclick`      |
| `onMouseDown`      | `@mousedown`     | `mousedown`     |
| `onMouseUp`        | `@mouseup`       | `mouseup`       |
| `onMouseMove`      | `@mousemove`     | `mousemove`     |
| `onMouseEnter`     | `@mouseenter`    | `mouseenter`    |
| `onMouseLeave`     | `@mouseleave`    | `mouseleave`    |
| `onKeyDown`        | `@keydown`       | `keydown`       |
| `onKeyUp`          | `@keyup`         | `keyup`         |
| `onKeyPress`       | `@keypress`      | `keypress`      |
| `onFocus`          | `@focus`         | `focus`         |
| `onBlur`           | `@blur`          | `blur`          |
| `onInput`          | `@input`         | `input`         |
| `onChange`         | `@change`        | `change`        |
| `onSubmit`         | `@submit`        | `submit`        |
| `onScroll`         | `@scroll`        | `scroll`        |
| `onWheel`          | `@wheel`         | `wheel`         |
| `onPointerDown`    | `@pointerdown`   | `pointerdown`   |
| `onPointerUp`      | `@pointerup`     | `pointerup`     |
| `onPointerMove`    | `@pointermove`   | `pointermove`   |
| `onTouchStart`     | `@touchstart`    | `touchstart`    |
| `onTouchEnd`       | `@touchend`      | `touchend`      |
| `onTouchMove`      | `@touchmove`     | `touchmove`     |
| `onAnimationEnd`   | `@animationend`  | `animationend`  |
| `onTransitionEnd`  | `@transitionend` | `transitionend` |
| `{on + CamelCase}` | `@{lowercase}`   | 自动映射        |

---

## 5. 指令 JSX 映射

### 5.1 classMap

**保持现有 API**，JSX 中不变：

```tsx
<div
  class={classMap({
    'btn': true,
    'btn-primary': this.variant.value === 'primary',
    'btn-disabled': this.disabled.value,
  })}
/>;
```

编译为:

```ts
html`
  <div class="${classMap({
    'btn': true,
    'btn-primary': this.variant.value === 'primary',
    'btn-disabled': this.disabled.value,
  })}" />
`;
```

`renderBinding` (`template.ts:493`) 已特殊处理 class 属性 + ClassMapValue：

```ts
if (binding.name === 'class' && isClassMapValue(resolved)) {
  const classes = renderClassMapValue(resolved);
  return `class="${escapeAttr(classes)}"`;
}
```

### 5.2 when / choose

JSX 中用原生 JavaScript 表达式，比 `when()` 更自然：

```tsx
// 替代 when()
{this.loggedIn.value
  ? <UserMenu user={this.user} />
  : <LoginButton />
}

// 替代 choose()
{{
  home: <HomePage />,
  about: <AboutPage />,
  contact: <ContactPage />,
}[this.page.value] ?? <NotFoundPage />}
```

**不需要编译器层面映射**。`when()` 和 `choose()` 保留给非 JSX 用户。

### 5.3 repeat

JSX 中直接用 `.map()`：

```tsx
{
  this.items.value.map((item) => (
    <TodoItem
      key={item.id}
      text={item.text}
      done={item.done}
    />
  ));
}
```

运行时行为：

1. `.map()` 返回 `TemplateResult[]`（每个 `<TodoItem>` 编译为 `html\`...\``）
2. 父模板中作为一个 values 项
3. `renderContent` 检测到 Array → 递归渲染每个元素并 join

`key` 属性：编译时剥离，不进入输出。`repeat()` 保留给非 JSX 用户。

### 5.4 unsafeHTML

```tsx
<div>{unsafeHTML(this.content)}</div>;
```

保持函数调用。`renderContent` 对 UnsafeHtmlValue 执行 `return (value as UnsafeHtmlValue).html`。

### 5.5 ref

见 1.6 节，使用新增的 `#` sigil。

---

## 6. SSG / CSR 双路径统一

### 6.1 统一渲染流程

JSX 编译为 `html\`\`` 调用后，**与现有系统完全一致**：

```
       ┌─── JSX Source ───┐
       │  class Cmp {     │
       │    render() {    │
       │      return (    │
       │        <div/>    │
       │      );          │
       │    }             │
       │  }               │
       └────────┬─────────┘
                │ JSX Compiler (Babel/TS/esbuild plugin)
                ▼
       ┌─── html`` call ──┐
       │  html`<div></div>`│
       └────────┬─────────┘
                │
     ┌──────────┴──────────┐
     │                     │
 SSG Path              CSR Path
     │                     │
     ▼                     ▼
renderTemplateToString  _renderIntoShadowRoot
     │                     │
     ▼                     ▼
DSD template HTML       shadowRoot.innerHTML
     │                     │
     ▼                     ▼
<template shadowroot>    applyRuntimeTemplateBindings
     │                     │
     ▼                     ▼
浏览器 DSD attach       addEventListener + Signal subscribe
     │                     │
     ▼                     ▼
_hydrateOrRender         _patchBindings (reactive updates)
     │
     ▼
applyRuntimeTemplateBindings (DSD 路径下也需绑定事件)
```

### 6.2 路径差异处理

| 策略        | SSG (DSD)                                        | CSR                                                   |
| ----------- | ------------------------------------------------ | ----------------------------------------------------- |
| 第一次渲染  | `renderTemplateToString` + DSD template          | `renderTemplateToString` + `innerHTML`                |
| 事件绑定    | `_hydrateOrRender` → `_bindTemplateRuntime`      | `_renderIntoShadowRoot` → `_bindTemplateRuntime`      |
| Signal 订阅 | `_hydrateOrRender` → `_subscribeTemplateSignals` | `_renderIntoShadowRoot` → `_subscribeTemplateSignals` |
| 后续更新    | `_patchBindings` (data-less-b markers)           | `_patchBindings` (data-less-b markers)                |

**JSX 不引入新的路径分支**。编译后的产物是标准 `TemplateResult`。

---

## 7. 不可行场景总结

| 场景                               | 可行性   | 原因                                                               | 替代方案                                                      |
| ---------------------------------- | -------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Spread Attributes** `{...props}` | 不可行   | html 模板的 strings 是静态的，无法在编译时注入动态属性名到字符串中 | 1) 编译时展开已知键 2) 运行时 `setProperties(element, props)` |
| **动态标签名** `<{Tag} />`         | 不可行   | 同上，标签名在 strings 中                                          | 条件渲染：`{tag === 'a' ? <a/> : <div/>}`                     |
| **函数 Children**                  | 不可行   | TemplateResult 的 values 不包含函数类型                            | 作为 prop 传递：`<Comp renderHeader={() => ...} />`           |
| **Suspense / ErrorBoundary**       | 不可行   | 模板层无异步/错误处理概念                                          | WC 级别实现：`try/catch` + `setTimeout`                       |
| **React Context**                  | 不适用   | WC 用 attributes/events + Shadow DOM 隔离                          | `this.closest('parent').someValue` 或全局 store               |
| **Portal**                         | 不可行   | Shadow DOM 中无 ReactDOM.createPortal 等价物                       | 手动 `document.body.appendChild()` + 清理                     |
| **Server Components (RSC)**        | 超出范围 | LessJS 是 SSG 框架，非 React 风格                                  | LessJS 已有的 SSG 管线                                        |

---

## 8. 实现路线图

### Phase 1: 核心编译 (编译器)

1. JSX → `html\`\`` 基础映射（元素、属性、文本）
2. `onEvent` → `@event` 映射
3. `.prop` 和 `?boolean` sigil 推断
4. Fragment → 多子元素支持

### Phase 2: Signal 集成 (运行时)

1. `createPropSignal` 添加 `valueOf`/`toPrimitive`/`toString`
2. `installPropAccessor` 返回 Signal 对象（非原始值）
3. 验证向后兼容（现有非 JSX 代码不受影响）
4. `_patchBindings` 对 @prop() Signal 的补丁验证

### Phase 3: ref 和 bind 语法糖

1. 新增 `#` sigil 处理 ref 绑定
2. `bind:attr` 双向绑定编译宏
3. `applyRuntimeTemplateBindings` 扩展 ref 处理

### Phase 4: 开发体验

1. TypeScript 类型：`@prop() count: number` → `Signal<number>` 类型推导
2. Babel/esbuild/TypeScript 编译器插件
3. IDE 支持（VSCode extension or LSP）

---

## 9. 风险与缓解

| 风险                             | 缓解措施                                             |
| -------------------------------- | ---------------------------------------------------- |
| valueOf 隐式转换可能隐藏类型错误 | 提供 `strict` 模式，禁止在非模板上下文使用隐式转换   |
| 编译器 bug 导致错误映射          | 编译产物始终生成对应的 `html\`\`` 调用，支持手动回退 |
| @prop() 行为变更影响现有代码     | 分阶段发布：先发 minor 版本，提供 migration guide    |
| JSX 编译引入构建复杂度           | JSX 编译是 opt-in，非 JSX 用户不受影响               |
