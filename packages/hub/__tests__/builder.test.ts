/**
 * @openelement/hub - Builder Tests
 *
 * v0.19.0: Test HubPackageRecord construction from artifacts.
 * v0.19.0 fix: buildPackageRecord is now async (computes manifestHash).
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import { buildInstallGuidance, buildPackageRecord } from '../src/builder.ts';
import type { BuildPackageRecordOptions, HubTagRecord } from '../src/schema.ts';

const sampleTags: HubTagRecord[] = [
  {
    tagName: 'my-button',
    compatibility: 'ssr-capable',
    validationErrors: 0,
    validationWarnings: 0,
  },
  {
    tagName: 'my-dialog',
    compatibility: 'client-only',
    validationErrors: 0,
    validationWarnings: 1,
  },
];

Deno.test('buildPackageRecord: produces valid record', async () => {
  const opts: BuildPackageRecordOptions = {
    name: 'my-package',
    scope: '@example',
    version: '2.0.0',
    source: 'npm',
    compatibility: 'ssr-capable',
    compatibilityJustification: 'Has LessJS SSR metadata.',
    tags: sampleTags,
    validationReport: JSON.stringify({ packageName: '@example/my-package', valid: true }),
    dsdReport: JSON.stringify({ totalPages: 1, dsdComponents: 2 }),
    repository: 'https://github.com/example/my-package',
    description: 'An example package',
    submittedBy: 'testuser',
    validatorVersion: '0.19.0',
  };

  const record = await buildPackageRecord(opts);

  assertEquals(record.schema, 'hub-package-v1');
  assertEquals(record.name, 'my-package');
  assertEquals(record.scope, '@example');
  assertEquals(record.version, '2.0.0');
  assertEquals(record.compatibility, 'ssr-capable');
  assertEquals(record.tags.length, 2);
  assertEquals(record.reports.validation, opts.validationReport);
  assertEquals(record.reports.dsd, opts.dsdReport);
  assertEquals(record.installGuidance.safeToInstall, true);
  assertEquals(record.installGuidance.ssrCapable, true);
  assertEquals(record.installGuidance.command, 'less add @example/my-package');
  assertEquals(record.submittedBy, 'testuser');
  assertEquals(record.validatorVersion, '0.19.0');
  // manifestHash should be empty when no manifestContent provided
  assertEquals(record.manifestHash, '');
});

Deno.test('buildPackageRecord: computes manifestHash from manifestContent', async () => {
  const opts: BuildPackageRecordOptions = {
    name: 'hashed-pkg',
    scope: '@test',
    version: '1.0.0',
    source: 'npm',
    compatibility: 'client-only',
    compatibilityJustification: 'No SSR.',
    tags: [{
      tagName: 'test-btn',
      compatibility: 'client-only',
      validationErrors: 0,
      validationWarnings: 0,
    }],
    validationReport: JSON.stringify({ packageName: '@test/hashed-pkg', valid: true }),
    validatorVersion: '0.19.0',
    manifestContent: JSON.stringify({ schemaVersion: '1.0.0', modules: [] }),
  };

  const record = await buildPackageRecord(opts);

  // SHA-256 of '{"schemaVersion":"1.0.0","modules":[]}' should be non-empty
  assert(record.manifestHash.length > 0, 'manifestHash should not be empty');
  assertEquals(record.manifestHash.length, 64, 'SHA-256 hex should be 64 chars');
});

Deno.test('buildPackageRecord: manifestHash is deterministic', async () => {
  const content = JSON.stringify({ schemaVersion: '1.0.0', modules: [] });

  const opts1: BuildPackageRecordOptions = {
    name: 'a',
    scope: '',
    version: '1',
    source: 'npm',
    compatibility: 'client-only',
    compatibilityJustification: '',
    tags: [],
    validationReport: '{}',
    validatorVersion: '0.19.0',
    manifestContent: content,
  };
  const opts2: BuildPackageRecordOptions = {
    name: 'b',
    scope: '',
    version: '1',
    source: 'npm',
    compatibility: 'client-only',
    compatibilityJustification: '',
    tags: [],
    validationReport: '{}',
    validatorVersion: '0.19.0',
    manifestContent: content,
  };

  const [r1, r2] = await Promise.all([buildPackageRecord(opts1), buildPackageRecord(opts2)]);
  assertEquals(r1.manifestHash, r2.manifestHash, 'same content should produce same hash');
});

Deno.test('buildPackageRecord: rejected package produces unsafe install', async () => {
  const opts: BuildPackageRecordOptions = {
    name: 'bad-pkg',
    scope: '',
    version: '0.0.1',
    source: 'npm',
    compatibility: 'rejected',
    compatibilityJustification: 'Duplicate tag names.',
    tags: [{
      tagName: 'dup-btn',
      compatibility: 'rejected',
      validationErrors: 2,
      validationWarnings: 0,
    }],
    validationReport: JSON.stringify({
      packageName: 'bad-pkg',
      valid: false,
      errors: ['Duplicate tag'],
    }),
    validatorVersion: '0.19.0',
  };

  const record = await buildPackageRecord(opts);

  assertEquals(record.installGuidance.safeToInstall, false);
  assertEquals(record.installGuidance.ssrCapable, false);
  assert(record.installGuidance.warnings.length > 0);
});

Deno.test('buildPackageRecord: experimental-dom sets SSR with warning', async () => {
  const opts: BuildPackageRecordOptions = {
    name: 'exp-pkg',
    scope: '',
    version: '1.0.0',
    source: 'local',
    compatibility: 'experimental-dom',
    compatibilityJustification: 'DOM simulation enabled.',
    tags: [{
      tagName: 'exp-widget',
      compatibility: 'experimental-dom',
      validationErrors: 0,
      validationWarnings: 0,
    }],
    validationReport: JSON.stringify({ packageName: 'exp-pkg', valid: true }),
    validatorVersion: '0.19.0',
  };

  const record = await buildPackageRecord(opts);

  assertEquals(record.installGuidance.ssrCapable, true);
  assert(record.installGuidance.warnings.some((w) => w.includes('experimental')));
});

Deno.test('buildInstallGuidance: client-only with no SSR', () => {
  const guidance = buildInstallGuidance('client-only', sampleTags, 'my-pkg', '');
  assertEquals(guidance.safeToInstall, true);
  assertEquals(guidance.ssrCapable, false);
  assert(guidance.warnings.some((w) => w.includes('no SSR metadata')));
});

Deno.test('buildInstallGuidance: rejected not safe to install', () => {
  const guidance = buildInstallGuidance('rejected', [], 'bad', '');
  assertEquals(guidance.safeToInstall, false);
  assertEquals(guidance.ssrCapable, false);
});

Deno.test('buildInstallGuidance: scoped package correct command', () => {
  const guidance = buildInstallGuidance('ssr-capable', sampleTags, 'my-pkg', '@scope');
  assertEquals(guidance.command, 'less add @scope/my-pkg');
});
