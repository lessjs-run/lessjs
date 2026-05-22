/**
 * @lessjs/hub - Indexer Tests
 *
 * v0.19.0: Test search index building and filtering.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { buildIndex, filterByCompatibility, searchPackages, sortEntries } from '../src/indexer.ts';
import type { CompatibilityTier, HubIndexEntry, HubPackageRecord } from '../src/schema.ts';

function entry(
  name: string,
  compat: CompatibilityTier,
  tags: string[] = [],
  ssr = false,
  desc = '',
  pkgScope = '',
): HubIndexEntry {
  return {
    name,
    scope: pkgScope,
    version: '1',
    description: desc,
    compatibility: compat,
    tags,
    source: 'npm' as const,
    safeToInstall: compat !== 'rejected',
    ssrCapable: ssr,
    submittedAt: '2026-05-17T00:00:00.000Z',
  };
}

function makeRecord(
  name: string,
  scope: string,
  compat: string,
  tags: string[],
): HubPackageRecord {
  return {
    schema: 'hub-package-v1',
    name,
    scope,
    version: '1.0.0',
    source: 'npm',
    repository: `https://github.com/${scope || 'user'}/${name}`,
    description: `The ${name} package`,
    manifestHash: 'abc',
    compatibility: compat as HubPackageRecord['compatibility'],
    compatibilityJustification: `Test ${compat}`,
    tags: tags.map((t) => ({
      tagName: t,
      compatibility: compat as HubPackageRecord['compatibility'],
      validationErrors: 0,
      validationWarnings: 0,
    })),
    reports: { validation: '{}' },
    snapshotPaths: {},
    installGuidance: {
      safeToInstall: true,
      command: `less add ${scope ? scope + '/' : ''}${name}`,
      configChanges: [],
      warnings: [],
      ssrCapable: compat === 'ssr-capable',
    },
    submittedAt: '2026-05-17T00:00:00.000Z',
    validatorVersion: '0.19.0',
  };
}

Deno.test('buildIndex: produces valid index from records', () => {
  const records = [
    makeRecord('pkg-a', '@scope', 'ssr-capable', ['btn-a', 'card-a']),
    makeRecord('pkg-b', '', 'client-only', ['btn-b']),
    makeRecord('pkg-c', '', 'rejected', ['bad-btn']),
  ];

  const index = buildIndex(records);

  assertEquals(index.schema, 'hub-index-v1');
  assertEquals(index.packages.length, 3);
  assertEquals(index.packages[0].tags.length, 2);
  assertEquals(index.packages[1].ssrCapable, false);
  assertEquals(index.packages[2].safeToInstall, true);
});

Deno.test('filterByCompatibility: filters correctly', () => {
  const entries = [
    entry('a', 'ssr-capable', [], true),
    entry('b', 'client-only'),
    entry('c', 'rejected'),
  ];

  assertEquals(filterByCompatibility(entries, 'all').length, 3);
  assertEquals(filterByCompatibility(entries, 'ssr-capable').length, 1);
  assertEquals(filterByCompatibility(entries, 'client-only').length, 1);
  assertEquals(filterByCompatibility(entries, 'rejected').length, 1);
  assertEquals(filterByCompatibility(entries, null).length, 3);
});

Deno.test('searchPackages: searches by name', () => {
  const entries = [
    entry('my-button', 'ssr-capable', ['cool-btn'], true, 'A button package'),
    entry('my-dialog', 'client-only', ['cool-dialog'], false, 'A dialog package'),
  ];

  const result = searchPackages(entries, 'button');
  assertEquals(result.length, 1);
  assertEquals(result[0].name, 'my-button');
});

Deno.test('searchPackages: searches by scope/name', () => {
  const entries = [
    entry('core', 'client-only', ['sl-btn'], false, '', '@shoelace'),
    entry('core', 'ssr-capable', ['less-btn'], true, '', '@lessjs'),
  ];

  const result = searchPackages(entries, 'shoelace');
  assertEquals(result.length, 1);
});

Deno.test('searchPackages: returns all for short query', () => {
  const entries = [entry('a', 'ssr-capable')];

  const result = searchPackages(entries, 'a'); // single char < 2
  assertEquals(result.length, 1); // returns all since query < 2 chars
});

Deno.test('sortEntries: sorts alphabetically', () => {
  const entries = [
    entry('z-pkg', 'ssr-capable'),
    entry('a-pkg', 'ssr-capable'),
  ];

  const sorted = sortEntries(entries);
  assertEquals(sorted[0].name, 'a-pkg');
  assertEquals(sorted[1].name, 'z-pkg');
});

Deno.test('sortEntries: respects scope prefix', () => {
  const entries = [
    entry('bar', 'ssr-capable', [], true, '', '@zoo'),
    entry('bar', 'ssr-capable', [], true, '', '@abc'),
  ];

  const sorted = sortEntries(entries);
  assertEquals(sorted[0].scope, '@abc');
  assertEquals(sorted[1].scope, '@zoo');
});
