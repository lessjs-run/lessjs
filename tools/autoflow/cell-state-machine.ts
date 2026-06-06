/**
 * Cell lifecycle state machine — v0.35.0
 *
 * Harel hierarchical state machine with 3 orthogonal dimensions.
 * Every state transition broadcasts an event → Evidence Ledger.
 *
 * Research basis:
 * - 02 Harel Statecharts (hierarchy + orthogonality + broadcast)
 * - C5 Pnueli (temporal invariants on transitions)
 * - 04 Durable Execution (events = replayable evidence)
 */

// ---- Types ----

export type CellLifecycleState =
  | 'planned'
  | 'branched'
  | 'executing'
  | 'harness:pending'
  | 'harness:running'
  | 'harness:passing'
  | 'harness:failing'
  | 'merging'
  | 'merged'
  | 'failed:retriable'
  | 'failed:non-retriable'
  | 'cancelled';

export const ALL_LIFECYCLE_STATES: readonly CellLifecycleState[] = [
  'planned',
  'branched',
  'executing',
  'harness:pending',
  'harness:running',
  'harness:passing',
  'harness:failing',
  'merging',
  'merged',
  'failed:retriable',
  'failed:non-retriable',
  'cancelled',
];

export const TERMINAL_STATES: readonly CellLifecycleState[] = [
  'merged',
  'failed:non-retriable',
  'cancelled',
];

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type DependencyState = 'blocked' | 'ready' | 'completed';

export type CellType =
  | 'version-bump'
  | 'changelog'
  | 'sop-check'
  | 'doc-align'
  | 'fmt-fix'
  | 'lint-fix'
  | 'typecheck-fix'
  | 'test-add'
  | 'readme-update'
  | 'release-note'
  | 'dep-update'
  | 'adr-write';

// ---- Cell Event Types (Harel broadcast) ----

export type CellEventType =
  | 'cell-planned'
  | 'branch-created'
  | 'code-committed'
  | 'harness-started'
  | 'harness-passed'
  | 'harness-failed'
  | 'merge-started'
  | 'merge-success'
  | 'merge-failed'
  | 'upstream-failed'
  | 'retry-started'
  | 'max-retries-exceeded'
  | 'conflict-unresolvable'
  | 'cell-cancelled';

export interface CellEvent {
  type: CellEventType;
  timestamp: string;
  cellId: string;
  payload: Record<string, unknown>;
}

// ---- Cell State ----

