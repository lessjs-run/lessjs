# SOP-010: Signal-DOM 深度集成 — @prop() 响应式属性系统

> Version: v0.23.x
> Priority: P0 (核心)
> Status: PLANNED
> Depends on: ADR-0052, SOP-009（classMap 是模板集成前提）
> Blocks: SOP-011（错误边界需要响应式属性）

## Objective

实现 `@prop()` 装饰器 + Signal→DOM 自动绑定，将组件属性声明从 10+ 行/4 处代码降到 1 行，Signal 值变化自动触发 DOM 更新无需手动 `this.update()`。这是 v0.23.x 的核心收益，占 DX 提升的 60%。

## Current Problem

深度评估报告认定的 **最严重设计缺陷**：

1. **Signal 集成极浅**：Signal 值变化**不自动触发 DOM 更新**——组件必须手动 `this.update()`
2. **仅 1 个组件使用 Signal**（`less-theme-toggle`），其余 9 个全部靠 `attributeChangedCallback` + `_syncDOM()`
3. **无响应式属性系统**：每个属性需 4 处代码协同：`observedAttributes` + `attributeChangedCallback` + 内部状态 + `_syncDOM()`
4. **与 Lit/FAST/Svelte 的 DX 差距**：这些框架都用装饰器 1 行声明属性

当前组件代码（10+ 行/属性）：

```ts
// LessJS 当前 — 命令式，4 处代码协同
static get observedAttributes() { return ['variant']; }
attributeChangedCallback(name, _old, value) {
  if (name === 'variant') { this._variant = value as Variant; this._syncDOM(); }
}
private _variant: Variant = 'default';
private _syncDOM() {
  const btn = this.shadowRoot!.querySelector('.btn');
  if (btn) { btn.setAttribute('data-variant', this._variant); }
}
```

目标代码（1 行/属性）：

```ts
// LessJS v0.23.x — 声明式，1 行
variant: Variant = 'default';
disabled = false;
```

## Target Files

| File                                                 | Action | 说明                                       |
| ---------------------------------------------------- | ------ | ------------------------------------------ |
| `packages/core/src/prop-decorator.ts`                | CREATE | @prop() 装饰器实现                         |
| `packages/core/src/reactive-host.ts`                 | CREATE | ReactiveHost mixin + requestReactiveUpdate |
| `packages/core/src/dsd-element.ts`                   | MODIFY | 集成 ReactiveHost + @prop() 基础设施       |
| `packages/core/src/template.ts`                      | MODIFY | Signal 自动追踪 + DOM 补丁                 |
| `packages/core/src/mod.ts`                           | MODIFY | 导出 @prop / ReactiveHost                  |
| `packages/ui/src/less-button.ts`                     | MODIFY | 迁移为 @prop() 示范                        |
| `packages/ui/src/less-theme-toggle.ts`               | MODIFY | 迁移已有 Signal 为 @prop()                 |
| `packages/core/__tests__/prop-decorator.test.ts`     | CREATE | @prop() 单元测试                           |
| `packages/core/__tests__/reactive-host.test.ts`      | CREATE | ReactiveHost 单元测试                      |
| `packages/ui/__tests__/less-button-reactive.test.ts` | CREATE | 组件迁移集成测试                           |

## Procedure

### Step 1: PropOptions 接口 + @prop() 装饰器

**目标**：定义 `@prop()` 装饰器 API，注册属性元数据到类上。

**涉及文件**：`packages/core/src/prop-decorator.ts`（新建）

**执行动作**：

- [ ] 定义 `PropOptions` 接口（ADR-0052 规定）：

```ts
export type PropType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor;

export interface PropOptions<T = unknown> {
  /** Attribute name override (default: kebab-case of property name) */
  attribute?: string;
  /** Type coercion: String | Number | Boolean | Array | Object */
  type?: PropType;
  /** Reflect property changes back to the HTML attribute */
  reflect?: boolean;
  /** Custom converter: attribute value → property value */
  converter?: {
    fromAttribute?(value: string | null): T;
    toAttribute?(value: T): string | null;
  };
  /** Skip this property in observedAttributes (virtual property) */
  noAccessor?: boolean;
}

export interface InternalPropMeta {
  attributeName: string;
  type?: PropType;
  reflect: boolean;
  converter?: PropOptions['converter'];
  noAccessor: boolean;
  defaultValue: unknown;
}
```

- [ ] 实现 `@prop()` 装饰器（TC39 stage 3 decorator 或 TypeScript experimental）：

