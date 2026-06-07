/**
 * Record v0.35.6 evolution cycle metrics.
 * Run: deno run --allow-read --allow-write tools/record-evolution.ts
 */
import { EvolutionTracker } from './autoflow/evolution-tracker.ts';
import { EvidenceLedger } from './autoflow/evidence-ledger.ts';

const root = Deno.cwd();
const ledger = new EvidenceLedger(`${root}/docs/autoflow/cells`);
const tracker = new EvolutionTracker(root, ledger);

// Start the cycle
const start = tracker.startCycle('v0.36.0', root);
console.log(`Cycle started: ${start.version}`);

// Complete the cycle (collects metrics from ledger)
const complete = tracker.completeCycle('v0.36.0');
if (complete) {
  console.log(`Cycle completed: ${complete.version}`);
  console.log(`Metrics:`);
  console.log(`  firstPassRate: ${(complete.metrics.firstPassRate * 100).toFixed(1)}%`);
  console.log(`  cellsAttempted: ${complete.metrics.totalCellsAttempted}`);
  console.log(`  cellsMerged: ${complete.metrics.totalCellsMerged}`);
  console.log(`  cellsFailed: ${complete.metrics.totalCellsFailed}`);
  console.log(`  autonomyScore: ${(complete.metrics.mechanicalAutonomyScore * 100).toFixed(1)}%`);
  console.log(`  gateScore: ${complete.metrics.gateScore.toFixed(2)}`);
  console.log(`  governanceDocLines: ${complete.metrics.governanceDocLines}`);
  console.log(`  adrCount: ${complete.metrics.adrCount}`);
  console.log(`  packageCount: ${complete.metrics.packageCount}`);
} else {
  console.log('Could not complete cycle.');
}
