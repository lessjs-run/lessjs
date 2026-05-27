# SOP-009: html 模板系统强化

> Version: v0.23.x
> Priority: P1
> Status: PLANNED
> Depends on: ADR-0051
> Blocks: SOP-010（@prop() 需要 classMap）

## Objective

为 LessJS 自建 `html` tagged template 添加 5 个模板原语（classMap/when/choose/repeat/ref）+ 模板缓存，使模板语言覆盖 80%+ 真实场景，消除手动字符串拼接和 `querySelector` 模式。

## Current Problem

评估报告指出 `html` 模板系统存在 5 个 DX 缺陷：

1. **无模板缓存**：每次 `render()` 调用都从零构建字符串
2. **无 class/style 助手**：动态 CSS class 靠手动字符串拼接
3. **无条件/迭代原语**：三元表达式 + `.map()` 在模板中可读性差
4. **无 ref 指令**：DOM 引用靠手动 `querySelector`
5. **TemplateValue 类型过宽**：`string | number | boolean | bigint | null | undefined | TemplateResult | ...` 联合类型丢失上下文信息

当前 `packages/core/src/template.ts` 共 309 行，仅支持 `html`/`unsafeHTML`/信号插值/事件绑定。

## Target Files

| File                                               | Action | 说明                                 |
| -------------------------------------------------- | ------ | ------------------------------------ |
| `packages/core/src/template.ts`                    | MODIFY | 添加 5 个原语 + 缓存                 |
| `packages/core/src/template-helpers.ts`            | CREATE | classMap/when/choose/repeat/ref 实现 |
| `packages/core/src/template-cache.ts`              | CREATE | TemplateStringsArray 缓存            |
| `packages/core/src/mod.ts`                         | MODIFY | 导出新原语                           |
| `packages/core/__tests__/template-helpers.test.ts` | CREATE | 原语单元测试                         |
| `packages/core/__tests__/template-cache.test.ts`   | CREATE | 缓存单元测试                         |

## Procedure

### Step 1: 模板缓存（TemplateStringsArray identity）

**目标**：基于 `TemplateStringsArray` 的引用恒等性缓存已解析的模板结构，避免重复解析。

**涉及文件**：`packages/core/src/template-cache.ts`（新建）

**执行动作**：

- [ ] 创建 `ParsedTemplate` 类型：

```ts
/** 缓存的模板解析结果 */
export interface ParsedTemplate {
  /** 静态部分（不变） */
  readonly strings: readonly string[];
  /** 绑定位置元数据 */
  readonly bindings: readonly BindingSlot[];
}

export interface BindingSlot {
  /** 在 strings 数组中的插入位置 */
  index: number;
  /** 绑定类型 */
  type: 'text' | 'attribute' | 'event' | 'property' | 'boolean-attr';
  /** 如果是属性/事件绑定，记录名称 */
  name?: string;
  /** sigil 标记 */
  sigil?: '@' | '.' | '?' | '';
}
```

- [ ] 创建 `templateCache` WeakMap：

```ts
const templateCache = new WeakMap<TemplateStringsArray, ParsedTemplate>();

export function getCachedTemplate(strings: TemplateStringsArray): ParsedTemplate | undefined {
  return templateCache.get(strings);
}

export function setCachedTemplate(strings: TemplateStringsArray, parsed: ParsedTemplate): void {
  templateCache.set(strings, parsed);
}
```

- [ ] 修改 `renderTemplateToString()` 优先查缓存：

```ts
export function renderTemplateToString(
  result: TemplateResult,
  options: { runtimeMarkers?: boolean } = {},
): string {
  const cached = getCachedTemplate(result.strings as TemplateStringsArray);
  if (cached) {
    return renderFromCache(cached, result.values, options);
  }
  // ... 现有逻辑，完成后写入缓存
}
```

**验收命令**：

```sh
deno test packages/core/__tests__/template-cache.test.ts --allow-read
```

**通过标准**：

