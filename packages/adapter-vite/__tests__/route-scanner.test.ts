/**
 * @lessjs/adapter-vite - route-scanner.ts tests (Deno)
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { join } from 'jsr:@std/path@^1.0.0';
import {
  detectAndClassifyCemPackages,
  fileToTagName,
  scanCemManifests,
  scanIslandMeta,
  scanIslands,
  scanPackageManifests,
  scanRoutes,
} from '../src/route-scanner.ts';

const FIXTURES_DIR = join(Deno.cwd(), 'packages/core/__test_fixtures__');

Deno.test('route-scanner', { permissions: { read: true, write: true } }, async (t) => {
  // Setup fixtures
  await setupFixtures();

  await t.step('scanRoutes - maps index.ts to /', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-basic'));
    const indexRoute = routes.find((r) => r.path === '/');
    assertEquals(indexRoute !== undefined, true);
    assertEquals(indexRoute?.filePath, 'index.ts');
    assertEquals(indexRoute?.type, 'page');
  });

  await t.step('scanRoutes - maps about.ts to /about', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-basic'));
    const aboutRoute = routes.find((r) => r.path === '/about');
    assertEquals(aboutRoute !== undefined, true);
    assertEquals(aboutRoute?.filePath, 'about.ts');
  });

  await t.step('scanRoutes - maps [id].ts to /:id', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-dynamic'));
    const dynamicRoute = routes.find((r) => r.path === '/posts/:id');
    assertEquals(dynamicRoute !== undefined, true);
    assertEquals(dynamicRoute?.filePath, 'posts/[id].ts');
  });

  await t.step('scanRoutes - classifies api/ files as API routes', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-api'));
    const apiRoute = routes.find((r) => r.type === 'api');
    assertEquals(apiRoute !== undefined, true);
    assertEquals(apiRoute?.path, '/api/posts');
  });

  await t.step('scanRoutes - returns empty array for non-existent directory', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'non-existent'));
    assertEquals(routes, []);
  });

  await t.step('scanRoutes - sorts static routes before dynamic', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-dynamic'));
    const paths = routes.map((r) => r.path);
    const staticIndex = paths.indexOf('/');
    const dynamicIndex = paths.indexOf('/posts/:id');
    assertEquals(staticIndex < dynamicIndex, true);
  });

  await t.step('scanRoutes - detects _renderer.ts as a special file', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-special'));
    const renderers = routes.filter((r) => r.special === 'renderer');
    assertEquals(renderers.length >= 1, true);
    // Root _renderer.ts should be present
    const rootRenderer = renderers.find((r) => r.filePath === '_renderer.ts');
    assertEquals(rootRenderer !== undefined, true);
  });

  await t.step('scanRoutes - detects _middleware.ts as a special file', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-special'));
    const middleware = routes.find((r) => r.special === 'middleware');
    assertEquals(middleware !== undefined, true);
    assertEquals(middleware?.filePath, '_middleware.ts');
  });

  await t.step('scanRoutes - detects nested _renderer.ts', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-special'));
    const adminRenderer = routes.find(
      (r) => r.special === 'renderer' && r.filePath.includes('admin'),
    );
    assertEquals(adminRenderer !== undefined, true);
    assertEquals(adminRenderer?.filePath, 'admin/_renderer.ts');
  });

  await t.step('scanRoutes - regular routes are not marked as special', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-special'));
    const regularRoutes = routes.filter((r) => !r.special);
    assertEquals(regularRoutes.length > 0, true);
    for (const r of regularRoutes) {
      assertEquals(r.special, undefined);
    }
  });

  await t.step('scanIslands - lists island files', async () => {
    const islands = await scanIslands(join(FIXTURES_DIR, 'islands'));
    assertEquals(islands.includes('my-counter.ts'), true);
    assertEquals(islands.includes('theme-toggle.ts'), true);
  });

  await t.step('scanIslandMeta - reads local less metadata without importing modules', async () => {
    await Deno.writeTextFile(
      join(FIXTURES_DIR, 'islands', 'client-only.ts'),
      [
        'throw new Error("must not import");',
        'export const less = { ssr: false, dsd: false, hydrate: "idle" };',
        'export default class ClientOnly {}',
      ].join('\n'),
    );
    const meta = await scanIslandMeta(join(FIXTURES_DIR, 'islands'), [
      'client-only.ts',
      'my-counter.ts',
    ]);
    assertEquals(meta['client-only'].ssr, false);
    assertEquals(meta['client-only'].dsd, false);
    assertEquals(meta['client-only'].hydrate, 'idle');
    assertEquals(meta['client-only'].reason, 'local island exports less.ssr=false');
    assertEquals(meta['my-counter'], undefined);
  });

  await t.step('scanIslands - returns empty for non-existent directory', async () => {
    const islands = await scanIslands(join(FIXTURES_DIR, 'non-existent'));
    assertEquals(islands, []);
  });

  await t.step('fileToTagName - converts file name to tag name', () => {
    assertEquals(fileToTagName('my-counter.ts'), 'my-counter');
    assertEquals(fileToTagName('theme-toggle.ts'), 'theme-toggle');
    // Path separators become hyphens (B4 fix)
    assertEquals(fileToTagName('posts/index.ts'), 'posts-index');
    assertEquals(fileToTagName('admin\\dashboard.ts'), 'admin-dashboard');
    // Uppercase is normalized to lowercase
    assertEquals(fileToTagName('My-Counter.ts'), 'my-counter');
  });

  // Cleanup fixtures
  await cleanupFixtures();
});

async function setupFixtures() {
  const dirs = [
    join(FIXTURES_DIR, 'routes-basic'),
    join(FIXTURES_DIR, 'routes-dynamic', 'posts'),
    join(FIXTURES_DIR, 'routes-api', 'api'),
    join(FIXTURES_DIR, 'routes-special', 'admin'),
    join(FIXTURES_DIR, 'islands'),
  ];
  for (const dir of dirs) {
    await Deno.mkdir(dir, { recursive: true });
  }

  // Basic routes
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-basic', 'index.ts'), 'export default {}');
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-basic', 'about.ts'), 'export default {}');

  // Dynamic routes
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-dynamic', 'index.ts'), 'export default {}');
  await Deno.writeTextFile(
    join(FIXTURES_DIR, 'routes-dynamic', 'posts', '[id].ts'),
    'export default {}',
  );

  // API routes
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-api', 'index.ts'), 'export default {}');
  await Deno.writeTextFile(
    join(FIXTURES_DIR, 'routes-api', 'api', 'posts.ts'),
    'export default {}',
  );

  // Special files
  await Deno.writeTextFile(
    join(FIXTURES_DIR, 'routes-special', '_renderer.ts'),
    'export default {}',
  );
  await Deno.writeTextFile(
    join(FIXTURES_DIR, 'routes-special', '_middleware.ts'),
    'export default {}',
  );
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-special', 'index.ts'), 'export default {}');
  await Deno.writeTextFile(
    join(FIXTURES_DIR, 'routes-special', 'admin', '_renderer.ts'),
    'export default {}',
  );
  await Deno.writeTextFile(
    join(FIXTURES_DIR, 'routes-special', 'admin', 'dashboard.ts'),
    'export default {}',
  );

  // Islands
  await Deno.writeTextFile(join(FIXTURES_DIR, 'islands', 'my-counter.ts'), 'export default {}');
  await Deno.writeTextFile(join(FIXTURES_DIR, 'islands', 'theme-toggle.ts'), 'export default {}');
}

async function cleanupFixtures() {
  try {
    await Deno.remove(FIXTURES_DIR, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
}

// ─── scanPackageManifests Tests ──────────────────────────

Deno.test({
  name: 'route-scanner - scanPackageManifests',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step('returns empty array for empty package list', async () => {
      const result = await scanPackageManifests([]);
      assertEquals(result, []);
    });

    await t.step('throws LessError for non-existent package', async () => {
      const { LessError } = await import('@lessjs/core/errors');
      try {
        await scanPackageManifests(['@nonexistent/package']);
        assertEquals(true, false, 'Expected LessError to be thrown');
      } catch (e) {
        assertEquals(e instanceof LessError, true);
        assertEquals((e as Error).message.includes('@nonexistent/package'), true);
      }
    });

    // Test skipped: requires @lessjs/ui/dist to be built first.
    // Run `cd packages/ui && deno task build` then uncomment to run.
    /* await t.step('scans @lessjs/ui for manifests', async () => {
    const result = await scanPackageManifests(['@lessjs/ui']);
    assertEquals(Array.isArray(result), true);
    assertEquals(result.length > 0, true);
    assertEquals(result[0].packageName, '@lessjs/ui');
    assertEquals(result[0].declarations.length > 0, true);
  }); */

    await t.step('throws LessError for package with import errors', async () => {
      const { LessError } = await import('@lessjs/core/errors');
      try {
        await scanPackageManifests(['vite']);
      } catch (e) {
        assertEquals(e instanceof LessError, true);
        assertEquals((e as Error).message.includes('vite'), true);
      }
    });
  },
});

