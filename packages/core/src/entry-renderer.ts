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
 * - HTML document wrapping delegates to wrapInDocument from ssr-handler.ts
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

// ─── Code builder helper ───────────────────────────────────────

class CodeBuilder {
  private lines: string[] = [];

  push(line: string): void {
    this.lines.push(line);
  }
  blank(): void {
    this.lines.push('');
  }

  toString(): string {
    return this.lines.join('\n');
  }
}

// ─── Import rendering ──────────────────────────────────────────

function renderImport(imp: ImportDecl): string {
  const names = imp.alias ? `${imp.names[0]} as ${imp.alias}` : imp.names.join(', ');
  return `import { ${names} } from '${imp.from}'`;
}

// ─── CORS config rendering ─────────────────────────────────────

function renderCorsOrigin(origin: CorsOriginConfig): string {
  if (typeof origin === 'string') {
    return JSON.stringify(origin);
  }
  if (Array.isArray(origin)) {
    return JSON.stringify(origin);
  }
  // Function type
  return origin.body;
}

const CORS_ALLOW =
  "allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowHeaders: ['Content-Type', 'Authorization'], credentials: true, maxAge: 86400";

// ─── Middleware rendering ───────────────────────────────────────

function renderMiddleware(b: CodeBuilder, mw: MiddlewareDecl): void {
  if (mw.comment) {
    b.push(`// ${mw.comment}`);
  }

  switch (mw.kind) {
    case 'requestId':
      b.push("app.use('*', requestId())");
      break;

    case 'logger':
      b.push("app.use('*', honoLogger())");
      break;

    case 'cors': {
      const corsOrigin = mw.config?.corsOrigin;
      if (corsOrigin !== undefined) {
        const originStr = renderCorsOrigin(corsOrigin);
        b.push(`app.use('*', cors({ origin: ${originStr}, ${CORS_ALLOW} }))`);
      } else {
        // v0.3.0: Tightened default — only allow localhost.
        // Production deployments MUST explicitly configure corsOrigin.
        // Returning '*' with credentials:true violates the Fetch spec.
        b.push("app.use('*', cors({ origin: (origin) => {");
        b.push(
          '  if (origin && /^https?:\\/\\/(localhost|127\\.0\\.0\\.1)(:\\d+)?$/.test(origin)) return origin',
        );
        b.push('  // In production, set middleware.corsOrigin explicitly');
        b.push('  return undefined');
        b.push(`}, ${CORS_ALLOW} }))`);
      }
      break;
    }

    case 'securityHeaders':
      b.push("app.use('*', secureHeaders())");
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
          b.push(
            `// CSP with auto-nonce: generates a per-request nonce and adds it to script tags`,
          );
          b.push(`app.use('*', async (c, next) => {`);
          b.push(`  const nonce = crypto.randomUUID().replace(/-/g, '')`);
          b.push(`  c.set('cspNonce', nonce)`);
          b.push(
            `  const policy = ${
              JSON.stringify(policyTemplate)
            }.replace('NONCE_PLACEHOLDER', nonce)`,
          );
          b.push(`  await next()`);
          b.push(`  c.header('${headerName}', policy)`);
          b.push(`})`);
        } else {
          b.push(`app.use('*', async (c, next) => {`);
          b.push(`  await next()`);
          b.push(`  c.header('${headerName}', ${JSON.stringify(cspConfig.policy)})`);
          b.push(`})`);
        }
      }
      break;
    }
  }

  b.blank();
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
function renderApiRoute(b: CodeBuilder, route: ApiRouteDecl): void {
  b.push(`// API: ${route.path} (${route.filePath})`);
  b.push(`app.route('${route.path}', ${route.varName}.default)`);
  b.blank();
}

// ─── Page route rendering ──────────────────────────────────────

