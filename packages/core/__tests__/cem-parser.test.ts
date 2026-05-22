/**
 * @lessjs/core - CEM Parser Tests
 *
 * Tests for parsing Custom Elements Manifest (CEM) JSON.
 */

import {
  classifyCemManifest,
  extractLessDeclarations,
  findModulePathForTag,
  parseCem,
  validateModulePaths,
} from '../src/cem-parser.js';

import { assert, assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// 鈹€鈹€鈹€ Test Fixtures 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

const SSR_CAPABLE_CEM = JSON.stringify({
  schemaVersion: '1.0.0',
  packageName: '@test/ssr-capable',
  version: '1.0.0',
  modules: [
    {
      kind: 'javascript-module',
      path: './src/my-element.js',
      declarations: [
        {
          kind: 'custom-element',
          tagName: 'ssr-capable-element',
          className: 'MyElement',
          superClass: { name: 'LitElement' },
          less: { ssr: true, dsd: true, hydrate: 'load' },
        },
      ],
      exports: [
        {
          kind: 'default',
          declaration: { name: 'MyElement' },
        },
      ],
    },
  ],
});

const CLIENT_ONLY_CEM = JSON.stringify({
  schemaVersion: '1.0.0',
  packageName: '@test/client-only',
  version: '1.0.0',
  modules: [
    {
      kind: 'javascript-module',
      path: './src/client-only.js',
      declarations: [
        {
          kind: 'custom-element',
          tagName: 'client-only-element',
          className: 'ClientOnlyElement',
          // No less.ssr declaration
        },
      ],
    },
  ],
});

const INVALID_CEM_NO_MODULES = JSON.stringify({
  schemaVersion: '1.0.0',
});

const INVALID_CEM_BAD_TAG = JSON.stringify({
  schemaVersion: '1.0.0',
  modules: [
    {
      kind: 'javascript-module',
      path: './src/bad.js',
      declarations: [
        {
          kind: 'custom-element',
          tagName: 'BadTagName', // Invalid: no hyphen
          className: 'BadElement',
        },
      ],
    },
  ],
});

const INVALID_CEM_DUPLICATE_TAG = JSON.stringify({
  schemaVersion: '1.0.0',
  modules: [
    {
      kind: 'javascript-module',
      path: './src/element1.js',
      declarations: [
        {
          kind: 'custom-element',
          tagName: 'duplicate-element',
          className: 'Element1',
        },
      ],
    },
    {
      kind: 'javascript-module',
      path: './src/element2.js',
      declarations: [
        {
          kind: 'custom-element',
          tagName: 'duplicate-element',
          className: 'Element2',
        },
      ],
    },
  ],
});

// 鈹€鈹€鈹€ Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('CEM Parser: parse valid SSR-capable manifest', () => {
  const result = parseCem(SSR_CAPABLE_CEM);

  assertEquals(result.success, true);
  assertEquals(result.errors.length, 0);
  assertExists(result.manifest);

  const manifest = result.manifest!;
  assertEquals(manifest.schemaVersion, '1.0.0');
  assertEquals(manifest.packageName, '@test/ssr-capable');
  assertEquals(manifest.modules.length, 1);
  assertEquals(manifest.modules[0].declarations?.length, 1);

  const decl = manifest.modules[0].declarations![0] as Record<string, unknown>;
  assertEquals(decl.kind, 'custom-element');
  assertEquals(decl.tagName, 'ssr-capable-element');
});

Deno.test('CEM Parser: parse client-only manifest (no SSR declaration)', () => {
  const result = parseCem(CLIENT_ONLY_CEM);

  assertEquals(result.success, true);
  assertEquals(result.errors.length, 0);

  const manifest = result.manifest!;
  const decl = manifest.modules[0].declarations![0] as Record<string, unknown>;
  assertEquals(decl.tagName, 'client-only-element');
  // less field may be undefined for CEM-only packages
});

Deno.test('CEM Parser: reject manifest without modules array', () => {
  const result = parseCem(INVALID_CEM_NO_MODULES);

  assertEquals(result.success, false);
  assert(result.errors.some((e) => e.code === 'CEM_NO_MODULES'));
});

