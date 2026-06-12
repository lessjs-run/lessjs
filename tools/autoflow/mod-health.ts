/**
 * autoflow:health — v0.35.0 Agent Diagnostic CLI
 *
 * Machine-consumable diagnostic output for AI agents.
 * Reports: current state, drift, next action, gate status.
 *
 * Usage:
 *   deno run --allow-read tools/autoflow/mod-health.ts
 *   deno run --allow-read tools/autoflow/mod-health.ts --json
 */
import { readStatus } from './readers/status.ts';
import { readPackageGraph } from './readers/package-graph.ts';
import { readSop } from './readers/sop.ts';
import { EvidenceLedger } from './evidence-ledger.ts';

interface HealthReport {
  currentVersion: string;
  workflowState: string;
  packageAlignment: { total: number; aligned: boolean; mismatched: number };
  sopCompletion: { total: number; completed: number; percent: number };
  ledgerCells: number;
  drift: string[];
  nextActions: string[];
  gates: { name: string; status: 'unknown' | 'passed' | 'failed' }[];
}

function main(): void {
  const json = Deno.args.includes('--json');
  const root = Deno.cwd();
  const status = readStatus(root);
  const version = status.currentVersion || 'unknown';
  const packageVersion = status.packageVersion || version;
  const pg = readPackageGraph(root, packageVersion);
  const sop = readSop(root, version);

  const drift: string[] = [];
  const nextActions: string[] = [];

  // Detect drift
  if (!pg.allAligned && pg.mismatched.length > 0) {
    drift.push(
      `version: ${pg.mismatched.length} packages mismatched (expected ${packageVersion})`,
    );
    nextActions.push('deno task autoflow:evolve --dry-run  # detect + plan fix');
  }
  if (!sop.sopFileFound) {
    drift.push(`sop: docs/sop/${version}/README.md missing`);
    nextActions.push(`create docs/sop/${version}/README.md`);
  }
  if (sop.totalTasks > 0 && sop.completedTasks < sop.totalTasks) {
    drift.push(`sop: ${sop.completedTasks}/${sop.totalTasks} tasks complete`);
    nextActions.push('complete outstanding SOP tasks');
  }
  if (!status.statusFileFound) {
    drift.push('status: docs/status/STATUS.md missing');
    nextActions.push('create docs/status/STATUS.md');
  }

  // Ledger
  let cellCount = 0;
  try {
    const ledger = new EvidenceLedger(`${root}/docs/autoflow/cells`);
    cellCount = ledger.listCells().length;
  } catch { /* ok */ }

  if (drift.length === 0) {
    nextActions.push('✅ No drift detected. Ready to implement SOP tasks.');
  }

  // Check known gates
  const gateStatus = [
    'fmt:check',
    'lint',
    'typecheck',
    'test',
    'build',
    'workflow:check',
    'arch:check',
    'graph:check',
    'docs:check-public',
    'docs:check-current',
    'docs:check-strategy',
    'dsd:check-report',
    'publish:dry-run',
  ].map((name) => ({ name, status: 'unknown' as const }));

  const report: HealthReport = {
    currentVersion: version,
    workflowState: pg.allAligned && sop.totalTasks > 0 && sop.completedTasks === sop.totalTasks
      ? 'implemented'
      : pg.allAligned
      ? 'active'
      : 'drifted',
    packageAlignment: {
      total: pg.packageCount,
      aligned: pg.allAligned,
      mismatched: pg.mismatched.length,
    },
    sopCompletion: {
      total: sop.totalTasks,
      completed: sop.completedTasks,
      percent: sop.totalTasks > 0 ? Math.round((sop.completedTasks / sop.totalTasks) * 100) : 0,
    },
    ledgerCells: cellCount,
    drift,
    nextActions,
    gates: gateStatus,
  };

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`🔍 autoflow:health — ${report.currentVersion}`);
    console.log(`   State: ${report.workflowState}`);
    console.log(
      `   Packages: ${report.packageAlignment.total} (aligned: ${report.packageAlignment.aligned})`,
    );
    console.log(
      `   SOP: ${report.sopCompletion.completed}/${report.sopCompletion.total} (${report.sopCompletion.percent}%)`,
    );
    console.log(`   Ledger cells: ${report.ledgerCells}`);
    if (report.drift.length > 0) {
      console.log(`\n   ⚠️  Drift:`);
      for (const d of report.drift) {
        console.log(`     - ${d}`);
      }
    }
    console.log(`\n   Next actions:`);
    for (const a of report.nextActions) {
      console.log(`     ${a}`);
    }
  }
}

main();
