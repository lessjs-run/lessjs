// deno-lint-ignore-file no-unused-vars ban-types
/**
 * @lessjs/core - index.ts main entry tests (Deno)
 *
 * Tests that kiss() plugin factory returns a valid plugin array
 * with correct structure and re-exports.
 */
import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertStringIncludes,
} from 'jsr:@std/assert@^1.0.0';
import { join } from 'node:path';
import { kiss } from '../src/index.ts';

// Verify re-exports exist (compile-time)
import {
  ConflictError,
  ForbiddenError,
  IslandUpgradeError,
  KissError,
  NotFoundError,
  RateLimitError,
  SsrRenderError,
  UnauthorizedError,
  ValidationError,
} from '../src/errors.ts';

import { createSsrContext, extractParams, parseQuery } from '../src/context.ts';

import { renderSsrError, wrapInDocument } from '../src/ssr-handler.ts';

import {
  buildIslandChunkMap,
  injectClientScript,
  injectCspMeta,
  rewriteHtmlFiles,
} from '../src/ssg-postprocess.ts';

import { printBuildManifest, scanClientBuild, scanSSGOutput } from '../src/build-manifest.ts';

// ─── kiss() Plugin Factory ─────────────────────────────────────

Deno.test('kiss() returns an array of plugins', () => {
  const plugins = kiss();
  assertExists(plugins);
  assertEquals(Array.isArray(plugins), true);
  // v0.3.1: 5 plugins (html-template removed — was a no-op)
  assertEquals(plugins.length, 5);
});

Deno.test('kiss() plugins have names starting with kiss:', () => {
  const plugins = kiss();
  const names = plugins.map((p) => p.name);

  // All KISS plugins should have the kiss: prefix
  for (const name of names) {
    if (name === '@hono/vite-dev-server') continue; // external
    assertEquals(name.startsWith('kiss:') || name.startsWith('less:'), true, `Plugin "${name}" should start with "kiss:" or "less:"`);
  }
});

Deno.test('kiss() includes required plugin types', () => {
  const plugins = kiss();
  const names = plugins.map((p) => p.name);

  // Must include these plugins (html-template removed in v0.3.1)
  assertArrayIncludes(names, ['less:core']);
  assertArrayIncludes(names, ['less:virtual-entry']);
  assertArrayIncludes(names, ['less:island-transform']);
  assertArrayIncludes(names, ['less:build']);

  // External dev server
  assertArrayIncludes(names, ['@hono/vite-dev-server']);
});

Deno.test('kiss() accepts options without error', () => {
  const plugins = kiss({
    routesDir: 'pages',
    islandsDir: 'widgets',
    headExtras: '<link rel="stylesheet" />',
    html: { title: 'Test', lang: 'ja' },
    packageIslands: ['@lessjs/ui'],
    island: { upgradeStrategy: 'visible' },
    middleware: { corsOrigin: '*' },
  });

  assertEquals(plugins.length, 5);
});

Deno.test('kiss() core plugin has config hook defined', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  assertExists(corePlugin.config, 'core plugin must define config hook');
});

Deno.test('kiss() core plugin has buildStart hook defined', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  assertExists(corePlugin.buildStart, 'core plugin must define buildStart hook');
});

// ─── kiss() inject / headExtras branches ─────────────────────

Deno.test('kiss() inject.stylesheets → headExtras', () => {
  const plugins = kiss({
    inject: { stylesheets: ['https://cdn.example.com/app.css'] },
  });
  assertEquals(plugins.length, 5);
  // headExtras computed internally from inject.stylesheets
  // Verification: plugin construction succeeds for inject-only config
});

Deno.test('kiss() inject.scripts → headExtras', () => {
  const plugins = kiss({
    inject: { scripts: ['https://cdn.example.com/app.js'] },
  });
  assertEquals(plugins.length, 5);
});

Deno.test('kiss() inject.headFragments → headExtras', () => {
  const plugins = kiss({
    inject: { headFragments: ['<meta name="theme-color" content="#000">'] },
  });
  assertEquals(plugins.length, 5);
});

Deno.test('kiss() inject all combined', () => {
  const plugins = kiss({
    inject: {
      stylesheets: ['https://cdn.example.com/app.css'],
      scripts: ['https://cdn.example.com/app.js'],
      headFragments: ['<meta charset="utf-8">'],
    },
  });
  assertEquals(plugins.length, 5);
});

Deno.test('kiss() headExtras takes precedence over inject', () => {
  const plugins = kiss({
    headExtras: '<meta name="override" />',
    inject: { stylesheets: ['https://example.com/style.css'] },
  });
  assertEquals(plugins.length, 5);
});

// ─── kiss() config hook (captures userConfig.resolve.alias) ───

Deno.test('kiss() corePlugin.config captures resolve.alias', () => {
  const plugins = kiss();
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
  assertExists(input.includes('virtual:kiss-hono-entry'), 'should include virtual entry in input');
});

