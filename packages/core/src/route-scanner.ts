/**
 * @lessjs/core - Route scanner
 * Scans the routes directory and generates a route map.
 * Produces the virtual:routes module.
 *
 * Phase 1 enhancement: support for _renderer.ts (layout) and
 * _middleware.ts (Hono middleware) special files.
 *
 * Phase 2 enhancement: support for package islands auto-detection.
 * Packages can export an `islands` array in their main entry.
 *
 * Convention (minimal augmentation):
 * - _renderer.ts: exports a LitElement class used as the page layout wrapper
 * - _middleware.ts: exports a Hono middleware function applied before the route
 * - Files starting with _ are not route handlers but are loaded by the framework
 */

import type { PackageIslandMeta, RouteEntry, SpecialFileType } from './types.js';
import { LessError } from './errors.js';
import { createLogger } from './logger.js';
import { readdir, stat } from 'node:fs/promises';
import { join, posix, sep } from 'node:path';

const log = createLogger('core');

/**
 * Convert a file path to a URL path pattern.
 * e.g., 'index.ts' → '/', 'about.ts' → '/about', 'posts/[id].ts' → '/posts/:id'
 *
 * v0.6': Uses URLPattern-compatible syntax where possible.
 * URLPattern is the WHATWG standard for URL matching (§7.2).
 * Pattern :param is compatible with both Hono and URLPattern.
 */
function filePathToRoutePath(filePath: string): string {
  // Normalize separators
  let p = filePath.split(sep).join(posix.sep);

  // Remove extension
  p = p.replace(/\.[^.]+$/, '');

  // Convert [param] to :param
  p = p.replace(/\[([^\]]+)\]/g, ':$1');

  // Handle index
  if (p === 'index') return '/';
  if (p.endsWith('/index')) p = p.slice(0, -6); // Remove trailing /index

  // Ensure leading slash
  if (!p.startsWith('/')) p = '/' + p;

  return p;
}

/**
 * Determine route type from file path.
 * Files under 'api/' subdirectory are API routes.
 */
function getRouteType(filePath: string): 'page' | 'api' {
  const normalized = filePath.split(sep).join(posix.sep);
  return normalized.startsWith('api/') || normalized.includes('/api/') ? 'api' : 'page';
}

/**
 * Generate a valid JS variable name from a route path.
 * e.g., '/' → 'RouteIndex', '/about' → 'RouteAbout', '/posts/:id' → 'RoutePostsId'
 */
function pathToVarName(path: string): string {
  let name = path
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/:([^/]+)/g, '$1')
    .replace(/[^a-zA-Z0-9]/g, '_');
  if (!name || name === '_') name = 'Index';
  return 'Route_' + name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Identify special file types by name.
 * _renderer.ts → renderer, _middleware.ts → middleware
 */
function getSpecialFileType(fileName: string): SpecialFileType | null {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  switch (baseName) {
    case '_renderer':
      return 'renderer';
    case '_middleware':
      return 'middleware';
    default:
      return null;
  }
}

/**
 * Check if a file should be ignored for routing.
 * Dot-files are always ignored.
 */
function isIgnoredFile(fileName: string): boolean {
  return fileName.startsWith('.');
}

/**
 * Recursively scan a directory for route files.
 * Also collects _renderer.ts and _middleware.ts special files.
 */
export async function scanRoutes(
  routesDir: string,
  baseDir: string = '',
): Promise<RouteEntry[]> {
  const entries: RouteEntry[] = [];
  let files: string[];

  try {
    files = await readdir(routesDir);
  } catch (e) {
    // Directory doesn't exist yet — return empty
    log.debug(
      `Routes directory "${routesDir}" not found: ${e instanceof Error ? e.message : String(e)}`,
    );
    return entries;
  }

  for (const file of files) {
    if (isIgnoredFile(file)) continue;

    const fullPath = join(routesDir, file);
    const relativePath = baseDir ? join(baseDir, file) : file;
    let fileStat;
    try {
      fileStat = await stat(fullPath);
    } catch (e) {
      // File disappeared between readdir and stat (e.g. watch mode deletion)
      log.debug(
        `File vanished before stat: ${fullPath}${e instanceof Error ? `: ${e.message}` : ''}`,
      );
      continue;
    }

    if (fileStat.isDirectory()) {
      // Recurse into subdirectories
      const subEntries = await scanRoutes(fullPath, relativePath);
      entries.push(...subEntries);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      // Check for special files
      const specialType = getSpecialFileType(file);
      if (specialType) {
        // Add as a special entry — not a route handler, but loadable
        entries.push({
          path: filePathToRoutePath(relativePath),
          filePath: relativePath.split(sep).join(posix.sep),
          type: 'special', // Not a page or API route — renderer/middleware only
          varName: `Special_${specialType}_${baseDir.replace(/[\\/]/g, '_') || 'root'}`,
          special: specialType,
        });
      } else if (!file.startsWith('_')) {
        // Regular route file
        const routePath = filePathToRoutePath(relativePath);
        entries.push({
          path: routePath,
          filePath: relativePath.split(sep).join(posix.sep),
          type: getRouteType(relativePath),
          varName: pathToVarName(routePath),
        });
      }
      // Other _-prefixed files (not _renderer/_middleware) are silently skipped
    }
  }

  // Sort routes: static paths first, then dynamic
  entries.sort((a, b) => {
    // Special files go to the end
    if (a.special || b.special) {
      if (a.special && !b.special) return 1;
      if (!a.special && b.special) return -1;
      return 0;
    }
    const aDynamic = a.path.includes(':');
    const bDynamic = b.path.includes(':');
    if (aDynamic !== bDynamic) return aDynamic ? 1 : -1;
    return a.path.localeCompare(b.path);
  });

  return entries;
}

