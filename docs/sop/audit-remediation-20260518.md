# SOP: 三份审计报告问题全面修复

> 创建日期：2026-05-18
> 来源：`thefullreview-20260518-01.md` + `lessjs-audit-report.md` + `LessJS-full-stack-framework-audit-2026-05-18.md`
> 执行前提：当前 dev 分支，77 个未提交变更
> 目标：逐一修复三份审计报告中发现的所有事实错误、产品缺陷、CI 缺口和叙事偏差

---

## 问题全景图

三份报告共发现 **33 个问题**，按严重度分布：

| 严重度  | 数量 | 说明                         |
| ------- | ---- | ---------------------------- |
| 🔴 严重 | 11   | 事实错误、产品缺失、构建失败 |
| 🟡 中等 | 13   | 语义误导、内部矛盾、CI 缺口  |
| 🟢 轻微 | 9    | 时效性、遗漏、语义优化       |

按类别分布：

| 类别          | 数量 |
| ------------- | ---- |
| 事实错误/偏差 | 10   |
| 产品/代码缺陷 | 5    |
| CI/工程缺口   | 4    |
| 叙事/语义误导 | 8    |
| 文档遗漏/过时 | 6    |

---

## 执行阶段总览

| 阶段 | 名称                               | 问题覆盖 | 预计时间 |
| ---- | ---------------------------------- | -------- | -------- |
| A    | 事实修正（STATUS.md + ROADMAP.md） | 8 个     | 30 min   |
| B    | Git 卫生（tags、workspace、ADR）   | 4 个     | 45 min   |
| C    | 代码/产品修复                      | 6 个     | 3-4 hr   |
| D    | CI/基础设施补齐                    | 4 个     | 2 hr     |
| E    | 叙事与定位修正                     | 6 个     | 1 hr     |
| F    | 战略路线图调整                     | 5 个     | 1 hr     |

**执行顺序**：A → B → C → D → E → F（严格顺序，后续阶段依赖前序修复）

---

## Phase A：事实修正（STATUS.md + ROADMAP.md）

> 目标：消除文档中的事实错误，让 STATUS.md 和 ROADMAP.md 反映代码现实。

### A-1: 修正 STATUS.md 测试数量

**来源**：thefullreview 问题 #1（🔴严重）
**问题**：STATUS.md 写 "715 passed"，实际为 729

**步骤**：

1. 打开 `docs/status/STATUS.md`
2. 找到 Verification 部分：
   ```
   - `deno task test` — ✅ 715 passed, 0 failed
   ```
3. 改为：
   ```
   - `deno task test` — ✅ 729 passed, 0 failed
   ```
4. 运行 `deno task test` 验证当前实际数量
5. 在测试数量后添加注释：
   ```
   - `deno task test` — ✅ 729 passed, 0 failed (verified 2026-05-18)
   ```

**验证**：`grep "715" docs/status/STATUS.md` 无结果

---

### A-2: 修正 STATUS.md Git Tags 表格

**来源**：thefullreview 问题 #2（🔴严重）、两份报告均遗漏
**问题**：STATUS.md 列出 v0.18.0(`de78fdd`)、v0.17.5(`c71a662`)、v0.18.3 等 tag，但 `git tag -l` 显示这些 tag 不存在

**步骤**：

1. 运行 `git tag -l` 获取真实 tag 列表
2. 对比 STATUS.md 中的 Tags 表格
3. **方案 A**（推荐）：为缺失版本打 tag
   ```bash
   # 找到各版本对应的 commit
   git log --oneline | grep -i "v0.18.0\|0.18.0"
   # 确认后打 tag
   git tag v0.18.0 <commit-hash>
   git tag v0.18.3 <commit-hash>
   git push origin --tags
   ```
4. **方案 B**（如果 commit 无法确认）：移除不存在的 tag 行，保留有真实 tag 的行
5. 更新 Tags 表格，在表头注明 `Last verified: 2026-05-18`
6. 添加验证脚注：
   ```
   > Tag list verified via `git tag -l` on 2026-05-18.
   > Tags not in this list do not exist in the repository.
   ```

**验证**：`git tag -l` 的输出与 STATUS.md Tags 表格完全一致

---

### A-3: 修正 STATUS.md "renderDSD() rendering-timing-agnostic" 声称

**来源**：thefullreview 问题 #3（🔴严重）、thefullreview ROADMAP 问题 #2（🟡中等）、文件A 二/技术审计
**问题**：当前只有 SSG 实现，ISR/SSR 未实现，但文档声称"渲染时机无关"

**步骤**：

1. 打开 `docs/status/STATUS.md`
2. 找到：
   ```
   `renderDSD()` is rendering-timing-agnostic — works at build-time (SSG),
   cache-expiry-time (ISR), or request-time (SSR).
   ```
3. 改为：
   ```
   `renderDSD()` is designed to be rendering-timing-agnostic.
   **Current implementation**: build-time (SSG) only.
   ISR and SSR are planned — see ROADMAP Phase 6/7.
   ```
4. 同样修正 `docs/roadmap/ROADMAP.md` Phase 6 中的措辞：
   ```
   # 原
   `renderDSD()` is rendering-timing-agnostic: build-time (SSG), ISR, or
   request-time (SSR) — same engine, different invocation timing.

   # 改为
   `renderDSD()` is **architecturally** rendering-timing-agnostic:
   the same engine can be invoked at build-time (SSG), cache-expiry-time (ISR),
   or request-time (SSR). **Current implementation**: SSG only.
   ISR and SSR are Phase 6/7 planned work.
   ```

**验证**：`grep -n "rendering-timing-agnostic" docs/status/STATUS.md docs/roadmap/ROADMAP.md` — 所有匹配行都包含 "Current implementation: SSG only" 或 "architecturally" 限定语

---

### A-4: 修正 STATUS.md 全栈框架完成度

**来源**：thefullreview 问题 #4（🟡中等）、文件A 二/技术审计
**问题**：60% 的数字偏高，缺 SSR/ISR/Hydration/DB/Auth

**步骤**：

1. 打开 `docs/status/STATUS.md`
2. 找到 Completion by pillar 表格：
   ```
   | 1. Full-Stack Framework | 60% |
   ```
3. 改为：
   ```
   | 1. Full-Stack Framework | 45% |
   ```
