/**
 * @lessjs/hub - Playwright-based Snapshot Renderer
 *
 * v0.19.0 Phase 3: Renders Web Components to static HTML using a real
 * Chromium browser via Playwright. Replaces the fragile happy-dom simulation
 * approach (ADR-0032).
 *
 * Key insight: instead of SIMULATING a browser (happy-dom), we USE a real
 * browser to render the component, then capture the DOM output. This
 * eliminates an entire class of bugs (type incompatibilities, slot extraction
 * edge cases, adoptedStyleSheets, global pollution, :host replacement).
 *
 * @see ADR-0032
 */

// Demo configuration is centralized in demo-config.ts
// Import it directly where needed (e.g., scanner.ts imports DEMO_ATTRS, DEMO_SLOTS)

// ─── Types ───────────────────────────────────────────────────────────────

export interface PlaywrightRenderOptions {
  /** Package import specifier (e.g. '@shoelace-style/shoelace/dist/components/alert/alert.js') */
  importSpec: string;
  /** Custom element tag name */
  tagName: string;
  /** Demo attributes to set on the element */
  demoAttrs?: Record<string, string>;
  /** Demo slot content (innerHTML) */
  demoSlots?: string;
  /** Package theme CSS to inject */
  themeCss?: string;
  /** Timeout in ms (default 5000) */
  timeout?: number;
}

export interface PlaywrightBatchOptions {
  /** Array of render options, one per component */
  items: PlaywrightRenderOptions[];
  /** Whether to show progress (default true) */
  verbose?: boolean;
}

export interface PlaywrightRenderResult {
  html: string;
  success: boolean;
  error?: string;
}

// ─── Fixture HTML Generation ─────────────────────────────────────────────

/**
 * Convert a bare npm specifier to an esm.sh CDN URL.
 * This allows the browser to import the module without a local module resolver.
 *
 * For Shoelace, we import the full bundle to ensure all sub-components
 * (sl-button, sl-menu, etc.) are registered when used in demo slots.
 *
 * Examples:
 *   '@shoelace-style/shoelace/dist/components/alert/alert.js'
 *   -> 'https://esm.sh/@shoelace-style/shoelace@2.20.1'
 *
 *   'media-chrome/dist/media-controller.js'
 *   -> 'https://esm.sh/media-chrome@4.19.0'
 */
function toEsmUrl(importSpec: string): string {
  // Known package versions for consistent CDN resolution
  const VERSIONS: Record<string, string> = {
    '@shoelace-style/shoelace': '2.20.1',
    'media-chrome': '4.19.0',
  };

  for (const [pkg, version] of Object.entries(VERSIONS)) {
    if (importSpec.startsWith(pkg)) {
      // For Shoelace: import the full bundle to register all components
      // (demo slots may reference sub-components like sl-button, sl-menu, etc.)
      if (pkg === '@shoelace-style/shoelace') {
        return `https://esm.sh/@shoelace-style/shoelace@${version}`;
      }
      // For other packages: preserve subpath for tree-shaking
      const subpath = importSpec.slice(pkg.length);
      return `https://esm.sh/${pkg}@${version}${subpath}`;
    }
  }

  // Fallback: no version pinning
  return `https://esm.sh/${importSpec}`;
}

/**
 * Generate an inline HTML page that imports and renders a single component.
 * No file I/O - served from memory via temp HTTP server.
 *
 * Uses esm.sh CDN for module resolution in the browser.
 */