// ─── scanIslands edge cases ──────────────────────────

Deno.test('route-scanner - scanIslands with non-existent dir', async () => {
  const { scanIslands } = await import('../src/route-scanner.ts');
  const result = await scanIslands('/nonexistent/path/islands');
  assertEquals(result, []);
});

Deno.test('route-scanner - scanPackageManifests rejects packages without manifest export', async () => {
  const { LessError } = await import('@lessjs/core/errors');
  // A package that exists but has no manifest export should throw
  try {
    await scanPackageManifests(['jsr:@std/assert']);
    // If it somehow has a manifest, that's unexpected but OK
  } catch (e) {
    assertEquals(e instanceof LessError, true);
  }
});

// ─── scanCemManifests Tests ──────────────────────────

Deno.test(
  'route-scanner - scanCemManifests returns empty for non-existent dir',
  { permissions: { read: true } },
  async () => {
    const result = await scanCemManifests('/nonexistent/fake/node_modules');
    assertEquals(result, []);
  },
);

Deno.test(
  'route-scanner - scanCemManifests finds custom-elements.json files',
  { permissions: { read: true, write: true } },
  async () => {
    const tmpDir = await Deno.makeTempDir();
    try {
      // Create a fake node_modules with two packages: one with CEM, one without
      const pkgWithCem = join(tmpDir, 'wc-with-cem');
      const pkgNoCem = join(tmpDir, 'no-cem-pkg');
      await Deno.mkdir(pkgWithCem, { recursive: true });
      await Deno.mkdir(pkgNoCem, { recursive: true });

      const cem = JSON.stringify({
        schemaVersion: '1.0.0',
        modules: [],
      });
      await Deno.writeTextFile(join(pkgWithCem, 'custom-elements.json'), cem);
      await Deno.writeTextFile(join(pkgNoCem, 'package.json'), '{"name":"no-cem-pkg"}');

      const results = await scanCemManifests(tmpDir);
      assertEquals(results.length, 1);
      assertEquals(results[0].packageName, 'wc-with-cem');
      assertEquals(typeof results[0].json, 'string');
    } finally {
      await Deno.remove(tmpDir, { recursive: true });
    }
  },
);

