/**
 * Cell Execution Engine — v0.35.6
 *
 * Three-phase execution per ADR-0087:
 *   .testgen   → generate test cases first (TDD, R1/R7)
 *   .implement → TDD red-green loop (write code → fail → fix → pass)
 *   .review    → multi-agent AI cross-review (CodeAgent, R2)
 *
 * Each phase transition broadcasts a Harel event → Evidence Ledger.
 *
 * AI strategy: modular CodeGenerator interface.
 *   - AgentCodeGenerator (v0.35.6): file-system protocol with real gates
 *   - DryRunGenerator: pass-through for dry-run mode
 *   - future: plug LLM via CodeAct (OpenHands, R2/R11/R12)
 */

import type { CellEvent, CellState } from './cell-state-machine.ts';
import type { EvidenceLedger } from './evidence-ledger.ts';

// ---- Code Generator Interface (pluggable AI) ----

export interface CodeGenRequest {
  cellId: string;
  cellType: string;
  description: string;
  files: string[];
  tests?: string;
  context?: string;
  diff?: string;
}

export interface CodeGenResult {
  success: boolean;
  files: Record<string, string>; // path → content
  output: string;
}

export interface CodeGenerator {
  generateTests(req: CodeGenRequest): Promise<CodeGenResult>;
  implementCode(req: CodeGenRequest): Promise<CodeGenResult>;
  reviewCode(req: CodeGenRequest): Promise<CodeGenResult>;
}

// ---- Executor ----

export interface ExecutorOptions {
  projectRoot: string;
  ledger: EvidenceLedger;
  codeGenerator: CodeGenerator;
  maxTddIterations?: number;
  maxRetries?: number;
}

export class CellExecutor {
  private root: string;
  private ledger: EvidenceLedger;
  private ai: CodeGenerator;
  private maxTddIterations: number;
  private maxRetries: number;

  constructor(options: ExecutorOptions) {
    this.root = options.projectRoot;
    this.ledger = options.ledger;
    this.ai = options.codeGenerator;
    this.maxTddIterations = options.maxTddIterations ?? 5;
    this.maxRetries = options.maxRetries ?? 2;
  }

  /** Execute a single cell through the full lifecycle. */
  async execute(
    initialState: CellState,
    targetFiles: string[] = [],
  ): Promise<CellState> {
    let state = initialState;

    // planned → branched (auto)
    this.broadcast(state.cellId, 'branch-created', {
      branchName: `autoflow/${state.cellId}`,
      targetFiles,
    });
    state = {
      ...state,
      lifecycle: 'branched' as const,
      branchName: `autoflow/${state.cellId}`,
      dependency: 'ready',
    };

    // branched → executing (auto)
    state = { ...state, lifecycle: 'executing' as const };

    // Phase 1: Test generation
    state = await this.phaseTestgen(state, targetFiles);
    if (state.lifecycle === 'failed:non-retriable') return state;

    // Phase 2: TDD loop (implement)
    state = await this.phaseImplement(state, targetFiles);
    if (state.lifecycle === 'failed:non-retriable' || state.lifecycle === 'failed:retriable') {
      return state;
    }

    // Phase 3: Cross-review
    state = await this.phaseReview(state, targetFiles);
    return state;
  }

  /** .testgen: generate tests, commit to branch. */
  private async phaseTestgen(
    state: CellState,
    targetFiles: string[],
  ): Promise<CellState> {
    const req: CodeGenRequest = {
      cellId: state.cellId,
      cellType: state.cellType,
      description: `Cell ${state.cellId}: ${state.cellType} for ${state.versionCycle}`,
      files: targetFiles,
    };

    const result = await this.ai.generateTests(req);

    if (!result.success) {
      this.broadcast(state.cellId, 'harness-failed', {
        failures: [{
          gate: 'testgen',
          passed: false,
          durationMs: 0,
          timestamp: new Date().toISOString(),
          output: result.output,
        }],
        retriable: false,
      });
      return { ...state, lifecycle: 'failed:non-retriable' };
    }

    // Broadcast code-committed FIRST (branched → harness:pending)
    this.broadcast(state.cellId, 'code-committed', {
      commitSha: 'testgen-' + Date.now(),
      filesWritten: Object.keys(result.files),
      output: result.output,
    });

    // Then broadcast harness-started (harness:pending → harness:running)
    this.broadcast(state.cellId, 'harness-started', { phase: 'testgen' });

    return { ...state, lifecycle: 'harness:running' };
  }

  /** .implement: TDD red-green loop. */
  private async phaseImplement(
    state: CellState,
    targetFiles: string[],
  ): Promise<CellState> {
    for (let iteration = 1; iteration <= this.maxTddIterations; iteration++) {
      const req: CodeGenRequest = {
        cellId: state.cellId,
        cellType: state.cellType,
        description:
          `Implement fix for ${state.cellType} (iteration ${iteration}/${this.maxTddIterations}). Target: ${state.versionCycle}`,
        files: targetFiles,
        context: `versionCycle=${state.versionCycle}`,
      };

      const result = await this.ai.implementCode(req);

      if (result.success) {
        this.broadcast(state.cellId, 'code-committed', {
          commitSha: 'impl-' + Date.now(),
          iteration,
          filesWritten: Object.keys(result.files),
          output: result.output,
        });
        return state;
      }

      // Failed — TDD feedback loop: fix and retry
      this.broadcast(state.cellId, 'harness-failed', {
        failures: [{
          gate: `tdd-iteration-${iteration}`,
          passed: false,
          durationMs: 0,
          timestamp: new Date().toISOString(),
          output: result.output,
        }],
        retriable: true,
      });
    }

    // Max TDD iterations exceeded
    this.broadcast(state.cellId, 'max-retries-exceeded', {});
    return { ...state, lifecycle: 'failed:non-retriable' };
  }

  /** .review: multi-agent cross-review. */
  private async phaseReview(
    state: CellState,
    targetFiles: string[],
  ): Promise<CellState> {
    const req: CodeGenRequest = {
      cellId: state.cellId,
      cellType: state.cellType,
      description: `Review implementation for ${state.cellType}`,
      files: targetFiles,
      diff: 'review-diff',
    };

    const result = await this.ai.reviewCode(req);

    if (result.success) {
      this.broadcast(state.cellId, 'harness-passed', {
        results: [{
          gate: 'review',
          passed: true,
          durationMs: 0,
          timestamp: new Date().toISOString(),
          output: result.output,
        }],
      });
      return state;
    }

    // Review failed — retry implementation with feedback
    this.broadcast(state.cellId, 'harness-failed', {
      failures: [{
        gate: 'review',
        passed: false,
        durationMs: 0,
        timestamp: new Date().toISOString(),
        output: result.output,
      }],
      retriable: true,
    });
    return { ...state, lifecycle: 'failed:retriable' };
  }

  /** Broadcast an event to the Evidence Ledger (Harel). */
  private broadcast(
    cellId: string,
    type: CellEvent['type'],
    payload: Record<string, unknown>,
  ): void {
    const event: CellEvent = {
      type,
      timestamp: new Date().toISOString(),
      cellId,
      payload,
    };
    this.ledger.appendEvent(cellId, event);
  }
}
