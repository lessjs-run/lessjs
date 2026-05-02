/**
 * @kissjs/core - DSD Renderer
 *
 * Pure string-based Declarative Shadow DOM SSR renderer.
 * Replaces @lit-labs/ssr — outputs standard DSD without <!--lit-part--> markers.
 *
 * KISS Architecture (v0.5.0):
 * - Takes a registered Custom Element class + props → DSD HTML string
 * - No Lit dependency, no TemplateResult, no hydration markers
 * - Components implement render(): string (pure function from state → HTML)
 * - Rendering is synchronous string concatenation — no DOM shim needed
 *
 * SSR Lifecycle:
 *   1. Instantiate component class (new Class())
 *   2. Set attributes/properties from props
 *   3. Call render() to get Shadow DOM HTML string
 *   4. Wrap in <template shadowrootmode="open">
 *   5. Recurse for nested custom elements (optional, Phase 2)
 *
 * Client Lifecycle (no hydration needed):
 *   1. Browser parses DSD → attaches Shadow DOM automatically
 *   2. customElements.define() upgrades existing elements
 *   3. connectedCallback fires — add event listeners to existing DOM
 *   4. No duplicate rendering, no hydrate() call needed
 *
 * @module @kissjs/core/render-dsd
 */

// ─── HTML Escaping ───────────────────────────────────────────────

/** Escape text content for safe HTML insertion */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape an HTML attribute value */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape a string for use as an attribute value (double-quoted) */
export function escapeAttrValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return escapeAttr(String(value));
}

// ─── DSD Rendering ──────────────────────────────────────────────

/**
 * Render a Lit TemplateResult to HTML string using @lit-labs/ssr.
 * LitElement's render() returns a TemplateResult (not a plain string).
 * We dynamically import @lit-labs/ssr to render it.
 * Falls back to String() if @lit-labs/ssr is not available.
 */
async function renderLitTemplateResult(
  result: unknown,
  tagName: string,
): Promise<string> {
  try {
    // Dynamic import — works when @lit-labs/ssr is installed (npm install)
    const { render: litRender } = await import('@lit-labs/ssr');
    const { collectResult } = await import('@lit-labs/ssr/lib/render-result.js');
    const rendered = litRender(result);
    const collected = await collectResult(rendered);
    return collected as string;
  } catch {
    // @lit-labs/ssr not available — fall back to String()
    console.warn(
      `[KISS] <${tagName}> returned a Lit TemplateResult but @lit-labs/ssr is not available. Falling back to String().`,
    );
    return String(result);
  }
}

