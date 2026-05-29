# LessJS v0.25.0 — Declarative Architecture, Type-Safe Routes, API Naming Convention

> **Status**: PLANNED\
> **Target version**: v0.25.0\
> **Release theme**: 声明式构建管线 + 类型安全路由 + API 命名统一（贴近 Web Platform）\
> **Depends on**: v0.24.3 (consolidation complete, all gates green)\
> **See also**: `docs/conversation/20260629/v0.25.0-0.26.0-declarative-reactive-roadmap.md`\
> **See also**: `docs/conversation/20260629/api-naming-convention-web-platform.md`

## Mission

v0.25.0 是 DX 升级版本：消除最大架构债（脚本式构建），引入类型安全，统一 API 命名。

```text
Before v0.25.0
  三阶段硬编码 build.ts / build-client.ts / build-ssg.ts
  _getRouteParams() → Record<string, string> 零类型安全
  island() / lessBind() / getSSRProps() / renderDSD() 命名混乱

After v0.25.0
  lessPipeline({ phases, routes, i18n, output }) 声明式配置
  RouteParams['/blog/[slug]'] 编译期类型推导
  defineIsland() / bindEvents() / getSsrProps() / renderDsd() 统一命名
```

## Active SOPs

| SOP     | Title                                | Priority | Status  |
| ------- | ------------------------------------ | -------- | ------- |
| SOP-001 | API Naming Convention — Web Platform | P0       | PLANNED |

## Task Groups

| Group | Priority | Name                      | Outcome                                                               |
| ----- | -------- | ------------------------- | --------------------------------------------------------------------- |
| TG-01 | P0       | BuildPipeline API         | `lessPipeline()` 替代三阶段硬编码                                     |
| TG-02 | P0       | Route Type Generation     | `[param]` 路由有类型推导                                              |
| TG-03 | P0       | API Naming Convention     | `defineIsland()/bindEvents()/getSsrProps()/renderDsd()/renderToDom()` |
| TG-04 | P1       | static head metadata      | 页面 title/meta 自动注入                                              |
| TG-05 | P1       | static client declaration | `static client` 替代 `island()` 函数调                                |
| TG-06 | P1       | Route Scanner Enhancement | scanner 输出适配类型生成                                              |
| TG-07 | P2       | Entry Renderer Adaptation | 适配声明式配置                                                        |
| TG-08 | P2       | Full Regression Gates     | 全量 gate 通过                                                        |

## Entry Criteria

- [ ] v0.24.3 所有 SOP 完成，所有 gate 绿色
- [ ] ADR-0058 (TemplateResult removal) 已 IMPLEMENTED

## Execution Rules

1. **TG-03 (命名统一) 最先做** — 纯 rename，不影响逻辑，为后续 task 提供干净基础
2. **TG-01 + TG-02 可并行** — 都涉及构建系统但独立
3. **`less()` 保持兼容** — `lessPipeline()` 是新增方式
4. **不新增 runtime 依赖** — 所有改动在构建时或命名层
