# LessJS v0.24.1 — JSX + Signal 新组件模型

> Status: COMPLETED\
> Target: 用 JSX+Signal 替换 html tagged template，深化 DSD-first 护城河\
> Governing ADR: ADR-0057 (v2, IMPLEMENTED)

## Mission

v0.24.1 将 LessJS 的声明式模板层从自建 html tagged template DSL 迁移到 JSX+Signal 模型。这不仅是模板语法变更，更是**让 LessJS 的开发体验与其战略定位对齐**——不在 Lit 已赢的赛道（tagged template）上投入资源，而是把差异化精力集中在 DSD 管线和 Signal 响应式这两个真正的护城河上。

完成后：

```
LessJS 组件开发者
  → 用 JSX 编写模板（编译时类型安全 + AI 工具兼容）
  → 用 static props 声明属性（零编译器开关 + 全 runtime 兼容）
  → 用 Signal 驱动更新（细粒度 + 多运行时）
  → 产出 DSD-first SSR 组件（唯一能做到 Web Components + SSR + Signal 三位一体）
```

## Scope Boundary

| Included                                                      | Excluded in v0.24.1                       |
| ------------------------------------------------------------- | ----------------------------------------- |
| jsx-runtime 实现（VNode 创建 + renderToString + renderToDOM） | VDOM diff 引入                            |
| static props 声明式配置替代 @prop() 装饰器                    | bind:value 双向绑定编译宏                 |
| Signal 自动解包（valueOf + 边界声明 + unwrap()）              | Portal / Suspense / Context 抽象          |
| VNode 接口冻结条款                                            | 运行时编译器                              |
| static props TypeScript 类型推导（PropsFrom\<T\>）            | 完整的 JSX 组件函数式写法（v0.25+）       |
| 内部组件迁移到 JSX                                            | html-legacy 子路径移除（v0.28）           |
| html tagged template 完全删除                                 | template.ts 完全删除（v1.0）              |
| deno.json / vite.config.ts JSX 配置                           | ISR handler / KV adapters（v0.24.x 主线） |
| SVG namespace 渲染 + Signal effect 驱动                       | 🔧 v0.24.1 hotfix 追加                   |

## Release Order

| Step | SOP     | Priority | Purpose                                                | Must Finish Before   |
| ---- | ------- | -------- | ------------------------------------------------------ | -------------------- |
| 0    | PREP    | P0       | ADR-0057 确认 + 现状盘点 + 依赖图梳理                  | Any jsx-runtime 代码 |
| 1    | SOP-001 | P0       | jsx-runtime 核心（VNode + renderToString）             | SSR 路径验证         |
| 2    | SOP-002 | P0       | static props + Signal 自动解包                         | 组件迁移             |
| 3    | SOP-003 | P0       | DSD 管线接入 JSX（renderDSD 适配）                     | 内部组件迁移         |
| 4    | SOP-004 | P0       | JSX 事件系统（onClick → addEventListener）             | 内部组件迁移         |
| 5    | SOP-005 | P0       | internal 组件迁移（html → JSX + @prop → static props） | 废弃标记             |
| 6    | SOP-006 | P1       | static props TypeScript 类型推导（PropsFrom\<T\>）     | DX 优化              |
| 7    | SOP-007 | P1       | html tagged template @deprecated + 文档更新            | v0.24.1 closure      |
| 8    | SOP-008 | P0       | 验证 + 回归测试 + Release Gate                         | v0.24.1 发布         |

## Entry Criteria

- v0.23.x Layered Package Architecture 工作完成或明确列出 carry-forward
- ADR-0057 (v2) 状态为 ACCEPTED
- 现有 SOP 门禁全部通过（fmt:check / lint / typecheck / audit / test / build / dsd:check-report / test:e2e）
- 现有内部组件清单已梳理，知道哪些用 `html` + `@prop()`

## Exit Criteria

- jsx-runtime 实现 `jsx()`/`jsxs()`/`jsxDEV()` + `Fragment`，返回纯 JS 对象
- `renderToString(vnode)` 输出与现有 `renderDSD()` 等价的 DSD HTML
- `renderToDOM(vnode)` 创建真实 DOM + 事件绑定
- VNode 接口冻结条款写入代码注释 + ADR
- `static props` 替代 `@prop()`，DsdElement 自动生成 `observedAttributes`
- Signal 自动解包在 JSX `{}` 内生效，边界场景文档化 + `unwrap()` 工具存在
- 所有 `@lessjs/ui` 内部组件迁移到 JSX + static props
- `html` tagged template 标记 `@deprecated`，JSDoc 指向 JSX 路径
- `deno task test` 通过（含新增 jsx-runtime 测试 + 迁移后组件回归测试）
- `deno task dsd:check-report` 通过
- `deno task test:e2e` 通过
- ADR-0057 状态更新为 IMPLEMENTED

## Execution Rules

- **jsx-runtime 先于组件迁移**：先实现 + 测试 runtime，再迁移组件
- **VNode 冻结**：VNode 接口只允许 5 字段（tag/props/children/key/ref），任何新字段需 ADR
- **不引入 VDOM diff**：VNode 是声明式描述，不是运行时树
- **不引入合成事件**：onClick → 原生 addEventListener
- **每步验证**：每个 SOP 完成后运行 `deno task test` + `deno task typecheck`
- **保持 html 路径可用**：在 @deprecated 标记前，html tagged template 必须继续工作
- **不修改 DSD 核心管线**：render-dsd.ts / render-nested.ts 不做结构性变更

## Risk Register

