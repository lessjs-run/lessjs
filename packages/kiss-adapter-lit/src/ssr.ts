/**
 * @kissjs/adapter-lit - SSR Adapter
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
 * @module @kissjs/adapter-lit/ssr
 */

// ─── Lit TemplateResult Detection ──────────────────────────────

/** Marker property that identifies a Lit TemplateResult */
const LIT_TEMPLATE_TYPE_MARKER = '_$litType$';

/** Lit's `nothing` sentinel — used to conditionally remove attributes */
const NOTHING_SYMBOL = Symbol.for('lit-nothing');

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
 * Canonical implementation lives in @kissjs/core/render-dsd.ts.
 * If that implementation changes, this copy MUST be updated to match.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Convert a template value for safe text-content insertion. */
function stringifyContentValue(value: unknown): string {
  if (value == null || isNothing(value)) return '';
  if (isLitTemplateResult(value)) return interpolate(value);
  if (Array.isArray(value)) return value.map(stringifyContentValue).join('');
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
      `[KISS] Failed to extract styles for <${name}>:`,
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
      `[KISS] <${tag}> TemplateResult interpolation failed. ` +
        `Original error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ─── Adapter Installation ─────────────────────────────────────

/**
 * Install the Lit SSR adapter into @kissjs/core's renderDSD.
 *
 * This patches the DSD renderer so that when a component's render()
 * returns a Lit TemplateResult, it's automatically converted to string
 * via safe interpolation instead of falling through to String()
 * which produces "[object Object]".
 *
 * Call this once at the top of your SSG build script or vite.config.ts:
 *
 *   import { installLitAdapter } from '@kissjs/adapter-lit';
 *   installLitAdapter();
 *
 * The adapter stays installed for the lifetime of the process.
 */
export function installLitAdapter(): void {
  if ((globalThis as Record<string, unknown>).__kissLitAdapterInstalled) {
    return; // Already installed — idempotent
  }

  (globalThis as Record<string, unknown>).__kissLitSsrRenderer = (
    result: unknown,
    tagName: string,
  ): Promise<string> => {
    return Promise.resolve(renderLitToString(result, tagName));
  };

  (globalThis as Record<string, unknown>).__kissLitTemplateCheck = (
    value: unknown,
  ): boolean => {
    return isLitTemplateResult(value);
  };

  (globalThis as Record<string, unknown>).__kissLitStylesExtractor = (
    componentClass: CustomElementConstructor,
  ): string | undefined => {
    return extractLitStyles(componentClass);
  };

  (globalThis as Record<string, unknown>).__kissLitAdapterInstalled = true;
  console.log('[KISS] Lit SSR adapter installed - TemplateResult to string');
}

/**
 * Uninstall the Lit SSR adapter.
 *
 * Removes the global hooks so core's renderDSD reverts to its
 * default behavior (only accepting string from render()).
 */
export function uninstallLitAdapter(): void {
  delete (globalThis as Record<string, unknown>).__kissLitSsrRenderer;
  delete (globalThis as Record<string, unknown>).__kissLitTemplateCheck;
  delete (globalThis as Record<string, unknown>).__kissLitStylesExtractor;
  delete (globalThis as Record<string, unknown>).__kissLitAdapterInstalled;
}