4. 在表格下方添加完成度计算依据：
   ```markdown
   ### Completion Methodology

   | Capability               | Weight   | Status             | Score              |
   | ------------------------ | -------- | ------------------ | ------------------ |
   | Routing (file + dynamic) | 15%      | ✅ Complete        | 15%                |
   | Dev server + HMR         | 10%      | ✅ Complete        | 10%                |
   | Build pipeline           | 10%      | ✅ Complete        | 10%                |
   | API routes (Hono)        | 10%      | ⚠️ Basic           | 5%                 |
   | Hydration strategies     | 15%      | ❌ Binary only     | 3%                 |
   | SSR (request-time)       | 10%      | ❌ Not implemented | 0%                 |
   | ISR                      | 10%      | ❌ Not implemented | 0%                 |
   | DB/Auth                  | 5%       | ❌ Not implemented | 0%                 |
   | Deployment adapters      | 5%       | ⚠️ CF Pages only   | 2%                 |
   | Request context          | 5%       | ❌ Not implemented | 0%                 |
   | Documentation            | 5%       | ⚠️ Partial         | 2%                 |
   | **Total**                | **100%** |                    | **47%** → **~45%** |
   ```
5. 同步调整 Overall 为 ~55%

**验证**：Completion by pillar 表格中 Full-Stack Framework ≤ 50%

---

### A-5: 修正 STATUS.md Branch Status 内部矛盾

**来源**：thefullreview 问题 #5（🟡中等）
**问题**：Branch Status 写 "v0.19.0 Phase 2 active"，但标题写 "Phase 1/2/3 All Done"

**步骤**：

1. 打开 `docs/status/STATUS.md`
2. 找到 Branch Status 表格
3. 将 `origin/dev` 的 Status 改为：
   ```
   v0.19.0 Phase 1/2/3 complete (Component Browser + Real Browser Snapshot)
   ```
4. 确认与页面标题 "Phase 1/2/3 All Done" 不再矛盾

**验证**：Branch Status 中无 "active" 字样（因为 Phase 1/2/3 已完成）

---

### A-6: 修正 ROADMAP.md hub:scan 组件数量

**来源**：thefullreview 问题 #1（🟡中等）
**问题**：ROADMAP 写 "52/53 components render via Playwright"，实际 hub:scan 为 47/48

**步骤**：

1. 运行 `deno task hub:scan` 获取当前实际数字
2. 打开 `docs/roadmap/ROADMAP.md`
3. 找到：
   ```
   52/53 components render via Playwright (was 49/53 with happy-dom)
   ```
4. 改为（使用实际运行结果）：
   ```
   47/48 components render via Playwright (was 49/53 with happy-dom)
   ```
5. 如果数字仍不一致，在括号中注明运行环境差异：
   ```
   47/48 components render via Playwright (may vary by environment;
   see `hub:scan` for current count)
   ```

**验证**：ROADMAP 中的数字 ≤ `deno task hub:scan` 的实际输出

---

### A-7: 修正 STATUS.md v0.19.0 Version Ladder 重复行

**来源**：thefullreview 问题 #8（🟢轻微）
**问题**：v0.19.0 在 Version Ladder 中出现两次，Status 分别为 "Done" 和 "Done (Phase 1)"

**步骤**：

1. 打开 `docs/status/STATUS.md`
2. 找到 Version Ladder 表格中 v0.19.0 的两行
3. 合并为一行：
   ```
   | v0.19.0 | `docs/sop/v0.19.0-platform-hub.md` | **Done** | ... | Hub ingests artifacts, CLI submit, component browser, Playwright snapshots |
   ```
4. 删除重复行

**验证**：`grep "v0.19.0" docs/status/STATUS.md` 在 Version Ladder 中只有一行

---

### A-8: 补充 STATUS.md Known Issues — dsd-report 72 条错误

**来源**：thefullreview 问题 #7（🟢轻微）、文件B 问题 #3
**问题**：72 条 SSR 渲染错误未在 Known Issues 中列出

**步骤**：

1. 打开 `docs/status/STATUS.md`
2. 找到 Known Issues 部分
3. 在现有条目后添加：
   ```
   - `www/dist/dsd-report.json` contains 72 SSR rendering errors from third-party
     components (Shoelace). All errors are from browser-heavy components that
     access DOM APIs (querySelector, layout properties) during SSR. These are
     expected failures — the components are not SSR-admission-approved. See
     Phase 6 SSR admission hardening for remediation.
   ```

**验证**：Known Issues 中提及 dsd-report.json 和 72 errors

---

### Phase A 验收清单

- [ ] `deno task test` 输出的数字与 STATUS.md 一致
- [ ] STATUS.md Tags 表格中的每个 tag 都存在于 `git tag -l`
- [ ] "renderDSD() rendering-timing-agnostic" 所有出现都有 "Current: SSG only" 限定
- [ ] Full-Stack Framework 完成度 ≤ 50%，有计算依据
- [ ] Branch Status 与标题无矛盾
- [ ] ROADMAP hub:scan 数字与实际运行结果一致
- [ ] Version Ladder 中 v0.19.0 只有 1 行
- [ ] Known Issues 包含 dsd-report 72 errors

---

## Phase B：Git 卫生（tags、workspace、ADR）

> 目标：让仓库状态可审计、可复现，消除脏工作区对发布判断的干扰。

### B-1: 补打缺失的 Git Tags

**来源**：thefullreview 第八章问题 #1（🔴严重）、两份报告均未发现
**问题**：v0.18.0、v0.17.5、v0.18.3 的 git tag 不存在，但 STATUS.md 引用了

**步骤**：

1. 列出所有现有 tag：
   ```bash
   git tag -l | sort -V
   ```
2. 找到 v0.17.4 是最新的真实 tag
3. 通过 git log 找到每个版本的终止 commit：
   ```bash
   # 方法1：搜索 commit message 中的版本号
   git log --oneline | grep -i "v0.18\|0.18.0\|0.18.3"

   # 方法2：搜索 deno.json 版本变更
   git log --all --oneline -- deno.json packages/*/deno.json
   ```
4. 为确认的 commit 打 tag：
   ```bash
   git tag -a v0.18.0 <commit> -m "v0.18.0: CEM parser + compatibility tiers"
   git tag -a v0.18.3 <commit> -m "v0.18.3: DOM simulation experiment"
   ```
5. 推送 tags：
   ```bash
   git push origin --tags
   ```
6. 如果某些版本的 commit 无法确定，在 STATUS.md 中标注：
   ```
   > v0.17.5: commit not identifiable, tag not created
   ```

**验证**：STATUS.md Tags 表格中的每个 tag 都能 `git show <tag>` 成功

---

### B-2: 清理工作区 — 提交或暂存 77 个变更

**来源**：thefullreview 第八章问题 #2（🔴严重）、文件B 问题 #3
**问题**：77 个未提交变更，包含删除旧路由和新增路由，处于结构迁移中间态

