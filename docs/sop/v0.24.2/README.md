# SOP v0.24.1: 删除旧组件模型，全量迁移到新模型

> **目标版本**: v0.24.1 | **状态**: IN_PROGRESS
> **前置**: ADR-0057 (IMPLEMENTED), SOP v0.24.1 (COMPLETED)
> **辩论**: docs/conversation/20260528/v0242-remove-old-component-model.md

---

## Step 1: 迁移 packages/ui/ 组件到新模型

**文件**: `packages/ui/src/less-*.ts`

- 将所有 `html`...`` 改写成 JSX
- 将所有 `@prop()` 改为 `static props = { ... }`
- 将所有 `classMap()`/`when()`/`choose()`/`repeat()` 改为 JS 表达式
- 文件扩展名改为 `.tsx`

**验证**: `deno task test:ui`

## Step 2: 迁移 www/ 组件到新模型

**目录**: `www/app/islands/`, `www/app/routes/`

- 将所有 html tagged template 改写成 JSX
- 静态页面 .ts → .tsx
- Island 组件 .ts → .tsx

**验证**: `deno task build:www` + `deno task dev`

## Step 3: 删除旧 API 导出

**文件**: `packages/core/src/index.ts`

删除以下导出：

- `html`, `classMap`, `when`, `choose`, `repeat`, `ref`, `unsafeHTML`
- `renderTemplateToString`, `collectRuntimeTemplateBindings`, `applyRuntimeTemplateBindings`
- `TemplateResult`, `isTemplateResult`
- `@prop()` 装饰器及相关类型（ClassMapValue, UnsafeHtmlValue, RefDirective 等）
- `AttrValue`, `ContentValue`, `EventValue`, `TemplateValue`（仅模板使用）
- `RuntimeEventBinding`, `RuntimePropertyBinding`, `RuntimeTemplateBindings`
- `SignalLike`（如果仅模板使用）→ 保留，jsx-runtime 和 signals 也用它
- `isSignalLike` → 保留

保留导出：

- `DsdElement`, `renderDSD`, `renderToHtml`（如果存在）
- `VNode`, `isVNode`
- `jsx`, `jsxs`, `jsxDEV`, `Fragment`
- `renderToString`, `renderToDOM`
- `static props` runtime: `PropDecl`, `PropType`, `PropsFrom`, `initializeStaticProps`, `disposeStaticProps`
- `createPropSignal`, `prop` 相关内部函数
- `signal`, `computed`, `effect`, `isSignalLike`, `SignalLike`
- `StyleSheet`
- `escapeHtml`, `escapeAttr`（jsx-render-string 复用的 escape 函数）
- 所有错误类型 (LessError, RenderError 等)

## Step 4: 清理 template.ts

**文件**: `packages/core/src/template.ts`

- 删除不再导出的函数体，保留注释
- 或者将整个文件重命名为 `template-legacy.ts`

如果 `renderTemplateToString` 没有被 jsx-render-string 内部依赖，直接删除整个函数体。

## Step 5: 清理 prop.ts

**文件**: `packages/core/src/prop.ts`

- 删除 `@prop()` 装饰器实现、decorator 相关类型
- 保留 `createPropSignal` 和 `static props` runtime

## Step 6: 更新 deno.json

**文件**: `packages/core/deno.json`

- 移除 `experimentalDecorators: true`（如果新模型不再需要）
- 保留 `jsx: "react-jsx"`, `jsxImportSource: "@lessjs/core"`

## Step 7: 批量版本更新

- 所有包 `deno.json` version: `0.24.1` → `0.24.1`
- 跨包依赖引用 `^0.24.1` → `^0.24.1`

## Step 8: 全量测试 + lint + fmt

```bash
deno task test        # 全量测试
deno fmt              # 格式化
deno lint             # lint
deno task build:www   # 验证 www 构建
```

## Step 9: 写 changelog 和 release note

- `CHANGELOG.md` 新增 v0.24.1 条目
- `docs/release/0.24.1.md` release note

## Step 10: Commit + Push

```bash
git add -A
git commit -m "v0.24.1: remove old component model, full JSX+Signal migration"
git push origin dev
```

---

## 验收标准

- [ ] `deno task test` 全部通过
- [ ] `deno fmt --check` 无变更
- [ ] `deno lint` 零错误
- [ ] `deno task build:www` 成功，产出 DSD HTML
- [ ] `deno task dev` 本地预览正常
- [ ] 无 `html`...`` 残留调用
- [ ] 无 `@prop()` 残留调用
- [ ] 无 `classMap`/`when`/`choose`/`repeat` 残留调用
