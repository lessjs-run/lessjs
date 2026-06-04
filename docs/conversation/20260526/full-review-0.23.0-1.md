# ADR-0050 & SOP v0.23.0 综合审查报告

> 审查日期：2026-05-26
> 代码基线：origin/dev commit 37800225
> 审查团队：架构师（高见远）、工程师（寇豆码）、产品经理（许清楚）

---

## TL;DR

v0.23.0 的工作**刚刚启动**，6 个 SOP 共 96 个 checkbox 中仅 34 个完成（35%）。最核心的 `@openelement/protocols` 包已创建并完成 `content`/`i18n` 的迁移，但 `core` 仍依赖 `alien-signals`、`app` 仍导入 `adapter-vite/build-context`、`cem`/`compat-check` 仍是 thin wrapper——这三大阻塞项是 v0.23.0 推进的关键。

---

## 一、ADR-0050 验收标准逐条判定

| #   | Acceptance Criterion                                                                                                 | 判定       | 证据                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1 | ROADMAP.md lists v0.23.x as Layered Package Architecture, v0.24.x as Edge Full-Stack, v0.25.x as Ecosystem Hardening | ✅ PASS    | ROADMAP.md Phase Overview 包含此顺序                                                                                                             |
| AC2 | docs/sop/v0.23.0/ contains 6 SOPs                                                                                    | ✅ PASS    | SOP-001~006 + README.md 均存在                                                                                                                   |
| AC3 | STATUS.md explains the new version order                                                                             | ✅ PASS    | STATUS.md L86-98 列出 v0.23.0 Layered Package Architecture，L98 注明 Edge Full-Stack moves to v0.24                                              |
| AC4 | @openelement/create post-publish smoke runs just-published version                                                        | ✅ PASS    | publish.yml:104 读 CREATE_VERSION，L110 用 `@${CREATE_VERSION}`，非 latest                                                                       |
| AC5 | Future v0.23 code changes start from SOPs                                                                            | ⏳ PENDING | SOP 已就位，代码工作刚开始                                                                                                                       |
| AC6 | Old paths with wrong ownership removed, not bridged                                                                  | ⚠️ PARTIAL | content/i18n 已迁移到 protocols；但 `app` 仍导入 adapter-vite/build-context，core 仍 re-export cem-parser/compatibility/style-sheet 等向后兼容桥 |

**ADR-0050 总体判定：5/6 通过，1 部分通过。AC6 是 v0.23 的核心工作目标。**

---

## 二、SOP v0.23.0 逐 checkbox 完成度

### 汇总统计

| SOP                             | Total  | ✅ DONE | ⚠️ PARTIAL | ❌ NOT DONE | ⏳ PLANNED | 完成率  |
| ------------------------------- | ------ | ------- | ---------- | ----------- | ---------- | ------- |
| SOP-001 Contracts & Protocols   | 18     | 9       | 4          | 2           | 3          | 50%     |
| SOP-002 Core Kernel Boundary    | 14     | 2       | 3          | 6           | 3          | 14%     |
| SOP-003 Runtime & App Facades   | 14     | 4       | 3          | 3           | 4          | 29%     |
| SOP-004 adapter-vite Modularity | 14     | 4       | 4          | 1           | 5          | 29%     |
| SOP-005 Package Graph & Gates   | 19     | 11      | 3          | 2           | 3          | 58%     |
| SOP-006 Docs Governance         | 17     | 4       | 8          | 4           | 1          | 24%     |
| **Total**                       | **96** | **34**  | **25**     | **18**      | **19**     | **35%** |

### 已完成的关键工作

1. **`@openelement/protocols` 包创建完成** — 零依赖，导出 `build-types` + `virtual-ids`
2. **`content`/`i18n` 迁移完成** — 两个包已将 adapter-vite 的导入迁移到 `@openelement/protocols`
3. **包图检查器完成** — `tools/check-package-graph.ts` 实现循环检测、发布顺序、版本统一、未声明依赖检测
4. **post-publish smoke 版本固定完成** — publish.yml 从 create/deno.json 读版本，不用 latest
5. **Windows JSR consumer monitor 存在** — 定期验证 JSR 发布可用性
6. **文档策略检查器存在** — `tools/check-strategic-docs.ts` 在 CI 运行

### 三大阻塞项（必须解决才能推进）

| 阻塞项                                    | 影响 SOP                       | 现状                                                                        | 需要做什么                                                      |
| ----------------------------------------- | ------------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **core 仍导入 alien-signals**             | SOP-002 Step 2                 | `core/src/signals.ts:17` 直接 import alien-signals，core/deno.json 声明依赖 | 将 signal 实现所有权移至 `@openelement/signals`，core 只保留类型检测 |
| **app 仍导入 adapter-vite/build-context** | SOP-001 Step 3, SOP-003 Step 3 | `app/src/index.ts:25,28` 从 adapter-vite 导入                               | 迁移到 `@openelement/protocols`                                      |
| **cem/compat-check 仍是 thin wrapper**    | SOP-002 Step 4                 | 实现仍在 core，两个包只是 re-export                                         | 将实现移入各自包                                                |

