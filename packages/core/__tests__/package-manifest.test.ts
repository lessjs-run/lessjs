/**
 * Tests for LessPackageManifest types and LessRegistry.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import type { LessPackageManifest, ValidationError, ValidationWarning } from '../src/types.js';
import {
  clear as clearRegistry,
  generateIndex,
  getAll as getAllManifests,
  getByTagName,
  register as registerManifest,
  validate as validateManifest,
} from '../src/registry.js';

/** Minimal valid manifest for testing */
function createTestManifest(overrides?: Partial<LessPackageManifest>): LessPackageManifest {
  return {
    schemaVersion: '1.0.0',
    packageName: '@test/ui',
    version: '0.1.0',
    declarations: [
      {
        tagName: 'test-button',
        className: 'TestButton',
        description: 'A test button',
        less: {
          ssr: true,
          dsd: true,
          layer: 'dsd-interactive',
          hydrate: 'lazy',
          module: '@test/ui/test-button',
          export: 'TestButton',
        },
      },
      {
        tagName: 'test-card',
        className: 'TestCard',
        description: 'A test card',
        less: {
          ssr: true,
          dsd: true,
          layer: 'dsd-static',
          hydrate: 'lazy',
          module: '@test/ui/test-card',
          export: 'TestCard',
        },
      },
    ],
    ...overrides,
  };
}

Deno.test('validateManifest - valid manifest passes', () => {
  const manifest = createTestManifest();
  const result = validateManifest(manifest);
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test('validateManifest - missing required fields', () => {
  const manifest = createTestManifest({ packageName: '', version: '', schemaVersion: '' });
  const result = validateManifest(manifest);
  assertEquals(result.valid, false);
  const codes = result.errors.map((e: ValidationError) => e.code);
  assertEquals(codes.includes('MISSING_PACKAGE_NAME'), true);
  assertEquals(codes.includes('MISSING_VERSION'), true);
  assertEquals(codes.includes('MISSING_SCHEMA_VERSION'), true);
});

Deno.test('validateManifest - invalid tag name', () => {
  const manifest = createTestManifest({
    declarations: [{ tagName: 'div' }], // no hyphen
  });
  const result = validateManifest(manifest);
  assertEquals(result.valid, false);
  assertEquals(result.errors[0].code, 'INVALID_TAG_NAME');
});

Deno.test('validateManifest - duplicate tag names within package', () => {
  const manifest = createTestManifest({
    declarations: [
      { tagName: 'test-dup', less: { module: '@test/ui/a' } },
      { tagName: 'test-dup', less: { module: '@test/ui/b' } },
    ],
  });
  const result = validateManifest(manifest);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e: ValidationError) => e.code === 'DUPLICATE_TAG_NAME'), true);
});

Deno.test('validateManifest - unsafe module path', () => {
  const manifest = createTestManifest({
    declarations: [
      { tagName: 'test-unsafe', less: { module: '../../../etc/passwd' } },
    ],
  });
  const result = validateManifest(manifest);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e: ValidationError) => e.code === 'UNSAFE_MODULE_PATH'), true);
});

Deno.test('validateManifest - invalid layer', () => {
  const manifest = createTestManifest({
    declarations: [
      { tagName: 'test-bad-layer', less: { layer: 'invalid-layer' as never } },
    ],
  });
  const result = validateManifest(manifest);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e: ValidationError) => e.code === 'INVALID_LAYER'), true);
});

Deno.test('validateManifest - invalid hydrate strategy', () => {
  const manifest = createTestManifest({
    declarations: [
      { tagName: 'test-bad-hydrate', less: { hydrate: 'instant' as never } },
    ],
  });
  const result = validateManifest(manifest);
  assertEquals(result.valid, false);
  assertEquals(
    result.errors.some((e: ValidationError) => e.code === 'INVALID_HYDRATE_STRATEGY'),
    true,
  );
});

Deno.test('validateManifest - empty declarations', () => {
  const manifest = createTestManifest({ declarations: [] });
  const result = validateManifest(manifest);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e: ValidationError) => e.code === 'MISSING_DECLARATIONS'), true);
});

Deno.test('validateManifest - registry-level tag conflict warns', () => {
  clearRegistry();
  registerManifest(createTestManifest());

  const conflicting = createTestManifest({
    packageName: '@other/ui',
  });
  const result = validateManifest(conflicting);
  // Should warn about tag conflict but still be valid
  assertEquals(
    result.warnings.some((w: ValidationWarning) => w.code === 'REGISTRY_TAG_CONFLICT'),
    true,
  );

  clearRegistry();
});

Deno.test('registry - register and getByTagName', () => {
  clearRegistry();
  const manifest = createTestManifest();
  registerManifest(manifest);

  const decl = getByTagName('test-button');
  assertEquals(decl?.tagName, 'test-button');
  assertEquals(decl?.less?.module, '@test/ui/test-button');

  const notFound = getByTagName('non-existent');
  assertEquals(notFound, undefined);

  clearRegistry();
});

Deno.test('registry - getAll', () => {
  clearRegistry();
  registerManifest(createTestManifest());
  registerManifest(createTestManifest({ packageName: '@other/ui' }));

  const all = getAllManifests();
  assertEquals(all.length, 2);

  clearRegistry();
});

Deno.test('registry - generateIndex', () => {
  clearRegistry();
  registerManifest(createTestManifest());

  const index = generateIndex();
  assertEquals(index.totalPackages, 1);
  assertEquals(index.totalDeclarations, 2);
  assertEquals(index.entries[0].tagName, 'test-button');
  assertEquals(index.entries[1].tagName, 'test-card');

  clearRegistry();
});

Deno.test('registry - register overwrites same package', () => {
  clearRegistry();
  registerManifest(createTestManifest({ version: '0.1.0' }));
  registerManifest(createTestManifest({ version: '0.2.0' }));

  const all = getAllManifests();
  assertEquals(all.length, 1);
  assertEquals(all[0].version, '0.2.0');

  clearRegistry();
});
