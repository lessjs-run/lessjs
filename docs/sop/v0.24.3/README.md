# LessJS v0.24.3 — Consolidation, Legacy Removal, and New-State Hardening

> **Status**: PLANNED\
> **Target version**: v0.24.3\
> **Release theme**: 收敛和巩固 v0.24.1 JSX+Signal 成果，彻底移除旧组件模型遗产，进入新状态\
> **Source audits**:
>
> - `docs/conversation/20260629/lessjs-v0.24.1-audit.md`
> - `docs/conversation/20260629/lessjs-v0.24.1-strategy-architecture-report.md`

## Mission

v0.24.3 不是新增功能版本，而是 **architecture consolidation release**。

目标是把 v0.24.1 已经实现的 JSX + Signal Component Model 从“可运行的新模型”推进到“唯一可信的新状态”：

```text
Before v0.24.3
  JSX+Signal 已可用
  legacy html/template/@prop 仍在代码、测试、文档、叙事中残留
  release gate 与 docs truth 不完全一致

After v0.24.3
  JSX+Signal 是唯一推荐与唯一 public component model
  legacy html/template/@prop 从 public API、docs、tests、runtime path 中彻底移除或隔离
  docs/release/README/website/current architecture 叙事一致
  CI/SOP gate 全绿
  renderToDOM/renderToString 的 Signal/SVG/event 路径有直接回归测试
```

## Strategic Boundary

v0.24.3 只做收敛，不做扩张。

| Included                                          | Excluded                           |
| ------------------------------------------------- | ---------------------------------- |
| 删除旧 `html` tagged template public/runtime 路径 | ISR handler / KV adapters          |
| 删除 `@prop()` decorator legacy runtime           | 新 full-stack API                  |
| JSX renderer parity hardening                     | VDOM diff / synthetic event system |
| Signal unwrap 覆盖 attrs/style/SVG attrs          | Portal / Suspense / Context        |
| `renderToDOM` 直接测试                            | 新 UI component expansion          |
| docs truth / README / website current line 收敛   | Hub marketplace 扩张               |
| release gate 恢复全绿                             | 任意第三方 WC 自动 SSR 承诺        |
| publish task/workflow 一致性                      | v1.0 API freeze                    |

## Task Groups

| Group | Priority | Name                          | Outcome                                                              |
| ----- | -------- | ----------------------------- | -------------------------------------------------------------------- |
| TG-01 | P0       | Gate Recovery                 | `fmt:check`、`lint`、`typecheck`、`test`、`build` 全部恢复可信       |
| TG-02 | P0       | Legacy Runtime Removal        | `html` / template helpers / `@prop()` 不再作为可用组件模型存在       |
| TG-03 | P0       | Docs Truth Convergence        | release、README、package README、website、architecture docs 事实一致 |
| TG-04 | P1       | JSX Renderer Hardening        | SSR/CSR Signal unwrap、SVG namespace、event cleanup 直接测试覆盖     |
| TG-05 | P1       | Public API Surface Lockdown   | `@lessjs/core` / `@lessjs/runtime` 只暴露新模型与必要 kernel API     |
| TG-06 | P1       | Build Output Cleanliness      | `[object Object]` runtime pollution 有上下文 gate 和 allowlist       |
| TG-07 | P1       | Release/Publish Consistency   | root publish task、workflow、graph gate、package list/order 一致     |
| TG-08 | P2       | Architecture Narrative Update | roadmap/status/current architecture/ADR/SOP 都指向 v0.24.3 新状态    |

## Entry Criteria

- v0.24.1 JSX runtime、static props、Signal integration 已存在。
- `docs/conversation/20260629/lessjs-v0.24.1-audit.md` 已完成。
- `docs/conversation/20260629/lessjs-v0.24.1-strategy-architecture-report.md` 已完成。
- 当前工作目标明确为 **remediation/consolidation**，不得扩大到 v0.25 ecosystem 或 Edge full-stack。

## Execution Rules

