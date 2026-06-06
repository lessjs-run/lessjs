/**
 * AutoFlow2 Sidecar Kernel — v0.34.0
 *
 * Reads repository governance documents and emits a machine-readable
 * workflow report. Advisory only — does not block CI or edit code.
 *
 * Usage:
 *   deno run --allow-read tools/autoflow/mod.ts           # summary
 *   deno run --allow-read tools/autoflow/mod.ts --json    # JSON
 */

import { createCell } from './cells.ts';
import { determineState, type StateEvidence } from './state-machine.ts';
import { readStatus } from './readers/status.ts';
import { readSop } from './readers/sop.ts';
import { readNextVersion } from './readers/nextversion.ts';
import { readRoadmap } from './readers/roadmap.ts';
import { readPackageGraph } from './readers/package-graph.ts';
import { readAdr } from './readers/adr.ts';
import { reportJson, reportSummary } from './reporter.ts';

function main(): void {
  const args = Deno.args;
  const jsonMode = args.includes('--json');
  const rootDir = Deno.cwd();

  // 1. Read status
  const status = readStatus(rootDir);
  const version = status.currentVersion || 'unknown';

  // 2. Read SOP
  const sop = readSop(rootDir, version);

  // 3. Read NextVersion
  const nextVersion = readNextVersion(rootDir, status.nextVersionPath);

  // 4. Read roadmap
  const roadmap = readRoadmap(rootDir);

  // 5. Read package graph
  const packageGraph = readPackageGraph(rootDir, version);

  // 6. Read ADRs
  const adr = readAdr(rootDir);

  // Build cells
  const cells = [
    createCell(
      'status',
      status.statusFileFound ? 'ok' : 'missing',
      status.statusFileFound
        ? `Current: ${status.currentVersion}, NextVersion: ${status.nextVersionPath}`
        : 'STATUS.md not found',
      'docs/status/STATUS.md',
    ),
    createCell(
      'sop',
      sop.sopFileFound ? sop.completedTasks === sop.totalTasks ? 'ok' : 'warning' : 'missing',
      sop.sopFileFound
        ? `${sop.completedTasks}/${sop.totalTasks} tasks complete`
        : 'SOP file not found',
      sop.sopPath,
    ),
    createCell(
      'next-version',
      nextVersion.complete ? 'ok' : 'missing',
      nextVersion.complete
        ? `${nextVersion.filesPresent}/${nextVersion.filesRequired} files present`
        : `Missing: ${nextVersion.missingFiles.join(', ') || 'NextVersion dir not found'}`,
      nextVersion.versionPath || 'docs/next/',
    ),
    createCell(
      'package-graph',
      packageGraph.packageCount === 0 ? 'missing' : packageGraph.allAligned ? 'ok' : 'drifted',
      packageGraph.packageCount === 0
        ? 'No packages found'
        : packageGraph.allAligned
        ? `${packageGraph.packageCount} packages aligned to ${packageGraph.expectedVersion}`
        : `${packageGraph.mismatched.length}/${packageGraph.packageCount} mismatched: ${
          packageGraph.mismatched.map((p) => `${p.name}@${p.version}`).join(', ')
        }`,
      'deno.json',
    ),
    createCell(
      'roadmap',
      roadmap.roadmapFileFound ? 'ok' : 'missing',
      roadmap.roadmapFileFound
        ? `${roadmap.versions.length} versions, current: ${roadmap.currentVersion || 'none'}`
        : 'ROADMAP.md not found',
      'docs/roadmap/ROADMAP.md',
    ),
    createCell(
      'adr',
      adr.adrDirFound ? 'ok' : 'missing',
      adr.adrDirFound ? `${adr.count} ADRs` : 'ADR directory not found',
      'docs/adr/',
    ),
    createCell(
      'workflow',
      'ok',
      'Workflow check: see deno task workflow:check',
      'docs/governance/PROJECT_WORKFLOW.md',
    ),
    createCell(
      'docs',
      'ok',
      'Docs check: see deno task docs:check-current',
      'docs/',
    ),
    createCell(
      'release',
      'ok',
      'Release check: see deno task publish:dry-run',
      'docs/release/',
    ),
  ];

  // Build evidence for state machine
  const evidence: StateEvidence = {
    statusVersion: version,
    nextVersionComplete: nextVersion.complete,
    sopTasksComplete: sop.totalTasks > 0 && sop.completedTasks === sop.totalTasks,
    packagesAligned: packageGraph.allAligned,
    tagExists: false, // v0.34 doesn't check git
    releaseNoteExists: false, // v0.34 doesn't check git
    statusDeclaresCurrent: status.currentVersion === version,
    hasDrift: !packageGraph.allAligned && packageGraph.packageCount > 0,
    hasCriticalMissing: !status.statusFileFound || !roadmap.roadmapFileFound,
  };

  const state = determineState(evidence);

  if (jsonMode) {
    console.log(JSON.stringify(reportJson(version, state, cells), null, 2));
  } else {
    console.log(reportSummary(version, state, cells));
  }
}

main();
