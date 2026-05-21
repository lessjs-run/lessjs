/**
 * @lessjs/core — StyleSheet (cross-environment CSSStyleSheet abstraction).
 *
 * In the browser this delegates to the native CSSStyleSheet API at zero
 * cost.  In Deno / Node / Bun (where the CSSOM is not available) it falls
 * back to a minimal in‑memory implementation that satisfies the same
 * contract needed by `renderDSD()` and `DsdElement`.
 *
 * Public contract (subset of `CSSStyleSheet`):
 *   new StyleSheet()
 *   sheet.replaceSync(css: string): void
 *   sheet.cssRules: CSSRuleLike[]
 *
 * Where `CSSRuleLike` has exactly one property: `cssText: string`.
 *
 * The shim is intentionally NOT a full CSSOM polyfill — it only implements
 * the surface that LessJS touches.
 */

// ── Types ───────────────────────────────────────────────────────

/** Minimal rule interface — only the field LessJS reads. */
export interface StyleSheetRule {
  cssText: string;
}

/** The surface LessJS uses from CSSStyleSheet. */
export interface StyleSheetLike {
  replaceSync(text: string): void;
  readonly cssRules: StyleSheetRule[];
}

// ── CSS Rule parser (lightweight, no DOM needed) ────────────────

const RULE_RE = /\s*([^{]+)\s*\{\s*([^}]*)\s*\}/g;

function parseRules(css: string): StyleSheetRule[] {
  const rules: StyleSheetRule[] = [];
  let m: RegExpExecArray | null;
  while ((m = RULE_RE.exec(css)) !== null) {
    rules.push({ cssText: m[0].trim() });
  }
  return rules;
}

// ── Shim (Deno / Node) ──────────────────────────────────────────

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

// ── Constructor: auto-detect environment ────────────────────────

/**
 * Cross-environment StyleSheet constructor.
 *
 * Browser:  returns `new CSSStyleSheet()` (native, zero cost).
 * Deno/Node/Bun: returns a `ShimStyleSheet` with the same `replaceSync`
 * and `cssRules` surface.
 *
 * Usage:
 * ```ts
 * const sheet = new StyleSheet();
 * sheet.replaceSync(`.foo { color: red; }`);
 * for (const rule of sheet.cssRules) console.log(rule.cssText);
 * ```
 */
export const StyleSheet: new () => StyleSheetLike =
  (typeof CSSStyleSheet !== 'undefined'
    ? CSSStyleSheet
    : ShimStyleSheet) as unknown as new () => StyleSheetLike;
