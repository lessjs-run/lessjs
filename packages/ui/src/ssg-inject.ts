/**
 * @lessjs/ui - SSG Layout Style Injection
 *
 * Injects inline layout styles into SSG output HTML files.
 * This is a UI-layer concern — moved from @lessjs/core because
 * core should not depend on UI package (design tokens, component styles).
 *
 * Users who need this in their SSG pipeline should call it explicitly:
 * ```ts
 * import { injectLayoutStyles } from '@lessjs/ui/ssg-inject';
 * injectLayoutStyles(outputDir);
 * ```
 *
 * Or use `less({ inject: { headFragments } })` with `lessRootColorCSS`
 * for dev-mode inline theme injection (recommended).
 */

import { join } from 'node:path';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { insertAfterHead } from '@lessjs/core';
import { generateRootColorCSS } from './tokens/color-values.js';

// ─── Public API ────────────────────────────────────────────────────

/**
 * Inject inline layout styles into all HTML files.
 *
 * less-layout is a Lit component without DSD in SSR output,
 * so its shadow DOM CSS only appears after JS executes.
 * This injects the layout CSS into the HTML <head> so the
 * header, sidebar, footer are styled immediately.
 *
 * v0.6: Also injects :root theme CSS custom properties.
 * Generated from tokens/color-values.ts — SINGLE SOURCE OF TRUTH.
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
