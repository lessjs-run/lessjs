# SOP-005: 内部组件迁移（html → JSX + @prop → static props）

> Version: v0.24.1
> Priority: P0
> Status: PLANNED
> Depends on: SOP-001, SOP-002, SOP-003, SOP-004

## Objective

将 `@openelement/ui` 和其他内部组件从 `html` tagged template + `@prop()` 迁移到 JSX + `static props`。

## Scope

**迁移范围**：所有 `packages/ui/src/` 下的组件 + `packages/core/src/` 中的内部组件。

**不在范围内**：`www/` 中的组件（它们可能用 Lit 或其他框架）、第三方组件适配器。

## Procedure

### Step 0: 盘点组件清单

运行以下命令获取完整迁移清单：

```bash
# 找到所有使用 html tagged template 的组件
grep -rn "from '@openelement/core'" packages/ui/src/ --include="*.ts" | grep "html"
# 找到所有使用 @prop() 的组件
grep -rn "@prop()" packages/ui/src/ --include="*.ts"
```

为每个组件创建迁移检查项。

### Step 1: 迁移模板语法

每个组件的 render() 方法从：

```typescript
override render() {
  return html`
    <div class="${classMap({ active: this.active })}">
      ${when(this.show, () => html`<span>visible</span>`)}
    </div>
  `;
}
```

改为：

```tsx
override render() {
  return (
    <div class={`container${this.active ? ' active' : ''}`}>
      {this.show && <span>visible</span>}
    </div>
  );
}
```

**转换规则**：

| 旧语法                    | 新语法                                        |
| ------------------------- | --------------------------------------------- |
| `html`...``               | JSX `<>...</>`                                |
| `${classMap({ a: x })}`   | `` `${x ? 'a' : ''}` ``                       |
| `${when(cond, a, b)}`     | `{cond ? <A /> : <B />}` 或 `{cond && <A />}` |
| `${choose(key, map, fb)}` | `{map[key] ?? <Fallback />}`                  |
| `${repeat(items, fn)}`    | `{items.map(item => <Item />)}`               |
| `${ref(cb)}`              | `<div ref={cb}>`                              |
| `${unsafeHTML(str)}`      | `<div innerHTML={str}>`                       |
| `@click=${handler}`       | `onClick={handler}`                           |
| `.prop=${value}`          | `prop={value}`                                |
| `?attr=${bool}`           | `attr={bool}`                                 |
| `<slot></slot>`           | `<slot />`                                    |

### Step 2: 迁移属性声明

从：

```typescript
active = false;
title = '';
```

改为：

```typescript
static props = {
  active: { type: Boolean, default: false },
  title: { type: String, default: '' },
};
```

### Step 3: 逐组件验证

每个组件迁移后：

1. 运行 `deno task test` — 确保单元测试通过
2. 运行 `deno task dsd:check-report` — 确保 DSD conformance 不退化
3. 视觉验证 — 在 www 开发服务器中确认组件外观不变

### Step 4: 更新 import

移除不再需要的 import：

- `html`, `classMap`, `when`, `choose`, `repeat`, `ref`, `unsafeHTML` 从 `@openelement/core`
- `@prop` 从 `@openelement/core`

添加需要的 import：

- 组件文件顶部添加 `/** @jsxImportSource @openelement/core */`（如果未全局配置）

### Step 5: 删除 template.ts 中的指令实现

**仅当所有内部组件迁移完成后**：

在 `packages/core/src/template.ts` 中：

- 标记 `classMap`、`when`、`choose`、`repeat`、`ref` 为 `@deprecated`
- 不删除实现（v0.28 才移入 html-legacy）

**验证**：

- [ ] 所有内部组件迁移完成
- [ ] `deno task test` 通过
- [ ] `deno task dsd:check-report` 通过
- [ ] `deno task test:e2e` 通过
- [ ] www 中所有组件视觉回归检查通过

## Rollback

如果迁移导致不可接受的回归：

1. 逐组件回退到 html 版本
2. JSX 和 html 组件可以共存（DsdElement 支持两种返回类型）
3. 不做全量回退，只回退问题组件
