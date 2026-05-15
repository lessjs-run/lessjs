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

/** Track whether we've already warned about <script> in headExtras (once per process) */
let _warnedHeadExtrasScripts = false;

/** Branded type: a string that has been HTML-escaped (safe for text content) */
export type SafeHtml = string & { readonly __safeHtml: unique symbol };

/** Branded type: a string that is intentionally raw/untrusted HTML */
export type UnsafeHtml = string & { readonly __unsafeHtml: unique symbol };

/**
 * Escape a string for safe HTML text content insertion.
 * If the input is already HTML-escaped (SafeHtml), return as-is.
 * If the input is UnsafeHtml (raw HTML), return as-is (trusted).
 * Otherwise, escape the string.
 *
 * NOTE (v0.14.3): SafeHtml and UnsafeHtml are nominal branded types
 * using `unique symbol`. At runtime, a plain `string` can never have
 * `__safeHtml` or `__unsafeHtml` properties, so the branded type
 * checks below always evaluate to false for plain strings. This is
 * intentional — the protection is at compile time (TypeScript prevents
 * passing UnsafeHtml where SafeHtml is expected). The runtime checks
 * are a defensive no-op that preserves the identity of pre-branded values
 * if they were somehow constructed at runtime.
 */
export function escapeHtml(str: string | SafeHtml | UnsafeHtml): string {
  if (typeof str !== 'string') return '';
  // These checks are compile-time branding — they never match plain strings at runtime.
  // See NOTE above for explanation.
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
    /** Trust script tags that were produced by structured framework injection APIs. */
    allowHeadExtrasScripts?: boolean;
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
    allowHeadExtrasScripts = false,
    cspNonce,
  } = options;
  // v0.14.5: CSP nonce format validation per CSP spec (base64 value)
  const NONCE_RE = /^[A-Za-z0-9+/=_-]+$/;
  const validNonce = cspNonce && NONCE_RE.test(cspNonce) ? cspNonce : undefined;
  if (cspNonce && !validNonce) {
    log.warn(`Invalid CSP nonce format: "${cspNonce}". Nonce should be a base64-encoded value.`);
  }
  const nonceAttr = validNonce ? ` nonce="${validNonce}"` : '';

  // Security: warn if headExtras contains <script> tags, which may indicate
  // user-supplied content being injected unsafely. Legitimate use cases exist
  // (e.g. analytics scripts), but developers should be aware of the risk.
  // Only warn once per process to avoid flooding SSG logs.
  if (
    !allowHeadExtrasScripts &&
    headExtras && /<script[\s>]/i.test(headExtras) && !_warnedHeadExtrasScripts
  ) {
    _warnedHeadExtrasScripts = true;
    log.warn(
      'headExtras contains <script> tags. Ensure this content is developer-controlled, ' +
        'not user-supplied, to prevent XSS. For safe URL injection, use inject.scripts instead.',
    );
  }

  // v0.14.7: Detect on* event handler attributes in headExtras (C-02 fix).
  // These are a strong indicator of XSS (e.g., onload="alert(1)").
  // Only warn — don't strip, because headExtras is developer-controlled by design.
  if (headExtras && /\s+on\w+\s*=/i.test(headExtras)) {
    log.warn(
      'headExtras contains on* event handler attributes (e.g., onclick, onload). ' +
        'This is a potential XSS vector. Ensure this content is developer-controlled.',
    );
  }

  // v0.14.3: Basic HTML tag balance validation for headExtras.
  // Checks that opening and closing tag counts match for major HTML elements.
  // This catches obviously malformed HTML (e.g., unclosed <!-- comments).
  if (headExtras) {
    // Check for unclosed HTML comments: <!-- without matching -->
    const commentOpens = (headExtras.match(/<!--/g) || []).length;
    const commentCloses = (headExtras.match(/-->/g) || []).length;
    if (commentOpens !== commentCloses) {
      log.warn(
        'headExtras has unbalanced HTML comments (<!-- vs -->). ' +
          'This may cause HTML parsing issues.',
      );
    }
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

// ─── Error page rendering ────────────────────────────────────────

import type { RouteEntry } from './types.js';

/**
 * Render an error page to HTML string.
 * In dev mode, shows detailed error information for debugging.
 * In production, shows a generic safe error page.
 */
export function renderSsrError(
  error: Error,
  statusOrRoute: number | RouteEntry,
  isDev: boolean = false,
): string {
  const status = typeof statusOrRoute === 'number' ? statusOrRoute : 500;
  const title = isDev ? 'SSR Render Error' : `Error ${status}`;
  const message = escapeHtml(error.message);

  if (isDev) {
    const stack = error.stack ? escapeHtml(error.stack) : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem}pre{background:#f5f5f5;padding:1rem;overflow:auto;border-radius:4px}</style>
</head>
<body>
  <h1>${title}</h1>
  <p><strong>${message}</strong></p>
  ${stack ? `<pre>${stack}</pre>` : ''}
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  <p>${message}</p>
</body>
</html>`;
}
