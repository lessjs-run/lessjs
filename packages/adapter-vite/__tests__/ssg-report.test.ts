/**
 * @lessjs/adapter-vite - SSG Report Integration Test
 *
 * Verifies that ssgRender produces a valid dsd-report.json
 * with correct shape, error counts, and metrics.
 *
 * v0.15.3: DSD report + release gate SOP.
 */

import { assert, assertEquals, assertExists, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Hono } from 'hono';
import { ssgRender } from '../src/cli/ssg-render.js';
import type { SsgPageOutput, SsgRenderOptions, SsrBundle } from '../src/cli/ssg-render.js';

const TEST_OUT_DIR = './dist-test-ssg-report';

function createMockBundle(overrides: Partial<SsrBundle> = {}): SsrBundle {
  const app = new Hono();
  app.get('/', (c) => c.text('ok'));
  return {
    default: app,
    routeInfo: [
      { path: '/', tagName: 'index-page', isDynamic: false, paramNames: [] },
    ],
    ...overrides,
  };
}

function readReport(dir: string): Record<string, unknown> {
  const reportPath = join(dir, 'dsd-report.json');
  assert(existsSync(reportPath), 'dsd-report.json should exist');
  return JSON.parse(readFileSync(reportPath, 'utf-8'));
}

const defaultOptions: SsgRenderOptions = {
  root: Deno.cwd(),
  outDir: TEST_OUT_DIR,
};