- [ ] 相同 `TemplateStringsArray` 引用只解析一次
- [ ] 缓存命中时跳过 `detectBinding()` 调用
- [ ] 不同模板实例（不同 strings 引用）各自独立缓存
- [ ] WeakMap 缓存不阻止 GC 回收

**失败处理**：如果 WeakMap 在某些运行时对 frozen array 行为异常，改用 `Map<string, ParsedTemplate>` 以 `strings.join('\0')` 为 key。

**是否污染工作区**：否（新增文件，不修改现有逻辑）

---

### Step 2: `classMap()` 助手

**目标**：根据对象键值对动态生成 `class` 属性字符串。

**涉及文件**：`packages/core/src/template-helpers.ts`（新建）

**执行动作**：

- [ ] 实现 `classMap`：

```ts
export interface ClassMap {
  [className: string]: boolean | undefined | null;
}

export function classMap(classes: ClassMap): string {
  return Object.entries(classes)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
    .join(' ');
}
```

- [ ] 使用示例（ADR-0051 定义）：

```ts
render() {
  return html`<button class=${classMap({
    'btn': true,
    'btn-primary': this.variant === 'primary',
    'disabled': this.disabled,
  })}>Click</button>`;
}
// → <button class="btn btn-primary disabled">Click</button>
```

- [ ] 处理 `classMap` 返回空字符串时移除 `class=""` 属性

**验收命令**：

```sh
deno test packages/core/__tests__/template-helpers.test.ts --allow-read --filter "classMap"
```

**通过标准**：

- [ ] `classMap({ a: true, b: false, c: true })` → `"a c"`
- [ ] `classMap({})` → `""`
- [ ] `classMap({ 'btn-primary': true, disabled: false })` → `"btn-primary"`
- [ ] 与 `html` 模板集成：`class=${classMap({...})}` 正确输出 class 属性
- [ ] 空 classMap 不产生 `class=""` 空属性

**失败处理**：如果 `class=""` 无法通过模板引擎自动移除，在 `renderBinding()` 中增加空字符串检测。

**是否污染工作区**：否（新增文件）

---

### Step 3: `when()` / `choose()` 条件原语

**目标**：提供声明式条件渲染，替代三元表达式。

**涉及文件**：`packages/core/src/template-helpers.ts`

**执行动作**：

- [ ] 实现 `when`：

```ts
export function when(
  condition: unknown,
  truthy: () => TemplateValue,
  falsy?: () => TemplateValue,
): TemplateValue {
  if (condition) return truthy();
  return falsy ? falsy() : '';
}
```

- [ ] 实现 `choose`：

```ts
export function choose<T extends string | number>(
  value: T,
  cases: readonly [T, () => TemplateValue][],
  fallback?: () => TemplateValue,
): TemplateValue {
  for (const [caseValue, factory] of cases) {
    if (value === caseValue) return factory();
  }
  return fallback ? fallback() : '';
}
```

- [ ] 使用示例（ADR-0051 定义）：

```ts
// when
render() {
  return html`<div>
    ${when(this.loaded,
      () => html`<profile .user=${this.user}></profile>`,
      () => html`<loading-spinner></loading-spinner>`
    )}
  </div>`;
}

// choose
render() {
  return choose(this.status, [
    ['loading', () => html`<spinner></spinner>`],
    ['error',   () => html`<error-msg></error-msg>`],
    ['empty',   () => html`<empty-state></empty-state>`],
  ], () => html`<data-view></data-view>`);
}
```

**验收命令**：

```sh
deno test packages/core/__tests__/template-helpers.test.ts --allow-read --filter "when|choose"
```

**通过标准**：

- [ ] `when(true, () => 'yes', () => 'no')` → `"yes"`
- [ ] `when(false, () => 'yes', () => 'no')` → `"no"`
- [ ] `when(false, () => 'yes')` → `""`（无 falsy 分支）
- [ ] `when(0, () => 'yes')` → `""`（falsy 值）
- [ ] `choose('b', [['a', () => 'A'], ['b', () => 'B']])` → `"B"`
- [ ] `choose('c', [['a', () => 'A']], () => 'default')` → `"default"`
- [ ] `choose('c', [['a', () => 'A']])` → `""`（无 fallback）
- [ ] 懒求值：未匹配的分支工厂函数不被调用

