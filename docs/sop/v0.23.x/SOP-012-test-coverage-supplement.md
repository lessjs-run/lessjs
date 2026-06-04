# SOP-012: 测试覆盖补全

> Version: v0.23.x
> Priority: P0
> Status: PLANNED
> Depends on: SOP-009, SOP-010, SOP-011（需先完成新增代码再写测试）
> Blocks: SOP-015（覆盖率门槛）

## Objective

为 `@openelement/signals` 和 `@openelement/style-sheet` 补全测试覆盖（当前零测试），并为 SOP-009~011 新增代码编写配套测试，使整体行覆盖率 > 80%。

## Current Problem

评估报告认定的 **P0 级工程债务**：

1. **`@openelement/signals` 零测试**：该包是框架响应式的核心，但没有任何测试文件
2. **`@openelement/style-sheet` 零测试**：该包处理 CSS 构建，同样零测试
3. **核心包新增代码无测试**：SOP-009~011 新增的 classMap/when/repeat/ref/@prop/错误架构需要测试
4. **CI 无覆盖率门槛**：当前 CI 不检查覆盖率

## Target Files

| File                                                      | Action | 说明                      |
| --------------------------------------------------------- | ------ | ------------------------- |
| `packages/signals/__tests__/signals.test.ts`              | CREATE | Signal 核心 API 测试      |
| `packages/signals/__tests__/computed.test.ts`             | CREATE | Computed Signal 测试      |
| `packages/signals/__tests__/effect.test.ts`               | CREATE | Effect 测试               |
| `packages/signals/__tests__/batch.test.ts`                | CREATE | 批处理测试                |
| `packages/style-sheet/__tests__/shim-style-sheet.test.ts` | CREATE | ShimStyleSheet 测试       |
| `packages/style-sheet/__tests__/css-parse.test.ts`        | CREATE | CSS 解析测试              |
| `packages/core/__tests__/template-helpers.test.ts`        | CREATE | SOP-009 模板原语测试      |
| `packages/core/__tests__/template-cache.test.ts`          | CREATE | SOP-009 缓存测试          |
| `packages/core/__tests__/prop-decorator.test.ts`          | CREATE | SOP-010 @prop() 测试      |
| `packages/core/__tests__/reactive-host.test.ts`           | CREATE | SOP-010 ReactiveHost 测试 |
| `packages/core/__tests__/errors-unified.test.ts`          | CREATE | SOP-011 统一错误测试      |
| `packages/core/__tests__/error-boundary.test.ts`          | CREATE | SOP-011 错误边界测试      |

## Procedure

### Step 1: @openelement/signals 核心测试

**目标**：为 Signal 创建/订阅/读取/写入编写完整测试套件。

**涉及文件**：`packages/signals/__tests__/signals.test.ts`（新建）

**执行动作**：

- [ ] Signal 创建与读写：

```ts
Deno.test('signal: create and read value', () => {
  const count = createSignal(0);
  assertEquals(count.value, 0);
  count.value = 42;
  assertEquals(count.value, 42);
});
```

- [ ] Signal 订阅与通知：

```ts
Deno.test('signal: subscribe receives updates', () => {
  const name = createSignal('Alice');
  const received: string[] = [];
  name.subscribe((v) => received.push(v));
  name.value = 'Bob';
  assertEquals(received, ['Bob']);
});
```

- [ ] 取消订阅：

```ts
Deno.test('signal: unsubscribe stops notifications', () => {
  const count = createSignal(0);
  const received: number[] = [];
  const unsub = count.subscribe((v) => received.push(v));
  count.value = 1;
  unsub();
  count.value = 2;
  assertEquals(received, [1]);
});
```

- [ ] ReadonlySignal 不可写
- [ ] 相同值不触发通知（如果 alien-signals 支持）

**验收命令**：

```sh
deno test packages/signals/__tests__/signals.test.ts --allow-read
```

**通过标准**：

- [ ] 创建/读取/写入/订阅/取消订阅全路径通过
- [ ] ReadonlySignal 类型正确

**失败处理**：如果 alien-signals 的 API 与预期不同（如 `.subscribe` 不存在），先读取 `packages/signals/src/` 确认实际 API。

**是否污染工作区**：否（新增测试文件）

---

### Step 2: @openelement/signals Computed + Effect 测试

**目标**：测试 Computed Signal 派生和 Effect 副作用。

**涉及文件**：`packages/signals/__tests__/computed.test.ts`, `packages/signals/__tests__/effect.test.ts`

**执行动作**：

- [ ] Computed Signal 测试：

```ts
Deno.test('computed: derives from source signal', () => {
  const firstName = createSignal('Alice');
  const lastName = createSignal('Smith');
  const fullName = computed(() => `${firstName.value} ${lastName.value}`);
  assertEquals(fullName.value, 'Alice Smith');
  firstName.value = 'Bob';
  assertEquals(fullName.value, 'Bob Smith');
});
```

- [ ] Effect 测试：

```ts
Deno.test('effect: runs when signal changes', () => {
  const count = createSignal(0);
  const log: number[] = [];
  effect(() => log.push(count.value));
  assertEquals(log, [0]); // 初始执行
  count.value = 1;
  assertEquals(log, [0, 1]); // 变更后执行
});
```

