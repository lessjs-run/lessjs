# ADR-0089: Agent Code Generator — File-System Protocol for L2 Cell Execution

- **Status:** Proposed
- **Date:** 2026-06-07
- **Supersedes:** DryRunGenerator in executor.ts (v0.35.0)
- **Decision:** Replace the placeholder `DryRunGenerator` with an
  `AgentCodeGenerator` that uses a file-system protocol (spec → result) for
  AI-driven code generation. The generator operates through Deno's file-system
  API, writing real files and running deterministic gates (fmt, lint,
  typecheck, test) as verification.

## Context

AutoFlow2 v0.35.0 introduced the L2 Cell Execution framework with a pluggable
`CodeGenerator` interface. The only implementation was `DryRunGenerator`, which
returns empty success for all phases. To make L2 production-ready, we need a
real code generator that:

1. Produces actual file changes (not mock results).
2. Runs deterministic gates to verify correctness.
3. Records evidence through the Evidence Ledger.
4. Operates within AutoFlow's safety boundaries (no self-modification of
   `tools/autoflow/`, `.github/workflows/`, or `docs/governance/`).

### Why file-system protocol, not direct LLM integration

The original v0.35.0 design planned for a future LLM-based CodeGenerator
(via CodeAct/OpenHands). After practical evaluation:

| Approach             | Pros                                        | Cons                                            |
| -------------------- | ------------------------------------------- | ----------------------------------------------- |
| Direct LLM (CodeAct) | Autonomous end-to-end                       | Requires persistent process, API keys, cost     |
| File-system protocol | Deterministic, auditable, zero dependencies | Requires external agent (AI or human) as driver |
| Session AI (current) | High-quality output, context-aware          | Not a persistent process, session-based         |

**Decision**: Implement the file-system protocol as the canonical interface.
AI agents (session-based or persistent) and human developers both satisfy the
protocol. The `AgentCodeGenerator` implementation bridges session AI to the
executor pipeline.

## Decision

### AgentCodeGenerator Protocol

```typescript
interface CodeGenerator {
  generateTests(req: CodeGenRequest): Promise<CodeGenResult>;
  implementCode(req: CodeGenRequest): Promise<CodeGenResult>;
  reviewCode(req: CodeGenRequest): Promise<CodeGenResult>;
}

interface CodeGenRequest {
  cellId: string;
  cellType: string;
  description: string;
  files: string[]; // target files to modify
  tests?: string; // test spec (for implement phase)
  context?: string; // additional context (SOP, ADR references)
  diff?: string; // current diff (for review phase)
}

interface CodeGenResult {
  success: boolean;
  files: Record<string, string>; // path → new content
  output: string; // human-readable summary
}
```

### File-System Operations

The `AgentCodeGenerator` performs real operations:

1. **Read** target files from the project tree.
2. **Generate** test cases / implementation / review based on the request.
3. **Write** modified files back to disk.
4. **Run gates** (`deno fmt`, `deno lint`, `deno check`, `deno test`) to
   verify the changes.
5. **Record** gate results as evidence in the Evidence Ledger.

### Safety Boundaries

The generator enforces the protection zones defined in ADR-0088:

- **No write** to `tools/autoflow/` (self-modification prevention).
- **No write** to `.github/workflows/` (CI config protection).
- **No write** to `docs/governance/` (governance rule protection).
- **No write** to root `deno.json` (project config protection).

Violations are rejected before file write, producing a `success: false` result.

### Gate Execution

After writing files, the generator runs a deterministic gate sequence:

```
deno fmt --check <files>     → format compliance
deno lint <files>            → lint compliance
deno check <entry>           → type compliance
deno test <test-dir>         → test compliance
```

Each gate produces a `HarnessGateRecord` with pass/fail/duration. All gate
results are appended to the Evidence Ledger as `harness-passed` or
`harness-failed` events.

### Risk-Based Gate Selection

Not all cells need all gates. Per ADR-0088 risk tiering:

| Risk     | Gates Run                             |
| -------- | ------------------------------------- |
| low      | fmt + lint                            |
| medium   | fmt + lint + typecheck                |
| high     | fmt + lint + typecheck + test         |
| critical | fmt + lint + typecheck + test + build |

## Consequences

- **Positive**: L2 Cell Execution becomes production-ready. Cells produce real
  file changes verified by deterministic gates.
- **Positive**: The protocol is agent-agnostic — AI agents (session or
  persistent) and human developers can both satisfy it.
- **Positive**: Safety boundaries prevent autonomous modification of critical
  infrastructure files.
- **Positive**: Evidence Ledger records real gate results, enabling L3
  Evolution Loop to collect meaningful metrics.
- **Negative**: No fully autonomous end-to-end execution without an external
  driver (AI agent or human). This is an intentional trade-off for safety.
- **Negative**: Session AI (current primary driver) is not a persistent
  process. Multi-cell parallel execution requires sequential session
  orchestration.

## Exit Criteria for v0.35.6

- `AgentCodeGenerator` replaces `DryRunGenerator` in `mod-evolve.ts`.
- At least one cell (version-bump) executes through the full pipeline:
  planned → branched → executing → harness:passing → merged.
- Evidence Ledger records real gate results for the executed cell.
- Evolution Tracker captures metrics from the v0.35.6 cell execution.

## References

- ADR-0087: TDD + AI Cross-Review as Cell Execution Subphases
- ADR-0088: AutoFlow-First Strategy
- C1 (von Neumann locality), C4 (Brooks accidental difficulties)
- R3 (Self-Healing: Monitor→Diagnose→Plan→Repair→Verify)
