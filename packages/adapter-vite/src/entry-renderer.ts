/**
 * @openelement/core - Entry Renderer
 *
 * Pure function: EntryDescriptor -> string (virtual module code).
 *
 * openElement Architecture (v0.5.0):
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
 *   adapter-vite generates code that imports @openelement/content/sitemap
 *   content package imports @openelement/adapter-vite/build-context
 * Shared contracts now live in @openelement/protocols. Generated optional package
 * imports are still emitted explicitly so consumer import maps can be checked.
 */

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
// 3. Nested custom elements (from the VNode tree):
//    - Handled by `renderDsdTree()` in core/src/jsx-render-string.ts
//    - Calls `renderDsd()` inline for registered custom element hosts
//    - Package islands remain client-side unless admitted into the SSR entry
//
// Audit completed: 2026-05-17
// Auditor: AI agent (openElement v0.17.4 SOP compliance check)
//

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
  OpenElementPackageManifest,
  RouteEntry,
} from '@openelement/core';
import { buildEntryDescriptor } from './entry-descriptor.js';

// Re-export for consumers that import from entry-renderer.ts
export { buildEntryDescriptor } from './entry-descriptor.js';
export type { EntryDescriptor } from './entry-descriptor.js';

function renderImport(imp: ImportDecl): string {
  const names = imp.alias ? `${imp.names[0]} as ${imp.alias}` : imp.names.join(', ');
  return `import { ${names} } from '${imp.from}'`;
}

function routeTagNameExpr(varName: string, fallback: string): string {
  void varName;
  return JSON.stringify(fallback);
}

function pageDefinitionExpr(varName: string): string {
  return `(${varName}.default?.openElementPage || {})`;
}

function routeMetaExpr(varName: string): string {
  const pageDef = pageDefinitionExpr(varName);
  return `({ ...(${varName}.meta || {}), ...(${pageDef}.meta || {}), ...(${pageDef}.layout !== undefined ? { layout: ${pageDef}.layout } : {}), ...(${pageDef}.title !== undefined ? { title: ${pageDef}.title } : {}), ...(${pageDef}.description !== undefined ? { description: ${pageDef}.description } : {}) })`;
}

function routeRevalidateExpr(varName: string): string {
  const pageDef = pageDefinitionExpr(varName);
  return `(${varName}.revalidate !== undefined ? ${varName}.revalidate : ${pageDef}.revalidate)`;
}

function renderCorsOrigin(origin: CorsOriginConfig): string {
  if (typeof origin === 'object' && !Array.isArray(origin)) return origin.body;
  return JSON.stringify(origin);
}

