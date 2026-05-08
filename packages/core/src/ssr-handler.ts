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
import { wrapInDocument } from './html-escape.js';

// Re-export wrapInDocument from html-escape.ts (canonical location)
export { wrapInDocument };

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
