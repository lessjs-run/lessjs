/**
 * @lessjs/hub - Snapshot Renderer
 *
 * v0.19.0 Phase 2: Renders Lit components / Web Components to static HTML
 * for Hub previews. Supports three strategies:
 *
 * 1. @lit-labs/ssr-dom-shim: for SSR-capable Lit components (@lessjs/ui)
 * 2. Happy DOM: for browser-dependent npm packages (Shoelace, Media Chrome)
 * 3. Placeholder: fallback when rendering fails
 *
 * @see ADR-0031
 */

import { escapeHtml } from '@lessjs/core';
import { renderSnapshotPlaceholderHtml } from './snapshot-placeholder.ts';

// ─── Types ───────────────────────────────────────────────────────────────

export interface SnapshotRenderResult {
  html: string;
  success: boolean;
  error?: string;
}

function _warn(msg: string) {
  try {
    console.warn('[hub:snapshot]', msg);
  } catch {
    // ignore
  }
}

// ─── SSR Snapshot Renderer (@lit-labs/ssr-dom-shim) ──────────────────────

/**
 * Render a Lit-based Web Component to a static HTML snapshot using
 * @lit-labs/ssr-dom-shim for the DOM environment.
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
    return {
      html: renderSnapshotPlaceholderHtml(tagName),
      success: true,
      error: '@lit-labs/ssr-dom-shim not available',
    };
  }

  const origHTMLElement = globalThis.HTMLElement;
  const origCustomElements = (globalThis as Record<string, unknown>).customElements;

  try {
    // Patch globals with DOM shim
    const g = globalThis as Record<string, unknown>;
    g.HTMLElement = domShim.HTMLElement;
    g.customElements = domShim.customElements;

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
        const ce = globalThis.customElements;
        if (ce && 'get' in ce) {
          ComponentClass = (ce as CustomElementRegistry).get(tagName) ?? null;
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
    const instance = new ComponentClass() as HTMLElement & { render(): unknown };

    // Call render() to get the Lit TemplateResult
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
    let htmlString: string;
    try {
      // Try adapter-lit SSR renderer first
      const adapterLit = await import('../../adapter-lit/src/ssr.ts');
      if (typeof adapterLit.renderLitToString === 'function') {
        htmlString = adapterLit.renderLitToString(templateResult, tagName);
      } else {
        throw new Error('renderLitToString not found');
      }
    } catch {
      // Fallback: manual TemplateResult serialization
      htmlString = templateResultToString(templateResult, tagName);
    }

    // Strip DSD template wrapper
    const innerHtml = stripDsdTemplate(htmlString);

    const html = `<div class="snapshot-preview">${innerHtml}</div>`;

    return { html, success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { html: renderSnapshotPlaceholderHtml(tagName), success: true, error: msg };
  } finally {
    // Restore globals
    const g = globalThis as Record<string, unknown>;
    g.HTMLElement = origHTMLElement;
    g.customElements = origCustomElements;
  }
}

// ─── Manual TemplateResult Serialization (Fallback) ─────────────────────

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
      output += escapeHtml(val);
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      output += String(val);
    } else if (isLitTemplateResult(val)) {
      output += templateResultToString(val, tagName);
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (item === null || item === undefined) continue;
        if (typeof item === 'string') {
          output += escapeHtml(item);
        } else if (isLitTemplateResult(item)) {
          output += templateResultToString(item, tagName);
        } else if (
          item && typeof item === 'object' && 'strings' in (item as Record<string, unknown>)
        ) {
          output += templateResultToString(item, tagName);
        } else {
          output += escapeHtml(String(item));
        }
      }
    } else if (val && typeof val === 'object' && 'strings' in (val as Record<string, unknown>)) {
      output += templateResultToString(val, tagName);
    } else {
      output += escapeHtml(String(val));
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

// ─── Placeholder ─────────────────────────────────────────────────────────

// ─── Public helpers ──────────────────────────────────────────────────────

/**
 * Format a snapshot HTML for embedding in an SSG page.
 */
export function formatSnapshotForDisplay(html: string): string {
  return html.trim();
}

/**
 * Strip DSD template wrapper from Lit SSR output.
 *
 * Lit SSR produces: <tag><template shadowrootmode="open">...content...</template></tag>
 * For snapshot previews, we only want the inner rendered HTML without DSD syntax.
 */
function stripDsdTemplate(html: string): string {
  let result = html.replace(/<template\s+shadowrootmode[^>]*>/gi, '');
  result = result.replace(/<\/template>/gi, '');

  // Strip <style> blocks (they pollute the preview with host styles)
  result = result.replace(/<style>[\s\S]*?<\/style>/gi, '');

  // Strip duplicate wrapping tag names
  const tagMatch = html.match(/^<([a-z][a-z0-9-]*)>/i);
  if (tagMatch) {
    const tagName = tagMatch[1];
    const closeTag = `</${tagName}>`;
    result = result.replace(new RegExp(`^<${tagName}[^>]*>`, 'i'), '');
    result = result.replace(new RegExp(escapeRegex(closeTag) + '$'), '');
  }

  return result.trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
