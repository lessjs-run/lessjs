/**
 * Tests for SSR Admission Plan using fixtures.
 *
 * Validates that the SSR admission plan correctly categorizes
 * different types of islands based on their metadata.
 */

import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { buildSsrAdmissionPlan } from '../src/entry-descriptor.ts';
import type { IslandDecl } from '../src/entry-descriptor.ts';

// ─── Fixture imports ─────────────────────────────────────

// Local island with less.ssr = false
const localSsrFalse: IslandDecl = {
  tagName: 'local-ssr-false',
  modulePath: '/app/islands/local-island-ssr-false.ts',
  source: 'local',
  ssr: false,
  dsd: false,
  hydrate: 'lazy',
  reason: 'local island exports less.ssr=false',
};

// Package island with ssr: false (from manifest)
const packageSsrFalse: IslandDecl = {
  tagName: 'package-ssr-false',
  modulePath: '/packages/adapter-vite/__tests__/fixtures/package-manifest-ssr-false.ts',
  isPackage: true,
  source: 'package',
  ssr: false,
  dsd: false,
  hydrate: 'lazy',
};

// Local island with ssr: true (renderable)
const localSsrTrue: IslandDecl = {
  tagName: 'local-ssr-true',
  modulePath: '/app/islands/local-island-ssr-true.ts',
  source: 'local',
  ssr: true,
  dsd: true,
  hydrate: 'eager',
};

// Package island with ssr: true (renderable)
const packageSsrTrue: IslandDecl = {
  tagName: 'package-ssr-true',
  modulePath: '/packages/adapter-vite/__tests__/fixtures/package-manifest-ssr-true.ts',
  isPackage: true,
  source: 'package',
  ssr: true,
  dsd: true,
};

// Parent component that outputs client-only child tag
const parentWithClientChild: IslandDecl = {
  tagName: 'parent-with-client-child',
  modulePath: '/app/islands/parent-with-client-child.ts',
  source: 'local',
  ssr: true,
  dsd: true,
};

// ─── Tests ────────────────────────────────────────────────

Deno.test('SSR Admission: local island with ssr=false → clientOnlyTags', () => {
  const islands: IslandDecl[] = [localSsrFalse];
  const plan = buildSsrAdmissionPlan(islands);

  assertEquals(plan.clientOnlyTags.includes('local-ssr-false'), true);
  assertEquals(plan.renderableTags.includes('local-ssr-false'), false);
  assertEquals(plan.rejectedTags.includes('local-ssr-false'), false);

  const decision = plan.decisions.find((d) => d.tagName === 'local-ssr-false');
  assertExists(decision);
  assertEquals(decision.renderPath, 'client-only');
  assertEquals(decision.reason, 'local island exports less.ssr=false');
});

Deno.test('SSR Admission: package island with ssr=false → clientOnlyTags', () => {
  const islands: IslandDecl[] = [packageSsrFalse];
  const plan = buildSsrAdmissionPlan(islands);

  assertEquals(plan.clientOnlyTags.includes('package-ssr-false'), true);
  assertEquals(plan.renderableTags.includes('package-ssr-false'), false);

  const decision = plan.decisions.find((d) => d.tagName === 'package-ssr-false');
  assertExists(decision);
  assertEquals(decision.renderPath, 'client-only');
  assertEquals(decision.reason, 'package island has no validated SSR capability');
});

Deno.test('SSR Admission: local island with ssr=true → renderableTags', () => {
  const islands: IslandDecl[] = [localSsrTrue];
  const plan = buildSsrAdmissionPlan(islands);

  assertEquals(plan.renderableTags.includes('local-ssr-true'), true);
  assertEquals(plan.clientOnlyTags.includes('local-ssr-true'), false);

  const decision = plan.decisions.find((d) => d.tagName === 'local-ssr-true');
  assertExists(decision);
  assertEquals(decision.renderPath, 'ssr+client');
  assertEquals(decision.reason, 'less.ssr is true');
});

