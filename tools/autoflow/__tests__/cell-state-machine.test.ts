/**
 * Cell state machine tests — v0.35.0
 *
 * Covers: all legal transitions, terminal state stability,
 * retry logic, cascade cancellation, and the full happy path.
 */
import { assert, assertEquals, assertFalse, assertThrows } from 'jsr:@std/assert@^1.0.0';
import {
  ALL_LIFECYCLE_STATES,
  applyCellEvent,
  canRetry,
  CELL_TRANSITIONS,
  type CellEvent,
  type CellLifecycleState,
  createCellState,
  isLegalTransition,
  isTerminal,
  TERMINAL_STATES,
} from '../cell-state-machine.ts';

function makeEvent(
  type: CellEvent['type'],
  payload: Record<string, unknown> = {},
  cellId = 'cell-001',
): CellEvent {
  return { type, timestamp: new Date().toISOString(), cellId, payload };
}

// ---- Legal transitions ----

for (const [from, toList] of Object.entries(CELL_TRANSITIONS)) {
  for (const to of toList) {
    Deno.test(`cell: legal transition ${from} → ${to}`, () => {
      assert(isLegalTransition(from as CellLifecycleState, to));
    });
  }
}

// ---- Terminal states ----

for (const terminal of TERMINAL_STATES) {
  Deno.test(`cell: ${terminal} is terminal`, () => {
    const state = createCellState('test', 'version-bump', 'v0.35.0', 'low');
    // Force the state
    const terminalState = { ...state, lifecycle: terminal };
    assert(isTerminal(terminalState));
  });
}

for (const nonTerminal of ALL_LIFECYCLE_STATES.filter((s) => !TERMINAL_STATES.includes(s))) {
  Deno.test(`cell: ${nonTerminal} is not terminal`, () => {
    const state = createCellState('test', 'version-bump', 'v0.35.0', 'low');
    const ntState = { ...state, lifecycle: nonTerminal };
    assertFalse(isTerminal(ntState));
  });
}

// ---- Full happy path ----

Deno.test('cell: full happy path planned → merged', () => {
  const state = createCellState('cell-001', 'version-bump', 'v0.35.0', 'low');

  let s = applyCellEvent(
    state,
    makeEvent('branch-created', { branchName: 'autoflow/cell-v0.35.0-001' }),
  );
  assertEquals(s.lifecycle, 'branched');

  // Manually advance to executing (in real flow, AI does this)
  s = { ...s, lifecycle: 'executing' };

  s = applyCellEvent(s, makeEvent('code-committed', { commitSha: 'abc123' }));
  assertEquals(s.lifecycle, 'harness:pending');

  s = applyCellEvent(s, makeEvent('harness-started'));
  assertEquals(s.lifecycle, 'harness:running');

  s = applyCellEvent(
    s,
    makeEvent('harness-passed', {
      results: [{ gate: 'fmt:check', passed: true, durationMs: 100, timestamp: s.updatedAt }],
    }),
  );
  assertEquals(s.lifecycle, 'harness:passing');

  s = applyCellEvent(s, makeEvent('merge-started'));
  assertEquals(s.lifecycle, 'merging');

  s = applyCellEvent(s, makeEvent('merge-success', { mergeSha: 'def456' }));
  assertEquals(s.lifecycle, 'merged');
  assertEquals(s.dependency, 'completed');
  assert(isTerminal(s));
});

// ---- Harness failure + retry ----

Deno.test('cell: harness failure → retry → success', () => {
  const state = createCellState('cell-002', 'changelog', 'v0.35.0', 'low');
  let s: typeof state = { ...state, lifecycle: 'harness:running' };

  s = applyCellEvent(
    s,
    makeEvent('harness-failed', {
      failures: [{ gate: 'lint', passed: false, durationMs: 50, timestamp: s.updatedAt }],
      retriable: true,
    }),
  );
  assertEquals(s.lifecycle, 'failed:retriable');
  assertEquals(s.retryCount, 0);

  // Retry
  s = applyCellEvent(s, makeEvent('retry-started'));
  assertEquals(s.lifecycle, 'branched');
  assertEquals(s.retryCount, 1);
  assertEquals(s.branchName, null); // reset on retry
});

// ---- Max retries ----

