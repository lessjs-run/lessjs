/**
 * @lessjs/ui - Shared HTML/attribute escape utilities.
 *
 * SSR-safe (no DOM API). Used by all UI components to prevent XSS
 * when rendering user-provided attribute values as HTML content.
 */

/**
 * Escape HTML text content to prevent XSS.
 * Escapes: & < >
 */
export function _esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Escape HTML attribute values to prevent XSS.
 * Escapes: & " < >
 */
export function _escAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(
    />/g,
    '&gt;',
  );
}
