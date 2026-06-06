/**
 * Evidence Ledger — v0.35.0
 *
 * Kahn communication channel + Durable Execution event store.
 * Each cell has: events.jsonl (append-only) + state.json (derived cache).
 *
 * Kahn principle (C6): the ledger is the ONLY communication channel
 * between parallel cells. No shared mutable state.
 *
 * Durable Execution (04): state is always reconstructible from events.
 */
import type { CellEvent, CellState } from './cell-state-machine.ts';
import {
  appendEvent,
  deserializeState,
  readEvents,
  replayEvents,
  serializeState,
} from './event-sourcing.ts';

export class EvidenceLedger {
  private ledgerDir: string;

  constructor(ledgerDir: string) {
    this.ledgerDir = ledgerDir;
    this.ensureDir();
  }

  private ensureDir(): void {
    try {
      Deno.mkdirSync(this.ledgerDir, { recursive: true });
    } catch {
      // already exists
    }
  }

  private cellDir(cellId: string): string {
    const dir = `${this.ledgerDir}/${cellId}`;
    try {
      Deno.mkdirSync(dir, { recursive: true });
    } catch {
      // already exists
    }
    return dir;
  }

  eventsPath(cellId: string): string {
    return `${this.cellDir(cellId)}/events.jsonl`;
  }

  statePath(cellId: string): string {
    return `${this.cellDir(cellId)}/state.json`;
  }

  /** Append one event to the event stream (Harel broadcast). */
  appendEvent(cellId: string, event: CellEvent, rebuild = false): void {
    appendEvent(this.eventsPath(cellId), event);
    if (rebuild) this.rebuildState(cellId);
  }

  /** Read all events for a cell. */
  readAllEvents(cellId: string): CellEvent[] {
    return readEvents(this.eventsPath(cellId));
  }

  /** Rebuild CellState from event stream. */
  rebuildState(
    cellId: string,
    cellType = 'version-bump',
    versionCycle = 'unknown',
    risk = 'low',
    maxRetries = 2,
  ): CellState {
    const events = this.readAllEvents(cellId);
    if (events.length === 0) {
      throw new Error(`No events found for cell ${cellId}`);
    }
    // Use metadata from first event if available
    const firstPayload = events[0].payload;
    const ct = (firstPayload.cellType as string) ?? cellType;
    const vc = (firstPayload.versionCycle as string) ?? versionCycle;
    const rk = (firstPayload.risk as string) ?? risk;

    const state = replayEvents(cellId, ct, vc, rk, events, maxRetries);

    // Cache
    const statePath = this.statePath(cellId);
    Deno.writeTextFileSync(statePath, serializeState(state));

    return state;
  }

  /** Get current cell state (cached or rebuilt). */
  getCellState(
    cellId: string,
    cellType?: string,
    versionCycle?: string,
    risk?: string,
  ): CellState {
    const statePath = this.statePath(cellId);
    try {
      return deserializeState(Deno.readTextFileSync(statePath));
    } catch {
      return this.rebuildState(cellId, cellType, versionCycle, risk);
    }
  }

  /** List all cell IDs in the ledger. */
  listCells(): string[] {
    try {
      return [...Deno.readDirSync(this.ledgerDir)]
        .filter((e) => e.isDirectory)
        .map((e) => e.name);
    } catch {
      return [];
    }
  }
}
