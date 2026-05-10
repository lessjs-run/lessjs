/**
 * @lessjs/core - Entry Renderer
 *
 * Pure function: EntryDescriptor → string (virtual module code).
 *
 * LessJS Architecture (v0.5.0):
 * - API routes use Hono standard app.route() (not app.all + fetch transform)
 * - Island upgrade is handled by the client entry (built by Vite in Phase 2).
 *   No inline script in SSG HTML; the client entry is a Vite-built module
 *   referenced via <script type="module" src="..."> and imports island modules
 *   for side-effect custom element registration.
 * - HTML document wrapping delegates to wrapInDocument from html-escape.ts
 *   (imported at runtime — single source of truth, no duplicate HTML logic)
 * - DSD output must remain plain HTML, without Lit SSR marker comments.
 */

import type {
  ApiRouteDecl,
  CorsOriginConfig,
  EntryDescriptor,
  ImportDecl,
  MiddlewareDecl,
  PageRouteDecl,
  RendererDecl,
} from './entry-descriptor.js';
import type { FrameworkOptions, PackageIslandMeta, RouteEntry } from './types.js';
import { buildEntryDescriptor } from './entry-descriptor.js';

// Re-export for backward compatibility (consumers import from hono-entry.ts)
export { buildEntryDescriptor } from './entry-descriptor.js';
export type { EntryDescriptor } from './entry-descriptor.js';

// ─── Import rendering ──────────────────────────────────────────

function renderImport(imp: ImportDecl): string {
  const names = imp.alias ? `${imp.names[0]} as ${imp.alias}` : imp.names.join(', ');
  return `import { ${names} } from '${imp.from}'`;
}

// ─── CORS config rendering ─────────────────────────────────────

function renderCorsOrigin(origin: CorsOriginConfig): string {
  if (typeof origin === 'object' && !Array.isArray(origin)) return origin.body;
  return JSON.stringify(origin);
}

const CORS_ALLOW =
  "allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowHeaders: ['Content-Type', 'Authorization'], credentials: true, maxAge: 86400";

// ─── Middleware rendering ───────────────────────────────────────

function renderMiddleware(lines: string[], mw: MiddlewareDecl): void {
  if (mw.comment) {
    lines.push(`// ${mw.comment}`);
  }

  switch (mw.kind) {
    case 'requestId':
      lines.push("app.use('*', requestId())");
      break;

    case 'logger':
      lines.push("app.use('*', honoLogger())");
      break;

    case 'cors': {
      const corsOrigin = mw.config?.corsOrigin;
      if (corsOrigin !== undefined) {
        const originStr = renderCorsOrigin(corsOrigin);
        lines.push(`app.use('*', cors({ origin: ${originStr}, ${CORS_ALLOW} }))`);
      } else {
        // v0.3.0: Tightened default — only allow localhost.
        // Production deployments MUST explicitly configure corsOrigin.
        // Returning '*' with credentials:true violates the Fetch spec.
        lines.push("app.use('*', cors({ origin: (origin) => {");
        lines.push(
          '  if (origin && /^https?:\\/\\/(localhost|127\\.0\\.0\\.1)(:\\d+)?$/.test(origin)) return origin',
        );
        lines.push('  // In production, set middleware.corsOrigin explicitly');
        lines.push('  return undefined');
        lines.push(`}, ${CORS_ALLOW} }))`);
      }
      break;
    }

    case 'securityHeaders':
      lines.push("app.use('*', secureHeaders())");
      break;

    case 'csp': {
      const cspConfig = mw.config?.csp;
      if (cspConfig) {
        const headerName = cspConfig.reportOnly
          ? 'Content-Security-Policy-Report-Only'
          : 'Content-Security-Policy';
        if (cspConfig.nonce) {
          // Build a policy template that uses NONCE_PLACEHOLDER, then at
          // runtime replace it with the actual nonce value.
          // This avoids the three bugs in the old string-concatenation approach:
          //   1. Missing closing quote on nonce value ('nonce-abc vs 'nonce-abc')
          //   2. Duplicate script-src directive (CSP ignores the second one)
          //   3. Resulting silent security bypass (nonce never takes effect)
          const basePolicy: string = cspConfig.policy || '';
          const hasScriptSrc = /script-src/i.test(basePolicy);
          const policyTemplate = hasScriptSrc
            ? basePolicy.replace(
              /script-src\s+([^;]*)/i,
              "script-src 'nonce-NONCE_PLACEHOLDER' $1",
            )
            : basePolicy + "; script-src 'nonce-NONCE_PLACEHOLDER'";
          lines.push(
            `// CSP with auto-nonce: generates a per-request nonce and adds it to script tags`,
          );
          lines.push(`app.use('*', async (c, next) => {`);
          lines.push(`  const nonce = crypto.randomUUID().replace(/-/g, '')`);
          lines.push(`  c.set('cspNonce', nonce)`);
          lines.push(
            `  const policy = ${
              JSON.stringify(policyTemplate)
            }.replace('NONCE_PLACEHOLDER', nonce)`,
          );
          lines.push(`  await next()`);
          lines.push(`  c.header('${headerName}', policy)`);
          lines.push(`})`);
        } else {
          lines.push(`app.use('*', async (c, next) => {`);
          lines.push(`  await next()`);
          lines.push(`  c.header('${headerName}', ${JSON.stringify(cspConfig.policy)})`);
          lines.push(`})`);
        }
      }
      break;
    }
  }

  lines.push('');
}