Deno.test('cell: max retries exceeded → non-retriable', () => {
  const state = createCellState('cell-003', 'fmt-fix', 'v0.35.0', 'low');
  let s: typeof state = {
    ...state,
    lifecycle: 'failed:retriable',
    retryCount: 1,
  };

  // This should be the last retry (maxRetries=2 default)
  s = applyCellEvent(s, makeEvent('retry-started'));
  assertEquals(s.lifecycle, 'branched');
  assertEquals(s.retryCount, 2);

  // Fail again
  s = { ...s, lifecycle: 'harness:running' };
  s = applyCellEvent(
    s,
    makeEvent('harness-failed', {
      failures: [{ gate: 'lint', passed: false, durationMs: 50, timestamp: s.updatedAt }],
    }),
  );
  assertEquals(s.lifecycle, 'failed:retriable');

  // retry-started with retryCount >= maxRetries → non-retriable
  s = applyCellEvent(s, makeEvent('retry-started'));
  assertEquals(s.lifecycle, 'failed:non-retriable');
  assert(isTerminal(s));
});

// ---- Cascade cancellation ----

Deno.test('cell: upstream failure → cancelled', () => {
  const state = createCellState('cell-004', 'changelog', 'v0.35.0', 'low');
  let s: typeof state = { ...state, lifecycle: 'branched' };

  s = applyCellEvent(s, makeEvent('upstream-failed', { upstreamId: 'cell-001' }));
  assertEquals(s.lifecycle, 'cancelled');
  assert(isTerminal(s));
});

// ---- Cannot cancel terminal ----

Deno.test('cell: cannot cancel a merged cell', () => {
  const state = createCellState('cell-005', 'version-bump', 'v0.35.0', 'low');
  const merged = { ...state, lifecycle: 'merged' as const };
  assertThrows(() => applyCellEvent(merged, makeEvent('cell-cancelled')));
});

// ---- Retry resets branch and harness ----

Deno.test('cell: retry resets branch name and commit sha', () => {
  const state = createCellState('cell-006', 'lint-fix', 'v0.35.0', 'low');
  const failed: typeof state = {
    ...state,
    lifecycle: 'failed:retriable',
    branchName: 'autoflow/cell-v0.35.0-006',
    lastCommitSha: 'abc123',
    harnessResults: [{ gate: 'lint', passed: false, durationMs: 50, timestamp: state.updatedAt }],
  };

  const retried = applyCellEvent(failed, makeEvent('retry-started'));
  assertEquals(retried.branchName, null);
  assertEquals(retried.lastCommitSha, null);
  assertEquals(retried.harnessResults.length, 0);
});

// ---- canRetry ----

Deno.test('cell: canRetry when retriable and under limit', () => {
  const state = createCellState('cell-007', 'lint-fix', 'v0.35.0', 'low');
  const retriable = { ...state, lifecycle: 'failed:retriable' as const, retryCount: 0 };
  assert(canRetry(retriable, 2));
});

Deno.test('cell: cannot retry when at max retries', () => {
  const state = createCellState('cell-007', 'lint-fix', 'v0.35.0', 'low');
  const atMax = { ...state, lifecycle: 'failed:retriable' as const, retryCount: 2 };
  assertFalse(canRetry(atMax, 2));
});

Deno.test('cell: cannot retry non-retriable failure', () => {
  const state = createCellState('cell-007', 'lint-fix', 'v0.35.0', 'low');
  const nonRetriable = { ...state, lifecycle: 'failed:non-retriable' as const };
  assertFalse(canRetry(nonRetriable, 2));
});

// ---- createCellState defaults ----

Deno.test('cell: createCellState initializes correctly', () => {
  const state = createCellState('cell-008', 'version-bump', 'v0.35.0', 'low');
  assertEquals(state.cellId, 'cell-008');
  assertEquals(state.lifecycle, 'planned');
  assertEquals(state.risk, 'low');
  assertEquals(state.dependency, 'blocked');
  assertEquals(state.cellType, 'version-bump');
  assertEquals(state.versionCycle, 'v0.35.0');
  assertEquals(state.retryCount, 0);
  assertEquals(state.branchName, null);
  assertEquals(state.lastCommitSha, null);
  assertEquals(state.harnessResults.length, 0);
});

// ---- createCellState for all risk levels ----

for (const risk of ['low', 'medium', 'high', 'critical'] as const) {
  Deno.test(`cell: createCellState with risk=${risk}`, () => {
    const state = createCellState('cell-r', 'version-bump', 'v0.35.0', risk);
    assertEquals(state.risk, risk);
  });
}
