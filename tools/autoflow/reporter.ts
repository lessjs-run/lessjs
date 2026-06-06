/**
 * AutoFlow2 reporter — JSON and human-readable summary output.
 */

import type { Cell } from './cells.ts';
import type { WorkflowState } from './state-machine.ts';
import { cellStatusEmoji } from './cells.ts';

export interface Report {
  version: string;
  workflowState: WorkflowState;
  cells: Cell[];
  blockers: Blocker[];
  allowedActions: string[];
}

export interface Blocker {
  cell: string;
  reason: string;
}

const ALLOWED_ACTIONS: Record<WorkflowState, string[]> = {
  'planned': ['write-sop', 'write-adr'],
  'next': ['create-next-version', 'edit-docs', 'write-adr'],
  'active': ['edit-packages', 'run-test', 'update-docs', 'write-adr'],
  'implemented': ['bump-version', 'write-changelog', 'write-release-note', 'run-test'],
  'released': ['edit-packages', 'run-test', 'update-docs'],
  'drifted': ['fix-drift', 'align-versions'],
  'invalid': ['restore-critical-files'],
};

export function computeBlockers(cells: Cell[]): Blocker[] {
  const blockers: Blocker[] = [];
  for (const cell of cells) {
    if (cell.status === 'missing') {
      blockers.push({ cell: cell.name, reason: `${cell.label} evidence is missing` });
    }
    if (cell.status === 'drifted') {
      blockers.push({ cell: cell.name, reason: `${cell.label} is drifted: ${cell.detail}` });
    }
  }
  return blockers;
}

export function reportJson(version: string, state: WorkflowState, cells: Cell[]): Report {
  return {
    version,
    workflowState: state,
    cells,
    blockers: computeBlockers(cells),
    allowedActions: ALLOWED_ACTIONS[state] ?? [],
  };
}

export function reportSummary(version: string, state: WorkflowState, cells: Cell[]): string {
  const blockers = computeBlockers(cells);
  const lines: string[] = [];

  lines.push(`## AutoFlow Report — ${version}`);
  lines.push('');
  lines.push(`**State**: \`${state}\``);
  lines.push('');

  lines.push('### Cells');
  lines.push('');
  lines.push('| Cell | Status | Detail |');
  lines.push('|------|--------|--------|');
  for (const cell of cells) {
    lines.push(
      `| ${cell.label} | ${cellStatusEmoji(cell.status)} ${cell.status} | ${cell.detail} |`,
    );
  }
  lines.push('');

  if (blockers.length > 0) {
    lines.push('### Blockers');
    lines.push('');
    for (const b of blockers) {
      lines.push(`- **${b.cell}**: ${b.reason}`);
    }
    lines.push('');
  } else {
    lines.push('### Blockers');
    lines.push('');
    lines.push('None.');
    lines.push('');
  }

  lines.push('### Allowed Actions');
  lines.push('');
  const actions = ALLOWED_ACTIONS[state] ?? [];
  for (const a of actions) {
    lines.push(`- \`${a}\``);
  }
  lines.push('');

  return lines.join('\n');
}
