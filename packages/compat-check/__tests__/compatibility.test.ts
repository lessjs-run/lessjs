/**
 * @lessjs/core - Compatibility Classifier Tests
 */

import {
  classifyCemManifest,
  classifyComponent,
  classifyComponents,
  classifyLessManifest,
  getClassificationSummary,
  isKnownSsrAdapter,
  isKnownSsrSuperclass,
  mergeClassifications,
  validateModulePath,
} from '../src/compatibility.js';
import { isValidTagName } from '@lessjs/core';

import {
  assert,
  assertEquals,
  assertStringIncludes,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';

// 鈹€鈹€鈹€ Single Component Classification Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('classifyComponent: SSR-capable with LitElement', () => {
  const result = classifyComponent({
    tagName: 'my-lit-element',
    modulePath: './my-element.js',
    source: 'local',
    less: { ssr: true, dsd: true, hydrate: 'load' },
    superClass: 'LitElement',
  });

  assertEquals(result.tier, 'ssr-capable');
  assertEquals(result.ssr, true);
  assertEquals(result.dsd, true);
  assert(result.reason.includes('LitElement'));
});

Deno.test('classifyComponent: explicit client-only with ssr: false', () => {
  const result = classifyComponent({
    tagName: 'client-only-element',
    modulePath: './client-only.js',
    source: 'package',
    less: { ssr: false },
  });

  assertEquals(result.tier, 'client-only');
  assertEquals(result.ssr, false);
  assert(result.reason.includes('ssr: false'));
});

Deno.test('classifyComponent: CEM-only package defaults to client-only', () => {
  const result = classifyComponent({
    tagName: 'cem-only-element',
    modulePath: './cem-only.js',
    source: 'package',
    // No less field - CEM-only
  });

  assertEquals(result.tier, 'client-only');
  assertEquals(result.ssr, false);
  assert(result.reason.includes('CEM-only'));
});

Deno.test('classifyComponent: invalid tag name is rejected', () => {
  const result = classifyComponent({
    tagName: 'InvalidTagName', // No hyphen
    modulePath: './bad.js',
    source: 'local',
  });

  assertEquals(result.tier, 'rejected');
  assert(result.reason.includes('Invalid tag name'));
});

Deno.test('classifyComponent: ssr: true without adapter is client-only by default', () => {
  const result = classifyComponent({
    tagName: 'unknown-element',
    modulePath: './unknown.js',
    source: 'package',
    less: { ssr: true }, // No adapter/layer
  });

  // Without enableExperimentalDom, falls back to client-only
  assertEquals(result.tier, 'client-only');
  assert(result.reason.includes('no adapter/layer declared'));
});

Deno.test('classifyComponent: ssr: true with layer is SSR-capable', () => {
  const result = classifyComponent({
    tagName: 'layered-element',
    modulePath: './layered.js',
    source: 'local',
    less: { ssr: true, layer: 'dsd-interactive' },
  });

  assertEquals(result.tier, 'ssr-capable');
  assert(result.reason.includes('dsd-interactive'));
});

Deno.test('classifyComponent: experimental DOM requires opt-in', () => {
  const result = classifyComponent(
    {
      tagName: 'experimental-element',
      modulePath: './experimental.js',
      source: 'package',
      less: { ssr: true }, // No adapter
    },
    { enableExperimentalDom: true },
  );

  assertEquals(result.tier, 'experimental-dom');
  assert(result.reason.includes('experimental'));
});

// 鈹€鈹€鈹€ Module Path Validation Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('validateModulePath: accepts relative paths', () => {
  assertEquals(validateModulePath('./src/element.js').valid, true);
  assertEquals(validateModulePath('./element.js').valid, true);
  assertEquals(validateModulePath('element.js').valid, true);
});

Deno.test('validateModulePath: rejects absolute paths', () => {
  assertEquals(validateModulePath('/absolute/path.js').valid, false);
  assertEquals(validateModulePath('C:/path/to/file.js').valid, false);
});

Deno.test('validateModulePath: rejects parent traversal', () => {
  assertEquals(validateModulePath('../../etc/passwd').valid, false);
  assertEquals(validateModulePath('../root/.ssh').valid, false);
});

Deno.test('validateModulePath: rejects URLs', () => {
  assertEquals(validateModulePath('https://evil.com/malicious.js').valid, false);
  assertEquals(validateModulePath('http://example.com').valid, false);
});

