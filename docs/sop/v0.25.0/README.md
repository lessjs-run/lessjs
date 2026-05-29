# LessJS v0.25.0 — Declarative DX

> Status: PLANNED\
> Target: 声明式构建管线 + 类型安全路由 + static head + static client\
> Depends on: v0.24.4 (API naming consolidation)\
> Governing ADR: ADR-0058, ADR-0059\
> See also: `docs/conversation/20260629/v0.25.0-0.26.0-declarative-reactive-roadmap.md`

## Mission

消除最大架构债（脚本式三阶段构建），统一 DX 为声明式风格。

```
Before v0.25.0
  less() → build.ts → build-client.ts → build-ssg.ts 三阶段硬编码
  _getRouteParams() → Record<string, string> 零类型安全
  <less-layout head-extras='<title>...</title>'> 字符串拼接
  export default island('my-widget', MyWidget) 函数调用

After v0.25.0
  lessPipeline({ phases, routes, i18n, output }) 单一配置入口
  RouteParams['/blog/[slug]'] 编译期类型推导
  static head = { title, description } 自动注入
  static client = { strategy: 'visible' } 声明式 island
```

## Task Groups

| Group | Task                        | Priority | Nature     | Time |
| ----- | --------------------------- | -------- | ---------- | ---- |
| TG-01 | BuildPipeline 声明式 API    | P0       | 纯重构     | 2d   |
| TG-02 | 路由类型代码生成            | P0       | 纯生成     | 1d   |
| TG-03 | `static head` 元数据        | P1       | 小 feature | 1d   |
| TG-04 | `static client` Island 声明 | P1       | 语法糖     | 0.5d |
| TG-05 | `less()` 标记 @deprecated   | P2       | 文档       | 0.5d |
| TG-06 | 全量回归 + docs             | P2       | 验证       | 1d   |

## Execution Order

```
TG-01 + TG-02 (并行，独立模块)
    ↓
TG-03 (依赖 TG-01，BuildPipeline 需要先完成)
    ↓
TG-04 (独立，语法糖)
    ↓
TG-05 (文档 + 兼容标记)
    ↓
TG-06 (全量 gate)
```

## Step-by-Step

### Step 1: Baseline

```bash
deno task fmt:check && deno task lint && deno task typecheck && deno task graph:check && deno task test
```

记录基线：`git status -sb`、最新 commit hash、test 通过数、graph 状态。

### Step 2: TG-01 BuildPipeline

1. 创建 `packages/adapter-vite/src/build-pipeline.ts`
   - `BuildPipeline` class with constructor accepting `PipelineConfig`
   - `async run(ctx)` 方法内部按 phases 依次调用现有 build 函数
   - 透传用户 esbuild 配置到每个内部 `viteBuild()` 调用
2. 在 `less-plugin.ts` 中导出 `lessPipeline()` 函数
3. 保持 `less()` 函数不变，标记 `@deprecated`
4. 验证：现有项目 `deno task build` 零差异通过

**Acceptance**:

- [ ] `lessPipeline({ routes: { dir: 'app/routes' } })` 可替代 `less({ ... })`
- [ ] 构建产物 bitwise 一致
- [ ] `configFile: false` 的 JSX 配置问题根本解决

### Step 3: TG-02 Route Types

1. 增强 `route-scanner.ts`：扫描 `[param]` 模式，提取 RouteEntry.params
2. 创建类型生成器 `route-type-generator.ts`：产出 `.less/routes.d.ts`
3. 生成内容：
   ```typescript
   declare module 'virtual:less-routes' {
     interface RouteParams {
       '/blog/[slug]': { slug: string };
     }
   }
   ```
4. 验证：`deno task typecheck` 确认 RouteParams 类型可用

**Acceptance**:

- [ ] `.less/routes.d.ts` 在 build 后生成
- [ ] `[param]` 路由有对应类型

### Step 4: TG-03 static head

1. Route scanner 读取 `static head` 声明
2. SSG 渲染阶段注入 `<title>` / `<meta>` 到 HTML `<head>`
3. `less-layout` 的 `head-extras` 属性保留兼容
4. 迁移一两个页面验证

**Acceptance**:

- [ ] `static head = { title: '...' }` 声明的页面 title/meta 正确注入 dist HTML
- [ ] 现有 `head-extras` 页面不受影响

### Step 5: TG-04 static client

1. 添加 `static client` 类型定义到 DsdElement
2. `build-client.ts` 扫描 `static client` 声明，自动注册 island chunk
3. `island()` 函数保留兼容
4. 迁移现有 island demo 验证

**Acceptance**:

- [ ] `static client = { strategy: 'visible' }` 声明的组件正确生成 client chunk
- [ ] `island()` 调用仍可工作

### Step 6: TG-05 less() deprecation

1. 在 `less()` 函数加 `@deprecated` JSDoc，指向 `lessPipeline()`
2. 更新 docs 和示例

### Step 7: TG-06 Full Regression

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task graph:check
deno task test
deno task build
```

## Quality Gates

| Gate | Criteria                                               |
| ---- | ------------------------------------------------------ |
| G1   | `lessPipeline()` 替代三阶段硬编码调用                  |
| G2   | 现有 `less()` 调用仍可工作（兼容）                     |
| G3   | `[param]` 路由在 RouteParams 中有对应类型              |
| G4   | `static head` 声明的页面 title/meta 正确注入 dist HTML |
| G5   | `static client` 声明的 island 正确生成 client chunk    |
| G6   | 全量 gate 通过                                         |