| 风险                        | 可能性 | 影响 | 缓解措施                |
| --------------------------- | ------ | ---- | ----------------------- |
| VNode 逐步膨胀为 VDOM       | 中     | 高   | 接口冻结条款 + 代码审查 |
| static props 类型推导不完整 | 中     | 中   | MVP 用 Signal\<T\> 兜底 |
| Signal 自动解包边界造成困惑 | 低     | 低   | 边界文档 + unwrap()     |
| DSD 管线与 JSX 输出不兼容   | 中     | 高   | SOP-003 专门做路径验证  |
| html → JSX 迁移引入回归     | 中     | 高   | SOP-008 全量回归测试    |

## Documentation Audit — v0.24.1 Post-Implementation

> 审计日期: 2026-05-29 | 对照: 实际代码 (commit 19202d14)

### P0 — 紧急修改（展示已删除的 API / 核心参考文档 STALE）

| # | 文件 | 问题 | 操作 |
|---|------|------|------|
| 1 | `www/app/routes/engine/reference/core.ts` (L338-344) | API 参考页仍在引用 `html()`, `unsafeHTML()`, `TemplateResult` — 这些已删除 | 🔄 替换为 `jsx()`, `jsxs()`, `Fragment`, `renderToString()`, `renderToDOM()`, `VNode` |
| 2 | `docs/reference/core-api-surface.md` | 列 `html()`, `unsafeHTML()` 为 Stable Userland API；整体基于 v0.21.x | 🔄 完全重写为 v0.24.1 JSX API surface |
| 3 | `docs/reference/template-reactive-contract.md` | 整个文档描述已删除的 html tagged template 模型 | ❌ 删除，替换为 `docs/reference/jsx-component-model.md` |

### P1 — 应该更新（示例过时 / 版本标注落后）

| # | 文件 | 问题 | 操作 |
|---|------|------|------|
| 4 | `www/app/routes/guide/getting-started.ts` | 入门示例使用 `render(): string` (仍有效但不展示新模型) | 🔄 增加 JSX 组件示例 + static props 示例 |
| 5 | `www/app/routes/guide/api.ts` | 需检查是否有旧 API 引用 | 🔍 审计后更新 |
| 6 | `www/app/routes/guide/islands.ts` | 需检查 island 声明示例是否过时 | 🔍 审计后更新 |
| 7 | `www/app/routes/guide/configuration.ts` | 缺少 JSX 配置说明 (jsxImportSource, esbuild config) | ➕ 新增 JSX 配置段落 |
| 8 | `docs/arch/current-architecture.md` | 标注 v0.23.x | 🔄 更新到 v0.24.1，加入 JSX+Signal 层 |
| 9 | `docs/design/jsx-deep-integration.md` | 描述旧 html 模型为"前置分析"，非实际实现状态 | 🔄 重写为 v0.24.1 实现后回顾 |
| 10 | `docs/status/STATUS.md` | 版本状态过期 | 🔄 更新到 v0.24.1 |
| 11 | `docs/roadmap/ROADMAP.md` | ADR-0057 状态未更新 | 🔄 标记 ADR-0057 为 IMPLEMENTED |
| 12 | `docs/guide/migrating-from-lit.md` | 可能引用 html 模板 API | 🔍 审计后更新 |

### P2 — 新增文档（v0.24.1 新模型缺参考文档）

| # | 文件 | 内容 | 操作 |
|---|------|------|------|
| 13 | `www/app/routes/guide/jsx-components.md` | JSX 组件编写指南：VNode、renderToString、renderToDOM、事件绑定 | ➕ 新建 |
| 14 | `www/app/routes/guide/static-props.md` | static props 完整指南：类型声明、observedAttributes、PropsFrom\<T\> | ➕ 新建 |
| 15 | `www/app/routes/guide/signal-reactivity.md` | Signal + JSX 响应式开发：effect()、自动解包、unwrap() | ➕ 新建 |
| 16 | `www/app/routes/guide/migration-v0.24.md` | v0.23 → v0.24 迁移指南：html → JSX、@prop → static props | ➕ 新建 |
| 17 | `docs/reference/jsx-component-model.md` | JSX 组件模型完整参考（替换 template-reactive-contract.md） | ➕ 新建 |
| 18 | `docs/reference/static-props.md` | static props API 参考 | ➕ 新建 |
| 19 | `docs/reference/signal-vnode-effect.md` | effect() 在 VNode 信号追踪中的使用 | ➕ 新建 |

### P3 — 同步 / 清理

| # | 文件 | 问题 | 操作 |
|---|------|------|------|
| 20 | `docs/adr/ADR-0052-*.md` | @prop() 装饰器已被 static props 替代 | 🏷️ 标记 SUPERSEDED by ADR-0057 |
| 21 | `docs/sop/v0.23.x/SOP-009-html-template-strengthening.md` | html 模板已删除 | 🏷️ 标记 OBSOLETE |
| 22 | `docs/sop/v0.21.0/` | 多个 SOP 涉及 html template + @prop | 🏷️ 标记历史归档状态 |
| 23 | `docs/reference/web-component-compatibility.md` | 可能包含 html 模板引用 | 🔍 审计 |
| 24 | `deno.lock` | 版本号已全局更新 | ✅ 已自动同步 (commit 75684552) |

### 统计

| 优先级 | 修改 | 新增 | 删除 | 审计 | 标记 |
|--------|------|------|------|------|------|
| P0 | 2 | 0 | 1 | 0 | 0 |
| P1 | 5 | 1 | 0 | 3 | 0 |
| P2 | 0 | 7 | 0 | 0 | 0 |
| P3 | 0 | 0 | 0 | 1 | 3 |
| **合计** | **7** | **8** | **1** | **4** | **3** |

## Related

- ADR-0057: JSX + Signal 新组件模型（governing decision）
- ADR-0039: DsdElement Signals & Reactive
- ADR-0037: DSD-First Strategic Boundary
- ADR-0052: @prop() reactive property decorator（被替代）
