/**
 * @openelement/hub - Submitter Tests
 *
 * v0.19.0: Test submission bundling, serialization, and validation.
 * GitHub PR creation is tested via integration tests only.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  buildSubmissionBundle,
  createHtmlArtifact,
  createJsonArtifact,
  createTextArtifact,
  deserializeBundle,
  serializeBundle,
} from '../src/submitter.ts';
import type { HubArtifact, HubPackageRecord } from '../src/schema.ts';

const sampleRecord: HubPackageRecord = {
  schema: 'hub-package-v1',
  name: 'test-pkg',
  scope: '@test',
  version: '1.0.0',
  source: 'npm',
  repository: 'https://github.com/test/pkg',
  description: 'Test package',
  manifestHash: 'sha256-abc',
  compatibility: 'client-only',
  compatibilityJustification: 'No SSR metadata.',
  tags: [
    {
      tagName: 'test-btn',
      compatibility: 'client-only',
      validationErrors: 0,
      validationWarnings: 0,
    },
  ],
  reports: {
    validation: JSON.stringify({ packageName: '@test/test-pkg', valid: true }),
  },
  snapshotPaths: {},
  installGuidance: {
    safeToInstall: true,
    command: 'open add @test/test-pkg',
    configChanges: ['client-only'],
    warnings: ['No SSR metadata.'],
    ssrCapable: false,
  },
  submittedAt: '2026-05-17T00:00:00.000Z',
  validatorVersion: '0.19.0',
};

Deno.test('buildSubmissionBundle: constructs valid bundle', () => {
  const artifacts: HubArtifact[] = [
    { path: 'custom-elements.json', contentType: 'application/json', content: '{}' },
  ];

  const bundle = buildSubmissionBundle(sampleRecord, artifacts);

  assertEquals(bundle.schema, 'hub-submission-v1');
  assertEquals(bundle.package.name, 'test-pkg');
  assertEquals(bundle.artifacts.length, 1);
  assertEquals(bundle.artifacts[0].path, 'custom-elements.json');
});

Deno.test('buildSubmissionBundle: handles zero artifacts', () => {
  const bundle = buildSubmissionBundle(sampleRecord, []);

  assertEquals(bundle.artifacts.length, 0);
});

Deno.test('serializeBundle/deserializeBundle: round trip', () => {
  const artifacts: HubArtifact[] = [
    { path: 'test.json', contentType: 'application/json', content: '{"key":"value"}' },
  ];
  const bundle = buildSubmissionBundle(sampleRecord, artifacts);

  const json = serializeBundle(bundle);
  const parsed = deserializeBundle(json);

  assertEquals(parsed.schema, 'hub-submission-v1');
  assertEquals(parsed.package.name, 'test-pkg');
  assertEquals(parsed.artifacts.length, 1);
  assertEquals(parsed.artifacts[0].content, '{"key":"value"}');
});

Deno.test('createTextArtifact: creates text artifact', () => {
  const artifact = createTextArtifact('README.md', '# Hello');

  assertEquals(artifact.path, 'README.md');
  assertEquals(artifact.contentType, 'text/plain');
  assertEquals(artifact.content, '# Hello');
});

Deno.test('createJsonArtifact: creates JSON artifact', () => {
  const data = { hello: 'world', nested: { key: 'value' } };
  const artifact = createJsonArtifact('data.json', data);

  assertEquals(artifact.path, 'data.json');
  assertEquals(artifact.contentType, 'application/json');
  assertEquals(JSON.parse(artifact.content).hello, 'world');
});

Deno.test('createHtmlArtifact: creates HTML artifact', () => {
  const artifact = createHtmlArtifact('snapshot.html', '<div>Hello</div>');

  assertEquals(artifact.path, 'snapshot.html');
  assertEquals(artifact.contentType, 'text/html');
  assertEquals(artifact.content, '<div>Hello</div>');
});

Deno.test('buildSubmissionBundle: handles large bundle', () => {
  const artifacts: HubArtifact[] = [];
  for (let i = 0; i < 100; i++) {
    artifacts.push({
      path: `file-${i}.json`,
      contentType: 'application/json',
      content: JSON.stringify({ index: i, data: 'x'.repeat(100) }),
    });
  }

  const bundle = buildSubmissionBundle(sampleRecord, artifacts);
  assertEquals(bundle.artifacts.length, 100);
});
