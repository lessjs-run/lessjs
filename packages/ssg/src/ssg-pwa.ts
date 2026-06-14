/**
 * @openelement/ssg - PWA manifest + service worker generation
 *
 * Generates manifest.json and sw.js for Progressive Web App support.
 * Also injects the manifest <link> tag into all generated HTML files.
 */

import { join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { createLogger } from '@openelement/core/logger';
import { escapeAttr } from '@openelement/core';
import { findHtmlFiles, stableHash } from './ssg-helpers.ts';

const log = createLogger('ssg');

interface RouteInfoItem {
  path: string;
  // Other fields exist but are not needed by PWA generation
  [key: string]: unknown;
}

interface PwaOptions {
  name?: string;
  shortName?: string;
  themeColor?: string;
  backgroundColor?: string;
  [key: string]: unknown;
}

/**
 * Generate PWA manifest.json and sw.js, and inject manifest <link> into HTML files.
 */
export function generatePwaFiles(
  pwa: PwaOptions,
  basePath: string,
  outputDir: string,
  routeInfo: RouteInfoItem[],
): void {
  const manifest = {
    name: pwa.name || 'openElement',
    short_name: pwa.shortName || 'openElement',
    start_url: basePath,
    display: 'standalone' as const,
    theme_color: pwa.themeColor || '#000000',
    background_color: pwa.backgroundColor || '#ffffff',
    icons: [
      { src: '/assets/open-logo.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
  writeFileSync(
    join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
  log.info('PWA manifest.json generated');

  const cacheHash = stableHash(
    JSON.stringify({
      basePath,
      manifest,
      routes: routeInfo.map((route) => route.path).sort(),
    }),
  );
  const swCode = `const CACHE = 'openelement-${cacheHash}';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => clients.claim())
));
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request));
    return;
  }
  if (e.request.method !== 'GET') return;
  if (e.request.headers.has('authorization')) return;
  const url = new URL(e.request.url);
  // Only handle same-origin requests - cross-origin (CDN, analytics) pass through
  if (url.origin !== location.origin || !url.protocol.startsWith('http')) return;
  if (/\\/(api|rpc)(?:\\/|$)/.test(url.pathname)) return;
  if (/\\/(auth|session|login|logout)(?:\\/|$)/.test(url.pathname)) return;
  const destination = e.request.destination;
  const isStaticDestination = ['style', 'script', 'image', 'font', 'manifest'].includes(destination);
  const isAsset = /\\.[a-z0-9]+$/i.test(url.pathname) && isStaticDestination;
  if (isAsset) {
    e.respondWith(cacheFirst(e.request));
  }
  // Non-asset, non-navigate GET requests pass through without SW interception
});
async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cl = res.clone();
      caches.open(CACHE).then(c => c.put(req, cl)).catch(() => {});
    }
    return res;
  } catch {
    return new Response('', { status: 408, statusText: 'Request timeout' });
  }
}
async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cl = res.clone();
      caches.open(CACHE).then(c => c.put(req, cl)).catch(() => {});
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    return new Response('offline', { status: 503 });
  }
}`;
  writeFileSync(join(outputDir, 'sw.js'), swCode);
  log.info('PWA sw.js generated');

  // H-03 fix: Escape basePath to prevent attribute injection
  const escapedBasePath = escapeAttr(basePath);
  const manifestLink = `<link rel="manifest" href="${escapedBasePath}manifest.json">`;
  const htmlFiles = findHtmlFiles(outputDir);
  for (const htmlPath of htmlFiles) {
    let html = readFileSync(htmlPath, 'utf-8');
    if (!html.includes('rel="manifest"')) {
      html = html.replace('</head>', `${manifestLink}</head>`);
    }
    writeFileSync(htmlPath, html);
  }
  log.info(`PWA manifest injected into ${htmlFiles.length} HTML files`);
  // SW registration intentionally omitted; see theme-init.js SW cache nuke.
  // Re-registering would re-introduce blank-screen risk from stale cached SW.
}
