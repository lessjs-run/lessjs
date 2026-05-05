/**
 * @lessjs/core - SSR Handler.
 *
 * This module provides build-time rendering helpers used by SSG and dev:
 * - Error page rendering
 * - HTML document wrapping
 *
 * What was removed:
 * - renderPageToString(): runtime SSR function that took ViteDevServer
 * - collectIslands(): regex-based island detection, replaced by build metadata
 */

import type { RouteEntry } from './types.js';
import { escapeAttrValue as escapeHtmlAttr, escapeHtml } from './render-dsd.js';

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
  const message = error.message.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (isDev) {
    const stack = error.stack ? error.stack.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
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

/**
 * Wrap rendered HTML in a full HTML document.
 * Adds DOCTYPE, head (title, meta, preload), and body.
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

  const safeTitle = escapeHtml(title);
  const safeLang = escapeHtmlAttr(lang);
  const safeHeadExtras = headExtras; // developer-provided HTML, intentionally not escaped
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
  // Register route component for client-side custom element definition
  import '${routeModulePath}';
</script>`
        : ''
    }`
    : '';

  return `<!DOCTYPE html>
<html lang="${safeLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>${metaBlock}
  ${safeHeadExtras}
</head>
<body>
  ${html}
  ${clientScript}${devScripts}
</body>
</html>`;
}
