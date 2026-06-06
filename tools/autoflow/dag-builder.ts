/**
 * DAG Builder — v0.36.0
 *
 * Constructs a Cell dependency DAG from governance evidence.
 * Kahn principle (C6): cells editing the same file → serialized.
 *
 * Algorithm:
 *   1. Collect drift evidence → candidate cell list
 *   2. Compute per-cell expected file modifications
 *   3. Build dependency edges (file overlap + logical deps)
 *   4. Topological sort → execution waves
 */

export interface DagNode {
  cellId: string;
  cellType: string;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  files: string[];
  requiresHumanReview: boolean;
  dependencies: string[];
  dependents: string[];
  priority: number;
}

export interface CellDag {
  nodes: DagNode[];
  waves: string[][]; // each wave = parallel-executable cell IDs
  conflicts: FileConflict[];
}

export interface FileConflict {
  cellA: string;
  cellB: string;
  overlappingFiles: string[];
}

/**
 * Build a DAG from a list of candidate cells.
 * Cells that edit overlapping files are sequenced (A → B dependency).
 */
export function buildDag(
  cells: Omit<DagNode, 'dependencies' | 'dependents' | 'priority'>[],
): CellDag {
  const nodes: DagNode[] = cells.map((c) => ({
    ...c,
    dependencies: [],
    dependents: [],
    priority: 0,
  }));

  const conflicts: FileConflict[] = [];

  // Detect file overlap conflicts
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const overlapping = nodes[i].files.filter((f) => nodes[j].files.includes(f));
      if (overlapping.length > 0) {
        conflicts.push({
          cellA: nodes[i].cellId,
          cellB: nodes[j].cellId,
          overlappingFiles: overlapping,
        });

        // Serialize: B depends on A (A runs first, then B)
        nodes[j].dependencies.push(nodes[i].cellId);
        nodes[i].dependents.push(nodes[j].cellId);
      }
    }
  }

  // Add logical dependencies: changelog after version-bump
  for (const node of nodes) {
    if (node.cellType === 'changelog') {
      const bumpCell = nodes.find((n) => n.cellType === 'version-bump' && n.cellId !== node.cellId);
      if (bumpCell && !node.dependencies.includes(bumpCell.cellId)) {
        node.dependencies.push(bumpCell.cellId);
        bumpCell.dependents.push(node.cellId);
      }
    }
    if (node.cellType === 'release-note') {
      const changelogCell = nodes.find((n) =>
        n.cellType === 'changelog' && n.cellId !== node.cellId
      );
      if (changelogCell && !node.dependencies.includes(changelogCell.cellId)) {
        node.dependencies.push(changelogCell.cellId);
        changelogCell.dependents.push(node.cellId);
      }
    }
  }

  // Topological sort into waves
  const waves = scheduleWaves(nodes);

  return { nodes, waves, conflicts };
}

/**
 * Schedule cells into waves. Cells in the same wave have no mutual dependencies
 * and can run in parallel (Kahn determinism applies within each wave).
 */
function scheduleWaves(nodes: DagNode[]): string[][] {
  const remaining = new Map(nodes.map((n) => [n.cellId, [...n.dependencies]]));
  const waves: string[][] = [];

  while (remaining.size > 0) {
    // Find all cells with no remaining dependencies
    const ready: string[] = [];
    for (const [cellId, deps] of remaining) {
      if (deps.length === 0) {
        ready.push(cellId);
      }
    }

    if (ready.length === 0) {
      // Cycle detected — break remaining into one wave as fallback
      const fallback = [...remaining.keys()];
      if (fallback.length > 0) {
        waves.push(fallback);
      }
      break;
    }

    waves.push(ready);

    // Remove completed cells and their dependencies from remaining
    for (const cellId of ready) {
      remaining.delete(cellId);
      // Remove this cell from all other cells' dependency lists
      for (const [, deps] of remaining) {
        const idx = deps.indexOf(cellId);
        if (idx !== -1) deps.splice(idx, 1);
      }
    }
  }

  return waves;
}
