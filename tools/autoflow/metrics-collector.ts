/**
 * Metrics Collector — v0.35.6
 *
 * Collects real execution data from the Evidence Ledger and computes
 * EvolutionMetrics for the L3 Evolution Loop.
 *
 * Data sources:
 *   - Evidence Ledger: cell counts, firstPassRate, retries, merged
 *   - HarnessGateRecord: gate pass/fail rates, gate durations
 *   - Cell events: drift detection latency, cycle duration
 *
 * Used by mod-evolve.ts after cell execution to populate evolution-tracker.
 */

import type { EvidenceLedger } from './evidence-ledger.ts';
import type { EvolutionMetrics } from './metrics.ts';
import { computeCellMetrics, createBaselineMetrics } from './metrics.ts';
import type { CellState } from './cell-state-machine.ts';

/** Gate result extracted from cell evidence. */
interface GateEvidence {
  gate: string;
  passed: boolean;
  durationMs: number;
}

/** Full metrics collection result. */
export interface CollectionResult {
  cellMetrics: ReturnType<typeof computeCellMetrics>;
  gateMetrics: GateCollectionResult;
  fullMetrics: EvolutionMetrics;
}

export interface GateCollectionResult {
  totalGatesRun: number;
  totalGatesPassed: number;
  totalGatesFailed: number;
  gateScore: number; // 0-1
  perGate: Record<string, { passed: number; failed: number; avgDurationMs: number }>;
}

// ---- MetricsCollector ----

export class MetricsCollector {
  private ledger: EvidenceLedger;
  private projectRoot: string;

  constructor(ledger: EvidenceLedger, projectRoot: string) {
    this.ledger = ledger;
    this.projectRoot = projectRoot;
  }

  /** Collect cell-level metrics from Evidence Ledger. */
  collectCellMetrics(version: string): ReturnType<typeof computeCellMetrics> {
    const cells = this.getCellsForVersion(version);
    return computeCellMetrics(cells);
  }

  /** Collect gate-level metrics from cell evidence. */
  collectGateMetrics(version: string): GateCollectionResult {
    const cells = this.getCellsForVersion(version);
    const perGate: Record<string, { passed: number; failed: number; totalDurationMs: number }> = {};

    let totalRun = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    for (const cell of cells) {
      // Extract gate results from harnessResults
      for (const result of cell.harnessResults) {
        if (!perGate[result.gate]) {
          perGate[result.gate] = { passed: 0, failed: 0, totalDurationMs: 0 };
        }

        if (result.passed) {
          perGate[result.gate].passed++;
          totalPassed++;
        } else {
          perGate[result.gate].failed++;
          totalFailed++;
        }
        perGate[result.gate].totalDurationMs += result.durationMs;
        totalRun++;
      }

      // Also extract gate results from events (harness-passed/harness-failed)
      for (const event of cell.events) {
        if (event.type === 'harness-passed' || event.type === 'harness-failed') {
          const results = event.payload.results as GateEvidence[] | undefined;
          const failures = event.payload.failures as GateEvidence[] | undefined;

          for (const r of results ?? []) {
            if (!perGate[r.gate]) {
              perGate[r.gate] = { passed: 0, failed: 0, totalDurationMs: 0 };
            }
            perGate[r.gate].passed++;
            totalPassed++;
            totalRun++;
          }

          for (const f of failures ?? []) {
            if (!perGate[f.gate]) {
              perGate[f.gate] = { passed: 0, failed: 0, totalDurationMs: 0 };
            }
            perGate[f.gate].failed++;
            totalFailed++;
            totalRun++;
          }
        }
      }
    }

    // Compute averages
    const perGateAvg: GateCollectionResult['perGate'] = {};
    for (const [gate, data] of Object.entries(perGate)) {
      const total = data.passed + data.failed;
      perGateAvg[gate] = {
        passed: data.passed,
        failed: data.failed,
        avgDurationMs: total > 0 ? Math.round(data.totalDurationMs / total) : 0,
      };
    }

    const gateScore = totalRun > 0 ? totalPassed / totalRun : 0;

    return {
      totalGatesRun: totalRun,
      totalGatesPassed: totalPassed,
      totalGatesFailed: totalFailed,
      gateScore,
      perGate: perGateAvg,
    };
  }

  /** Compute full EvolutionMetrics combining all data sources. */
  collectFullMetrics(
    version: string,
    governanceDocLines: number,
    sopTaskCount: number,
    adrCount: number,
    packageCount: number,
  ): CollectionResult {
    const cellMetrics = this.collectCellMetrics(version);
    const gateMetrics = this.collectGateMetrics(version);

    // Merge cell metrics with baseline to produce full EvolutionMetrics
    const baseline = createBaselineMetrics(
      version,
      governanceDocLines,
      sopTaskCount,
      adrCount,
      packageCount,
    );

    const fullMetrics: EvolutionMetrics = {
      ...baseline,
      ...cellMetrics,
      gateScore: gateMetrics.gateScore,
      mechanicalAutonomyScore: cellMetrics.totalCellsAttempted > 0
        ? cellMetrics.totalCellsMerged / cellMetrics.totalCellsAttempted
        : 0,
    };

    return {
      cellMetrics,
      gateMetrics,
      fullMetrics,
    };
  }

  /** Get all cell states for a specific version cycle. */
  private getCellsForVersion(version: string): CellState[] {
    return this.ledger.listCells()
      .map((id) => {
        try {
          return this.ledger.getCellState(id);
        } catch {
          return null;
        }
      })
      .filter((c): c is CellState => c !== null && c.versionCycle === version);
  }
}
