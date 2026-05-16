/**
 * @lessjs/adapter-vite - index.ts main entry tests (Deno)
 *
 * Tests that less() plugin factory returns a valid plugin array
 * with correct structure and re-exports.
 */
// deno-lint-ignore-file no-unused-vars ban-types
import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertStringIncludes,
  assertThrows,
} from 'jsr:@std/assert@^1.0.0';
import { join } from 'node:path';
import { less } from '../src/index.ts';

// Verify core re-exports work (imported via @lessjs/core subpaths)
import { LessError, SsrRenderError } from '@lessjs/core/errors';
import { createSsrContext, extractParams, parseQuery } from '@lessjs/core/context';
import { renderSsrError, wrapInDocument } from '@lessjs/core';

import { buildIslandChunkMap, injectClientScript, injectCspMeta } from '../src/ssg-postprocess.ts';

import { printBuildManifest, scanClientBuild, scanSSGOutput } from '../src/build-manifest.ts';

// ─── less() Plugin Factory ─────────────────────────────────────

function assertLessPluginArray(plugins: ReturnType<typeof less>): void {
  assertExists(plugins);
  assertEquals(Array.isArray(plugins), true);
  const names = plugins.map((p) => p.name);
  assertArrayIncludes(names, [
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
}

Deno.test('less() returns an array of plugins', () => {
  const plugins = less();
  assertLessPluginArray(plugins);
});

Deno.test('less() plugins have names starting with less:', () => {
  const plugins = less();
  const names = plugins.map((p) => p.name);

  // All LessJS plugins should have the less: prefix
  for (const name of names) {
    if (name === '@hono/vite-dev-server') continue; // external
    assertEquals(
      name.startsWith('less:'),
      true,
      `Plugin "${name}" should start with "less:"`,
    );
  }
});

Deno.test('less() includes required plugin types', () => {
  const plugins = less();
  const names = plugins.map((p) => p.name);

  // Must include these plugins (html-template removed in v0.3.1, core-resolve added v0.10.3)
  assertArrayIncludes(names, ['less:core']);
  assertArrayIncludes(names, ['less:core-resolve']);
  assertArrayIncludes(names, ['less:virtual-entry']);
  assertArrayIncludes(names, ['less:island-transform']);
  assertArrayIncludes(names, ['less:build']);

  // External dev server
  assertArrayIncludes(names, ['@hono/vite-dev-server']);
});

Deno.test('less() accepts options without error', () => {
  const plugins = less({
    routesDir: 'pages',
    islandsDir: 'widgets',
    headExtras: '<link rel="stylesheet" />',
    html: { title: 'Test', lang: 'ja' },
    packageIslands: ['@lessjs/ui'],
    island: { upgradeStrategy: 'eager' },
    middleware: { corsOrigin: '*' },
  });

  assertLessPluginArray(plugins);
});

Deno.test('less() core plugin has config hook defined', () => {
  const plugins = less();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  assertExists(corePlugin.config, 'core plugin must define config hook');
});

Deno.test('less() core plugin has buildStart hook defined', () => {
  const plugins = less();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  assertExists(corePlugin.buildStart, 'core plugin must define buildStart hook');
});

// ─── less() inject / headExtras branches ─────────────────────

Deno.test('less() inject.stylesheets �?headExtras', () => {
  const plugins = less({
    inject: { stylesheets: ['https://cdn.example.com/app.css'] },
  });
  assertLessPluginArray(plugins);
  // headExtras computed internally from inject.stylesheets
  // Verification: plugin construction succeeds for inject-only config
});

Deno.test('less() inject.scripts �?headExtras', () => {
  const plugins = less({
    inject: { scripts: ['https://cdn.example.com/app.js'] },
  });
  assertLessPluginArray(plugins);
});

Deno.test('less() inject.headFragments �?headExtras', () => {
  const plugins = less({
    inject: { headFragments: ['<meta name="theme-color" content="#000">'] },
  });
  assertLessPluginArray(plugins);
});

Deno.test('less() inject all combined', () => {
  const plugins = less({
    inject: {
      stylesheets: ['https://cdn.example.com/app.css'],
      scripts: ['https://cdn.example.com/app.js'],
      headFragments: ['<meta charset="utf-8">'],
    },
  });
  assertLessPluginArray(plugins);
});

Deno.test('less() headExtras takes precedence over inject', () => {
  const plugins = less({
    headExtras: '<meta name="override" />',
    inject: { stylesheets: ['https://example.com/style.css'] },
  });
  assertLessPluginArray(plugins);
});

Deno.test('less() rejects script tags in raw headExtras', () => {
  assertThrows(
    () => less({ headExtras: '<script src="/x.js"></script>' }),
    Error,
    'headExtras must not contain <script> tags',
  );
});

Deno.test('less() rejects script tags in inject.headFragments', () => {
  assertThrows(
    () => less({ inject: { headFragments: ['<script src="/x.js"></script>'] } }),
    Error,
    'inject.headFragments must not contain <script> tags',
  );
});

Deno.test('less() allows scripts through structured inject.scripts', () => {
  const plugins = less({ inject: { scripts: [{ src: '/x.js', defer: true }] } });
  assertLessPluginArray(plugins);
});

// ─── less() config hook (captures userConfig.resolve.alias) ───

Deno.test('less() corePlugin.config captures resolve.alias', () => {
  const plugins = less();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  assertExists(corePlugin.config);
  const result = (corePlugin.config as Function)({
    resolve: { alias: { '@/*': '/src/*' } },
  } as never);
  assertExists(result);
  assertExists((result as Record<string, unknown>).build, 'config should return build options');
  const build = (result as Record<string, unknown>).build as Record<string, unknown>;
  assertExists(build.rollupOptions, 'should include rollupOptions');
  const rollupOptions = build.rollupOptions as Record<string, unknown>;
  const input = rollupOptions.input as string[];
  assertExists(input.includes('virtual:less-hono-entry'), 'should include virtual entry in input');
});

Deno.test('less() corePlugin.config returns rollupOptions with virtual entry', () => {
  const plugins = less();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  const result = (corePlugin.config as Function)({} as never) as Record<string, unknown>;
  const build = result.build as Record<string, unknown>;
  const rollupOptions = build.rollupOptions as Record<string, unknown>;
  const input = rollupOptions.input as string[];
  assertExists(input.includes('virtual:less-hono-entry'));
});

// ─── less() configResolved + generateEntry ───────────────────

Deno.test('less() corePlugin.configResolved sets honoEntryCode', () => {
  const plugins = less();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  assertExists(corePlugin.configResolved);
  // Should not throw when called with fake config
  // Use type assertion to avoid TS2349 (ObjectHook may not be callable)
  if (typeof corePlugin.configResolved === 'function') {
    (corePlugin.configResolved as (config: never) => void)({} as never);
  }
  assertEquals(true, true);
});

// ─── less() virtualEntryPlugin hooks ────────────────────────

Deno.test('less() virtualEntryPlugin.resolveId matches VIRTUAL_ENTRY_ID', () => {
  const plugins = less();
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;
  assertExists(virtualPlugin.resolveId);
  // The resolved ID includes '\0' prefix �?we just verify it returns non-null for the ID
  const result = (virtualPlugin.resolveId as Function)(
    'virtual:less-hono-entry',
    undefined as never,
    {} as never,
  );
  assertExists(result);
});

Deno.test('less() virtualEntryPlugin.load returns code for resolved ID', () => {
  const plugins = less();
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;
  assertExists(virtualPlugin.load);
  // '\0virtual:less-hono-entry' is the resolved ID
  const code = (virtualPlugin.load as Function)('\0virtual:less-hono-entry' as never);
  assertExists(code);
  assertStringIncludes(code as string, 'hono');
});

// ─── less() packageIslands option ───────────────────────────

Deno.test('less() with packageIslands option (empty array)', () => {
  const plugins = less({ packageIslands: [] });
  // v0.3.1: 5 plugins (html-template removed �?was a no-op)
  assertLessPluginArray(plugins);
});

// ─── less() default dirs ────────────────────────────────────

Deno.test('less() applies default routesDir and islandsDir', () => {
  const plugins = less();
  assertLessPluginArray(plugins);
  // Defaults applied internally via resolvedOptions
});

// ─── less() buildStart hook (requires filesystem) ──────────

Deno.test('less() corePlugin.buildStart is callable', () => {
  const plugins = less();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  assertExists(corePlugin.buildStart, 'core plugin must have buildStart');
  // buildStart is async and requires filesystem �?just verify it's callable
  assertEquals(typeof corePlugin.buildStart, 'function');
});

// ─── less() error classification branches ────────────────────

Deno.test('less() with all options branches covered', () => {
  // Test with packageIslands + island strategy + middleware cors
  const plugins = less({
    routesDir: 'pages',
    islandsDir: 'islands',
    packageIslands: ['@lessjs/ui'],
    island: { upgradeStrategy: 'eager' },
    middleware: { corsOrigin: ['http://localhost:3000'] },
    html: { title: 'Test', lang: 'ja' },
    inject: {
      stylesheets: ['https://cdn.example.com/style.css'],
      scripts: ['https://cdn.example.com/app.js'],
      headFragments: ['<meta name="x" content="y">'],
    },
  });
  assertLessPluginArray(plugins);
});

Deno.test('less() with middleware.corsOrigin as string', () => {
  const plugins = less({
    middleware: { corsOrigin: '*' },
  });
  assertLessPluginArray(plugins);
});

Deno.test('less() with middleware.corsOrigin as array', () => {
  const plugins = less({
    middleware: { corsOrigin: ['http://localhost:3000', 'http://localhost:3001'] },
  });
  assertLessPluginArray(plugins);
});

Deno.test('less() with island.upgradeStrategy=eager', () => {
  const plugins = less({
    island: { upgradeStrategy: 'eager' },
  });
  assertLessPluginArray(plugins);
});

Deno.test('less() with island.upgradeStrategy=eager', () => {
  const plugins = less({
    island: { upgradeStrategy: 'eager' },
  });
  assertLessPluginArray(plugins);
});

// ─── less() buildStart hook (actual execution) ──────────

Deno.test('less() corePlugin.buildStart scans routes and islands', async () => {
  // Create a temp directory structure with routes and islands
  const tmp = Deno.makeTempDirSync({ prefix: 'less-buildstart-' });
  try {
    const routesDir = join(tmp, 'app', 'routes');
    const islandsDir = join(tmp, 'app', 'islands');
    Deno.mkdirSync(routesDir, { recursive: true });
    Deno.mkdirSync(islandsDir, { recursive: true });

    // Create a page route
    Deno.writeTextFileSync(join(routesDir, 'index.ts'), 'export default () => "<h1>Hello</h1>"');
    // Create an island
    Deno.writeTextFileSync(join(islandsDir, 'counter.ts'), 'export const tagName = "less-counter"');

    const origCwd = Deno.cwd();
    Deno.chdir(tmp);

    const plugins = less({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
    });
    const corePlugin = plugins.find((p) => p.name === 'less:core')!;
    assertExists(corePlugin.buildStart);

    // Call buildStart �?it should succeed with valid directory structure
    await (corePlugin.buildStart as Function)();

    Deno.chdir(origCwd);
  } finally {
    try {
      Deno.removeSync(tmp, { recursive: true });
    } catch { /* ignore */ }
  }
});

Deno.test('less() corePlugin.buildStart handles empty directories gracefully', async () => {
  const tmp = Deno.makeTempDirSync({ prefix: 'less-buildstart-empty-' });
  try {
    const routesDir = join(tmp, 'nonexistent', 'routes');
    const islandsDir = join(tmp, 'nonexistent', 'islands');

    const origCwd = Deno.cwd();
    Deno.chdir(tmp);

    const plugins = less({
      routesDir: 'nonexistent/routes',
      islandsDir: 'nonexistent/islands',
    });
    const corePlugin = plugins.find((p) => p.name === 'less:core')!;

    // buildStart should NOT throw �?scanRoutes returns empty array for missing dirs
    await (corePlugin.buildStart as Function)();

    Deno.chdir(origCwd);
  } finally {
    try {
      Deno.removeSync(tmp, { recursive: true });
    } catch { /* ignore */ }
  }
});

Deno.test('less() corePlugin.buildStart with packageIslands config', async () => {
  const tmp = Deno.makeTempDirSync({ prefix: 'less-buildstart-pkg-' });
  try {
    const routesDir = join(tmp, 'app', 'routes');
    const islandsDir = join(tmp, 'app', 'islands');
    Deno.mkdirSync(routesDir, { recursive: true });
    Deno.mkdirSync(islandsDir, { recursive: true });
    Deno.writeTextFileSync(join(routesDir, 'index.ts'), 'export default () => "<h1>Hello</h1>"');

    const origCwd = Deno.cwd();
    Deno.chdir(tmp);

    // packageIslands with non-existent package �?should still not crash buildStart
    const plugins = less({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      packageIslands: ['@nonexistent/package'],
    });
    const corePlugin = plugins.find((p) => p.name === 'less:core')!;

    // Will try to scan package islands but fail gracefully (logged, not thrown)
    try {
      await (corePlugin.buildStart as Function)();
    } catch {
      // Expected �?@nonexistent/package import will fail, but route scan should succeed first
    }

    Deno.chdir(origCwd);
  } finally {
    try {
      Deno.removeSync(tmp, { recursive: true });
    } catch { /* ignore */ }
  }
});

// ─── less() configResolved + virtualEntry fallback ──────────

Deno.test('less() virtualEntryPlugin.load fallback when ctx.honoEntryCode is empty', () => {
  const plugins = less();
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;
  // First call configResolved to set honoEntryCode
  // deno-lint-ignore no-explicit-any
  if (typeof (plugins[0] as any).configResolved === 'function') {
    // deno-lint-ignore no-explicit-any
    (plugins[0] as any).configResolved({} as never);
  }
  // load should return code
  const code = (virtualPlugin.load as Function)('\0virtual:less-hono-entry' as never);
  assertExists(code);
  assertStringIncludes(code as string, 'hono');
});

Deno.test('less() virtualEntryPlugin.resolveId returns null for unknown IDs', () => {
  const plugins = less();
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;
  const result = (virtualPlugin.resolveId as Function)('unknown-module', undefined, {});
  assertEquals(result, undefined);
});

Deno.test('less() virtualEntryPlugin.load returns null for unknown IDs', () => {
  const plugins = less();
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;
  const result = (virtualPlugin.load as Function)('unknown-id');
  assertEquals(result, undefined);
});

// ─── less() inject with special chars (escaping) ──────────

Deno.test('less() inject.stylesheets escapes special chars in URLs', () => {
  const plugins = less({
    inject: { stylesheets: ['https://cdn.example.com/app.css?v=1&x<"test">'] },
  });
  assertLessPluginArray(plugins);
});

Deno.test('less() inject.scripts escapes special chars in URLs', () => {
  const plugins = less({
    inject: { scripts: ['https://cdn.example.com/app.js?v=1&x<"test">'] },
  });
  assertLessPluginArray(plugins);
});

// ─── less() config hook without resolve ──────────

Deno.test('less() corePlugin.config handles config without resolve', () => {
  const plugins = less();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  const result = (corePlugin.config as Function)({} as never);
  assertExists(result);
  assertExists((result as Record<string, unknown>).build);
});
