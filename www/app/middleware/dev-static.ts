/**
 * openElement dev:fast — static file middleware.
 *
 * Serves static assets from dist/client/ during zero-bundler development.
 * No Vite transform; files served as-is with correct content types.
 */

import type { Context, Next } from 'hono';

/** File extensions recognized as static assets (served directly, not SSR). */
const STATIC_EXTS = new Set([
  '.js',
  '.mjs',
  '.css',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.woff2',
  '.woff',
  '.ttf',
  '.eot',
  '.json',
  '.ico',
  '.txt',
  '.xml',
  '.webmanifest',
  '.map',
  '.avif',
]);

/** Content-Type mapping for common static file extensions. */
const CONTENT_TYPES: Record<string, string> = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json; charset=utf-8',
  '.avif': 'image/avif',
};

/**
 * Middleware that serves static files from dist/client/.
 *
 * Files matching STATIC_EXTS are served directly from disk with
 * appropriate Content-Type headers and no-cache for development.
 * Non-static requests and missing files pass through to the next handler.
 */
export function serveStaticAssets(root: string) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const url = new URL(c.req.url);
    const pathname = url.pathname;
    const ext = pathname.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase();

    if (ext && STATIC_EXTS.has(ext)) {
      try {
        // Normalize path to prevent directory traversal
        const safePath = pathname.replace(/\.\./g, '').replace(/\/{2,}/g, '/');
        const filePath = `${root}${safePath}`;
        const file = await Deno.readFile(filePath);
        const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
        return new Response(file, {
          headers: {
            'content-type': contentType,
            'cache-control': 'no-cache',
          },
        });
      } catch {
        // File not found — let the next handler try
        return await next();
      }
    }

    await next();
  };
}