function generateFixtureHtml(options: PlaywrightRenderOptions): string {
  const { importSpec, tagName, demoAttrs, demoSlots, themeCss } = options;

  // Convert npm specifier to esm.sh CDN URL
  const esmUrl = toEsmUrl(importSpec);

  // Build attributes string
  const attrs = demoAttrs
    ? Object.entries(demoAttrs)
      .map(([k, v]) => v === '' ? k : `${k}="${escapeAttr(v)}"`)
      .join(' ')
    : '';

  // Build inner HTML (slot content)
  const innerHtml = demoSlots || '';

  // Build the component tag
  const componentTag = attrs
    ? `<${tagName} ${attrs}>${innerHtml}</${tagName}>`
    : `<${tagName}>${innerHtml}</${tagName}>`;

  // Theme CSS (e.g., Shoelace light.css variables)
  let themeStyle = themeCss || '';

  // Auto-inject Shoelace theme CSS so component variables resolve
  if (!themeStyle && importSpec.includes('@shoelace-style/shoelace')) {
    try {
      const cssPath =
        'node_modules/.deno/@shoelace-style+shoelace@2.20.1/node_modules/@shoelace-style/shoelace/dist/themes/light.css';
      themeStyle = Deno.readTextFileSync(cssPath);
    } catch { /* theme CSS not available - skip */ }
  }

  const themeBlock = themeStyle ? `<style>${themeStyle}</style>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script type="module">
    import '${esmUrl}';
  </script>
  ${themeBlock}
</head>
<body>
  ${componentTag}
</body>
</html>`;
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(
    />/g,
    '&gt;',
  );
}

// ─── Temp HTTP Server ────────────────────────────────────────────────────

interface TempServer {
  port: number;
  close: () => void;
  setFixture: (html: string) => void;
}

/**
 * Start a lightweight HTTP server to serve fixture pages.
 * The server serves a single fixture at a time; call setFixture() to change it.
 * Returns the port number and control functions.
 */
