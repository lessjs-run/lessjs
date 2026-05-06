/**
 * @lessjs/core - DSD Renderer.
 *
 * Pure string-based Declarative Shadow DOM SSR renderer.
 * Framework-agnostic: no Lit dependency and no TemplateResult knowledge.
 *
 * LessJS Architecture (v0.6.0):
 * - Takes a registered Custom Element class + props and returns DSD HTML
 * - Components MUST implement render(): string
 * - Rendering is synchronous string concatenation; no DOM shim needed
 * - Framework adapters can hook into the pipeline via globalThis
 * - Safe/Unsafe HTML contracts preserve Lit's escaping semantics
 *
 * SSR lifecycle:
 *   1. Instantiate component class
 *   2. Set attributes/properties from props
 *   3. Call render() to get Shadow DOM HTML string
 *   4. Wrap in <template shadowrootmode="open">
 *
 * Client lifecycle:
 *   1. Browser parses DSD and attaches Shadow DOM automatically
 *   2. customElements.define() upgrades existing elements
 *   3. connectedCallback fires and attaches event listeners to existing DOM
 *   4. No duplicate client render is needed
 *
 * @module @lessjs/core/render-dsd
 */

// ─── L1: Safe/Unsafe HTML Contract (v0.6) ───────────────────────
//
// Branded types to enforce safe-vs-unsafe HTML at the type level.
// - SafeHtml:  A string that has been HTML-escaped (safe for text content)
// - UnsafeHtml: A string that is intentionally raw HTML (do not double-escape)
//
// Lit's tagged template literals preserve this distinction natively:
//   html`<div>${userInput}</div>`   → text escaped (safe)
//   html`<div>${unsafeHTML(html)}</div>` → bypasses escape (unsafe/trusted)
//
// For string-based DSD SSR, we encode this via branded string types.

/** Branded type: a string that has been HTML-escaped (safe for text content) */
export type SafeHtml = string & { readonly __safeHtml: unique symbol };

/** Branded type: a string that is intentionally raw/untrusted HTML */
export type UnsafeHtml = string & { readonly __unsafeHtml: unique symbol };

/** Mark a string as safe (HTML-escaped) text content */
export function safeHtml(value: string): SafeHtml {
  return value as SafeHtml;
}

/** Mark a string as unsafe/raw HTML (will not be double-escaped) */
export function unsafeHtml(value: string): UnsafeHtml {
  return value as UnsafeHtml;
}

/** Check if a string is branded SafeHtml */
export function isSafeHtml(value: unknown): value is SafeHtml {
  return typeof value === 'string' && (value as SafeHtml).__safeHtml !== undefined;
}

/** Check if a string is branded UnsafeHtml */
export function isUnsafeHtml(value: unknown): value is UnsafeHtml {
  return typeof value === 'string' && (value as UnsafeHtml).__unsafeHtml !== undefined;
}

/**
 * Escape a string for safe HTML text content insertion.
 * If the input is already HTML-escaped (SafeHtml), return as-is.
 * If the input is UnsafeHtml (raw HTML), return as-is (trusted).
 * Otherwise, escape the string.
 *
 * This mirrors Lit's escaping semantics: by default all dynamic
 * content is escaped, but explicit "unsafe" markers bypass escaping.
 */
