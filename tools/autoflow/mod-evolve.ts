/**
 * autoflow:evolve — v0.35.6 Cell Execution CLI
 *
 * Executes the full autoflow evolution pipeline:
 *   1. Read governance docs → detect drift
 *   2. Build Cell DAG from evidence
 *   3. Execute cells in waves (testgen → implement → review)
 *   4. Collect metrics via Evolution Tracker
 *   5. Report results
 *
 * Usage:
 *   deno run --allow-read tools/autoflow/mod-evolve.ts --dry-run
 *   deno run --allow-read --allow-write --allow-run tools/autoflow/mod-evolve.ts
 *   deno run --allow-read --allow-write --allow-run tools/autoflow/mod-evolve.ts --cell <cellId>
 */

import { readStatus } from './readers/status.ts';
import { readPackageGraph } from './readers/package-graph.ts';
import { buildDag, type DagNode } from './dag-builder.ts';
import { EvidenceLedger } from './evidence-ledger.ts';
import {
  CellExecutor,
  type CodeGenerator,
  type CodeGenRequest,
  type CodeGenResult,
} from './executor.ts';
import { AgentCodeGenerator, type RiskLevel } from './agent-code-generator.ts';
import { EvolutionTracker } from './evolution-tracker.ts';
import { createCellState } from './cell-state-machine.ts';

/** Mock code generator for dry-run mode. Returns empty success. */
class DryRunGenerator implements CodeGenerator {
  generateTests(_req: CodeGenRequest): Promise<CodeGenResult> {
    return Promise.resolve({ success: true, files: {}, output: '[dry-run] tests generated' });
  }
  implementCode(_req: CodeGenRequest): Promise<CodeGenResult> {
    return Promise.resolve({
      success: true,
      files: {},
      output: '[dry-run] implementation complete',
    });
  }
  reviewCode(_req: CodeGenRequest): Promise<CodeGenResult> {
    return Promise.resolve({ success: true, files: {}, output: '[dry-run] review passed' });
  }
}

function detectDriftAndBuildCells(
  statusVersion: string,
  packageGraph: ReturnType<typeof readPackageGraph>,
  rootDir: string,
): Omit<DagNode, 'dependencies' | 'dependents' | 'priority'>[] {
  const cells: Omit<DagNode, 'dependencies' | 'dependents' | 'priority'>[] = [];
  let idx = 0;

  const cellPrefix = `cell-${statusVersion}`;

  // Version alignment drift
  if (!packageGraph.allAligned && packageGraph.mismatched.length > 0) {
    cells.push({
      cellId: `${cellPrefix}-${String(++idx).padStart(3, '0')}`,
      cellType: 'version-bump',
      description: `Align ${packageGraph.mismatched.length} packages to ${statusVersion}`,
      risk: 'low',
      files: packageGraph.mismatched.map((p) => `${p.path}/deno.json`),
      requiresHumanReview: false,
    });
  }

  // Missing NextVersion
  const nextVersionPath = `docs/next/${statusVersion}/`;
  try {
    Deno.readDirSync(`${rootDir}/${nextVersionPath}`);
  } catch {
    cells.push({
      cellId: `${cellPrefix}-${String(++idx).padStart(3, '0')}`,
      cellType: 'doc-align',
      description: `Create NextVersion package at ${nextVersionPath}`,
      risk: 'low',
      files: [
        `${nextVersionPath}README.md`,
        `${nextVersionPath}DESIGN.md`,
        `${nextVersionPath}TASKS.md`,
        `${nextVersionPath}ACCEPTANCE.md`,
      ],
      requiresHumanReview: false,
    });
  }

  return cells;
}

function getArgValue(flag: string): string | null {
  const idx = Deno.args.indexOf(flag);
  if (idx !== -1 && idx + 1 < Deno.args.length) {
    return Deno.args[idx + 1];
  }
  return null;
}