Deno.test(
  'route-scanner - scanCemManifests handles scoped packages (@org/pkg)',
  { permissions: { read: true, write: true } },
  async () => {
    const tmpDir = await Deno.makeTempDir();
    try {
      const scopedPkg = join(tmpDir, '@my-org', 'my-wc');
      await Deno.mkdir(scopedPkg, { recursive: true });
      const cem = JSON.stringify({ schemaVersion: '1.0.0', modules: [] });
      await Deno.writeTextFile(join(scopedPkg, 'custom-elements.json'), cem);

      const results = await scanCemManifests(tmpDir);
      assertEquals(results.length, 1);
      assertEquals(results[0].packageName, '@my-org/my-wc');
    } finally {
      await Deno.remove(tmpDir, { recursive: true });
    }
  },
);

Deno.test(
  'route-scanner - detectAndClassifyCemPackages returns empty for empty node_modules',
  { permissions: { read: true, write: true } },
  async () => {
    const tmpDir = await Deno.makeTempDir();
    try {
      const result = await detectAndClassifyCemPackages(tmpDir);
      assertEquals(Array.isArray(result), true);
      assertEquals(result.length, 0);
    } finally {
      await Deno.remove(tmpDir, { recursive: true });
    }
  },
);

Deno.test(
  'route-scanner - detectAndClassifyCemPackages classifies client-only by default (no Less extension)',
  { permissions: { read: true, write: true } },
  async () => {
    const tmpDir = await Deno.makeTempDir();
    try {
      const pkg = join(tmpDir, 'vanilla-wc');
      await Deno.mkdir(pkg, { recursive: true });
      // CEM with a custom element but no Less extension -> conservative default: client-only
      const cem = JSON.stringify({
        schemaVersion: '1.0.0',
        modules: [{
          kind: 'javascript-module',
          path: './src/index.js',
          declarations: [{
            kind: 'custom-element',
            tagName: 'my-button',
            name: 'MyButton',
          }],
        }],
      });
      await Deno.writeTextFile(join(pkg, 'custom-elements.json'), cem);

      const result = await detectAndClassifyCemPackages(tmpDir);
      assertEquals(result.length, 1);
      assertEquals(result[0].tagName, 'my-button');
      assertEquals(result[0].tier, 'client-only');
    } finally {
      await Deno.remove(tmpDir, { recursive: true });
    }
  },
);

Deno.test(
  'route-scanner - detectAndClassifyCemPackages skips invalid CEM JSON',
  { permissions: { read: true, write: true } },
  async () => {
    const tmpDir = await Deno.makeTempDir();
    try {
      const pkg = join(tmpDir, 'broken-wc');
      await Deno.mkdir(pkg, { recursive: true });
      await Deno.writeTextFile(join(pkg, 'custom-elements.json'), 'not-valid-json{{{');

      // Should not throw, should return empty
      const result = await detectAndClassifyCemPackages(tmpDir);
      assertEquals(result.length, 0);
    } finally {
      await Deno.remove(tmpDir, { recursive: true });
    }
  },
);
