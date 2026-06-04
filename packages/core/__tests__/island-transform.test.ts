/**
 * @openelement/core — Island transform unit tests (Deno)
 */
import { assertEquals, assertStringIncludes, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { transformIslandSource } from '../src/island-transform.js';

Deno.test('transformIslandSource: adds markers to island files', () => {
  const result = transformIslandSource(
    'export class MyWidget extends HTMLElement {}',
    { islandsDir: 'app/islands', filePath: 'app/islands/my-widget.tsx' },
  );
  assertStringIncludes(result.code, 'export const __island = true');
  assertStringIncludes(result.code, "export const __tagName = 'my-widget'");
  assertEquals(result.islands[0].tagName, 'my-widget');
  assertEquals(result.islands[0].filePath, 'app/islands/my-widget.tsx');
});

Deno.test('transformIslandSource: skips non-island files', () => {
  const result = transformIslandSource(
    'export const x = 1;',
    { islandsDir: 'app/islands', filePath: 'app/routes/index.ts' },
  );
  assertEquals(result.islands.length, 0);
  assertEquals(result.code, 'export const x = 1;');
});

Deno.test('transformIslandSource: rejects unsafe tag names', () => {
  // "my-mod!" has a hyphen (passes the Custom Elements check)
  // but "!" is an unsafe character that must be rejected
  assertThrows(
    () =>
      transformIslandSource('export class X {}', {
        islandsDir: 'app/islands',
        filePath: 'app/islands/my-mod!.tsx',
      }),
    Error,
    'unsafe',
  );
});

Deno.test('transformIslandSource: handles Windows paths', () => {
  const result = transformIslandSource(
    'export class MyWidget extends HTMLElement {}',
    { islandsDir: 'app/islands', filePath: 'app\\islands\\my-widget.tsx' },
  );
  assertEquals(result.islands[0].tagName, 'my-widget');
});

Deno.test('transformIslandSource: skips tag names without hyphen', () => {
  const result = transformIslandSource(
    'export class Counter extends HTMLElement {}',
    { islandsDir: 'app/islands', filePath: 'app/islands/counter.ts' },
  );
  assertEquals(result.islands.length, 0);
  assertEquals(result.code, 'export class Counter extends HTMLElement {}');
});

Deno.test('transformIslandSource: returns empty islands for non-island dir', () => {
  const result = transformIslandSource(
    'export const x = 1;',
    { islandsDir: 'app/islands', filePath: 'app/islands-extra/my-counter.ts' },
  );
  // "islands-extra" != "islands" — the directory match must be exact segment
  assertEquals(result.islands.length, 0);
});
