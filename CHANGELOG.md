## v0.35.1 - Deduplication & ADR-0079 Debt Closure (2026-06-07)

### Bug Fixes

- B1: Fix hub validatorVersion drift (0.19.0 → VALIDATOR_VERSION from constants.ts)
- B2: Remove FALLBACK_OPENELEMENT_VERSION hardcode, read from deno.json
- B3: Merge VALIDATOR_VERSION and openElement_UI_VERSION into HUB_VERSION
- B4: Use SHOELACE_VERSION constant in snapshot-playwright.ts

### Deduplication

- E1: Delete packages/ui/src/docs-page-styles.ts (merged into page-styles.ts)
- E2: Delete packages/ui/src/shared/escape.ts, 6 components import from @openelement/core
- C1: Share test fixtures (client-only-cem.json, invalid-cem.json) in tools/test-fixtures/

### Infrastructure

- H2: Create tools/lib/ and tools/test-fixtures/ directories
- F1: Add TAG_VALIDATION_ERROR to core/src/errors.ts ErrorCode
- 19 packages bumped to 0.35.1

### SOP

- docs/sop/v0.35.1/README.md: 11 P0 items completed
- docs/next/v0.35.1/README.md: NextVersion package

See issue #47 for full 32-item audit.

---

## v0.35.0 - AutoFlow2 Mechanical Autonomy (2026-06-06)

Combines Harness Gate, Cell Execution, and Evolution Loop into one version.

### Harness Gate (Layer 1)

- `deno task autoflow:check` — CI-blocking invariant verification (exit 0/1).
- `cell-state-machine.ts` — 12-state Harel model, 3 orthogonal dimensions, broadcast events.
- `invariant-checker.ts` — 8 Pnueli temporal invariants (5 error + 3 warning).
- `evidence-ledger.ts` + `event-sourcing.ts` — Durable Execution event sourcing.
- `harness-runner.ts` — unified 12-gate runner.
- autoflow:check added to pre-commit hook and CI (lint.yml).

### Cell Execution (Layer 2)

- `executor.ts` — three-phase engine (testgen → implement → review), pluggable CodeGenerator.
- `git-ops.ts` — git operations with Kahn isolation (one branch per cell).
- `dag-builder.ts` — evidence → DAG with conflict detection.
- `scheduler.ts` — wave-based parallel + cascade cancellation.
- `mod-evolve.ts` — `deno task autoflow:evolve` (--dry-run and full modes).

### Evolution Loop (Layer 3)

- `metrics.ts` — AlphaEvolve fitness + SWE-bench 12-D quality metrics.
- `evolution-tracker.ts` — multi-cycle trend tracking (Lehman complexity).
- `mod-health.ts` — `deno task autoflow:health` agent diagnostic.
- `.workbuddy/skills/autoflow/SKILL.md` — AI agent project driver.

### Governance

- ADR-0087 — TDD + AI Cross-Review as Cell Execution Subphases.
- ADR-0088 — AutoFlow-First Strategy: all three layers in one version.
- `docs/governance/BRANCHING.md` — Trunk-Based + AutoFlow Cells branching model.
- SOP v0.35.0 — implementation plan for all three layers.
- Research basis: 27 papers (15 internal + 12 external: EMNLP, ICSE, TOSEM, IEEE).

---

## v0.34.0 - AutoFlow2 Sidecar Kernel (2026-06-06)

### AutoFlow2 Sidecar

- Added `tools/autoflow/` — an internal read-only workflow kernel.
- Reads `PROJECT_WORKFLOW`, `STATUS`, `ROADMAP`, SOPs, `docs/next`, ADRs, package graph, workflow files, and gate results.
- 5-state workflow machine: `planned → next → active → implemented → released`.
- 6 readers for STATUS, SOP, NextVersion, ROADMAP, package graph, and ADRs.
- 9 evidence cells with `ok`/`warning`/`missing`/`drifted` status.
- Emits JSON and Markdown summary via `deno task autoflow:report`.
- 5 fixture states (released, active, planned, drifted, invalid) with integration tests.
- Advisory only — no CI gate, no code edits, zero network.
- Updated `workflow:check` active version to v0.34.0.

---

## v0.33.0 - AI-Readable API Foundation (2026-06-06)

### Page API: Strict Canonical Descriptor

- Object-form `definePage({ route, head, renderIntent, load, render, error })` is now the only page authoring path.
- Removed function-form `definePage(() => ...)`. Consumers must use the object form.
- Added structured `head` with `title`, `description`, `meta`, `script`, `link`, `style`, and `dangerouslyHeadFragments`.
- Added `head.dangerouslyHeadFragments: TrustedHtmlString` — inject-only surface, no runtime traversal.
- Added `route: { path, staticPaths, streaming?, revalidate?, rendering? }`.
- Added `renderIntent: Record<string, RenderIntent>` — structured SSG/SSR/streaming/isr intent per route.
- Removed top-level `title`, `description`, `meta`, `rendering`, `streaming`, and `revalidate`. These now live under `head` and `route`.

### Island API

- Added `defineIslandConfig({ tagName, client?, ssr? })` for island declarations.
- `client?` accepts `"load" | "idle" | "visible" | "only"`.
- `ssr?: boolean` controls the SSR→client hydration contract.

### Router API

- Added `defineRoute({ component, layout?, loading?, error?, context? })`.
- Added `defineLayout({ component, loading?, error?, context? })`.

### Build API

- `openElement()` from `@openelement/app/vite` moved to public contract (was internal).
- Generated entry file uses object form only.

### Migration Guide

```diff
- export default definePage(() => <Page />);
+ export const openElement = definePage({
+   route: { path: "/" },
+   head: { title: "Page" },
+   render: () => <Page />,
+ });
```

```diff
- export default defineIslandConfig({ tagName: "my-island" });
+ export const openElement = defineIslandConfig({ tagName: "my-island" });
```