function startTempServer(initialHtml: string): Promise<TempServer> {
  return new Promise((resolve, reject) => {
    let currentFixture = initialHtml;
    const controller = new AbortController();

    const _server = Deno.serve({
      port: 0,
      signal: controller.signal,
      handler: (req) => {
        const url = new URL(req.url);

        // Serve the fixture page
        if (url.pathname === '/' || url.pathname === '/fixture') {
          return new Response(currentFixture, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }

        return new Response('Not found', { status: 404 });
      },
      onListen: ({ port }) => {
        resolve({
          port,
          close: () => controller.abort(),
          setFixture: (html: string) => {
            currentFixture = html;
          },
        });
      },
    });

    // Timeout if server doesn't start
    setTimeout(() => reject(new Error('Temp server failed to start')), 5000);
  });
}

// ─── Playwright Rendering ────────────────────────────────────────────────

/**
 * Render a single Web Component using Playwright + Chromium.
 *
 * Flow:
 * 1. Set fixture HTML on shared server
 * 2. Navigate Playwright page to fixture
 * 3. Wait for component to render
 * 4. Evaluate JS in browser to capture shadow DOM + slot assignments
 * 5. Post-process: sanitize, replace :host, wrap
 */
async function renderSingleComponent(
  // deno-lint-ignore no-explicit-any -- Playwright Browser type only available at runtime
  browser: any,
  server: TempServer,
  options: PlaywrightRenderOptions,
): Promise<PlaywrightRenderResult> {
  const { tagName, timeout = 5000 } = options;
  const fixtureHtml = generateFixtureHtml(options);
  server.setFixture(fixtureHtml);

  const page = await browser.newPage();
  try {
    // Navigate to fixture page (with cache-busting query to force reload)
    await page.goto(`http://127.0.0.1:${server.port}/fixture?t=${Date.now()}`, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    // Wait for the custom element to be defined and rendered
    await page.waitForFunction(
      (tag: string) => {
        const el = document.querySelector(tag);
        return el && el.shadowRoot;
      },
      tagName,
      { timeout },
    );

    // Additional settle time for async rendering (Lit microtasks, etc.)
    await page.waitForTimeout(200);

    // Capture shadow DOM content via page.evaluate()
    const captured = await page.evaluate((tag: string) => {
      const el = document.querySelector(tag);
      if (!el) return { error: `Element <${tag}> not found in DOM` };
      if (!el.shadowRoot) return { error: `Element <${tag}> has no shadowRoot` };

      // 1. Serialize adoptedStyleSheets -> <style> tags
      const styleSheets: string[] = [];
      try {
        for (const sheet of el.shadowRoot.adoptedStyleSheets) {
          const rules = Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
          if (rules) styleSheets.push(rules);
        }
      } catch { /* ignore - some sheets may not be readable */ }

      // 2. Get shadow DOM inner HTML
      const shadowHtml = el.shadowRoot.innerHTML;

      // 3. Get light DOM slot assignments
      const slotMap: Record<string, string> = {};
      for (const child of el.childNodes) {
        if (child.nodeType === 1) {
          // Element node - append to its assigned slot.
          // Insert a space between consecutive elements in the same slot
          // so inline siblings (e.g. <sl-tab>) don't render squished together.
          const slotName = (child as Element).getAttribute('slot') || 'default';
          const existing = slotMap[slotName] || '';
          const separator = existing ? ' ' : '';
          slotMap[slotName] = existing + separator + (child as Element).outerHTML;
        } else if (child.nodeType === 3) {
          // Text node - only non-empty text goes to the default slot.
          // Whitespace-only nodes are intentionally dropped to avoid polluting
          // named-slot content (they belong to the default slot per spec).
          const text = child.textContent?.trim();
          if (text) {
            const existing = slotMap['default'] || '';
            slotMap['default'] = existing + text;
          }
        }
      }

      return { shadowHtml, styleSheets, slotMap, error: null };
    }, tagName);

    if (captured.error) {
      return { html: '', success: false, error: captured.error };
    }

    // Post-process the captured HTML
    let shadowHtml = captured.shadowHtml as string;

    // Prepend adoptedStyleSheet content as <style> tags
    const styleSheets = captured.styleSheets as string[];
    if (styleSheets.length > 0) {
      const styleBlock = styleSheets.map((css) => `<style>${css}</style>`).join('\n');
      shadowHtml = styleBlock + '\n' + shadowHtml;
    }

    // Replace <slot> with fallback content from light DOM
    const slotMap = captured.slotMap as Record<string, string>;
    // 1. Named slots first - match <slot name="..."> regardless of other attrs
    shadowHtml = shadowHtml.replace(
      /<slot\b[^>]*?\sname\s*=\s*"([^"]*)"[^>]*><\/slot>/gi,
      (_m: string, name: string) => {
        const content = slotMap[name] || '';
        return `<SLOT-FALLBACK name="${name}">${content}</SLOT-FALLBACK>`;
      },
    );
    // 2. Default slots - any remaining <slot> without name= attribute
    shadowHtml = shadowHtml.replace(
      /<slot\b[^>]*><\/slot>/gi,
      (_m: string) => {
        const content = slotMap['default'] || '';
        return `<SLOT-FALLBACK>${content}</SLOT-FALLBACK>`;
      },
    );
    shadowHtml = shadowHtml.replace(/<SLOT-FALLBACK/g, '<slot').replace(
      /<\/SLOT-FALLBACK>/g,
      '</slot>',
    );

    // Replace :host selectors with tag name for out-of-shadow-DOM rendering
    shadowHtml = shadowHtml.replace(/:host\b/g, tagName);

    // Sanitize: strip scripts, event handlers, javascript: URLs
    shadowHtml = sanitizeSnapshot(shadowHtml);

    // Degrade <button> to <div> in shadowHtml to avoid nested-button
    // rendering issues when the WC library upgrades and re-creates shadow DOM.
    // The .button class styles are preserved so the static preview still looks right.
    shadowHtml = shadowHtml.replace(/<button\b/g, '<div').replace(/<\/button>/g, '</div>');

    // Wrap in snapshot container
    let themeCss = options.themeCss || '';
    // Auto-read Shoelace theme CSS so snapshot is self-contained
    if (!themeCss && options.importSpec.includes('@shoelace-style/shoelace')) {
      try {
        const cssPath =
          'node_modules/.deno/@shoelace-style+shoelace@2.20.1/node_modules/@shoelace-style/shoelace/dist/themes/light.css';
        themeCss = Deno.readTextFileSync(cssPath);
      } catch { /* theme CSS not available - skip */ }
    }
    const themeBlock = themeCss ? `<style>${themeCss}</style>` : '';

    // Build attributes + slot content so the snapshot tag mirrors the fixture.
    // This ensures the WC library sees correct light-DOM content after upgrade.
    const attrs = options.demoAttrs
      ? Object.entries(options.demoAttrs)
        .map(([k, v]) => v === '' ? k : `${k}="${escapeAttr(v)}"`)
        .join(' ')
      : '';
    const attrStr = attrs ? ` ${attrs}` : '';
    const slotContent = options.demoSlots || '';

    const html =
      `<div class="snapshot-preview">${themeBlock}<${tagName}${attrStr}>${slotContent}${shadowHtml}</${tagName}></div>`;

    return { html, success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { html: '', success: false, error: msg };
  } finally {
    await page.close();
  }
}

// ─── Batch Rendering ──────────────────────────────────────────────────────

/**
 * Render multiple components in a single Playwright browser instance.
 * Much faster than launching a browser per component.
 */
export async function renderBatchWithPlaywright(
  options: PlaywrightBatchOptions,
): Promise<Map<string, PlaywrightRenderResult>> {
  const { items, verbose = true } = options;
  const results = new Map<string, PlaywrightRenderResult>();

  if (items.length === 0) return results;

  // Import Playwright dynamically (dev-time dependency only)
  // deno-lint-ignore no-explicit-any -- Playwright types only available at runtime
  let playwright: any;
  try {
    playwright = await import('npm:playwright@^1.59.0');
  } catch {
    // Playwright not available - return placeholders for all items
    for (const item of items) {
      results.set(item.tagName, {
        html: renderPlaceholder(item.tagName, 'Playwright not available'),
        success: false,
        error: 'Playwright not available - snapshot is placeholder, not real render',
      });
    }
    return results;
  }

  const browser = await playwright.chromium.launch({ headless: true });
  let server: TempServer | undefined;
  try {
    // Start a shared HTTP server for all fixtures
    server = await startTempServer('<html><body>init</body></html>');

    for (const item of items) {
      if (verbose) {
        console.log(`  🎬 Rendering <${item.tagName}> via Playwright...`);
      }

      const result = await renderSingleComponent(browser, server, item);

      if (result.success && result.html) {
        results.set(item.tagName, result);
        if (verbose) {
          console.log(`  ✅ <${item.tagName}> snapshot captured (${result.html.length} chars)`);
        }
      } else {
        // Fallback to placeholder
        const placeholderHtml = renderPlaceholder(item.tagName, result.error);
        results.set(item.tagName, {
          html: placeholderHtml,
          success: false,
          error: result.error
            ? `Snapshot failed: ${result.error}`
            : 'Snapshot failed - placeholder, not real render',
        });
        if (verbose) {
          console.log(`  ⚠️  <${item.tagName}> snapshot failed: ${result.error}`);
        }
      }
    }
  } finally {
    server?.close();
    await browser.close();
  }

  return results;
}

// ─── Convenience: Render a Single Component ──────────────────────────────

/**
 * Render a single component using Playwright.
 * Launches a browser instance, renders the component, and closes the browser.
 */
export async function renderWithPlaywright(
  options: PlaywrightRenderOptions,
): Promise<PlaywrightRenderResult> {
  const results = await renderBatchWithPlaywright({
    items: [options],
    verbose: false,
  });
  return results.get(options.tagName) || {
    html: '',
    success: false,
    error: 'No result returned',
  };
}

// ─── Sanitizer ────────────────────────────────────────────────────────────

/**
 * Sanitize snapshot HTML: strip scripts, event handlers, and dangerous URLs.
 * This ensures that snapshot HTML rendered via `unsafeHTML` is safe.
 */
function sanitizeSnapshot(html: string): string {
  let result = html;

  // Strip <script> tags and content
  result = result.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Strip <iframe> tags
  result = result.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  result = result.replace(/<iframe[^>]*>/gi, '');

  // Strip on* event handler attributes
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  result = result.replace(/\s+on\w+\s*=\s*\S+/gi, '');

  // Strip javascript: URLs
  result = result.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  result = result.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');

  return result;
}

// ─── Placeholder ──────────────────────────────────────────────────────────

/**
 * Generate a placeholder snapshot for components that cannot be rendered.
 */
function renderPlaceholder(tagName: string, _reason?: string): string {
  return `<div class="snapshot-preview"><span style="display:inline-block;padding:0.75rem 1.25rem;border:1px dashed #d0d0d0;border-radius:6px;font-family:monospace;font-size:0.8125rem;color:#999;background:#fafafa;">${tagName}</span></div>`;
}
