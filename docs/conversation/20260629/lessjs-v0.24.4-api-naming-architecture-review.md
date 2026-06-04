# LessJS v0.24.4 API 命名与架构/市场总览评估

> 日期: 2026-05-29\
> 基线: v0.24.3 consolidation 已完成（假定所有 SOP exit criteria 通过）\
> 关联: `docs/conversation/20260629/api-naming-convention-web-platform.md`, `docs/sop/v0.24.4/SOP-001-api-naming-convention.md`

## 结论摘要

- **命名方向正确**：贴近 Web Platform（verbNoun、PascalCase acronym、无品牌前缀）能够强化“DSD-first + 原生”定位。需严格控制兼容期，避免“新名 + 旧模型”并存。
- **架构现状**：v0.24.3 已完成 JSX+Signal 收敛，但 renderer parity/Signal unwrap/SVG/事件路径需要直接测试（已在 v0.24.3 SOP 中列出）。在此基础上做命名统一风险可控。
- **API 设计**：核心 API 面应保持小而清晰；命名统一是“语义对齐”，不应引入新抽象。兼容别名应在一个小版本后移除并在 release note 说明。
- **技术选型**：继续保持 DSD-first + 原生 Web Components + Signals（轻量）。不引入 GraphQL 客户端、复杂状态管理或 VDOM diff。
- **市场/护城河**：LessJS 的护城河在于 DSD SSR、零/低 JS 首屏、原生组件模型。命名统一是品牌清理，能减少“框架私货”印象，但真正的护城河仍是 DSD 能力与 SSR/SSG 管线。
- **代码质量**：需用 gates 保障（fmt/lint/typecheck/test/build/dsd:check-report/docs:check-current）。命名重构后必须跑全套 gates，避免大小写/别名遗漏。

## 架构与 API 设计评估

- **核心层 (@openelement/core / runtime)**：
  - 保持最小表面：`defineIsland`, `bindEvents`, `renderToDom/String`, `signal/computed/effect`, `DsdElement`, `static props`。
  - 删除 legacy 模型后，命名统一不会再触碰旧模板路径。
  - 兼容别名策略：仅一版，@deprecated 注释，下一版移除。

- **构建/发布层**：
  - 命名统一不应破坏 build graph 或 publish 顺序。确保 `deno.json` 任务、GitHub workflow 不需改名即可通过。

- **文档与网站**：
  - 所有当前 docs/README/website 示例应同步到新命名。迁移指南可保留旧名作为“历史/迁移前”示例，需明确标记。

## 技术选型与市场定位

- **继续坚持**：DSD-first SSR/SSG、原生事件、原生 DOM API、Signals 轻量响应式。
- **不做**：品牌前缀 API、GraphQL 内置客户端、跨组件 SignalContext、VDOM diff、重型状态管理。
- **市场信息**：差异点在于 Web Components + DSD SSR + Signals；命名统一能强化“原生/平台友好”印象，降低学习成本。

## 风险与缓解

- **风险：兼容期拖延** → 设置明确移除版本（建议：v0.25.0 保留别名，v0.26.0 移除）。
- **风险：脚本替换误伤** → Windows 环境避免 GNU sed，用 `rg` + 编辑器/脚本，分批提交。
- **风险：API surface 回退** → 在 CI 添加 API surface test 或 `docs:check-current` 阻止旧名重新渗透。

## 行动清单（执行按 SOP）

1. 确认前置：v0.24.3 全部 gates 通过，legacy 已移除。
2. 按 `docs/sop/v0.24.4/SOP-001-api-naming-convention.md` 逐步执行：
   - Step1: `island` → `defineIsland`（兼容别名一版）。
   - Step2: `lessBind` → `bindEvents`（兼容别名一版）。
   - Step3: acronym 统一（`getSsrProps`/`renderDsd`/`renderToDom` 等）。
   - Step4: 类型名检查。
   - Step5: 文档/发布说明同步。
   - Step6: 全量 gates。
3. 发布说明：注明新旧命名、兼容期、移除时点。
4. 后续版本（建议 v0.26.0）：移除兼容别名，清理剩余旧名搜索。

## 需要的工具/检查

- `rg` 扫描旧名：`island(`、`lessBind`、`renderDSD`, `renderToDOM`, `getSSRProps`。
- 全套 gates：`fmt:check`, `lint`, `typecheck`, `test`, `build`, `dsd:check-report`, `docs:check-current`。
- 可选：API surface snapshot 脚本，确保 re-export 只含新名。

## 附：命名改动范围估计（来自前置分析）

| 函数                | 估计调用量 | 备注             |
| ------------------- | ---------- | ---------------- |
| `island()`          | ~15        | 全部 island 文件 |
| `lessBind()`        | ~3         | 机械替换         |
| `getSSRProps()`     | ~5         | 机械替换         |
| `renderDSD()`       | ~20        | 机械替换         |
| `renderDSDStream()` | ~5         | 机械替换         |
| `renderToDOM()`     | ~30        | 机械替换         |

以上估计用于排期，实际以 `rg` 结果为准。
