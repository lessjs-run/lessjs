/**
 * @lessjs/content/nav - Navigation scanner
 *
 * Scans route files, extracts `meta` exports, and aggregates NavSection[].
 * Build-time only — data stored in ctx.navSections (ADR 0010: no .less/ temp files).
 */

import { join, resolve } from 'node:path';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import type { NavItem, NavOptions, NavSection, RouteMeta } from '../types.ts';
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('content:nav');

/**
 * Extract `meta` export from a route file's source code.
 * Expects: `export const meta = { section: "...", label: "...", order: 1 }`
 * Parsed via JSON after normalizing JS object literal syntax (no eval / Function()).
 */
export function extractMeta(source: string): RouteMeta | null {
  // v0.14.7: C-08 fix - Use constrained regex to prevent ReDoS from nested braces.
  // Original /\{[\s\S]*?\}/ can cause exponential backtracking with malformed input.
  // New pattern allows at most 1 level of nesting: \{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}
  const fnMatch = source.match(
    /export\s+const\s+meta\s*=\s*(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})\s*;?\s*(?:\n|$)/,
  );
  if (!fnMatch) return null;

  const metaStr = fnMatch[1];
  try {
    // Convert JS object literal to JSON: unquoted keys, single quotes, trailing commas
    const json = metaStr
      .replace(/'/g, '"') // single quotes → double quotes
      .replace(/(\w+)\s*:/g, '"$1":') // unquoted keys → quoted keys
      .replace(/,\s*}/g, '}') // trailing commas
      .replace(/,\s*]/g, ']'); // trailing commas in arrays
    const result = JSON.parse(json) as RouteMeta;
    if (
      result &&
      typeof result === 'object' &&
      result.section &&
      result.label
    ) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Convert a relative file path to a URL route path.
 * e.g. 'guide/getting-started.ts' → '/guide/getting-started'
 *      'index/index.ts' → '/'
 *      'blog/[slug].ts' → '/blog/:slug'
 */
function filePathToNavPath(filePath: string): string {
  let p = filePath.replace(/\\/g, '/'); // normalize separators
  p = p.replace(/\.[^.]+$/, ''); // remove extension
  p = p.replace(/\[([^\]]+)\]/g, ':$1'); // [slug] → :slug

  // Handle index
  if (p === 'index') return '/';
  if (p.endsWith('/index')) p = p.slice(0, -6);

  // Ensure leading slash
  if (!p.startsWith('/')) p = '/' + p;

  return p;
}

/**
 * Recursively scan a directory for route files with meta exports.
 */
export function scanNavData(options: NavOptions): NavSection[] {
  const routesDir = resolve(options.routesDir);
  const exclude = options.exclude || [];

  // Default excludes: _renderer, _middleware, 404, dot-files
  const defaultExclude = ['_', '404'];
  const allExclude = [...defaultExclude, ...exclude];

  if (!existsSync(routesDir)) {
    log.warn(`Routes directory not found: ${routesDir}`);
    return [];
  }

  // Collect all route files
  const routeFiles = collectRouteFiles(routesDir, '', allExclude);

  // Extract meta from each file, collecting section info
  const itemsWithSection: Array<{
    path: string;
    label: string;
    order: number;
    section: string;
  }> = [];
  for (const file of routeFiles) {
    const fullPath = join(routesDir, file);
    try {
      const source = readFileSync(fullPath, 'utf-8');
      const meta = extractMeta(source);
      if (meta) {
        itemsWithSection.push({
          path: filePathToNavPath(file),
          label: meta.label,
          order: meta.order ?? 100,
          section: meta.section,
        });
      }
    } catch (e) {
      log.debug(`Failed to read route file ${file}: ${e}`);
    }
  }

  // Group by section, preserving first-seen order
  const sectionOrder: string[] = [];
  const sectionItems = new Map<string, NavItem[]>();

  for (const item of itemsWithSection) {
    if (!sectionItems.has(item.section)) {
      sectionOrder.push(item.section);
      sectionItems.set(item.section, []);
    }
    sectionItems.get(item.section)!.push({
      path: item.path,
      label: item.label,
      order: item.order,
    });
  }

  // Build NavSection[] — sort items within each section by order
  const sections: NavSection[] = sectionOrder.map((section) => ({
    section,
    items: (sectionItems.get(section) || []).sort(
      (a, b) => (a.order ?? 100) - (b.order ?? 100),
    ),
  }));

  log.info(
    `Nav: ${sections.length} section(s), ${itemsWithSection.length} item(s) from ${routesDir}`,
  );
  return sections;
}

/**
 * Recursively collect route file paths relative to routesDir.
 * Skips files starting with _ and files matching exclude patterns.
 */
function collectRouteFiles(
  dir: string,
  baseDir: string,
  exclude: string[],
): string[] {
  const files: string[] = [];
  let entries: string[];

  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;

    const fullPath = join(dir, entry);
    const relativePath = baseDir ? `${baseDir}/${entry}` : entry;

    // Skip excluded patterns
    if (
      exclude.some((pattern) => {
        if (pattern === '_') return entry.startsWith('_');
        return relativePath.includes(pattern);
      })
    ) {
      continue;
    }

    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...collectRouteFiles(fullPath, relativePath, exclude));
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
        files.push(relativePath);
      }
    } catch {
      continue;
    }
  }

  return files.sort();
}
