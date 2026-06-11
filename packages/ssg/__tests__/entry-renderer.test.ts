/**
 * @openelement/ssg - entry-renderer.ts tests (Deno)
 *
 * Tests renderEntry output for error paths and SSG-specific generated code.
 * Focuses on renderEntry contract rather than buildEntryDescriptor (tested elsewhere).
 */
import {
  assertEquals,
  assertExists,
  assertFalse,
  assertStringIncludes,
} from 'jsr:@std/assert@^1.0.0';
import { buildEntryDescriptor, renderEntry } from '../src/index.ts';
import type { RouteEntry } from '@openelement/core';

// ─── Fixtures ──────────────────────────────────────────────────

const basicRoutes: RouteEntry[] = [
  { path: '/', filePath: 'index.ts', type: 'page', varName: 'pageIndex' },
  { path: '/api/hello', filePath: 'api/hello.ts', type: 'api', varName: 'apiHello' },
  { path: '/about', filePath: 'about.ts', type: 'page', varName: 'pageAbout' },
];

// ─── renderEntry tests ─────────────────────────────────────────

Deno.test('renderEntry: produces valid module code with imports and export', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertStringIncludes(code, "import { Hono } from 'hono'");
  assertStringIncludes(
    code,
    "import { renderDsd, renderDsdTree, escapeHtml } from '@openelement/core'",
  );
  assertStringIncludes(code, 'const app = new Hono()');
  assertStringIncludes(code, 'export default app');
});

Deno.test('renderEntry: exports universal openElement request handler', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertStringIncludes(code, 'export const openElementHandler = (request, context = {}) => {');
  assertStringIncludes(code, 'return app.fetch(request, context.env || {}, context.platform)');
  assertStringIncludes(
    code,
    "import { createRuntimeAdapter } from '@openelement/protocols/runtime'",
  );
  assertStringIncludes(code, 'export const openElementRuntimeAdapter = {');
  assertStringIncludes(
    code,
    "...createRuntimeAdapter({ name: 'openelement-hono', fetch: openElementHandler })",
  );
});

Deno.test('renderEntry: SSG mode excludes DOM shim', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertEquals(code.includes('install-global-dom-shim'), false);
});

Deno.test('renderEntry: SSG mode omits debug endpoint', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  // __kiss debug endpoint should not appear in SSG mode
  assertEquals(code.includes('/__kiss'), false);
});

Deno.test('renderEntry: dev mode includes debug route data in descriptor', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  // Should have debug routes in dev mode
  assertExists(desc.debugRoutes);
  assertEquals(desc.debugRoutes!.length, 3);
});

Deno.test('renderEntry: API routes are registered with app.route', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertStringIncludes(code, "app.route('/api/hello'");
  assertStringIncludes(code, '$apiHello');
});

Deno.test('renderEntry: page routes use SSR helper and wrapInDocument', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertStringIncludes(code, "app.get('/'");
  assertStringIncludes(code, 'customElements.define(');
  assertStringIncludes(code, 'wrapInDocument(');
});

Deno.test('renderEntry: CSP without nonce generates header middleware', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      csp: { policy: "default-src 'self'", nonce: false },
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'Content-Security-Policy');
  assertStringIncludes(code, "default-src 'self'");
  assertEquals(code.includes('crypto.randomUUID()'), false);
});

Deno.test('renderEntry: CSP with nonce generates per-request nonce', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      csp: { policy: "default-src 'self'", nonce: true },
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'crypto.randomUUID()');
  assertStringIncludes(code, "c.set('cspNonce'");
  assertStringIncludes(code, 'NONCE_PLACEHOLDER');
});

Deno.test('renderEntry: CORS with array origins', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      corsOrigin: ['https://a.example.com', 'https://b.example.com'],
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'cors');
  assertStringIncludes(code, 'https://a.example.com');
  assertStringIncludes(code, 'https://b.example.com');
});

Deno.test('renderEntry: lifecycle control produces redirect and not-found responses', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'return c.redirect(err.location, err.status)');
  assertStringIncludes(code, '__statusHtml("404 Not Found", err.message || "Not Found")');
  assertStringIncludes(code, 'notFound: true');
});

Deno.test('renderEntry: app shell is built from VNode tree with renderDsd', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'async function __renderAppShell(routeNode, routePath');
  assertStringIncludes(code, 'renderDsd(shell.tagName, { props: layoutProps })');
  assertStringIncludes(code, "import '@openelement/ui/open-layout';");
});

Deno.test('renderEntry: generated code has no process.env references', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  const codeLines = code.split('\n').filter((l) => !l.trimStart().startsWith('//'));
  assertFalse(
    codeLines.some((l) => l.includes('process.env')),
    'Generated code must not contain process.env calls',
  );
});

Deno.test('renderEntry: adapter auto-install code present in SSG mode', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, '__installOptionalAdapter');
  assertStringIncludes(code, '@openelement/adapter-lit/ssr');
  assertStringIncludes(code, '@openelement/adapter-vanilla/ssr');
  assertStringIncludes(code, '@openelement/adapter-react/ssr');
});

Deno.test('renderEntry: SSG mode exports routeInfo with correct shape', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'export const routeInfo = [');
  assertStringIncludes(code, "path: '/'");
  assertStringIncludes(code, "path: '/about'");
  assertStringIncludes(code, 'filePath: "index.ts"');
  assertStringIncludes(code, 'isDynamic: false');
});

Deno.test('renderEntry: SSR admission plan is exported', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'export const ssrAdmissionPlan');
  assertStringIncludes(code, '__CLIENT_ONLY_TAGS__');
});

Deno.test('renderEntry: generated code contains idempotent customElements.define patch', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertStringIncludes(code, 'const _origDefine = customElements.define.bind(customElements)');
  assertStringIncludes(code, 'customElements.define = (name, ctor, options) =>');
});

Deno.test('renderEntry: SSG mode includes getStaticPaths function', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'export async function getStaticPaths(routePath)');
  assertStringIncludes(code, 'return [];');
});

Deno.test('renderEntry: SSG mode includes renderRoute function', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'export async function renderRoute(routePath, options = {})');
  assertStringIncludes(code, 'routeInfo.find(r => r.path === routePath)');
});

Deno.test('renderEntry: non-SSG mode does not include renderRoute', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertEquals(code.includes('export async function renderRoute('), false);
  assertEquals(code.includes('export const routeInfo = ['), false);
});
