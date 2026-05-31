/**
 * @lessjs/core - Entry Renderer
 *
 * Pure function: EntryDescriptor -> string (virtual module code).
 *
 * LessJS Architecture (v0.5.0):
 * - API routes use Hono standard app.route() (not app.all + fetch transform)
 * - Island upgrade is handled by the client entry (built by Vite in Phase 2).
 *   No inline script in SSG HTML; the client entry is a Vite-built module
 *   referenced via <script type="module" src="..."> and imports island modules
 *   for side-effect custom element registration.
 * - HTML document wrapping delegates to wrapInDocument from html-escape.ts
 *   (imported at runtime - single source of truth, no duplicate HTML logic)
 * - DSD output must remain plain HTML, without Lit SSR marker comments.
 *
 * H-16 KNOWN ISSUE: Circular dependency between adapter-vite <-> content
 *   adapter-vite generates code that imports @lessjs/content/sitemap
 *   content package imports @lessjs/adapter-vite/build-context
 * Shared contracts now live in @lessjs/protocols. Generated optional package
 * imports are still emitted explicitly so consumer import maps can be checked.
 */

// ─── SSR Import Discovery Audit (Step1) ─────────────────────
// This file controls which islands become SSR imports:
//
// 1. Local island files:
//    - Imported at lines 406-419 (only if in ssrAdmissionPlan.renderableTags)
//    - Example: `import * as __island_counter from '/app/islands/counter.ts'`
//
// 2. Package manifest islands:
//    - NOT imported in this file (SSR entry)
//    - Package islands are registered client-side only
//    - See: `packages/adapter-vite/src/plugin.ts` for client entry generation
//
// 3. Nested custom elements (from rendered HTML):
//    - Handled by `renderDsd()` in core/src/render-dsd.ts
//    - Filtered by `ssrAdmissionPlan.clientOnlyTags`
//    - See: core/src/render-nested.ts for nested rendering guard
//
// Audit completed: 2026-05-17
// Auditor: AI agent (LessJS v0.17.4 SOP compliance check)
//
// ─────────────────────────────────────────────────────────────

import type {
  ApiRouteDecl,
  CorsOriginConfig,
  EntryDescriptor,
  ImportDecl,
  IslandDecl,
  MiddlewareDecl,
  PageRouteDecl,
  RendererDecl,
} from './entry-descriptor.js';
import type {
  FrameworkOptions,
  HydrationStrategy,
  LessPackageManifest,
  RouteEntry,
} from '@lessjs/core';
import { buildEntryDescriptor, buildSsrAdmissionPlan } from './entry-descriptor.js';

// Re-export for consumers that import from entry-renderer.ts
export { buildEntryDescriptor } from './entry-descriptor.js';
export type { EntryDescriptor } from './entry-descriptor.js';

// ─── Import rendering ──────────────────────────────────────────

function renderImport(imp: ImportDecl): string {
  const names = imp.alias ? `${imp.names[0]} as ${imp.alias}` : imp.names.join(', ');
  return `import { ${names} } from '${imp.from}'`;
}

