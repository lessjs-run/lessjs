/**
 * Tests for @openelement/core CEM manifest validation.
 *
 * Tests cover:
 * - Schema shape validation
 * - Tag name validation
 * - Duplicate detection
 * - Module path validation
 * - Less extension validation
 * - Overall compatibility determination
 * - JSON parsing convenience wrapper
 * - Deterministic output
 */

import { validateManifest, validateManifestFromJson } from '../src/validate-manifest.ts';

import type { CustomElementsManifest } from '@openelement/cem/types';

import { assert, assertEquals } from 'jsr:@std/assert@1';

// 鈹€鈹€鈹€ Helpers 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

function makeValidManifest(
  overrides?: Partial<CustomElementsManifest>,
): CustomElementsManifest {
  return {
    schemaVersion: '1.0.0',
    packageName: '@test/valid-package',
    version: '1.0.0',
    modules: [
      {
        kind: 'javascript-module',
        path: './src/my-element.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-element',
            className: 'MyElement',
            superClass: { name: 'LitElement', module: 'lit' },
          },
        ],
      },
    ],
    ...overrides,
  };
}

// 鈹€鈹€鈹€ Schema Validation 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('validateManifest - valid manifest returns valid=true', () => {
  const report = validateManifest(makeValidManifest());
  assertEquals(report.valid, true);
  assertEquals(report.errors.length, 0);
});

Deno.test('validateManifest - missing schemaVersion returns error', () => {
  const manifest = makeValidManifest({ schemaVersion: undefined as unknown as string });
  const report = validateManifest(manifest);
  assertEquals(report.valid, false);
  assert(report.errors.some((e) => e.code === 'MISSING_SCHEMA_VERSION'));
});

Deno.test('validateManifest - missing modules array returns error', () => {
  const manifest = makeValidManifest({ modules: undefined as unknown as [] });
  const report = validateManifest(manifest);
  assertEquals(report.valid, false);
  assert(report.errors.some((e) => e.code === 'MISSING_MODULES'));
});

Deno.test('validateManifest - empty modules array returns warning', () => {
  const manifest = makeValidManifest({ modules: [] });
  const report = validateManifest(manifest);
  assert(report.warnings.some((w) => w.code === 'EMPTY_MODULES'));
});

Deno.test('validateManifest - module missing path returns warning', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module' as const,
        path: '',
        declarations: [
          {
            kind: 'custom-element' as const,
            tagName: 'my-element',
            className: 'MyElement',
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assert(report.warnings.some((w) => w.code === 'MISSING_MODULE_PATH'));
});

Deno.test('validateManifest - no custom elements returns warning', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module' as const,
        path: './src/utils.js',
        declarations: [],
      },
    ],
  });
  const report = validateManifest(manifest);
  assert(report.warnings.some((w) => w.code === 'NO_CUSTOM_ELEMENTS'));
});

Deno.test('validateManifest - exports without declarations returns warning', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module' as const,
        path: './src/my-element.js',
        declarations: [],
        exports: [{
          kind: 'named' as const,
          name: 'MyElement',
          declaration: { name: 'MyElement' },
        }],
      },
    ],
  });
  const report = validateManifest(manifest);
  assert(report.warnings.some((w) => w.code === 'EXPORTS_WITHOUT_DECLARATIONS'));
});

// 鈹€鈹€鈹€ Tag Name Validation 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('validateManifest - empty tag name returns error', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/my-element.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: '',
            className: 'MyElement',
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assertEquals(report.valid, false);
  assert(report.errors.some((e) => e.code === 'EMPTY_TAG_NAME'));
});

Deno.test('validateManifest - invalid tag name returns error', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/bad.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'INVALID_TAG',
            className: 'BadElement',
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assertEquals(report.valid, false);
  assert(report.errors.some((e) => e.code === 'INVALID_TAG_NAME'));
});

// 鈹€鈹€鈹€ Duplicate Detection 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('validateManifest - duplicate tags return error', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/button-one.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-button',
            className: 'ButtonOne',
          },
        ],
      },
      {
        kind: 'javascript-module',
        path: './src/button-two.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-button',
            className: 'ButtonTwo',
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assertEquals(report.valid, false);
  assert(report.errors.some((e) => e.code === 'DUPLICATE_TAG'));
});

// 鈹€鈹€鈹€ Module Path Validation 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('validateManifest - absolute module path returns error', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: '/etc/my-element.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-element',
            className: 'MyElement',
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assertEquals(report.valid, false);
  assert(report.errors.some((e) => e.code === 'INVALID_MODULE_PATH'));
});

Deno.test('validateManifest - path traversal returns error', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/../../etc/passwd',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-element',
            className: 'MyElement',
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assertEquals(report.valid, false);
  assert(report.errors.some((e) => e.code === 'INVALID_MODULE_PATH'));
});

Deno.test('validateManifest - URL module path returns error', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: 'https://evil.com/shell.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-element',
            className: 'MyElement',
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assertEquals(report.valid, false);
  assert(report.errors.some((e) => e.code === 'INVALID_MODULE_PATH'));
});