**步骤**：

1. 查看当前未提交变更的详细列表：
   ```bash
   git status --short
   ```
2. 分类变更：
   ```bash
   # 已修改(modified)文件
   git diff --name-only

   # 已删除(deleted)文件
   git diff --name-only --diff-filter=D

   # 未跟踪(untracked)文件
   git ls-files --others --exclude-standard
   ```
3. **策略 A**（推荐）：按逻辑分组提交
   ```bash
   # 组1：文档更新
   git add docs/ && git commit -m "docs: update STATUS, ROADMAP, strategy per audit"

   # 组2：WWW 路由结构迁移
   git add www/app/routes/ www/app/utils/ && git commit -m "refactor(www): migrate route structure (guide → engine)"

   # 组3：Hub 配置变更
   git add hub-index/ packages/hub/ && git commit -m "feat(hub): update index and config"

   # 组4：其余变更
   git add -A && git commit -m "chore: remaining v0.19.0 changes"
   ```
4. **策略 B**（快速修复）：一次性提交
   ```bash
   git add -A && git commit -m "feat(v0.19.0): Phase 1/2/3 complete — route migration, hub updates, docs"
   ```
5. 确认 `git status --short` 输出为空

**验证**：`git status --short` 无输出

---

### B-3: 将 ADR-0033 加入 Git 跟踪

**来源**：thefullreview 第八章问题 #3（🟡中等）、文件B 问题 #4
**问题**：ADR-0033 文件存在但未被 git 跟踪（untracked），不应视为正式 ADR

**步骤**：

1. 确认 ADR-0033 文件存在且内容完整：
   ```bash
   cat docs/adr/0033-architecture-positioning-ssg-islands.md
   ```
2. 将其加入 git：
   ```bash
   git add docs/adr/0033-architecture-positioning-ssg-islands.md
   ```
3. 提交（可合入 B-2 的文档提交）：
   ```bash
   git commit -m "docs(adr): add ADR-0033 architecture positioning"
   ```

**验证**：`git ls-files docs/adr/0033*` 有输出

---

### B-4: 为 v0.19.0 打 Git Tag

**来源**：thefullreview 第八章问题 #6（🟡中等）
**问题**：STATUS.md 声称 "Last Completed Release: 0.19.0"，但没有 v0.19.0 的 git tag

**步骤**：

1. 确认 B-2（清理工作区）已完成
2. 确认当前 HEAD 就是 v0.19.0 的正确 commit
3. 打 tag：
   ```bash
   git tag -a v0.19.0 -m "v0.19.0: Registry Hub MVP + Component Browser + Playwright Snapshots"
   ```
4. 推送：
   ```bash
   git push origin v0.19.0
   ```

**验证**：`git tag -l v0.19.0` 有输出

---

### Phase B 验收清单

- [ ] STATUS.md 中每个 tag 都可通过 `git show` 访问
- [ ] `git status --short` 输出为空
- [ ] ADR-0033 在 git 中被跟踪
- [ ] v0.19.0 tag 存在

---

## Phase C：代码/产品修复

> 目标：修复影响用户的核心产品缺陷。

### C-1: 补齐 @lessjs/hub 的 JSR Exports

**来源**：thefullreview 问题 #2（🔴严重）、文件B 问题 #6
**问题**：`packages/hub/deno.json` 未导出 `./cli/less-add`、`./cli/validate`、`./cli/check-index`，产品叙事中的 "less add" 命令不可用

**步骤**：

1. 打开 `packages/hub/deno.json`
2. 在 `exports` 中添加缺失条目：
   ```jsonc
   {
     "exports": {
       ".": "./src/index.ts",
       "./schema": "./src/schema.ts",
       "./builder": "./src/builder.ts",
       "./indexer": "./src/indexer.ts",
       "./submitter": "./src/submitter.ts",
       "./snapshot": "./src/snapshot.ts",
       "./cli/hub-submit": "./src/cli/hub-submit.ts",
       // 新增以下三行
       "./cli/less-add": "./src/cli/less-add.ts",
       "./cli/validate": "./src/cli/validate.ts",
       "./cli/check-index": "./src/cli/check-index.ts"
     }
   }
   ```
3. 验证 typecheck 通过：
   ```bash
   deno task typecheck
   ```
4. 如果 `./src/cli/validate.ts` 不存在，先创建一个 re-export 或空壳：
   ```typescript
   // packages/hub/src/cli/validate.ts
   export { validateManifest } from '../schema.ts';
   ```
5. 为 less-add 添加 smoke test：
   ```typescript
   // packages/hub/tests/cli/less-add.test.ts
   import { describe, it } from '@std/testing/bdd';
   import { assertExists } from '@std/assert';

   describe('less-add CLI', () => {
     it('should be importable from JSR subpath', async () => {
       const mod = await import('../src/cli/less-add.ts');
       assertExists(mod);
     });
   });
   ```
6. 运行测试：
   ```bash
   deno task test
   ```

**验证**：`deno task typecheck` 通过 + `deno task test` 通过 + 新 smoke test 存在

---

### C-2: 拆分 hub:check-index 为 check/update 两个命令

**来源**：文件B 问题 #7
**问题**：`hub:check-index` 发现 drift 时会写文件，应拆为只读检查和显式写入

**步骤**：

1. 打开 `packages/hub/src/cli/check-index.ts`
2. 理解当前逻辑：
   - 读取 `hub-index/index.json`
   - 重新生成 newIndexJson
   - 比较两者
   - 如果不同：`Deno.writeTextFileSync(indexPath, newIndexJson)` 并 exit 1
3. 重构为两个子命令：

   **check-index.ts（只读版）**：
   ```typescript
   // 不写文件，只比较
   if (currentJson !== newIndexJson) {
     console.error('❌ Index drift detected. Run `deno task hub:index:update` to sync.');
     Deno.exit(1);
   }
   console.log('✅ Index is up to date.');
   ```

   **新建 update-index.ts**：
   ```typescript
   // 写入文件
   if (currentJson !== newIndexJson) {
     Deno.writeTextFileSync(indexPath, newIndexJson);
     console.log('✅ Index updated.');
   }
   ```

4. 更新 `deno.json` 中的 tasks：
   ```jsonc
   {
     "tasks": {
       "hub:check-index": "deno run --allow-read packages/hub/src/cli/check-index.ts",
       "hub:index:update": "deno run --allow-read --allow-write packages/hub/src/cli/update-index.ts"
     }
   }
   ```
