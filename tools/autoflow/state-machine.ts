/**
 * AutoFlow2 state machine — v0.34.0 advisory kernel.
 *
 * Models the openElement project workflow as a finite state machine.
 * v0.34 is advisory only — it reports state, it does not block.
 */

export type WorkflowState =
  | 'planned'
  | 'next'
  | 'active'
  | 'implemented'
  | 'released'
  | 'drifted'
  | 'invalid';

export const ALL_STATES: readonly WorkflowState[] = [
  'planned',
  'next',
  'active',
  'implemented',
  'released',
  'drifted',
  'invalid',
];

/**
 * Legal forward transitions in the workflow model.
 *
 *   planned → next → active → implemented → released
 *                                     ↘
 *                                      drifted
 *
 * `drifted` and `invalid` act as sink states: once entered, exit only by
 * fixing the underlying evidence.
 */
export const LEGAL_TRANSITIONS: ReadonlyMap<WorkflowState, readonly WorkflowState[]> = new Map([
  ['planned', ['next']],
  ['next', ['active']],
  ['active', ['implemented', 'drifted']],
  ['implemented', ['released', 'drifted']],
  ['released', ['drifted']],
  ['drifted', []],
  ['invalid', []],
]);

/**
 * Determine whether a transition from `from` to `to` is legal.
 */
export function isLegalTransition(from: WorkflowState, to: WorkflowState): boolean {
  const allowed = LEGAL_TRANSITIONS.get(from);
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Evidence that feeds the state machine.
 */
export interface StateEvidence {
  /** Version declared in STATUS.md current line */
  statusVersion: string;
  /** Does docs/next/<version>/ exist and contain 8 files? */
  nextVersionComplete: boolean;
  /** Are all SOP tasks checked off? */
  sopTasksComplete: boolean;
  /** Are all packages at the declared version? */
  packagesAligned: boolean;
  /** Does a git tag exist for this version? */
  tagExists: boolean;
  /** Does docs/release/<version>.md exist? */
  releaseNoteExists: boolean;
  /** Does docs/status/STATUS.md declare this version as current? */
  statusDeclaresCurrent: boolean;
  /** Are there any version mismatches or missing files? */
  hasDrift: boolean;
  /** Are critical files missing entirely? */
  hasCriticalMissing: boolean;
}

/**
 * Determine workflow state from structured evidence.
 */
export function determineState(evidence: StateEvidence): WorkflowState {
  if (evidence.hasCriticalMissing) return 'invalid';
  if (evidence.hasDrift) return 'drifted';

  if (evidence.releaseNoteExists && evidence.tagExists) return 'released';
  if (evidence.sopTasksComplete && evidence.packagesAligned) return 'implemented';
  if (evidence.nextVersionComplete && evidence.statusDeclaresCurrent) return 'active';
  if (evidence.nextVersionComplete) return 'next';

  return 'planned';
}
