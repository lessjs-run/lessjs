/**
 * @lessjs/core â€” StyleSheet (cross-environment CSSStyleSheet abstraction).
 *
 * In the browser this delegates to the native CSSStyleSheet API at zero
 * cost.  In Deno / Node / Bun (where the CSSOM is not available) it falls
 * back to a minimal inâ€‘memory implementation that satisfies the same
 * contract needed by `renderDSD()` and `DsdElement`.
 *
 * Public contract (subset of `CSSStyleSheet`):
 *   new StyleSheet()
 *   sheet.replaceSync(css: string): void
 *   sheet.cssRules: CSSRuleLike[]
 *
 * Where `CSSRuleLike` has exactly one property: `cssText: string`.
 *
 * The shim is intentionally NOT a full CSSOM polyfill â€” it only implements
 * the surface that LessJS touches.
 */

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Minimal rule interface â€” only the field LessJS reads. */
export interface StyleSheetRule {
  cssText: string;
}

/** The surface LessJS uses from CSSStyleSheet. */
export interface StyleSheetLike {
  replaceSync(text: string): void;
  readonly cssRules: StyleSheetRule[];
}

// â”€â”€ CSS Rule parser (lightweight, no DOM needed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const RULE_RE = /\s*([^{]+)\s*\{\s*([^}]*)\s*\}/g;

function parseRules(css: string): StyleSheetRule[] {
  const rules: StyleSheetRule[] = [];
  let m: RegExpExecArray | null;
  while ((m = RULE_RE.exec(css)) !== null) {
    rules.push({ cssText: m[0].trim() });
  }
  return rules;
}

// â”€â”€ Shim (Deno / Node) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class ShimStyleSheet implements StyleSheetLike {
  #raw = '';
  #rules: StyleSheetRule[] = [];

  get cssRules(): StyleSheetRule[] {
    return this.#rules;
  }

  replaceSync(text: string): void {
    this.#raw = text;
    this.#rules = parseRules(text);
  }
}

// -- Constructor: auto-detect environment (bundler-safe) -----------

function resolveStyleSheetCtor(): new () => StyleSheetLike {
  // typeof on undeclared variable returns 'undefined' without throwing.
  // Function wrapper prevents bundlers from inlining the CSSStyleSheet
  // reference into a position where it would throw ReferenceError in SSR.
  const g = globalThis as Record<string, unknown>;
  if (typeof g.CSSStyleSheet !== 'undefined') return g.CSSStyleSheet as new () => StyleSheetLike;
  return ShimStyleSheet;
}

export const StyleSheet: new () => StyleSheetLike =
  resolveStyleSheetCtor() as unknown as new () => StyleSheetLike;

// Polyfill global CSSStyleSheet for SSR environments so that code
// that references CSSStyleSheet directly (e.g. Lit internals in the
// SSR bundle) does not throw ReferenceError.
if (typeof globalThis.CSSStyleSheet === 'undefined') {
  (globalThis as Record<string, unknown>).CSSStyleSheet = ShimStyleSheet;
}
