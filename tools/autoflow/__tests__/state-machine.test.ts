import { assertEquals, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { determineState, isLegalTransition, type StateEvidence } from '../state-machine.ts';

// --- Legal transitions ---

Deno.test('state-machine: planned → next is legal', () => {
  assertEquals(isLegalTransition('planned', 'next'), true);
});

Deno.test('state-machine: next → active is legal', () => {
  assertEquals(isLegalTransition('next', 'active'), true);
});

Deno.test('state-machine: active → implemented is legal', () => {
  assertEquals(isLegalTransition('active', 'implemented'), true);
});

Deno.test('state-machine: implemented → released is legal', () => {
  assertEquals(isLegalTransition('implemented', 'released'), true);
});

Deno.test('state-machine: active → drifted is legal', () => {
  assertEquals(isLegalTransition('active', 'drifted'), true);
});

Deno.test('state-machine: implemented → drifted is legal', () => {
  assertEquals(isLegalTransition('implemented', 'drifted'), true);
});

// --- Illegal transitions ---

Deno.test('state-machine: planned → active is illegal', () => {
  assertFalse(isLegalTransition('planned', 'active'));
});

Deno.test('state-machine: planned → released is illegal', () => {
  assertFalse(isLegalTransition('planned', 'released'));
});

Deno.test('state-machine: released → active is illegal', () => {
  assertFalse(isLegalTransition('released', 'active'));
});

Deno.test('state-machine: drifted → active is illegal', () => {
  assertFalse(isLegalTransition('drifted', 'active'));
});

Deno.test('state-machine: invalid → planned is illegal', () => {
  assertFalse(isLegalTransition('invalid', 'planned'));
});

// --- determineState ---

function evidence(overrides: Partial<StateEvidence> = {}): StateEvidence {
  return {
    statusVersion: 'v0.34.0',
    nextVersionComplete: false,
    sopTasksComplete: false,
    packagesAligned: false,
    tagExists: false,
    releaseNoteExists: false,
    statusDeclaresCurrent: false,
    hasDrift: false,
    hasCriticalMissing: false,
    ...overrides,
  };
}

Deno.test('state-machine: determineState → planned', () => {
  assertEquals(determineState(evidence()), 'planned');
});

Deno.test('state-machine: determineState → next', () => {
  assertEquals(determineState(evidence({ nextVersionComplete: true })), 'next');
});

Deno.test('state-machine: determineState → active', () => {
  assertEquals(
    determineState(evidence({ nextVersionComplete: true, statusDeclaresCurrent: true })),
    'active',
  );
});

Deno.test('state-machine: determineState → implemented', () => {
  assertEquals(
    determineState(evidence({
      nextVersionComplete: true,
      statusDeclaresCurrent: true,
      sopTasksComplete: true,
      packagesAligned: true,
    })),
    'implemented',
  );
});

Deno.test('state-machine: determineState → released', () => {
  assertEquals(
    determineState(evidence({
      nextVersionComplete: true,
      statusDeclaresCurrent: true,
      sopTasksComplete: true,
      packagesAligned: true,
      tagExists: true,
      releaseNoteExists: true,
    })),
    'released',
  );
});

Deno.test('state-machine: determineState → drifted', () => {
  assertEquals(determineState(evidence({ hasDrift: true })), 'drifted');
});

Deno.test('state-machine: determineState → invalid', () => {
  assertEquals(determineState(evidence({ hasCriticalMissing: true })), 'invalid');
});

Deno.test('state-machine: invalid beats drift', () => {
  assertEquals(
    determineState(evidence({ hasCriticalMissing: true, hasDrift: true })),
    'invalid',
  );
});

Deno.test('state-machine: drift beats released', () => {
  assertEquals(
    determineState(evidence({
      nextVersionComplete: true,
      statusDeclaresCurrent: true,
      sopTasksComplete: true,
      packagesAligned: true,
      tagExists: true,
      releaseNoteExists: true,
      hasDrift: true,
    })),
    'drifted',
  );
});
