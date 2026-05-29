# SOP-007: www/ Cleanup — Old API Removal + CSS Extraction

> **Priority**: P1 | **预估**: 6h | **依赖**: SOP-006

## Step 1: 删除迁移文档 (0.5h)

框架已稳定，不再需要展示旧 API。删除：

- `www/app/routes/guide/migration-v0.24.tsx`
- `www/app/routes/zh/guide/migration-v0.24.tsx`

## Step 2: 清理文档中的旧 API 引用 (2h)

从以下文件中移除旧 API 示例（`html\`\```, `@prop()`, `classMap`, `when`, `choose`, `repeat`, `TemplateResult`, `LitElement`, `island()`, `lessBind()`, `renderDSD()`, `renderToDOM()`, `getSSRProps()`, `_dsdHydrated`, `__lessBindDone`）：

- `guide/jsx-components.tsx` — 移除旧 html 模板对比
- `guide/static-props.tsx` — 移除 @prop() 示例
- `guide/deployment.tsx` — 移除旧 API 引用
- `zh/guide/jsx-components.tsx` — 同上
- `zh/guide/static-props.tsx` — 同上
- `zh/guide/signal-reactivity.tsx` — 同上
- `engine/reference/core.ts` — 移除旧 API 条目
- `engine/architecture.ts` — 移除旧 API 架构描述
- `architecture/index.ts` — 移除旧 API
- `engine/islands-deep.tsx` — 移除 _dsdHydrated 引用
- `engine/design-system.tsx` — 移除旧 API

## Step 3: CSS 提取 (2h)

从 render() 中提取内联 style 属性到 StyleSheet：

- 创建组件的 `static styles = [...]`
- 替换所有 `style='...'` 为 CSS class

## Step 4: .ts 文件审查 (1.5h)

34 个 .ts 路由文件 — 确认是否需要改为 .tsx。
当前返回 string 模板是有效的，但如果有 JSX 元素应改为 .tsx。

## Step 5: 验证 (0.5h)

```bash
deno fmt && deno lint && deno task typecheck
deno task build:docs
```
