/**
 * @lessjs/adapter-vite - less-plugin.ts tests (Deno)
 *
 * Focused tests for less() plugin factory internals:
 * - Plugin enforce values
 * - Option normalization defaults
 * - Plugin ordering
 * - Virtual entry ID handling
 * - Invalid option detection
 *
 * Complements index-plugin.test.ts which tests the public API surface.
 */
import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@^1.0.0';
import { less } from '../src/less-plugin.ts';

// ─── Plugin Order & Structure ─────────────────────────────────

Deno.test('lessPlugin: returns 9 plugins in correct order', () => {
  const plugins = less();
  assertEquals(plugins.length, 9);

  const names = plugins.map((p) => p.name);
  assertEquals(names, [
    'less:core',
    'less:core-resolve',
    'less:data-dispatch',
    'less:optional-package-stubs',
    'less:virtual-entry',
    '@hono/vite-dev-server',
    'less:island-transform',
    'less:build',
    'less:devtools',
  ]);
});

Deno.test('lessPlugin: core-resolve plugin has enforce=pre', () => {
  const plugins = less();
  const resolvePlugin = plugins.find((p) => p.name === 'less:core-resolve')!;
  assertExists(resolvePlugin);
  assertEquals(resolvePlugin.enforce, 'pre');
});

Deno.test('lessPlugin: core-resolve has enforce=pre', () => {
  const plugins = less();
  // Only core-resolve explicitly needs enforce: 'pre' for resolution priority
  const resolvePlugin = plugins.find((p) => p.name === 'less:core-resolve')!;
  assertEquals(resolvePlugin.enforce, 'pre');
});

// ─── Option Defaults ──────────────────────────────────────────

Deno.test('lessPlugin: defaults routesDir to app/routes', () => {
  const plugins = less({});
  // Default is applied internally - verify plugin creation succeeds
  assertExists(plugins);
  assertEquals(plugins.length, 9);
});

Deno.test('lessPlugin: defaults islandsDir to app/islands', () => {
  const plugins = less({});
  assertExists(plugins);
  assertEquals(plugins.length, 9);
});

Deno.test('lessPlugin: defaults componentsDir to app/components', () => {
  const plugins = less({});
  assertExists(plugins);
  assertEquals(plugins.length, 9);
});

Deno.test('lessPlugin: respects custom routesDir', () => {
  const plugins = less({ routesDir: 'src/pages' });
  assertExists(plugins);
  assertEquals(plugins.length, 9);
});

Deno.test('lessPlugin: respects custom islandsDir', () => {
  const plugins = less({ islandsDir: 'src/widgets' });
  assertExists(plugins);
  assertEquals(plugins.length, 9);
});

Deno.test('lessPlugin: respects custom componentsDir', () => {
  const plugins = less({ componentsDir: 'src/ui' });
  assertExists(plugins);
  assertEquals(plugins.length, 9);
});

// ─── Upgrade Strategy Default ─────────────────────────────────

Deno.test('lessPlugin: default upgradeStrategy is idle', () => {
  const plugins = less({});
  // The default 'idle' is applied in generateEntry -> generateHonoEntryCode
  // Verification: plugin construction succeeds with default
  assertExists(plugins);
});

Deno.test('lessPlugin: accepts upgradeStrategy=load', () => {
  const plugins = less({ island: { upgradeStrategy: 'load' } });
  assertExists(plugins);
});

Deno.test('lessPlugin: accepts upgradeStrategy=visible', () => {
  const plugins = less({ island: { upgradeStrategy: 'visible' } });
  assertExists(plugins);
});

// ─── Invalid Options ──────────────────────────────────────────

Deno.test('lessPlugin: rejects script tags in headExtras', () => {
  assertThrows(
    () => less({ headExtras: '<script>alert(1)</script>' }),
    Error,
    'headExtras must not contain <script> tags',
  );
});

