/**
 * Integration tests: run the full AutoFlow2 pipeline against each fixture
 * and verify the reported workflow state matches expectations.
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import { determineState, type StateEvidence, type WorkflowState } from '../state-machine.ts';
import { readStatus } from '../readers/status.ts';
import { readSop } from '../readers/sop.ts';
import { readNextVersion } from '../readers/nextversion.ts';
import { readRoadmap } from '../readers/roadmap.ts';
import { readPackageGraph } from '../readers/package-graph.ts';
import { readAdr } from '../readers/adr.ts';
import { join } from 'jsr:@std/path@^1.0.0';

const FIXTURES_DIR = join(Deno.cwd(), 'tools', 'autoflow', 'fixtures');

interface FixtureCase {
  name: string;
  expectedState: WorkflowState;
}

const CASES: FixtureCase[] = [
  { name: 'released', expectedState: 'implemented' }, // v0.34 can't check git tags
  { name: 'active', expectedState: 'active' },
  { name: 'planned', expectedState: 'planned' },
  { name: 'drifted', expectedState: 'drifted' },
  { name: 'invalid', expectedState: 'invalid' },
];

function runPipeline(rootDir: string): WorkflowState {
  const status = readStatus(rootDir);
  const version = status.currentVersion || 'unknown';
  const sop = readSop(rootDir, version);
  const nextVersion = readNextVersion(rootDir, status.nextVersionPath);
  const roadmap = readRoadmap(rootDir);
  const packageGraph = readPackageGraph(rootDir, version);

  const evidence: StateEvidence = {
    statusVersion: version,
    nextVersionComplete: nextVersion.complete,
    sopTasksComplete: sop.totalTasks > 0 && sop.completedTasks === sop.totalTasks,
    packagesAligned: packageGraph.allAligned,
    tagExists: false,
    releaseNoteExists: false,
    statusDeclaresCurrent: status.currentVersion === version,
    hasDrift: !packageGraph.allAligned && packageGraph.packageCount > 0,
    hasCriticalMissing: !status.statusFileFound || !roadmap.roadmapFileFound,
  };

  return determineState(evidence);
}

for (const c of CASES) {
  Deno.test(`integration: ${c.name} fixture → ${c.expectedState}`, () => {
    const rootDir = join(FIXTURES_DIR, c.name);
    const state = runPipeline(rootDir);
    assertEquals(state, c.expectedState);
  });
}

Deno.test('integration: released fixture has ok cells', () => {
  const rootDir = join(FIXTURES_DIR, 'released');
  const status = readStatus(rootDir);
  const version = status.currentVersion;
  const sop = readSop(rootDir, version);
  const nextVersion = readNextVersion(rootDir, status.nextVersionPath);
  const roadmap = readRoadmap(rootDir);
  const packageGraph = readPackageGraph(rootDir, version);
  const adr = readAdr(rootDir);

  assert(status.statusFileFound, 'STATUS.md found');
  assert(sop.sopFileFound, 'SOP found');
  assertEquals(sop.completedTasks, sop.totalTasks, 'all SOP tasks done');
  assert(nextVersion.complete, 'NextVersion complete');
  assert(packageGraph.allAligned, 'packages aligned');
  assert(roadmap.roadmapFileFound, 'roadmap found');
  assert(adr.adrDirFound, 'ADR dir found');
});

Deno.test('integration: drifted fixture has version mismatch', () => {
  const rootDir = join(FIXTURES_DIR, 'drifted');
  const status = readStatus(rootDir);
  const packageGraph = readPackageGraph(rootDir, status.currentVersion);
  assert(!packageGraph.allAligned, 'packages should be drifted');
  assertEquals(packageGraph.mismatched.length, 1);
});

Deno.test('integration: invalid fixture has no status', () => {
  const rootDir = join(FIXTURES_DIR, 'invalid');
  const status = readStatus(rootDir);
  assert(!status.statusFileFound, 'STATUS.md should be missing');
});

Deno.test('integration: planned fixture has no NextVersion', () => {
  const rootDir = join(FIXTURES_DIR, 'planned');
  const status = readStatus(rootDir);
  const nextVersion = readNextVersion(rootDir, status.nextVersionPath);
  assert(!nextVersion.complete, 'NextVersion should be incomplete');
});
