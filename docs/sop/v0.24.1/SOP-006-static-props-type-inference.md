# SOP-006: static props TypeScript 类型推导

> Version: v0.24.1
> Priority: P1
> Status: PLANNED
> Depends on: SOP-002 (static props + Signal unwrap)

## Objective

为 `static props` 提供完整的 TypeScript 类型推导，使 `this.count` 在 `render()` 内被推导为 `number` 而非 `NumberConstructor` 或 `Signal<number>`。

## Non-Goals

- 不修改 TypeScript 编译器
- 不引入运行时开销（纯类型层面）

## Procedure

### Step 1: 定义 PropDecl 和 PropType 映射

**文件**: `packages/core/src/prop-types.ts`

```typescript
// Prop 声明类型
export type PropDecl =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor
  | { type: StringConstructor; default?: string; reflect?: boolean }
  | { type: NumberConstructor; default?: number; reflect?: boolean }
  | { type: BooleanConstructor; default?: boolean; reflect?: boolean }
  | { type: ArrayConstructor; default?: unknown[]; reflect?: boolean }
  | { type: ObjectConstructor; default?: Record<string, unknown>; reflect?: boolean };

// 从 PropDecl 推导实际类型
export type PropType<D> =
  D extends NumberConstructor ? number :
  D extends StringConstructor ? string :
  D extends BooleanConstructor ? boolean :
  D extends ArrayConstructor ? unknown[] :
  D extends ObjectConstructor ? Record<string, unknown> :
  D extends { type: NumberConstructor } ? number :
  D extends { type: StringConstructor } ? string :
  D extends { type: BooleanConstructor } ? boolean :
  D extends { type: ArrayConstructor } ? unknown[] :
  D extends { type: ObjectConstructor } ? Record<string, unknown> :
  unknown;

// 从 static props 对象推导所有属性类型
export type PropsFrom<P extends Record<string, PropDecl>> = {
  [K in keyof P]: PropType<P[K]>;
};
```

**验证**：
- [ ] `PropType<NumberConstructor>` 推导为 `number`
- [ ] `PropType<{ type: String; default: 'hi' }>` 推导为 `string`
- [ ] `PropsFrom<{ count: Number; name: String }>` 推导为 `{ count: number; name: string }`

### Step 2: DsdElement 泛型约束

**文件**: `packages/core/src/dsd-element.ts`

```typescript
export abstract class DsdElement<P extends Record<string, PropDecl> = {}>
  extends HTMLElement {
  static props: P;

  // render() 内 this 类型包含 PropsFrom<P>
  abstract render(): string | TemplateResult | VNode;
}

// 声明合并：让 this.count 在 render() 内可访问
// 具体实现通过 interface 合并完成
```

### Step 3: MVP 兜底方案

如果完整类型推导在 v0.24.1 时间线内无法完成：

- `static props` 的属性在 `this` 上类型为 `Signal<T>`
- 用户在 render() 内使用 `this.count.value`（显式 .value）
- 在 v0.25.x 补齐自动推导后，`this.count` 类型变为 `T`（breaking change 但 DX 提升）

## Rollback

如果类型推导复杂度超出预期：
1. 使用 MVP 兜底方案（Signal<T> 类型）
2. 在 CHANGELOG 中标注"类型推导将在未来版本改进"