Deno.test('CEM Parser: reject invalid tag name (no hyphen)', () => {
  const result = parseCem(INVALID_CEM_BAD_TAG);

  assertEquals(result.success, false);
  assert(result.errors.some((e) => e.code === 'CEM_CE_INVALID_TAG_NAME'));
});

Deno.test('CEM Parser: reject duplicate tag names', () => {
  const result = parseCem(INVALID_CEM_DUPLICATE_TAG);

  assertEquals(result.success, false);
  assert(
    result.errors.some((e) => e.code === 'CEM_CE_INVALID_TAG_NAME') ||
      result.errors.some((e) => e.message.includes('duplicate')),
  );
});

Deno.test('CEM Parser: handle invalid JSON', () => {
  const result = parseCem('{ invalid json }');

  assertEquals(result.success, false);
  assert(result.errors.some((e) => e.code === 'CEM_PARSE_ERROR'));
});

Deno.test('CEM Parser: preserve unknown fields', () => {
  const json = JSON.stringify({
    schemaVersion: '1.0.0',
    modules: [],
    customField: 'should be preserved',
    anotherField: { nested: true },
  });

  const result = parseCem(json);

  assertEquals(result.success, true);
  assertExists(result.manifest);
  // deno-lint-ignore no-explicit-any
  const manifest = result.manifest as any;
  assertEquals(manifest.customField, 'should be preserved');
  assertEquals(manifest.anotherField.nested, true);
});

// 鈹€鈹€鈹€ Classification Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('Classify: SSR-capable with less.ssr = true', () => {
  const result = parseCem(SSR_CAPABLE_CEM);
  const classifications = classifyCemManifest(result.manifest!);

  assertEquals(classifications.length, 1);
  assertEquals(classifications[0].tagName, 'ssr-capable-element');
  assertEquals(classifications[0].tier, 'ssr-capable');
  assertEquals(classifications[0].ssr, true);
});

Deno.test('Classify: client-only for CEM-only package', () => {
  const result = parseCem(CLIENT_ONLY_CEM);
  const classifications = classifyCemManifest(result.manifest!);

  assertEquals(classifications.length, 1);
  assertEquals(classifications[0].tagName, 'client-only-element');
  assertEquals(classifications[0].tier, 'client-only');
  assertEquals(classifications[0].ssr, false);
  assert(classifications[0].reason.includes('CEM-only'));
});

Deno.test('Classify: rejected for duplicate tags', () => {
  const result = parseCem(INVALID_CEM_DUPLICATE_TAG);

  // Now parser detects duplicates, so success should be false
  assertEquals(result.success, false);
  assert(result.errors.some((e) => e.code === 'CEM_CE_DUPLICATE_TAG'));

  // Also test that classifyCemManifest handles duplicates correctly
  // by calling it with the manifest (ignoring parse errors)
  if (result.manifest) {
    const classifications = classifyCemManifest(result.manifest);
    const rejected = classifications.filter((c) => c.tier === 'rejected');
    assert(rejected.length > 0);
  }
});

Deno.test('Classify: conservative defaults applied', () => {
  const json = JSON.stringify({
    schemaVersion: '1.0.0',
    modules: [
      {
        kind: 'javascript-module',
        path: './src/element.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'test-element',
            className: 'TestElement',
            // No less field - should get defaults
          },
        ],
      },
    ],
  });

  const result = parseCem(json);
  const classifications = classifyCemManifest(result.manifest!);

  assertEquals(classifications.length, 1);
  assertEquals(classifications[0].ssr, false); // default
  assertEquals(classifications[0].dsd, false); // default
  assertEquals(classifications[0].hydrate, 'idle'); // default
});

// 鈹€鈹€鈹€ Extract Less Declarations Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('Extract: convert CEM to LessDeclaration', () => {
  const result = parseCem(SSR_CAPABLE_CEM);
  const declarations = extractLessDeclarations(result.manifest!);

  assertEquals(declarations.length, 1);
  assertEquals(declarations[0].tagName, 'ssr-capable-element');
  assertEquals(declarations[0].className, 'MyElement');
  assertEquals(declarations[0].superclassName, 'LitElement');
  assertExists(declarations[0].less);
  assertEquals(declarations[0].less!.ssr, true);
});