async function main(): Promise<void> {
  const dryRun = Deno.args.includes('--dry-run');
  const singleCell = getArgValue('--cell');
  const rootDir = Deno.cwd();
  const ledgerDir = `${rootDir}/docs/autoflow/cells`;

  console.log(
    dryRun
      ? '🔍 autoflow:evolve --dry-run'
      : singleCell
      ? `🚀 autoflow:evolve --cell ${singleCell}`
      : '🚀 autoflow:evolve',
  );
  console.log('');

  // 1. Monitor: read governance state
  const status = readStatus(rootDir);
  const version = status.currentVersion || 'unknown';
  const packageGraph = readPackageGraph(rootDir, version);

  console.log(`   Status: ${version} (STATUS.md)`);
  console.log(`   Packages: ${packageGraph.packageCount} (aligned: ${packageGraph.allAligned})`);
  console.log('');

  // 2. Analyze: detect drift → build cells
  const cells = detectDriftAndBuildCells(version, packageGraph, rootDir);

  if (cells.length === 0) {
    console.log('✅ No drift detected. Nothing to evolve.');
    Deno.exit(0);
  }

  console.log(`   Detected ${cells.length} cell(s):`);
  for (const c of cells) {
    console.log(`     - ${c.cellId}: ${c.cellType} (${c.risk} risk, ${c.files.length} files)`);
  }
  console.log('');

  // 3. Plan: build DAG
  const dag = buildDag(cells);

  console.log(`   DAG: ${dag.waves.length} wave(s), ${dag.conflicts.length} conflict(s)`);
  for (let w = 0; w < dag.waves.length; w++) {
    console.log(`     Wave ${w + 1}: [${dag.waves[w].join(', ')}]`);
  }
  if (dag.conflicts.length > 0) {
    for (const c of dag.conflicts) {
      console.log(`     ⚠️  Conflict: ${c.cellA} × ${c.cellB} → ${c.overlappingFiles.join(', ')}`);
    }
  }
  console.log('');

  // 4. L3: Start evolution cycle
  const ledger = new EvidenceLedger(ledgerDir);
  const tracker = new EvolutionTracker(rootDir, ledger);

  if (!dryRun) {
    tracker.startCycle(version, rootDir);
    console.log(`   📊 Evolution cycle started: ${version}`);
    console.log('');
  }

  // 5. Execute: run cells through waves
  const generator: CodeGenerator = dryRun
    ? new DryRunGenerator()
    : new AgentCodeGenerator({ projectRoot: rootDir, risk: 'low' });

  const executor = new CellExecutor({
    projectRoot: rootDir,
    ledger,
    codeGenerator: generator,
  });

  const executedCells: string[] = [];
  const failedCells: string[] = [];

  for (let w = 0; w < dag.waves.length; w++) {
    const wave = dag.waves[w];

    // Filter to single cell if --cell flag is set
    const cellsToRun = singleCell ? wave.filter((id) => id === singleCell) : wave;
    if (cellsToRun.length === 0) continue;

    console.log(`⚡ Wave ${w + 1}/${dag.waves.length}: ${cellsToRun.length} cell(s)`);

    for (const cellId of cellsToRun) {
      const node = dag.nodes.find((n) => n.cellId === cellId)!;

      // Create generator with matching risk level
      if (!dryRun) {
        const riskGenerator = new AgentCodeGenerator({
          projectRoot: rootDir,
          risk: node.risk as RiskLevel,
        });
        const riskExecutor = new CellExecutor({
          projectRoot: rootDir,
          ledger,
          codeGenerator: riskGenerator,
        });

        const state = createCellState(cellId, node.cellType, version, node.risk);
        console.log(`   [${cellId}] ${node.cellType} → executing (${node.risk} risk)...`);

        const finalState = await riskExecutor.execute(state, node.files);
        const emoji = stateEmoji(finalState.lifecycle);
        console.log(`   [${cellId}] ${emoji} ${finalState.lifecycle}`);

        if (finalState.lifecycle === 'merged' || !finalState.lifecycle.startsWith('failed')) {
          executedCells.push(cellId);
        } else {
          failedCells.push(cellId);
        }
      } else {
        // Dry-run mode
        const state = createCellState(cellId, node.cellType, version, node.risk);
        console.log(`   [${cellId}] ${node.cellType} → dry-run...`);

        const finalState = await executor.execute(state, node.files);
        const emoji = stateEmoji(finalState.lifecycle);
        console.log(`   [${cellId}] ${emoji} ${finalState.lifecycle}`);
        executedCells.push(cellId);
      }
    }
    console.log('');
  }

  // 6. L3: Complete evolution cycle and collect metrics
  if (!dryRun) {
    const record = tracker.completeCycle(version);
    if (record) {
      console.log('📊 Evolution metrics:');
      console.log(`   First pass rate: ${(record.metrics.firstPassRate * 100).toFixed(1)}%`);
      console.log(`   Cells attempted: ${record.metrics.totalCellsAttempted}`);
      console.log(`   Cells merged: ${record.metrics.totalCellsMerged}`);
      console.log(`   Cells failed: ${record.metrics.totalCellsFailed}`);
      console.log(
        `   Autonomy score: ${(record.metrics.mechanicalAutonomyScore * 100).toFixed(1)}%`,
      );
      console.log('');
    }
  }

  // 7. Summary
  console.log(
    dryRun
      ? '🔍 Dry-run complete. No changes made.'
      : `🚀 Evolution complete. ${executedCells.length} executed, ${failedCells.length} failed.`,
  );
}

function stateEmoji(lifecycle: string): string {
  switch (lifecycle) {
    case 'merged':
      return '✅';
    case 'failed:non-retriable':
      return '❌';
    case 'failed:retriable':
      return '🔄';
    default:
      return '⏳';
  }
}

main();
