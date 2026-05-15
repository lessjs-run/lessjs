/**
 * @lessjs/core - Island Upgrade Manifest
 *
 * Generates per-page island manifest JSON files during SSG post-processing.
 * Each manifest lists the islands found on a page with their chunk URLs and strategies.
 */

import { join } from 'node:path';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

/** Island manifest entry for a single custom element */
export interface IslandManifestEntry {
  /** Custom element tag name (e.g. 'less-theme-toggle') */
  tagName: string;
  /** Client chunk URL relative to site root */
  chunkUrl: string;
  /** Upgrade strategy */
  strategy: 'eager' | 'lazy' | 'idle' | 'visible';
  /** Component layer */
  layer: 'dsd-static' | 'dsd-interactive' | 'pure-island';
}

/** Per-page island manifest */
export interface PageIslandManifest {
  /** Page route (e.g. '/guide/getting-started') */
  route: string;
  /** Islands found on this page */
  islands: IslandManifestEntry[];
  /** Build timestamp (ISO 8601) */
  builtAt: string;
}

/** Strategy map type: tagName → strategy */
export type IslandStrategyMap = Record<string, 'eager' | 'lazy' | 'idle' | 'visible'>;

/** Layer map type: tagName → layer */
export type IslandLayerMap = Record<string, 'dsd-static' | 'dsd-interactive' | 'pure-island'>;

/**
 * Extract custom element tag names from HTML content.
 * Matches <xxx-yyy> or <xxx-yyy ...> patterns (custom elements must contain a hyphen).
 * v0.14.6: Strips HTML comments, script blocks, and style blocks before matching
 * to avoid false positives (e.g., CE tags inside comments or script content).
 */
export function extractCustomElementTags(html: string): string[] {
  // Strip HTML comments, script blocks, and style blocks first
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, '') // Remove script blocks
    .replace(/<style[\s>][\s\S]*?<\/style>/gi, ''); // Remove style blocks
  const tagPattern = /<([a-z][a-z0-9]*-[a-z0-9-]+)[\s>\/]/gi;
  const tags = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(cleaned)) !== null) {
    tags.add(match[1].toLowerCase());
  }
  return [...tags];
}

/**
 * Generate island manifests for all HTML files in the output directory.
 */
export function generateIslandManifests(
  htmlDir: string,
  islandChunkMap: Record<string, string>,
  strategyMap: IslandStrategyMap = {},
  layerMap: IslandLayerMap = {},
): PageIslandManifest[] {
  const manifests: PageIslandManifest[] = [];

  if (!existsSync(htmlDir)) return manifests;

  const entries = readdirSync(htmlDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subManifests = generateIslandManifests(
        join(htmlDir, entry.name),
        islandChunkMap,
        strategyMap,
        layerMap,
      );
      for (const m of subManifests) {
        m.route = `/${entry.name}${m.route}`;
      }
      manifests.push(...subManifests);
    } else if (entry.name.endsWith('.html')) {
      const html = readFileSync(join(htmlDir, entry.name), 'utf-8');
      const tags = extractCustomElementTags(html);

      const islands: IslandManifestEntry[] = tags
        .filter((tag) => tag in islandChunkMap)
        .map((tag) => ({
          tagName: tag,
          chunkUrl: islandChunkMap[tag],
          strategy: strategyMap[tag] || 'lazy',
          layer: layerMap[tag] || 'dsd-static',
        }));

      const route = entry.name === 'index.html' ? '/' : `/${entry.name.replace(/\.html$/, '')}`;

      manifests.push({
        route,
        islands,
        builtAt: new Date().toISOString(),
      });
    }
  }

  return manifests;
}

/**
 * Write island manifest files to disk.
 * Each page gets its own JSON file at {outDir}/island-manifests/{route-hash}.json
 */
export function writeIslandManifests(outputDir: string, manifests: PageIslandManifest[]): void {
  const manifestDir = join(outputDir, 'island-manifests');
  mkdirSync(manifestDir, { recursive: true });

  for (const manifest of manifests) {
    const hash = stableHash(manifest.route);
    const filename = `page-${hash}.json`;
    writeFileSync(join(manifestDir, filename), JSON.stringify(manifest, null, 2), 'utf-8');
  }
}

/**
 * FNV-1a 64-bit hash for generating stable filenames.
 * v0.14.3: Replaced simpleHash (32-bit DJB2 variant) with FNV-1a 64-bit
 * to significantly reduce collision probability for large sites.
 * Uses BigInt for the 64-bit arithmetic, falling back to 32-bit
 * if BigInt is unavailable.
 *
 * Exported as shared utility for use by other modules (e.g., ssg-render.ts).
 */
export function stableHash(str: string): string {
  // FNV-1a 64-bit parameters
  const FNV_OFFSET_BASIS = 14695981039346656037n;
  const FNV_PRIME = 1099511628211n;
  const MASK64 = (1n << 64n) - 1n;

  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash = (hash * FNV_PRIME) & MASK64;
  }
  return hash.toString(36);
}
