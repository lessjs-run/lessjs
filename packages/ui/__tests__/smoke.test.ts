/**
 * @lessjs/ui — Smoke tests
 *
 * Minimal tests to verify components can be imported and registered.
 * CI should never use continue-on-error — if tests fail, the build fails.
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';

Deno.test('less-ui — index exports manifest (WC Package Protocol)', async () => {
  const mod = await import('../src/index.ts');
  assertExists(mod.manifest, 'manifest export should exist');
  assertEquals(typeof mod.manifest, 'object');
  assertEquals(mod.manifest.packageName, '@lessjs/ui');
  assertEquals(mod.manifest.declarations.length, 10);
  assertEquals(mod.manifest.declarations[0].tagName, 'less-card');
  assertEquals(mod.manifest.declarations[1].tagName, 'less-callout');
  assertEquals(mod.manifest.declarations[2].tagName, 'less-step-card');
  assertEquals(mod.manifest.declarations[3].tagName, 'less-button');
  assertEquals(mod.manifest.declarations[4].tagName, 'less-input');
  assertEquals(mod.manifest.declarations[5].tagName, 'less-theme-toggle');
  assertEquals(mod.manifest.declarations[6].tagName, 'less-code-block');
  assertEquals(mod.manifest.declarations[7].tagName, 'less-dialog');
  assertEquals(mod.manifest.declarations[8].tagName, 'less-layout');
  assertEquals(mod.manifest.declarations[9].tagName, 'less-hero-ping');
});

Deno.test('less-ui — less-theme-toggle exports tagName', async () => {
  const mod = await import('../src/less-theme-toggle.ts');
  assertEquals(mod.tagName, 'less-theme-toggle');
  assertExists(mod.LessThemeToggle, 'LessThemeToggle class should be exported');
});

Deno.test('less-ui — design-tokens exports lessDesignTokens', async () => {
  const mod = await import('../src/design-tokens.ts');
  assertExists(mod.lessDesignTokens, 'lessDesignTokens should be exported');
});

Deno.test('less-ui — all components export tagName', async () => {
  const components = [
    'less-button',
    'less-callout',
    'less-card',
    'less-code-block',
    'less-dialog',
    'less-hero-ping',
    'less-input',
    'less-layout',
    'less-step-card',
    'less-theme-toggle',
  ];
  for (const name of components) {
    const mod = await import(`../src/${name}.ts`);
    assertExists(mod.tagName, `${name} should export tagName`);
  }
});