5. CI 中只跑 `hub:check-index`（只读），本地可跑 `hub:index:update`
6. 运行验证：
   ```bash
   deno task hub:check-index  # 应该 up to date 或 drift detected（不写文件）
   ```

**验证**：`deno task hub:check-index` 执行后 `git status` 无新增变更

---

### C-3: 处理 dsd-report.json 72 条 SSR 渲染错误

**来源**：thefullreview 问题 #4（🔴严重）、文件A 问题 #1、文件B 问题 #3
**问题**：构建成功但 72 条错误，全部来自 Shoelace 组件 SSR 失败

**步骤**：

1. **步骤 3a：分析错误分布**
   ```bash
   deno task build
   cat www/dist/dsd-report.json | deno eval "
     const r = JSON.parse(await new Response(Deno.stdin.readable).text());
     // 按 error type 分组
     const grouped = {};
     for (const e of r.errors || []) {
       const key = e.error || 'unknown';
       grouped[key] = (grouped[key] || 0) + 1;
     }
     console.log(JSON.stringify(grouped, null, 2));
   "
   ```

2. **步骤 3b：将 Shoelace SSR 失败组件标记为 client-only**
   - 打开 `packages/adapter-vite/src/entry-descriptor.ts`
   - 找到 `buildSsrAdmissionPlan()` 函数
   - 在 Shoelace 的 package record 或 compatibility classifier 中，
     确保以下组件被标记为 client-only：
     ```
     sl-menu-item, sl-tab, sl-input, sl-select, sl-split-panel,
     sl-textarea, sl-switch, sl-range, sl-dialog, sl-checkbox
     ```
   - 这些组件的共性：在 render() 中调用 `this.host.querySelector()`
   - 修改 compatibility.ts 或 package 的 SSR admission 配置

3. **步骤 3c：为 build 添加 dsd-report 阈值门禁**
   - 打开 `packages/adapter-vite/src/cli/build-ssg.ts`
   - 在构建完成后，读取 dsd-report.json
   - 添加阈值检查：
   ```typescript
   interface DsdReportThreshold {
     maxNonRecoverableErrors: number; // 默认 0
     maxRecoverableErrors: number; // 默认 Infinity
   }

   function checkDsdReport(report: DsdReport, threshold: DsdReportThreshold): void {
     const nonRecoverable = (report.errors || []).filter(
       (e) => e.error?.includes('Failed to instantiate'),
     );
     if (nonRecoverable.length > threshold.maxNonRecoverableErrors) {
       console.error(
         `❌ ${nonRecoverable.length} non-recoverable SSR errors exceed threshold (${threshold.maxNonRecoverableErrors})`,
       );
       Deno.exit(1);
     }
   }
   ```
   - 初始阈值设为宽松值（因为当前有 72 个错误），逐步收紧：
     - v0.19.x: 不 fail（仅记录）
     - v0.20.0: non-recoverable errors ≤ 10
     - v0.21.0: non-recoverable errors = 0

4. **步骤 3d：重新构建并验证错误数下降**
   ```bash
   deno task build
   # 检查 dsd-report.json 中 errors 数量是否下降
   ```

**验证**：`deno task build` 成功 + dsd-report.json 中 errors < 72（Shoelace client-only 标记生效）

---

### C-4: 修复 sl-table hub:scan 超时

**来源**：thefullreview 问题 #1（🟡中等）、thefullreview 1.2 质量门禁
**问题**：`hub:scan` 中 sl-table 组件超时，导致 47/48 而非 48/48

**步骤**：

1. 单独测试 sl-table 快照：
   ```bash
   deno task hub:scan --filter sl-table
   ```
   （如果 CLI 不支持 --filter，手动在代码中添加临时过滤）
2. 分析超时原因：
   - 可能是 esm.sh CDN 响应慢
   - 可能是 sl-table 依赖链过深
   - 可能是 Playwright timeout 设置过短
3. **方案 A**：增加超时时间
   ```typescript
   // packages/hub/src/snapshot-playwright.ts
   const SNAPSHOT_TIMEOUT_MS = 30_000; // 从默认增加到 30s
   ```
4. **方案 B**：将 sl-table 标记为 client-only，跳过 SSR 快照
5. **方案 C**：使用本地 node_modules 替代 esm.sh（长期方案，见 D-1）
6. 应用方案 A 或 B 后重新运行：
   ```bash
   deno task hub:scan
   ```

**验证**：`deno task hub:scan` 结果为 48/48 或 sl-table 有明确的 skip 原因

---

### C-5: Playwright snapshot placeholder 不应标记 success: true

**来源**：文件B 5.5
**问题**：当 Playwright import 失败时，返回 placeholder 且 `success: true`，掩盖真实失败

**步骤**：

1. 打开 `packages/hub/src/snapshot-playwright.ts`
2. 找到 placeholder / fallback 逻辑
3. 修改：
   ```typescript
   // 修改前
   return { html: placeholder, success: true };

   // 修改后
   return {
     html: placeholder,
     success: false,
     error: 'Playwright import failed — snapshot is placeholder, not real render',
   };
   ```
4. 确保调用方能处理 `success: false` 的情况
5. 在 Hub 包详情页中，如果 snapshot 的 success 为 false，显示警告：
   ```
   ⚠️ Snapshot is a placeholder (real browser render unavailable)
   ```

**验证**：`grep "success: true" packages/hub/src/snapshot-playwright.ts` — 所有 `success: true` 都在真实渲染成功时才返回

---

### C-6: 路由扫描器中的文本/正则扫描标记为 TODO

**来源**：文件B 问题 #8
**问题**：route-scanner.ts 对部分 island metadata 使用文本/正则扫描，不够健壮

**步骤**：

1. 打开 `packages/adapter-vite/src/route-scanner.ts`
2. 找到所有正则/文本扫描代码
3. 为每处添加 TODO 注释：
   ```typescript
   // TODO(v0.21): Replace regex-based island metadata scanning with AST parsing
   // or manifest-first approach. Current regex may miss edge cases.
   ```
4. 记录到 ROADMAP.md Cross-Phase Concerns 中：
   ```
   | Route scanner robustness | Regex-based island scanning | AST/manifest-first scanning (v0.21) |
   ```

**验证**：`grep -c "TODO.*route-scanner\|TODO.*regex\|TODO.*AST" packages/adapter-vite/src/route-scanner.ts` ≥ 1

---

### Phase C 验收清单

