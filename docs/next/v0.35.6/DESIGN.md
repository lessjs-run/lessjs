# v0.35.6 Design: AutoFlow2 Full-Auto Evolution

## Overview

v0.35.6 replaces the placeholder `DryRunGenerator` with a production
`AgentCodeGenerator` that writes real files, runs deterministic gates, and
records evidence. It also connects the Evolution Loop to real cell execution
data, closing the MAPE-K feedback cycle.

## Directory Layout (new/modified files)

```
tools/autoflow/
├── agent-code-generator.ts    # NEW — AgentCodeGenerator (ADR-0089)
├── metrics-collector.ts       # NEW — L3 metrics collection
├── executor.ts                # MODIFY — integrate AgentCodeGenerator
├── mod-evolve.ts              # MODIFY — replace DryRunGenerator, wire scheduler
├── evolution-tracker.ts       # MODIFY — real cycle start/complete
├── __tests__/
│   ├── agent-code-generator.test.ts  # NEW — protocol compliance tests
│   └── integration-evolve.test.ts    # NEW — end-to-end evolve test
```

## L2 — AgentCodeGenerator Design (ADR-0089)

### Interface Contract

The existing `CodeGenerator` interface in `executor.ts` is preserved:

```typescript
interface CodeGenerator {
  generateTests(req: CodeGenRequest): Promise<CodeGenResult>;
  implementCode(req: CodeGenRequest): Promise<CodeGenResult>;
  reviewCode(req: CodeGenRequest): Promise<CodeGenResult>;
}
```

`AgentCodeGenerator` implements this interface with real file-system operations.

### Safety Boundaries

Protected paths (hard-coded, not configurable):

| Path Pattern            | Reason                       |
| ----------------------- | ---------------------------- |
| `tools/autoflow/`       | Self-modification prevention |
| `.github/workflows/`    | CI config protection         |
| `docs/governance/`      | Governance rule protection   |
| `deno.json` (root only) | Project config protection    |

Check is performed before every file write. Violation → `success: false`.

### File-System Protocol

```
Phase 1 (testgen):
  1. Read target files from req.files
  2. Generate test spec based on cellType + description
  3. Check safety boundaries
  4. Write test files to disk
  5. Return CodeGenResult with written file map

Phase 2 (implement):
  1. Read target files + test spec from Phase 1
  2. Generate implementation
  3. Check safety boundaries
  4. Write implementation files
  5. Run risk-based gates (see below)
  6. If gates fail → return failure (triggers TDD retry in executor)
  7. Return CodeGenResult

Phase 3 (review):
  1. Read diff (git diff from base)
  2. Generate review report
  3. Return advisory result (not blocking per ADR-0087)
```

### Risk-Based Gate Selection

| Risk     | Gates Run                                | Rationale                 |
| -------- | ---------------------------------------- | ------------------------- |
| low      | `fmt:check`, `lint`                      | Doc/config changes only   |
| medium   | `fmt:check`, `lint`, `typecheck`         | Source code changes       |
| high     | `fmt:check`, `lint`, `typecheck`, `test` | Runtime-impacting changes |
| critical | all 12 gates                             | Architecture changes      |

Gate execution reuses `harness-runner.ts` → `runGate(projectRoot, gate)`.

### Integration with Executor

Current `executor.ts` calls `this.ai.generateTests(req)` etc. The
`AgentCodeGenerator` replaces `DryRunGenerator` in `mod-evolve.ts`:

```typescript
// Before (v0.35.0):
const generator: CodeGenerator = new DryRunGenerator();

// After (v0.35.6):
const generator: CodeGenerator = new AgentCodeGenerator(rootDir, {
  risk: 'low', // from DAG node
});
```

The executor's `phaseImplement` TDD loop now receives real gate results from
`AgentCodeGenerator`, enabling genuine red-green iteration.

### Rollback Strategy

On gate failure during Phase 2:

1. `AgentCodeGenerator` returns `success: false` with the failing gate output.
2. `executor.ts` re-enters the TDD loop with the failure context.
3. After `maxTddIterations` (default 5), cell enters `failed:retriable`.
4. On `failed:non-retriable`, `git-ops.ts` → `resetHard()` cleans the branch.

## L3 — Metrics Collector Design

### Data Sources

| Source                 | Metrics Extracted                          |
| ---------------------- | ------------------------------------------ |
| Evidence Ledger        | cell count, firstPassRate, retries, merged |
| HarnessGateRecord      | gate pass/fail rates, gate durations       |
| Cell events            | drift detection latency, cycle duration    |
| `deno test --coverage` | test coverage percentage                   |

### Collection Flow

```
autoflow:evolve
  │
  ├── EvolutionTracker.startCycle('v0.35.6')
  │     → creates docs/autoflow/metrics/v0.35.6.json (baseline)
  │
  ├── [execute all cells through DAG waves]
  │     → EvidenceLedger accumulates events
  │
  ├── MetricsCollector.collectFullMetrics(ledger, 'v0.35.6')
  │     → reads all cell events
  │     → aggregates gate results
  │     → computes EvolutionMetrics
  │
  └── EvolutionTracker.completeCycle('v0.35.6')
        → updates docs/autoflow/metrics/v0.35.6.json (final)
```

### EvolutionMetrics Output

```json
{
  "versionCycle": "v0.35.6",
  "firstPassRate": 0.875,
  "avgRetriesPerCell": 0.125,
  "totalCellsAttempted": 8,
  "totalCellsMerged": 8,
  "totalCellsFailed": 0,
  "mechanicalAutonomyScore": 1.0,
  "gateScore": 0.95,
  "governanceDocLines": 1200,
  "adrCount": 89,
  "packageCount": 19
}
```

## Non-Goals

- No direct LLM API integration (file-system protocol only, per ADR-0089).
- No autonomous merge/tag/push (human-triggered).
- No modification of AutoFlow's own code by automated cells.
- No cross-browser E2E or adapter-vite decomposition (deferred to v0.36).
