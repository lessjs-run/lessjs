# Conversation: v0.24.1 — 删除旧组件模型，全量迁移到新模型

> 2026-05-28 | 正方 vs 反方自我辩论

---

## 议题

**是否应该在 v0.24.1 彻底删除旧的 html tagged template 组件模型（包括 `html`、`classMap`、`when`、`choose`、`repeat`、`ref`、`unsafeHTML`、`@prop()`），只保留新的 JSX + `static props` + Signal 模型？**

---

## 反方：不应该现在删

### 1. 时间太短

v0.24.1 刚实现新模型不到一天。没有真实用户反馈，没有社区试用期，没有 bug 报告。现在就删旧模型意味着一旦新模型有致命缺陷（DSD 渲染边缘 case、内存泄漏、Signal 解包的边界行为），用户没有任何回退路径。

### 2. 生态不成熟

LessJS 的 www/ 站点、文档示例、create 脚手架模板——全部基于旧的 html tagged template。一次性迁移所有代码风险极高。如果迁移过程中引入 bug，没有旧路径可以参考对比。

### 3. CI 基础设施

900+ 测试覆盖了大量旧路径的边界行为。删除旧模型意味着需要删除/重写这些测试。但新模型的测试覆盖率还没有达到旧模型同等水平。

### 4. 渐进式废弃是最好的策略

v0.24.1 标记 `@deprecated` 已经是最佳实践——给用户 1-2 个版本的时间迁移，同时收集反馈。直接跳到删除违反了语义化版本的精神（虽然是 0.x 版本，但用户已经依赖这些 API）。

### 5. template.ts 中的 `renderTemplateToString` 仍然被内部使用

`renderTemplateToString` 不仅服务于 html template——它是 TemplateResult → HTML 字符串的通用渲染器。jsx-render-string 是否复用了它？如果删除可能破坏 jsx-render-string 的运行时。

---

## 正方：应该现在删

### 1. 这不是破坏性变更——这是完成迁移

v0.24.1 已经在 npm/JSR 发布了。旧 API 标记 `@deprecated` 会出现在 IDE 警告中。如果 v0.24.1 删除它们，迁移路径是：v0.24.1 的 deprecated warnings → v0.24.1 的 breaking removal。这不是"直接删"，这是"先 deprecated 再删"——标准的 0.x 迁移实践。

### 2. 残留 API 会增加维护负担

保留两套模型意味着：

- 每次修改 `renderDSD()` 需要同时测试 TemplateResult 和 VNode 两条路径
- `template.ts` 的 `parseTemplate()`/`detectBinding()`/指令系统仍然需要维护
- bug 修复需要在两套系统上验证
- 新功能的文档需要写"旧写法 vs 新写法"

这是资源的持续消耗，不是"保险"。

### 3. www/ 站点是内部资产，迁移风险可控

www/ 不是用户代码——是 LessJS 自己的站点。迁移 www/ 是框架团队对自身 API 的 dogfooding。如果迁移过程中发现 VNode/JSX/static props 的设计问题，这是最好的发现时机——在内部代码中修复，而不是等用户报告。

### 4. 测试应该反映当前代码的真实状态

保留旧测试覆盖旧路径，意味着 CI 在验证一个已经废弃的代码路径。如果新模型有 bug，被大量旧测试的通过率掩盖了。删除旧测试可以暴露新模型的真实覆盖率。

### 5. template.ts 中的 `renderTemplateToString` 仅服务于 TemplateResult

jsx-render-string 有自己的 `renderToString(VNode) → string`——它不依赖 `renderTemplateToString`。删除 `renderTemplateToString` 不会破坏新模型。

---

## 辩论裁决

**正方胜。但有一个条件。**

条件：www/ 迁移必须在本次 PR 中完成并通过全部测试，作为对删除决策的自我验证。如果 www/ 迁移过程中发现任何新模型的设计缺陷，暂停删除，回退为"deprecated 但不删"，修复新模型后再推进。

操作顺序：

1. 迁移 packages/ui/src/ 下所有组件到新模型
2. 迁移 www/ 下所有组件到新模型
3. 删除 `html`/`classMap`/`when`/`choose`/`repeat`/`ref`/`unsafeHTML` 导出和实现
4. 删除 `@prop()` 装饰器导出和实现（保留内部 runtime 用于向后兼容读取）
5. 删除 TemplateResult 相关的 renderTemplateToString/parseTemplate/detectBinding
6. 全量测试 → lint → fmt → changelog → push

---

## 执行确认

- **删除范围**：`html`、`classMap`、`when`、`choose`、`repeat`、`ref`、`unsafeHTML`、`@prop()`、`renderTemplateToString`、`parseTemplate`、`detectBinding`、`TemplateResult` 类型、`isTemplateResult`
- **保留范围**：`DsdElement`、`renderDSD`、`render-nested`、`VNode`、`isVNode`、`jsx-runtime`、`renderToString`、`renderToDOM`、`static props` runtime、`createPropSignal`、`signal`、`computed`、`effect`
- **验证标准**：www/ 站点 `deno task dev` 正常运行，所有页面可访问，DSD 渲染正确
