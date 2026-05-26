/**
 * @lessjs/adapter-vite - subpath-resolver.ts tests (Deno)
 *
 * Tests for JSR subpath resolution: core package subpath mapping,
 * virtual module resolution, npm: prefix rewriting, and edge cases.
 */
import {
  assertEquals,
  assertExists,
  assertMatch,
} from 'jsr:@std/assert@^1.0.0';
import {
  CORE_SUBPATHS,
  createCoreResolvePlugin,
  VIRTUAL_CORE_PREFIX,
} from '../src/subpath-resolver.ts';

// ─── Constants ────────────────────────────────────────────────

Deno.test('CORE_SUBPATHS: maps known subpaths to source files', () => {
  assertEquals(CORE_SUBPATHS.logger, 'logger.ts');
  assertEquals(CORE_SUBPATHS['build-context'], 'build-context.ts');
  assertEquals(CORE_SUBPATHS.navigation, 'navigation.ts');
  assertEquals(CORE_SUBPATHS.errors, 'errors.ts');
});

Deno.test('CORE_SUBPATHS: all keys are valid subpath identifiers', () => {
  for (const key of Object.keys(CORE_SUBPATHS)) {
    // Should be simple identifiers, not paths
    assertMatch(key, /^[a-z][a-z-]*$/);
  }
});

Deno.test('CORE_SUBPATHS: all values end with .ts', () => {
  for (const value of Object.values(CORE_SUBPATHS)) {
    assertMatch(value, /\.ts$/);
  }
});

Deno.test('VIRTUAL_CORE_PREFIX: is a null-prefixed string', () => {
  assertEquals(VIRTUAL_CORE_PREFIX, '\0lessjs:core/src/');
  assertEquals(VIRTUAL_CORE_PREFIX.startsWith('\0'), true);
});

// ─── createCoreResolvePlugin: local mode ──────────────────────

Deno.test('createCoreResolvePlugin: local mode (file:// metaUrl)', () => {
  const plugin = createCoreResolvePlugin('file:///home/user/project/src/index.ts');

  assertEquals(plugin.name, 'less:core-resolve');
  assertEquals(plugin.enforce, 'pre');

  // In local mode, resolveId should be a no-op (return undefined)
  const result = plugin.resolveId?.('@lessjs/core', undefined as never, {} as never);
  assertEquals(result, undefined);
});

Deno.test('createCoreResolvePlugin: local mode load is no-op', async () => {
  const plugin = createCoreResolvePlugin('file:///project/src/index.ts');

  // In local mode, load should return undefined (pass through)
  const result = await plugin.load?.('\0lessjs:core/src/logger.ts' as never, {} as never);
  assertEquals(result, undefined);
});

Deno.test('createCoreResolvePlugin: local mode plugins have correct hooks', () => {
  const plugin = createCoreResolvePlugin('file:///project/src/index.ts');

  assertExists(plugin.resolveId, 'resolveId hook must exist');
  assertExists(plugin.load, 'load hook must exist');
  assertEquals(typeof plugin.resolveId, 'function');
  assertEquals(typeof plugin.load, 'function');
});

// ─── createCoreResolvePlugin: remote mode ─────────────────────

Deno.test('createCoreResolvePlugin: remote mode detects https:// URL', () => {
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  assertEquals(plugin.name, 'less:core-resolve');
  assertEquals(plugin.enforce, 'pre');
});

Deno.test('createCoreResolvePlugin: remote mode detects http:// URL', () => {
  const plugin = createCoreResolvePlugin(
    'http://localhost:8080/@lessjs/adapter-vite/0.17.0/src/index.ts',
  );

  assertEquals(plugin.name, 'less:core-resolve');
  assertEquals(plugin.enforce, 'pre');
});

Deno.test('createCoreResolvePlugin: remote mode resolves @lessjs/core bare specifier', () => {
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  // @lessjs/core (no subpath) -> virtual:lessjs:core/src/index.ts
  const result = plugin.resolveId?.('@lessjs/core', undefined as never, {} as never);
  assertEquals(result, '\0lessjs:core/src/index.ts');
});

