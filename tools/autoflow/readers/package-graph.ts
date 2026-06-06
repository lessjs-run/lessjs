/**
 * Package graph reader — reads deno.json workspace + package versions.
 */

export interface PackageGraphData {
  packageCount: number;
  packages: PackageInfo[];
  allAligned: boolean;
  expectedVersion: string;
  mismatched: PackageInfo[];
}

export interface PackageInfo {
  name: string;
  version: string;
  path: string;
}

function readJsonConfig(path: string): Record<string, unknown> | null {
  try {
    const raw = Deno.readTextFileSync(path);
    // Strip line comments (JSONC support — deno.json may contain // comments)
    const stripped = raw.replace(/^\s*\/\/.*$/gm, '');
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readPackageInfo(rootDir: string, pkgPath: string): PackageInfo | null {
  const config = readJsonConfig(`${rootDir}/${pkgPath}/deno.json`);
  if (!config) return null;
  const name = config.name as string | undefined;
  const version = config.version as string | undefined;
  if (name && version) {
    return { name, version, path: pkgPath };
  }
  return null;
}

export function readPackageGraph(rootDir: string, expectedVersion: string): PackageGraphData {
  // Read workspace config from root deno.json
  const config = readJsonConfig(`${rootDir}/deno.json`);
  const workspace = (config?.['workspace'] as string[]) ?? [];

  if (!config || workspace.length === 0) {
    return { packageCount: 0, packages: [], allAligned: false, expectedVersion, mismatched: [] };
  }

  // Resolve workspace members to package directories
  const packages: PackageInfo[] = [];

  for (const member of workspace) {
    // member is like "./packages/*" or "./packages/core"
    const clean = member.replace(/^\.\//, '');

    if (clean.endsWith('/*')) {
      // Glob pattern: scan directory for subdirectories with deno.json
      const baseDir = clean.replace(/\/\*$/, '');
      const fullDir = `${rootDir}/${baseDir}`;

      let entries: Deno.DirEntry[];
      try {
        entries = [...Deno.readDirSync(fullDir)];
      } catch {
        continue;
      }

      for (const entry of entries) {
        if (!entry.isDirectory) continue;
        const info = readPackageInfo(rootDir, `${baseDir}/${entry.name}`);
        if (info) packages.push(info);
      }
    } else {
      // Explicit path
      const info = readPackageInfo(rootDir, clean);
      if (info) packages.push(info);
    }
  }

  const mismatched = packages.filter((p) => {
    // Normalize: strip leading 'v' from versions for comparison
    const pkgVer = p.version.replace(/^v/, '');
    const expVer = expectedVersion.replace(/^v/, '');
    return pkgVer !== expVer;
  });
  const allAligned = mismatched.length === 0 && packages.length > 0;

  return {
    packageCount: packages.length,
    packages,
    allAligned,
    expectedVersion,
    mismatched,
  };
}
