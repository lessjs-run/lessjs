type PackageInfo = {
  dir: string;
  name: string;
  version: string;
  imports: Record<string, string>;
  deps: Set<string>;
};

const packageRoot = new URL('../packages/', import.meta.url);
const packageDirs: string[] = [];

for await (const entry of Deno.readDir(packageRoot)) {
  if (!entry.isDirectory) continue;
  try {
    await Deno.stat(new URL(`${entry.name}/deno.json`, packageRoot));
    packageDirs.push(entry.name);
  } catch {
    // Not a publishable package.
  }
}

packageDirs.sort();

const packages = new Map<string, PackageInfo>();

for (const dir of packageDirs) {
  const denoJsonUrl = new URL(`${dir}/deno.json`, packageRoot);
  const json = JSON.parse(await Deno.readTextFile(denoJsonUrl)) as {
    name: string;
    version: string;
    imports?: Record<string, string>;
  };
  if (!json.name?.startsWith('@lessjs/')) continue;

  const info: PackageInfo = {
    dir,
    name: json.name,
    version: json.version,
    imports: json.imports ?? {},
    deps: new Set(),
  };

  packages.set(info.name, info);
}

const errors: string[] = [];
const versions = new Set(Array.from(packages.values(), (pkg) => pkg.version));

if (versions.size !== 1) {
  errors.push(
    `All LessJS packages must share one version; found ${Array.from(versions).join(', ')}`,
  );
}

function ownerOfSpecifier(specifier: string): string | null {
  const parts = specifier.split('/');
  if (parts.length < 2 || parts[0] !== '@lessjs') return null;
  return `${parts[0]}/${parts[1]}`;
}

function normalizeDeclared(specifier: string): string {
  return specifier.replace(/\/$/, '');
}

for (const pkg of packages.values()) {
  const declaredOwners = new Set<string>();
  for (const specifier of Object.keys(pkg.imports)) {
    const owner = ownerOfSpecifier(normalizeDeclared(specifier));
    if (owner && owner !== pkg.name) declaredOwners.add(owner);
  }
  pkg.deps = declaredOwners;

  for (const dep of declaredOwners) {
    const target = packages.get(dep);
    if (!target) {
      errors.push(`${pkg.name} declares dependency on unknown package ${dep}`);
      continue;
    }
    const constraints = Object.entries(pkg.imports)
      .filter(([specifier]) => ownerOfSpecifier(normalizeDeclared(specifier)) === dep)
      .map(([, value]) => value);
    for (const constraint of constraints) {
      const expected = `jsr:${dep}@^${pkg.version}`;
      const expectedSubpathPrefix = `${expected}/`;
      if (
        constraint.startsWith(`jsr:${dep}@`) &&
        constraint !== expected &&
        !constraint.startsWith(expectedSubpathPrefix)
      ) {
        errors.push(`${pkg.name} imports ${constraint}; expected ${expected}`);
      }
    }
  }
}

const importRegex =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"](@lessjs\/[^'"]+)['"]|import\s*\(\s*['"](@lessjs\/[^'"]+)['"]\s*\)/g;

for (const pkg of packages.values()) {
  const srcUrl = new URL(`${pkg.dir}/src/`, packageRoot);
  try {
    for await (const file of walkTsFiles(srcUrl)) {
      const text = await Deno.readTextFile(file.url);
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        if (!canContainRealImport(line)) continue;
        for (const match of line.matchAll(importRegex)) {
          const specifier = match[1] ?? match[2];
          const owner = ownerOfSpecifier(specifier);
          if (!owner || owner === pkg.name) continue;
          if (!pkg.deps.has(owner)) {
            errors.push(
              `${pkg.name} imports ${specifier} in ${file.path} but does not declare ${owner} in deno.json`,
            );
          }
        }
      }
    }
  } catch {
    // Packages without src are ignored.
  }
}

function canContainRealImport(line: string): boolean {
  const trimmed = line.trim();
  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('"') ||
    trimmed.startsWith("'") ||
    trimmed.startsWith('`')
  ) {
    return false;
  }
  return (
    trimmed.startsWith('import ') ||
    trimmed.startsWith('export ') ||
    /\bimport\s*\(\s*['"]@lessjs\//.test(trimmed)
  );
}

const cycle = findCycle(packages);
if (cycle) {
  errors.push(`LessJS package dependency cycle: ${cycle.join(' -> ')}`);
}

if (errors.length > 0) {
  console.error(errors.map((error) => `error: ${error}`).join('\n'));
  Deno.exit(1);
}

const order = topoSort(packages);
console.log(`Package graph check passed (${packages.size} packages).`);
console.log(`Publish order: ${order.join(' -> ')}`);

async function* walkTsFiles(
  root: URL,
  prefix = '',
): AsyncGenerator<{ url: URL; path: string }> {
  for await (const entry of Deno.readDir(root)) {
    const childUrl = new URL(`${entry.name}${entry.isDirectory ? '/' : ''}`, root);
    const childPath = `${prefix}${entry.name}`;
    if (entry.isDirectory) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      yield* walkTsFiles(childUrl, `${childPath}/`);
    } else if (entry.isFile && childPath.endsWith('.ts')) {
      yield { url: childUrl, path: childPath };
    }
  }
}

function findCycle(graph: Map<string, PackageInfo>): string[] | null {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function visit(name: string): string[] | null {
    if (visited.has(name)) return null;
    if (visiting.has(name)) {
      const index = stack.indexOf(name);
      return [...stack.slice(index), name];
    }
    visiting.add(name);
    stack.push(name);
    for (const dep of graph.get(name)?.deps ?? []) {
      if (!graph.has(dep)) continue;
      const cycle = visit(dep);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(name);
    visited.add(name);
    return null;
  }

  for (const name of graph.keys()) {
    const cycle = visit(name);
    if (cycle) return cycle;
  }
  return null;
}

function topoSort(graph: Map<string, PackageInfo>): string[] {
  const visited = new Set<string>();
  const order: string[] = [];

  function visit(name: string): void {
    if (visited.has(name)) return;
    visited.add(name);
    const deps = Array.from(graph.get(name)?.deps ?? []).sort();
    for (const dep of deps) {
      if (graph.has(dep)) visit(dep);
    }
    order.push(name);
  }

  for (const name of Array.from(graph.keys()).sort()) {
    visit(name);
  }
  return order;
}
