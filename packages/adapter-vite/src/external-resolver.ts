/**
 * @lessjs/adapter-vite — Deno External Dependency Pre-Resolution (ADR-0047).
 *
 * Eliminates ESM subpath leaks into Rolldown by having Deno resolve all
 * external package transitive dependencies before the bundler sees them.
 * Produces a complete specifier list so ssr.external needs no regex.
 */
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

/** Manifest produced by Deno dependency pre-resolution. */
export interface ExternalManifest {
  /** Complete list of bare specifiers to mark as external. */
  specifiers: string[];
  /** Redirect map (bare specifier → npm: URL) for importmap generation. */
  importMap: Record<string, string>;
  /** ISO timestamp of generation. */
  generatedAt: string;
  /** SHA-256 hash prefix of deno.lock at time of generation. */
  lockHash: string;
}

interface DenoInfoModule {
  specifier: string;
  error?: string;
}

interface DenoInfoOutput {
  modules: DenoInfoModule[];
  roots: string[];
  redirects?: Record<string, string>;
}

/** Fallback regex patterns for packages that are known to have subpath exports. */
const FALLBACK_REGEX_MAP: Record<string, string> = {
  parse5: '/^parse5(\\/|$)/',
  entities: '/^entities(\\/|$)/',
};

/**
 * Compute a stable hash of deno.lock for cache invalidation.
 * Returns 'no-lock' if deno.lock doesn't exist.
 */
function computeLockHash(projectRoot: string): string {
  const lockPath = join(projectRoot, 'deno.lock');
  if (!existsSync(lockPath)) return 'no-lock';
  const content = readFileSync(lockPath, 'utf-8');
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Read a cached manifest from .less/external-manifest.json.
 * Returns null if the cache is stale (lock hash mismatch) or missing.
 */
function readCachedManifest(projectRoot: string, lockHash: string): ExternalManifest | null {
  const cachePath = join(projectRoot, '.less', 'external-manifest.json');
  if (!existsSync(cachePath)) return null;
  try {
    const cached = JSON.parse(readFileSync(cachePath, 'utf-8')) as ExternalManifest;
    if (cached.lockHash === lockHash && cached.specifiers?.length > 0) {
      return cached; // Cache hit — lock unchanged, deps stable
    }
  } catch {
    /* stale/corrupt cache — treat as miss */
  }
  return null;
}

/**
 * Write the manifest cache to .less/external-manifest.json.
 */
function writeCachedManifest(projectRoot: string, manifest: ExternalManifest): void {
  const dir = join(projectRoot, '.less');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'external-manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
}

/**
 * ADR-0047: Parse `deno info --json` output to extract all specifiers belonging
 * to external packages. This eliminates the need for regex-based external matching
 * that leaks ESM subpaths into Rolldown.
 */
export function extractExternalSpecifiers(
  denoInfo: DenoInfoOutput,
  externalPackages: string[],
): string[] {
  const specifiers = new Set<string>();

  for (const mod of denoInfo.modules) {
    if (mod.error) continue;
    const spec = mod.specifier;
    // Only process npm: specifiers — these are the ones Rolldown chokes on.
    if (!spec.startsWith('npm:')) continue;

    for (const pkg of externalPackages) {
      // Match: npm:pkg@..., npm:pkg@.../sub/path, npm:pkg/sub/path
      if (
        spec === `npm:${pkg}` ||
        spec.startsWith(`npm:${pkg}@`) ||
        spec.startsWith(`npm:${pkg}/`)
      ) {
        // Strip npm: prefix to get the bare specifier Rolldown expects.
        const bare = spec.replace(/^npm:/, '');
        // Strip version tag to get clean bare specifier:
        //   entities@^4/lib/escape.js → entities/lib/escape.js
        const clean = bare.replace(/@[^/]+/, '');
        specifiers.add(clean);
      }
    }
  }

  return [...specifiers].sort();
}

/**
 * Build a fallback manifest using regex patterns (current behavior).
 * Used when Deno is unavailable or skipResolution is true.
 */
export function buildFallbackManifest(externalPackages: string[]): ExternalManifest {
  const specifiers = externalPackages.flatMap((pkg) => {
    if (FALLBACK_REGEX_MAP[pkg]) return [pkg]; // regex handles subpaths
    return [pkg];
  });

  return {
    specifiers,
    importMap: {}, // Fallback skips importmap generation
    generatedAt: new Date().toISOString(),
    lockHash: 'fallback',
  };
}

/**
 * Build importmap entries from Deno redirects.
 * Only includes redirects that point to npm: URLs.
 */
function buildImportMapFromRedirects(
  output: DenoInfoOutput,
  _externalPackages: string[],
): Record<string, string> {
  const importMap: Record<string, string> = {};

  if (output.redirects) {
    for (const [key, value] of Object.entries(output.redirects)) {
      // Only include redirects that start with npm:
      if (value.startsWith('npm:')) {
        importMap[key] = value;
      }
    }
  }

  return importMap;
}

/**
 * Resolve the complete external dependency manifest using Deno module graph.
 *
 * Flow:
 * 1. Check cache (.less/external-manifest.json by deno.lock hash)
 * 2. If cache miss: write temp probe module, run `deno info --json`, parse
 * 3. Fallback to regex if Deno is unavailable
 */
export async function resolveExternalManifest(
  externalPackages: string[],
  projectRoot: string,
  skipResolution = false,
): Promise<ExternalManifest> {
  const lockHash = computeLockHash(projectRoot);

  // Cache hit?
  if (!skipResolution) {
    const cached = readCachedManifest(projectRoot, lockHash);
    if (cached) return cached;
  }

  if (skipResolution) {
    return buildFallbackManifest(externalPackages);
  }

  // Try Deno pre-resolution
  try {
    const probeCode = externalPackages
      .map((pkg) => `import '${pkg}';`)
      .join('\n');
    const probePath = join(projectRoot, '.less', '.external-probe.ts');

    mkdirSync(join(projectRoot, '.less'), { recursive: true });
    writeFileSync(probePath, probeCode, 'utf-8');

    const { execSync } = await import('node:child_process');
    const deno = execSync(
      `deno info --json "${probePath}"`,
      { cwd: projectRoot, maxBuffer: 10 * 1024 * 1024, timeout: 15000 },
    );

    unlinkSync(probePath);
    const output: DenoInfoOutput = JSON.parse(deno.toString());

    const specifiers = extractExternalSpecifiers(output, externalPackages);
    const importMap = buildImportMapFromRedirects(output, externalPackages);

    const manifest: ExternalManifest = {
      specifiers,
      importMap,
      generatedAt: new Date().toISOString(),
      lockHash,
    };

    writeCachedManifest(projectRoot, manifest);
    return manifest;
  } catch (_err) {
    // Deno not available or failed — fallback to regex
    const fallback = buildFallbackManifest(externalPackages);
    return fallback;
  }
}
