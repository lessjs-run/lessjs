# SOP-008: 验证 + 回归测试 + Release Gate

> Version: v0.24.1
> Priority: P0
> Status: PLANNED
> Depends on: SOP-001 ~ SOP-007 全部完成

## Objective

全量验证 JSX+Signal 组件模型的正确性，确保无回归，通过 Release Gate。

## Entry Criteria

- SOP-001 ~ SOP-007 全部完成
- `deno task test` 通过
- `deno task typecheck` 通过

## Procedure

### Step 1: 全量单元测试

```bash
deno task test
```

**关注点**：

- 新增 jsx-runtime 测试全部通过
- static-props 测试全部通过
- signal-unwrap 测试全部通过
- 现有测试无回归

### Step 2: 全量类型检查

```bash
deno task typecheck
```

**关注点**：

- VNode 接口类型正确
- static props 类型推导正确（或 MVP 兜底正确）
- 无新增 any 类型泄漏

### Step 3: DSD Conformance

```bash
deno task dsd:check-report
```

**关注点**：

- JSX 组件的 DSD 输出与 html 组件结构等价
- DSD gate 无新增 unknown 错误
- known 错误数不增加

### Step 4: 构建验证

```bash
deno task build
```

**关注点**：

- jsx-runtime 正确打包
- jsx-runtime 的 bundle size 增量 < 5KB gzip
- 删除 template.ts 指令后净增量 < 3KB gzip

### Step 5: E2E 测试

```bash
deno task test:e2e
```

**关注点**：

- www 中所有页面正常渲染
- JSX 组件交互正常（事件、Signal 更新）
- DSD 预渲染页面正常 hydrate

### Step 6: SSR 输出对比

**方法**：

1. 选择 5 个已迁移组件
2. 对比 v0.23.x 和 v0.24.1 的 SSG 输出 HTML
3. 确认无结构性差异

### Step 7: Lint + Format

```bash
deno task fmt:check
deno task lint
```

### Step 8: 发布检查

- [ ] `packages/core/deno.json` 新增 `./jsx-runtime` 子路径导出
- [ ] `deno.json` 根配置 `jsx: "react-jsx"`, `jsxImportSource: "@openelement/core"`
- [ ] CHANGELOG 更新
- [ ] ADR-0057 状态更新为 IMPLEMENTED
- [ ] 版本号 bump

## Exit Criteria (Release Gate)

- [ ] `deno task test` — 0 failures
- [ ] `deno task typecheck` — 0 errors
- [ ] `deno task fmt:check` — pass
- [ ] `deno task lint` — 0 errors
- [ ] `deno task build` — success
- [ ] `deno task dsd:check-report` — pass
- [ ] `deno task test:e2e` — 0 failures
- [ ] jsx-runtime bundle size 增量 < 5KB gzip
- [ ] SSR 输出等价性确认（5 个组件）
- [ ] ADR-0057 状态为 IMPLEMENTED
