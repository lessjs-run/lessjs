# v0.35.1 NextVersion Package

> Version: v0.35.1\
> Theme: Deduplication & ADR-0079 Debt Closure\
> Governing SOP: `docs/sop/v0.35.1/README.md`\
> Base: v0.35.0 (b2da2335)\
> ADR: ADR-0079\
> Issue: [#47](https://github.com/open-element/openelement/issues/47)\
> Workflow: `docs/governance/PROJECT_WORKFLOW.md`

## Purpose

v0.35.1 is a fix patch that closes ADR-0079's four unfulfilled deduplication
commitments plus 28 additional duplication/bloat/drift items discovered in the
2026-06-06 full-project audit.

## Scope

32 items across 3 priority tiers:

| Tier | Count | Examples                                                                                 |
| ---- | ----- | ---------------------------------------------------------------------------------------- |
| P0   | 8     | validatorVersion bug, DsdHydration extract, CSS merge, error centralization, CI collapse |
| P1   | 12    | version constants, HTML escape dedup, deno.json exclude, gate names                      |
| P2   | 12    | Constructor type, publish tasks, README templates, autoflow CLI merge                    |

## ADR-0079 Commitments Closed

| Commitment                                   | Status in v0.34           | v0.35.1 Fix                                                                    |
| -------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| `htmlEscape`/`escapeAttr` → import from core | ❌ Not done               | Delete `ui/src/shared/escape.ts`, 5 components import from core                |
| `classifyCemManifest` → cem canonical        | ❌ Not done               | Delete compat-check copy, all consumers use `@openelement/cem`                 |
| adapter DSD hydration mixin → shared         | ❌ Not done               | Extract to `@openelement/core` (interfaces only; Mixin stays adapter-specific) |
| `validatorVersion` → `constants.ts`          | ❌ Claimed done, not done | Replace `'0.19.0'` hardcode with `VALIDATOR_VERSION` import                    |

## Execution Map

| File                   | Role                                            |
| ---------------------- | ----------------------------------------------- |
| `DESIGN.md`            | Architecture rationale for each dedup decision  |
| `TASKS.md`             | 32 concrete implementation steps                |
| `ACCEPTANCE.md`        | Verification: all 32 items pass pre-commit + CI |
| `TEST_MATRIX.md`       | Regression tests for changed files              |
| `DOCS_PLAN.md`         | SOP, STATUS, ROADMAP, CHANGELOG, release note   |
| `RISK_REGISTER.md`     | Breaking change risk assessment                 |
| `RELEASE_CHECKLIST.md` | Release closure sequence                        |

## Completion Rule

All 32 items resolved. Pre-commit 6-step hook passes. CI all-green.
No breaking public API changes. All packages bumped to 0.35.1.
