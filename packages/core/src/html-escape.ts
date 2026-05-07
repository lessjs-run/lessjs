/**
 * @lessjs/core - Safe/Unsafe HTML Contract
 *
 * Branded types for HTML escaping semantics:
 * - SafeHtml:  A string that has been HTML-escaped (safe for text content)
 * - UnsafeHtml: A string that is intentionally raw HTML (do not double-escape)
 *
 * @module @lessjs/core/html-escape
 */

// ─── L1: Safe/Unsafe HTML Contract ──────────────────────────────

/** Branded type: a string that has been HTML-escaped (safe for text content) */
export type SafeHtml = string & { readonly __safeHtml: unique symbol };

/** Branded type: a string that is intentionally raw/untrusted HTML */
export type UnsafeHtml = string & { readonly __unsafeHtml: unique symbol };

/**
 * Escape a string for safe HTML text content insertion.
 * If the input is already HTML-escaped (SafeHtml), return as-is.
 * If the input is UnsafeHtml (raw HTML), return as-is (trusted).
 * Otherwise, escape the string.
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
