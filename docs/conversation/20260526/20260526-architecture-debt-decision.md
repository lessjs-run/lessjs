# LessJS 2026-05-26 架构债务优先裁决

> 日期: 2026-05-26\
> 输入文档:
> `20260526-full-review.md`,
> `20260526-tech-stack-review.md`,
> `20260526-signals-decision.md`,
> `20260526-reification-audit.md`,
> `20260526-consumer-deno-json-bloat.md`

## 结论

v0.22 不再优先推进 Edge Full-Stack 功能线。当前更重要的问题是架构债务、包边界漂移、消费者配置泄露、构建管线耦合、测试门禁感知不足，以及文档路线和代码现实之间的同步风险。

LessJS 的下一阶段必须先把框架内部现金流整理干净: 清晰的包边界、可解释的消费者 API、稳定的 release gate、低耦合的 adapter pipeline、可持续的 runtime dependency strategy。ISR/KV/Showcase 仍然重要，但必须排在架构清偿之后。

## 裁决表

| 提议                                                          | 裁决                             | 理由                                                                                                                     |
| ------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| consumer `deno.json` 从 18+ 条 imports 降到面向用户的最小入口 | 采纳为 P0                        | 这是真实 DX 和架构边界问题。消费者不应承担 `parse5`、`entities`、`hono`、internal subpath 的解析责任。                   |
| `@openelement/signals` 替换为 alien-signals                        | 采纳为 P1 实验，不直接删除公开包 | 方向合理，但公开包、README、www、publish workflow、create 模板仍依赖 `@openelement/signals`。应先保留 facade，再替换 engine。 |
| DsdElement 全量交给 alien `effect()` 调度                     | 降级为 P1/P2                     | 当前 `DsdElement` 还承担 runtime binding、`data-less-b` patch、初次渲染和断开清理。不能按 5 行伪代码直接改。             |
| `style-sheet` 提取真正完成                                    | 采纳为 P0                        | `packages/core/src/style-sheet.ts` 和 `packages/style-sheet/src/style-sheet.ts` 内容重复，当前拆包不够真实。             |
| `adapter-vite/src/index.ts` 拆分                              | 采纳为 P0                        | 单文件超过 800 行，混合插件入口、head injection、subpath resolver、optional stubs，已经影响可维护性。                    |
| `build-types.ts` / `virtual-ids.ts` 从 core 移出              | 采纳为 P0                        | core 应保持 runtime/kernel 边界，不应承载 adapter build-time 类型。                                                      |
| Hub/CEM 类型统一                                              | 采纳为 P1                        | `hub/scanner.ts` 自定义 CEM declaration 类型，和 core CEM 类型重复。                                                     |
| schema/manifest 校验改 Valibot                                | 采纳为 P1 实验                   | 可减少手写校验，但不能丢失 LessJS 专用诊断、错误码、strict gate 语义和 CLI 输出稳定性。                                  |
| 新增 10 个 UI 组件进入 v0.22                                  | 延后                             | 当前不是扩大 UI 面的时候，先清理包边界、样式抽象、测试和文档。                                                           |
| `getDb()` 或数据库抽象预留                                    | 拒绝进入路线图                   | 与 v0.22 边界冲突。LessJS 不应在架构未干净前增加空抽象。                                                                 |
| 覆盖率报告、consumer monitor、Playwright trace、CI cache 回退 | 采纳为 P0/P1                     | 这些是质量感知基础设施，不是功能膨胀。                                                                                   |

## 新路线

### v0.22.x: Architecture Integrity

目标: 偿还工程与架构债务，让当前 v0.21.x 结果成为可持续的工程基础。

必须完成:

- 消费者 import surface 最小化，内部依赖不泄露到普通项目。
- `@openelement/core` 保持 runtime/kernel 边界，build-only 类型和 virtual IDs 移出。
- `@openelement/style-sheet`、`@openelement/cem`、`@openelement/compat-check` 不只是 thin wrapper。
- `adapter-vite` 拆分为可测试的插件、resolver、head injection、SSG phase 模块。
- `@openelement/signals` 形成清晰 facade/engine 分层，不把底层实现当成用户 API。
- Hub/CEM/schema 校验统一，禁止重复定义和 `null!` placeholder。
- CI 产出可读覆盖率、consumer E2E、trace、cache fallback 和 docs consistency gate。

### v0.23.x: Edge Full-Stack Resume

只有 v0.22 退出标准完成后，才恢复 ISR handler、KV adapters、Showcase、deployment guide。

### v0.24.x: Ecosystem Hardening

Hub 真实包数量、compatibility badges、submission trust policy、component browser 的可维护性在这一阶段推进。

### v1.0: Stable Engine

冻结 `DsdElement`、`renderDSD()`、adapter protocol、manifest/schema、`dsd-report.json`、`less add`、client-only fallback。

## 非目标

- 不用“架构清理”包装大规模功能扩张。
- 不在 v0.22 引入 ORM、auth、database、generic Node server。
- 不把 alien-signals、Valibot 等第三方库替换当成目的；目的仍是降低维护风险和边界泄漏。
- 不删除公开包或公开 import path，除非有明确的 deprecation window 和 generated-project 验证。

## 进入 ADR/SOP

本裁决进入:

- ADR-0049: Architecture Debt First Roadmap Reset
- `docs/sop/v0.22.0/`: Architecture Integrity SOPs

后续实现必须先更新文档、ADR、SOP，再进入代码改动和验证。