**失败处理**：如果 Signal 值作为 `when` 的 condition 不触发更新（因为 `when` 不返回 SignalLike），需要在 `when` 内部订阅 condition 如果是 SignalLike。

**是否污染工作区**：否（在新建文件中添加）

---

### Step 4: `repeat()` 迭代原语

**目标**：基于 key 的列表渲染，避免未变更项的重渲染。

**涉及文件**：`packages/core/src/template-helpers.ts`

**执行动作**：

- [ ] 实现 `repeat`（三参数版本，含 key 函数）：

```ts
export function repeat<T>(
  items: readonly T[],
  keyFn: (item: T, index: number) => unknown,
  templateFn: (item: T, index: number) => TemplateValue,
): TemplateValue[] {
  return items.map((item, index) => templateFn(item, index));
}
```

- [ ] 实现 `repeat`（两参数版本，无 key 函数，回退到 index）：

```ts
export function repeat<T>(
  items: readonly T[],
  templateFn: (item: T, index: number) => TemplateValue,
): TemplateValue[];
```

> **注**：v0.23.x 的 `repeat` 先实现为简化版本（纯映射），不做 diff/patch。key 函数仅用于标识，为未来 v0.25 的 DOM 复用预留。ADR-0051 明确指出 key-based diff/patch 约 100 行，留到 v0.25 的 DOM 复用优化。

- [ ] 使用示例（ADR-0051 定义）：

```ts
render() {
  return html`<ul>
    ${repeat(this.items, (item) => item.id, (item) => html`
      <li>${item.name}</li>
    `)}
  </ul>`;
}
```

**验收命令**：

```sh
deno test packages/core/__tests__/template-helpers.test.ts --allow-read --filter "repeat"
```

**通过标准**：

- [ ] `repeat([1,2,3], (x) => x * 2)` → `[2, 4, 6]`
- [ ] `repeat([], (x) => x)` → `[]`
- [ ] key 函数被调用但结果暂不用于 diff（预留接口）
- [ ] 与 `html` 模板集成：`html`<ul>${repeat(items, fn)}</ul>`` 正确输出列表

**失败处理**：无——此为纯函数实现，逻辑简单。

**是否污染工作区**：否

---

### Step 5: `ref()` 指令

**目标**：声明式 DOM 引用，替代手动 `querySelector`。

**涉及文件**：`packages/core/src/template-helpers.ts`, `packages/core/src/template.ts`

**执行动作**：

- [ ] 实现 `ref` 容器：

```ts
export class Ref<T = Element> {
  public value?: T;
  private _callback?: (el: T | undefined) => void;

  constructor(callback?: (el: T | undefined) => void) {
    this._callback = callback;
  }

  /** 由模板引擎在 DOM 挂载后调用 */
  _set(element: T | undefined): void {
    this.value = element;
    this._callback?.(element);
  }
}

export function ref<T = Element>(callback?: (el: T | undefined) => void): Ref<T> {
  return new Ref(callback);
}
```

- [ ] 在 `template.ts` 中识别 `Ref` 类型值：

```ts
// 在 detectBinding 之后检查：如果绑定值是 Ref 实例
if (value instanceof Ref) {
  // SSR: 不输出（ref 仅客户端有意义）
  // Client: 在 applyRuntimeTemplateBindings 中设置 ref.value
}
```

- [ ] 在 `applyRuntimeTemplateBindings()` 中处理 Ref 绑定：

```ts
for (const binding of bindings.refs) {
  const marker = `data-less-ref-${binding.index}`;
  const element = root.querySelector(`[${marker}]`);
  if (element) {
    element.removeAttribute(marker);
    binding.ref._set(element as Element);
  }
}
```

- [ ] 使用示例（ADR-0051 定义）：

```ts
class MyComponent extends DsdElement {
  private _inputEl = ref<HTMLInputElement>();

  render() {
    return html`
      <input ${ref(this._inputEl)} @input="${this._onInput}">
    `;
  }

  private _onInput() {
    console.log(this._inputEl.value?.value);
  }
}
```