```ts
export function prop(options: PropOptions = {}): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const ctor = target.constructor as typeof DsdElement;
    if (!ctor._propMetadata) {
      ctor._propMetadata = new Map();
    }

    const attributeName = options.attribute ??
      String(propertyKey).replace(/([A-Z])/g, '-$1').toLowerCase();

    ctor._propMetadata.set(String(propertyKey), {
      attributeName,
      type: options.type,
      reflect: options.reflect ?? false,
      converter: options.converter,
      noAccessor: options.noAccessor ?? false,
      defaultValue: undefined, // 在实例化时从类字段初始值填充
    });
  };
}
```

- [ ] 在 `DsdElement` 上添加静态 `_propMetadata` 声明：

```ts
class DsdElement extends HTMLElement {
  static _propMetadata: Map<string, InternalPropMeta> = new Map();
}
```

**验收命令**：

```sh
deno test packages/core/__tests__/prop-decorator.test.ts --allow-read
```

**通过标准**：

- [ ] `@prop()` 装饰器在类上注册 `_propMetadata` 条目
- [ ] `attribute` 选项正确映射 camelCase → kebab-case
- [ ] `type: Boolean` 被记录在元数据中
- [ ] `reflect: true` 被记录在元数据中
- [ ] 多个 `@prop()` 声明累积到同一个 `_propMetadata` Map

**失败处理**：如果 TC39 decorator 语法与 Deno 不兼容，回退到 TypeScript `experimentalDecorators`（tsconfig.json 中已开启）。

**是否污染工作区**：否（新增文件）

---

### Step 2: ReactiveHost mixin + 自动属性初始化

**目标**：在 DsdElement 构造函数中，为每个 `@prop()` 声明创建 Signal + getter/setter。

**涉及文件**：`packages/core/src/reactive-host.ts`（新建）, `packages/core/src/dsd-element.ts`

**执行动作**：

- [ ] 创建 `ReactiveHost` 接口（扩展现有 ADR-0039 协议）：

```ts
export interface ReactiveHost {
  /** 订阅 Signal 变更 */
  subscribeTo(signal: ReadonlySignal<unknown>): void;
  /** 请求响应式更新（微任务批处理） */
  requestReactiveUpdate(): void;
}
```

- [ ] 在 DsdElement 构造函数中初始化 @prop() 属性：

```ts
class DsdElement extends HTMLElement {
  private _props = new Map<string, Signal<unknown>>();
  private _updateScheduled = false;

  constructor() {
    super();
    this._initializeProps();
  }

  private _initializeProps(): void {
    const ctor = this.constructor as typeof DsdElement;
    for (const [name, meta] of ctor._propMetadata) {
      const signal = createSignal(meta.defaultValue);
      this._props.set(name, signal);

      Object.defineProperty(this, name, {
        get: () => signal.value,
        set: (v: unknown) => {
          signal.value = v;
          this.requestReactiveUpdate();
        },
        configurable: true,
        enumerable: true,
      });
    }
  }
}
```

- [ ] 实现 `requestReactiveUpdate()`（微任务批处理）：

```ts
protected requestReactiveUpdate(): void {
  if (!this._updateScheduled) {
    this._updateScheduled = true;
    queueMicrotask(() => this._performReactiveUpdate());
  }
}

private _performReactiveUpdate(): void {
  this._updateScheduled = false;
  const result = this.render();
  if (isTemplateResult(result)) {
    this._renderIntoShadowRoot();
  }
}
```

**验收命令**：

```sh
deno test packages/core/__tests__/reactive-host.test.ts --allow-read
```

**通过标准**：

- [ ] `@prop() count = 0` 创建底层 Signal
- [ ] `this.count` 读取 signal.value
- [ ] `this.count = 5` 设置 signal.value + 触发 requestReactiveUpdate
- [ ] 同步块中多次赋值只触发 1 次重渲染（微任务批处理）
- [ ] 不使用 @prop() 的组件零开销

**失败处理**：如果 `Object.defineProperty` 与类字段初始化冲突（装饰器先执行但默认值在 super() 之后），在 `_initializeProps()` 中从实例读取初始值再覆盖 getter。

**是否污染工作区**：是（修改 dsd-element.ts）

---

### Step 3: Attribute ↔ Property 双向同步

**目标**：`attributeChangedCallback` 自动将 attribute 变更分发到 @prop() Signal。

**涉及文件**：`packages/core/src/dsd-element.ts`

**执行动作**：

- [ ] 重写 `observedAttributes` getter（动态生成）：

```ts
static get observedAttributes(): string[] {
  const own = [...this._propMetadata.values()]
    .filter(m => !m.noAccessor)
    .map(m => m.attributeName);
  const parent = Object.getPrototypeOf(this)?.observedAttributes ?? [];
  return [...new Set([...parent, ...own])];
}
```

