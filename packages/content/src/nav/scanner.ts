/**
 * @lessjs/content/nav - Navigation scanner
 *
 * Scans route files, extracts `meta` exports, and aggregates NavSection[].
 * Build-time only — produces .less/nav-data.json.
 */

import { join, resolve } from 'node:path';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import type { NavItem, NavOptions, NavSection, RouteMeta } from '../types.ts';
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('content:nav');

/**
 * Extract `meta` export from a route file's source code.
 * Uses Function constructor for safe evaluation — meta objects are plain data.
 * Falls back to regex if Function() fails.
 */
export function extractMeta(source: string): RouteMeta | null {
  const fnMatch = source.match(
    /export\s+const\s+meta\s*=\s*(\{[\s\S]*?\})\s*;?\s*(?:\n|$)/,
  );
  if (!fnMatch) return null;

  const metaStr = fnMatch[1];
  try {
    // Function constructor is safer than eval — no access to local scope
    const fn = new Function(`return (${metaStr})`);
    const result = fn() as RouteMeta;
    if (result && typeof result === 'object' && result.section && result.label) {
      return result;
    }
    return null;
  } catch {
    // Fallback: JSON-like parse for simple { section: "Foo", label: "Bar" }
    try {
      const jsonLike = metaStr
        .replace(/(\w+)\s*:/g, '"$1":')
        .replace(/'/g, '"');
      const result = JSON.parse(jsonLike) as RouteMeta;
      if (result && result.section && result.label) {
        return result;
      }
    } catch {
      // Give up — meta syntax not parseable
    }
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
  const itemsWithSection: Array<{ path: string; label: string; order: number; section: string }> =
    [];
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
    items: (sectionItems.get(section) || [])
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100)),
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
function collectRouteFiles(dir: string, baseDir: string, exclude: string[]): string[] {
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
