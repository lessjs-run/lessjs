# LessJS v0.24.1 — JSX + Signal 新组件模型

> Status: PLANNED\
> Target: 用 JSX+Signal 替换 html tagged template，深化 DSD-first 护城河\
> Governing ADR: ADR-0057 (v2)

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

| Included                                                    | Excluded in v0.24.1                        |
| ----------------------------------------------------------- | ------------------------------------------- |
| jsx-runtime 实现（VNode 创建 + renderToString + renderToDOM） | VDOM diff 引入                              |
| static props 声明式配置替代 @prop() 装饰器                    | bind:value 双向绑定编译宏                    |
| Signal 自动解包（valueOf + 边界声明 + unwrap()）             | Portal / Suspense / Context 抽象            |
| VNode 接口冻结条款                                            | 运行时编译器                                |
| static props TypeScript 类型推导（PropsFrom\<T\>）             | 完整的 JSX 组件函数式写法（v0.25+）          |
| 内部组件迁移到 JSX                                            | html-legacy 子路径移除（v0.28）             |
| html tagged template 标记 @deprecated                         | template.ts 完全删除（v1.0）                |
| deno.json / vite.config.ts JSX 配置                           | ISR handler / KV adapters（v0.24.x 主线）    |

## Release Order

| Step | SOP       | Priority | Purpose                                       | Must Finish Before             |
| ---- | --------- | -------- | --------------------------------------------- | ------------------------------ |
| 0    | PREP      | P0       | ADR-0057 确认 + 现状盘点 + 依赖图梳理           | Any jsx-runtime 代码           |
| 1    | SOP-001   | P0       | jsx-runtime 核心（VNode + renderToString）      | SSR 路径验证                   |
| 2    | SOP-002   | P0       | static props + Signal 自动解包                   | 组件迁移                       |
| 3    | SOP-003   | P0       | DSD 管线接入 JSX（renderDSD 适配）               | 内部组件迁移                   |
| 4    | SOP-004   | P0       | JSX 事件系统（onClick → addEventListener）       | 内部组件迁移                   |
| 5    | SOP-005   | P0       | internal 组件迁移（html → JSX + @prop → static props） | 废弃标记                     |
| 6    | SOP-006   | P1       | static props TypeScript 类型推导（PropsFrom\<T\>）  | DX 优化                       |
| 7    | SOP-007   | P1       | html tagged template @deprecated + 文档更新       | v0.24.1 closure               |
| 8    | SOP-008   | P0       | 验证 + 回归测试 + Release Gate                   | v0.24.1 发布                   |

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

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| VNode 逐步膨胀为 VDOM | 中 | 高 | 接口冻结条款 + 代码审查 |
| static props 类型推导不完整 | 中 | 中 | MVP 用 Signal\<T\> 兜底 |
| Signal 自动解包边界造成困惑 | 低 | 低 | 边界文档 + unwrap() |
| DSD 管线与 JSX 输出不兼容 | 中 | 高 | SOP-003 专门做路径验证 |
| html → JSX 迁移引入回归 | 中 | 高 | SOP-008 全量回归测试 |

## Related

- ADR-0057: JSX + Signal 新组件模型（governing decision）
- ADR-0039: DsdElement Signals & Reactive
- ADR-0037: DSD-First Strategic Boundary
- ADR-0052: @prop() reactive property decorator（被替代）
