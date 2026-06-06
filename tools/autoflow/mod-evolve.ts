/**
 * autoflow:evolve — v0.36.0 Cell Execution CLI
 *
 * Executes the full autoflow evolution pipeline:
 *   1. Read governance docs → detect drift
 *   2. Build Cell DAG from evidence
 *   3. Execute cells in waves (testgen → implement → review)
 *   4. Report results
 *
 * Usage:
 *   deno run --allow-read tools/autoflow/mod-evolve.ts --dry-run
 *   deno run --allow-read --allow-write --allow-run tools/autoflow/mod-evolve.ts
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

  // Version alignment drift
  if (!packageGraph.allAligned && packageGraph.mismatched.length > 0) {
    cells.push({
      cellId: `cell-v0.36.0-${String(++idx).padStart(3, '0')}`,
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
      cellId: `cell-v0.36.0-${String(++idx).padStart(3, '0')}`,
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

async function main(): Promise<void> {
  const dryRun = Deno.args.includes('--dry-run');
  const rootDir = Deno.cwd();
  const ledgerDir = `${rootDir}/docs/autoflow/cells`;

  console.log(dryRun ? '🔍 autoflow:evolve --dry-run' : '🚀 autoflow:evolve');
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

  // 4. Execute: run cells
  const ledger = new EvidenceLedger(ledgerDir);
  const generator: CodeGenerator = new DryRunGenerator();
  const executor = new CellExecutor({
    projectRoot: rootDir,
    ledger,
    codeGenerator: generator,
  });

  for (let w = 0; w < dag.waves.length; w++) {
    const wave = dag.waves[w];
    console.log(`⚡ Wave ${w + 1}/${dag.waves.length}: ${wave.length} cell(s)`);

    for (const cellId of wave) {
      const node = dag.nodes.find((n) => n.cellId === cellId)!;
      const state = createCellState(cellId, node.cellType, version, node.risk);

      console.log(`   [${cellId}] ${node.cellType} → executing...`);

      const finalState = await executor.execute(state);

      const emoji = finalState.lifecycle === 'merged'
        ? '✅'
        : finalState.lifecycle === 'failed:non-retriable'
        ? '❌'
        : finalState.lifecycle === 'failed:retriable'
        ? '🔄'
        : '⏳';

      console.log(`   [${cellId}] ${emoji} ${finalState.lifecycle}`);
    }
    console.log('');
  }

  console.log(dryRun ? '🔍 Dry-run complete. No changes made.' : '🚀 Evolution complete.');
}

main();