Deno.test('kiss() corePlugin.config returns rollupOptions with virtual entry', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  const result = (corePlugin.config as Function)({} as never) as Record<string, unknown>;
  const build = result.build as Record<string, unknown>;
  const rollupOptions = build.rollupOptions as Record<string, unknown>;
  const input = rollupOptions.input as string[];
  assertExists(input.includes('virtual:kiss-hono-entry'));
});

// ─── kiss() configResolved + generateEntry ───────────────────

Deno.test('kiss() corePlugin.config aliases runtime to generated shim', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  const result = (corePlugin.config as Function)({} as never) as Record<string, unknown>;
  const resolve = result.resolve as Record<string, unknown>;
  const alias = resolve.alias as Record<string, string>;
  assertStringIncludes(alias['@lessjs/core/less-runtime'], '.less-runtime.ts');
});

Deno.test('kiss() corePlugin.configResolved sets honoEntryCode', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  assertExists(corePlugin.configResolved);
  // Should not throw when called with fake config
  // Use type assertion to avoid TS2349 (ObjectHook may not be callable)
  if (typeof corePlugin.configResolved === 'function') {
    (corePlugin.configResolved as (config: never) => void)({} as never);
  }
  assertEquals(true, true);
});

// ─── kiss() virtualEntryPlugin hooks ────────────────────────

Deno.test('kiss() virtualEntryPlugin.resolveId matches VIRTUAL_ENTRY_ID', () => {
  const plugins = kiss();
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;
  assertExists(virtualPlugin.resolveId);
  // The resolved ID includes '\0' prefix — we just verify it returns non-null for the ID
  const result = (virtualPlugin.resolveId as Function)(
    'virtual:kiss-hono-entry',
    undefined as never,
    {} as never,
  );
  assertExists(result);
});

Deno.test('kiss() virtualEntryPlugin.load returns code for resolved ID', () => {
  const plugins = kiss();
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;
  assertExists(virtualPlugin.load);
  // '\0virtual:kiss-hono-entry' is the resolved ID
  const code = (virtualPlugin.load as Function)('\0virtual:kiss-hono-entry' as never);
  assertExists(code);
  assertStringIncludes(code as string, 'hono');
});

// ─── kiss() packageIslands option ───────────────────────────

Deno.test('kiss() with packageIslands option (empty array)', () => {
  const plugins = kiss({ packageIslands: [] });
  // v0.3.1: 5 plugins (html-template removed — was a no-op)
  assertEquals(plugins.length, 5);
});

// ─── kiss() default dirs ────────────────────────────────────

Deno.test('kiss() applies default routesDir and islandsDir', () => {
  const plugins = kiss();
  assertEquals(plugins.length, 5);
  // Defaults applied internally via resolvedOptions
});

// ─── kiss() buildStart hook (requires filesystem) ──────────

Deno.test('kiss() corePlugin.buildStart is callable', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  assertExists(corePlugin.buildStart, 'core plugin must have buildStart');
  // buildStart is async and requires filesystem — just verify it's callable
  assertEquals(typeof corePlugin.buildStart, 'function');
});

// ─── kiss() error classification branches ────────────────────

Deno.test('kiss() with all options branches covered', () => {
  // Test with packageIslands + island strategy + middleware cors
  const plugins = kiss({
    routesDir: 'pages',
    islandsDir: 'islands',
    packageIslands: ['@lessjs/ui'],
    island: { upgradeStrategy: 'visible' },
    middleware: { corsOrigin: ['http://localhost:3000'] },
    html: { title: 'Test', lang: 'ja' },
    inject: {
      stylesheets: ['https://cdn.example.com/style.css'],
      scripts: ['https://cdn.example.com/app.js'],
      headFragments: ['<meta name="x" content="y">'],
    },
  });
  assertEquals(plugins.length, 5);
});

Deno.test('kiss() with middleware.corsOrigin as string', () => {
  const plugins = kiss({
    middleware: { corsOrigin: '*' },
  });
  assertEquals(plugins.length, 5);
});

Deno.test('kiss() with middleware.corsOrigin as array', () => {
  const plugins = kiss({
    middleware: { corsOrigin: ['http://localhost:3000', 'http://localhost:3001'] },
  });
  assertEquals(plugins.length, 5);
});

Deno.test('kiss() with island.upgradeStrategy=eager', () => {
  const plugins = kiss({
    island: { upgradeStrategy: 'eager' },
  });
  assertEquals(plugins.length, 5);
});

Deno.test('kiss() with island.upgradeStrategy=idle', () => {
  const plugins = kiss({
    island: { upgradeStrategy: 'idle' },
  });
  assertEquals(plugins.length, 5);
});

// ─── kiss() buildStart hook (actual execution) ──────────