/**
 * Convert a file name (or relative path) to a valid Custom Element tag name.
 * - Removes file extension
 * - Replaces path separators (/ and \) with hyphens
 * - Converts to lowercase
 *
 * Examples:
 *   'my-counter.ts'        → 'my-counter'
 *   'posts/index.ts'       → 'posts-index'
 *   'admin\\dashboard.ts'  → 'admin-dashboard'
 */
export function fileToTagName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, '') // Remove extension
    .replace(/[\\/]/g, '-') // Replace path separators with hyphens
    .toLowerCase();
}

/**
 * Scan islands directory recursively for island files.
 * Returns paths relative to islandsDir (e.g., ['my-counter.ts', 'posts/index.ts']).
 */
export async function scanIslands(
  islandsDir: string,
  relativeDir: string = '',
): Promise<string[]> {
  const files: string[] = [];
  let entries: string[];

  try {
    entries = await readdir(islandsDir);
  } catch (e) {
    // Directory doesn't exist yet — return empty
    log.debug(
      `Islands directory "${islandsDir}" not found: ${e instanceof Error ? e.message : String(e)}`,
    );
    return files;
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;

    const fullPath = join(islandsDir, entry);
    let fileStat;
    try {
      fileStat = await stat(fullPath);
    } catch (e) {
      log.debug(
        `Island file vanished before stat: ${fullPath}${
          e instanceof Error ? `: ${e.message}` : ''
        }`,
      );
      continue;
    }

    const relativePath = relativeDir ? join(relativeDir, entry) : entry;

    if (fileStat.isDirectory()) {
      const subFiles = await scanIslands(fullPath, relativePath);
      files.push(...subFiles);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

/**
 * Scan package exports for island metadata.
 * Packages should export an `islands` array in their main entry.
 *
 * Example package export:
 * ```ts
 * // @lessjs/ui/index.ts
 * export const islands = [
 *   { tagName: 'less-theme-toggle', modulePath: '@lessjs/ui/less-theme-toggle', strategy: 'eager' }
 * ] as const;
 * ```
 *
 * @param packageNames - List of package names to scan (e.g., ['@lessjs/ui'])
 * @returns Array of PackageIslandMeta
 */
export async function scanPackageIslands(
  packageNames: string[],
): Promise<PackageIslandMeta[]> {
  const allIslands: PackageIslandMeta[] = [];

  for (const pkg of packageNames) {
    try {
      // JSR publishes a warning[unanalyzable-dynamic-import] here because
      // `pkg` is a variable — JSR cannot resolve it at publish time.
      // This is intentional: packageNames are user-configured (e.g. ['@lessjs/ui'])
      // and must resolve at runtime via the consumer's import map / package.json.
      // The warning does NOT block publishing; the import resolves correctly
      // in the consuming project where the target package is a declared dependency.
      const mod = await import(pkg);
      if (mod.islands && Array.isArray(mod.islands)) {
        // Validate each island has required fields
        for (const island of mod.islands) {
          if (island.tagName && island.modulePath) {
            allIslands.push({
              tagName: island.tagName,
              modulePath: island.modulePath,
              strategy: island.strategy || 'lazy',
            });
          } else {
            log.warn(
              `Invalid island in ${pkg}: missing tagName or modulePath`,
            );
          }
        }
      }
    } catch (e) {
      // Package scan failure is fatal — misconfigured packages should break
      // the build, not silently produce a broken site. This is consistent
      // with how route scanning failures are handled (throw LessError).
      throw new LessError(
        `Failed to scan package islands from "${pkg}": ${
          e instanceof Error ? e.message : String(e)
        }`,
        'PACKAGE_SCAN_ERROR',
        500,
        false,
      );
    }
  }

  return allIslands;
}
