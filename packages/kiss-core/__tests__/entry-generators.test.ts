/**
 * @kissjs/core - entry-generators.ts tests (Deno)
 *
 * v0.5.0: Simplified client entry — no hydration strategies, no Lit imports.
 */
import { assertEquals, assertExists, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { generateClientEntry } from '../src/entry-generators.ts';

const LOCAL_ISLAND = {
  tagName: 'my-counter',
  modulePath: './islands/my-counter.ts',
  isPackage: false as const,
};

const PACKAGE_ISLAND = {
  tagName: 'kiss-theme-toggle',
  modulePath: '@kissjs/ui/kiss-theme-toggle',
  isPackage: true as const,
};

// ─── Empty Islands ──────────────────────────────────────────

Deno.test('generateClientEntry returns no-op for empty islands', () => {
  const code = generateClientEntry([]);
  assertExists(code.includes('zero client JS needed'));
});

// ─── Local Island Registration ─────────────────────────────

Deno.test('generateClientEntry registers local island via dynamic import', () => {
  const code = generateClientEntry([LOCAL_ISLAND]);
  assertExists(code.includes("import('./islands/my-counter.ts')"));
  assertFalse(
    code.includes("import Island_0 from './islands/my-counter.ts'"),
    'Local islands must use dynamic import()',
  );
});

// ─── Package Island Dynamic Import ─────────────────────────

Deno.test('generateClientEntry uses dynamic import for package islands', () => {
  const code = generateClientEntry([PACKAGE_ISLAND]);
  assertExists(code.includes("import('@kissjs/ui/kiss-theme-toggle')"));
  // Should be dynamic import(), not static import
  assertExists(code.match(/import\s*\(/));
  assertFalse(
    code.includes(`import '${PACKAGE_ISLAND.modulePath}'`),
    'Package islands must use dynamic import()',
  );
});

// ─── Mixed Islands ─────────────────────────────────────────

Deno.test('generateClientEntry handles mixed local and package islands', () => {
  const code = generateClientEntry([LOCAL_ISLAND, PACKAGE_ISLAND]);

  assertExists(code.includes("import('./islands/my-counter.ts')"));
  assertExists(code.includes("import('@kissjs/ui/kiss-theme-toggle')"));

  assertFalse(
    code.includes("import Island_0 from './islands/my-counter.ts'"),
    'Local islands must use dynamic import()',
  );
});

// ─── No Lit Hydration ──────────────────────────────────────

Deno.test('generateClientEntry has no Lit hydration imports', () => {
  const code = generateClientEntry([LOCAL_ISLAND]);
  // v0.5.0: No Lit hydration — CE spec handles element upgrade
  assertEquals(code.includes('lit-element-hydrate-support'), false);
  assertEquals(code.includes('litElementHydrateSupport'), false);
  assertEquals(code.includes('LitElement'), false);
  assertEquals(code.includes('defer-hydration'), false);
  assertEquals(code.includes('__kissFindDeferred'), false);
  assertEquals(code.includes('__kissHydrateAll'), false);
});

// ─── whenDefined List ──────────────────────────────────────

Deno.test('generateClientEntry creates whenDefined list for all islands', () => {
  const code = generateClientEntry([
    LOCAL_ISLAND,
    { ...PACKAGE_ISLAND },
    { tagName: 'code-block', modulePath: './islands/code-block.ts', isPackage: false },
  ]);

  assertExists(code.includes("customElements.whenDefined('my-counter')"));
  assertExists(code.includes("customElements.whenDefined('kiss-theme-toggle')"));
  assertExists(code.includes("'code-block'"));
});

// ─── kiss:ready Event ──────────────────────────────────────

Deno.test('generateClientEntry dispatches kiss:ready event', () => {
  const code = generateClientEntry([LOCAL_ISLAND]);

  // v0.5.0: dispatches kiss:ready instead of hydration ceremony
  assertExists(code.includes('kiss:ready'));
  assertExists(code.includes('customElements.whenDefined'));
  assertExists(code.includes('Promise.all'));
});
