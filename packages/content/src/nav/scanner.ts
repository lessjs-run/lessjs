/**
 * @openelement/content navigation tools - Navigation scanner
 *
 * Scans route files, extracts `meta` exports, and aggregates NavSection[].
 * Build-time only - data stored in ctx.navSections (ADR 0010: no .openElement/ temp files).
 */

import { join, resolve } from 'node:path';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import type { HeaderNavLink, NavItem, NavOptions, NavSection, RouteMeta } from '../types.ts';
import { createLogger } from '@openelement/core/logger';
import * as ts from 'typescript';

/** Aggregated navigation data ready for module generation */
export interface NavData {
  /** Header navigation links (manually configured) */
  headerNav: HeaderNavLink[];
  /** Navigation sections with items */
  navSections: NavSection[];
}

const log = createLogger('content:nav');

export function extractMeta(source: string): RouteMeta | null {
  const sourceFile = ts.createSourceFile(
    'route.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const isExported = statement.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'meta') continue;
      if (!declaration.initializer) return null;

      const initializer = unwrapStaticExpression(declaration.initializer);
      if (!ts.isObjectLiteralExpression(initializer)) return null;

      const result = readRouteMetaLiteral(initializer);
      return toRouteMeta(result);
    }
  }

  return null;
}

function unwrapStaticExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function readRouteMetaLiteral(object: ts.ObjectLiteralExpression): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propertyNameToString(property.name);
    if (!key || !['section', 'label', 'order'].includes(key)) continue;
    result[key] = readLiteralValue(unwrapStaticExpression(property.initializer));
  }
  return result;
}

function readLiteralValue(expression: ts.Expression): unknown {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }
  if (ts.isNumericLiteral(expression)) return Number(expression.text);
  if (expression.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (expression.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (expression.kind === ts.SyntaxKind.NullKeyword) return null;
  return undefined;
}

function propertyNameToString(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function toRouteMeta(value: Record<string, unknown>): RouteMeta | null {
  if (typeof value.section !== 'string') return null;
  if (typeof value.label !== 'string') return null;
  if (value.order !== undefined && typeof value.order !== 'number') return null;
  return {
    section: value.section,
    label: value.label,
    ...(value.order !== undefined ? { order: value.order } : {}),
  };
}

/**
 * Convert a relative file path to a URL route path.
 * e.g. 'guide/getting-started.ts' -> '/guide/getting-started'
 *      'index/index.ts' -> '/'
 *      'blog/[slug].ts' -> '/blog/:slug'
 */
function filePathToNavPath(filePath: string): string {
  let p = filePath.replace(/\\/g, '/'); // normalize separators
  p = p.replace(/\.[^.]+$/, ''); // remove extension
  p = p.replace(/\[([^\]]+)\]/g, ':$1'); // [slug] -> :slug

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
  const routesDir = resolve(options.routesDir ?? 'app/routes');
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

  // Build NavSection[] - sort items within each section by order
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