Deno.test('Extract: preserve attributes from CEM', () => {
  const json = JSON.stringify({
    schemaVersion: '1.0.0',
    modules: [
      {
        kind: 'javascript-module',
        path: './src/element.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'element-with-attrs',
            attributes: [
              { name: 'variant', type: 'string', defaultValue: 'primary' },
              { name: 'disabled', type: 'boolean', defaultValue: 'false' },
            ],
          },
        ],
      },
    ],
  });

  const result = parseCem(json);
  const declarations = extractLessDeclarations(result.manifest!);

  assertEquals(declarations[0].attributes?.length, 2);
  assertEquals(declarations[0].attributes![0].name, 'variant');
  assertEquals(declarations[0].attributes![0].type, 'string');
});

// 鈹€鈹€鈹€ Find Module Path Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('Find module path for tag name', () => {
  const result = parseCem(SSR_CAPABLE_CEM);
  const modulePath = findModulePathForTag(result.manifest!, 'ssr-capable-element');

  assertEquals(modulePath, './src/my-element.js');
});

Deno.test('Find module path: return undefined for unknown tag', () => {
  const result = parseCem(SSR_CAPABLE_CEM);
  const modulePath = findModulePathForTag(result.manifest!, 'unknown-element');

  assertEquals(modulePath, undefined);
});

// 鈹€鈹€鈹€ Validate Module Paths Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('Validate module paths: accept valid relative paths', () => {
  const json = JSON.stringify({
    schemaVersion: '1.0.0',
    modules: [
      {
        kind: 'javascript-module',
        path: './src/valid.js',
        declarations: [],
      },
      {
        kind: 'javascript-module',
        path: '../parent/invalid.js',
        declarations: [],
      },
    ],
  });

  const result = parseCem(json);
  const errors = validateModulePaths(result.manifest!, '/fake/package/root');

  // Should not have path format errors (files don't exist, but paths are valid format)
  const pathErrors = errors.filter((e) => e.code === 'CEM_INVALID_MODULE_PATH');
  assertEquals(pathErrors.length, 0);
});

Deno.test('Validate module paths: reject absolute paths', () => {
  const json = JSON.stringify({
    schemaVersion: '1.0.0',
    modules: [
      {
        kind: 'javascript-module',
        path: '/absolute/path.js',
        declarations: [],
      },
    ],
  });

  const result = parseCem(json);
  const errors = validateModulePaths(result.manifest!, '/fake/package/root');

  assert(errors.some((e) => e.code === 'CEM_INVALID_MODULE_PATH'));
});

// 鈹€鈹€鈹€ Integration Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('Integration: full parse -> classify -> extract flow', () => {
  // 1. Parse
  const parseResult = parseCem(SSR_CAPABLE_CEM);
  assertEquals(parseResult.success, true);

  // 2. Classify
  const classifications = classifyCemManifest(parseResult.manifest!);
  assertEquals(classifications.length, 1);
  assertEquals(classifications[0].tier, 'ssr-capable');

  // 3. Extract
  const declarations = extractLessDeclarations(parseResult.manifest!);
  assertEquals(declarations.length, 1);
  assertEquals(declarations[0].tagName, 'ssr-capable-element');

  // 4. Find module
  const modulePath = findModulePathForTag(parseResult.manifest!, 'ssr-capable-element');
  assertEquals(modulePath, './src/my-element.js');
});

Deno.test('Integration: client-only package gets conservative treatment', () => {
  const parseResult = parseCem(CLIENT_ONLY_CEM);
  const classifications = classifyCemManifest(parseResult.manifest!);

  // Should be classified as client-only
  assertEquals(classifications[0].tier, 'client-only');

  // Should have conservative defaults
  const less = classifications[0];
  assertEquals(less.ssr, false);
  assertEquals(less.dsd, false);
  assertEquals(less.hydrate, 'idle');
});
