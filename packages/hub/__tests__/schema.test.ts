/**
 * @lessjs/hub — Schema Validation Tests
 *
 * v0.19.0: Test all schema types and validators.
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  validateHubIndex,
  validateHubPackageRecord,
  validateHubSubmission,
} from '../src/schema.ts';
import type { HubIndex, HubPackageRecord, HubSubmission } from '../src/schema.ts';

Deno.test('validateHubPackageRecord: valid record passes', () => {
  const record: HubPackageRecord = {
    schema: 'hub-package-v1',
    name: 'test-pkg',
    scope: '@test',
    version: '1.0.0',
    source: 'npm',
    repository: 'https://github.com/test/pkg',
    description: 'A test package',
    manifestHash: 'sha256-test123',
    compatibility: 'ssr-capable',
    compatibilityJustification: 'Has LessJS SSR metadata.',
    tags: [
      {
        tagName: 'test-button',
        compatibility: 'ssr-capable',
        validationErrors: 0,
        validationWarnings: 0,
      },
    ],
    reports: {
      validation: JSON.stringify({ valid: true }),
    },
    snapshotPaths: {},
    installGuidance: {
      safeToInstall: true,
      command: 'less add @test/test-pkg',
      configChanges: ['SSR enabled'],
      warnings: [],
      ssrCapable: true,
    },
    submittedAt: '2026-05-17T00:00:00.000Z',
    validatorVersion: '0.19.0',
  };

  const errors = validateHubPackageRecord(record);
  assertEquals(errors, []);
});

Deno.test('validateHubPackageRecord: missing name fails', () => {
  const record = {
    schema: 'hub-package-v1',
    name: '',
    scope: '',
    version: '1.0.0',
    source: 'npm',
    compatibility: 'client-only',
    compatibilityJustification: 'No SSR.',
    tags: [],
    reports: { validation: '{}' },
    snapshotPaths: {},
    installGuidance: {
      safeToInstall: true,
      command: 'less add test',
      configChanges: [],
      warnings: [],
      ssrCapable: false,
    },
    submittedAt: '2026-05-17T00:00:00.000Z',
    validatorVersion: '0.19.0',
  };

  const errors = validateHubPackageRecord(record);
  assert(errors.length > 0);
  assert(errors.some((e) => e.path === 'name'));
});

Deno.test('validateHubPackageRecord: invalid compatibility fails', () => {
  const record = {
    schema: 'hub-package-v1',
    name: 'test',
    scope: '',
    version: '1.0.0',
    source: 'npm',
    compatibility: 'super-safe',
    compatibilityJustification: 'Test',
    tags: [],
    reports: { validation: '{}' },
    snapshotPaths: {},
    installGuidance: {
      safeToInstall: true,
      command: 'less add test',
      configChanges: [],
      warnings: [],
      ssrCapable: false,
    },
    submittedAt: '2026-05-17T00:00:00.000Z',
    validatorVersion: '0.19.0',
  };

  const errors = validateHubPackageRecord(record);
  assert(errors.some((e) => e.path === 'compatibility'));
});

Deno.test('validateHubPackageRecord: missing reports fails', () => {
  const record = {
    schema: 'hub-package-v1',
    name: 'test',
    scope: '',
    version: '1.0.0',
    source: 'npm',
    compatibility: 'client-only',
    compatibilityJustification: 'Test',
    tags: [],
    reports: {},
    snapshotPaths: {},
    installGuidance: {
      safeToInstall: true,
      command: 'less add test',
      configChanges: [],
      warnings: [],
      ssrCapable: false,
    },
    submittedAt: '2026-05-17T00:00:00.000Z',
    validatorVersion: '0.19.0',
  };

  const errors = validateHubPackageRecord(record);
  assert(errors.some((e) => e.path.startsWith('reports')));
});

Deno.test('validateHubIndex: valid index passes', () => {
  const index: HubIndex = {
    schema: 'hub-index-v1',
    updatedAt: '2026-05-17T00:00:00.000Z',
    packages: [
      {
        name: 'test',
        scope: '',
        version: '1.0.0',
        description: 'Test',
        compatibility: 'client-only',
        tags: ['test-btn'],
        source: 'npm',
        safeToInstall: true,
        ssrCapable: false,
        submittedAt: '2026-05-17T00:00:00.000Z',
      },
    ],
  };

  const errors = validateHubIndex(index);
  assertEquals(errors, []);
});

Deno.test('validateHubIndex: missing schema fails', () => {
  const errors = validateHubIndex({ updatedAt: '2026-05-17', packages: [] });
  assert(errors.some((e) => e.path === 'schema'));
});

Deno.test('validateHubSubmission: valid submission passes', () => {
  const submission: HubSubmission = {
    schema: 'hub-submission-v1',
    package: {
      schema: 'hub-package-v1',
      name: 'test',
      scope: '',
      version: '1.0.0',
      source: 'npm',
      manifestHash: 'abc',
      compatibility: 'client-only',
      compatibilityJustification: 'No SSR.',
      tags: [],
      reports: { validation: '{}' },
      snapshotPaths: {},
      installGuidance: {
        safeToInstall: true,
        command: 'less add test',
        configChanges: [],
        warnings: [],
        ssrCapable: false,
      },
      submittedAt: '2026-05-17T00:00:00.000Z',
      validatorVersion: '0.19.0',
    },
    artifacts: [
      {
        path: 'custom-elements.json',
        contentType: 'application/json',
        content: '{}',
      },
    ],
  };

  const errors = validateHubSubmission(submission);
  assertEquals(errors, []);
});

Deno.test('validateHubSubmission: missing artifacts fails', () => {
  const submission = {
    schema: 'hub-submission-v1',
    package: {
      schema: 'hub-package-v1',
      name: 'test',
      scope: '',
      version: '1.0.0',
      source: 'npm',
      manifestHash: 'abc',
      compatibility: 'client-only',
      compatibilityJustification: 'No SSR.',
      tags: [],
      reports: { validation: '{}' },
      snapshotPaths: {},
      installGuidance: {
        safeToInstall: true,
        command: 'less add test',
        configChanges: [],
        warnings: [],
        ssrCapable: false,
      },
      submittedAt: '2026-05-17T00:00:00.000Z',
      validatorVersion: '0.19.0',
    },
  };

  const errors = validateHubSubmission(submission);
  assert(errors.length > 0);
});