// ─── API route rendering ───────────────────────────────────────

/**
 * Render an API route using Hono's standard app.route().
 *
 * v0.3.0: Replaced app.all + fetch transform (which broke Hono's
 * routing tree and RPC type chain) with the idiomatic app.route().
 *
 * Convention: API files default-export a Hono sub-app.
 * Framework mounts: app.route('/api/posts', subApp)
 */
function renderApiRoute(lines: string[], route: ApiRouteDecl): void {
  lines.push(`// API: ${route.path} (${route.filePath})`);
  lines.push(`app.route('${route.path}', ${route.varName}.default)`);
  lines.push('');
}

// ─── Page route rendering ──────────────────────────────────────

function renderPageRoute(
  lines: string[],
  route: PageRouteDecl,
  renderers: RendererDecl[],
  docConfig: { title: string; lang: string; headExtras: string },
  isSSG: boolean,
): void {
  // Find renderers whose scope matches this route's path prefix
  const matchingRenderers = renderers.filter((r) => {
    if (r.scope === '/') return true;
    return route.path === r.scope || route.path.startsWith(r.scope + '/');
  });

  lines.push(`// Page: ${route.path} (${route.filePath})`);
  lines.push(`app.get('${route.path}', async (c) => {`);
  lines.push(`  try {`);
  lines.push(`    const tag = ${route.varName}.tagName || '${route.defaultTagName}'`);
  // v0.5.0: DSD renderer - no <!--lit-part--> markers, no old upgrade marker.
  // __ssr() uses renderDSD() which outputs standard DSD HTML.
  // Components receive route params as props for SSR-time data access.
  // v0.6: Pass route/source context for error visibility.
  lines.push(
    `    const raw = await __ssr(tag, c.req.param(), { route: '${route.path}', source: '${route.filePath}' })`,
  );
  lines.push(`    const html = raw`);
  lines.push('');

  // Wrap with renderers from outer to inner (v0.3.0)
  // SSG mode: headExtras is injected via Vite define as __LESS_HEAD_EXTRAS__
  // (ADR 0008 Phase A: replaces the old .less/head-extras.html runtime file read).
  // Dev mode: headExtras is inlined via JSON.stringify (safe for dev server).
  const headExtrasExpr = isSSG ? '__headExtras' : JSON.stringify(docConfig.headExtras);

  lines.push(`    let content = html`);
  if (matchingRenderers.length > 0) {
    lines.push(`    // Renderer wrapping (outer → inner)`);
    for (const renderer of matchingRenderers) {
      lines.push(`    content = ${renderer.varName}.default.wrap(content, c)`);
    }
  }
  lines.push(`    return c.html(wrapInDocument(content, {`);
  lines.push(`      title: ${JSON.stringify(docConfig.title)},`);
  lines.push(`      lang: ${JSON.stringify(docConfig.lang)},`);
  lines.push(`      headExtras: ${headExtrasExpr},`);
  lines.push(`      cspNonce: c.get('cspNonce'),`);
  lines.push(`    }))`);

  lines.push(`  } catch (err) {`);
  // Use import.meta.env.PROD for runtime environment detection.
  // process.env.NODE_ENV was previously evaluated at code-generation time
  // (build machine), which meant CI without NODE_ENV=production would leak
  // stack traces in production.
  lines.push(`    if (import.meta.env.PROD) {`);
  lines.push(`      return c.html('<h1>500 Internal Server Error</h1>', 500)`);
  lines.push(`    } else {`);
  lines.push(`      const safeErr = escapeHtml(String(err.stack || err))`);
  lines.push(`      return c.html('<h1>500</h1><pre>' + safeErr + '</pre>', 500)`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(`})`);
  lines.push('');
}

// ─── Main renderer ─────────────────────────────────────────────

/**
 * Render an EntryDescriptor into a complete virtual module string.
 *
 * Pure function — deterministic, testable, side-effect-free.
 *
 * v0.5.0: Island upgrade is handled by the Vite-built client entry (Phase 2),
 * not by inline scripts in SSG HTML. The client entry imports each island
 * module so custom elements can self-register and upgrade existing DSD markup.
 *
 * SSR output is plain DSD HTML. No Lit SSR marker comments, no bare module
 * imports, and no duplicate client render ceremony.
 *
 * The client script <script> tag is injected by build-ssg.ts (Phase 3)
 * after reading the Vite client build manifest.
 */
export function renderEntry(desc: EntryDescriptor): string {
  const lines: string[] = [];

  // --- SSG: DSD renderer doesn't need DOM shim ---
  // v0.5.0: render-dsd.ts uses pure string concatenation — no DOM shim needed
  // The old @lit-labs/ssr DOM shim import has been removed.

  // --- Imports ---
  for (const imp of desc.imports) {
    lines.push(renderImport(imp));
  }

  // --- Island lookup (build-time known list) ---
  // This map is used by the SSR helper to know which custom elements
  // to render. Client-side upgrade is handled by the client entry
  // that imports island modules separately in Phase 2.
  const islandLookup: Record<string, string> = {};
  for (const island of desc.islands) {
    islandLookup[island.tagName] = island.modulePath;
  }

  lines.push(`// Known islands (determined at build time by scanning islandsDir)`);
  lines.push(`const __islandMap = ${JSON.stringify(islandLookup)}`);
  lines.push('');

  // --- Document wrapper ---
  // ADR 0013: import directly from source files instead of less-runtime barrel.
  lines.push(`import { wrapInDocument } from '@lessjs/core/ssr-handler';`);
  lines.push(`import { createLogger } from '@lessjs/core/logger';`);
  lines.push(`const log = createLogger('core');`);
  lines.push('');

  // --- Route module imports ---
  for (const route of [...desc.apiRoutes, ...desc.pageRoutes]) {
    lines.push(`import * as ${route.varName} from '${route.importPath}'`);
  }
  // Import special file modules (v0.3.0)
  for (const renderer of desc.renderers) {
    lines.push(`import * as ${renderer.varName} from '${renderer.importPath}'`);
  }
  for (const mwScope of desc.middlewareScopes) {
    lines.push(`import * as ${mwScope.varName} from '${mwScope.importPath}'`);
  }
  lines.push('');

  // --- SSG: Auto-install Lit adapter if available ---
  // With viteBuild(ssr:true, noExternal), @lessjs/adapter-lit is inlined
  // into the self-contained bundle. Installing it at module load time
  // ensures registerAdapter() runs before any renderDSD() call.
  // The try/catch makes this a no-op when @lessjs/adapter-lit is absent.
  if (desc.isSSG) {
    lines.push('// SSG: auto-install Lit adapter (inlined in SSR bundle)');
    lines.push('try {');
    lines.push("  const { installLitAdapter } = await import('@lessjs/adapter-lit');");
    lines.push('  installLitAdapter();');
    lines.push('} catch { /* @lessjs/adapter-lit not available */ }');
    lines.push('');
  }

  // --- Register page components in SSR customElements registry ---
  // This is essential for renderDSD() to find and render Shadow DOM.
  // Each SSR route module exports { default: ComponentClass, tagName: string }.
  for (const route of desc.pageRoutes) {
    lines.push(`if (!customElements.get(${route.varName}.tagName || '${route.defaultTagName}')) {`);
    lines.push(
      `  customElements.define(${route.varName}.tagName || '${route.defaultTagName}', ${route.varName}.default)`,
    );
    lines.push(`}`);
  }
  lines.push('');

  // --- Register island components in SSR customElements registry ---
  // Islands need to be registered so renderDSD() can produce DSD.
  // Uses a static import per island module (known at build time).
  // Package islands are imported by the client entry for browser upgrade.
  // SSR only imports local app islands, which avoids forcing Vite to resolve
  // package-manager-specific JSR specifiers in the server module runner.
  const ssrIslands = desc.islands.filter((island) => !island.isPackage);
  for (const island of ssrIslands) {
    const varName = `__island_${island.tagName.replace(/-/g, '_')}`;
    lines.push(`import * as ${varName} from '${island.modulePath}'`);
  }
  for (const island of ssrIslands) {
    const varName = `__island_${island.tagName.replace(/-/g, '_')}`;
    const componentVar = `__island_component_${island.tagName.replace(/-/g, '_')}`;
    lines.push(`const ${componentVar} = ${varName}?.default`);
    lines.push(`if (${componentVar} && !customElements.get('${island.tagName}')) {`);
    lines.push(`  customElements.define('${island.tagName}', ${componentVar})`);
    lines.push(`}`);
  }
  lines.push('');

  // --- SSG: headExtras via define injection ---
  // ADR 0008 Phase A: Instead of reading .less/head-extras.html at runtime,
  // headExtras is injected via Vite's define option as __LESS_HEAD_EXTRAS__.
  // This eliminates the .less/head-extras.html temp file and avoids the
  // Vite SSR AsyncFunction syntax errors that large inline strings cause.
  // The build-ssg.ts SSR build config includes:
  //   define: { __LESS_HEAD_EXTRAS__: JSON.stringify(headExtras) }
  if (desc.isSSG && desc.document.headExtras) {
    lines.push('// SSG: headExtras injected via Vite define (ADR 0008 Phase A)');
    lines.push('// Replaces the old .less/head-extras.html runtime file read');
    lines.push('const __headExtras = __LESS_HEAD_EXTRAS__ || "";');
    lines.push('');
  }

  // --- SSR helper (v0.5.0) ---
  // DSD renderer replaces Lit SSR + <!--lit-part--> markers.
  // Components must be registered via customElements.define() before SSR,
  // otherwise customElements.get() returns undefined.
  // Each component's render() returns a plain HTML string (no TemplateResult).
  // Output is standard DSD: <tag><template shadowrootmode="open">...</template></tag>
  // No old upgrade marker, no <!--lit-part-->, no client render ceremony needed.
  lines.push('// SSR helper: render a registered custom element to DSD HTML');
  lines.push('// Outputs standard DSD; no client render markers needed');
  lines.push('async function __ssr(tag, props = {}, sourceInfo = {}) {');
  lines.push('  // Validate tag name — must be a valid Custom Element (contains hyphen)');
  lines.push('  if (!tag || !tag.includes("-")) {');
  lines.push(
    '    throw new Error("[LessJS] Invalid custom element tag: " + String(tag) + ". Must contain a hyphen.")',
  );
  lines.push('  }');
  lines.push('  const Cls = customElements.get(tag)');
  lines.push('  if (!Cls) {');
  lines.push('    log.warn("<" + tag + "> not registered — rendering empty")');
  lines.push('    return "<" + tag + "></" + tag + ">"');
  lines.push('  }');
  lines.push('  return renderDSD(tag, Cls, props, sourceInfo)');
  lines.push('}');
  lines.push('');

  // --- App creation + Middleware ---
  lines.push('const app = new Hono()');
  lines.push('');

  for (const mw of desc.middleware) {
    renderMiddleware(lines, mw);
  }

  // --- Middleware scopes (v0.3.0: _middleware.ts files) ---
  for (const mwScope of desc.middlewareScopes) {
    lines.push(`// Middleware scope: ${mwScope.scope} (${mwScope.importPath})`);
    lines.push(
      `app.use('${mwScope.scope === '/' ? '' : mwScope.scope}/*', ${mwScope.varName}.default)`,
    );
    lines.push('');
  }

  // --- API routes ---
  for (const route of desc.apiRoutes) {
    renderApiRoute(lines, route);
  }

  // --- Page routes ---
  const docConfig = {
    title: desc.document.title,
    lang: desc.document.lang,
    headExtras: desc.document.headExtras,
  };
  for (const route of desc.pageRoutes) {
    renderPageRoute(lines, route, desc.renderers, docConfig, desc.isSSG);
  }

  // --- Export ---
  lines.push('export default app');

  // ── SSG Utility Re-exports ──────────────────────────────────
  // ADR 0008 Phase C: After viteBuild(ssr:true, noExternal) produces a
  // self-contained ESM bundle, build-ssg.ts imports it and needs access
  // to these utility functions from the same module scope.
  //
  // Key: these re-exports share the SAME module-level variables as the
  // rest of the bundle (e.g., _adapter in types.ts, _posts in blog-data.ts).
  // This eliminates the globalThis[Symbol.for()] bridges from Phase B.
  //
  // Optional packages (@lessjs/adapter-lit, @lessjs/content, @lessjs/i18n)
  // are resolved by the optionalPackageStubsPlugin in build-ssg.ts, which
  // provides empty stubs when the real package is not installed.
  if (desc.isSSG) {
    lines.push('');
    lines.push('// ── SSG Utility Re-exports (ADR 0008 Phase C) ───────────────');
    lines.push('// Used by build-ssg.ts after importing the SSR bundle.');
    lines.push('// Shared module scope ensures adapter/data state is consistent.');
    lines.push('');
    lines.push('export { renderDSD, renderDSDByName } from "@lessjs/core/render-dsd"');
    lines.push('export { wrapInDocument } from "@lessjs/core/ssr-handler"');
    lines.push('export { registerAdapter, getAdapter } from "@lessjs/core/adapter-registry"');
    lines.push('export { installLitAdapter, uninstallLitAdapter } from "@lessjs/adapter-lit"');
    lines.push(
      'export { initBlogData, getPosts, getPostBySlug, getBlogOptions } from "@lessjs/content"',
    );
    lines.push('export { generateSitemap } from "@lessjs/content/sitemap"');
    lines.push(
      'export { initI18nData, getI18nOptions, getI18nLocales, getDefaultLocale } from "@lessjs/i18n"',
    );
  }

  return lines.join('\n');
}

// ─── Convenience wrapper ───────────────────────────────────────

/** Options for the Hono entry code generator */
export interface HonoEntryOptions {
  routesDir?: string;
  islandsDir?: string;
  componentsDir?: string;
  middleware?: FrameworkOptions['middleware'];
  ssg?: boolean;
  islandTagNames?: string[];
  /** Relative file paths for local islands (preserves subdirectory structure) */
  islandFiles?: string[];
  packageIslands?: PackageIslandMeta[];
  /** @security Injected as raw HTML without sanitization */
  headExtras?: string;
  html?: { lang?: string; title?: string };
  upgradeStrategy?: 'eager' | 'lazy' | 'idle' | 'visible';
}

/**
 * Generate the Hono entry module code from scanned routes.
 *
 * Internally:
 *  1. buildEntryDescriptor() — pure data transformation
 *  2. renderEntry()          — pure string rendering
 *
 * Both steps are exported individually for testing.
 */
export function generateHonoEntryCode(
  routes: RouteEntry[],
  options: HonoEntryOptions = {},
): string {
  const descriptor = buildEntryDescriptor(routes, options);
  return renderEntry(descriptor);
}