---

## 三、文档一致性校准（已修正误判）

基于 `docs/arch/current-architecture.md` 的完整包列表和 changelog v0.22.x.md 的记录，修正之前的误判：

### 非问题项（已排除）

| 之前判定                      | 修正理由                                                                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ❌ 17包 vs 12包矛盾           | ADR-0050 Ownership Map 聚焦 v0.23 需要迁移 ownership 的包；`docs/arch/current-architecture.md` 完整列出 14 包含 protocols/rpc；adapter-lit/react/vanilla 是可选 stub 不在迁移范围 |
| ❌ v0.22 SOP 状态字段未更新   | v0.22.x 工作已完成并发布（changelog 详细记录），SOP 头部 Status 字段是历史文档，非活跃工作指引                                                                                    |
| ❌ @openelement/protocols 未入 ADR | `docs/arch/current-architecture.md` 已完整描述 protocols 角色，ADR-0050 Consections 提到 "A contracts package" 即指此包                                                           |

### 真正需要修复的文档问题

| 优先级 | 问题                                                     | 修复                                                            |
| ------ | -------------------------------------------------------- | --------------------------------------------------------------- |
| P0     | Changelog README.md 索引缺 v0.22.x 条目                  | 添加 `\| 0.22.x \| 2026-05-26 \| [v0.22.x.md](./v0.22.x.md) \|` |
| P1     | ADR-0049 的版本分配被 ADR-0050 覆盖未标注                | 在 ADR-0049 末尾添加修订说明                                    |
| P1     | STATUS.md 标注 v0.22.x IN PROGRESS，但实际已完成         | 更新为 v0.22.x COMPLETED                                        |
| P1     | SOP-005 Depends-on 与 Release Order 执行序列需澄清       | SOP-005 的 Depends-on 应改为依赖 Step 0 PREP                    |
| P2     | signals/README.md 说 "TC39 Signals polyfill" 不准确      | 更新为 "Signal facade over alien-signals"                       |
| P2     | `adapter-vite/deno.json` 仍保留 `./build-context` export | 待 app 迁移后标记为 transitional 或移除                         |

---

## 四、v0.23.0 推进路线建议

按 SOP Release Order + 依赖链，建议的下一步工作顺序：

```
Step 0 PREP（当前部分完成）
  ✅ @openelement/protocols 包已创建
  ✅ content/i18n 迁移完成
  ⬜ 完成 app 的 protocols 迁移（SOP-001 Step 3 残留）

Step 1 SOP-001 剩余工作
  ⬜ Migrate Protocol Types（SignalEngine 等类型统一）
  ⬜ Delete Wrong-Owner Paths（core 的 backward compat bridges）

Step 2 SOP-002 核心攻坚
  ⬜ 将 alien-signals 导入从 core 移至 signals
  ⬜ 将 cem-parser 实现移至 @openelement/cem
  ⬜ 将 compatibility 实现移至 @openelement/compat-check

Step 3 SOP-003 运行时门面
  ⬜ 决定 @openelement/runtime 是否值得创建
  ⬜ 更新 create 模板导入路径

Step 4 SOP-004 适配器模块化
  ⬜ 文档化构建图
  ⬜ 按模块添加聚焦测试

Step 5 SOP-005 消费者门面（大部分已完成）
  ⬜ 添加 Direct Import Map Checker
  ⬜ 本地 workspace consumer build

Step 6 SOP-006 文档治理
  ⬜ 包角色描述更新
  ⬜ ADR/SOP 索引检查自动化
```

**最关键的第一步**：完成 `app` 的 `@openelement/protocols` 迁移（SOP-001 Step 3 残留），这打通了 SOP-001 → SOP-002 的依赖链。

---

## 五、结论

| 维度               | 状态                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| ADR-0050 验收标准  | 5/6 通过，AC6 部分完成                                                      |
| SOP v0.23.0 完成度 | 35%（34/96 checkbox）                                                       |
| 关键阻塞项         | 3 个（core/alien-signals、app/adapter-vite、cem+compat-check thin wrapper） |
| 文档真问题         | 3 个 P0-P1（changelog 索引、ADR-0049 修订、STATUS.md 状态）                 |
| 已完成的核心基础   | protocols 包、content/i18n 迁移、包图检查器、smoke 版本固定                 |

**v0.23.0 正处于起步阶段，基础设施（protocols + gates）已就位，核心架构迁移尚未开始。**