function routeTagNameExpr(varName: string, fallback: string): string {
  void varName;
  return JSON.stringify(fallback);
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
      // v0.14.10: Reject '*' + credentials: true - browsers refuse this combo.
      if (corsOrigin === '*' || (Array.isArray(corsOrigin) && corsOrigin.includes('*'))) {
        throw new Error(
          'CORS misconfiguration: origin "*" with credentials: true is invalid. ' +
            'Specify explicit origin(s) or set credentials: false.',
        );
      }
      if (corsOrigin !== undefined) {
        const originStr = renderCorsOrigin(corsOrigin);
        lines.push(
          `app.use('*', cors({ origin: ${originStr}, ${CORS_ALLOW} }))`,
        );
      } else {
        // v0.3.0: Tightened default - only allow localhost.
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
              JSON.stringify(
                policyTemplate,
              )
            }.replace('NONCE_PLACEHOLDER', nonce)`,
          );
          lines.push(`  await next()`);
          lines.push(`  c.header('${headerName}', policy)`);
          lines.push(`})`);
        } else {
          lines.push(`app.use('*', async (c, next) => {`);
          lines.push(`  await next()`);
          lines.push(
            `  c.header('${headerName}', ${JSON.stringify(cspConfig.policy)})`,
          );
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
  lines.push(
    `if (${route.varName}.default && typeof ${route.varName}.default.fetch === 'function') {`,
  );
  lines.push(`  app.route('${route.path}', ${route.varName}.default)`);
  lines.push(`} else if (typeof ${route.varName}.default === 'function') {`);
  lines.push(`  app.all('${route.path}', async (c) => {`);
  lines.push(`    return await ${route.varName}.default({`);
  lines.push(`      request: c.req.raw,`);
  lines.push(`      params: c.req.param() || {},`);
  lines.push(`      env: c.env || {},`);
  lines.push(`      platform: c.executionCtx,`);
  lines.push(`    })`);
  lines.push(`  })`);
  lines.push(`} else {`);
  lines.push(
    `  throw new Error('API route ${route.path} must default-export a Hono app or a function (ctx) => Response')`,
  );
  lines.push(`}`);
  lines.push('');
}

// ─── Page route rendering ──────────────────────────────────────

function renderPageRoute(
  lines: string[],
  route: PageRouteDecl,
  renderers: RendererDecl[],
  docConfig: {
    title: string;
    lang: string;
    headExtras: string;
    allowHeadExtrasScripts: boolean;
  },
  isSSG: boolean,
): void {
  // Find renderers whose scope matches this route's path prefix
  const matchingRenderers = renderers.filter((r) => {
    if (r.scope === '/') return true;
    return route.path === r.scope || route.path.startsWith(r.scope + '/');
  });

  lines.push(`// Page: ${route.path} (${route.filePath})`);
  // H-02 fix: escape single quotes in route path (for paths like "/it's-a-test")
  const pathStr = route.path.replace(/'/g, "\\'");
  const tagNameExpr = routeTagNameExpr(route.varName, route.tagName);
  lines.push(`app.get('${pathStr}', async (c) => {`);
  lines.push(`  try {`);
  lines.push(`    const tag = ${tagNameExpr}`);
  // v0.5.0: DSD renderer - no <!--lit-part--> markers, no old upgrade marker.
  // __ssr() uses renderDsd() which outputs standard DSD HTML.
  // Components receive route params as props for SSR-time data access.
  // v0.6: Pass route/source context for error visibility.
  // H-02 fix: Use JSON.stringify to escape route path and file path
  lines.push(
    `    const raw = await __ssr(tag, c.req.param() || {}, { route: ${
      JSON.stringify(
        route.path,
      )
    }, source: ${JSON.stringify(route.filePath)} })`,
  );
  lines.push(`    const html = raw`);
  lines.push('');

  // Wrap with renderers from outer to inner (v0.3.0)
  // SSG mode: headExtras is injected via Vite define as __HEAD_EXTRAS__
  // (ADR 0008 Phase A: replaces the old .less/head-extras.html runtime file read).
  // Dev mode: headExtras is inlined via JSON.stringify (safe for dev server).
  const headExtrasExpr = isSSG ? '__headExtras' : JSON.stringify(docConfig.headExtras);

  lines.push(`    let content = html`);
  if (matchingRenderers.length > 0) {
    lines.push(`    // Renderer wrapping (outer -> inner)`);
    for (const renderer of matchingRenderers) {
      lines.push(`    content = ${renderer.varName}.default.wrap(content, c)`);
    }
  }
  lines.push(`    content = await __renderAppShell(content, c.req.path || ${JSON.stringify(route.path)})`);
  lines.push(`    return c.html(wrapInDocument(content, {`);
  lines.push(`      title: ${JSON.stringify(docConfig.title)},`);
  lines.push(`      lang: ${JSON.stringify(docConfig.lang)},`);
  lines.push(`      headExtras: ${headExtrasExpr},`);
  lines.push(
    `      allowHeadExtrasScripts: ${JSON.stringify(docConfig.allowHeadExtrasScripts)},`,
  );
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
  lines.push(
    `      return c.html('<h1>500</h1><pre>' + safeErr + '</pre>', 500)`,
  );
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(`})`);
  lines.push('');
}

// ─── Main renderer ─────────────────────────────────────────────

/**
 * Render an EntryDescriptor into a complete virtual module string.
 *
 * Pure function - deterministic, testable, side-effect-free.
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
  const ssrAdmissionPlan = buildSsrAdmissionPlan(
    desc.islands,
    desc.cemClassifications,
    desc.hubClientOnlyTags || [],
  );

  // --- SSG: DSD renderer doesn't need DOM shim ---
  // v0.5.0: render-dsd.ts uses pure string concatenation - no DOM shim needed
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

  lines.push(
    `// Known islands (determined at build time by scanning islandsDir)`,
  );
  lines.push(`const __islandMap = ${JSON.stringify(islandLookup)}`);
  lines.push('');

  // --- Document wrapper ---
  // ADR 0013: import directly from source files instead of less-runtime barrel.
  lines.push(`import { wrapInDocument } from '@lessjs/core';`);
  lines.push(`import { createLogger } from '@lessjs/core/logger';`);
  lines.push(`import '@lessjs/ui/less-layout';`);
  lines.push(
    `import { headerNav as __headerNav, navSections as __navSections } from '@lessjs/generated/nav';`,
  );
  lines.push(
    `import { getDefaultLocale as __getDefaultLocale, locales as __locales } from '@lessjs/generated/i18n';`,
  );
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

  // --- SSG: Auto-install all available adapters ---
  // v0.17.3: Multi-adapter support - install Lit, Vanilla, and React adapters.
  // With viteBuild(ssr:true, noExternal), adapters are inlined into the bundle.
  // Installing at module load time ensures registerAdapter() runs before any
  // renderDsd() call. Each try/catch makes missing adapters a no-op.
  // Both SSG and dev mode need adapters to render framework-specific results.
  {
    lines.push('// v0.17.3: Auto-install all available SSR adapters');
    lines.push('// Lit adapter - handles Lit TemplateResults');
    lines.push('try {');
    lines.push(
      "  const { installLitAdapter } = await import('@lessjs/adapter-lit');",
    );
    lines.push('  installLitAdapter();');
    lines.push('} catch { /* @lessjs/adapter-lit not available */ }');
    lines.push('');
    lines.push('// Vanilla adapter - handles string-based render()');
    lines.push('try {');
    lines.push(
      "  const { installVanillaAdapter } = await import('@lessjs/adapter-vanilla');",
    );
    lines.push('  installVanillaAdapter();');
    lines.push('} catch { /* @lessjs/adapter-vanilla not available */ }');
    lines.push('');
    lines.push('// React adapter - handles React elements');
    lines.push('try {');
    lines.push(
      "  const { installReactAdapter } = await import('@lessjs/adapter-react');",
    );
    lines.push('  installReactAdapter();');
    lines.push('} catch { /* @lessjs/adapter-react not available */ }');
    lines.push('');
  }

  // --- Register page components in SSR customElements registry ---
  // This is essential for renderDsd() to find and render Shadow DOM.
  // Each SSR route module exports { default: ComponentClass, tagName: string }.
  // ADR 0014: Patch customElements.define to be idempotent in SSR -
  // must apply in BOTH dev and SSG modes because island modules call
  // customElements.define() as a side-effect (guard try/catch), and
  // the SSR dom-shim throws on duplicate define() even with the same tag.
  {
    lines.push('// ADR 0014: Idempotent customElements.define for SSR (dev + SSG)');
    lines.push(
      '// Island modules call customElements.define() as a side-effect.',
    );
    lines.push(
      '// The SSR dom-shim does not make define() idempotent, so we patch it.',
    );
    lines.push(
      'const _origDefine = customElements.define.bind(customElements);',
    );
    lines.push('customElements.define = (name, ctor, options) => {');
    lines.push('  if (customElements.get(name)) return;');
    lines.push(
      '  try { _origDefine(name, ctor, options); } catch { /* already defined */ }',
    );
    lines.push('};');
    lines.push('');
  }
  for (const route of desc.pageRoutes) {
    const tagNameExpr = routeTagNameExpr(route.varName, route.tagName);
    lines.push(
      `if (!customElements.get(${tagNameExpr})) {`,
    );
    lines.push(
      `  customElements.define(${tagNameExpr}, ${route.varName}.default)`,
    );
    lines.push(`}`);
  }
  lines.push('');

  // --- Register island components in SSR customElements registry ---
  // Islands need to be registered so renderDsd() can produce DSD.
  // Uses a static import per island module (known at build time).
  // Package islands are imported by the client entry for browser upgrade.
  // SSR only imports local app islands, which avoids forcing Vite to resolve
  // package-manager-specific JSR specifiers in the server module runner.
  // v0.17.2: Islands with ssr === false are excluded from SSR registration;
  // they will still be imported by the client entry for browser-side upgrade
  // and render as empty custom element tags in SSR HTML.
  const ssrRenderableTags = new Set(ssrAdmissionPlan.renderableTags);
  const ssrIslands = desc.islands.filter((island) => ssrRenderableTags.has(island.tagName));
  for (const island of ssrIslands) {
    const varName = `__island_${island.tagName.replace(/-/g, '_')}`;
    lines.push(`import * as ${varName} from '${island.modulePath}'`);
  }
  for (const island of ssrIslands) {
    const varName = `__island_${island.tagName.replace(/-/g, '_')}`;
    const componentVar = `__island_component_${island.tagName.replace(/-/g, '_')}`;
    lines.push(`const ${componentVar} = ${varName}?.default`);
    lines.push(
      `if (${componentVar} && !customElements.get('${island.tagName}')) {`,
    );
    lines.push(`  customElements.define('${island.tagName}', ${componentVar})`);
    lines.push(`}`);
  }
  lines.push('');

  lines.push('// v0.17.4: SSR admission plan');
  lines.push(
    `(globalThis).__CLIENT_ONLY_TAGS__ = new Set(${
      JSON.stringify(ssrAdmissionPlan.clientOnlyTags)
    })`,
  );
  lines.push(
    `export const ssrAdmissionPlan = ${JSON.stringify(ssrAdmissionPlan, null, 2)};`,
  );
  lines.push('');

  // --- SSG: headExtras via define injection ---
  // ADR 0008 Phase A: Instead of reading .less/head-extras.html at runtime,
  // headExtras is injected via Vite's define option as __HEAD_EXTRAS__.
  // This eliminates the .less/head-extras.html temp file and avoids the
  // Vite SSR AsyncFunction syntax errors that large inline strings cause.
  // The build-ssg.ts SSR build config includes:
  //   define: { __HEAD_EXTRAS__: JSON.stringify(headExtras) }
  if (desc.isSSG && desc.document.headExtras) {
    lines.push(
      '// SSG: headExtras injected via Vite define (ADR 0008 Phase A)',
    );
    lines.push('// Replaces the old .less/head-extras.html runtime file read');
    lines.push('const __headExtras = __HEAD_EXTRAS__ || "";');
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
  lines.push(
    '  // Validate tag name - must be a valid Custom Element (contains hyphen)',
  );
  lines.push('  if (!tag || !tag.includes("-")) {');
  lines.push(
    '    throw new Error("[LessJS] Invalid custom element tag: " + String(tag) + ". Must contain a hyphen.")',
  );
  lines.push('  }');
  lines.push('  const Cls = customElements.get(tag)');
  lines.push('  if (!Cls) {');
  lines.push('    log.warn("<" + tag + "> not registered - rendering empty")');
  lines.push('    return "<" + tag + "></" + tag + ">"');
  lines.push('  }');
  lines.push('  const out = await renderDsd(tag, Cls, props, sourceInfo)');
  lines.push('  return out.html');
  lines.push('}');
  lines.push('');

  lines.push('function __layoutAttr(value) {');
  lines.push('  return escapeHtml(String(value));');
  lines.push('}');
  lines.push('');
  lines.push('function __layoutJsonAttr(value) {');
  lines.push('  return __layoutAttr(JSON.stringify(value));');
  lines.push('}');
  lines.push('');
  lines.push('function __localeFromPath(path, fallback) {');
  lines.push('  const first = String(path || "/").split("/").filter(Boolean)[0];');
  lines.push('  return __locales.includes(first) ? first : fallback;');
  lines.push('}');
  lines.push('');
  lines.push('async function __renderAppShell(content, routePath, options = {}) {');
  lines.push('  const defaultLocale = __getDefaultLocale();');
  lines.push('  const locale = options.locale || __localeFromPath(routePath, defaultLocale);');
  lines.push('  const isHome = routePath === "/";');
  lines.push('  const layoutResult = await renderDsdByName("less-layout", {');
  lines.push('    currentPath: routePath,');
  lines.push('    locale: locale,');
  lines.push('    locales: __locales,');
  lines.push('    navItems: __navSections,');
  lines.push('    headerNav: __headerNav,');
  lines.push('    home: isHome || undefined,');
  lines.push('  }, { route: routePath });');
  lines.push('  // Embed page content as light DOM inside less-layout (before closing tag).');
  lines.push('  // less-layout\'s <slot></slot> will project the light DOM children.');
  lines.push('  return layoutResult.html.replace("</less-layout>", content + "</less-layout>");');
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
    allowHeadExtrasScripts: desc.document.allowHeadExtrasScripts,
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
    lines.push(
      '// ── SSG Utility Re-exports (ADR 0008 Phase C) ───────────────',
    );
    lines.push('// Used by build-ssg.ts after importing the SSR bundle.');
    lines.push(
      '// Shared module scope ensures adapter/data state is consistent.',
    );
    lines.push('');
    lines.push(
      'export { renderDsd, renderDsdByName, wrapInDocument, registerAdapter, getAdapter } from "@lessjs/core"',
    );
    lines.push(
      'export { installLitAdapter, uninstallLitAdapter } from "@lessjs/adapter-lit"',
      'export { installVanillaAdapter, uninstallVanillaAdapter } from "@lessjs/adapter-vanilla"',
      'export { installReactAdapter, uninstallReactAdapter } from "@lessjs/adapter-react"',
    );
    lines.push(
      'export { posts, getPostBySlug, getBlogOptions } from "@lessjs/generated/blog-data"',
    );
    lines.push('export { generateSitemap } from "@lessjs/content/sitemap"');
    lines.push(
      'export { locales, getDefaultLocale, getI18nOptions } from "@lessjs/generated/i18n"',
    );

    // ── ADR 0014: renderRoute() - DSD-first rendering API ───────
    // The SSR bundle owns all rendering knowledge (tagName -> component
    // mapping, customElements registry, renderDsd, wrapInDocument).
    // build-ssg.ts only calls renderRoute() and getStaticPaths() -
    // no globalThis access, no source file regex, no direct renderDsd().
    lines.push('');
    lines.push(
      '// ── ADR 0014: DSD-first rendering API ──────────────────────',
    );
    lines.push(
      '// build-ssg.ts calls these - never touches customElements directly.',
    );
    lines.push('');

    // --- routeInfo: structured route metadata ---
    // Build routeInfo as runtime code (not JSON) because tagName needs
    // to be evaluated from the imported module variable.
    lines.push('export const routeInfo = [');
    for (const r of desc.pageRoutes) {
      const tagNameExpr = routeTagNameExpr(r.varName, r.tagName);
      lines.push(
        `  { path: '${r.path}', tagName: ${tagNameExpr}, isDynamic: ${!!r.isDynamic}, paramNames: ${
          JSON.stringify(
            r.paramNames || [],
          )
        }, revalidate: typeof ${r.varName}.revalidate === 'number' ? ${r.varName}.revalidate : undefined },`,
      );
    }
    lines.push('];');
    lines.push('');

    lines.push('function __rendererContext(routePath, params) {');
    lines.push('  return {');
    lines.push('    req: {');
    lines.push('      path: routePath,');
    lines.push('      param: (name) => name ? params[name] : params,');
    lines.push('    },');
    lines.push('    get: () => undefined,');
    lines.push('    set: () => undefined,');
    lines.push('  };');
    lines.push('}');
    lines.push('');
    lines.push('function __matchingRenderers(routePath) {');
    lines.push('  const renderers = [];');
    for (const renderer of desc.renderers) {
      if (renderer.scope === '/') {
        lines.push(`  renderers.push(${renderer.varName}.default);`);
      } else {
        // v0.14.6: Case-insensitive scope matching for routePath
        lines.push(
          `  if (routePath.toLowerCase() === '${renderer.scope.toLowerCase()}' || routePath.toLowerCase().startsWith('${renderer.scope.toLowerCase()}/')) renderers.push(${renderer.varName}.default);`,
        );
      }
    }
    lines.push('  return renderers;');
    lines.push('}');
    lines.push('');

    // --- renderRoute: path + options -> structured output ---
    lines.push('/**');
    lines.push(' * Render a route to structured output with diagnostics (ADR 0014, v0.15.3).');
    lines.push(
      ' * Returns { html, errors, hydrationHints, componentCount, renderTimeMs }.',
    );
    lines.push(
      ' * Caller can inspect errors/hints for observability or use .html for output.',
    );
    lines.push(' */');
    lines.push('export async function renderRoute(routePath, options = {}) {');
    lines.push('  const info = routeInfo.find(r => r.path === routePath);');
    lines.push(
      "  if (!info) throw new Error('[LessJS] renderRoute: route not found: ' + routePath);",
    );
    lines.push(
      '  const { params = {}, locale, title, lang, headExtras } = options;',
    );
    lines.push('  const props = { ...params };');
    lines.push('  if (locale) props.locale = locale;');
    lines.push(
      '  const dsdOutput = await renderDsdByName(info.tagName, props, { route: routePath, source: info.tagName });',
    );
    lines.push('  const html = dsdOutput.html;');
    lines.push('  let content = html;');
    lines.push('  for (const renderer of __matchingRenderers(routePath)) {');
    lines.push(
      '    content = await renderer.wrap(content, __rendererContext(routePath, params));',
    );
    lines.push('  }');
    lines.push('  content = await __renderAppShell(content, routePath, { locale });');
    lines.push('  const fullHtml = wrapInDocument(content, {');
    lines.push('    title: title || "LessJS",');
    lines.push('    lang: lang || locale || "en",');
    lines.push(
      '    headExtras: headExtras !== undefined ? headExtras : (typeof __headExtras !== "undefined" ? __headExtras : ""),',
    );
    lines.push(
      `    allowHeadExtrasScripts: ${JSON.stringify(desc.document.allowHeadExtrasScripts)},`,
    );
    lines.push('  });');
    lines.push('  return {');
    lines.push('    html: fullHtml,');
    lines.push('    errors: dsdOutput.errors,');
    lines.push('    hydrationHints: dsdOutput.hydrationHints,');
    lines.push('    componentCount: 1,');
    lines.push('    renderTimeMs: dsdOutput.metrics.renderTimeMs,');
    lines.push('  };');
    lines.push('}');
    lines.push('');

    // --- getStaticPaths: dynamic route -> params[] ---
    // Only dynamic routes have getStaticPaths(). The function body
    // dispatches to the appropriate route module's getStaticPaths().
    lines.push('/**');
    lines.push(' * Get static paths for a dynamic route (ADR 0014).');
    lines.push(' * Returns [] for non-dynamic routes.');
    lines.push(' */');
    lines.push('export async function getStaticPaths(routePath) {');
    lines.push('  const info = routeInfo.find(r => r.path === routePath);');
    lines.push('  if (!info || !info.isDynamic) return [];');
    const dynamicRoutes = desc.pageRoutes.filter((r) => r.isDynamic);
    if (dynamicRoutes.length > 0) {
      lines.push("  // Dispatch to the route module's getStaticPaths()");
      for (const r of dynamicRoutes) {
        // H-02 fix: escape single quotes in route path
        lines.push(`  if (routePath === '${r.path.replace(/'/g, "\\'")}') {`);
        lines.push(
          `    if (typeof ${r.varName}.getStaticPaths === 'function') {`,
        );
        lines.push(`      return await ${r.varName}.getStaticPaths();`);
        lines.push(`    }`);
        lines.push(`    return [];`);
        lines.push(`  }`);
      }
    }
    lines.push('  return [];');
    lines.push('}');
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
  islandMeta?: Record<string, Partial<IslandDecl>>;
  packageManifests?: LessPackageManifest[];
  /** @security Injected as raw HTML without sanitization */
  headExtras?: string;
  allowHeadExtrasScripts?: boolean;
  html?: { lang?: string; title?: string };
  upgradeStrategy?: HydrationStrategy;
  /** Hub registry client-only tag names (ADR-0035 A1) */
  hubClientOnlyTags?: string[];
}

/**
 * Generate the Hono entry module code from scanned routes.
 *
 * Internally:
 *  1. buildEntryDescriptor() - pure data transformation
 *  2. renderEntry()          - pure string rendering
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
