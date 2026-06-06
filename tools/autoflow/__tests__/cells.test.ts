import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { CELL_LABELS, CELL_NAMES, cellStatusEmoji, createCell } from '../cells.ts';

Deno.test('cells: createCell returns correct structure', () => {
  const cell = createCell('sop', 'ok', '12/12 tasks', 'docs/sop/v0.34.0/README.md');
  assertEquals(cell.name, 'sop');
  assertEquals(cell.label, 'SOP');
  assertEquals(cell.status, 'ok');
  assertEquals(cell.detail, '12/12 tasks');
  assertEquals(cell.source, 'docs/sop/v0.34.0/README.md');
});

Deno.test('cells: createCell for all 9 cell names', () => {
  for (const name of CELL_NAMES) {
    const cell = createCell(name, 'ok', 'ok', 'path');
    assertEquals(cell.name, name);
    assertEquals(cell.label, CELL_LABELS[name]);
  }
});

Deno.test('cells: cellStatusEmoji ok', () => {
  assertEquals(cellStatusEmoji('ok'), '✅');
});

Deno.test('cells: cellStatusEmoji warning', () => {
  assertEquals(cellStatusEmoji('warning'), '⚠️');
});

Deno.test('cells: cellStatusEmoji missing', () => {
  assertEquals(cellStatusEmoji('missing'), '❌');
});

Deno.test('cells: cellStatusEmoji drifted', () => {
  assertEquals(cellStatusEmoji('drifted'), '🔄');
});
