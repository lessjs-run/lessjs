/**
 * @lessjs/adapter-lit - SSR Adapter
 *
 * Converts Lit TemplateResult to HTML string via safe interpolation.
 * No dependency on @lit-labs/ssr — produces clean DSD HTML without
 * Lit SSR marker comments (<!--lit-part-->, <!--lit-node-->).
 *
 * Why not @lit-labs/ssr?
 *   @lit-labs/ssr is designed for Lit's own client reconciliation pipeline.
 *   Its output contains <!--lit-part--> markers and nested shadowroot
 *   attributes that conflict with DSD's "pure HTML, no framework marks"
 *   promise. This adapter keeps output plain while escaping dynamic text
 *   and attribute values by default.
 *
 * How it works:
 *   Lit TemplateResult = { strings: string[], values: any[] }
 *   We interleave: strings[0] + valueToString(values[0]) + strings[1] + ...
 *   - Text content values are HTML-escaped
 *   - Attribute values are attribute-escaped
 *   - Nested TemplateResult → recursive interpolation
 *   - Boolean attrs (?disabled) → proper HTML boolean attribute
 *   - Event bindings (@click) → stripped (can't work in static HTML)
 *   - Property bindings (.prop) → stripped (can't work in static HTML)
 *   - Lit's `nothing` sentinel → removes attribute or outputs empty string
 *
 * Client-side behavior is unaffected:
 *   customElements.define() upgrades elements and attaches event
 *   listeners / sets properties fresh — the SSR HTML is only for
 *   initial paint.
 *
 * v0.6: Uses SafeHtml/UnsafeHtml branded types from @lessjs/core.
 *   - Text content: escaped by default (SafeHtml)
 *   - TemplateResult literals (trusted HTML): UnsafeHtml
 *   - Lit's unsafeHTML() directive: UnsafeHtml (bypassed)
 *   - Lit's html`` tagged template: the template strings are trustable
 *     but interpolations are dynamically escaped
 *
 * @module @lessjs/adapter-lit/ssr
 */

// ─── Lit TemplateResult Detection ──────────────────────────────

/** Marker property that identifies a Lit TemplateResult */
const LIT_TEMPLATE_TYPE_MARKER = '_$litType$';

/** Lit's `nothing` sentinel — used to conditionally remove attributes */
const NOTHING_SYMBOL = Symbol.for('lit-nothing');

/** Lit's unsafeHTML directive marker — bypasses escaping */
const UNSAFE_HTML_DIRECTIVE = 'lit-html:unsafe-html';

/**
 * Check if a value is a Lit TemplateResult.
 * Works with any Lit version that uses the _$litType$ marker.
 */
export function isLitTemplateResult(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    LIT_TEMPLATE_TYPE_MARKER in (value as Record<string, unknown>)
  );
}

// ─── Internal Types ────────────────────────────────────────────

interface TemplateResultLike {
  strings: ArrayLike<string>;
  values: ArrayLike<unknown>;
  _$litType$: unknown;
}

type BindingType = 'content' | 'attribute' | 'boolean' | 'event' | 'property';

// ─── Template Interpolation ────────────────────────────────────

/**
 * Detect the binding type from the preceding string segment.
 *
 * Lit's tagged template literal encodes binding prefixes:
 *   ?disabled="${val}"  →  boolean attribute
 *   @click="${val}"     →  event binding
 *   .prop="${val}"      →  property binding
 *   class="${val}"      →  regular attribute
 *   ${val}              →  text content
 */
