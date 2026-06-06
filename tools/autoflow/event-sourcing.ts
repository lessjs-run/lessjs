/**
 * Event sourcing primitives — v0.35.0
 *
 * Durable Execution (paper 04): deterministic replay of event streams.
 * Events are append-only. State is derived from events.
 *
 * Kahn principle (C6): events are the communication channel between modules.
 * Harel principle (02): each lifecycle transition broadcasts an event.
 */
import type { CellEvent, CellState } from './cell-state-machine.ts';
import { applyCellEvent, createCellState } from './cell-state-machine.ts';

// ---- Event file format ----

/**
 * Read events from a JSONL file.
 * Each line is a JSON-serialized CellEvent.
 */
export function readEvents(path: string): CellEvent[] {
  try {
    const text = Deno.readTextFileSync(path);
    if (text.trim().length === 0) return [];
    return text.trim().split('\n').map((line) => JSON.parse(line) as CellEvent);
  } catch {
    return [];
  }
}

/**
 * Write a single event to a JSONL file (append-only).
 */
export function appendEvent(path: string, event: CellEvent): void {
  const line = JSON.stringify(event) + '\n';
  Deno.writeTextFileSync(path, line, { append: true, create: true });
}

// ---- Replay engine ----

/**
 * Rebuild CellState from event stream (Durable Execution replay).
 * Deterministic: given same events → same state.
 */
export function replayEvents(
  cellId: string,
  cellType: string,
  versionCycle: string,
  risk: string,
  events: CellEvent[],
  maxRetries = 2,
): CellState {
  let state = createCellState(
    cellId,
    (cellType as string) === 'version-bump'
      ? 'version-bump'
      : (cellType as string) === 'changelog'
      ? 'changelog'
      : (cellType as string) === 'sop-check'
      ? 'sop-check'
      : (cellType as string) === 'doc-align'
      ? 'doc-align'
      : (cellType as string) === 'fmt-fix'
      ? 'fmt-fix'
      : (cellType as string) === 'lint-fix'
      ? 'lint-fix'
      : (cellType as string) === 'typecheck-fix'
      ? 'typecheck-fix'
      : (cellType as string) === 'test-add'
      ? 'test-add'
      : (cellType as string) === 'readme-update'
      ? 'readme-update'
      : (cellType as string) === 'release-note'
      ? 'release-note'
      : (cellType as string) === 'dep-update'
      ? 'dep-update'
      : (cellType as string) === 'adr-write'
      ? 'adr-write'
      : 'version-bump',
    versionCycle,
    (risk as string) === 'low'
      ? 'low'
      : (risk as string) === 'medium'
      ? 'medium'
      : (risk as string) === 'high'
      ? 'high'
      : (risk as string) === 'critical'
      ? 'critical'
      : 'low',
  );

  const history: CellEvent[] = [];

  for (const event of events) {
    state = applyCellEvent(state, event, maxRetries);
    history.push(event);
  }

  return { ...state, events: history };
}

/**
 * Serialize CellState to JSON (for state.json cache).
 */
export function serializeState(state: CellState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Deserialize CellState from JSON.
 */
export function deserializeState(json: string): CellState {
  return JSON.parse(json) as CellState;
}