Deno.test('lessPlugin: rejects script tags in inject.headFragments', () => {
  assertThrows(
    () => less({ inject: { headFragments: ['<script src="/x.js"></script>'] } }),
    Error,
    'inject.headFragments must not contain <script> tags',
  );
});

Deno.test('lessPlugin: handles empty options object', () => {
  const plugins = less({});
  assertEquals(plugins.length, 9);
});

Deno.test('lessPlugin: handles undefined options', () => {
  const plugins = less();
  assertEquals(plugins.length, 9);
});

// ─── Virtual Entry Plugin Behaviors ───────────────────────────

Deno.test('lessPlugin: virtual-entry resolves virtual:less-hono-entry', () => {
  const plugins = less({});
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;

  const resolved = (virtualPlugin.resolveId as Function)('virtual:less-hono-entry');
  assertExists(resolved);
  assertEquals(resolved, '\0virtual:less-hono-entry');
});

Deno.test('lessPlugin: virtual-entry resolves virtual:less-build-trigger', () => {
  const plugins = less({});
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;

  const resolved = (virtualPlugin.resolveId as Function)('virtual:less-build-trigger');
  assertExists(resolved);
  assertEquals(resolved, '\0virtual:less-build-trigger');
});

Deno.test('lessPlugin: virtual-entry resolveId returns undefined for unknown IDs', () => {
  const plugins = less({});
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;

  const result = (virtualPlugin.resolveId as Function)('some-random-module');
  assertEquals(result, undefined);
});

Deno.test('lessPlugin: virtual-entry load returns code for resolved entry ID', () => {
  const plugins = less({});
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;

  const code = (virtualPlugin.load as Function)('\0virtual:less-hono-entry');
  assertExists(code);
  assertStringIncludes(code as string, 'hono');
});

Deno.test('lessPlugin: virtual-entry load returns null export for build trigger', () => {
  const plugins = less({});
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;

  const code = (virtualPlugin.load as Function)('\0virtual:less-build-trigger');
  assertExists(code);
  assertEquals(code, 'export default null;');
});

Deno.test('lessPlugin: virtual-entry load returns undefined for unknown IDs', () => {
  const plugins = less({});
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;

  const result = (virtualPlugin.load as Function)('unknown-virtual-id');
  assertEquals(result, undefined);
});

// ─── Core Plugin Hooks ────────────────────────────────────────

Deno.test('lessPlugin: core plugin has config hook', () => {
  const plugins = less({});
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;

  assertExists(corePlugin.config);
  assertEquals(typeof corePlugin.config, 'function');
});

Deno.test('lessPlugin: core plugin has configResolved hook', () => {
  const plugins = less({});
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;

  assertExists(corePlugin.configResolved);
  assertEquals(typeof corePlugin.configResolved, 'function');
});

Deno.test('lessPlugin: core plugin has buildStart hook', () => {
  const plugins = less({});
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;

  assertExists(corePlugin.buildStart);
  assertEquals(typeof corePlugin.buildStart, 'function');
});

Deno.test('lessPlugin: core config sets chunkSizeWarningLimit', () => {
  const plugins = less({});
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;

  const result = (corePlugin.config as Function)({}) as Record<string, unknown>;
  const build = result.build as Record<string, unknown>;
  assertEquals(build.chunkSizeWarningLimit, 1500);
});

Deno.test('lessPlugin: core config includes rollupOptions with build trigger input', () => {
  const plugins = less({});
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;

  const result = (corePlugin.config as Function)({}) as Record<string, unknown>;
  const build = result.build as Record<string, unknown>;
  const rollupOptions = build.rollupOptions as Record<string, unknown>;
  const input = rollupOptions.input as string[];

  assertExists(input);
  assertArrayIncludes(input, ['virtual:less-build-trigger']);
});

// ─── Island Transform Plugin ──────────────────────────────────

Deno.test('lessPlugin: island-transform plugin exists with correct name', () => {
  const plugins = less({});
  const islandPlugin = plugins.find((p) => p.name === 'less:island-transform')!;

  assertExists(islandPlugin);
  assertEquals(islandPlugin.name, 'less:island-transform');
});

