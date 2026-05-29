/**
 * @lessjs/core — Tag name validation utility.
 *
 * Validates custom element tag names per HTML spec:
 * - Must contain at least one hyphen
 * - Must start with a lowercase letter
 * - Only lowercase letters, digits, and hyphens allowed
 * - Must not be a reserved name
 *
 * @module @lessjs/core/tag-utils
 */

/** Check if a tag name is a valid custom element name per HTML spec. */
export function isValidTagName(tagName: string): boolean {
  if (!tagName || typeof tagName !== 'string') return false;

  const reserved = new Set([
    'annotation-xml',
    'color-profile',
    'font-face',
    'font-face-src',
    'font-face-uri',
    'font-face-format',
    'font-face-name',
    'missing-glyph',
  ]);
  if (reserved.has(tagName)) return false;

  // Must start with a lowercase letter, contain at least one hyphen,
  // and only contain [a-z], [0-9], and hyphens.
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(tagName);
}
