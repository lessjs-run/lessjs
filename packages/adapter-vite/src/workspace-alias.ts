/**
 * @lessjs/adapter-vite - Workspace alias auto-generation
 *
 * Reads Deno workspace deno.json exports and generates
 * Vite resolve.alias entries. Used by build-client and build-ssg
 * to resolve @lessjs/* packages when rolldown doesn't support
 * Deno workspace resolution natively.
 */

import { resolve } from 'node:path';

export interface AliasEntry {
  find: string;
  replacement: string;
}

/**
 * Walk up from startDir to find a deno.json with a "workspace" field.
 */
export async function findWorkspaceRoot(startDir: string): Promise<string | null> {
  let dir = resolve(startDir);
  const fsRoot = resolve('/');
  while (dir !== fsRoot && dir !== resolve(dir, '..')) {
    try {
      const cfg = JSON.parse(await Deno.readTextFile(resolve(dir, 'deno.json')));
      if (cfg.workspace && Array.isArray(cfg.workspace)) return dir;
    } catch { /* not found or no workspace */ }
    dir = resolve(dir, '..');
  }
  return null;
}

/**
 * Generate Vite resolve.alias from workspace packages' deno.json exports.
 * Subpath aliases come before parent (Vite prefix matching rule).
 */
export async function generateWorkspaceAliases(workspaceRoot: string): Promise<AliasEntry[]> {
  const rootCfg = JSON.parse(await Deno.readTextFile(resolve(workspaceRoot, 'deno.json')));
  const members: string[] = rootCfg.workspace || [];
  const aliases: AliasEntry[] = [];

  for (const member of members) {
    const memberDir = resolve(workspaceRoot, member);
    let memberCfg: Record<string, unknown>;
    try {
      memberCfg = JSON.parse(await Deno.readTextFile(resolve(memberDir, 'deno.json')));
    } catch {
      continue;
    }
    const name = memberCfg.name as string | undefined;
    const exports = memberCfg.exports as Record<string, string> | string | undefined;
    if (!name || !exports) continue;

    if (typeof exports === 'string') {
      aliases.push({ find: name, replacement: resolve(memberDir, exports) });
      continue;
    }

    // Subpath aliases first (Vite prefix matching)
    for (const [exportPath, sourcePath] of Object.entries(exports)) {
      if (exportPath === '.') continue;
      const subpath = exportPath.replace(/^\.\//, '/');
      aliases.push({
        find: `${name}${subpath}`,
        replacement: resolve(memberDir, sourcePath as string),
      });
    }
    // Parent alias last
    if (exports['.']) {
      aliases.push({ find: name, replacement: resolve(memberDir, exports['.'] as string) });
    }
  }
  return aliases;
}