Deno.test('validateModulePath: rejects dangerous patterns', () => {
  assertEquals(validateModulePath('./src/.env').valid, false);
  assertEquals(validateModulePath('./config/.git/config').valid, false);
  assertEquals(validateModulePath('./lib/etc/passwd').valid, false);
});

Deno.test('validateModulePath: rejects empty path', () => {
  assertEquals(validateModulePath('').valid, false);
  // deno-lint-ignore no-explicit-any
  assertEquals(validateModulePath(null as any).valid, false);
});

// 鈹€鈹€鈹€ Batch Classification Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('classifyComponents: detects duplicate tags', () => {
  const inputs = [
    { tagName: 'my-element', modulePath: './a.js', source: 'local' as const },
    { tagName: 'my-element', modulePath: './b.js', source: 'package' as const },
  ];

  const result = classifyComponents(inputs);

  assertEquals(result.stats.totalComponents, 2);
  assertEquals(result.stats.rejectedCount, 1);
  assert(result.rejectedTags.includes('my-element'));
});

Deno.test('classifyComponents: validates module paths', () => {
  const inputs = [
    { tagName: 'valid-element', modulePath: './valid.js', source: 'local' as const },
    { tagName: 'bad-element', modulePath: '/etc/passwd', source: 'local' as const },
  ];

  const result = classifyComponents(inputs);

  assertEquals(result.stats.totalComponents, 2);
  assertEquals(result.stats.rejectedCount, 1);
  assert(result.rejectedTags.includes('bad-element'));
});

Deno.test('classifyComponents: can skip path validation', () => {
  const inputs = [
    { tagName: 'dangerous-element', modulePath: '/etc/passwd', source: 'local' as const },
  ];

  const result = classifyComponents(inputs, { skipPathValidation: true });

  // Should not be rejected for path
  assertEquals(result.stats.rejectedCount, 0);
  assertEquals(result.stats.clientOnlyCount, 1);
});

Deno.test('classifyComponents: builds correct tag sets', () => {
  const inputs = [
    {
      tagName: 'ssr-element',
      modulePath: './ssr.js',
      source: 'local' as const,
      less: { ssr: true },
      superClass: 'LitElement',
    },
    { tagName: 'client-element', modulePath: './client.js', source: 'local' as const },
    {
      tagName: 'explicit-client',
      modulePath: './explicit.js',
      source: 'local' as const,
      less: { ssr: false },
    },
  ];

  const result = classifyComponents(inputs);

  assertEquals(result.ssrCapableTags, ['ssr-element']);
  assertEquals(result.clientOnlyTags, ['client-element', 'explicit-client']);
  assertEquals(result.rejectedTags, []);
});

// 鈹€鈹€鈹€ Less Manifest Classification Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('classifyLessManifest: classifies all declarations', () => {
  const manifest = {
    schemaVersion: '1.0.0',
    packageName: '@test/my-package',
    version: '1.0.0',
    declarations: [
      {
        tagName: 'pkg-element-1',
        superclassName: 'LitElement',
        less: { ssr: true, dsd: true },
      },
      {
        tagName: 'pkg-element-2',
        less: { ssr: false },
      },
      {
        tagName: 'pkg-element-3',
        // No less field
      },
    ],
  };

  const result = classifyLessManifest(manifest);

  assertEquals(result.stats.totalComponents, 3);
  assertEquals(result.stats.ssrCapableCount, 1);
  assertEquals(result.stats.clientOnlyCount, 2);
});

// 鈹€鈹€鈹€ CEM Manifest Classification Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('classifyCemManifest: CEM-only packages are client-only', () => {
  const manifest = {
    schemaVersion: '1.0.0' as const,
    packageName: '@test/cem-package',
    modules: [
      {
        kind: 'javascript-module' as const,
        path: './src/element.js',
        declarations: [
          {
            kind: 'custom-element' as const,
            tagName: 'cem-element',
            className: 'CemElement',
            // No less field
          },
        ],
      },
    ],
  };

  const result = classifyCemManifest(manifest);

  assertEquals(result.stats.totalComponents, 1);
  assertEquals(result.stats.clientOnlyCount, 1);
  assertEquals(result.clientOnlyTags, ['cem-element']);
});