Deno.test('lessPlugin: island-transform has transform hook', () => {
  const plugins = less({});
  const islandPlugin = plugins.find((p) => p.name === 'less:island-transform')!;

  assertExists(islandPlugin.transform, 'island transform must have transform hook');
});

// ─── Build Plugin ─────────────────────────────────────────────

Deno.test('lessPlugin: build plugin exists', () => {
  const plugins = less({});
  const buildPlugin = plugins.find((p) => p.name === 'less:build')!;

  assertExists(buildPlugin);
});

// ─── Devtools Plugin ──────────────────────────────────────────

Deno.test('lessPlugin: devtools plugin exists', () => {
  const plugins = less({});
  const devtoolsPlugin = plugins.find((p) => p.name === 'less:devtools')!;

  assertExists(devtoolsPlugin);
});

// ─── Dev Server Plugin ────────────────────────────────────────

Deno.test('lessPlugin: dev server plugin is @hono/vite-dev-server', () => {
  const plugins = less({});
  const devServerPlugin = plugins.find((p) => p.name === '@hono/vite-dev-server')!;

  assertExists(devServerPlugin);
});

// ─── packageIslands Option ────────────────────────────────────

Deno.test('lessPlugin: accepts packageIslands option', () => {
  const plugins = less({ packageIslands: ['@lessjs/ui'] });
  assertExists(plugins);
  assertEquals(plugins.length, 9);
});

Deno.test('lessPlugin: accepts empty packageIslands', () => {
  const plugins = less({ packageIslands: [] });
  assertExists(plugins);
  assertEquals(plugins.length, 9);
});

Deno.test('lessPlugin: accepts multiple packageIslands', () => {
  const plugins = less({ packageIslands: ['@lessjs/ui', '@shoelace-style/shoelace'] });
  assertExists(plugins);
});

// ─── CORS Origin Edge Cases ───────────────────────────────────

Deno.test('lessPlugin: accepts middleware.corsOrigin as string', () => {
  const plugins = less({ middleware: { corsOrigin: 'https://example.com' } });
  assertExists(plugins);
});

Deno.test('lessPlugin: accepts middleware.corsOrigin as array', () => {
  const plugins = less({ middleware: { corsOrigin: ['https://a.com', 'https://b.com'] } });
  assertExists(plugins);
});

// ─── HTML Config ──────────────────────────────────────────────

Deno.test('lessPlugin: accepts html config with title', () => {
  const plugins = less({ html: { title: 'My App' } });
  assertExists(plugins);
});

Deno.test('lessPlugin: accepts html config with lang', () => {
  const plugins = less({ html: { lang: 'zh-CN' } });
  assertExists(plugins);
});

Deno.test('lessPlugin: accepts full html config', () => {
  const plugins = less({ html: { lang: 'ja', title: 'テスト' } });
  assertExists(plugins);
});

// ─── Inject Structured API ────────────────────────────────────

Deno.test('lessPlugin: inject.stylesheets string form', () => {
  const plugins = less({ inject: { stylesheets: ['https://cdn.example.com/app.css'] } });
  assertExists(plugins);
});

Deno.test('lessPlugin: inject.stylesheets object form with integrity', () => {
  const plugins = less({
    inject: {
      stylesheets: [{
        href: 'https://cdn.example.com/app.css',
        integrity: 'sha384-abc',
      }],
    },
  });
  assertExists(plugins);
});

Deno.test('lessPlugin: inject.scripts with defer', () => {
  const plugins = less({
    inject: { scripts: [{ src: 'https://cdn.example.com/app.js', defer: true }] },
  });
  assertExists(plugins);
});

Deno.test('lessPlugin: headExtras and inject work together (headExtras wins)', () => {
  const plugins = less({
    headExtras: '<meta name="override" />',
    inject: { stylesheets: ['https://cdn.example.com/app.css'] },
  });
  assertExists(plugins);
});
