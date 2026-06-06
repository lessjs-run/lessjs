/**
 * AutoFlow2 evidence cells — v0.34.0 advisory kernel.
 *
 * Each cell represents a category of project evidence. Cells are aggregated
 * into the final report.
 */

export type CellStatus = 'ok' | 'warning' | 'missing' | 'drifted';

export interface Cell {
  name: CellName;
  label: string;
  status: CellStatus;
  detail: string;
  source: string;
}

export const CELL_NAMES = [
  'adr',
  'sop',
  'next-version',
  'package-graph',
  'status',
  'roadmap',
  'workflow',
  'docs',
  'release',
] as const;

export type CellName = (typeof CELL_NAMES)[number];

export const CELL_LABELS: Readonly<Record<CellName, string>> = {
  'adr': 'ADR',
  'sop': 'SOP',
  'next-version': 'NextVersion',
  'package-graph': 'Package Graph',
  'status': 'Status',
  'roadmap': 'Roadmap',
  'workflow': 'Workflow',
  'docs': 'Docs',
  'release': 'Release',
};

export function createCell(
  name: CellName,
  status: CellStatus,
  detail: string,
  source: string,
): Cell {
  return {
    name,
    label: CELL_LABELS[name],
    status,
    detail,
    source,
  };
}

export function cellStatusEmoji(status: CellStatus): string {
  switch (status) {
    case 'ok':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'missing':
      return '❌';
    case 'drifted':
      return '🔄';
  }
}
