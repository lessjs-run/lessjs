/**
 * @lessjs/core - SSG Post-Processing
 *
 * Pure Node.js fs operations for SSG output post-processing.
 * No Vite dependency — these functions only read/write files.
 *
 * URLPattern is used for route matching per WHATWG §7.2.
 */

import { join, resolve } from 'node:path';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
// DRY: Color token values from single source of truth (zero lit dependency)
// JSR requires bare specifiers for cross-package imports
import { generateRootColorCSS } from '@lessjs/ui/tokens/color-values';

// ─── HTML Insertion Helpers ────────────────────────────────────────────

/** Insert content immediately after <head> opening tag (handles attributes) */
function insertAfterHead(html: string, content: string): string {
  const headMatch = html.match(/<head(\s[^>]*)?>/i);
  if (!headMatch) {
    return html.startsWith('<!') || html.startsWith('<html')
      ? html.replace(/(<(?:!DOCTYPE|html)[^>]*>)/i, `$1\n<head>\n  ${content}\n</head>`)
      : `<head>\n  ${content}\n</head>\n${html}`;
  }
  const headEnd = headMatch.index! + headMatch[0].length;
  return html.slice(0, headEnd) + `\n  ${content}` + html.slice(headEnd);
}

/** Insert content immediately before </body> closing tag */
function insertBeforeBodyClose(html: string, content: string): string {
  const bodyCloseMatch = html.match(/<\/body\s*>/i);
  if (!bodyCloseMatch) {
    return html + `\n${content}\n`;
  }
  const idx = bodyCloseMatch.index!;
  return html.slice(0, idx) + `${content}\n` + html.slice(idx);
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Scan client build output to build tagName → chunk path mapping.
 * Reads Rollup manifest JSON (v0.3.0+ deterministic approach).
 */
export function buildIslandChunkMap(
  root: string,
  outDir: string,
  islands: string[],
  basePath: string = '/',
): Record<string, string> {
  const distDir = resolve(root, outDir);
  const clientDir = resolve(distDir, 'client');
  const islandChunkMap: Record<string, string> = {};

  if (!existsSync(clientDir)) return islandChunkMap;

  const manifestPath = join(clientDir, '.vite', 'manifest.json');
  if (!existsSync(manifestPath)) return islandChunkMap;

  try {
    const manifestRaw = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestRaw);

    for (const [_srcPath, entry] of Object.entries(manifest) as [string, { file?: string }][]) {
      if (!entry.file) continue;
      const chunkMatch = entry.file.match(/^islands\/island-(.+?)-[A-Za-z0-9]+\.js$/);
      if (chunkMatch && islands.includes(chunkMatch[1])) {
        islandChunkMap[chunkMatch[1]] = `${basePath}client/${entry.file}`;
      }
      if (entry.file === 'islands/client.js') {
        for (const tagName of islands) {
          if (!islandChunkMap[tagName]) {
            islandChunkMap[tagName] = `${basePath}client/islands/client.js`;
          }
        }
      }
    }
  } catch {
    // Malformed manifest — return empty map
  }

  return islandChunkMap;
}

/**
 * Inject client script tag into all HTML files.
 */
export function injectClientScript(dir: string, scriptSrc: string): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      injectClientScript(fullPath, scriptSrc);
    } else if (entry.name.endsWith('.html')) {
      let content = readFileSync(fullPath, 'utf-8');
      const scriptTag = `  <script type="module" src="${scriptSrc}"></script>`;
      if (!content.includes(scriptSrc)) {
        content = insertBeforeBodyClose(content, scriptTag);
        writeFileSync(fullPath, content, 'utf-8');
      }
    }
  }
}

/**
 * Inject CSP <meta> tag into all HTML files (SSG-only).
 *
 * For static sites, CSP is enforced via <meta http-equiv="Content-Security-Policy">
 * rather than HTTP headers. Nonce-based CSP is NOT supported for SSG
 * (nonces must be per-request and unpredictable — impossible in static files).
 */
export function injectCspMeta(
  dir: string,
  cspPolicy: string,
  reportOnly = false,
  nonce = false,
): void {
  if (nonce) {
    console.warn(
      '[LessJS] CSP nonce is not supported for SSG static output. ' +
        'Falling back to policy-only Content-Security-Policy meta tag. ' +
        'For per-request nonces, use a server-side middleware instead.',
    );
  }

  const headerName = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
  const escapedPolicy = cspPolicy.replace(/"/g, '&quot;');
  const metaTag = `  <meta http-equiv="${headerName}" content="${escapedPolicy}">`;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      injectCspMeta(fullPath, cspPolicy, reportOnly, nonce);
    } else if (entry.name.endsWith('.html')) {
      let content = readFileSync(fullPath, 'utf-8');
      if (!content.includes(`http-equiv="${headerName}"`)) {
        content = insertAfterHead(content, metaTag);
        writeFileSync(fullPath, content, 'utf-8');
      }
    }
  }
}

/**
 * Inject inline layout styles into all HTML files.
 *
 * less-layout is a Lit component without DSD in SSR output,
 * so its shadow DOM CSS only appears after JS executes.
 * This injects the layout CSS into the HTML <head> so the
 * header, sidebar, footer are styled immediately.
 *
 * v0.6: Also injects :root theme CSS custom properties.
 * Generated from @lessjs/ui/tokens/color-values.ts — SINGLE SOURCE OF TRUTH.
 */
export function injectLayoutStyles(dir: string): void {
  const rootColorVars = generateRootColorCSS();

  const style = [
    '<style id="less-layout-inline">',
    rootColorVars,
    'less-layout{display:block}',
    '</style>',
  ].join('');

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      injectLayoutStyles(fullPath);
    } else if (entry.name.endsWith('.html')) {
      let content = readFileSync(fullPath, 'utf-8');
      if (!content.includes('id="less-layout-inline"')) {
        content = insertAfterHead(content, style);
        writeFileSync(fullPath, content, 'utf-8');
      }
    }
  }
}