export interface CellState {
  cellId: string;
  lifecycle: CellLifecycleState;
  risk: RiskLevel;
  dependency: DependencyState;
  cellType: CellType;
  versionCycle: string;
  retryCount: number;
  branchName: string | null;
  lastCommitSha: string | null;
  harnessResults: HarnessGateRecord[];
  events: CellEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface HarnessGateRecord {
  gate: string;
  passed: boolean;
  durationMs: number;
  timestamp: string;
}

// ---- Legal Transitions (Harel hierarchy) ----

export const CELL_TRANSITIONS: Readonly<
  Record<CellLifecycleState, readonly CellLifecycleState[]>
> = {
  'planned': ['branched'],
  'branched': ['executing', 'cancelled'],
  'executing': ['harness:pending', 'failed:non-retriable'],
  'harness:pending': ['harness:running', 'cancelled'],
  'harness:running': ['harness:passing', 'harness:failing', 'cancelled'],
  'harness:passing': ['merging'],
  'harness:failing': ['failed:retriable', 'failed:non-retriable'],
  'merging': ['merged', 'failed:non-retriable'],
  'merged': [],
  'failed:retriable': ['branched', 'failed:non-retriable'],
  'failed:non-retriable': [],
  'cancelled': [],
};

// ---- Factory ----

export function createCellState(
  cellId: string,
  cellType: CellType,
  versionCycle: string,
  risk: RiskLevel,
): CellState {
  return {
    cellId,
    lifecycle: 'planned',
    risk,
    dependency: 'blocked',
    cellType,
    versionCycle,
    retryCount: 0,
    branchName: null,
    lastCommitSha: null,
    harnessResults: [],
    events: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ---- Event Application (deterministic state transition) ----

function assertLifecycle(
  state: CellState,
  expected: CellLifecycleState,
): void {
  if (state.lifecycle !== expected) {
    throw new Error(
      `Illegal transition: expected lifecycle '${expected}', got '${state.lifecycle}' for cell ${state.cellId}`,
    );
  }
}

function assertInStates(
  state: CellState,
  allowed: CellLifecycleState[],
): void {
  if (!allowed.includes(state.lifecycle)) {
    throw new Error(
      `Illegal transition: lifecycle '${state.lifecycle}' not in [${
        allowed.join(', ')
      }] for cell ${state.cellId}`,
    );
  }
}

export function isLegalTransition(
  from: CellLifecycleState,
  to: CellLifecycleState,
): boolean {
  const allowed = CELL_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function isTerminal(state: CellState): boolean {
  return TERMINAL_STATES.includes(state.lifecycle);
}

export function canRetry(state: CellState, maxRetries: number): boolean {
  return state.lifecycle === 'failed:retriable' && state.retryCount < maxRetries;
}

export function applyCellEvent(
  state: CellState,
  event: CellEvent,
  maxRetries = 2,
): CellState {
  const now = new Date().toISOString();
  const base = { ...state, updatedAt: now };

  switch (event.type) {
    case 'cell-planned': {
      // cell-planned is metadata: doesn't change lifecycle
      assertInStates(base, ['planned']);
      return base;
    }

    case 'branch-created': {
      assertLifecycle(base, 'planned');
      return {
        ...base,
        lifecycle: 'branched',
        branchName: event.payload.branchName as string,
        dependency: 'ready',
      };
    }

    case 'code-committed': {
      assertLifecycle(base, 'executing');
      return {
        ...base,
        lifecycle: 'harness:pending',
        lastCommitSha: event.payload.commitSha as string,
      };
    }

    case 'harness-started': {
      assertInStates(base, ['harness:pending', 'harness:running']);
      return { ...base, lifecycle: 'harness:running' };
    }

    case 'harness-passed': {
      assertLifecycle(base, 'harness:running');
      const results = (event.payload.results as HarnessGateRecord[]) ?? [];
      return { ...base, lifecycle: 'harness:passing', harnessResults: results };
    }

    case 'harness-failed': {
      assertLifecycle(base, 'harness:running');
      const failures = (event.payload.failures as HarnessGateRecord[]) ?? [];
      const allRetriable = event.payload.retriable !== false;
      return {
        ...base,
        lifecycle: allRetriable ? 'failed:retriable' : 'failed:non-retriable',
        harnessResults: failures,
      };
    }

    case 'merge-started': {
      assertLifecycle(base, 'harness:passing');
      return { ...base, lifecycle: 'merging' };
    }

    case 'merge-success': {
      assertLifecycle(base, 'merging');
      return {
        ...base,
        lifecycle: 'merged',
        dependency: 'completed',
      };
    }

    case 'merge-failed': {
      assertLifecycle(base, 'merging');
      const retriable = event.payload.retriable !== false;
      return {
        ...base,
        lifecycle: retriable ? 'failed:retriable' : 'failed:non-retriable',
      };
    }

    case 'upstream-failed': {
      // Cascade cancellation — upstream failure
      return { ...base, lifecycle: 'cancelled' };
    }

    case 'retry-started': {
      assertLifecycle(base, 'failed:retriable');
      if (base.retryCount >= maxRetries) {
        return { ...base, lifecycle: 'failed:non-retriable' };
      }
      return {
        ...base,
        lifecycle: 'branched',
        retryCount: base.retryCount + 1,
        branchName: null,
        lastCommitSha: null,
        harnessResults: [],
      };
    }

    case 'max-retries-exceeded': {
      assertLifecycle(base, 'failed:retriable');
      return { ...base, lifecycle: 'failed:non-retriable' };
    }

    case 'conflict-unresolvable': {
      return { ...base, lifecycle: 'failed:non-retriable' };
    }

    case 'cell-cancelled': {
      if (isTerminal(base)) {
        throw new Error(
          `Cannot cancel terminal cell ${base.cellId} (state: ${base.lifecycle})`,
        );
      }
      return { ...base, lifecycle: 'cancelled' };
    }

    default:
      throw new Error(`Unknown event type: ${(event as CellEvent).type}`);
  }
}