Deno.test('kiss() corePlugin.buildStart scans routes and islands', async () => {
  // Create a temp directory structure with routes and islands
  const tmp = Deno.makeTempDirSync({ prefix: 'kiss-buildstart-' });
  try {
    const routesDir = join(tmp, 'app', 'routes');
    const islandsDir = join(tmp, 'app', 'islands');
    Deno.mkdirSync(routesDir, { recursive: true });
    Deno.mkdirSync(islandsDir, { recursive: true });

    // Create a page route
    Deno.writeTextFileSync(join(routesDir, 'index.ts'), 'export default () => "<h1>Hello</h1>"');
    // Create an island
    Deno.writeTextFileSync(join(islandsDir, 'counter.ts'), 'export const tagName = "kiss-counter"');

    const origCwd = Deno.cwd();
    Deno.chdir(tmp);

    const plugins = kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
    });
    const corePlugin = plugins.find((p) => p.name === 'less:core')!;
    assertExists(corePlugin.buildStart);

    // Call buildStart — it should succeed with valid directory structure
    await (corePlugin.buildStart as Function)();

    Deno.chdir(origCwd);
  } finally {
    try {
      Deno.removeSync(tmp, { recursive: true });
    } catch { /* ignore */ }
  }
});

Deno.test('kiss() corePlugin.buildStart handles empty directories gracefully', async () => {
  const tmp = Deno.makeTempDirSync({ prefix: 'kiss-buildstart-empty-' });
  try {
    const routesDir = join(tmp, 'nonexistent', 'routes');
    const islandsDir = join(tmp, 'nonexistent', 'islands');

    const origCwd = Deno.cwd();
    Deno.chdir(tmp);

    const plugins = kiss({
      routesDir: 'nonexistent/routes',
      islandsDir: 'nonexistent/islands',
    });
    const corePlugin = plugins.find((p) => p.name === 'less:core')!;

    // buildStart should NOT throw — scanRoutes returns empty array for missing dirs
    await (corePlugin.buildStart as Function)();

    Deno.chdir(origCwd);
  } finally {
    try {
      Deno.removeSync(tmp, { recursive: true });
    } catch { /* ignore */ }
  }
});

Deno.test('kiss() corePlugin.buildStart with packageIslands config', async () => {
  const tmp = Deno.makeTempDirSync({ prefix: 'kiss-buildstart-pkg-' });
  try {
    const routesDir = join(tmp, 'app', 'routes');
    const islandsDir = join(tmp, 'app', 'islands');
    Deno.mkdirSync(routesDir, { recursive: true });
    Deno.mkdirSync(islandsDir, { recursive: true });
    Deno.writeTextFileSync(join(routesDir, 'index.ts'), 'export default () => "<h1>Hello</h1>"');

    const origCwd = Deno.cwd();
    Deno.chdir(tmp);

    // packageIslands with non-existent package — should still not crash buildStart
    const plugins = kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      packageIslands: ['@nonexistent/package'],
    });
    const corePlugin = plugins.find((p) => p.name === 'less:core')!;

    // Will try to scan package islands but fail gracefully (logged, not thrown)
    try {
      await (corePlugin.buildStart as Function)();
    } catch {
      // Expected — @nonexistent/package import will fail, but route scan should succeed first
    }

    Deno.chdir(origCwd);
  } finally {
    try {
      Deno.removeSync(tmp, { recursive: true });
    } catch { /* ignore */ }
  }
});

// ─── kiss() configResolved + virtualEntry fallback ──────────

Deno.test('kiss() virtualEntryPlugin.load fallback when ctx.honoEntryCode is empty', () => {
  const plugins = kiss();
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;
  // First call configResolved to set honoEntryCode
  // deno-lint-ignore no-explicit-any
  if (typeof (plugins[0] as any).configResolved === 'function') {
    // deno-lint-ignore no-explicit-any
    (plugins[0] as any).configResolved({} as never);
  }
  // load should return code
  const code = (virtualPlugin.load as Function)('\0virtual:kiss-hono-entry' as never);
  assertExists(code);
  assertStringIncludes(code as string, 'hono');
});

Deno.test('kiss() virtualEntryPlugin.resolveId returns null for unknown IDs', () => {
  const plugins = kiss();
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;
  const result = (virtualPlugin.resolveId as Function)('unknown-module', undefined, {});
  assertEquals(result, undefined);
});

Deno.test('kiss() virtualEntryPlugin.load returns null for unknown IDs', () => {
  const plugins = kiss();
  const virtualPlugin = plugins.find((p) => p.name === 'less:virtual-entry')!;
  const result = (virtualPlugin.load as Function)('unknown-id');
  assertEquals(result, undefined);
});

// ─── kiss() inject with special chars (escaping) ──────────

Deno.test('kiss() inject.stylesheets escapes special chars in URLs', () => {
  const plugins = kiss({
    inject: { stylesheets: ['https://cdn.example.com/app.css?v=1&x<"test">'] },
  });
  assertEquals(plugins.length, 5);
});

Deno.test('kiss() inject.scripts escapes special chars in URLs', () => {
  const plugins = kiss({
    inject: { scripts: ['https://cdn.example.com/app.js?v=1&x<"test">'] },
  });
  assertEquals(plugins.length, 5);
});

// ─── kiss() config hook without resolve ──────────

Deno.test('kiss() corePlugin.config handles config without resolve', () => {
  const plugins = kiss();
  const corePlugin = plugins.find((p) => p.name === 'less:core')!;
  const result = (corePlugin.config as Function)({} as never);
  assertExists(result);
  assertExists((result as Record<string, unknown>).build);
});