- [ ] `packages/hub/deno.json` exports 包含 `./cli/less-add`
- [ ] `deno task hub:check-index` 不写文件
- [ ] `deno task hub:index:update` 显式写入
- [ ] dsd-report.json errors < 72（Shoelace SSR 失败组件被正确标记）
- [ ] build 有 dsd-report 阈值检查（哪怕初始值为宽松）
- [ ] sl-table hub:scan 不再超时（或有明确 skip 原因）
- [ ] Playwright placeholder 标记为 `success: false`
- [ ] route-scanner.ts 有 AST 替换的 TODO

---

## Phase D：CI/基础设施补齐

> 目标：让 CI 真正覆盖关键质量门禁，消除 SOP 与 CI 的不一致。

### D-1: CI 添加 hub:scan Job

**来源**：文件B 问题 #5、文件B 12.1
**问题**：`.github/workflows/test.yml` 中 test-hub job 没有安装 Chromium，也没有跑 `hub:scan`

**步骤**：

1. 打开 `.github/workflows/test.yml`
2. 找到 `test-hub` job
3. 添加 Playwright Chromium 安装：
   ```yaml
   test-hub:
     runs-on: ubuntu-latest
     steps:
       - uses: denoland/setup-deno@v2
       - uses: actions/checkout@v4
       - name: Install Playwright Chromium
         run: deno run -A npm:playwright install chromium
       - name: Hub unit tests
         run: deno test packages/hub/
       - name: Hub scan (quick)
         run: deno task hub:scan
         # 注：full snapshot 可在 nightly/weekly 中运行
   ```
4. 考虑拆分 quick scan 和 full snapshot：
   ```yaml
   hub-scan-quick:
     runs-on: ubuntu-latest
     steps:
       - uses: denoland/setup-deno@v2
       - uses: actions/checkout@v4
       - run: deno task hub:scan --skip-snapshots # 只跑 schema 验证

   hub-scan-full:
     runs-on: ubuntu-latest
     if: github.ref == 'refs/heads/main' # nightly 或 main 分支
     steps:
       - uses: denoland/setup-deno@v2
       - uses: actions/checkout@v4
       - run: deno run -A npm:playwright install chromium
       - run: deno task hub:scan # 含 Playwright 快照
   ```

**验证**：CI workflow 文件中存在 hub:scan 相关 step

---

### D-2: Hub Snapshot Hermetic 化（路线图级）

**来源**：文件B 问题 #4、文件B 12.3
**问题**：snapshot-playwright.ts 使用 esm.sh CDN 和硬编码版本，不可复现

**步骤**：

1. 创建 `docs/adr/0034-hermetic-hub-snapshots.md`：
   ```markdown
   # ADR-0034: Hermetic Hub Snapshots

   ## Status: Proposed

   ## Context

   Current Hub snapshot pipeline uses esm.sh CDN and hardcoded versions.
   This is not hermetic — results vary by CDN availability and version drift.

   ## Decision

   Migrate to local node_modules + temporary static server:

   1. Install packages via `npm install` to local node_modules
   2. Start a temporary `deno serve` or `npx serve` for ESM resolution
   3. Point Playwright at local server instead of esm.sh
   4. Record lockfile hash and package versions in snapshot metadata
   5. Fail if resolved version differs from lockfile

   ## Consequences

   - Snapshots become deterministic and reproducible
   - CI no longer depends on esm.sh availability
   - Requires node_modules in CI (already present for Vite builds)
   ```

2. 在 ROADMAP.md Phase 6 中添加 Hermetic Snapshots 为 P1 任务

3. **短期修复**：在现有代码中添加版本/来源日志
   ```typescript
   // packages/hub/src/snapshot-playwright.ts
   const SNAPSHOT_META = {
     shoelaceVersion: '2.x.x', // 从 package.json 读取
     mediaChromeVersion: '1.x.x',
     esmShBase: 'https://esm.sh',
     snapshotDate: new Date().toISOString(),
   };
   // 将 SNAPSHOT_META 写入 snapshot 输出
   ```

**验证**：ADR-0034 存在 + snapshot 输出包含版本/来源元数据

---

### D-3: E2E 测试稳定性修复

**来源**：文件B 问题 #2（🔴严重）、文件B 9.1
**问题**：E2E 4 个 timeout failures（accessibility-performance.spec.ts）

**步骤**：

1. 运行 E2E 确认当前状态：
   ```bash
   deno task test:e2e
   ```
2. 分析 4 个失败用例：
   - `theme toggle keyboard accessibility timeout`
   - `links discernible text timeout`
   - `no critical console errors on homepage timeout`
   - `homepage manifest link timeout`
3. 共性：都是 `waitForLoadState` timeout，可能是：
   - 页面加载慢（资源未就绪）
   - Service Worker 干扰
   - 测试等待策略过于严格
4. **修复策略**：
   ```typescript
   // 在 e2e test 中增加等待时间和重试
   await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

   // 或改用更宽松的等待条件
   await page.waitForSelector(selector, { timeout: 15_000 });
   ```
5. 如果是 dev server 启动慢的问题：
   - 确保 E2E test 的 `beforeAll` 等待 dev server 完全就绪
   - 添加 health check endpoint 或端口探测
6. 重新运行 E2E：
   ```bash
   deno task test:e2e
   ```

**验证**：`deno task test:e2e` 全部通过（0 failed）

---

### D-4: deno fmt panic 记录

**来源**：thefullreview 第八章问题 #5（🟢轻微）
**问题**：`deno fmt --check` 有 Rust panic（但 exit code 0），说明 deno 自身有 bug

**步骤**：

1. 记录 panic 现象：
   ```bash
   deno fmt --check 2>&1 | tee /tmp/fmt-panic.log
   ```
2. 在 STATUS.md Known Issues 中添加：
   ```
   - `deno fmt --check` may emit a Rust panic message but exits with code 0.
     This is a Deno CLI bug, not a project issue. Formatting is verified as correct.
   ```
3. 如果 Deno 版本更新后修复了此问题，移除该条目

**验证**：Known Issues 中提及 deno fmt panic

---

### Phase D 验收清单

- [ ] CI workflow 中 test-hub job 包含 hub:scan step
- [ ] ADR-0034 存在（hermetic snapshots 路线图）
- [ ] `deno task test:e2e` 全部通过
- [ ] Known Issues 中提及 deno fmt panic

---

## Phase E：叙事与定位修正

> 目标：让对外叙事反映代码现实，消除误导性措辞。

### E-1: 修正 @lessjs/ui "DSD-native" 声称

**来源**：文件A 一/定位审计、文件A 问题 #6
**问题**：@lessjs/ui 用 Lit 编写，不是 DSD-native。当前对外宣称"DSD-native"构成误导

**步骤**：

