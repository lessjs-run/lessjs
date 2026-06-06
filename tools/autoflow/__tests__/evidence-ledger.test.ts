/**
 * Evidence Ledger tests — v0.35.0
 */
import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import { EvidenceLedger } from '../evidence-ledger.ts';

const LEDGER_DIR = Deno.makeTempDirSync({ prefix: 'autoflow-test-ledger-' });

function _cleanup() {
  try {
    Deno.removeSync(LEDGER_DIR, { recursive: true });
  } catch { /* ok */ }
}

Deno.test('ledger: creates directory on init', () => {
  const dir = `${LEDGER_DIR}/test-init`;
  const ledger = new EvidenceLedger(dir);
  const cells = ledger.listCells();
  assertEquals(cells.length, 0);
  Deno.removeSync(dir, { recursive: true });
});

Deno.test('ledger: appendEvent and rebuildState', () => {
  const dir = `${LEDGER_DIR}/test-append`;
  const ledger = new EvidenceLedger(dir);

  ledger.appendEvent('cell-001', {
    type: 'cell-planned',
    timestamp: new Date().toISOString(),
    cellId: 'cell-001',
    payload: { cellType: 'version-bump', versionCycle: 'v0.35.0', risk: 'low' },
  });

  ledger.appendEvent('cell-001', {
    type: 'branch-created',
    timestamp: new Date().toISOString(),
    cellId: 'cell-001',
    payload: { branchName: 'autoflow/cell-v0.35.0-001' },
  });

  const events = ledger.readAllEvents('cell-001');
  assertEquals(events.length, 2);
  assertEquals(events[0].type, 'cell-planned');

  const state = ledger.rebuildState('cell-001');
  assertEquals(state.lifecycle, 'branched');
  assertEquals(state.dependency, 'ready');

  Deno.removeSync(dir, { recursive: true });
});

Deno.test('ledger: getCellState returns cached state', () => {
  const dir = `${LEDGER_DIR}/test-cache`;
  const ledger = new EvidenceLedger(dir);

  ledger.appendEvent('cell-002', {
    type: 'cell-planned',
    timestamp: new Date().toISOString(),
    cellId: 'cell-002',
    payload: { cellType: 'changelog', versionCycle: 'v0.35.0', risk: 'low' },
  });

  ledger.appendEvent('cell-002', {
    type: 'branch-created',
    timestamp: new Date().toISOString(),
    cellId: 'cell-002',
    payload: { branchName: 'autoflow/cell-v0.35.0-002' },
  });

  const state = ledger.getCellState('cell-002');
  assertEquals(state.lifecycle, 'branched');

  // Read again — should come from cache
  const state2 = ledger.getCellState('cell-002');
  assertEquals(state2.lifecycle, 'branched');

  Deno.removeSync(dir, { recursive: true });
});

Deno.test('ledger: listCells returns cell IDs', () => {
  const dir = `${LEDGER_DIR}/test-list`;
  const ledger = new EvidenceLedger(dir);

  ledger.appendEvent('cell-a', {
    type: 'cell-planned',
    timestamp: new Date().toISOString(),
    cellId: 'cell-a',
    payload: {},
  });

  ledger.appendEvent('cell-b', {
    type: 'cell-planned',
    timestamp: new Date().toISOString(),
    cellId: 'cell-b',
    payload: {},
  });

  const cells = ledger.listCells();
  assertEquals(cells.length, 2);
  assert(cells.includes('cell-a'));
  assert(cells.includes('cell-b'));

  Deno.removeSync(dir, { recursive: true });
});

Deno.test('ledger: full lifecycle replay', () => {
  const dir = `${LEDGER_DIR}/test-full`;
  const ledger = new EvidenceLedger(dir);
  const cellId = 'cell-full';
  const ts = new Date().toISOString();

  ledger.appendEvent(cellId, {
    type: 'cell-planned',
    timestamp: ts,
    cellId,
    payload: { cellType: 'version-bump', versionCycle: 'v0.35.0', risk: 'low' },
  });
  ledger.appendEvent(cellId, {
    type: 'branch-created',
    timestamp: ts,
    cellId,
    payload: { branchName: 'autoflow/cell-full' },
  });

  // Manually advance to executing via replay
  // In real flow, events must follow the state machine

  const events = ledger.readAllEvents(cellId);
  assertEquals(events.length, 2);

  Deno.removeSync(dir, { recursive: true });
});
