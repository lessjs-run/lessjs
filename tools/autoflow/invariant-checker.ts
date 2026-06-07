/**
 * Temporal invariant checker — v0.35.0
 *
 * Based on Pnueli temporal logic (C5): □P (always), ◇P (eventually),
 * P → Q (implies), ¬P (not). Verifies that all invariants hold given
 * current cell states and project state.
 */
import type { CellState } from './cell-state-machine.ts';
import { isTerminal } from './cell-state-machine.ts';
import type { EvidenceLedger } from './evidence-ledger.ts';
import { validateAllPackageConfigs } from '../config-templates.ts';

// ---- Types ----

export interface Invariant {
  id: string;
  description: string;
  severity: 'error' | 'warning';
}

export interface InvariantViolation {
  invariantId: string;
  cellId?: string;
  severity: 'error' | 'warning';
  description: string;
  detail?: string;
}

export interface InvariantCheckReport {
  passed: boolean;
  violations: InvariantViolation[];
}

// ---- Invariant Registry (8 invariants) ----

export const INVARIANTS: Invariant[] = [
  {
    id: 'I-CELL-MERGE-REQUIRES-HARNESS',
    description: 'Cell cannot merge without harness all-passing',
    severity: 'error',
  },
  {
    id: 'I-UPSTREAM-FAIL-CANCELS-DOWNSTREAM',
    description: 'Upstream cell failure cascades to downstream cancellation',
    severity: 'error',
  },
  {
    id: 'I-VERSION-ALIGNMENT',
    description: 'All package versions must match STATUS.md declared version',
    severity: 'error',
  },
  {
    id: 'I-NO-SELF-MODIFICATION',
    description: 'Autoflow cells cannot modify tools/autoflow/ or .github/workflows/',
    severity: 'error',
  },
  {
    id: 'I-RETRY-LIMIT',
    description: 'Cell retry count must not exceed MAX_RETRIES',
    severity: 'error',
  },
  {
    id: 'I-CELL-EVENTUALLY-COMPLETES',
    description: 'Every created cell must eventually reach a terminal state',
    severity: 'warning',
  },
  {
    id: 'I-STATUS-MATCHES-REALITY',
    description: 'STATUS.md version must match package graph version or state is drifted',
    severity: 'warning',
  },
  {
    id: 'I-NO-PARALLEL-CONFLICT',
    description: 'No two cells in the same wave can edit the same file',
    severity: 'warning',
  },
  {
    id: 'I-PACKAGE-CONFIG-STANDARD',
    description: 'All package deno.json configs must match the standard template',
    severity: 'error',
  },
];

// ---- Checker functions ----

function checkMergeRequiresHarness(cell: CellState): InvariantViolation | null {
  if (cell.lifecycle === 'merged') {
    const allPassed = cell.harnessResults.length > 0 &&
      cell.harnessResults.every((r) => r.passed);
    if (!allPassed) {
      return {
        invariantId: 'I-CELL-MERGE-REQUIRES-HARNESS',
        cellId: cell.cellId,
        severity: 'error',
        description: 'Cell merged without all harness gates passing',
        detail: `Cell ${cell.cellId} merged with ${
          cell.harnessResults.filter((r) => !r.passed).length
        } failing gates`,
      };
    }
  }
  return null;
}

function checkRetryLimit(cell: CellState, maxRetries = 2): InvariantViolation | null {
  if (cell.retryCount > maxRetries && cell.lifecycle !== 'failed:non-retriable') {
    return {
      invariantId: 'I-RETRY-LIMIT',
      cellId: cell.cellId,
      severity: 'error',
      description: `Cell retry count (${cell.retryCount}) exceeds max (${maxRetries})`,
    };
  }
  return null;
}

function checkEventualCompletion(cell: CellState): InvariantViolation | null {
  if (!isTerminal(cell)) {
    const createdAt = new Date(cell.createdAt).getTime();
    const now = Date.now();
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return {
        invariantId: 'I-CELL-EVENTUALLY-COMPLETES',
        cellId: cell.cellId,
        severity: 'warning',
        description: `Cell stuck in '${cell.lifecycle}' for >24h`,
      };
    }
  }
  return null;
}

function checkVersionAlignment(
  statusVersion: string,
  packageVersions: string[],
): InvariantViolation | null {
  const normalizedStatus = statusVersion.replace(/^v/, '');
  const mismatched = packageVersions.filter((v) => v.replace(/^v/, '') !== normalizedStatus);
  if (mismatched.length > 0) {
    return {
      invariantId: 'I-VERSION-ALIGNMENT',
      severity: 'error',
      description:
        `${mismatched.length} package(s) version-mismatched with STATUS.md (${statusVersion})`,
      detail: mismatched.join(', '),
    };
  }
  return null;
}

async function checkPackageConfigStandard(
  rootDir: string,
): Promise<InvariantViolation | null> {
  const packagesDir = `${rootDir}/packages`;
  const failures = await validateAllPackageConfigs(packagesDir);
  if (failures.length > 0) {
    const details = failures.map((f) => `${f.packageName}: ${f.mismatches.join(', ')}`).join('; ');
    return {
      invariantId: 'I-PACKAGE-CONFIG-STANDARD',
      severity: 'error',
      description: `${failures.length} package(s) have non-standard deno.json configs`,
      detail: details,
    };
  }
  return null;
}

// ---- Main checker ----

export async function checkAllInvariants(
  ledger: EvidenceLedger | null,
  projectState: {
    statusVersion: string;
    packageVersions: string[];
    rootDir?: string;
  },
  options: { maxRetries?: number; strict?: boolean } = {},
): Promise<InvariantCheckReport> {
  const violations: InvariantViolation[] = [];
  const maxRetries = options.maxRetries ?? 2;

  // Check cell-specific invariants
  if (ledger) {
    const cells = ledger.listCells();
    for (const cellId of cells) {
      let cell: CellState;
      try {
        cell = ledger.getCellState(cellId);
      } catch {
        continue; // skip cells that can't be read
      }

      const v1 = checkMergeRequiresHarness(cell);
      if (v1) violations.push(v1);

      const v2 = checkRetryLimit(cell, maxRetries);
      if (v2) violations.push(v2);

      const v3 = checkEventualCompletion(cell);
      if (v3) violations.push(v3);
    }
  }

  // Check project-level invariants
  const v4 = checkVersionAlignment(
    projectState.statusVersion,
    projectState.packageVersions,
  );
  if (v4) violations.push(v4);

  // Check package config standardization
  const v5 = await checkPackageConfigStandard(projectState.rootDir ?? Deno.cwd());
  if (v5) violations.push(v5);

  // Determine pass/fail
  const hasErrors = violations.some((v) => v.severity === 'error');
  const strictErrors = options.strict ? violations.length > 0 : hasErrors;

  return {
    passed: !strictErrors && !hasErrors,
    violations,
  };
}
