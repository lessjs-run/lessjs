# AutoFlow2 Architecture Redesign Prompt

You are an AI systems architect. Your task is to read the project's research
library, understand the current implementation, and propose a superior
architecture for openElement's self-evolving workflow system.

---

## Step 1: Read the Research Library

Read every file in `docs/references/autoworkflow/notes/`. Pay special attention to:

- **C1-C2** (von Neumann, Langton/Wolfram) — cellular automata theory
- **C3** (Lehman) — software evolution laws
- **C4** (Brooks) — essential vs accidental complexity
- **C5** (Pnueli) — temporal logic for invariants
- **C6** (Kahn) — deterministic concurrency via communication channels
- **01** (MAPE-K) — autonomic computing loop
- **02** (Harel Statecharts) — hierarchical state machines
- **03** (Rainbow) — architecture-driven self-adaptation
- **04** (Durable Execution) — event sourcing and replay
- **06** (Model-Based Testing) — generating tests from state models
- **A1** (AlphaEvolve) — LLM + evolutionary computation in production

Do NOT just summarize each paper. Your job is to **extract design principles**
and **identify mechanisms** that can be composed into a concrete architecture.

---

## Step 2: Understand the Current Implementation

1. Read `docs/governance/PROJECT_WORKFLOW.md` — the mandatory workflow
2. Read `docs/status/STATUS.md` — current version line and gate order
3. Read `docs/roadmap/ROADMAP.md` — version sequence and product direction
4. Read `docs/sop/v0.34.0/README.md` — what v0.34 delivered
5. Read all source files under `tools/autoflow/` — the current implementation

Current state (v0.34):

- `tools/autoflow/mod.ts` — CLI entry that reads governance docs and emits reports
- `tools/autoflow/state-machine.ts` — 7-state workflow model (planned→next→active→implemented→released, +drifted, +invalid)
- `tools/autoflow/cells.ts` — 9 evidence cells with ok/warning/missing/drifted status
- `tools/autoflow/readers/` — 6 readers parsing markdown governance docs
- `tools/autoflow/reporter.ts` — JSON + Markdown summary output
- `deno task autoflow:report` — runs the sidecar
- Advisory only — no CI gate, no code edits, no git operations

---

## Step 3: Understand the Vision

The project maintainer wants to evolve from v0.34 (read-only reporter) to a
self-evolving architecture. Key decisions already made:

1. **AI-led, not human-led.** AI autonomously reads governance state, decides
   what needs to happen, creates work units, executes them.

2. **Cells as atomic work units.** Each cell runs on an isolated git branch.
   Cells have explicit DAG dependencies. Upstream failure → downstream cancel.
   Cell types range from low-risk (bump-version, changelog) to critical
   (api-change). Evidence ledger records every cell's lifecycle.

3. **Harness as gate, not suggestion.** fmt / lint / typecheck / test / build /
   graph:check / arch:check / workflow:check / docs:check-strategy — all must
   pass before a cell can merge.

4. **Git as safety net.** Every cell on `autoflow/cell-<id>` branch. Merge on
   green. Delete branch on red. Main line is never touched by autonomous
   operations.

5. **Evidence-driven release.** When all cells for a version cycle complete and
   all harness gates pass, release proceeds. No human calendar judgment.

6. **Harness is locked.** `tools/autoflow/` and `.github/workflows/` cannot be
   modified by autonomous cells. Human review only.

7. **Governance docs are the knowledge base.** STATUS.md / ROADMAP.md / SOP /
   ADR are not documentation for humans — they are the system's memory.

Unsolved questions:

- How should cell retry/repair work after failure?
- What is the exact cell DAG scheduling algorithm?
- How does the system detect "we should start a new version cycle"?
- What metrics define evolution quality over multiple version cycles?

---

## Step 4: Redesign

Propose a concrete architecture that covers:

### 4.1 System Architecture

- Component diagram. What modules exist? How do they communicate?
- How does `autoflow:report` (v0.34) feed into the evolution engine (v0.35+)?
- What new modules are needed? Where do they go?

### 4.2 Cell Lifecycle State Machine

- Use Harel Statecharts style (hierarchical + orthogonal states).
- Define every state, every legal transition, and the event/evidence that
  triggers each transition.
- Handle retry loops, failure cascades, and partial success scenarios.

### 4.3 Cell DAG Scheduler

- How are cells discovered and planned?
- How is the DAG constructed from governance document state?
- What scheduling algorithm handles parallel vs sequential cells?
- How does Kahn process network theory inform cell communication?
- How does the system handle conflicts (two cells editing the same file)?

### 4.4 Evidence Model

- What constitutes "evidence" for each type of cell?
- How does the evidence ledger persist across sessions (Map to Durable Execution)?
- How does temporal logic (Pnueli) express invariants like
  □(harness-pass → cell-merge)?

### 4.5 Evolution Loop

- Map the entire lifecycle to MAPE-K: Monitor → Analyze → Plan → Execute → Knowledge.
- Show how Rainbow's architecture model maps to governance docs.
- Show how AlphaEvolve's fitness evaluation maps to harness gates.

### 4.6 Safety and Non-Goals

- What must ALWAYS require human intervention?
- What can NEVER be automated?
- How does the system degrade gracefully when CI is down?

### 4.7 Version Roadmap

- What belongs in v0.35 (next)?
- What belongs in v0.36?
- What is deferred to v1.0?
- What can only be answered after running a few version cycles?

### 4.8 Concrete v0.35 Implementation Plan

- File structure for new code.
- Deno tasks to add.
- Test strategy (including model-based testing from paper 06).
- Fixture design for cell state machine testing.

---

## Constraints

- Deno 2.7+ only. No Node.js dependencies.
- Must stay within `tools/autoflow/` directory. Does not import from `packages/`.
- Read-only by default. Git operations require explicit `--allow-run` flag.
- Follow existing code style: TypeScript strict, `jsr:@std/assert` for tests,
  `deno fmt` compliance.
- Each module must be independently testable.

## Output Format

Write your proposal to `docs/references/autoworkflow/proposals/redesign-v1.md`.
Use concrete file paths, type signatures, and deno task definitions. Do not
write abstract prose — write something an engineer could implement directly.