- [ ] 重写 `attributeChangedCallback` 分发逻辑：

```ts
attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
  const ctor = this.constructor as typeof DsdElement;
  for (const [propName, meta] of ctor._propMetadata) {
    if (meta.attributeName === name) {
      const coerced = this._coerceAttributeValue(meta, value);
      const signal = this._props.get(propName);
      if (signal) {
        signal.value = coerced;
        this.requestReactiveUpdate();
      }
      return;
    }
  }
  // 回退到用户自定义的 attributeChangedCallback
  this._userAttributeChangedCallback?.(name, _old, value);
}
```

- [ ] 实现 `_coerceAttributeValue` 类型强制转换：

```ts
private _coerceAttributeValue(meta: InternalPropMeta, value: string | null): unknown {
  if (meta.converter?.fromAttribute) return meta.converter.fromAttribute(value);

  switch (meta.type) {
    case Boolean: return value !== null; // attribute 存在即 true
    case Number: return value !== null ? Number(value) : 0;
    case Array: return value ? JSON.parse(value) : [];
    case Object: return value ? JSON.parse(value) : {};
    default: return value ?? '';
  }
}
```

- [ ] 实现 reflect（property → attribute）：

```ts
private _reflectPropertyToAttribute(propName: string, meta: InternalPropMeta): void {
  if (!meta.reflect) return;
  const signal = this._props.get(propName);
  if (!signal) return;

  const value = signal.value;
  const attributeName = meta.attributeName;

  if (meta.type === Boolean) {
    value ? this.setAttribute(attributeName, '') : this.removeAttribute(attributeName);
  } else {
    const serialized = meta.converter?.toAttribute
      ? meta.converter.toAttribute(value)
      : String(value);
    if (serialized !== null) {
      this.setAttribute(attributeName, serialized);
    } else {
      this.removeAttribute(attributeName);
    }
  }
}
```

**验收命令**：

```sh
deno test packages/core/__tests__/prop-decorator.test.ts --allow-read --filter "attribute"
```

**通过标准**：

- [ ] `setAttribute('variant', 'primary')` → `this.variant` 返回 `'primary'`
- [ ] `this.variant = 'ghost'` + `reflect: true` → attribute 更新
- [ ] Boolean 类型：`setAttribute('disabled', '')` → `this.disabled === true`
- [ ] Number 类型：`setAttribute('count', '42')` → `this.count === 42`
- [ ] removeAttribute → Boolean 属性变为 false
- [ ] 不使用 @prop() 的组件的 `attributeChangedCallback` 不受影响

**失败处理**：如果 `observedAttributes` getter 与 Lit 的 `finalized` 模式冲突，在 `_initializeProps()` 末尾缓存结果到静态属性。

**是否污染工作区**：是（修改 dsd-element.ts 的 observedAttributes 和 attributeChangedCallback）

---

### Step 4: Signal→DOM 自动追踪 + 细粒度更新

**目标**：当 @prop() 对应的 Signal 值变化时，自动更新 DOM 中对应的绑定节点。

**涉及文件**：`packages/core/src/dsd-element.ts`, `packages/core/src/template.ts`

**执行动作**：

- [ ] 在 `_subscribeTemplateSignals()` 中增强 Signal 订阅：

```ts
private _subscribeTemplateSignals(result: TemplateResult): void {
  const signals = collectTemplateSignals(result);
  for (const signal of signals) {
    // 订阅变化 → 定向更新 data-less-b 标记的节点
    const unsubscribe = signal.subscribe(() => {
      this._patchSignalBindings(result);
    });
    this._signalUnsubscribers.push(unsubscribe);
  }
}
```

- [ ] 实现 `_patchSignalBindings()`（细粒度 DOM 补丁）：

```ts
private _patchSignalBindings(result: TemplateResult): void {
  if (!this.shadowRoot) return;

  // 收集所有 Signal 值及其绑定索引
  const signals = collectTemplateSignals(result);
  for (let i = 0; i < signals.length; i++) {
    const marker = this.shadowRoot.querySelector(`[data-less-b="${i}"]`);
    if (marker) {
      marker.textContent = String(signals[i].value);
    }
  }
}
```

- [ ] 处理属性绑定 Signal（非文本节点）：

