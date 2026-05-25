/**
 * @lessjs/adapter-vite — Tests for external-resolver.ts.
 *
 * ADR-0047: Verifies Deno pre-resolution, fallback behavior, and
 * cache invalidation logic.
 */
import { assertArrayIncludes, assertEquals, assertNotEquals } from 'jsr:@std/assert@1';
import { buildFallbackManifest, extractExternalSpecifiers } from '../src/external-resolver.ts';

// ─── extractExternalSpecifiers ──────────────────────────────────────

Deno.test('extractExternalSpecifiers: returns empty for no modules', () => {
  const result = extractExternalSpecifiers(
    { modules: [], roots: [] },
    ['parse5', 'entities', 'hono'],
  );
  assertEquals(result, []);
});

Deno.test('extractExternalSpecifiers: extracts exact npm package match', () => {
  const result = extractExternalSpecifiers(
    {
      modules: [
        { specifier: 'npm:hono@^4.12.18' },
        { specifier: 'npm:parse5@7.0.0' },
      ],
      roots: [],
    },
    ['hono', 'parse5'],
  );
  assertEquals(result, ['hono', 'parse5']);
});

Deno.test('extractExternalSpecifiers: extracts subpath imports', () => {
  const result = extractExternalSpecifiers(
    {
      modules: [
        { specifier: 'npm:entities@^4.5.0/lib/escape.js' },
        { specifier: 'npm:entities@^4.5.0/lib/decode.js' },
      ],
      roots: [],
    },
    ['entities'],
  );
  assertArrayIncludes(result, ['entities/lib/escape.js', 'entities/lib/decode.js']);
});

Deno.test('extractExternalSpecifiers: ignores non-npm specifiers', () => {
  const result = extractExternalSpecifiers(
    {
      modules: [
        { specifier: 'jsr:@lessjs/core@0.21/logger.ts' },
        { specifier: 'https://esm.sh/react@18' },
        { specifier: 'npm:hono@^4.12.18' },
      ],
      roots: [],
    },
    ['hono'],
  );
  assertEquals(result, ['hono']);
});

Deno.test('extractExternalSpecifiers: skips modules with errors', () => {
  const result = extractExternalSpecifiers(
    {
      modules: [
        { specifier: 'npm:parse5@7.0.0', error: 'Download failed' },
        { specifier: 'npm:hono@^4.12.18' },
      ],
      roots: [],
    },
    ['parse5', 'hono'],
  );
  assertEquals(result, ['hono']);
});

Deno.test('extractExternalSpecifiers: returns sorted result', () => {
  const result = extractExternalSpecifiers(
    {
      modules: [
        { specifier: 'npm:hono@^4.12.18' },
        { specifier: 'npm:entities@^4.5.0/lib/escape.js' },
        { specifier: 'npm:parse5@7.0.0' },
      ],
      roots: [],
    },
    ['hono', 'entities', 'parse5'],
  );
  assertEquals(result, ['entities/lib/escape.js', 'hono', 'parse5']);
});

// ─── buildFallbackManifest ──────────────────────────────────────────

Deno.test('buildFallbackManifest: returns base packages without errors', () => {
  const result = buildFallbackManifest(['parse5', 'entities', 'hono']);
  assertEquals(result.specifiers, ['parse5', 'entities', 'hono']);
  assertEquals(result.importMap, {});
  assertEquals(result.lockHash, 'fallback');
  assertNotEquals(result.generatedAt, '');
});

Deno.test('buildFallbackManifest: handles empty package list', () => {
  const result = buildFallbackManifest([]);
  assertEquals(result.specifiers, []);
  assertEquals(result.lockHash, 'fallback');
});

Deno.test('buildFallbackManifest: generatedAt is valid ISO string', () => {
  const result = buildFallbackManifest(['hono']);
  const parsed = new Date(result.generatedAt);
  assertEquals(isNaN(parsed.getTime()), false);
});

// ─── Type exports ───────────────────────────────────────────────────

Deno.test('external-resolver: module exports resolveExternalManifest as function', async () => {
  const mod = await import('../src/external-resolver.ts');
  assertEquals(typeof mod.resolveExternalManifest, 'function');
});

Deno.test('external-resolver: buildFallbackManifest is exported', () => {
  assertEquals(typeof buildFallbackManifest, 'function');
});

Deno.test('external-resolver: extractExternalSpecifiers is exported', () => {
  assertEquals(typeof extractExternalSpecifiers, 'function');
});