Deno.test('SSR Admission: package island with ssr=true → renderableTags', () => {
  const islands: IslandDecl[] = [packageSsrTrue];
  const plan = buildSsrAdmissionPlan(islands);

  assertEquals(plan.renderableTags.includes('package-ssr-true'), true);
  assertEquals(plan.clientOnlyTags.includes('package-ssr-true'), false);

  const decision = plan.decisions.find((d) => d.tagName === 'package-ssr-true');
  assertExists(decision);
  assertEquals(decision.renderPath, 'ssr+client');
  assertEquals(decision.reason, 'package island with less.ssr=true');
});

Deno.test('SSR Admission: duplicate tag → rejectedTags', () => {
  const islands: IslandDecl[] = [localSsrFalse, { ...localSsrFalse }];
  const plan = buildSsrAdmissionPlan(islands);

  assertEquals(plan.rejectedTags.includes('local-ssr-false'), true);
  assertEquals(plan.renderableTags.includes('local-ssr-false'), false);
  assertEquals(plan.clientOnlyTags.includes('local-ssr-false'), false);

  const decision = plan.decisions.find((d) =>
    d.tagName === 'local-ssr-false' && d.renderPath === 'rejected'
  );
  assertExists(decision);
  assertEquals(decision.reason, 'duplicate custom element tag');
});

Deno.test('SSR Admission: parent with client-child → parent renderable, child client-only', () => {
  const islands: IslandDecl[] = [parentWithClientChild, localSsrFalse];
  const plan = buildSsrAdmissionPlan(islands);

  // Parent should be renderable
  assertEquals(plan.renderableTags.includes('parent-with-client-child'), true);

  // Child should be client-only
  assertEquals(plan.clientOnlyTags.includes('local-ssr-false'), true);

  // Verify reasons
  const parentDecision = plan.decisions.find((d) => d.tagName === 'parent-with-client-child');
  assertExists(parentDecision);
  assertEquals(parentDecision.renderPath, 'ssr+client');

  const childDecision = plan.decisions.find((d) => d.tagName === 'local-ssr-false');
  assertExists(childDecision);
  assertEquals(childDecision.renderPath, 'client-only');
});

Deno.test('SSR Admission: mixed islands → correct categorization', () => {
  const islands: IslandDecl[] = [
    localSsrTrue,
    localSsrFalse,
    packageSsrTrue,
    packageSsrFalse,
  ];
  const plan = buildSsrAdmissionPlan(islands);

  assertEquals(plan.renderableTags.length, 2);
  assertEquals(plan.clientOnlyTags.length, 2);
  assertEquals(plan.rejectedTags.length, 0);

  assertEquals(plan.renderableTags.includes('local-ssr-true'), true);
  assertEquals(plan.renderableTags.includes('package-ssr-true'), true);
  assertEquals(plan.clientOnlyTags.includes('local-ssr-false'), true);
  assertEquals(plan.clientOnlyTags.includes('package-ssr-false'), true);
});

Deno.test('SSR Admission: plan records reasons for all tags', () => {
  const islands: IslandDecl[] = [localSsrTrue, localSsrFalse];
  const plan = buildSsrAdmissionPlan(islands);

  assertEquals(plan.reasons['local-ssr-true'], 'less.ssr is true');
  assertEquals(plan.reasons['local-ssr-false'], 'local island exports less.ssr=false');
});

Deno.test('SSR Admission: decisions array has correct structure', () => {
  const islands: IslandDecl[] = [localSsrTrue];
  const plan = buildSsrAdmissionPlan(islands);

  assertEquals(plan.decisions.length, 1);

  const decision = plan.decisions[0];
  assertEquals(typeof decision.tagName, 'string');
  assertEquals(typeof decision.modulePath, 'string');
  assertEquals(['local', 'package', 'nested'].includes(decision.source), true);
  assertEquals(['ssr+client', 'client-only', 'rejected'].includes(decision.renderPath), true);
  assertEquals(typeof decision.reason, 'string');
});
