# SOP-002: static props + Signal 自动解包

> Version: v0.24.1
> Priority: P0
> Status: PLANNED
> Depends on: SOP-001 (jsx-runtime core)

## Objective

实现 `static props` 声明式配置替代 `@prop()` 装饰器，实现 Signal 自动解包（valueOf + Symbol.toPrimitive），并提供 `unwrap()` 兜底工具。

## Non-Goals

- 不修改 DsdElement 的 connectedCallback / disconnectedCallback 核心生命周期（只修改属性初始化逻辑）
- 不实现 `PropsFrom<T>` 完整类型推导（SOP-006）
- 不移除 `@prop()` 装饰器（只标记 deprecated）

## Target Files

### 修改

| 文件                               | 变更                                                              |
| ---------------------------------- | ----------------------------------------------------------------- |
| `packages/core/src/dsd-element.ts` | 读取 `static props`，自动生成 observedAttributes + 创建 Signal    |
| `packages/core/src/prop.ts`        | `createPropSignal` 增加 valueOf / Symbol.toPrimitive + `unwrap()` |
| `packages/core/src/index.ts`       | 导出 `unwrap`                                                     |

### 新增

| 文件                                            | 用途                   |
| ----------------------------------------------- | ---------------------- |
| `packages/core/__tests__/static-props.test.ts`  | static props 测试      |
| `packages/core/__tests__/signal-unwrap.test.ts` | 自动解包 + unwrap 测试 |

## Procedure

### Step 1: createPropSignal 增加 valueOf + Symbol.toPrimitive

**文件**: `packages/core/src/prop.ts`

在现有 `createPropSignal` 中增加自动解包：

```typescript
function createPropSignal<T>(initial: T, options?: { reflect?: boolean }) {
  const sig = signal(initial);

  const enhanced = Object.defineProperties(sig, {
    valueOf: {
      value: function (this: Signal<T>) {
        return this.value;
      },
      enumerable: false,
    },
    [Symbol.toPrimitive]: {
      value: function (this: Signal<T>, hint: string) {
        return hint === 'string' ? String(this.value) : this.value;
      },
      enumerable: false,
    },
  });

  return enhanced as Signal<T> & { value: T };
}
```

**验证**：

- [ ] `String(sig)` 调用 `Symbol.toPrimitive('string')` → 返回字符串
- [ ] `Number(sig)` 调用 `valueOf()` → 返回数字
- [ ] `sig > 5` 比较正确触发 valueOf
- [ ] 现有 `sig.value` 读写行为不变

### Step 2: 实现 unwrap() 工具

**文件**: `packages/core/src/prop.ts`（或 `signal-utils.ts`）

```typescript
/**
 * 显式解包 Signal 值。在 JSX {} 外使用 Signal 时必须调用。
 *
 * @example
 * const items = signal([1, 2, 3]);
 * Array.isArray(unwrap(items)); // true
 * Array.isArray(items);         // false — Signal 不是 Array
 */
export function unwrap<T>(sig: Signal<T> | T): T {
  return sig instanceof Signal ? sig.value : sig;
}
```

**验证**：

- [ ] `unwrap(signal(42))` → `42`
- [ ] `unwrap(42)` → `42`（非 Signal 值直接返回）
- [ ] `unwrap(signal([1,2,3]))` → `[1,2,3]`

### Step 3: DsdElement 读取 static props

**文件**: `packages/core/src/dsd-element.ts`

在 `DsdElement` 的类初始化中读取 `static props` 并自动配置：

```typescript
// dsd-element.ts — 新增逻辑

// 1. observedAttributes 自动生成
static get observedAttributes(): string[] {
  const ownProps = (this as any).props;
  if (!ownProps) return [];
  return Object.keys(ownProps).map(k => k.toLowerCase());
}

// 2. constructor 中创建 Signal
constructor() {
  super();
  this._initProps();
}

private _initProps(): void {
  const ctor = this.constructor as typeof DsdElement;
  const propsDef = (ctor as any).props;
  if (!propsDef) return;

  for (const [name, decl] of Object.entries(propsDef)) {
    const { type, default: def, reflect } = normalizePropDecl(decl);
    const sig = createPropSignal(def, { reflect });
    Object.defineProperty(this, name, {
      get: () => sig,
      set: (v: any) => { sig.value = v; },
      enumerable: true,
      configurable: true,
    });
  }
}
```

