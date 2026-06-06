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
    // deno-lint-ignore no-explicit-any -- cellType from ledger may be string
    cellType as any,
    versionCycle,
    // deno-lint-ignore no-explicit-any
    risk as any,
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
