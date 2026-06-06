# ADR-0088: AutoFlow-First Strategy — v0.35-0.37 Precede Product Features

- **Status:** Proposed
- **Date:** 2026-06-06
- **Supersedes:** ADR-0086 (sequencing), ADR-0084 (version order)
- **Decision:** Versions v0.35 through v0.37 are dedicated to completing the
  AutoFlow2 mechanical autonomy stack (Harness Gate → Cell Execution →
  Evolution Loop). Product feature work (rendering, server, data, UI) resumes
  at v0.38. v1.0 defers from v0.39 to v0.41 — two additional versions for
  the expanded AutoFlow scope.

## Context

ADR-0086 sequenced v0.33-0.35 as AI-readable API → AutoFlow sidecar →
AutoFlow harness gate, then resumed product work at v0.36. This assumed
AutoFlow2 would reach mechanical autonomy in one version (v0.35).

After reviewing 27 papers (15 internal + 12 external, spanning EMNLP 2024,
ICSE 2025, ACM TOSEM 2025, IEEE 2024), we now understand the full scope of
what mechanical autonomy requires and what it does not require.

### What 27 papers tell us we can do (mechanical autonomy)

| Capability                              | Supported By                                 |
| --------------------------------------- | -------------------------------------------- |
| CI gate with temporal invariants        | C5 (Pnueli), 01 (MAPE-K), 03 (Rainbow)       |
| Event-sourced evidence ledger           | 04 (Durable Execution), 02 (Harel broadcast) |
| Cell DAG scheduling with Kahn isolation | C6 (Kahn), C1 (von Neumann locality)         |
| TDD-driven code generation              | R1, R7, R10 (ASE, IEEE, TOSEM)               |
| Multi-agent AI cross-review             | R2 (CodeAgent, EMNLP 2024), R8               |
| Autonomous program repair               | R11 (ICSE 2025), R12 (ICSE 2025), R3, R9     |
| Multi-version fitness tracking          | A1 (AlphaEvolve), 09 (SWE-bench)             |

### What 27 papers tell us we cannot do (architectural decisions)

| Capability                 | Why Not                                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Autonomous ADR writing     | R5/R6: 85% of studies require human-in-the-loop; no peer-reviewed system achieves full autonomy                                           |
| API design decisions       | R5 AICH4: lacks explainability; R6: system-level reasoning remains poor                                                                   |
| Version direction planning | von Neumann paradox: instruction tape must be complete; our governance docs are not yet complete enough for autonomous strategic planning |

### Why three versions for AutoFlow

v0.35: Harness Gate — perception (detect drift, verify invariants).
v0.36: Cell Execution — action (repair drift, TDD + review).
v0.37: Evolution Loop — continuity (multi-cycle, metrics, closed-loop MAPE-K).

Each builds on the previous. Skipping a layer creates a foundation gap.

### Why product comes after, not alongside

Lehman's First Law (C3): software must continuously change. But Lehman's
Second Law: change increases complexity unless actively managed.

If we resume product feature development at v0.36 while simultaneously
building Cell execution, we face:

1. AutoFlow must evolve against a moving target (product code changing under it)
2. We cannot distinguish "AutoFlow bug" from "product feature broke the workflow"
3. Evidence from AutoFlow's first autonomous cycles is contaminated by
   concurrent product changes

Building AutoFlow first, then using it to govern product development, gives
us a clean separation of concerns and an apples-to-apples evidence baseline.

### Risk tiering for cell autonomy

Not all cell types need full TDD+review. Per Brooks (C4):

| Risk     | Cell Types                                    | Autonomy Level                                                   |
| -------- | --------------------------------------------- | ---------------------------------------------------------------- |
| low      | version-bump, changelog, fmt-fix, doc-align   | Full: testgen→implement→review→harness→merge                     |
| medium   | lint-fix, typecheck-fix, test-add, dep-update | Full but review is mandatory (can't skip)                        |
| high     | readme-update, release-note, sop-check        | Implement→review (no TDD needed for docs), human spot-check      |
| critical | adr-write, api-change, package-remove         | Human review mandatory throughout; autoflow generates draft only |

## Consequences

- **Positive**: Clean separation — v0.35-0.37 prove mechanical autonomy on a
  stable codebase, then v0.38+ uses that autonomy to accelerate product
  development.
- **Positive**: Each product version from v0.38 onward has AutoFlow managing
  mechanical operations (changelog, version bumps, doc alignment), freeing
  human effort for architectural decisions.
- **Negative**: Product features (rendering, server, data, UI) are delayed by
  two versions (from v0.36-0.37 to v0.38-0.39). Users waiting for SSR/ISR
  or server features will need to wait longer.
- **Negative**: v1.0 defers from v0.39 to v0.41 — two additional versions.
  Each version cycle takes real calendar time.
- **Risk**: If AutoFlow2 fails to achieve mechanical autonomy within v0.35-0.37,
  we have delayed product features for no gain. Mitigation: each version
  has concrete, falsifiable exit criteria.

## Exit Criteria

- v0.35 exit: `deno task autoflow:check` passes on all fixtures; CI blocks
  on invariant violations; 8 invariants verified.
- v0.36 exit: `deno task autoflow:evolve --dry-run` successfully creates,
  executes, reviews, and harness-tests a version-bump cell against a drift
  fixture.
- v0.37 exit: autoflow completes one full version cycle (v0.37 → drift
  detection → cell creation → execution → merge → STATUS/ROADMAP update)
  without human intervention on mechanical steps.

## References

- C1-C6, 01-09, A1: 15 internal research notes in docs/references/autoworkflow/notes/
- R1-R12: 12 external papers in docs/references/autoworkflow/paper/
- R1-external-references.md: cross-reference mapping
- ADR-0086: AI-Readable Architecture and AutoFlow2 Roadmap
- ADR-0084: Version Sequencing
- ADR-0087: TDD + AI Cross-Review as Cell Execution Subphases