function detectBindingType(precedingStr: string): BindingType {
  const match = precedingStr.match(/([?@.]?)([\w-]+)="\s*$/);
  if (!match) return 'content';

  const prefix = match[1];
  if (prefix === '?') return 'boolean';
  if (prefix === '@') return 'event';
  if (prefix === '.') return 'property';
  return 'attribute';
}

/**
 * Check if a value is Lit's `nothing` sentinel.
 */
function isNothing(value: unknown): boolean {
  return typeof value === 'symbol' && value === NOTHING_SYMBOL;
}

/**
 * HTML escape utilities.
 * Canonical implementation lives in @lessjs/core/render-dsd.ts.
 * v0.6: Uses SafeHtml branded type to preserve Lit escaping semantics.
 *   - TemplateResult static parts (strings[]) are trusted HTML
 *   - Dynamic interpolations are escaped (except unsafeHTML directive)
 */

// Re-export escape utilities from @lessjs/core/render-dsd (single source of truth)
// JSR requires bare specifiers for cross-package imports — relative paths
// like '../../core/src/render-dsd.js' won't resolve once published.
// NOTE: Use @lessjs/core/render-dsd (not @lessjs/core) to avoid pulling in the
// entire core dependency graph (Hono, Vite, etc.) when Vite SSR loads this module.
export { escapeAttr, escapeHtml } from '@lessjs/core/render-dsd';
import { escapeAttr, escapeHtml, type RenderAdapter } from '@lessjs/core/render-dsd';
// Import registerAdapter from @lessjs/core/less-runtime so it shares the same
// module scope as renderDSD when loaded through Vite SSR — no globalThis bridge needed.
import { registerAdapter } from '@lessjs/core/less-runtime';

/** Detect if a string starts with a custom element tag after trimming leading whitespace.
 *  Custom element names MUST contain a hyphen: [a-z][a-z0-9]*-[a-z0-9-]+
 */
function startsWithCustomElement(html: string): boolean {
  return /^<[a-z][a-z0-9]*-[a-z0-9-]+[\s>]/.test(html.trimStart());
}

/** Extract the custom element tag name from DSD HTML.
 *  Input: `<custom-element[attrs]><template shadowrootmode="open">CONTENT</template></custom-element>`
 *  Returns: `custom-element[attrs]` (the tag + attributes)
 */
function _extractCeTag(dsdHtml: string): string | null {
  const trimmed = dsdHtml.trimStart();
  const match = trimmed.match(/^<([a-z][a-z0-9]*-[a-z0-9-]+)[^>]*>/);
  return match ? match[0] : null;
}

/** Unwrap DSD for nested custom elements.
 *
 * v0.6 FIX: When a Lit component renders another custom element, the SSR adapter
 * outputs the nested CE's DSD as TEXT CONTENT in the parent's shadow DOM. This
 * causes the nested CE to appear as raw HTML instead of a real DOM element.
 *
 * Case 1: Result starts with a CE tag → extract just the CE tag.
 *   Input:  `<less-layout><template shadowrootmode="open">CONTENT</template></less-layout>`
 *   Output: `<less-layout>`
 *
 * Case 2: Result starts with static content followed by a CE DSD → replace the
 *   CE's DSD wrapper with just the CE tag (to become a real DOM node).
 *   Input:  `<style>...</style>\n<counter-island><template shadowrootmode="open">...</template></counter-island>`
 *   Output: `<style>...</style>\n<counter-island>`
 *
 * This ensures nested CEs become real DOM elements in the parent's shadow DOM,
 * which `renderDSD.renderNestedCustomElements()` can then process for proper DSD wrapping.
 */
function unwrapDsdForNestedCe(html: string): string {
  const trimmed = html.trimStart();
  // Case 1: starts with a CE tag → extract just the CE tag
  if (startsWithCustomElement(trimmed)) {
    // Find the first CE tag in the HTML
    const ceTagMatch = trimmed.match(/^<([a-z][a-z0-9]*-[a-z0-9-]+)[^>]*>/);
    if (ceTagMatch) {
      // Return just the CE tag (strip the DSD wrapper)
      // The CE's shadow DOM content will be processed by renderNestedCustomElements
      return ceTagMatch[0];
    }
    // If no CE tag found, fall through to case 2
  }
  // Case 2: static content + CE DSD → replace CE's DSD with just CE tag
  // Pattern: anything before <template shadowrootmode>, then the DSD template, then anything after
  // This handles: `<style>...</style>\n<counter-island><template shadowrootmode="open">...</template></counter-island>`
  return html.replace(
    /(<template\s+shadowrootmode="open">)[\s\S]*?(<\/template>)(\s*<\/[a-z][a-z0-9]*-[a-z0-9-]+>)/,
    '$3',
  );
}

/** Convert a template value for safe text-content insertion.
 *
 * v0.6 FIX: Nested custom elements in Lit templates must NOT be rendered
 * as DSD text content inside the parent's shadow DOM. Instead, we extract
 * the shadow DOM content so nested CEs become real DOM nodes that can be
 * processed by renderDSD's renderNestedCustomElements().
 *
 * This fixes the "island appearing as raw HTML/text in shadow DOM" bug
 * where <counter-island> DSD was rendered as text inside <less-layout>'s
 * <style> tag instead of being a real DOM element.
 */
function stringifyContentValue(value: unknown): string {
  if (value == null || isNothing(value)) return '';
  if (Array.isArray(value)) {
    // Lit SSR wraps all values in arrays - process each element
    return value.map((v) => stringifyContentValue(v)).join('');
  }
  if (isLitTemplateResult(value)) {
    const result = interpolate(value);
    // FIX: If the rendered HTML is DSD for a custom element, unwrap it
    // so nested CEs become real DOM nodes instead of text content.
    return unwrapDsdForNestedCe(result);
  }

  // v0.6: Check if this value has a directive marker that indicates
  // it should bypass escaping (e.g., unsafeHTML directive).
  // Lit's unsafeHTML directive returns a special object with properties
  // that signal "trust this HTML content".
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    // Check for Lit's unsafeHTML directive marker
    if (obj._$litDirective$ === UNSAFE_HTML_DIRECTIVE && typeof obj._$resolve === 'function') {
      try {
        const resolved = obj._$resolve();
        if (resolved != null) {
          const str = String(resolved);
          // FIX: Also unwrap DSD from unsafeHTML results containing custom elements
          return unwrapDsdForNestedCe(str);
        }
        return '';
      } catch {
        // If resolution fails, fall through to escaped string
      }
    }
    // _$litDirective$ also appears in other Lit directives — fall through
  }

  return escapeHtml(String(value));
}