**验收命令**：

```sh
deno test packages/signals/__tests__/ --allow-read
```

**通过标准**：

- [ ] Computed 从源 Signal 派生正确
- [ ] Effect 在 Signal 变更时触发
- [ ] Computed 缓存：多次读取只计算一次

**失败处理**：如果 `computed`/`effect` 不在 `@openelement/signals` 导出中，先确认实际导出列表。

**是否污染工作区**：否

---

### Step 3: @openelement/signals 批处理测试

**目标**：测试 Signal 的微任务批处理行为。

**涉及文件**：`packages/signals/__tests__/batch.test.ts`

**执行动作**：

- [ ] 批量赋值只触发一次更新：

```ts
Deno.test('batch: multiple writes trigger single update', async () => {
  const a = createSignal(1);
  const b = createSignal(2);
  const updates: number[] = [];

  effect(() => updates.push(a.value + b.value));

  // 在同一同步块中修改多个 Signal
  batch(() => {
    a.value = 10;
    b.value = 20;
  });

  assertEquals(updates.length, 2); // 初始 + 批处理后各1次
  assertEquals(updates[1], 30);
});
```

**验收命令**：

```sh
deno test packages/signals/__tests__/batch.test.ts --allow-read
```

**通过标准**：

- [ ] `batch()` 中多次 Signal 修改只触发 1 次 Effect
- [ ] `batch()` 外的修改正常触发

**失败处理**：如果 alien-signals 的批处理 API 与预期不同，查阅其文档适配。

**是否污染工作区**：否

---

### Step 4: @openelement/style-sheet 测试

**目标**：为 ShimStyleSheet 和 CSS 解析编写测试。

**涉及文件**：`packages/style-sheet/__tests__/shim-style-sheet.test.ts`, `packages/style-sheet/__tests__/css-parse.test.ts`

**执行动作**：

- [ ] 读取 `packages/style-sheet/src/` 确认实际 API 后编写测试
- [ ] 基本覆盖点：
  - `ShimStyleSheet` 创建 + `replaceSync()` + `adoptedBy`
  - CSS 规则解析正确性
  - 错误 CSS 输入不崩溃

**验收命令**：

```sh
deno test packages/style-sheet/__tests__/ --allow-read
```

**通过标准**：

- [ ] ShimStyleSheet 核心路径覆盖 > 80%
- [ ] 无崩溃性输入

**失败处理**：如果 style-sheet 包结构不同于预期，先 `ls` 和 `Read` 确认。

**是否污染工作区**：否

---

### Step 5: 新增代码配套测试

**目标**：为 SOP-009~011 新增的模板原语/@prop()/错误架构编写测试（已在各 SOP 的 Step 中定义文件名，此处汇总确保覆盖）。

**涉及文件**：已在 SOP-009~011 中列出的测试文件

**执行动作**：

- [ ] 确认 SOP-009 Step 1~6 的所有验收测试文件已创建
- [ ] 确认 SOP-010 Step 1~5 的所有验收测试文件已创建
- [ ] 确认 SOP-011 Step 1~6 的所有验收测试文件已创建
- [ ] 运行全量测试确保无回归

**验收命令**：

```sh
deno task test
```

**通过标准**：

- [ ] 所有新增测试通过
- [ ] 现有测试无回归

**是否污染工作区**：否（测试文件）

---

### Step 6: CI 覆盖率门槛

**目标**：CI 中增加覆盖率检查，低于 80% 阻断构建。

**涉及文件**：CI 配置（deno.json 或 CI workflow）

**执行动作**：

- [ ] 在 `deno.json` 或 CI workflow 中添加覆盖率步骤：

```sh
deno test --coverage=coverage packages/
deno coverage coverage --threshold=80
```

- [ ] 覆盖率报告输出到 CI artifact

**验收命令**：

```sh
deno test --coverage=coverage packages/ && deno coverage coverage --threshold=80
```

**通过标准**：

- [ ] 整体行覆盖率 > 80%
- [ ] `@openelement/signals` 覆盖率 > 80%
- [ ] `@openelement/style-sheet` 覆盖率 > 80%
- [ ] CI 构建在覆盖率低于 80% 时失败

**失败处理**：如果 Deno 覆盖率工具不成熟，先手动运行覆盖率检查，CI 门槛后续添加。

**是否污染工作区**：是（修改 CI 配置）

## Quality Gates

| Gate | Criteria                                        |
| ---- | ----------------------------------------------- |
| G1   | `@openelement/signals` 测试文件存在且全通过     |
| G2   | `@openelement/style-sheet` 测试文件存在且全通过 |
| G3   | SOP-009~011 所有验收测试通过                    |
| G4   | 整体行覆盖率 > 80%                              |
| G5   | CI 覆盖率门禁生效                               |

## Risk Assessment

| Risk                         | Likelihood | Impact | Mitigation               |
| ---------------------------- | ---------- | ------ | ------------------------ |
| alien-signals API 与预期不同 | 中         | 低     | 先读源码确认实际 API     |
| Deno 覆盖率工具不稳定        | 中         | 低     | 先手动检查，CI 门槛后补  |
| 新增测试与现有测试冲突       | 低         | 中     | 独立文件，不修改现有测试 |
