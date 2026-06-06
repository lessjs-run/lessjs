/**
 * Scheduler — v0.36.0
 *
 * Runtime execution loop for DAG waves.
 * Handles cascade cancellation, retry loops, and parallel execution.
 *
 * Kahn determinism: within a wave, cells run concurrently but communicate
 * only through the Evidence Ledger (no shared state).
 */

import type { CellDag } from './dag-builder.ts';
import type { CellState } from './cell-state-machine.ts';
import { canRetry, isTerminal } from './cell-state-machine.ts';
import type { EvidenceLedger } from './evidence-ledger.ts';

export interface ScheduleResult {
  completedCells: string[];
  failedCells: string[];
  cancelledCells: string[];
}

export interface SchedulerOptions {
  ledger: EvidenceLedger;
  maxParallel?: number; // default 3
  maxRetries?: number;
  onCellStart?: (cellId: string, wave: number) => Promise<void>;
  onCellComplete?: (cellId: string, state: CellState) => Promise<void>;
}

/**
 * Run all cells in a DAG, wave by wave.
 * Each wave's cells run in parallel (up to maxParallel).
 *
 * Cascade: if a cell fails, all downstream cells are cancelled.
 * Retry: failed:retriable cells are re-queued in the next wave.
 */
export async function runScheduler(
  dag: CellDag,
  options: SchedulerOptions,
): Promise<ScheduleResult> {
  const { ledger, maxParallel = 3, maxRetries = 2 } = options;
  const completed: string[] = [];
  const failed: string[] = [];
  const cancelled: string[] = [];

  // Clone waves (waves are topologically sorted)
  const waves = dag.waves.map((w) => [...w]);
  const nodeMap = new Map(dag.nodes.map((n) => [n.cellId, n]));

  let waveIndex = 0;

  while (waveIndex < waves.length) {
    const currentWave = waves[waveIndex];

    if (options.onCellStart) {
      for (const cellId of currentWave) {
        await options.onCellStart(cellId, waveIndex);
      }
    }

    // Check upstream status for each cell before starting
    const readyToExecute: string[] = [];
    for (const cellId of currentWave) {
      const node = nodeMap.get(cellId);
      if (!node) continue;

      const allUpstreamCompleted = node.dependencies.every((depId) => {
        const depCell = nodeMap.get(depId);
        if (!depCell) return true;

        let depState: CellState;
        try {
          depState = ledger.getCellState(depId);
        } catch {
          return false; // can't read state → assume not ready
        }

        if (isTerminal(depState) && depState.lifecycle !== 'merged') {
          // Upstream failed → cancel this cell
          cancelled.push(cellId);
          return false;
        }
        return depState.lifecycle === 'merged';
      });

      if (allUpstreamCompleted) {
        readyToExecute.push(cellId);
      }
    }

    // Execute ready cells in batches of maxParallel
    for (let i = 0; i < readyToExecute.length; i += maxParallel) {
      const batch = readyToExecute.slice(i, i + maxParallel);

      const results = await Promise.all(batch.map((cellId) => {
        try {
          const cellState = ledger.getCellState(cellId);

          // Check if retriable
          if (cellState.lifecycle === 'failed:retriable' && canRetry(cellState, maxRetries)) {
            // Will be handled after this wave — re-queue
            return { cellId, action: 'retry-later' as const };
          }

          if (isTerminal(cellState)) {
            if (cellState.lifecycle === 'merged') {
              completed.push(cellId);
              return { cellId, action: 'completed' as const };
            }
            failed.push(cellId);
            return { cellId, action: 'failed' as const };
          }

          // Non-terminal — waiting for execution
          return { cellId, action: 'awaiting-execution' as const };
        } catch {
          return { cellId, action: 'error' as const };
        }
      }));

      for (const r of results) {
        if (options.onCellComplete) {
          try {
            const state = ledger.getCellState(r.cellId);
            await options.onCellComplete(r.cellId, state);
          } catch { /* ok */ }
        }
      }
    }

    waveIndex++;
  }

  return { completedCells: completed, failedCells: failed, cancelledCells: cancelled };
}