1. 搜索所有包含 "DSD-native" 的文件：
   ```bash
   grep -rn "DSD-native\|DSD native\|dsd-native\|dsd native" --include="*.md" --include="*.ts" .
   ```
2. 对每个出现位置评估：
   - 如果是愿景描述：添加限定语
   - 如果是产品声称：改为准确描述
3. 具体修改示例：

   **README.md / README.en.md**：
   ```
   # 改前
   @lessjs/ui — DSD-native UI Library

   # 改后
   @lessjs/ui — Web Components UI Library (DSD-native rendering planned for v0.21+)
   ```

   **ROADMAP.md**：
   ```
   # 改前（如果存在）
   LessJS UI provides DSD-native components

   # 改后
   LessJS UI currently uses Lit with adapter-lit for SSR rendering.
   DSD-native rendering (pure CSS + CSS Parts, zero Lit runtime) is a planned
   evolution — see v0.21 Vision.
   ```

4. 在 ROADMAP Phase 7 或新增 "LessJS UI Evolution" 中，将 DSD-native UI 作为
   明确的愿景条目，包含技术路径：
   ```
   ### LessJS UI: DSD-native Evolution (v0.21+)

   Goal: evolve @lessjs/ui from Lit-based to DSD-native:
   - Pure CSS + CSS Parts (no Lit runtime)
   - Streaming SSR via renderDSD()
   - Zero-JS initial paint for static UI

   Prerequisite: Hydration strategies (Phase 6) must ship first.
   ```

**验证**：`grep -rn "DSD-native" --include="*.md" .` — 所有匹配行都包含 "planned" / "vision" / "v0.21+" 限定语

---

### E-2: 修正 README 过度市场化措辞

**来源**：文件B 10.2
**问题**：README.en.md 中 "other frameworks cannot match it through engineering optimization" 过强

**步骤**：

1. 打开 `README.en.md`
2. 找到类似 "other frameworks cannot match" 的措辞
3. 替换为更准确的表述：
   ```
   # 改前
   ...other frameworks cannot match it through engineering optimization

   # 改后
   ...LessJS differentiates by making DSD and Web Components the primary
   rendering contract, rather than an optimization layered on top of a
   framework-specific component model.
   ```
4. 检查 README.md（中文版）是否有类似的过度宣称，同步修正

**验证**：`grep -in "cannot match\|no other\|unmatched\|only framework" README*.md` 无结果

---

### E-3: 修正 "全栈框架" 完成度的对外表述

**来源**：文件A 二/技术审计、文件B 3.2
**问题**：全栈框架当前不能称为成熟的全栈框架

**步骤**：

1. 打开 `README.en.md` 和 `README.md`
2. 找到 "Full-Stack Framework" 的定位描述
3. 在描述后添加成熟度标注：
   ```
   ## Full-Stack Framework

   > ⚠️ Early stage: routing, dev server, and API routes are production-ready.
   > SSR/ISR/Hydration strategies are planned — see ROADMAP.
   ```
4. 或使用文件B 建议的一句话定位：
   ```
   LessJS is a Web Components-first Deno framework with a standards-aligned
   DSD rendering engine and an emerging registry/admission pipeline.
   ```

**验证**：README 中 Full-Stack Framework 描述包含成熟度警告

---

### E-4: 修正 renderDSD() 的对外描述

**来源**：文件A 二/技术审计
**问题**：对外描述中 "renderDSD() 本质上是 HTML 模板引擎" 不准确

**步骤**：

1. 搜索所有对 renderDSD() 的描述
2. 统一为准确表述：
   ```
   # 改前（如果存在类似）
   renderDSD() is an HTML template engine

   # 改后
   renderDSD() is a declarative component renderer that outputs pure HTML
   strings with Declarative Shadow DOM. It handles component instantiation,
   recursive nested custom elements, and adapter dispatch — all without
   requiring a DOM environment.
   ```
3. 明确边界：
   ```
   renderDSD() solves "first-paint HTML output", not "component logic".
   All interactive capabilities still require client-side JS hydration.
   ```

**验证**：无文件将 renderDSD() 描述为 "template engine"（在 Mustache/Handlebars 语义下）

---

### E-5: WWW 导航结构决策

**来源**：文件A 六/WWW结构审计、thefullreview 文件A 问题 #4
**问题**：用户提出 5 区方案（/framework/ + /hub/ + /engine/ + /ui/ + /blog/），
文件A 建议 4 区方案（/docs/ + /hub/ + /blog/ + 首页），尚未达成共识

**步骤**：

1. 创建决策记录 `docs/conversation/www-navigation-decision.md`：
   ```markdown
   # WWW Navigation Structure Decision

   ## Option A: 5 Sections (User's Proposal)

   /framework/ + /hub/ + /engine/ + /ui/ + /blog/

   Pros: Matches internal architecture, each pillar gets visibility
   Cons: /framework/ and /engine/ split confuses users, /ui/ too thin

   ## Option B: 4 Sections (Audit Recommendation)

   /docs/ + /hub/ + /blog/ + 首页

   Pros: User-centric organization, aligns with Astro/Next.js
   Cons: Internal architecture not reflected in navigation

   ## Option C: 4 Sections (Hybrid)

   /docs/ + /hub/ + /engine/ + /blog/

   Pros: /engine/ as the differentiated content, /docs/ for framework docs
   Cons: Still splits framework content from engine

   ## Decision: [PENDING]
   ```
2. **不在此 SOP 中强制决定**——这是一个产品决策，需要用户确认
3. 但 **必须** 完成以下底线工作：
   - 当前 77 个变更中已包含 `/engine/` 路由的迁移
   - 确保迁移后的路由不会 404
   - 在 `www/app/routes/` 中添加 redirect 规则

**验证**：决策记录文件存在 + 无 404 路由

---

### E-6: Hub 3 包现状的诚实表述

**来源**：文件A 一/定位审计
**问题**：Hub 作为"主打"但只有 3 个包，对用户构成"就这？"效应

**步骤**：

1. 在 Hub 首页（`www/app/routes/registry/` 相关页面）中添加：
   ```
   > 🚧 LessJS Hub is in early access with 3 indexed packages.
   > We're actively onboarding more Web Components libraries.
   > [Submit your package →](/hub/submit)
   ```
2. 在 README 中对 Hub 的描述改为：
   ```
   ## Registry Hub (Early Access)

   LessJS Hub indexes Web Components packages with SSR compatibility data,
   real browser snapshots, and one-click install.

   Currently indexed: @lessjs/ui, Shoelace, Media Chrome.
   ```
3. 不使用 "platform"、"ecosystem"、"marketplace" 等暗示成熟度的词
4. 使用 "early access"、"emerging"、"growing" 等诚实措辞