export function escapeHtml(str: string | SafeHtml | UnsafeHtml): string {
  if (typeof str !== 'string') return '';
  if ((str as SafeHtml).__safeHtml !== undefined) return str;
  if ((str as UnsafeHtml).__unsafeHtml !== undefined) return str;
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

// ─── Adapter Protocol ──────────────────────────────────────────

/** Type for the adapter's template check function */
type TemplateCheckFn = (value: unknown) => boolean;

/** Type for the adapter's SSR renderer function */
type SsrRendererFn = (value: unknown, tagName: string) => Promise<string>;

/** Type for the adapter's styles extractor function */
type StylesExtractorFn = (componentClass: CustomElementConstructor) => string | undefined;

/**
 * Check if an adapter has registered a template type checker.
 * Returns the checker function if available, undefined otherwise.
 */
function getAdapterTemplateCheck(): TemplateCheckFn | undefined {
  return (globalThis as Record<string, unknown>).__lessLitTemplateCheck as
    | TemplateCheckFn
    | undefined;
}

/**
 * Check if an adapter has registered an SSR renderer.
 * Returns the renderer function if available, undefined otherwise.
 */
function getAdapterSsrRenderer(): SsrRendererFn | undefined {
  return (globalThis as Record<string, unknown>).__lessLitSsrRenderer as
    | SsrRendererFn
    | undefined;
}

/**
 * Check if an adapter has registered a styles extractor.
 * Returns the extractor function if available, undefined otherwise.
 */
function getAdapterStylesExtractor(): StylesExtractorFn | undefined {
  return (globalThis as Record<string, unknown>).__lessLitStylesExtractor as
    | StylesExtractorFn
    | undefined;
}

// ─── DSD Rendering ──────────────────────────────────────────────

/** Serialize key-value strings to HTML attribute string */
export function serializeAttributes(props: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(props)) {
    if (val === false || val === null || val === undefined) continue;
    if (val === true) {
      parts.push(key);
    } else if (typeof val === 'object') {
      // Array or Object: JSON-encode and escape for safe HTML attribute embedding.
      // Client-side Lit deserializes via property setter (not attribute), so the
      // JSON string only needs to survive HTML parsing, not be human-readable.
      parts.push(`${key}="${escapeAttrValue(JSON.stringify(val))}"`);
    } else {
      parts.push(`${key}="${escapeAttrValue(val)}"`);
    }
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

/**
 * Interface that components must implement to be DSD-renderable.
 * Works with any Custom Element class that has render() and connectedCallback().
 *
 * render() MUST return a string. If you use Lit components that return
 * TemplateResult, install @lessjs/adapter-lit to handle the conversion.
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
 * v0.6: Error visibility — render failures point to tag/source in visible
 * HTML comments and console warnings.
 *
 * @param tagName - Custom element tag name (e.g. 'less-button')
 * @param componentClass - Registered Custom Element class constructor
 * @param props - Attribute/property key-value pairs
 * @param sourceInfo - Optional context for error messages (route path, source file)
 * @returns Complete DSD HTML string
 *
 * @example
 * ```ts
 * const html = renderDSD('less-button', LessButton, { variant: 'primary' })
 * // → <less-button variant="primary">
 * //      <template shadowrootmode="open">
 * //        <style>:host{...}</style>
 * //        <button>Click</button>
 * //      </template>
 * //    </less-button>
 * ```
 */
export async function renderDSD(
  tagName: string,
  componentClass: CustomElementConstructor,
  props: Record<string, unknown> = {},
  sourceInfo?: { route?: string; source?: string },
): Promise<string> {
  const sourceStr = sourceInfo
    ? `${sourceInfo.route ? ` route="${sourceInfo.route}"` : ''}${sourceInfo.source ? ` source="${sourceInfo.source}"` : ''}`
    : '';

  // 1. Instantiate the component
  let instance: DsdComponent;
  try {
    instance = new componentClass() as unknown as DsdComponent;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[LessJS] Failed to instantiate <${tagName}>:`, errMsg);
    return (
      `<${tagName}${sourceStr}><!-- LessJS ERROR: Failed to instantiate <${tagName}>: ${escapeHtml(errMsg)} -->` +
      (sourceInfo?.route ? `\n<!-- Route: ${escapeHtml(sourceInfo.route)} -->` : '') +
      (sourceInfo?.source ? `\n<!-- Source: ${escapeHtml(sourceInfo.source)} -->` : '') +
      `</${tagName}>`
    );
  }

  // 2. Set attributes/properties
  for (const [key, value] of Object.entries(props)) {
    try {
      (instance as Record<string, unknown>)[key] = value;
    } catch {
      // Some properties may be read-only — ignore silently
    }
  }

  // 3. DO NOT call connectedCallback in SSR.
  // 4. Call render() to get Shadow DOM content
  let content: string;
  try {
    const result = instance.render();
    if (result == null) {
      content = '';
    } else if (typeof result === 'string') {
      content = result;
    } else {
      const templateCheck = getAdapterTemplateCheck();
      const ssrRenderer = getAdapterSsrRenderer();

      if (templateCheck && ssrRenderer && templateCheck(result)) {
        content = await ssrRenderer(result, tagName);
      } else {
        const errDetail = isLitTemplateResultHeuristic(result)
          ? 'This looks like a Lit TemplateResult — install @lessjs/adapter-lit to handle it.'
          : `Components must return a string from render(), got ${typeof result}.`;
        console.error(`[LessJS] <${tagName}> render() returned ${typeof result} instead of string. ${errDetail}`);
        content = `<!-- LessJS ERROR: <${tagName}> render() returned ${typeof result}, expected string. ${errDetail} -->`;
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : '';
    console.error(`[LessJS] <${tagName}> render() failed:`, errMsg, errStack ? `\n${errStack}` : '');
    content = `<!-- LessJS ERROR: <${tagName}> render() threw: ${escapeHtml(errMsg)} -->\n` +
      (errStack ? `<!-- Stack: ${escapeHtml(errStack.split('\n').slice(0, 3).join(' | '))} -->\n` : '') +
      '<!-- Check console for full error details -->';
  }

  // v0.6: L2 Nested DSD — recursively render nested Custom Elements
  content = await renderNestedCustomElements(content);

  // 5. Extract static styles from component class
  let styleCss = '';
  const stylesExtractor = getAdapterStylesExtractor();
  if (stylesExtractor) {
    try {
      styleCss = stylesExtractor(componentClass) || '';
    } catch {
      // Style extraction failed — continue without styles
    }
  }

  // 6. Wrap in DSD
  // v0.6: data-ssr-props embeds all props as JSON for client-side island
  // reconstruction via less:bind() directive or getSSRProps() helper.
  const attrs = serializeAttributes(props);
  const ssrPropsAttr = Object.keys(props).length > 0
    ? ` data-ssr-props="${escapeAttrValue(JSON.stringify(props))}"`
    : '';
  const styleTag = styleCss ? `\n    <style>${styleCss}</style>` : '';
  return `<${tagName}${attrs}${ssrPropsAttr}${sourceStr}>
  <template shadowrootmode="open">${styleTag}
    ${content}
  </template>
</${tagName}>`;
}

/**
 * Heuristic check for Lit TemplateResult without importing Lit.
 * Checks for the _$litType$ marker that Lit uses internally.
 * This is only used for error messaging — actual rendering goes through adapters.
 */
function isLitTemplateResultHeuristic(value: unknown): boolean {
  return typeof value === 'object' && value !== null &&
    '_$litType$' in (value as Record<string, unknown>);
}

/**
 * Render a component from the global Custom Element registry.
 * Looks up the class by tag name using customElements.get().
 *
 * @param tagName - Registered custom element tag name
 * @param props - Attribute/property key-value pairs
 * @param sourceInfo - Optional context for error messages (route path, source file)
 * @returns DSD HTML string, or error HTML if tag is not registered
 *
 * @example
 * ```ts
 * const html = renderDSDByName('less-button', { variant: 'primary' })
 * ```
 */
export async function renderDSDByName(
  tagName: string,
  props: Record<string, unknown> = {},
  sourceInfo?: { route?: string; source?: string },
): Promise<string> {
  const cls = globalThis.customElements?.get(tagName);

  if (!cls) {
    console.warn(`[LessJS] <${tagName}> is not registered — rendering as void element`);
    const attrs = serializeAttributes(props);
    return `<${tagName}${attrs}></${tagName}>`;
  }

  return await renderDSD(tagName, cls as CustomElementConstructor, props, sourceInfo);
}

// ─── L2 Nested DSD (v0.6) ──────────────────────────────────────

/**
 * HTML void elements that MUST NOT have a closing tag or be self-closing.
 * These are native HTML elements — never Custom Elements (which always
 * contain a hyphen and are never void).
 * @internal Reserved for future L2 DSD processing enhancements.
 */
const _VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * Convert kebab-case attribute name to camelCase property name.
 * e.g. current-path → currentPath, aria-label → ariaLabel
 */
function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Parse an HTML element's attributes string into a props object.
 *
 * v0.6: Handles quoted values with escaped chars and JSON-encoded
 * attribute values (arrays, objects). Boolean attributes are set to true.
 * Also preserves data-* attributes as-is (no camelCase conversion).
 */
function parseElementAttrs(attrsStr: string): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  // Match key="value", key='value', or bare key (boolean)
  const attrRegex = /(\w[\w-]*)(?:="((?:[^"\\]|\\.)*)"|='((?:[^'\\]|\\.)*)')?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(attrsStr)) !== null) {
    const key = match[1];
    const value = match[2] ?? match[3];
    if (value === undefined) {
      // Boolean attribute (no value): e.g. home, disabled
      props[key] = true;
    } else if (key.startsWith('data-')) {
      // data-* attributes: preserve as-is (don't camelCase)
      props[key] = value;
    } else {
      props[kebabToCamel(key)] = value;
    }
  }
  return props;
}

/**
 * Recursively render nested Custom Elements with DSD.
 *
 * v0.6: Enhanced slot/projection support:
 *   - Self-closing CE tags (<my-comp />) are handled correctly
 *   - Void elements are skipped (they can't be Custom Elements)
 *   - Light DOM children are preserved after </template> for <slot> projection
 *   - Depth-first recursion ensures innermost elements are wrapped first
 *   - Handles nested template contents correctly
 *   - Supports data-ssr-props for client-side property binding
 *
 * Only processes tags with hyphens (valid Custom Element names)
 * that are registered in the global customElements registry.
 */
async function renderNestedCustomElements(html: string): Promise<string> {
  if (!globalThis.customElements?.get) return html;

  // Strategy: process the HTML iteratively from inside out.
  // First, find all registered custom element tags, then render
  // each one's DSD, preserving light DOM children for slot projection.

  // Match opening tags with hyphens (valid CE names):
  //   <my-comp> ... </my-comp>  — regular element with children
  //   <my-comp />               — self-closing (void-like)
  const ceOpenRegex = /<([a-z][a-z0-9]*-[a-z0-9-]+)([\s\S]*?)>/g;

  interface Replacement {
    start: number;
    end: number;
    newHtml: string;
  }

  const replacements: Replacement[] = [];

  // First pass: collect all custom element positions
  const cePositions: Array<{
    tagName: string;
    attrsStr: string;
    start: number;
    openEnd: number;
    selfClosing: boolean;
    fullMatch: string;
  }> = [];

  let match: RegExpExecArray | null;
  while ((match = ceOpenRegex.exec(html)) !== null) {
    const tagName = match[1];
    const attrsStr = match[2];
    const openStart = match.index;
    const openEnd = openStart + match[0].length;

    // Only process registered Custom Elements
    const Cls = globalThis.customElements.get(tagName);
    if (!Cls) continue;

    // Skip if this range is already covered by a previous replacement
    if (replacements.some((r) => r.start <= openStart && r.end >= openEnd)) continue;

    // Check for self-closing: ends with /> or is a void element
    const selfClosing = attrsStr.trimEnd().endsWith('/');

    if (selfClosing) {
      // Self-closing CE: render full DSD, no children
      cePositions.push({
        tagName,
        attrsStr: attrsStr.replace(/\/\s*$/, ''), // Remove trailing /
        start: openStart,
        openEnd,
        selfClosing: true,
        fullMatch: match[0],
      });
      continue;
    }

    // Find matching close tag: </tagName>
    const closeTag = `</${tagName}>`;
    const closeIdx = html.indexOf(closeTag, openEnd);
    if (closeIdx === -1) continue; // Malformed HTML — skip

    const closeEnd = closeIdx + closeTag.length;

    cePositions.push({
      tagName,
      attrsStr,
      start: openStart,
      openEnd,
      selfClosing: false,
      fullMatch: html.slice(openStart, closeEnd),
    });
  }

  // Second pass: process from inside out (deepest first, by position)
  // Sort by nested depth: later opening tags are deeper
  cePositions.sort((a, b) => b.start - a.start);

  for (const pos of cePositions) {
    if (pos.selfClosing) {
      // Self-closing element: render DSd without children
      const props = parseElementAttrs(pos.attrsStr);
      const dsdHtml = await renderDSD(pos.tagName, globalThis.customElements.get(pos.tagName) as CustomElementConstructor, props);
      replacements.push({
        start: pos.start,
        end: pos.openEnd,
        newHtml: dsdHtml,
      });
    } else {
      // Regular element with children: find the full match again
      const closeTag = `</${pos.tagName}>`;
      const closeIdx = html.indexOf(closeTag, pos.openEnd);
      if (closeIdx === -1) continue;
      const closeEnd = closeIdx + closeTag.length;
      const fullContent = html.slice(pos.openEnd, closeIdx);

      // Depth-first: recursively process children first
      const renderedChildren = await renderNestedCustomElements(fullContent);

      // Render this component's DSD
      const props = parseElementAttrs(pos.attrsStr);
      const dsdHtml = await renderDSD(pos.tagName, globalThis.customElements.get(pos.tagName) as CustomElementConstructor, props);

      // Slot projection: inject light DOM children after </template>
      // DSD spec: light DOM children are placed after </template> and before
      // </tag>, and are projected through <slot> elements inside the shadow root.
      const templateClose = '</template>';
      const templateIdx = dsdHtml.lastIndexOf(templateClose);
      if (templateIdx === -1) continue;

      const childrenTrimmed = renderedChildren.trim();
      if (!childrenTrimmed) {
        replacements.push({ start: pos.start, end: closeEnd, newHtml: dsdHtml });
      } else {
        const before = dsdHtml.slice(0, templateIdx + templateClose.length);
        const after = dsdHtml.slice(templateIdx + templateClose.length);
        replacements.push({
          start: pos.start,
          end: closeEnd,
          newHtml: before + '\n  ' + renderedChildren + after,
        });
      }
    }
  }

  if (replacements.length === 0) return html;

  // Apply replacements from end to start to preserve string indices
  let result = html;
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, newHtml } = replacements[i];
    result = result.slice(0, start) + newHtml + result.slice(end);
  }

  return result;
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
  const { title = 'LessJS', lang = 'en', headExtras = '' } = options;
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