/** Serialize key-value strings to HTML attribute string */
export function serializeAttributes(props: Record<string, string | boolean | undefined>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(props)) {
    if (val === false || val === null || val === undefined) continue;
    if (val === true) {
      parts.push(key);
    } else {
      parts.push(`${key}="${escapeAttrValue(val)}"`);
    }
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

/**
 * Interface that components must implement to be DSD-renderable.
 * Works with any Custom Element class that has render() and connectedCallback().
 */
export interface DsdComponent {
  /** Return Shadow DOM inner HTML as a string */
  render(): string | unknown;

  /** Optional: called after setting props, before render() */
  connectedCallback?(): void;

  /** Set named property/value */
  [key: string]: unknown;
}

/**
 * Render a single component to DSD HTML string.
 *
 * @param tagName - Custom element tag name (e.g. 'kiss-button')
 * @param componentClass - Registered Custom Element class constructor
 * @param props - Attribute/property key-value pairs
 * @returns Complete DSD HTML string
 *
 * @example
 * ```ts
 * const html = renderDSD('kiss-button', KissButton, { variant: 'primary' })
 * // → <kiss-button variant="primary">
 * //      <template shadowrootmode="open">
 * //        <style>:host{...}</style>
 * //        <button>Click</button>
 * //      </template>
 * //    </kiss-button>
 * ```
 */
export async function renderDSD(
  tagName: string,
  componentClass: CustomElementConstructor,
  props: Record<string, string | boolean | undefined> = {},
): Promise<string> {
  // 1. Instantiate the component
  //    Note: In Node.js/Deno SSR, no DOM lifecycle fires.
  //    The component must be designed to work without connectedCallback.
  let instance: DsdComponent;
  try {
    instance = new componentClass() as unknown as DsdComponent;
  } catch (err) {
    console.error(`[KISS] Failed to instantiate <${tagName}>:`, err);
    return `<${tagName}><!-- render error --></${tagName}>`;
  }

  // 2. Set attributes/properties
  for (const [key, value] of Object.entries(props)) {
    try {
      (instance as Record<string, unknown>)[key] = value;
    } catch {
      // Some properties may be read-only — ignore silently
    }
  }

  // 3. Call connectedCallback if available (won't fire automatically in SSR)
  try {
    instance.connectedCallback?.();
  } catch {
    // Component may throw if it requires a real DOM — degrade gracefully
  }

  // 4. Call render() to get Shadow DOM content
  let content: string;
  try {
    const result = instance.render();
    if (result == null) {
      content = '';
    } else if (typeof result === 'string') {
      content = result;
    } else if (typeof result === 'object' && '_$litType$' in (result as Record<string, unknown>)) {
      // Lit TemplateResult — render using @lit-labs/ssr (available when lit is installed)
      content = await renderLitTemplateResult(result, tagName);
    } else {
      content = String(result);
    }
  } catch (err) {
    console.error(`[KISS] <${tagName}> render() failed:`, err);
    content = '<!-- render error -->';
  }
  // Note: __ssr is async in the generated entry — this await is compatible

  // 5. Wrap in DSD
  const attrs = serializeAttributes(props);
  return `<${tagName}${attrs}>
  <template shadowrootmode="open">
    ${content}
  </template>
</${tagName}>`;
}

/**
 * Render a component from the global Custom Element registry.
 * Looks up the class by tag name using customElements.get().
 *
 * @param tagName - Registered custom element tag name
 * @param props - Attribute/property key-value pairs
 * @returns DSD HTML string, or error HTML if tag is not registered
 *
 * @example
 * ```ts
 * const html = renderDSD('kiss-button', { variant: 'primary' })
 * ```
 */
export async function renderDSDByName(
  tagName: string,
  props: Record<string, string | boolean | undefined> = {},
): Promise<string> {
  const cls = globalThis.customElements?.get(tagName);

  if (!cls) {
    console.warn(`[KISS] <${tagName}> is not registered — rendering as void element`);
    const attrs = serializeAttributes(props);
    return `<${tagName}${attrs}></${tagName}>`;
  }

  return await renderDSD(tagName, cls as CustomElementConstructor, props);
}

/**
 * Scan an HTML string for custom element tags and recursively render them.
 *
 * @param html - HTML string possibly containing custom element tags
 * @param renderFn - Function to render each detected component
 * @returns HTML with all custom elements replaced by their DSD-rendered output
 *
 * Phase 2 enhancement: This enables recursive rendering of nested components.
 * Currently returns the original HTML — full recursive implementation pending
 * the component registry integration.
 */
export async function renderNestedDsd(
  html: string,
  _renderFn: (tag: string, props: Record<string, string>) => Promise<string> = renderDSDByName,
): Promise<string> {
  // Phase 2: Implement regex or lightweight parser for custom element detection.
  // For v0.5.0 alpha, components are responsible for rendering their own children.
  return html;
}

// ─── Document Wrapping ──────────────────────────────────────────

/**
 * Wrap rendered DSD output in a full HTML document.
 * Replaces wrapInDocument from ssr-handler.ts for DSD-first pages.
 */
export function wrapDsdDocument(
  bodyHtml: string,
  options: {
    title?: string;
    lang?: string;
    headExtras?: string;
  } = {},
): string {
  const { title = 'KISS App', lang = 'en', headExtras = '' } = options;
  return `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${headExtras}
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

// ─── Convenience Re-exports ─────────────────────────────────────
export { wrapInDocument } from './ssr-handler.js';