**验证**：Hub 页面包含 "early access" 标注 + 包数量为实际数字（3）

---

### Phase E 验收清单

- [ ] 无文件将 @lessjs/ui 描述为 "DSD-native"（不含限定语）
- [ ] README 无 "cannot match" 类过强措辞
- [ ] "Full-Stack Framework" 描述包含成熟度警告
- [ ] renderDSD() 描述为 "declarative component renderer" 而非 "template engine"
- [ ] WWW 导航结构决策记录存在
- [ ] Hub 页面标注 "early access"

---

## Phase F：战略路线图调整

> 目标：基于审计结论，调整路线图优先级和产品策略，但不改变用户的核心愿景。

### F-1: 将 ISR 从 P1 提升为 P0

**来源**：文件A 三/优先级审计
**问题**：只有 SSG 的"全栈框架"是矛盾的，ISR 是从 SSG 到 SSR 的桥梁

**步骤**：

1. 打开 `docs/roadmap/ROADMAP.md`
2. 找到 Phase 6 的 Full-Stack Capabilities 表格
3. 修改 ISR 优先级：
   ```
   # 改前
   | ISR cache layer | P1 | ...

   # 改后
   | ISR cache layer | P0 | ...
   ```
4. 在 Phase 6 描述中添加 ISR 为 P0 的理由：
   ```
   ISR is promoted from P1 to P0 because a "full-stack framework" with only
   build-time rendering is a contradiction. ISR bridges SSG → SSR without
   requiring a persistent server, making it the most impactful change for
   LessJS's credibility as a full-stack framework.
   ```
5. 同步更新 `docs/status/STATUS.md` 的 "Next Planned Version" 描述

**验证**：ROADMAP 中 ISR 优先级为 P0

---

### F-2: Vue Adapter 降级为 P2

**来源**：文件A 三/优先级审计
**问题**：在 Lit + Vanilla 路径未走通前，Vue adapter 过早

**步骤**：

1. 打开 `docs/roadmap/ROADMAP.md`
2. 找到 Phase 7 中的 Vue adapter
3. 修改优先级标注：
   ```
   # 改前（Phase 7 Vision 中隐含为 P1）

   # 改后
   adapter-vue is **P2**: should not be started until Hydration strategies
   and ISR are shipped, and Lit/Vanilla adoption has been validated.
   ```
4. 在 Phase 7 描述中明确：
   ```
   ### adapter-vue (P2 — Deferred)

   Vue adapter should not be pursued until:
   1. Hydration strategies (Phase 6) are shipped and stable
   2. ISR is working in production
   3. Lit + Vanilla path has real-world validation (blog + at least 1 other site)
   ```

**验证**：ROADMAP 中 Vue adapter 标注为 P2 / Deferred

---

### F-3: Supabase 集成降级为 P3

**来源**：文件A 三/优先级审计、文件B 13.3
**问题**：Auth/DB/Supabase 是"毛坯房装智能家居"

**步骤**：

1. 打开 `docs/roadmap/ROADMAP.md`
2. 找到 Phase 6 和 Phase 7 中的 Supabase 相关条目
3. 修改优先级：
   ```
   # Phase 6
   | Supabase integration | P2 | ... |
   →
   | Supabase integration | P3 | Deferred — full-stack groundwork first |

   # Phase 7
   移除 Supabase 的显式条目，改为 "request context" 抽象
   ```
4. 添加降级理由：
   ```
   Supabase is deferred to P3. Full-stack framework credibility comes from
   rendering capabilities (ISR/SSR/Hydration), not from bundling a specific
   DB provider. A generic "request context" abstraction should be built first;
   Supabase can be an example integration later.
   ```

**验证**：Supabase 在 ROADMAP 中标注为 P3 / Deferred

---

### F-4: Hub 生态建设列入 P1（Hydration 完成后）

**来源**：文件A 三/优先级审计
**问题**：Hub 是"主打"但路线图全是引擎侧投入，无 Hub 生态建设计划

**步骤**：

1. 打开 `docs/roadmap/ROADMAP.md`
2. 在 Phase 6 末尾添加 Hub 生态建设任务：
   ```markdown
   ### Hub Ecosystem Building (P1 — after Hydration ships)

   Hub's value depends on package count. After Hydration strategies ship:

   1. **Manual outreach**: Contact 5-10 WC library authors (Shoelace alternatives,
      Material Web, etc.) and offer to index their packages
   2. **Self-service submission**: Ensure `less hub submit` works end-to-end
   3. **Hub onboarding guide**: Write a guide for WC library authors
   4. **Quality badges**: Implement SSR-compatible / client-only / snapshot-verified badges
   5. **Target: 10+ packages by end of Phase 6**

   This is not primarily a technical task — it's community/operational work.
   The technical prerequisite is that Hydration + ISR must work first, so
   authors see a reason to list on Hub ("your component gets SSR/ISR support
   on LessJS").
   ```
3. 在 Cross-Phase Concerns 中更新 Hub 行

**验证**：ROADMAP Phase 6 包含 "Hub Ecosystem Building" 条目

---

### F-5: 添加 "完成度计算方法论" 到 STATUS.md

**来源**：thefullreview 语义精确性警告
**问题**：完成度百分比缺少明确定义，不同人计算方法不同

**步骤**：

1. 打开 `docs/status/STATUS.md`
2. 在 Completion by pillar 表格后添加：
   ```markdown
   ### Completion Methodology

   Completion percentages are calculated as:

   - **Weighted capability model**: Each pillar has N capabilities with weights
   - **Score per capability**: 0% (not started) / 25% (planned) / 50% (partial) / 75% (functional) / 100% (production-ready)
   - **Pillar score**: Σ(capability_weight × capability_score) / Σ(capability_weight)

   See [Completion Breakdown](./completion-breakdown.md) for per-capacity scoring.
   ```
3. 创建 `docs/status/completion-breakdown.md`（可延后到 A-4 的详细表格填入后）

**验证**：STATUS.md 中 Completion 部分包含 Methodology 说明

---

### Phase F 验收清单

- [ ] ROADMAP 中 ISR 为 P0
- [ ] ROADMAP 中 Vue adapter 为 P2 / Deferred
- [ ] ROADMAP 中 Supabase 为 P3 / Deferred
- [ ] ROADMAP Phase 6 包含 Hub Ecosystem Building
- [ ] STATUS.md Completion 包含计算方法论

---

## 附录 A：问题追踪矩阵

三份报告的所有问题及其在本 SOP 中的处理步骤：