**`normalizePropDecl` 辅助函数**：

```typescript
function normalizePropDecl(
  decl: any,
): { type: FunctionConstructor; default: any; reflect: boolean } {
  // 简写: count: Number → { type: Number, default: 0, reflect: false }
  if (typeof decl === 'function') {
    const defaults: Record<string, any> = {
      [String.name]: '',
      [Number.name]: 0,
      [Boolean.name]: false,
      [Array.name]: () => [],
      [Object.name]: () => ({}),
    };
    return { type: decl, default: defaults[decl.name] ?? null, reflect: false };
  }
  // 完整声明: { type: String, default: 'hi', reflect: true }
  return {
    type: decl.type,
    default: decl.default ?? getDefaultValue(decl.type),
    reflect: decl.reflect ?? false,
  };
}
```

**验证**：

- [ ] `static props = { count: Number }` → `this.count` 是 Signal\<number\>
- [ ] `this.count` 默认值 0
- [ ] `this.count = 5` → Signal 值更新为 5
- [ ] `observedAttributes` 自动包含 `'count'`
- [ ] `attributeChangedCallback` 正确将 HTML attribute 变化写入 Signal
- [ ] `reflect: true` 的 prop 在 Signal 变化时写回 HTML attribute
- [ ] Boolean 类型 prop 的 attribute 存在性语义正确

### Step 4: connectedCallback 读取 HTML attribute 初始值

**文件**: `packages/core/src/dsd-element.ts`

在 `connectedCallback` 中，从 HTML attribute 读取初始值覆盖 Signal 默认值：

```typescript
override connectedCallback(): void {
  // ... 现有逻辑 ...

  // static props: 从 HTML attribute 读取初始值
  const ctor = this.constructor as typeof DsdElement;
  const propsDef = (ctor as any).props;
  if (propsDef) {
    for (const [name, decl] of Object.entries(propsDef)) {
      const { type } = normalizePropDecl(decl);
      const attrValue = this.getAttribute(name);
      if (attrValue !== null) {
        const sig = (this as any)[name];
        if (type === Boolean) {
          sig.value = true; // attribute 存在 = true
        } else if (type === Number) {
          sig.value = Number(attrValue);
        } else {
          sig.value = attrValue;
        }
      }
    }
  }

  // ... 现有 DSD hydration / render 逻辑 ...
}
```

**验证**：

- [ ] `<my-counter count="10">` → Signal 初始值为 10
- [ ] `<my-card active>` → Boolean Signal 初始值为 true
- [ ] 无 attribute → Signal 保持默认值

### Step 5: 标记 @prop() 为 @deprecated

**文件**: `packages/core/src/prop.ts`

在 `@prop()` 装饰器上添加 `@deprecated` JSDoc：

```typescript
/**
 * @deprecated Use `static props` instead. See ADR-0057.
 * This decorator will be removed in v1.0.
 */
export function prop(options?: PropOptions) {
  // ... 现有实现不变 ...
}
```

**验证**：

- [ ] IDE 显示 @prop() 的废弃提示
- [ ] 现有使用 @prop() 的组件仍然工作

### Step 6: 单元测试

**文件**: `packages/core/__tests__/static-props.test.ts`

覆盖：

1. 简写声明 (`count: Number`) → 正确创建 Signal + 默认值
2. 完整声明 (`{ type: String, default: 'hi', reflect: true }`) → 正确配置
3. Boolean 类型 attribute 存在性语义
4. `observedAttributes` 自动生成
5. `attributeChangedCallback` → Signal 更新
6. `reflect: true` → attribute 写回
7. HTML attribute 初始值 → Signal 初始值
8. `disconnectedCallback` 清理 Signal 订阅

**文件**: `packages/core/__tests__/signal-unwrap.test.ts`

覆盖：

1. `valueOf` 自动解包：String()、Number()、比较运算
2. `Symbol.toPrimitive` 自动解包
3. `unwrap()` 在边界场景（JSON.stringify、Array.isArray、typeof）
4. 非解包场景的 `.value` 显式访问

**验证**：

- [ ] 全部测试通过
- [ ] `deno task test` 无回归

## Rollback

如果 static props 实现导致 DsdElement 初始化回归：

1. 在 DsdElement 中加 feature flag `static USE_STATIC_PROPS = false`
2. 默认走 @prop() 路径
3. 在 v0.25.x 完成迁移后移除 feature flag
