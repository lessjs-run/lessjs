# LessJS v0.25.0 — Declarative DX + Full Architecture Debt Consolidation

> Status: PLANNED | 14 Task Groups | 14 SOP Files\
> See each `SOP-###.md` for detailed step-by-step instructions.

## Task Groups

| SOP     | Task                        | Priority |
| ------- | --------------------------- | -------- |
| SOP-001 | BuildPipeline 声明式 API    | P0       |
| SOP-002 | 路由类型代码生成            | P0       |
| SOP-003 | `static head` 元数据        | P1       |
| SOP-004 | `static client` Island 声明 | P1       |
| SOP-005 | SignalContext (DOM-tree)    | P2*      |
| SOP-006 | CSS token 注入收敛          | P1       |
| SOP-007 | route-scanner 正则 → AST    | P1       |
| SOP-008 | `as any` 类型硬化           | P1       |
| SOP-009 | 测试路径统一                | P2       |
| SOP-010 | `less()` → @deprecated      | P2       |
| SOP-011 | island.test.ts 旧名修复     | P2       |
| SOP-012 | `_dsdHydrated` 双路径合并   | P1       |
| SOP-013 | 31 页面字符串 → JSX 迁移    | P1       |
| SOP-014 | 全量回归 + docs             | P2       |

> *P2 conditional: requires `computed()` ≥1 real-world use.

## Audit

Comprehensive 2026-05-29 architecture debt scan: 30 dimensions, 15 findings, all addressed.
