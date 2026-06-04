/**
 * Tests for @openelement/core `less add` safe install flow.
 *
 * Tests cover:
 * - SSR-capable package plan generation
 * - Client-only package plan generation
 * - Invalid package rejection
 * - Dry run mode
 * - Tag listing in plan
 * - File mutation generation
 */

import { generateAddPlan } from '../src/less-add.ts';
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Helpers ─────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, 'fixtures');

async function readFixture(name: string): Promise<string> {
  const buf = await readFile(resolve(FIXTURES, name));
  return new TextDecoder().decode(buf);
}

// ─── SSR-Capable Package ──────────────────────────────────────────────

Deno.test('generateAddPlan - SSR-capable package generates valid plan', async () => {
  const json = await readFixture('ssr-capable-cem.json');
  const plan = generateAddPlan({ spec: '@test/ssr-pkg', manifestJson: json });

  assertEquals(plan.valid, true);
  assertEquals(plan.errors.length, 0);
  assertEquals(plan.compatibility, 'ssr-capable');
  assert(plan.tags.length > 0);
});

Deno.test('generateAddPlan - SSR-capable package lists tags', async () => {
  const json = await readFixture('ssr-capable-cem.json');
  const plan = generateAddPlan({ spec: '@test/ssr-pkg', manifestJson: json });

  assert(plan.tags.length > 0);
  for (const tag of plan.tags) {
    assert(tag.tagName.length > 0, 'Tag name should not be empty');
    assertEquals(tag.valid, true);
  }
});

Deno.test('generateAddPlan - SSR-capable package has noExternal mutation', async () => {
  const json = await readFixture('ssr-capable-cem.json');
  const plan = generateAddPlan({ spec: '@test/ssr-pkg', manifestJson: json });

  const mutations = plan.fileMutations.map((m) => m.description);
  assert(
    mutations.some((m) => m.includes('noExternal')),
    'SSR-capable should add noExternal mutation',
  );
});

Deno.test('generateAddPlan - SSR-capable produces file mutations', async () => {
  const json = await readFixture('ssr-capable-cem.json');
  const plan = generateAddPlan({ spec: '@test/ssr-pkg', manifestJson: json });

  assert(plan.fileMutations.length >= 2, 'Should have at least 2 file mutations');
  assert(plan.fileMutations.some((m) => m.filePath === 'vite.config.ts'));
});

// ─── Client-Only Package ──────────────────────────────────────────────

Deno.test('generateAddPlan - client-only package is valid but client-only', async () => {
  const json = await readFixture('client-only-cem.json');
  const plan = generateAddPlan({ spec: '@test/client-pkg', manifestJson: json });

  assertEquals(plan.valid, true);
  assertEquals(plan.compatibility, 'client-only');
});

Deno.test('generateAddPlan - client-only package warns about SSR', async () => {
  const json = await readFixture('client-only-cem.json');
  const plan = generateAddPlan({ spec: '@test/client-pkg', manifestJson: json });

  assert(plan.warnings.length > 0, 'Client-only package should produce warnings');
  assert(plan.warnings.some((w) => w.includes('client-only')));
});

Deno.test('generateAddPlan - client-only has no noExternal mutation', async () => {
  const json = await readFixture('client-only-cem.json');
  const plan = generateAddPlan({ spec: '@test/client-pkg', manifestJson: json });

  const mutationDescs = plan.fileMutations.map((m) => m.description);
  assert(
    !mutationDescs.some((m) => m.includes('noExternal')),
    'Client-only should NOT add noExternal',
  );
});

// ─── Invalid Package ──────────────────────────────────────────────────

Deno.test('generateAddPlan - invalid package fails before mutations', async () => {
  const json = await readFixture('invalid-cem.json');
  const plan = generateAddPlan({ spec: '@test/invalid-pkg', manifestJson: json });

  assertEquals(plan.valid, false);
  assertEquals(plan.compatibility, 'rejected');
  assertEquals(plan.fileMutations.length, 0, 'Invalid package should have no mutations');
  assert(plan.errors.length > 0);
});

Deno.test('generateAddPlan - invalid package has status about stopping', () => {
  const plan = generateAddPlan({ spec: '@test/missing-pkg', manifestJson: undefined });

  assertEquals(plan.valid, false);
  assert(plan.errors.length > 0);
  assert(plan.errors.some((e) => e.includes('Cannot resolve manifest')));
});

// ─── Dry Run ──────────────────────────────────────────────────────────

Deno.test('generateAddPlan - dry run generates plan without applying', async () => {
  const json = await readFixture('ssr-capable-cem.json');
  const plan = generateAddPlan({ spec: '@test/ssr-pkg', manifestJson: json, dryRun: true });

  assertEquals(plan.valid, true);
  assert(plan.statusUpdates.some((s) => s.includes('Dry run')));
  assert(plan.fileMutations.length > 0, 'Dry run should still show mutations');
});

Deno.test('generateAddPlan - dry run and real run have same mutations', async () => {
  const json = await readFixture('ssr-capable-cem.json');
  const dryPlan = generateAddPlan({ spec: '@test/ssr-pkg', manifestJson: json, dryRun: true });
  const realPlan = generateAddPlan({ spec: '@test/ssr-pkg', manifestJson: json, dryRun: false });

  assertEquals(dryPlan.fileMutations.length, realPlan.fileMutations.length);
  assertEquals(dryPlan.tags.length, realPlan.tags.length);
  assertEquals(dryPlan.compatibility, realPlan.compatibility);
});

// ─── Edge Cases ──────────────────────────────────────────────────────

Deno.test('generateAddPlan - package name from manifest is used', async () => {
  const json = await readFixture('ssr-capable-cem.json');
  const plan = generateAddPlan({ spec: '@test/ssr-pkg', manifestJson: json });

  // The fixture has packageName set
  assert(plan.packageName.length > 0);
});

Deno.test('generateAddPlan - status updates are informative', async () => {
  const json = await readFixture('ssr-capable-cem.json');
  const plan = generateAddPlan({ spec: '@test/ssr-pkg', manifestJson: json });

  assert(plan.statusUpdates.length >= 3, 'Should have multiple status updates');
  assert(plan.statusUpdates.some((s) => s.includes('Validation passed')));
});

Deno.test('generateAddPlan - rollback instructions in real run', async () => {
  const json = await readFixture('ssr-capable-cem.json');
  const plan = generateAddPlan({ spec: '@test/ssr-pkg', manifestJson: json, dryRun: false });

  assert(plan.statusUpdates.some((s) => s.includes('Rollback')));
});