/** Convert a template value for safe HTML attribute insertion. */
function stringifyAttributeValue(value: unknown): string {
  if (value == null || isNothing(value)) return '';
  if (Array.isArray(value)) return value.map(stringifyAttributeValue).join('');
  return escapeAttr(String(value));
}

/**
 * Core interpolation: Lit TemplateResult → HTML string.
 *
 * Interleaves the `strings` and `values` arrays, handling Lit's
 * special binding prefixes (? @ .) and the `nothing` sentinel.
 */
function interpolate(result: unknown): string {
  if (!isLitTemplateResult(result)) {
    return stringifyContentValue(result);
  }

  const tr = result as TemplateResultLike;
  const strings = Array.from(tr.strings) as string[];
  const values = Array.from(tr.values) as unknown[];

  let output = '';
  let skipNextQuote = false;

  for (let i = 0; i < strings.length; i++) {
    let str = strings[i];

    // If the previous value was a boolean/event/property binding,
    // we need to strip the closing `"` from this string segment.
    if (skipNextQuote && str.startsWith('"')) {
      str = str.substring(1);
      skipNextQuote = false;
    }

    output += str;

    if (i < values.length) {
      const value = values[i];
      const bindingType = detectBindingType(str);

      switch (bindingType) {
        case 'boolean': {
          // ?disabled="${val}"
          //   truthy → output just "disabled" (no value)
          //   falsy  → remove the entire attribute
          if (value && !isNothing(value)) {
            output = output.replace(/\?([\w-]+)="\s*$/, '$1');
          } else {
            output = output.replace(/\s?\?([\w-]+)="\s*$/, '');
          }
          skipNextQuote = true;
          break;
        }

        case 'event':
        case 'property': {
          // @click="${handler}" or .prop="${val}"
          // These cannot work in static HTML — strip entirely.
          output = output.replace(/\s?[@.][\w-]+="\s*$/, '');
          skipNextQuote = true;
          break;
        }

        case 'attribute': {
          // Regular attribute: class="${val}"
          // Lit's `nothing` sentinel means "remove the attribute".
          if (isNothing(value)) {
            output = output.replace(/\s?([\w-]+)="\s*$/, '');
            skipNextQuote = true;
          } else if (value == null) {
            // null/undefined → empty attribute value (attr="")
            output += '';
          } else {
            output += stringifyAttributeValue(value);
          }
          break;
        }

        case 'content':
        default: {
          output += stringifyContentValue(value);
          break;
        }
      }
    }
  }

  return output;
}

// ─── CSSResult Extraction ────────────────────────────────────────

/**
 * Extract static styles from a Lit component class.
 *
 * Lit stores styles on the static `styles` property which can be:
 * - A single CSSResult (has cssText property with compiled CSS string)
 * - An array of CSSResult
 *
 * Lit 3.x CSSResult has a `cssText` property that contains the fully
 * interpolated CSS string — no need to manually interleave strings/values.
 */
export function extractLitStyles(componentClass: CustomElementConstructor): string | undefined {
  try {
    const ctor = componentClass as unknown as Record<string, unknown>;
    const styles = ctor.styles;
    if (!styles) return undefined;

    // Normalize to array
    const styleList: unknown[] = Array.isArray(styles) ? styles : [styles];
    const parts: string[] = [];

    for (const s of styleList) {
      if (s != null && typeof s === 'object') {
        const obj = s as Record<string, unknown>;
        // Lit 3.x CSSResult has cssText — the fully compiled CSS string
        if (typeof obj.cssText === 'string') {
          parts.push(obj.cssText);
        } else if (typeof obj._strings !== 'undefined') {
          // Fallback: try to reconstruct from _strings if cssText is missing
          // (shouldn't happen in normal Lit 3.x, but defensive)
          const strings = obj._strings as ArrayLike<string>;
          if (strings) {
            const arr = Array.from(strings);
            parts.push(arr.join(''));
          }
        } else if (typeof s === 'string') {
          parts.push(s);
        }
      } else if (typeof s === 'string') {
        parts.push(s);
      }
    }

    return parts.length > 0 ? parts.join('\n') : undefined;
  } catch (err) {
    const name = (componentClass as { name?: string }).name || 'unknown';
    console.warn(
      `[LessJS] Failed to extract styles for <${name}>:`,
      err instanceof Error ? err.message : err,
    );
    return undefined;
  }
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Render a Lit TemplateResult to HTML string.
 *
 * Uses safe interpolation; no @lit-labs/ssr dependency,
 * no Lit SSR marker comments, produces clean DSD-compatible HTML.
 *
 * @param result - The Lit TemplateResult to render
 * @param tagName - Component tag name (for error messages)
 * @returns HTML string
 */
export function renderLitToString(
  result: unknown,
  tagName?: string,
): string {
  if (!isLitTemplateResult(result)) {
    return String(result);
  }

  try {
    return interpolate(result);
  } catch (err) {
    const tag = tagName || 'unknown';
    throw new Error(
      `[LessJS] <${tag}> TemplateResult interpolation failed. ` +
        `Original error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ─── Adapter Installation ─────────────────────────────────────

/**
 * Install the Lit SSR adapter into @lessjs/core's renderDSD.
 *
 * This patches the DSD renderer so that when a component's render()
 * returns a Lit TemplateResult, it's automatically converted to string
 * via safe interpolation instead of falling through to String()
 * which produces "[object Object]".
 *
 * Call this once at the top of your SSG build script or vite.config.ts:
 *
 *   import { installLitAdapter } from '@lessjs/adapter-lit';
 *   installLitAdapter();
 *
 * The adapter stays installed for the lifetime of the process.
 * Idempotent — safe to call multiple times.
 */

// Module-level idempotency guard — no globalThis pollution.
// Works because registerAdapter and renderDSD share the same module
// scope when both are loaded through Vite SSR or Deno.
let _litAdapterInstalled = false;

export function installLitAdapter(): void {
  if (_litAdapterInstalled) {
    return; // Already installed — idempotent
  }

  // Use registerAdapter() — the explicit API, no globalThis pollution
  registerAdapter({
    render: (result: unknown, tagName: string): Promise<string> => {
      return Promise.resolve(renderLitToString(result, tagName));
    },
    isTemplate: (value: unknown): boolean => {
      return isLitTemplateResult(value);
    },
    extractStyles: (componentClass: CustomElementConstructor): string | undefined => {
      return extractLitStyles(componentClass);
    },
  });

  _litAdapterInstalled = true;
  console.log('[LessJS] Lit SSR adapter installed - TemplateResult to string');
}

/**
 * Uninstall the Lit SSR adapter.
 *
 * Resets the adapter so core's renderDSD reverts to its
 * default behavior (only accepting string from render()).
 */
export function uninstallLitAdapter(): void {
  registerAdapter(undefined as unknown as RenderAdapter); // Clear adapter
  _litAdapterInstalled = false;
}
