/**
 * Evolution Metrics — v0.35.0
 *
 * AlphaEvolve-style fitness scoring (A1) + SWE-bench multi-dimensional
 * metrics (09). Lehman complexity tracking (C3).
 *
 * v0.35 is the baseline — first version with metrics infrastructure.
 * Actual data collection begins at v0.36 development.
 */

import type { CellState } from './cell-state-machine.ts';

export interface EvolutionMetrics {
  versionCycle: string;
  timestamp: string;

  // AlphaEvolve-style fitness
  firstPassRate: number;
  avgRetriesPerCell: number;
  totalCellsAttempted: number;
  totalCellsMerged: number;
  totalCellsFailed: number;

  // Velocity
  driftDetectionLatencyMs: number;
  fromDriftToMergeMs: number;
  totalCycleDurationMs: number;

  // Quality
  harnessPassRate: Record<string, number>;
  mergeConflictsEncountered: number;
  rollbacks: number;

  // Lehman complexity (C3)
  governanceDocLines: number;
  sopTaskCount: number;
  adrCount: number;
  packageCount: number;

  // SWE-bench-style multi-dimensional (09)
  gateScore: number; // 0-1, weighted average of all 12 gates
  mechanicalAutonomyScore: number; // proportion of cells that completed without human intervention
}

export function createBaselineMetrics(
  versionCycle: string,
  governanceDocLines: number,
  sopTaskCount: number,
  adrCount: number,
  packageCount: number,
): EvolutionMetrics {
  return {
    versionCycle,
    timestamp: new Date().toISOString(),
    firstPassRate: 0,
    avgRetriesPerCell: 0,
    totalCellsAttempted: 0,
    totalCellsMerged: 0,
    totalCellsFailed: 0,
    driftDetectionLatencyMs: 0,
    fromDriftToMergeMs: 0,
    totalCycleDurationMs: 0,
    harnessPassRate: {},
    mergeConflictsEncountered: 0,
    rollbacks: 0,
    governanceDocLines,
    sopTaskCount,
    adrCount,
    packageCount,
    gateScore: 0,
    mechanicalAutonomyScore: 0,
  };
}

export function computeCellMetrics(cells: CellState[]): Pick<
  EvolutionMetrics,
  | 'firstPassRate'
  | 'avgRetriesPerCell'
  | 'totalCellsAttempted'
  | 'totalCellsMerged'
  | 'totalCellsFailed'
> {
  const attempted = cells.length;
  const merged = cells.filter((c) => c.lifecycle === 'merged').length;
  const failed =
    cells.filter((c) => c.lifecycle === 'failed:non-retriable' || c.lifecycle === 'cancelled')
      .length;
  const firstPass = cells.filter((c) => c.lifecycle === 'merged' && c.retryCount === 0).length;
  const totalRetries = cells.reduce((sum, c) => sum + c.retryCount, 0);

  return {
    firstPassRate: attempted > 0 ? firstPass / attempted : 0,
    avgRetriesPerCell: attempted > 0 ? totalRetries / attempted : 0,
    totalCellsAttempted: attempted,
    totalCellsMerged: merged,
    totalCellsFailed: failed,
  };
}
