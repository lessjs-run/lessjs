/**
 * Tests for the @lessjs/ui package manifest.
 *
 * Verifies that the manifest has correct metadata,
 * validation passes, and declarations have proper SSR/DSD flags.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { manifest } from '../../ui/src/manifest.js';
import { clear as clearRegistry, validate as validateManifest } from '../src/registry.js';

Deno.test('ui manifest - passes validation', () => {
  const result = validateManifest(manifest);
  assertEquals(result.valid, true, `Validation failed: ${JSON.stringify(result.errors)}`);
  clearRegistry();
});

Deno.test('ui manifest - has correct package metadata', () => {
  assertEquals(manifest.packageName, '@lessjs/ui');
  assertEquals(typeof manifest.version, 'string');
  assertEquals(manifest.schemaVersion, '1.0.0');
  assertEquals(manifest.declarations.length > 0, true);
});

Deno.test('ui manifest - all declarations have SSR and DSD enabled', () => {
  for (const decl of manifest.declarations) {
    assertEquals(decl.less?.ssr, true, `${decl.tagName} should have ssr: true`);
    assertEquals(decl.less?.dsd, true, `${decl.tagName} should have dsd: true`);
  }
});

Deno.test('ui manifest - tag names are valid custom element names', () => {
  for (const decl of manifest.declarations) {
    // Must contain a hyphen and start with a letter
    const valid = /^[a-z][a-z0-9]*-[a-z0-9-]*$/.test(decl.tagName);
    assertEquals(valid, true, `${decl.tagName} is not a valid custom element name`);
  }
});