```ts
// 对于 class=${classMap(...)} 这种属性绑定
// 需要在 data-less-b 标记无法覆盖时回退到全量重渲染
private _patchSignalBindings(result: TemplateResult): void {
  const hasAttributeBindings = this._hasAttributeSignalBindings(result);
  if (hasAttributeBindings) {
    // 属性绑定的 Signal 变化 → 重渲染整个模板
    this._renderIntoShadowRoot();
  } else {
    // 仅文本节点 → 细粒度补丁
    this._patchTextNodeBindings(result);
  }
}
```

**验收命令**：

```sh
deno test packages/core/__tests__/reactive-host.test.ts --allow-read --filter "auto"
```

**通过标准**：

- [ ] `@prop() name = 'world'` + `html`<span>${this.name}</span>`` → 设置 `this.name = 'less'` → DOM 自动更新
- [ ] 无需手动 `this.update()` 或 `this._syncDOM()`
- [ ] 文本节点 Signal 变化 → 细粒度 `data-less-b` 补丁
- [ ] 属性绑定 Signal 变化 → 全量重渲染（回退策略）
- [ ] 多个 Signal 在同一微任务中变化 → 只触发 1 次更新

**失败处理**：如果细粒度补丁在 Shadow DOM 结构变化后定位不到节点，回退到全量 `innerHTML` 重渲染。

**是否污染工作区**：是（修改 dsd-element.ts 的 Signal 订阅逻辑）

---

### Step 5: 迁移 less-button 为示范

**目标**：将 `less-button` 从手动 `_syncDOM()` 模式迁移到 `@prop()` 模式，验证 DX 提升。

**涉及文件**：`packages/ui/src/less-button.ts`

**执行动作**：

- [ ] 替换前（估算 10+ 行）→ 替换后（2 行）：

```ts
// BEFORE
static get observedAttributes() { return ['variant', 'disabled']; }
private _variant: Variant = 'default';
private _disabled = false;
attributeChangedCallback(name, _old, value) {
  if (name === 'variant') { this._variant = value as Variant; this._syncDOM(); }
  if (name === 'disabled') { this._disabled = value !== null; this._syncDOM(); }
}
private _syncDOM() { ... }

// AFTER
@prop() variant: Variant = 'default';
@prop({ type: Boolean, reflect: true }) disabled = false;
```

- [ ] 更新 `render()` 使用 `classMap`：

```ts
render() {
  return html`<button
    class=${classMap({
      'btn': true,
      'btn-primary': this.variant === 'primary',
      'btn-ghost': this.variant === 'ghost',
    })}
    ?disabled=${this.disabled}
    @click=${this._onClick}
  ><slot></slot></button>`;
}
```

- [ ] 验证无功能回归

**验收命令**：

```sh
deno test packages/ui/__tests__/less-button-reactive.test.ts --allow-read
deno test packages/ui/__tests__/ --allow-read  # 全量 UI 测试
```

**通过标准**：

- [ ] less-button 使用 `@prop()` 后功能等价
- [ ] attribute 设置/读取正常
- [ ] 事件绑定正常
- [ ] Signal 变化自动更新 DOM
- [ ] 代码行数减少 > 50%

**失败处理**：如果 `@prop()` 与现有 `_syncDOM()` 残留冲突，确保迁移时完全删除旧代码。

**是否污染工作区**：是（修改 UI 组件）

## Quality Gates

| Gate | Criteria                                                  |
| ---- | --------------------------------------------------------- |
| G1   | `@prop() variant = 'default'` 注册到 `_propMetadata`      |
| G2   | `this.variant = 'primary'` 自动触发 DOM 更新              |
| G3   | `setAttribute('disabled', '')` → `this.disabled === true` |
| G4   | `reflect: true` → property 变化同步到 attribute           |
| G5   | 微任务批处理：同块多次赋值只 1 次重渲染                   |
| G6   | `render(): string` 组件不受影响（opt-in）                 |
| G7   | less-button 迁移后功能等价                                |
| G8   | `deno task typecheck && deno task test` 全通过            |

## Risk Assessment

| Risk                                      | Likelihood | Impact | Mitigation                              |
| ----------------------------------------- | ---------- | ------ | --------------------------------------- |
| 装饰器与 Deno 不兼容                      | 低         | 高     | 回退到 TS experimentalDecorators        |
| Object.defineProperty 与类字段初始值冲突  | 中         | 中     | _initializeProps 读取实例初始值         |
| 细粒度补丁定位不到节点                    | 中         | 低     | 回退到 innerHTML 全量重渲染             |
| attributeChangedCallback 分发覆盖用户逻辑 | 低         | 中     | 保留 _userAttributeChangedCallback 回调 |
| SSR 管线中 @prop() Signal 不可用          | 中         | 高     | SSR 路径跳过 Signal 创建，直接设置属性  |
