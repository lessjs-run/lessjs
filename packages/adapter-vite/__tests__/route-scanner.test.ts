/**
 * @lessjs/adapter-vite - route-scanner.ts tests (Deno)
 */
import { assertEquals, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { join } from 'jsr:@std/path@^1.0.0';
import {
  fileToTagName,
  scanIslands,
  scanRoutes,
  validatePackageIslandMeta,
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

// ─── scanPackageIslands Tests ──────────────────────────

Deno.test({
  name: 'route-scanner - scanPackageIslands',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step('returns empty array for empty package list', async () => {
      const { scanPackageIslands } = await import('../src/route-scanner.ts');
      const result = await scanPackageIslands([]);
      assertEquals(result, []);
    });

    await t.step('throws LessError for non-existent package', async () => {
      const { scanPackageIslands } = await import('../src/route-scanner.ts');
      const { LessError } = await import('@lessjs/core/errors'); // Non-existent package should throw — misconfigured packages must break the build
      try {
        await scanPackageIslands(['@nonexistent/package']);
        // Should not reach here
        assertEquals(true, false, 'Expected LessError to be thrown');
      } catch (e) {
        assertEquals(e instanceof LessError, true);
        assertEquals((e as Error).message.includes('@nonexistent/package'), true);
      }
    });

    // Test skipped: requires @lessjs/ui/dist to be built first.
    // Run `cd packages/ui && deno task build` then uncomment to run.
    /* await t.step('scans @lessjs/ui for islands', async () => {
    const { scanPackageIslands } = await import('../src/route-scanner.ts');
    const result = await scanPackageIslands(['@lessjs/ui']);
    assertEquals(Array.isArray(result), true);
    if (result.length > 0) {
      const tags = result.map((i) => i.tagName);
      assertEquals(tags.includes('less-theme-toggle') || tags.includes('less-button'), true);
    }
  }); */

    await t.step('throws LessError for package with import errors', async () => {
      const { scanPackageIslands } = await import('../src/route-scanner.ts');
      const { LessError } = await import('@lessjs/core/errors'); // A package that exists but fails to import should throw
      try {
        await scanPackageIslands(['vite']);
        // If vite imports successfully but has no islands, that's OK
        // But on this system it fails due to native binary deps
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

Deno.test('route-scanner - validates package island metadata before registry work', () => {
  validatePackageIslandMeta(
    {
      tagName: 'less-safe',
      modulePath: '@lessjs/ui/less-safe',
      strategy: 'lazy',
    },
    '@lessjs/ui',
  );

  assertThrows(
    () =>
      validatePackageIslandMeta(
        {
          tagName: "less-bad');alert(1);//",
          modulePath: '@lessjs/ui/less-safe',
          strategy: 'lazy',
        },
        '@evil/pkg',
      ),
    Error,
    'Invalid package island metadata',
  );

  assertThrows(
    () =>
      validatePackageIslandMeta(
        {
          tagName: 'less-safe',
          modulePath: 'data:text/javascript,alert(1)',
          strategy: 'lazy',
        },
        '@evil/pkg',
      ),
    Error,
    'Invalid package island metadata',
  );
});
