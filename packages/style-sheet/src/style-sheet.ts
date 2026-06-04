/**
 * @openelement/core - StyleSheet (cross-environment CSSStyleSheet abstraction).
 *
 * In the browser this delegates to the native CSSStyleSheet API at zero
 * cost.  In Deno / Node / Bun (where the CSSOM is not available) it falls
 * back to a minimal in-memory implementation that satisfies the same
 * contract needed by `renderDsd()` and `DsdElement`.
 *
 * Public contract (subset of `CSSStyleSheet`):
 *   new StyleSheet()
 *   sheet.replaceSync(css: string): void
 *   sheet.cssRules: CSSRuleLike[]
 *
 * Where `CSSRuleLike` has exactly one property: `cssText: string`.
 *
 * The shim is intentionally NOT a full CSSOM polyfill - it only implements
 * the surface that LessJS touches.
 */

// -- Types -------------------------------------------------------

/** Minimal rule interface - only the field LessJS reads. */
export interface StyleSheetRule {
  cssText: string;
}

/** The surface LessJS uses from CSSStyleSheet. */
export interface StyleSheetLike {
  replaceSync(text: string): void;
  readonly cssRules: StyleSheetRule[];
}

// -- CSS Rule parser (lightweight, no DOM needed) ----------------

/**
 * Parse CSS into rule blocks, correctly handling nested {} in @media / @keyframes.
 *
 * Uses bracket-counting to extract top-level rules. This ensures that
 * `.header-nav { display: none; }` inside `@media (max-width: 900px) { ... }`
 * stays within the @media block and doesn't leak out as a standalone rule
 * that overrides the desktop declaration.
 */
function parseRules(css: string): StyleSheetRule[] {
  const rules: StyleSheetRule[] = [];
  let i = 0;
  const len = css.length;

  while (i < len) {
    // Skip whitespace and comments
    while (i < len && /\s/.test(css[i])) i++;
    if (i >= len) break;

    // Skip CSS comments
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) break;
      i = end + 2;
      continue;
    }

    // Find the opening brace for a selector or at-rule
    const openBrace = css.indexOf('{', i);
    if (openBrace === -1) break;

    // Bracket-count to find matching closing brace
    let depth = 0;
    let j = openBrace;
    while (j < len) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') {
        depth--;
        if (depth === 0) break;
      }
      j++;
    }
    if (depth !== 0) break; // Unmatched braces - stop

    const ruleText = css.substring(i, j + 1).trim();
    if (ruleText) rules.push({ cssText: ruleText });
    i = j + 1;
  }

  // Fallback: if no rules found, treat entire CSS as a single rule
  // (handles bare declarations like `--gray-0: #f8f9fa;`)
  if (rules.length === 0 && css.trim()) {
    rules.push({ cssText: css.trim() });
  }
  return rules;
}

// -- Shim (Deno / Node) ------------------------------------------

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

export const StyleSheet: new () => StyleSheetLike = resolveStyleSheetCtor() as unknown as new () =>
StyleSheetLike;

// Polyfill global CSSStyleSheet for SSR environments so that code
// that references CSSStyleSheet directly (e.g. Lit internals in the
// SSR bundle) does not throw ReferenceError.
if (typeof globalThis.CSSStyleSheet === 'undefined') {
  (globalThis as Record<string, unknown>).CSSStyleSheet = ShimStyleSheet;
}