Deno.test('SSG report: dsd-report.json is produced after ssgRender', async (t) => {
  // Clean up before test
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  const bundle = createMockBundle();
  await ssgRender(bundle, defaultOptions);

  await t.step('dsd-report.json exists in output directory', () => {
    const reportPath = join(TEST_OUT_DIR, 'dsd-report.json');
    assert(existsSync(reportPath), 'dsd-report.json should exist');
  });

  await t.step('report shape is valid with required fields', () => {
    const report = readReport(TEST_OUT_DIR);
    assertEquals(typeof report.reportVersion, 'string');
    assertEquals(typeof report.timestamp, 'string');
    assertEquals(typeof report.totalPages, 'number');
    assertEquals(typeof report.totalErrors, 'number');
    assert(Array.isArray(report.renderErrors));
    assertEquals(typeof report.metricsSummary, 'object');
    assertEquals(typeof report.hydrationHintSummary, 'object');
  });

  await t.step('report version is 1.0.0', () => {
    const report = readReport(TEST_OUT_DIR);
    assertEquals(report.reportVersion, '1.0.0');
  });

  await t.step('timestamp is valid ISO 8601', () => {
    const report = readReport(TEST_OUT_DIR);
    const ts = report.timestamp as string;
    assert(!isNaN(Date.parse(ts)), 'timestamp should be a valid ISO date');
  });

  await t.step('metricsSummary has required fields', () => {
    const report = readReport(TEST_OUT_DIR);
    const ms = report.metricsSummary as Record<string, unknown>;
    assertEquals(typeof ms.totalComponents, 'number');
    assertEquals(typeof ms.totalRenderTimeMs, 'number');
    assertEquals(typeof ms.avgRenderTimeMs, 'number');
    assertEquals(typeof ms.totalTemplateSize, 'number');
    assertEquals(typeof ms.maxNestingDepth, 'number');
    assertEquals(typeof ms.errorComponentCount, 'number');
  });

  await t.step('hydrationHintSummary has required fields', () => {
    const report = readReport(TEST_OUT_DIR);
    const hs = report.hydrationHintSummary as Record<string, unknown>;
    assertEquals(typeof hs.totalHints, 'number');
    assertEquals(typeof hs.interactiveCount, 'number');
    assertEquals(typeof hs.pureIslandCount, 'number');
  });

  await t.step('report is deterministic — no undefined or null values', () => {
    const report = readReport(TEST_OUT_DIR);
    const json = JSON.stringify(report);
    assertStringIncludes(json, '"reportVersion"');
    assertStringIncludes(json, '"timestamp"');
    assertStringIncludes(json, '"totalPages"');
    assertStringIncludes(json, '"totalErrors"');
    assertStringIncludes(json, '"metricsSummary"');
    assertStringIncludes(json, '"hydrationHintSummary"');
    // Ensure no undefined values leaked into JSON
    assertEquals(json.includes('undefined'), false);
  });

  // Clean up after test
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

Deno.test('SSG report: collects diagnostics from renderRoute', async (t) => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  const mockOutput: SsgPageOutput = {
    html: '<html><body>dynamic page</body></html>',
    errors: [
      { phase: 'render', tagName: 'test-el', message: 'test error', recoverable: true },
    ],
    hydrationHints: [
      { tagName: 'test-el', layer: 'dsd-interactive' },
    ],
    componentCount: 1,
    renderTimeMs: 5.2,
  };

  const bundle = createMockBundle({
    routeInfo: [
      {
        path: '/blog/:slug',
        tagName: 'blog-page',
        isDynamic: true,
        paramNames: ['slug'],
      },
    ],
    renderRoute: (() => Promise.resolve(mockOutput)) as SsrBundle['renderRoute'],
    getStaticPaths: (() =>
      Promise.resolve([{ slug: 'hello-world' }])) as SsrBundle['getStaticPaths'],
  });

  await ssgRender(bundle, defaultOptions);

  await t.step('report captures page diagnostics from renderRoute', () => {
    const report = readReport(TEST_OUT_DIR);
    assertEquals(report.totalPages, 1);
    assertEquals(report.totalErrors, 1);
    const renderErrors = report.renderErrors as Array<Record<string, unknown>>;
    assertEquals(renderErrors.length, 1);
    assertEquals(renderErrors[0].path, '/blog/hello-world');
    assertEquals(renderErrors[0].componentCount, 1);
  });

  await t.step('error counts and metrics are not silently dropped', () => {
    const report = readReport(TEST_OUT_DIR);
    const ms = report.metricsSummary as Record<string, unknown>;
    assertEquals(ms.totalComponents, 1);
    assertEquals(ms.errorComponentCount, 1);
    const hs = report.hydrationHintSummary as Record<string, unknown>;
    assertEquals(hs.interactiveCount, 1);
    assertEquals(hs.totalHints, 1);
  });

  // Clean up
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

Deno.test('SSG report: handles string return from renderRoute (backward compat)', async () => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  // Old-style renderRoute that returns just a string
  const bundle = createMockBundle({
    routeInfo: [
      {
        path: '/legacy/:id',
        tagName: 'legacy-page',
        isDynamic: true,
        paramNames: ['id'],
      },
    ],
    renderRoute: (() =>
      Promise.resolve('<html><body>legacy</body></html>')) as unknown as SsrBundle['renderRoute'],
    getStaticPaths: (() =>
      Promise.resolve([{ id: '1' }])) as SsrBundle['getStaticPaths'],
  });

  await ssgRender(bundle, defaultOptions);

  // Report should still exist with 0 page diagnostics
  // (string-only output doesn't contribute diagnostics)
  const report = readReport(TEST_OUT_DIR);
  assertEquals(typeof report.reportVersion, 'string');
  assertEquals(report.totalErrors, 0);

  // Clean up
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

// ─── Manifest Decisions (v0.17.2) ──────────────────────────────

Deno.test('SSG report: manifestDecisions is present (empty when no ctx)', async () => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  const bundle = createMockBundle();
  // No ctx passed → manifestDecisions should be empty array
  await ssgRender(bundle, defaultOptions);

  const report = readReport(TEST_OUT_DIR);
  assert(Array.isArray(report.manifestDecisions));
  assertEquals((report.manifestDecisions as unknown[]).length, 0);

  // Clean up
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

Deno.test('SSG report: manifestDecisions populated from ctx', async (t) => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  // Create ctx with package island declarations
  const { LessBuildContext } = await import('../src/build-context.js');
  const ctx = new LessBuildContext({});
  ctx.phase1.packageManifests = [
    {
      schemaVersion: '1.0.0',
      packageName: '@lessjs/ui',
      version: '0.17.2',
      declarations: [
        {
          tagName: 'less-layout',
          less: { module: '@lessjs/ui/less-layout', hydrate: 'eager', ssr: true },
        },
        {
          tagName: 'less-button',
          less: { module: '@lessjs/ui/less-button', hydrate: 'lazy', ssr: false },
        },
        { tagName: 'less-card', less: { module: '@lessjs/ui/less-card' } }, // no ssr field → default true
      ],
    },
  ];
  ctx.phase1.packageIslandDecls = [
    {
      tagName: 'less-layout',
      modulePath: '@lessjs/ui/less-layout',
      isPackage: true,
      hydrate: 'eager',
      ssr: true,
      dsd: true,
    },
    {
      tagName: 'less-button',
      modulePath: '@lessjs/ui/less-button',
      isPackage: true,
      hydrate: 'lazy',
      ssr: false,
      dsd: true,
    },
    { tagName: 'less-card', modulePath: '@lessjs/ui/less-card', isPackage: true, hydrate: 'lazy' }, // no ssr → default true
  ];

  const bundle = createMockBundle();
  await ssgRender(bundle, defaultOptions, ctx);

  const report = readReport(TEST_OUT_DIR);
  const decisions = report.manifestDecisions as Array<Record<string, unknown>>;

  await t.step('has 3 decisions', () => {
    assertEquals(decisions.length, 3);
  });

  await t.step('ssr: true → renderPath ssr+client', () => {
    const layout = decisions.find((d) => d.tagName === 'less-layout');
    assertExists(layout);
    assertEquals(layout.ssr, true);
    assertEquals(layout.dsd, true);
    assertEquals(layout.hydrate, 'eager');
    assertEquals(layout.renderPath, 'ssr+client');
    assertEquals(layout.packageName, '@lessjs/ui');
  });

  await t.step('ssr: false → renderPath client-only', () => {
    const button = decisions.find((d) => d.tagName === 'less-button');
    assertExists(button);
    assertEquals(button.ssr, false);
    assertEquals(button.dsd, true);
    assertEquals(button.hydrate, 'lazy');
    assertEquals(button.renderPath, 'client-only');
  });

  await t.step('undefined ssr → defaults to true → renderPath ssr+client', () => {
    const card = decisions.find((d) => d.tagName === 'less-card');
    assertExists(card);
    assertEquals(card.ssr, true);
    assertEquals(card.renderPath, 'ssr+client');
  });

  // Clean up
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});