// 鈹€鈹€鈹€ Merged Classification Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('mergeClassifications: local takes precedence over package', () => {
  const local = [
    {
      tagName: 'local-element',
      modulePath: './local.js',
      source: 'local' as const,
      less: { ssr: true },
      superClass: 'LitElement',
    },
  ];

  const pkg = [
    { tagName: 'package-element', modulePath: './pkg.js', source: 'package' as const },
  ];

  const result = mergeClassifications(local, pkg);

  assertEquals(result.stats.totalComponents, 2);
  assertEquals(result.ssrCapableTags, ['local-element']);
  assertEquals(result.clientOnlyTags, ['package-element']);
});

Deno.test('mergeClassifications: duplicate tags across sources are rejected', () => {
  const local = [
    { tagName: 'shared-tag', modulePath: './local.js', source: 'local' as const },
  ];

  const pkg = [
    { tagName: 'shared-tag', modulePath: './pkg.js', source: 'package' as const },
  ];

  const result = mergeClassifications(local, pkg);

  // The second one (in this case package) should be rejected
  assertEquals(result.stats.rejectedCount, 1);
  assert(result.rejectedTags.includes('shared-tag'));
});

// 鈹€鈹€鈹€ Utility Function Tests 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('isValidTagName: accepts valid tag names', () => {
  assertEquals(isValidTagName('my-element'), true);
  assertEquals(isValidTagName('x-foo'), true);
  assertEquals(isValidTagName('a-1-2-3'), true);
});

Deno.test('isValidTagName: rejects invalid tag names', () => {
  assertEquals(isValidTagName('InvalidTag'), false); // No hyphen
  assertEquals(isValidTagName('myelement'), false); // No hyphen
  assertEquals(isValidTagName('-my-element'), false); // Can't start with hyphen
  assertEquals(isValidTagName('my-element-'), false); // Can't end with hyphen
});

Deno.test('isKnownSsrSuperclass: recognizes known superclasses', () => {
  assertEquals(isKnownSsrSuperclass('LitElement'), true);
  assertEquals(isKnownSsrSuperclass('LitElement (via @lessjs/adapter-lit)'), true);
  assertEquals(isKnownSsrSuperclass('HTMLElement (via @lessjs/adapter-vanilla)'), true);
  assertEquals(isKnownSsrSuperclass('UnknownClass'), false);
});

Deno.test('isKnownSsrAdapter: recognizes known adapters', () => {
  assertEquals(isKnownSsrAdapter('lit'), true);
  assertEquals(isKnownSsrAdapter('Lit'), true); // Case insensitive
  assertEquals(isKnownSsrAdapter('vanilla'), true);
  assertEquals(isKnownSsrAdapter('react'), true);
  assertEquals(isKnownSsrAdapter('svelte'), true);
  assertEquals(isKnownSsrAdapter('unknown'), false);
});

Deno.test('getClassificationSummary: generates readable summary', () => {
  const result = classifyComponents([
    {
      tagName: 'ssr-el',
      modulePath: './a.js',
      source: 'local' as const,
      less: { ssr: true },
      superClass: 'LitElement',
    },
    { tagName: 'client-el', modulePath: './b.js', source: 'local' as const },
  ]);

  const summary = getClassificationSummary(result);

  assertStringIncludes(summary, 'SSR-capable: 1');
  assertStringIncludes(summary, 'Client-only: 1');
  assertStringIncludes(summary, 'ssr-el');
  assertStringIncludes(summary, 'client-el');
  assertStringIncludes(summary, 'SSR-capable tags: ssr-el');
});

// 鈹€鈹€鈹€ Edge Cases 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

Deno.test('classifyComponent: handles undefined superClass', () => {
  const result = classifyComponent({
    tagName: 'plain-element',
    modulePath: './plain.js',
    source: 'local',
    less: { ssr: true },
    superClass: undefined,
  });

  // Falls back to client-only since no known superclass
  assertEquals(result.tier, 'client-only');
});

Deno.test('classifyComponent: preserves package name in reason', () => {
  const result = classifyComponent({
    tagName: 'pkg-element',
    modulePath: './pkg.js',
    source: 'package',
    packageName: '@test/my-package',
    // No less field
  });

  assertStringIncludes(result.reason, '@test/my-package');
});

Deno.test('classifyComponent: applies conservative defaults', () => {
  const result = classifyComponent({
    tagName: 'defaults-element',
    modulePath: './defaults.js',
    source: 'local',
  });

  assertEquals(result.ssr, false); // Default
  assertEquals(result.dsd, false); // Default
  assertEquals(result.hydrate, 'idle'); // Default
});