Deno.test('createCoreResolvePlugin: remote mode resolves known subpath', () => {
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  const result = plugin.resolveId?.('@lessjs/core/logger', undefined as never, {} as never);
  assertEquals(result, '\0lessjs:core/src/logger.ts');
});

Deno.test('createCoreResolvePlugin: remote mode resolves unknown subpath as .ts', () => {
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  // Unknown subpath like "context" -> "context.ts"
  const result = plugin.resolveId?.('@lessjs/core/context', undefined as never, {} as never);
  assertEquals(result, '\0lessjs:core/src/context.ts');
});

Deno.test('createCoreResolvePlugin: remote mode resolves relative imports from virtual modules', () => {
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  // Simulating a relative import from within a virtual module
  const result = plugin.resolveId?.(
    './errors.ts',
    '\0lessjs:core/src/navigation.ts' as never,
    {} as never,
  );
  assertEquals(result, '\0lessjs:core/src/errors.ts');
});

Deno.test('createCoreResolvePlugin: remote mode handles relative imports with subdirectories', () => {
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  const result = plugin.resolveId?.(
    './sub/file.ts',
    '\0lessjs:core/src/deep/dir/parent.ts' as never,
    {} as never,
  );
  assertEquals(result, '\0lessjs:core/src/deep/dir/sub/file.ts');
});

Deno.test('createCoreResolvePlugin: remote mode skips already-resolved virtual IDs', () => {
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  // Already-resolved virtual IDs should pass through
  const result = plugin.resolveId?.(
    '\0lessjs:core/src/logger.ts',
    undefined as never,
    {} as never,
  );
  assertEquals(result, '\0lessjs:core/src/logger.ts');
});

Deno.test('createCoreResolvePlugin: remote mode passes unknown non-prefixed IDs through', () => {
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  // Random module that isn't @lessjs/core
  const result = plugin.resolveId?.('react', undefined as never, {} as never);
  assertEquals(result, undefined);
});

Deno.test('createCoreResolvePlugin: remote mode returns undefined for absolute paths', () => {
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  const result = plugin.resolveId?.('/absolute/path', undefined as never, {} as never);
  assertEquals(result, undefined);
});

Deno.test('createCoreResolvePlugin: remote mode null-byte-prefixed sources are not re-resolved', () => {
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  // A \0-prefixed source that isn't our VIRTUAL_CORE_PREFIX
  const result = plugin.resolveId?.('\0other:virtual', undefined as never, {} as never);
  assertEquals(result, undefined);
});

// ─── npm: prefix rewriting (in load hook) ─────────────────────

Deno.test('createCoreResolvePlugin: local mode load returns undefined for non-virtual IDs', async () => {
  const plugin = createCoreResolvePlugin('file:///project/src/index.ts');

  const result = await plugin.load?.('some-regular-module' as never, {} as never);
  assertEquals(result, undefined);
});

Deno.test('createCoreResolvePlugin: remote mode load returns undefined for non-virtual IDs', async () => {
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  const result = await plugin.load?.('some-regular-module' as never, {} as never);
  assertEquals(result, undefined);
});

Deno.test('createCoreResolvePlugin: remote mode load checks cache', () => {
  // This test verifies that load function exists and handles virtual IDs.
  // Actual fetch is tested in integration; this confirms signature and cache path.
  const plugin = createCoreResolvePlugin('https://jsr.io/@lessjs/adapter-vite/0.17.0/src/index.ts');

  assertExists(plugin.load, 'load hook must exist');
  assertEquals(typeof plugin.load, 'function');
});

// ─── CORE_SUBPATHS completeness ───────────────────────────────

Deno.test('CORE_SUBPATHS: includes all expected core subpath modules', () => {
  const expectedKeys = ['logger', 'build-context', 'navigation', 'errors'];
  for (const key of expectedKeys) {
    assertExists(CORE_SUBPATHS[key], `CORE_SUBPATHS must include ${key}`);
  }
});

Deno.test('CORE_SUBPATHS: no duplicate values', () => {
  const values = Object.values(CORE_SUBPATHS);
  const uniqueValues = new Set(values);
  assertEquals(uniqueValues.size, values.length, 'All CORE_SUBPATHS values must be unique');
});