// 鈹€鈹€鈹€ Less Extension Validation 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('validateManifest - invalid ssr type returns error', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/my-element.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-element',
            className: 'MyElement',
            less: { ssr: 'yes' as unknown as boolean },
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assert(report.errors.some((e) => e.code === 'INVALID_SSR_VALUE'));
});

Deno.test('validateManifest - invalid dsd type returns error', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/my-element.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-element',
            className: 'MyElement',
            less: { dsd: 1 as unknown as boolean },
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assert(report.errors.some((e) => e.code === 'INVALID_DSD_VALUE'));
});

Deno.test('validateManifest - invalid hydrate strategy returns error', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/my-element.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-element',
            className: 'MyElement',
            less: { hydrate: 'never' as 'load' | 'idle' | 'visible' | 'only' },
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assert(report.errors.some((e) => e.code === 'INVALID_HYDRATE_STRATEGY'));
});

Deno.test('validateManifest - invalid layer returns error', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/my-element.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-element',
            className: 'MyElement',
            less: { layer: 'invalid-layer' as 'dsd-static' | 'dsd-interactive' | 'pure-island' },
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assert(report.errors.some((e) => e.code === 'INVALID_LAYER'));
});

// 鈹€鈹€鈹€ Compatibility Determination 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('validateManifest - CEM-only package defaults to client-only', () => {
  const report = validateManifest(makeValidManifest());
  assertEquals(report.compatibility, 'client-only');
});

Deno.test('validateManifest - ssr:true tag sets ssr-capable', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/my-element.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-element',
            className: 'MyElement',
            less: { ssr: true },
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assertEquals(report.compatibility, 'ssr-capable');
  assertEquals(report.tags[0].ssr, true);
});

Deno.test('validateManifest - errors set overall to rejected', () => {
  const manifest = makeValidManifest({ schemaVersion: undefined as unknown as string });
  const report = validateManifest(manifest);
  assertEquals(report.compatibility, 'rejected');
});

// 鈹€鈹€鈹€ Tag Result Structure 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('validateManifest - per-tag results have correct structure', () => {
  const report = validateManifest(makeValidManifest());
  assertEquals(report.tags.length, 1);
  assertEquals(report.tags[0].tagName, 'my-element');
  assertEquals(report.tags[0].valid, true);
  assertEquals(report.tags[0].className, 'MyElement');
});

Deno.test('validateManifest - invalid tag marks tag as not valid', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/bad.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'bad',
            className: 'BadElement',
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assertEquals(report.tags[0].valid, false);
});

// 鈹€鈹€鈹€ JSON Convenience Wrapper 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('validateManifestFromJson - valid JSON returns valid report', () => {
  const json = JSON.stringify(makeValidManifest());
  const report = validateManifestFromJson(json);
  assertEquals(report.valid, true);
});

Deno.test('validateManifestFromJson - malformed JSON returns error', () => {
  const report = validateManifestFromJson('{not valid json}');
  assertEquals(report.valid, false);
  assertEquals(report.compatibility, 'rejected');
  assert(report.errors.some((e) => e.code === 'JSON_PARSE_ERROR'));
});

Deno.test('validateManifestFromJson - empty string returns error', () => {
  const report = validateManifestFromJson('');
  assertEquals(report.valid, false);
});

Deno.test('validateManifest - output is deterministic for same input', () => {
  const report1 = validateManifest(makeValidManifest());
  const report2 = validateManifest(makeValidManifest());
  assertEquals(report1.errors.length, report2.errors.length);
  assertEquals(report1.tags.length, report2.tags.length);
  assertEquals(report1.compatibility, report2.compatibility);
  assertEquals(report1.valid, report2.valid);
});

// 鈹€鈹€鈹€ Edge Cases 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('validateManifest - empty modules with no declarations passes basic validation', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/utils.js',
        declarations: [],
      },
    ],
  });
  const report = validateManifest(manifest);
  assert(report.warnings.some((w) => w.code === 'NO_CUSTOM_ELEMENTS'));
});

Deno.test('validateManifest - multiple valid tags all pass', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/button.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-button',
            className: 'MyButton',
          },
          {
            kind: 'custom-element',
            tagName: 'my-card',
            className: 'MyCard',
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assertEquals(report.tags.length, 2);
  assert(report.tags.every((t) => t.valid === true));
});

Deno.test('validateManifest - superclass with invalid path is flagged', () => {
  const manifest = makeValidManifest({
    modules: [
      {
        kind: 'javascript-module',
        path: './src/my-element.js',
        declarations: [
          {
            kind: 'custom-element',
            tagName: 'my-element',
            className: 'MyElement',
            superClass: { name: 'BaseElement', module: '/absolute/path/base.js' },
          },
        ],
      },
    ],
  });
  const report = validateManifest(manifest);
  assert(report.errors.some((e) => e.code === 'INVALID_SUPERCLASS_PATH'));
});