| #  | 来源          | 严重度 | 问题摘要                                  | SOP 步骤             | 状态 |
| -- | ------------- | ------ | ----------------------------------------- | -------------------- | ---- |
| 1  | thefullreview | 🔴     | STATUS.md 测试数 715→729                  | A-1                  | ⬜   |
| 2  | thefullreview | 🔴     | STATUS.md git tag 不存在                  | A-2, B-1             | ⬜   |
| 3  | thefullreview | 🔴     | renderDSD() 渲染时机无关声称              | A-3                  | ⬜   |
| 4  | thefullreview | 🟡     | 全栈框架完成度 60% 偏高                   | A-4                  | ⬜   |
| 5  | thefullreview | 🟡     | STATUS.md Phase 2 active 矛盾             | A-5                  | ⬜   |
| 6  | thefullreview | 🟢     | v0.19.0 DOM Simulation 归属               | A-6 参考             | ⬜   |
| 7  | thefullreview | 🟢     | dsd-report 72 错误未入 Known Issues       | A-8                  | ⬜   |
| 8  | thefullreview | 🟢     | v0.19.0 Version Ladder 重复行             | A-7                  | ⬜   |
| 9  | thefullreview | 🟡     | ROADMAP hub:scan 52/53 vs 47/48           | A-6                  | ⬜   |
| 10 | thefullreview | 🟡     | ROADMAP renderDSD() 误导                  | A-3                  | ⬜   |
| 11 | thefullreview | 🟢     | ROADMAP 未提及 dsd-report 对 Phase 6 影响 | A-8 关联             | ⬜   |
| 12 | 文件A         | 🔴     | 未提及 dsd-report 72 错误                 | C-3                  | ⬜   |
| 13 | 文件A         | 🔴     | 未提及 less-add 未导出                    | C-1                  | ⬜   |
| 14 | 文件A         | 🟡     | "全栈框架v0.17后没推进" 不完全准确        | E-3 参考             | ⬜   |
| 15 | 文件A         | 🟡     | /docs/ 建议未评估迁移成本                 | E-5                  | ⬜   |
| 16 | 文件A         | 🟢     | 未提及 git tag 缺失                       | B-1                  | ⬜   |
| 17 | 文件A         | 🟢     | 未提及工作区脏状态                        | B-2                  | ⬜   |
| 18 | 文件A         | 🟢     | SvelteKit/Astro 文档结构不精确            | E-5 参考             | ⬜   |
| 19 | 文件B         | 🔴     | fmt:check 结论已过时                      | D-4（记录）          | ⬜   |
| 20 | 文件B         | 🔴     | e2e 4 failed 可能已过时                   | D-3                  | ⬜   |
| 21 | 文件B         | 🟡     | 77 个未提交变更                           | B-2                  | ⬜   |
| 22 | 文件B         | 🟡     | ADR-0033 未 git 跟踪                      | B-3                  | ⬜   |
| 23 | 文件B         | 🟢     | "护城河等级：早期技术楔子" 语义           | 无需修复（表述准确） | ✅   |
| 24 | 文件B         | 🟢     | 未提及 STATUS.md tag 不存在               | B-1                  | ⬜   |
| 25 | 文件B         | 🟢     | 建议一句话定位用英文                      | E-3                  | ⬜   |
| 26 | thefullreview | 🔴     | git tag 全部不存在                        | B-1                  | ⬜   |
| 27 | thefullreview | 🔴     | 77 个未提交变更                           | B-2                  | ⬜   |
| 28 | thefullreview | 🟡     | ADR-0033 未跟踪                           | B-3                  | ⬜   |
| 29 | thefullreview | 🟡     | hub:scan 结果不一致                       | A-6, C-4             | ⬜   |
| 30 | thefullreview | 🟢     | deno fmt panic                            | D-4                  | ⬜   |
| 31 | thefullreview | 🟡     | v0.19.0 无 git tag                        | B-4                  | ⬜   |
| 32 | 文件B         | P0     | Hub snapshot 非 hermetic                  | D-2                  | ⬜   |
| 33 | 文件B         | P1     | CI 不含 hub:scan                          | D-1                  | ⬜   |

---

## 附录 B：执行顺序依赖图

```
A-1 ──┐
A-2 ──┤
A-3 ──┤
A-4 ──┤
A-5 ──┼──→ Phase A 验收 ──→ B-1 ──┐
A-6 ──┤                          B-2 ──┼──→ Phase B 验收 ──→ C-1 ──┐
A-7 ──┤                          B-3 ──┤                     C-2 ──┤
A-8 ──┘                          B-4 ──┘                     C-3 ──┼──→ Phase C 验收
                                                              C-4 ──┤
                                                              C-5 ──┤
                                                              C-6 ──┘
                                                                       │
                                                                       ▼
                                                              D-1 ──┐
                                                              D-2 ──┼──→ Phase D 验收 ──→ E-1 ──┐
                                                              D-3 ──┤                     E-2 ──┤
                                                              D-4 ──┘                     E-3 ──┼──→ Phase E 验收
                                                                                          E-4 ──┤
                                                                                          E-5 ──┤
                                                                                          E-6 ──┘
                                                                                                  │
                                                                                                  ▼
                                                                                          F-1 ──┐
                                                                                          F-2 ──┤
                                                                                          F-3 ──┼──→ Phase F 验收 ──→ 🎉 完成
                                                                                          F-4 ──┤
                                                                                          F-5 ──┘
```

---

## 附录 C：完成后需用户确认的决策项

以下问题在本 SOP 中无法由执行者独立决定，需要用户确认：

| 决策项                       | 选项                                                                            | 影响               | 紧急度 |
| ---------------------------- | ------------------------------------------------------------------------------- | ------------------ | ------ |
| WWW 导航结构                 | 4区(/docs/+/hub/+/blog/) vs 5区(/framework/+/hub/+/engine/+/ui/+/blog/) vs 混合 | 全站路由迁移方向   | 高     |
| @lessjs/ui DSD-native 时间线 | v0.21 开始 vs 更晚                                                              | 产品叙事和资源分配 | 中     |
| Hub 主打定位                 | 保持"主打" vs 降为"重点" vs "引擎优先"                                          | 资源分配和叙事     | 高     |
| 是否打回退 tag               | 对无法确认 commit 的版本打 tag vs 移除 STATUS 中的引用                          | 仓库历史完整性     | 低     |
| E2E timeout 容忍度           | 必须全部通过 vs 允许 flaky 标记                                                 | 发布门禁严格度     | 中     |

---

_SOP 创建完毕。共 6 个阶段、24 个步骤、33 个问题全覆盖。_
