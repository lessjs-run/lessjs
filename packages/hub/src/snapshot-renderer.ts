/**
 * @lessjs/hub — Snapshot Renderer
 *
 * v0.19.0 Phase 2: Renders Lit components to static HTML for Hub previews.
 *
 * Uses @lit-labs/ssr-dom-shim for minimal DOM environment and the framework's
 * own renderLitToString to convert Lit TemplateResult to HTML string.
 *
 * For client-only components: generates a simple placeholder.
 *
 * @see ADR-0031
 */

// ─── Types ───────────────────────────────────────────────────────────────

export interface SnapshotRenderResult {
  html: string;
  success: boolean;
  error?: string;
}

function warn(msg: string) {
  try {
    console.warn('[hub:snapshot]', msg);
  } catch {
    // ignore
  }
}

// ─── SSR Snapshot Renderer ───────────────────────────────────────────────

/**
 * Render a Lit-based Web Component to a static HTML snapshot.
 *
 * Strategy:
 * 1. Set up @lit-labs/ssr-dom-shim globals so the Lit module can import
 *    and define its custom element using shimmed HTMLElement
 * 2. Import the component module
 * 3. Create an instance and trigger render cycle
 * 4. Use renderLitToString to convert TemplateResult to HTML
 * 5. Wrap in tag name and return
 *
 * @param modUrl - file:// URL to the component module
 * @param tagName - Custom element tag name
 */
export async function renderSnapshotLit(
  modUrl: string,
  tagName: string,
): Promise<SnapshotRenderResult> {
  // Step 1: Set up DOM shim globals before module import
  let domShim: typeof import('@lit-labs/ssr-dom-shim') | null = null;
  try {
    domShim = await import('@lit-labs/ssr-dom-shim');
  } catch {
    return renderPlaceholder(tagName, '@lit-labs/ssr-dom-shim not available');
  }

  const origHTMLElement = globalThis.HTMLElement;
  const origCustomElements = (globalThis as any).customElements;

  try {
    // Patch globals with DOM shim
    (globalThis as any).HTMLElement = domShim.HTMLElement;
    (globalThis as any).customElements = domShim.customElements;

    // Step 2: Import the component module
    const mod = await import(modUrl);

    // Step 3: Find the component class
    let ComponentClass: CustomElementConstructor | null = null;

    // Try default export
    if (typeof mod.default === 'function') {
      ComponentClass = mod.default;
    }

    // Try registered element (some modules call customElements.define internally)
    if (!ComponentClass) {
      try {
        const ce = (globalThis as any).customElements;
        if (ce?.get) {
          ComponentClass = ce.get(tagName);
        }
      } catch {
        // ignore
      }
    }

    // Try named export matching the tag
    if (!ComponentClass) {
      const exportName = tagName.replace(/-/g, '_');
      if (typeof mod[exportName] === 'function') {
        ComponentClass = mod[exportName];
      }
    }

    if (!ComponentClass) {
      throw new Error(`No component class found for <${tagName}>`);
    }

    // Step 4: Create instance and get TemplateResult
    const instance = new ComponentClass() as any;

    // Call render() to get the Lit TemplateResult
    // In Lit SSR context, render() returns a TemplateResult that
    // renderLitToString can serialize to HTML.
    let templateResult: unknown;
    try {
      templateResult = instance.render();
    } catch (renderErr) {
      throw new Error(
        `render() failed: ${renderErr instanceof Error ? renderErr.message : String(renderErr)}`,
      );
    }

    if (!templateResult) {
      throw new Error('render() returned nothing (null/undefined)');
    }

    // Step 5: Convert to HTML string using renderLitToString
    // This is in @lessjs/adapter-lit/ssr — no extra deps
    let htmlString: string;
    try {
      // Try adapter-lit SSR renderer first
      const adapterLit = await import('../adapter-lit/ssr.ts');
      if (typeof adapterLit.renderLitToString === 'function') {
        htmlString = adapterLit.renderLitToString(templateResult, tagName);
      } else {
        // Fallback: use Lit's renderToString if available
        throw new Error('renderLitToString not found');
      }
    } catch {
      // Fallback: manual TemplateResult serialization
      htmlString = templateResultToString(templateResult, tagName);
    }

    // Wrap in tag for display
    const html = `<${tagName}>${htmlString}</${tagName}>`;

    return { html, success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return renderPlaceholder(tagName, msg);
  } finally {
    // Restore globals
    (globalThis as any).HTMLElement = origHTMLElement;
    (globalThis as any).customElements = origCustomElements;
  }
}

// ─── Fallback: Manual TemplateResult Serialization ─────────────────────

/**
 * Convert a Lit TemplateResult to HTML string without renderLitToString.
 * This is a minimal implementation for snapshot purposes.
 */
function templateResultToString(result: unknown, tagName: string): string {
  if (!result || typeof result !== 'object') {
    return '';
  }

  const r = result as Record<string, unknown>;
  const strings = r.strings as string[] | undefined;
  const values = r.values as unknown[] | undefined;

  if (!strings || !values) {
    return String(result);
  }

  // Interleave: strings[0] + values[0] + strings[1] + values[1] + ...
  let output = '';
  for (let i = 0; i < values.length; i++) {
    output += strings[i];
    const val = values[i];
    if (val === null || val === undefined) {
      continue;
    }
    if (typeof val === 'string') {
      output += htmlEscape(val);
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      output += String(val);
    } else if (isLitTemplateResult(val)) {
      output += templateResultToString(val, tagName);
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (item === null || item === undefined) continue;
        if (typeof item === 'string') {
          output += htmlEscape(item);
        } else if (isLitTemplateResult(item)) {
          output += templateResultToString(item, tagName);
        } else if (item && typeof item === 'object' && 'strings' in (item as any)) {
          output += templateResultToString(item, tagName);
        } else {
          output += htmlEscape(String(item));
        }
      }
    } else if (val && typeof val === 'object' && 'strings' in (val as any)) {
      output += templateResultToString(val, tagName);
    } else {
      output += htmlEscape(String(val));
    }
  }
  output += strings[strings.length - 1] || '';

  return output;
}

const LIT_TEMPLATE_TYPE_MARKER = '_$litType$';

function isLitTemplateResult(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    LIT_TEMPLATE_TYPE_MARKER in (value as Record<string, unknown>)
  );
}

function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Client-Only Placeholder ─────────────────────────────────────────────

/**
 * Generate a placeholder snapshot for client-only components.
 */
function renderPlaceholder(tagName: string, reason?: string): SnapshotRenderResult {
  const html = `<${tagName} class="client-only-placeholder" style="display:inline-block;padding:0.75rem 1.25rem;border:1px dashed #d0d0d0;border-radius:6px;font-family:monospace;font-size:0.8125rem;color:#999;background:#fafafa;">${tagName}</${tagName}>`;
  return { html, success: true };
}

// ─── Public helpers ──────────────────────────────────────────────────────

/**
 * Render a snapshot for display. Determines the approach based on ssrCapable flag.
 */
export async function renderComponentSnapshot(
  _tagName: string,
  _modulePath?: string,
  _ssrCapable?: boolean,
): Promise<SnapshotRenderResult> {
  // Deprecated — use renderSnapshotLit directly for SSR-capable components
  return renderPlaceholder(_tagName, 'Use renderSnapshotLit for SSR render');
}

/**
 * Format a snapshot HTML for embedding in an SSG page.
 */
export function formatSnapshotForDisplay(html: string): string {
  return html.trim();
}
