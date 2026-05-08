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

import { createLogger } from './logger.js';

const log = createLogger('core');

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

/**
 * Wrap rendered HTML in a full HTML document.
 * Adds DOCTYPE, head (title, meta, preload), and body.
 * Supports CSP nonce and dev mode scripts.
 */
export function wrapInDocument(
  html: string,
  options: {
    title?: string;
    lang?: string;
    /** Client-side module script injected after rendered HTML. */
    clientScript?: string;
    meta?: { description?: string };
    devMode?: boolean;
    routeModulePath?: string;
    headExtras?: string;
    /** CSP nonce, if provided, added to all generated <script> tags. */
    cspNonce?: string;
  } = {},
): string {
  const {
    title = 'LessJS',
    lang = 'en',
    clientScript = '',
    meta,
    devMode = false,
    routeModulePath,
    headExtras = '',
    cspNonce,
  } = options;
  const nonceAttr = cspNonce ? ` nonce="${cspNonce}"` : '';

  // Security: warn if headExtras contains <script> tags, which may indicate
  // user-supplied content being injected unsafely. Legitimate use cases exist
  // (e.g. analytics scripts), but developers should be aware of the risk.
  if (headExtras && /<script[\s>]/i.test(headExtras)) {
    log.warn(
      'headExtras contains <script> tags. Ensure this content is developer-controlled, ' +
        'not user-supplied, to prevent XSS. For safe URL injection, use inject.scripts instead.',
    );
  }
  const metaTags: string[] = [];
  if (meta?.description) {
    const safeDesc = meta.description
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    metaTags.push(`  <meta name="description" content="${safeDesc}">`);
  }
  const metaBlock = metaTags.length > 0 ? '\n' + metaTags.join('\n') + '\n' : '';

  const devScripts = devMode
    ? `
  <script type="module" src="/@vite/client"${nonceAttr}></script>
  ${
      routeModulePath
        ? `<script type="module"${nonceAttr}>
  import '${routeModulePath}';
</script>`
        : ''
    }`
    : '';

  const safeTitle = escapeHtml(title);
  const safeLang = escapeAttr(lang);

  return `<!DOCTYPE html>
<html lang="${safeLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>${metaBlock}
  ${headExtras}
</head>
<body>
  ${html}
  ${clientScript}${devScripts}
</body>
</html>`;
}
