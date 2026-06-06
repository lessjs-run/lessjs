/**
 * Evolution Tracker — v0.35.0
 *
 * Tracks evolution quality across version cycles.
 * Stores metrics.json per cycle in docs/autoflow/metrics/.
 *
 * Lehman Second Law (C3): tracks complexity growth.
 * AlphaEvolve (A1): tracks fitness improvement across cycles.
 */
import type { EvolutionMetrics } from './metrics.ts';
import { createBaselineMetrics } from './metrics.ts';
import type { EvidenceLedger } from './evidence-ledger.ts';

export interface CycleRecord {
  version: string;
  metrics: EvolutionMetrics;
  startTimestamp: string;
  endTimestamp: string | null;
  status: 'in-progress' | 'completed';
}

export class EvolutionTracker {
  private metricsDir: string;
  private ledger: EvidenceLedger | null;

  constructor(projectRoot: string, ledger: EvidenceLedger | null = null) {
    this.metricsDir = `${projectRoot}/docs/autoflow/metrics`;
    this.ledger = ledger;
    try {
      Deno.mkdirSync(this.metricsDir, { recursive: true });
    } catch { /* ok */ }
  }

  /** Start tracking a new version cycle. */
  startCycle(version: string, projectRoot: string): CycleRecord {
    // Count governance doc lines
    let docLines = 0;
    const docPaths = ['docs/status/STATUS.md', 'docs/roadmap/ROADMAP.md'];
    for (const p of docPaths) {
      try {
        docLines += Deno.readTextFileSync(`${projectRoot}/${p}`).split('\n').length;
      } catch { /* ok */ }
    }

    // Count SOP tasks
    let sopTasks = 0;
    try {
      const sopPath = `${projectRoot}/docs/sop/${version}/README.md`;
      const sop = Deno.readTextFileSync(sopPath);
      sopTasks = (sop.match(/^- \[[ x]\]/gm) || []).length;
    } catch { /* ok */ }
    // Count ADRs
    let adrCount = 0;
    try {
      adrCount = [...Deno.readDirSync(`${projectRoot}/docs/adr`)].filter(
        (e) => e.isFile && e.name.startsWith('ADR-'),
      ).length;
    } catch { /* ok */ }

    const metrics = createBaselineMetrics(version, docLines, sopTasks, adrCount, 19);
    const record: CycleRecord = {
      version,
      metrics,
      startTimestamp: new Date().toISOString(),
      endTimestamp: null,
      status: 'in-progress',
    };

    this.saveRecord(record);
    return record;
  }

  /** Complete a version cycle: compute final metrics from cell data. */
  completeCycle(version: string): CycleRecord | null {
    const path = `${this.metricsDir}/${version}.json`;
    let record: CycleRecord;
    try {
      record = JSON.parse(Deno.readTextFileSync(path)) as CycleRecord;
    } catch {
      return null;
    }

    record.endTimestamp = new Date().toISOString();
    record.status = 'completed';

    // Compute cell metrics from ledger
    if (this.ledger) {
      const cells = this.ledger.listCells()
        .map((id) => this.ledger!.getCellState(id))
        .filter((c) => c.versionCycle === version);

      if (cells.length > 0) {
        const merged = cells.filter((c) => c.lifecycle === 'merged').length;
        const attempted = cells.length;
        const firstPass = cells.filter((c) =>
          c.lifecycle === 'merged' && c.retryCount === 0
        ).length;
        const totalRetries = cells.reduce((s, c) => s + c.retryCount, 0);

        record.metrics.totalCellsAttempted = attempted;
        record.metrics.totalCellsMerged = merged;
        record.metrics.totalCellsFailed = attempted - merged;
        record.metrics.firstPassRate = attempted > 0 ? firstPass / attempted : 0;
        record.metrics.avgRetriesPerCell = attempted > 0 ? totalRetries / attempted : 0;
        record.metrics.mechanicalAutonomyScore = record.metrics.totalCellsAttempted > 0
          ? record.metrics.totalCellsMerged / record.metrics.totalCellsAttempted
          : 0;
      }
    }

    this.saveRecord(record);
    return record;
  }

  /** Load metrics for a specific version. */
  loadCycle(version: string): CycleRecord | null {
    try {
      return JSON.parse(
        Deno.readTextFileSync(`${this.metricsDir}/${version}.json`),
      ) as CycleRecord;
    } catch {
      return null;
    }
  }

  /** List all recorded cycles. */
  listCycles(): CycleRecord[] {
    try {
      return [...Deno.readDirSync(this.metricsDir)]
        .filter((e) => e.isFile && e.name.endsWith('.json'))
        .map((e) => this.loadCycle(e.name.replace('.json', '')))
        .filter((r): r is CycleRecord => r !== null)
        .sort((a, b) => a.version.localeCompare(b.version));
    } catch {
      return [];
    }
  }

  /** Compute trend across multiple cycles. */
  getTrend(): {
    complexity: number[];
    firstPassRate: number[];
    mechanicalAutonomy: number[];
  } {
    const cycles = this.listCycles();
    return {
      complexity: cycles.map((c) => c.metrics.governanceDocLines),
      firstPassRate: cycles.map((c) => c.metrics.firstPassRate),
      mechanicalAutonomy: cycles.map((c) => c.metrics.mechanicalAutonomyScore),
    };
  }

  private saveRecord(record: CycleRecord): void {
    const path = `${this.metricsDir}/${record.version}.json`;
    Deno.writeTextFileSync(path, JSON.stringify(record, null, 2) + '\n');
  }
}