function renderPageRoute(
  b: CodeBuilder,
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

  b.push(`// Page: ${route.path} (${route.filePath})`);
  b.push(`app.get('${route.path}', async (c) => {`);
  b.push(`  try {`);
  b.push(`    const tag = ${route.varName}.tagName || '${route.defaultTagName}'`);
  // v0.5.0: DSD renderer - no <!--lit-part--> markers, no old upgrade marker.
  // __ssr() uses renderDSD() which outputs standard DSD HTML.
  // Components receive route params as props for SSR-time data access.
  // v0.6: Pass route/source context for error visibility.
  b.push(
    `    const raw = await __ssr(tag, c.req.param(), { route: '${route.path}', source: '${route.filePath}' })`,
  );
  b.push(`    const html = raw`);
  b.blank();

  // Wrap with renderers from outer to inner (v0.3.0)
  // SSG mode: headExtras is read from .less/head-extras.html at runtime
  // to avoid embedding large strings (which can contain backticks, ${}, etc.)
  // into the generated code that Vite SSR evaluates via AsyncFunction.
  // Dev mode: headExtras is inlined via JSON.stringify (safe for dev server).
  const headExtrasExpr = isSSG ? '__headExtras' : JSON.stringify(docConfig.headExtras);

  if (matchingRenderers.length > 0) {
    b.push(`    // Renderer wrapping (outer → inner)`);
    b.push(`    let wrapped = html`);
    for (const renderer of matchingRenderers) {
      b.push(`    wrapped = ${renderer.varName}.default.wrap(wrapped, c)`);
    }
    b.push(`    return c.html(wrapInDocument(wrapped, {`);
    b.push(`      title: ${JSON.stringify(docConfig.title)},`);
    b.push(`      lang: ${JSON.stringify(docConfig.lang)},`);
    b.push(`      headExtras: ${headExtrasExpr},`);
    b.push(`      cspNonce: c.get('cspNonce'),`);
    b.push(`    }))`);
  } else {
    b.push(`    return c.html(wrapInDocument(html, {`);
    b.push(`      title: ${JSON.stringify(docConfig.title)},`);
    b.push(`      lang: ${JSON.stringify(docConfig.lang)},`);
    b.push(`      headExtras: ${headExtrasExpr},`);
    b.push(`      cspNonce: c.get('cspNonce'),`);
    b.push(`    }))`);
  }

  b.push(`  } catch (err) {`);
  // Use import.meta.env.PROD for runtime environment detection.
  // process.env.NODE_ENV was previously evaluated at code-generation time
  // (build machine), which meant CI without NODE_ENV=production would leak
  // stack traces in production.
  b.push(`    if (import.meta.env.PROD) {`);
  b.push(`      return c.html('<h1>500 Internal Server Error</h1>', 500)`);
  b.push(`    } else {`);
  b.push(
    `      const safeErr = String(err.stack || err).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')`,
  );
  b.push(`      return c.html('<h1>500</h1><pre>' + safeErr + '</pre>', 500)`);
  b.push(`    }`);
  b.push(`  }`);
  b.push(`})`);
  b.blank();
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
  const b = new CodeBuilder();

  // --- SSG: DSD renderer doesn't need DOM shim ---
  // v0.5.0: render-dsd.ts uses pure string concatenation — no DOM shim needed
  // The old @lit-labs/ssr DOM shim import has been removed.

  // --- Imports ---
  for (const imp of desc.imports) {
    b.push(renderImport(imp));
  }

  // --- Island lookup (build-time known list) ---
  // This map is used by the SSR helper to know which custom elements
  // to render. Client-side upgrade is handled by the client entry
  // that imports island modules separately in Phase 2.
  const islandLookup: Record<string, string> = {};
  for (const island of desc.islands) {
    islandLookup[island.tagName] = island.modulePath;
  }

  b.push(`// Known islands (determined at build time by scanning islandsDir)`);
  b.push(`const __islandMap = ${JSON.stringify(islandLookup)}`);
  b.blank();

  // --- Document wrapper ---
  // Uses wrapInDocument from ssr-handler.ts (single source of truth).
  // Import via the lightweight runtime export so SSR does not load the
  // Vite plugin or dev-server dependency graph.
  b.push(`import { log, wrapInDocument } from '@lessjs/core/less-runtime';`);
  b.blank();

  // --- Route module imports ---
  for (const route of [...desc.apiRoutes, ...desc.pageRoutes]) {
    b.push(`import * as ${route.varName} from '${route.importPath}'`);
  }
  // Import special file modules (v0.3.0)
  for (const renderer of desc.renderers) {
    b.push(`import * as ${renderer.varName} from '${renderer.importPath}'`);
  }
  for (const mwScope of desc.middlewareScopes) {
    b.push(`import * as ${mwScope.varName} from '${mwScope.importPath}'`);
  }
  b.blank();

  // --- SSG: Auto-install Lit adapter if available ---
  // With viteBuild(ssr:true, noExternal), @lessjs/adapter-lit is inlined
  // into the self-contained bundle. Installing it at module load time
  // ensures registerAdapter() runs before any renderDSD() call.
  // The try/catch makes this a no-op when @lessjs/adapter-lit is absent.
  if (desc.isSSG) {
    b.push('// SSG: auto-install Lit adapter (inlined in SSR bundle)');
    b.push('try {');
    b.push("  const { installLitAdapter } = await import('@lessjs/adapter-lit');");
    b.push('  installLitAdapter();');
    b.push('} catch { /* @lessjs/adapter-lit not available */ }');
    b.blank();
  }

  // --- Register page components in SSR customElements registry ---
  // This is essential for renderDSD() to find and render Shadow DOM.
  // Each SSR route module exports { default: ComponentClass, tagName: string }.
  for (const route of desc.pageRoutes) {
    b.push(`if (!customElements.get(${route.varName}.tagName || '${route.defaultTagName}')) {`);
    b.push(
      `  customElements.define(${route.varName}.tagName || '${route.defaultTagName}', ${route.varName}.default)`,
    );
    b.push(`}`);
  }
  b.blank();

  // --- Register island components in SSR customElements registry ---
  // Islands need to be registered so renderDSD() can produce DSD.
  // Uses a static import per island module (known at build time).
  // Package islands are imported by the client entry for browser upgrade.
  // SSR only imports local app islands, which avoids forcing Vite to resolve
  // package-manager-specific JSR specifiers in the server module runner.
  for (const island of desc.islands.filter((island) => !island.isPackage)) {
    const varName = `__island_${island.tagName.replace(/-/g, '_')}`;
    b.push(`import * as ${varName} from '${island.modulePath}'`);
  }
  const ssrIslands = desc.islands.filter((island) => !island.isPackage);
  if (ssrIslands.length > 0) {
    b.push(`const __less_get_default_export = (module) => module && module.default`);
  }
  for (const island of ssrIslands) {
    const varName = `__island_${island.tagName.replace(/-/g, '_')}`;
    const componentVar = `__island_component_${island.tagName.replace(/-/g, '_')}`;
    b.push(`const ${componentVar} = __less_get_default_export(${varName})`);
    b.push(`if (${componentVar} && !customElements.get('${island.tagName}')) {`);
    b.push(`  customElements.define('${island.tagName}', ${componentVar})`);
    b.push(`}`);
  }
  b.blank();

  // --- SSG: load headExtras from file instead of inlining ---
  // When headExtras is a large CSS/HTML string, inlining it via JSON.stringify
  // into the generated code breaks Vite SSR's AsyncFunction evaluator.
  // The string may contain backticks, ${}, or </script> which corrupt the
  // generated source. Instead, read from .less/head-extras.html at runtime.
  if (desc.isSSG && desc.document.headExtras) {
    b.push('// SSG: read headExtras from file to avoid Vite SSR AsyncFunction syntax errors');
    b.push('// (large inline strings with backticks/${} break new AsyncFunction())');
    b.push('import { readFileSync } from "node:fs";');
    b.push('import { join } from "node:path";');
    b.push('let __headExtras = "";');
    b.push('try {');
    b.push(
      '  __headExtras = readFileSync(join(process.cwd(), ".less", "head-extras.html"), "utf-8");',
    );
    b.push('} catch { /* headExtras file not found — use empty string */ }');
    b.blank();
  }

  // --- SSR helper (v0.5.0) ---
  // DSD renderer replaces Lit SSR + <!--lit-part--> markers.
  // Components must be registered via customElements.define() before SSR,
  // otherwise customElements.get() returns undefined.
  // Each component's render() returns a plain HTML string (no TemplateResult).
  // Output is standard DSD: <tag><template shadowrootmode="open">...</template></tag>
  // No old upgrade marker, no <!--lit-part-->, no client render ceremony needed.
  b.push('// SSR helper: render a registered custom element to DSD HTML');
  b.push('// Outputs standard DSD; no client render markers needed');
  b.push('async function __ssr(tag, props = {}, sourceInfo = {}) {');
  b.push('  // Validate tag name — must be a valid Custom Element (contains hyphen)');
  b.push('  if (!tag || !tag.includes("-")) {');
  b.push(
    '    throw new Error("[LessJS] Invalid custom element tag: " + String(tag) + ". Must contain a hyphen.")',
  );
  b.push('  }');
  b.push('  const Cls = customElements.get(tag)');
  b.push('  if (!Cls) {');
  b.push('    log.warn("<" + tag + "> not registered — rendering empty")');
  b.push('    return "<" + tag + "></" + tag + ">"');
  b.push('  }');
  b.push('  return renderDSD(tag, Cls, props, sourceInfo)');
  b.push('}');
  b.blank();

  // --- App creation + Middleware ---
  b.push('const app = new Hono()');
  b.blank();

  for (const mw of desc.middleware) {
    renderMiddleware(b, mw);
  }

  // --- Middleware scopes (v0.3.0: _middleware.ts files) ---
  for (const mwScope of desc.middlewareScopes) {
    b.push(`// Middleware scope: ${mwScope.scope} (${mwScope.importPath})`);
    b.push(
      `app.use('${mwScope.scope === '/' ? '' : mwScope.scope}/*', ${mwScope.varName}.default)`,
    );
    b.blank();
  }

  // --- API routes ---
  for (const route of desc.apiRoutes) {
    renderApiRoute(b, route);
  }

  // --- Page routes ---
  const docConfig = {
    title: desc.document.title,
    lang: desc.document.lang,
    headExtras: desc.document.headExtras,
  };
  for (const route of desc.pageRoutes) {
    renderPageRoute(b, route, desc.renderers, docConfig, desc.isSSG);
  }

  // --- Export ---
  b.push('export default app');

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
    b.blank();
    b.push('// ── SSG Utility Re-exports (ADR 0008 Phase C) ───────────────');
    b.push('// Used by build-ssg.ts after importing the SSR bundle.');
    b.push('// Shared module scope ensures adapter/data state is consistent.');
    b.blank();
    b.push('export { renderDSD, renderDSDByName } from "@lessjs/core/render-dsd"');
    b.push(
      'export { wrapInDocument, registerAdapter, getAdapter } from "@lessjs/core/less-runtime"',
    );
    b.push('export { installLitAdapter, uninstallLitAdapter } from "@lessjs/adapter-lit"');
    b.push(
      'export { initBlogData, getPosts, getPostBySlug, getBlogOptions } from "@lessjs/content"',
    );
    b.push('export { generateSitemap } from "@lessjs/content/sitemap"');
    b.push(
      'export { initI18nData, getI18nOptions, getI18nLocales, getDefaultLocale } from "@lessjs/i18n"',
    );
  }

  return b.toString();
}