const CORS_ALLOW =
  "allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowHeaders: ['Content-Type', 'Authorization'], credentials: true, maxAge: 86400";

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
  const pageDefExpr = pageDefinitionExpr(route.varName);
  const routeMeta = routeMetaExpr(route.varName);
  const routeContext = `{ path: ${JSON.stringify(route.path)}, filePath: ${
    JSON.stringify(route.filePath)
  } }`;
  lines.push(`app.get('${pathStr}', async (c) => {`);
  lines.push(`  let __tag = ${tagNameExpr}`);
  lines.push(`  let __page = ${pageDefExpr}`);
  lines.push(`  let __params = {}`);
  lines.push(`  let __routeMeta = ${routeMeta}`);
  lines.push(`  const __routeContext = ${routeContext}`);
  lines.push(`  try {`);
  // v0.5.0: DSD renderer - no <!--lit-part--> markers, no old upgrade marker.
  // __ssr() uses renderDsd() which outputs standard DSD HTML.
  // Components receive route params as props for SSR-time data access.
  // v0.6: Pass route/source context for error visibility.
  // H-02 fix: Use JSON.stringify to escape route path and file path
  lines.push(`    __params = c.req.param() || {}`);
  lines.push(`    const __loadContext = {`);
  lines.push(`      params: __params,`);
  lines.push(`      request: c.req.raw,`);
  lines.push(`      env: c.env || {},`);
  lines.push(
    `      platform: (() => { try { return c.executionCtx } catch { return undefined } })(),`,
  );
  lines.push(`      route: __routeContext,`);
  lines.push(`    }`);
  lines.push(
    `    const __data = typeof __page.load === "function" ? await __page.load(__loadContext) : undefined`,
  );
  lines.push(
    `    let node = jsx(__tag, { ...__params, __openElementParams: __params, __openElementData: __data, __openElementRequest: c.req.raw, __openElementRoute: __routeContext, __openElementMeta: __routeMeta })`,
  );
  lines.push('');

  // Wrap with renderers from outer to inner (v0.3.0)
  // SSG mode: headExtras is injected via Vite define as __HEAD_EXTRAS__
  // (ADR 0008 Phase A: replaces the old .openElement/head-extras.html runtime file read).
  // Dev mode: headExtras is inlined via JSON.stringify (safe for dev server).
  const headExtrasExpr = isSSG ? '__headExtras' : JSON.stringify(docConfig.headExtras);

  if (matchingRenderers.length > 0) {
    lines.push(`    // Renderer tree wrapping (outer -> inner)`);
    for (const renderer of matchingRenderers) {
      lines.push(`    node = await ${renderer.varName}.default.wrap(node, c)`);
    }
  }
  lines.push(
    `    const content = await __renderAppShell(node, c.req.path || ${
      JSON.stringify(route.path)
    }, { routeMeta: __routeMeta })`,
  );
  lines.push(`    return c.html(wrapInDocument(content, {`);
  lines.push(`      title: __page.title || ${JSON.stringify(docConfig.title)},`);
  lines.push(`      lang: ${JSON.stringify(docConfig.lang)},`);
  lines.push(`      meta: { description: __page.description },`);
  lines.push(`      headExtras: ${headExtrasExpr},`);
  lines.push(
    `      allowHeadExtrasScripts: ${JSON.stringify(docConfig.allowHeadExtrasScripts)},`,
  );
  lines.push(`      cspNonce: c.get('cspNonce'),`);
  lines.push(`    }))`);

  lines.push(`  } catch (err) {`);
  lines.push(`    if (__isOpenElementRedirect(err)) {`);
  lines.push(`      return c.redirect(err.location, err.status)`);
  lines.push(`    }`);
  lines.push(`    if (__isOpenElementNotFound(err)) {`);
  lines.push(
    `      return c.html(wrapInDocument(__statusHtml("404 Not Found", err.message || "Not Found"), {`,
  );
  lines.push(`        title: "404 Not Found",`);
  lines.push(`        lang: ${JSON.stringify(docConfig.lang)},`);
  lines.push(`        headExtras: ${headExtrasExpr},`);
  lines.push(
    `        allowHeadExtrasScripts: ${JSON.stringify(docConfig.allowHeadExtrasScripts)},`,
  );
  lines.push(`        cspNonce: c.get('cspNonce'),`);
  lines.push(`      }), 404)`);
  lines.push(`    }`);
  lines.push(`    if (typeof __page.error === "function") {`);
  lines.push(`      try {`);
  lines.push(
    `        const errorNode = jsx(__tag, { ...__params, __openElementParams: __params, __openElementError: err, __openElementRequest: c.req.raw, __openElementRoute: __routeContext, __openElementMeta: __routeMeta })`,
  );
  lines.push(
    `        const errorContent = await __renderAppShell(errorNode, c.req.path || ${
      JSON.stringify(route.path)
    }, { routeMeta: __routeMeta })`,
  );
  lines.push(`        return c.html(wrapInDocument(errorContent, {`);
  lines.push(`          title: __page.title || ${JSON.stringify(docConfig.title)},`);
  lines.push(`          lang: ${JSON.stringify(docConfig.lang)},`);
  lines.push(`          meta: { description: __page.description },`);
  lines.push(`          headExtras: ${headExtrasExpr},`);
  lines.push(
    `          allowHeadExtrasScripts: ${JSON.stringify(docConfig.allowHeadExtrasScripts)},`,
  );
  lines.push(`          cspNonce: c.get('cspNonce'),`);
  lines.push(`        }), 500)`);
  lines.push(`      } catch (errorRenderFailure) {`);
  lines.push(
    `        console.error('[openElement] Route error renderer failed for ${pathStr}:', errorRenderFailure)`,
  );
  lines.push(`      }`);
  lines.push(`    }`);
  lines.push(
    `    console.error('[openElement] Route render failed for ${pathStr}:', err)`,
  );
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
  const ssrAdmissionPlan = desc.ssrAdmissionPlan;

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
  const appShellImports = new Set<string>();
  const collectShellImport = (shell: typeof desc.appShell.default) => {
    if (shell) appShellImports.add(shell.importPath);
  };
  collectShellImport(desc.appShell.default);
  for (const shell of Object.values(desc.appShell.layouts)) collectShellImport(shell);

  lines.push(
    `// Known islands (determined at build time by scanning islandsDir)`,
  );
  lines.push(`const __islandMap = ${JSON.stringify(islandLookup)}`);
  lines.push('');

  // --- Document wrapper ---
  // ADR 0013: import directly from source files instead of a runtime barrel.
  lines.push(`import { wrapInDocument } from '@openelement/core';`);
  lines.push(`import { jsx } from '@openelement/core/jsx-runtime';`);
  lines.push(`import { createLogger } from '@openelement/core/logger';`);
  lines.push(
    `import { headerNav as __headerNav, navSections as __navSections } from '@openelement/generated/nav';`,
  );
  lines.push(
    `import { getDefaultLocale as __getDefaultLocale, locales as __locales } from '@openelement/generated/i18n';`,
  );
  for (const importPath of appShellImports) {
    lines.push(`import '${importPath}';`);
  }
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
  // Installing at module load time ensures the default adapter registry is populated before any
  // renderDsd() call. Missing optional packages are fine; package/internal failures are logged.
  // Both SSG and dev mode need adapters to render framework-specific results.
  {
    lines.push('// v0.17.3: Auto-install all available SSR adapters');
    lines.push('function __isMissingOptionalAdapter(error, spec) {');
    lines.push('  const message = String(error?.message || error || "");');
    lines.push('  const code = error?.code;');
    lines.push(
      '  return (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND" || message.includes("Could not resolve") || message.includes("Cannot find")) && message.includes(spec);',
    );
    lines.push('}');
    lines.push('');
    lines.push('async function __installOptionalAdapter(spec, loader, exportName) {');
    lines.push('  try {');
    lines.push('    const mod = await loader();');
    lines.push('    const install = mod?.[exportName];');
    lines.push('    if (typeof install !== "function") {');
    lines.push(
      '      log.warn("[openElement] Optional SSR adapter " + spec + " does not export " + exportName);',
    );
    lines.push('      return;');
    lines.push('    }');
    lines.push('    install();');
    lines.push('  } catch (error) {');
    lines.push('    if (__isMissingOptionalAdapter(error, spec)) {');
    lines.push('      log.debug("[openElement] Optional SSR adapter not installed: " + spec);');
    lines.push('      return;');
    lines.push('    }');
    lines.push(
      '    log.warn("[openElement] Optional SSR adapter failed: " + spec + " - " + String(error?.stack || error?.message || error));',
    );
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push(
      "await __installOptionalAdapter('@openelement/adapter-lit/ssr', () => import('@openelement/adapter-lit/ssr'), 'installLitAdapter');",
    );
    lines.push(
      "await __installOptionalAdapter('@openelement/adapter-vanilla/ssr', () => import('@openelement/adapter-vanilla/ssr'), 'installVanillaAdapter');",
    );
    lines.push(
      "await __installOptionalAdapter('@openelement/adapter-react/ssr', () => import('@openelement/adapter-react/ssr'), 'installReactAdapter');",
    );
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
  // ADR 0008 Phase A: Instead of reading .openElement/head-extras.html at runtime,
  // headExtras is injected via Vite's define option as __HEAD_EXTRAS__.
  // This eliminates the .openElement/head-extras.html temp file and avoids the
  // Vite SSR AsyncFunction syntax errors that large inline strings cause.
  // The build-ssg.ts SSR build config includes:
  //   define: { __HEAD_EXTRAS__: JSON.stringify(headExtras) }
  if (desc.isSSG && desc.document.headExtras) {
    lines.push(
      '// SSG: headExtras injected via Vite define (ADR 0008 Phase A)',
    );
    lines.push('// Replaces the old .openElement/head-extras.html runtime file read');
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
    '    throw new Error("[openElement] Invalid custom element tag: " + String(tag) + ". Must contain a hyphen.")',
  );
  lines.push('  }');
  lines.push('  const Cls = customElements.get(tag)');
  lines.push('  if (!Cls) {');
  lines.push('    log.warn("<" + tag + "> not registered - rendering empty")');
  lines.push('    return "<" + tag + "></" + tag + ">"');
  lines.push('  }');
  lines.push('  const out = await renderDsd(tag, { componentClass: Cls, props, sourceInfo })');
  lines.push('  return out.html');
  lines.push('}');
  lines.push('');

  lines.push('function __localeFromPath(path, fallback) {');
  lines.push('  const first = String(path || "/").split("/").filter(Boolean)[0];');
  lines.push('  return __locales.includes(first) ? first : fallback;');
  lines.push('}');
  lines.push('');
  lines.push('function __isOpenElementRedirect(error) {');
  lines.push(
    '  return error && error.name === "OpenElementRedirect" && typeof error.location === "string" && typeof error.status === "number";',
  );
  lines.push('}');
  lines.push('');
  lines.push('function __isOpenElementNotFound(error) {');
  lines.push('  return error && error.name === "OpenElementNotFound" && error.status === 404;');
  lines.push('}');
  lines.push('');
  lines.push('function __statusHtml(title, message) {');
  lines.push(
    '  return "<main><h1>" + escapeHtml(String(title)) + "</h1><p>" + escapeHtml(String(message)) + "</p></main>";',
  );
  lines.push('}');
  lines.push('');
  lines.push(`const __appShellPlan = ${JSON.stringify(desc.appShell, null, 2)};`);
  lines.push('');
  lines.push('function __resolveAppShell(routeMeta = {}) {');
  lines.push(
    '  const layout = Object.prototype.hasOwnProperty.call(routeMeta, "layout") ? routeMeta.layout : undefined;',
  );
  lines.push('  if (layout === false) return false;');
  lines.push(
    '  if (typeof layout === "string") return __appShellPlan.layouts[layout] ?? __appShellPlan.default;',
  );
  lines.push('  return __appShellPlan.default;');
  lines.push('}');
  lines.push('');
  lines.push('async function __renderAppShell(routeNode, routePath, options = {}) {');
  lines.push('  const defaultLocale = __getDefaultLocale();');
  lines.push('  const locale = options.locale || __localeFromPath(routePath, defaultLocale);');
  lines.push('  const routeMeta = options.routeMeta || {};');
  lines.push('  const shell = __resolveAppShell(routeMeta);');
  lines.push('  const isHome = routePath === "/";');
  lines.push('  // routeNode may be a VNode (jsx output) or HTML string. Render VNodes.');
  lines.push('  const pageHtml = typeof routeNode === "object" && routeNode !== null');
  lines.push('    ? await renderDsdTree(routeNode)');
  lines.push('    : String(routeNode);');
  lines.push('  if (!shell) return pageHtml;');
  lines.push('  const layoutProps = {');
  lines.push('    currentPath: routePath,');
  lines.push('    locale,');
  lines.push('    locales: __locales,');
  lines.push('    navItems: __navSections,');
  lines.push('    headerNav: __headerNav,');
  lines.push('    home: isHome || undefined,');
  lines.push('    routeMeta,');
  lines.push('    ...(shell.props || {}),');
  lines.push('  };');
  lines.push('  const layoutResult = await renderDsd(shell.tagName, { props: layoutProps });');
  lines.push('  const closingTag = "</" + shell.tagName + ">";');
  lines.push('  const index = layoutResult.html.lastIndexOf(closingTag);');
  lines.push('  if (index === -1) return layoutResult.html + pageHtml;');
  lines.push(
    '  return layoutResult.html.slice(0, index) + pageHtml + layoutResult.html.slice(index);',
  );
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

  // ADR 0008 Phase C: After viteBuild(ssr:true, noExternal) produces a
  // self-contained ESM bundle, build-ssg.ts imports it and needs access
  // to these utility functions from the same module scope.
  //
  // Key: these re-exports share the SAME module-level variables as the
  // rest of the bundle (e.g., _adapter in types.ts, _posts in blog-data.ts).
  // This eliminates the globalThis[Symbol.for()] bridges from Phase B.
  //
  // Optional packages (@openelement/adapter-lit, @openelement/content, @openelement/i18n)
  // are resolved by the optionalPackageStubsPlugin in build-ssg.ts, which
  // provides empty stubs when the real package is not installed.
  if (desc.isSSG) {
    lines.push('');
    lines.push(
      '// - SSG Utility Re-exports (ADR 0008 Phase C) -',
    );
    lines.push('// Used by build-ssg.ts after importing the SSR bundle.');
    lines.push(
      '// Shared module scope ensures adapter/data state is consistent.',
    );
    lines.push('');
    lines.push(
      'export { getDefaultRegistry, renderDsd, renderDsdTree, wrapInDocument } from "@openelement/core"',
    );
    lines.push(
      'export { installLitAdapter, uninstallLitAdapter } from "@openelement/adapter-lit/ssr"',
      'export { installVanillaAdapter, uninstallVanillaAdapter } from "@openelement/adapter-vanilla/ssr"',
      'export { installReactAdapter, uninstallReactAdapter } from "@openelement/adapter-react/ssr"',
    );
    lines.push(
      'export { posts, getPostBySlug, getBlogOptions } from "@openelement/generated/blog-data"',
    );
    lines.push('export { generateSitemap } from "@openelement/content/sitemap"');
    lines.push(
      'export { locales, getDefaultLocale, getI18nOptions } from "@openelement/generated/i18n"',
    );

    // The SSR bundle owns all rendering knowledge (tagName -> component
    // mapping, customElements registry, renderDsd, wrapInDocument).
    // build-ssg.ts only calls renderRoute() and getStaticPaths() -
    // no globalThis access, no source file regex, no direct renderDsd().
    lines.push('');
    lines.push(
      '// - ADR 0014: DSD-first rendering API -',
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
        `  { path: '${r.path}', filePath: ${
          JSON.stringify(r.filePath)
        }, tagName: ${tagNameExpr}, module: ${r.varName}, isDynamic: ${!!r
          .isDynamic}, paramNames: ${
          JSON.stringify(
            r.paramNames || [],
          )
        }, revalidate: ${
          routeRevalidateExpr(r.varName)
        }, rendering: (__pageDefinition(${r.varName}).rendering || "auto"), streaming: (__pageDefinition(${r.varName}).streaming || "auto") },`,
      );
    }
    lines.push('];');
    lines.push('');

    lines.push('function __pageDefinition(module) {');
    lines.push('  return module?.default?.openElementPage || {};');
    lines.push('}');
    lines.push('');
    lines.push('function __routeMeta(module) {');
    lines.push('  const page = __pageDefinition(module);');
    lines.push('  return {');
    lines.push('    ...(module?.meta || {}),');
    lines.push('    ...(page.meta || {}),');
    lines.push('    ...(page.layout !== undefined ? { layout: page.layout } : {}),');
    lines.push('    ...(page.title !== undefined ? { title: page.title } : {}),');
    lines.push('    ...(page.description !== undefined ? { description: page.description } : {}),');
    lines.push('  };');
    lines.push('}');
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
      "  if (!info) throw new Error('[openElement] renderRoute: route not found: ' + routePath);",
    );
    lines.push(
      '  const { params = {}, locale, title, lang, headExtras } = options;',
    );
    lines.push('  const page = __pageDefinition(info.module);');
    lines.push('  const routeMeta = __routeMeta(info.module);');
    lines.push('  const loadContext = {');
    lines.push('    params,');
    lines.push('    request: options.request,');
    lines.push('    env: options.env || {},');
    lines.push('    platform: options.platform,');
    lines.push('    route: { path: routePath, filePath: info.filePath },');
    lines.push('  };');
    lines.push('  let data;');
    lines.push('  try {');
    lines.push(
      '    data = typeof page.load === "function" ? await page.load(loadContext) : undefined;',
    );
    lines.push('  } catch (error) {');
    lines.push('    if (__isOpenElementRedirect(error)) {');
    lines.push(
      '      const html = wrapInDocument(__statusHtml("Redirect", "Redirecting to " + error.location), {',
    );
    lines.push('        title: "Redirect",');
    lines.push('        lang: lang || locale || "en",');
    lines.push(
      '        headExtras: headExtras !== undefined ? headExtras : (typeof __headExtras !== "undefined" ? __headExtras : ""),',
    );
    lines.push(
      `        allowHeadExtrasScripts: ${JSON.stringify(desc.document.allowHeadExtrasScripts)},`,
    );
    lines.push('      });');
    lines.push(
      '      return { html, status: error.status, redirect: { location: error.location, status: error.status }, errors: [], hydrationHints: [], componentCount: 0, renderTimeMs: 0 };',
    );
    lines.push('    }');
    lines.push('    if (__isOpenElementNotFound(error)) {');
    lines.push(
      '      const html = wrapInDocument(__statusHtml("404 Not Found", error.message || "Not Found"), {',
    );
    lines.push('        title: "404 Not Found",');
    lines.push('        lang: lang || locale || "en",');
    lines.push(
      '        headExtras: headExtras !== undefined ? headExtras : (typeof __headExtras !== "undefined" ? __headExtras : ""),',
    );
    lines.push(
      `        allowHeadExtrasScripts: ${JSON.stringify(desc.document.allowHeadExtrasScripts)},`,
    );
    lines.push('      });');
    lines.push(
      '      return { html, status: 404, notFound: true, errors: [], hydrationHints: [], componentCount: 0, renderTimeMs: 0 };',
    );
    lines.push('    }');
    lines.push('    throw error;');
    lines.push('  }');
    lines.push(
      '  const props = { ...params, __openElementParams: params, __openElementData: data, __openElementRequest: options.request, __openElementRoute: loadContext.route, __openElementMeta: routeMeta };',
    );
    lines.push('  if (locale) props.locale = locale;');
    lines.push('  const startTime = typeof performance !== "undefined" ? performance.now() : 0;');
    lines.push('  let node = jsx(info.tagName, props);');
    lines.push('  for (const renderer of __matchingRenderers(routePath)) {');
    lines.push(
      '    node = await renderer.wrap(node, __rendererContext(routePath, params));',
    );
    lines.push('  }');
    lines.push('  const content = await __renderAppShell(node, routePath, { locale, routeMeta });');
    lines.push(
      '  const renderTimeMs = typeof performance !== "undefined" ? performance.now() - startTime : 0;',
    );
    lines.push(
      '  const componentCount = (content.match(/<template shadowrootmode="open"/g) || []).length;',
    );
    lines.push('  const fullHtml = wrapInDocument(content, {');
    lines.push('    title: title || page.title || "openElement",');
    lines.push('    lang: lang || locale || "en",');
    lines.push('    meta: { description: page.description },');
    lines.push(
      '    headExtras: headExtras !== undefined ? headExtras : (typeof __headExtras !== "undefined" ? __headExtras : ""),',
    );
    lines.push(
      `    allowHeadExtrasScripts: ${JSON.stringify(desc.document.allowHeadExtrasScripts)},`,
    );
    lines.push('  });');
    lines.push('  return {');
    lines.push('    html: fullHtml,');
    lines.push('    errors: [],');
    lines.push('    hydrationHints: [],');
    lines.push('    componentCount,');
    lines.push('    renderTimeMs,');
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
  packageManifests?: OpenElementPackageManifest[];
  /** @security Injected as raw HTML without sanitization */
  headExtras?: string;
  allowHeadExtrasScripts?: boolean;
  html?: { lang?: string; title?: string };
  upgradeStrategy?: HydrationStrategy;
  /** Hub registry client-only tag names (ADR-0035 A1) */
  hubClientOnlyTags?: string[];
  appShell?: FrameworkOptions['appShell'];
  layouts?: FrameworkOptions['layouts'];
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