1. **先恢复 gate，再做大删除**：如果 `lint` / `fmt:check` 失败，先修复 gate，避免遗产删除时噪音过大。
2. **先加新模型测试，再删除旧实现**：删除 legacy 前必须有 JSX renderer/static props/Signal tests 兜底。
3. **不保留模糊兼容层**：旧模型只能是 removed、internal legacy fixture、或 migration before example；不能继续作为推荐/公共 API。
4. **docs 与 code 同步提交**：删除或隔离任何 API 时，同步更新 release notes、README、reference、website。
5. **migration docs 允许旧语法，但必须 escape**：旧 `html` 示例只能出现在 migration/changelog/legacy docs，并且不能破坏 TS parser。
6. **不引入新 abstraction**：除非为删除 legacy 或提升 renderer parity 必需，否则不新增框架概念。

## Step-by-Step Procedure

### Step 1: Baseline Snapshot

**Purpose**: 固定 v0.24.3 开始前的真实状态，避免报告与实际代码再次漂移。

**Actions**:

1. 记录当前 commit、branch、working tree 状态。
2. 运行并保存以下命令结果：

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno audit
deno task test
deno task build
deno task dsd:check-report
deno task graph:check
```

3. 将失败项登记到本 SOP 的 tracking issue 或 release checklist。

**Exit Criteria**:

- [ ] 所有当前失败项有明确 owner / file / fix direction。
- [ ] 不再引用过期的 v0.24.1 release note 作为当前 gate truth。

---

### Step 2: Restore Lint and Format Gates

**Purpose**: 先恢复最基本 release gate。

**Known blockers**:

- `www/app/routes/guide/migration-v0.24.ts` 中旧 `html` template 示例触发 parser/lint error。
- `fmt:check` 已报告多个 Markdown/docs 文件未格式化。

**Actions**:

1. 修复所有 migration docs 中的 template literal escaping：
   - `${` -> `\${`
   - 或使用 `String.raw`
   - 或使用 `_code()` / array join 存储示例。
2. 同步检查中文页面：
   - `www/app/routes/zh/guide/migration-v0.24.ts`
3. 执行格式化：

```bash
deno task fmt
```

4. 验证：

```bash
deno task fmt:check
deno task lint
```

**Exit Criteria**:

- [ ] `deno task fmt:check` pass。
- [ ] `deno task lint` pass。
- [ ] migration docs 中旧 DSL 示例不会被 TS parser 当作真实插值解析。

---

### Step 3: Add New-Model Regression Tests Before Removal

**Purpose**: 在删除 legacy 前，确保 JSX+Signal 新模型关键路径有测试保护。

**Files to add/update**:

- `packages/core/__tests__/jsx-render-dom.test.ts`
- `packages/core/__tests__/jsx-render-string.test.ts`
- `packages/core/__tests__/static-props.test.ts` 或现有 static props tests

**Required test cases**:

1. `renderToDOM()` renders text/number/boolean/null consistently。
2. `renderToDOM()` unwraps Signal-like children。
3. `renderToDOM()` unwraps Signal-like attributes。
4. `renderToDOM()` unwraps Signal-like style object values。
5. `renderToDOM()` creates SVG elements with `http://www.w3.org/2000/svg` namespace。
6. Nested SVG children stay in SVG namespace where applicable。
7. `onClick` uses native listener and stops after `AbortController.abort()`。
8. `ref` callback receives created element。
9. `Fragment` returns `DocumentFragment` with expected children。
10. `renderToString()` has parity for Signal children/attrs/style/SVG attrs。

**Exit Criteria**:

- [ ] Tests fail before missing fixes where applicable。
- [ ] Tests pass after renderer hardening。
- [ ] No new test depends on legacy `html` template runtime。

---

### Step 4: Harden Signal Unwrap and SVG/Attribute Rendering

**Purpose**: 消除 `[object Object]` 复发路径，保证 SSR/CSR parity。

**Files**:

- `packages/core/src/jsx-render-dom.ts`
- `packages/core/src/jsx-render-string.ts`
- new neutral helper if needed, e.g. `packages/core/src/signal-like.ts`

**Actions**:

1. Extract neutral signal helper out of `template.ts`:
   - `isSignalLike()`
   - `unwrapSignalLike()`
2. Update SSR renderer:
   - attributes unwrap
   - boolean attributes unwrap before boolean check
   - style object nested values unwrap
   - SVG attrs preserve intended casing/spelling
3. Update CSR renderer:
   - `applyProps()` unwraps values before handling attrs
   - style object values unwrap before assignment
   - SVG attributes do not stringify Signal objects
4. Add or update tests from Step 3。

**Exit Criteria**:

- [ ] `signal('x')` in JSX children renders `x` in SSR and CSR。
- [ ] `title={signal('x')}` renders `title="x"` / DOM attr `x`。
- [ ] `style={{ opacity: signal(1) }}` does not produce `[object Object]`。
- [ ] SVG attrs with Signal values do not produce `[object Object]`。
- [ ] `isSignalLike` no longer needs to be imported from legacy template module by JSX renderers。

---

### Step 5: Remove Legacy Template Public Surface

**Purpose**: 彻底移除旧 `html` tagged template 作为 public component model 的可见性。

**Files**:

- `packages/core/src/index.ts`
- `packages/runtime/src/index.ts`
- `packages/core/deno.json`
- `packages/runtime/deno.json`
- `packages/core/src/template.ts`
- `packages/core/src/types.ts`

**Actions**:

1. Ensure root public exports do **not** expose:
   - `html`
   - `unsafeHTML`
   - `classMap`
   - `when`
   - `choose`
   - `repeat`
   - `ref`
   - `TemplateResult`
   - `isTemplateResult`
   - `renderTemplateToString`
   - `TemplateValue` / `AttrValue` / `ContentValue` / `EventValue`
   - old runtime binding types that only exist for template DSL
2. Decide final location of removed implementation:
   - Preferred: delete if no runtime consumer remains。
   - Acceptable transitional option: move test fixtures to `legacy/` and exclude from public exports。
3. Add negative public API tests:
   - importing removed names from `@lessjs/core` should fail typecheck or not exist in API surface test。
   - importing removed names from `@lessjs/runtime` should fail typecheck or not exist in API surface test。

**Exit Criteria**:

- [ ] Public API surface contains JSX/static props/Signal model only。
- [ ] No app/ui/www source imports old template helpers except migration docs strings。
- [ ] Legacy template implementation is deleted or isolated from runtime public path。

---

### Step 6: Remove `@prop()` Decorator Legacy Runtime

**Purpose**: 彻底进入 `static props` 新状态。

**Files**:

- `packages/core/src/prop.ts`
- `packages/core/src/prop-types.ts`
- `packages/core/src/dsd-element.ts`
- `packages/core/__tests__/*prop*`
- docs/reference/static props docs

**Actions**:

1. Remove decorator metadata/runtime paths:
   - `PROP_METADATA`
   - `initializeProps()` legacy behavior if only used by `@prop()`
   - decorator-specific types and tests
2. Keep and harden static props runtime:
   - `initializeStaticProps`
   - `disposeStaticProps`
   - `PropDecl`
   - `PropType`
   - `PropsFrom`
   - `createPropSignal` if used by static props
3. Update `DsdElement` to call only new static props initialization path。
4. Add negative tests or grep gate ensuring `@prop(` is not present in source except legacy docs。

**Exit Criteria**:

- [ ] No decorator runtime is executed by `DsdElement`。
- [ ] `@prop()` cannot be imported as supported API。
- [ ] static props tests cover observedAttributes, default values, reflection, cleanup, and Signal unwrapping。

---

### Step 7: Clean DsdElement Render Branches

**Purpose**: 防止 `DsdElement` 永久承载三代组件模型。

**Files**:

- `packages/core/src/dsd-element.ts`
- `packages/core/src/render-dsd.ts`
- `packages/core/src/render-nested.ts`

**Actions**:

1. Identify every branch handling:
   - string render result
   - VNode render result
   - TemplateResult render result
2. For v0.24.3 target state:
   - VNode path is primary。
   - string path may remain as low-level DSD kernel fallback if documented。
   - TemplateResult path must be removed or isolated behind legacy-only tests。
3. Split branch logic into named helpers if needed:
   - `renderVNodeResult()`
   - `renderStringResult()`
   - no public `renderTemplateResult()` unless legacy retained internally。

**Exit Criteria**:

- [ ] `DsdElement.render()` public docs emphasize `VNode` / JSX first。
- [ ] TemplateResult is not part of stable userland API。
- [ ] If string render remains, docs explain it as low-level SSR kernel path, not old model continuation。

---

### Step 8: Migrate or Delete Legacy Tests

**Purpose**: 测试套件必须反映新状态，不能继续把旧模型当主路径保护。

**Files**:

- `packages/core/__tests__/template.test.ts`
- `packages/core/__tests__/template-helpers.test.ts`
- `packages/core/__tests__/reactive-dsd.test.ts`
- any `html` / `classMap` / `when` / `choose` / `repeat` tests

**Actions**:

1. Classify tests:
   - migrate to JSX tests
   - delete obsolete legacy tests
   - keep as migration fixture only if needed
2. Rename retained legacy tests with explicit `legacy` marker。
3. Ensure release readiness metrics distinguish new-model tests from historical fixtures。

**Exit Criteria**:

- [ ] No test suggests `html` template is current recommended model。
- [ ] New-model tests cover all former important behavior: class composition, conditional render, list render, refs, events, unsafe HTML replacement story。

---

### Step 9: Docs Truth Convergence

**Purpose**: 消除 README、release notes、roadmap、website 与代码事实之间的不一致。

**Files**:

- `README.md`
- `packages/core/README.md`
- `packages/runtime/README.md`
- `CHANGELOG.md`
- `docs/release/0.24.1.md` or new `docs/release/0.24.3.md`
- `docs/reference/core-api-surface.md`
- `docs/arch/current-architecture.md`
- `docs/status/STATUS.md`
- `docs/roadmap/ROADMAP.md`
- `www/app/routes/**`

**Actions**:

1. Replace recommended examples with JSX + static props + Signal。
2. Remove old model from current docs except:
   - migration guide “Before” examples
   - changelog history
   - archived SOP/ADR historical context
3. Update current version line to v0.24.3 where appropriate。
4. Add explicit statement:

```markdown
As of v0.24.3, JSX + static props + Signals is the only supported component authoring model. Legacy `html` templates and `@prop()` decorator are removed from public API and are not part of the stable runtime surface.
```

5. Fix markdown formatting after edits。

**Exit Criteria**:

- [ ] Root README does not recommend `html` / `@prop()`。
- [ ] package READMEs do not list removed APIs as exports。
- [ ] website docs current guides use JSX only。
- [ ] migration docs old examples are escaped and clearly marked historical。

---

### Step 10: Add Docs Staleness Gate

**Purpose**: 防止旧模型再次进入当前 docs。

**Recommended tool**:

- `tools/check-current-docs-no-legacy.ts`

**Rules**:

Disallow in current docs/source examples unless file path includes `migration`, `changelog`, `release`, `legacy`, `archive`, or historical SOP/ADR:

- `` html` ``
- `@prop(`
- `classMap(`
- `when(`
- `choose(`
- `repeat(`
- `unsafeHTML(`
- `TemplateResult`
- `renderTemplateToString`

**Actions**:

1. Implement checker with allowlist。
2. Add root task:

```json
"docs:check-current": "deno run --allow-read tools/check-current-docs-no-legacy.ts"
```

3. Add to SOP gate and CI gate if appropriate。

**Exit Criteria**:

- [ ] Checker passes。
- [ ] Checker reports file path, line, matched token, and reason when failing。
- [ ] Allowed historical files are explicit, not broad glob escapes。

---

### Step 11: Build Output Cleanliness Gate

**Purpose**: 防止 runtime `[object Object]` 污染再次进入 `www/dist`。

**Recommended tool**:

- `tools/check-dist-no-object-object.ts`

**Actions**:

1. Scan `www/dist/**/*.html` and critical JS bundles。
2. Allowlist historical textual mentions in changelog/migration/release docs。
3. Fail on critical pages:
   - `/`
   - `/en/`
   - search component routes
   - theme toggle routes
   - guide pages that render live JSX examples
4. Print context around every match。

**Exit Criteria**:

- [ ] `www/dist/index.html` clean。
- [ ] `www/dist/en/index.html` clean。
- [ ] no live rendered component emits `[object Object]`。
- [ ] all allowed matches are documentation text, not runtime output。

---

### Step 12: Publish and Package Graph Consistency

**Purpose**: 确保 v0.24.3 发布集合、顺序、依赖图一致。

**Files**:

- `deno.json`
- `.github/workflows/publish-jsr.yml`
- `tools/check-package-graph.ts`
- all `packages/*/deno.json`

**Actions**:

1. Bump all packages to `0.24.3`。
2. Bump LessJS cross-package deps to `^0.24.3`。
3. Ensure root publish/dry-run task and GitHub publish workflow contain same package set/order。
4. Ensure `@lessjs/signals` is published before `@lessjs/core`。
5. Fix misleading comments that reference wrong versions。
6. Run:

```bash
deno task graph:check
```

**Exit Criteria**:

- [ ] 18 packages version-aligned at `0.24.3`。
- [ ] no circular dependencies。
- [ ] publish order computed and workflow order agree。
- [ ] root publish task cannot publish an incomplete package set。

---

### Step 13: Full Release Gate

**Purpose**: v0.24.3 只有在所有 consolidation gates 全绿时才能完成。

**Commands**:

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno audit
deno task test
deno task build
deno task dsd:check-report
deno task graph:check
deno task docs:check-strategy
# if added:
deno task docs:check-current
# if added:
deno task dist:check-object-object
# if environment is ready:
deno task test:e2e
```

**Exit Criteria**:

- [ ] all required commands pass。
- [ ] DSD known/excluded errors do not increase from v0.24.1 baseline。
- [ ] no unknown DSD error classes。
- [ ] no live `[object Object]` output。
- [ ] no stale current docs claims。

---

### Step 14: Release Notes and Changelog

**Files**:

- `CHANGELOG.md`
- `docs/release/0.24.3.md`
- `docs/status/STATUS.md`
- `docs/roadmap/ROADMAP.md`

**Required content**:

1. v0.24.3 is a consolidation release, not a feature expansion。
2. Old component model removed/isolated。
3. JSX+Signal is the only supported component authoring model。
4. Renderer hardening summary:
   - Signal attrs/style/SVG unwrap
   - CSR tests
   - SVG namespace
   - event cleanup
5. Gate results with actual command outputs。
6. Any remaining known limitations:
   - third-party WC DSD known exclusions
   - allowed documentation mentions of `[object Object]`

**Exit Criteria**:

- [ ] release notes do not claim gates passed unless actually run。
- [ ] changelog describes breaking removals clearly。
- [ ] migration path is linked。

## Final Exit Criteria for v0.24.3

- [ ] `html` tagged template and helpers are not part of public current API。
- [ ] `@prop()` decorator is not part of public current API。
- [ ] `TemplateResult` is not part of stable userland API。
- [ ] JSX + static props + Signals is the only recommended component model。
- [ ] all current docs and README examples use JSX unless clearly historical/migration。
- [ ] `renderToDOM` and `renderToString` have direct tests for Signal/SVG/event parity。
- [ ] lint/fmt/typecheck/audit/test/build/dsd/graph gates pass。
- [ ] package versions and cross-package deps are aligned at `0.24.3`。
- [ ] publish workflow and root tasks cannot diverge silently。
- [ ] release notes accurately reflect actual verification results。

## Non-Goals

- No Edge full-stack / ISR / KV adapter implementation。
- No Hub marketplace expansion beyond docs/gates needed for current release。
- No VDOM diff。
- No synthetic event system。
- No new component library expansion。
- No generic server framework features。
- No promise that arbitrary Web Components can SSR automatically。

## Carry-Forward After v0.24.3

If all v0.24.3 exit criteria pass, the next work should move to v0.25 ecosystem hardening:

- compatibility badges
- at least 10 real WC packages indexed
- `less add` admission planning
- Shoelace fallback strategy
- DSD report schema documentation

Do not start v0.25 until v0.24.3 gates are green and docs truth is stable.