**验收命令**：

```sh
deno test packages/core/__tests__/template-helpers.test.ts --allow-read --filter "ref"
```

**通过标准**：

- [ ] `ref()` 创建的 `Ref` 实例在 DOM 挂载后 `.value` 被自动设置
- [ ] SSR 路径中 `ref` 不产生任何输出
- [ ] 回调形式：`ref((el) => ...)` 在 DOM 挂载后调用
- [ ] 组件断开连接时 ref 不产生悬挂引用（仅弱持有）

**失败处理**：如果 `Ref` 的 symbol 标记与 `TemplateValue` 类型不兼容，增加 `Ref` 到 `TemplateValue` 联合类型。

**是否污染工作区**：是（修改 template.ts 增加 Ref 处理逻辑）

---

### Step 6: 收窄 TemplateValue 类型 + 导出

**目标**：收窄 `TemplateValue` 联合类型，按上下文区分属性值/内容值/事件值。

**涉及文件**：`packages/core/src/template.ts`, `packages/core/src/mod.ts`

**执行动作**：

- [ ] 增加上下文相关的类型别名：

```ts
/** 属性上下文的合法值 */
export type AttrValue = string | number | boolean | null | undefined;

/** 内容上下文的合法值 */
export type ContentValue = string | number | TemplateResult | UnsafeHtmlValue | SignalLike;

/** 事件上下文的合法值 */
export type EventValue = EventListener | ((event: Event) => void);
```

- [ ] `TemplateValue` 保持不变（向后兼容），但这些别名供内部和高级用户使用
- [ ] 在 `mod.ts` 中导出所有新增 API：

```ts
export { classMap } from './template-helpers.ts';
export { choose, when } from './template-helpers.ts';
export { repeat } from './template-helpers.ts';
export { Ref, ref } from './template-helpers.ts';
export { getCachedTemplate, setCachedTemplate } from './template-cache.ts';
```

**验收命令**：

```sh
deno task typecheck
deno task test
```

**通过标准**：

- [ ] `AttrValue`/`ContentValue`/`EventValue` 类型可从 `@lessjs/core` 导入
- [ ] 所有新增函数可从 `@lessjs/core` 导入
- [ ] 现有测试全通过（无回归）
- [ ] `deno task typecheck` 无新增错误

**失败处理**：如果导出导致循环依赖，将 `template-helpers.ts` 和 `template-cache.ts` 合并到 `template.ts`。

**是否污染工作区**：是（修改 mod.ts 导出）

## Quality Gates

| Gate | Criteria                                                           |
| ---- | ------------------------------------------------------------------ |
| G1   | `classMap({ a: true, b: false })` → `"a"`                          |
| G2   | `when(true, () => html`yes`)` → `<span data-less-b="N">yes</span>` |
| G3   | `choose('b', [['a', () => 'A'], ['b', () => 'B']])` → `"B"`        |
| G4   | `repeat([1,2,3], (x) => html`<li>${x}</li>`)` 正确渲染列表         |
| G5   | `ref()` 在客户端 DOM 挂载后自动设置 `.value`                       |
| G6   | 模板缓存命中时跳过 `detectBinding()`                               |
| G7   | 所有新增 API 从 `@lessjs/core` 可导入                              |
| G8   | `deno task typecheck && deno task test` 全通过                     |

## Risk Assessment

| Risk                                    | Likelihood | Impact | Mitigation                      |
| --------------------------------------- | ---------- | ------ | ------------------------------- |
| classMap 空字符串产生 `class=""`        | 中         | 低     | renderBinding 中检测空值        |
| Ref symbol 与 TemplateValue 不兼容      | 低         | 中     | 增加 Ref 到联合类型             |
| 模板缓存 WeakMap 在 Deno 中行为差异     | 低         | 低     | 回退到 Map + hash key           |
| repeat 未来需要 diff/patch 但接口不兼容 | 中         | 中     | v0.23.x 先留 keyFn 参数但不使用 |
