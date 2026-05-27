/**
 * check-package-graph.ts
 *
 * Validates the LessJS package dependency graph:
 * 1. Reads all packages/{name}/deno.json to extract name, version, and imports.
 * 2. Builds a dependency graph (internal deps = imports starting with "@lessjs/").
 * 3. Detects circular dependencies.
 * 4. Compares topological sort order against .github/workflows/publish.yml.
 * 5. Outputs all package versions for release verification.
 *
 * Usage: deno run --allow-read tools/check-package-graph.ts
 */

// ─── Types ────────────────────────────────────────────────────

interface PackageInfo {
  name: string;
  version: string;
  deps: string[];
  dir: string;
  importKeys: Set<string>;
}

interface PublishStep {
  pkg: string;
  dir: string;
  index: number;
}

// ─── Read publish.yml publish order ───────────────────────────

async function readPublishOrder(): Promise<PublishStep[]> {
  const content = await Deno.readTextFile('.github/workflows/publish-jsr.yml');
  const steps: PublishStep[] = [];
  let index = 0;

  for (const line of content.split('\n')) {
    const match = line.match(/publish_if_missing\s+"([^"]+)"\s+"([^"]+)"/);
    if (match) {
      steps.push({ pkg: match[1], dir: match[2], index: index++ });
    }
  }

  return steps;
}

// ─── Read package info from deno.json ─────────────────────────

async function readPackageInfo(dir: string): Promise<PackageInfo | null> {
  const denoJsonPath = `${dir}/deno.json`;
  let raw: string;
  try {
    raw = await Deno.readTextFile(denoJsonPath);
  } catch {
    return null;
  }

  const json = JSON.parse(raw);
  const name: string = json.name ?? '';
  const version: string = json.version ?? '';
  const imports: Record<string, string> = json.imports ?? {};

  // Internal dependencies are imports whose key starts with "@lessjs/"
  const deps: string[] = [];
  for (const key of Object.keys(imports)) {
    if (key.startsWith('@lessjs/')) {
      deps.push(key);
    }
  }

  return { name, version, deps, dir, importKeys: new Set(Object.keys(imports)) };
}

// ─── Normalize subpath imports to base package names ──────────

/**
 * Normalize a dependency key like "@lessjs/core/logger" to its base
 * package name "@lessjs/core". Self-references are dropped.
 */
function normalizeDep(dep: string, self: string): string | null {
  // After "@lessjs/", find the second "/" to extract the base package
  const prefix = '@lessjs/';
  if (!dep.startsWith(prefix)) return dep; // not internal, keep as-is

  const rest = dep.slice(prefix.length);
  const slashIdx = rest.indexOf('/');
  if (slashIdx === -1) {
    // "@lessjs/core" → base is "@lessjs/core"
    return dep;
  }

  // "@lessjs/core/logger" → base is "@lessjs/core"
  const base = prefix + rest.slice(0, slashIdx);

  // Drop self-references (a package depending on its own subpath)
  if (base === self) return null;

  return base;
}

// ─── Build dependency graph ───────────────────────────────────

function buildGraph(packages: PackageInfo[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const pkg of packages) {
    const normalized = pkg.deps
      .map((d) => normalizeDep(d, pkg.name))
      .filter((d): d is string => d !== null);
    // Deduplicate
    graph.set(pkg.name, [...new Set(normalized)]);
  }
  return graph;
}

// ─── Detect cycles via DFS ────────────────────────────────────

function detectCycles(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          cycle.push(neighbor);
          cycles.push(cycle);
        }
      }
    }

    recStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

// ─── Topological sort (Kahn's algorithm) ──────────────────────

function topologicalSort(graph: Map<string, string[]>): string[] {
  const inDegree = new Map<string, number>();
  const allNodes = [...graph.keys()];
  const nodeSet = new Set(allNodes);
  const dependents = new Map<string, string[]>();

  for (const node of allNodes) {
    inDegree.set(node, 0);
    dependents.set(node, []);
  }

  for (const [node, deps] of graph) {
    for (const dep of deps) {
      // graph stores package -> dependency. For dependency-first topological
      // order, the package has incoming edges from its dependencies.
      if (nodeSet.has(dep)) {
        inDegree.set(node, (inDegree.get(node) ?? 0) + 1);
        dependents.get(dep)!.push(node);
      }
    }
  }

  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) {
      queue.push(node);
    }
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    // Sort for determinism
    queue.sort();
    const node = queue.shift()!;
    sorted.push(node);

    const neighbors = dependents.get(node) ?? [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sorted.length !== allNodes.length) {
    const remaining = allNodes.filter((n) => !sorted.includes(n));
    throw new Error(
      `Graph has a cycle involving: ${remaining.join(', ')}. ` +
        `Sorted ${sorted.length}/${allNodes.length} nodes.`,
    );
  }

  return sorted;
}

async function collectTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(current: string): Promise<void> {
    for await (const entry of Deno.readDir(current)) {
      const path = `${current}/${entry.name}`;
      if (entry.isDirectory) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        await walk(path);
      } else if (entry.isFile && path.endsWith('.ts')) {
        files.push(path);
      }
    }
  }

  try {
    await walk(dir);
  } catch {
    // Packages without src are allowed; they simply produce no files.
  }

  return files;
}

function collectImportStatements(source: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inBlockComment = false;
  let inTemplate = false;

  for (const rawLine of source.split('\n')) {
    let line = '';

    for (let i = 0; i < rawLine.length; i++) {
      const char = rawLine[i];
      const next = rawLine[i + 1];

      if (inBlockComment) {
        if (char === '*' && next === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }

      if (inTemplate) {
        if (char === '`' && rawLine[i - 1] !== '\\') {
          inTemplate = false;
        }
        continue;
      }

      if (char === '/' && next === '*') {
        inBlockComment = true;
        i++;
        continue;
      }

      if (char === '/' && next === '/') {
        break;
      }

      if (char === '`') {
        inTemplate = true;
        continue;
      }

      line += char;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    const startsImportExport = /^(import|export)\b/.test(trimmed);
    const dynamicImportIndex = trimmed.search(/\bimport\s*\(/);
    const firstQuoteIndex = trimmed.search(/['"`]/);
    const hasDynamicImport = dynamicImportIndex !== -1 &&
      (firstQuoteIndex === -1 || firstQuoteIndex > dynamicImportIndex);

    if (!current && !startsImportExport && !hasDynamicImport) {
      continue;
    }

    current += `${trimmed}\n`;
    if (trimmed.endsWith(';') || (hasDynamicImport && /\)\s*(?:as\b.*)?;?$/.test(trimmed))) {
      statements.push(current);
      current = '';
    }
  }

  if (current) {
    statements.push(current);
  }

  return statements;
}

function extractLessImports(source: string): string[] {
  const imports = new Set<string>();
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^'"]+?\s+from\s+)?['"](@lessjs\/[^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?[^'"]+?\s+from\s+['"](@lessjs\/[^'"]+)['"]/g,
    /\bimport\s*\(\s*['"](@lessjs\/[^'"]+)['"]\s*\)/g,
  ];

  for (const statement of collectImportStatements(source)) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      for (const match of statement.matchAll(pattern)) {
        imports.add(match[1]);
      }
    }
  }

  return [...imports];
}

function isDeclaredImport(specifier: string, pkg: PackageInfo): boolean {
  const base = normalizeDep(specifier, pkg.name);
  if (base === null) return true;
  return pkg.importKeys.has(specifier) || pkg.importKeys.has(base);
}

// ─── Main ─────────────────────────────────────────────────────

async function main(): Promise<void> {
  const failures: string[] = [];

  // 1. Read publish order
  const publishSteps = await readPublishOrder();
  const publishOrder = publishSteps.map((s) => s.pkg);

  console.log(`Publish order (${publishOrder.length} packages):`);
  for (const step of publishSteps) {
    console.log(`  ${step.index + 1}. ${step.pkg} (${step.dir})`);
  }

  // 2. Read all package deno.json files
  const packagesDir = 'packages';
  const packageDirs: string[] = [];
  for await (const entry of Deno.readDir(packagesDir)) {
    if (entry.isDirectory) {
      packageDirs.push(`${packagesDir}/${entry.name}`);
    }
  }
  packageDirs.sort();

  const packages: PackageInfo[] = [];
  for (const dir of packageDirs) {
    const info = await readPackageInfo(dir);
    if (info && info.name) {
      packages.push(info);
    }
  }

  console.log(`\nRead ${packages.length} packages:`);
  for (const pkg of packages) {
    console.log(`  ${pkg.name}@${pkg.version} → deps: [${pkg.deps.join(', ') || 'none'}]`);
  }

  // 3. Build graph
  const graph = buildGraph(packages);

  // 4. Detect cycles
  console.log('\n--- Cycle Detection ---');
  const cycles = detectCycles(graph);
  if (cycles.length > 0) {
    for (const cycle of cycles) {
      const msg = `Circular dependency detected: ${cycle.join(' → ')}`;
      console.error(`  FAIL: ${msg}`);
      failures.push(msg);
    }
  } else {
    console.log('  PASS: No circular dependencies found.');
  }

  // 4b. Check source imports are declared by each package deno.json.
  console.log('\n--- Source Import Declarations ---');
  for (const pkg of packages) {
    const srcDir = `${pkg.dir}/src`;
    const sourceFiles = await collectTsFiles(srcDir);
    for (const file of sourceFiles) {
      const source = await Deno.readTextFile(file);
      for (const specifier of extractLessImports(source)) {
        if (!isDeclaredImport(specifier, pkg)) {
          const msg =
            `${file} imports "${specifier}" but ${pkg.dir}/deno.json does not declare it.`;
          console.error(`  FAIL: ${msg}`);
          failures.push(msg);
        }
      }
    }
  }
  if (failures.length === 0) {
    console.log('  PASS: All source-level @lessjs/* imports are declared.');
  }

  // 5. Topological sort
  console.log('\n--- Topological Sort ---');
  let topoOrder: string[];
  try {
    topoOrder = topologicalSort(graph);
    console.log(`  Order: ${topoOrder.join(' → ')}`);
  } catch (err) {
    const msg = `Topological sort failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`  FAIL: ${msg}`);
    failures.push(msg);
    topoOrder = [];
  }

  // 6. Compare topo order with publish order
  if (topoOrder.length > 0) {
    console.log('\n--- Publish Order Validation ---');
    const topoIndex = new Map<string, number>();
    topoOrder.forEach((pkg, i) => topoIndex.set(pkg, i));

    // Build a quick lookup: for each package, what does it depend on?
    const pkgDeps = new Map(packages.map((p) => [p.name, p.deps]));

    // For each package in publish order, verify all its dependencies
    // appear before it in the publish order (or are not in publish order).
    const publishPos = new Map<string, number>();
    publishOrder.forEach((pkg, i) => publishPos.set(pkg, i));

    for (let i = 0; i < publishOrder.length; i++) {
      const pkg = publishOrder[i];
      const rawDeps = pkgDeps.get(pkg) ?? [];
      const normalizedDeps = rawDeps
        .map((d) => normalizeDep(d, pkg))
        .filter((d): d is string => d !== null);

      for (const dep of normalizedDeps) {
        const depPos = publishPos.get(dep);
        if (depPos !== undefined && depPos > i) {
          // dep appears AFTER pkg in publish order: violation
          const msg = `Publish order violation: "${pkg}" (pos ${i + 1}) depends on ` +
            `"${dep}" (pos ${depPos + 1}), but "${dep}" is published after "${pkg}".`;
          console.error(`  FAIL: ${msg}`);
          failures.push(msg);
        }
      }
    }

    // Also check for packages in publish order that are missing from the graph
    const graphNames = new Set(packages.map((p) => p.name));
    for (const pkg of publishOrder) {
      if (!graphNames.has(pkg)) {
        console.warn(`  WARN: "${pkg}" is in publish.yml but not found in packages/.`);
      }
    }

    // Every package with a publishable deno.json must be present in the
    // workflow order. Missing entries silently strand packages on old JSR
    // versions and break generated projects that depend on a unified version.
    const publishNames = new Set(publishOrder);
    for (const pkg of packages) {
      if (!publishNames.has(pkg.name)) {
        const msg = `"${pkg.name}" exists in packages/ but is missing from publish.yml.`;
        console.error(`  FAIL: ${msg}`);
        failures.push(msg);
      }
    }

    if (failures.length === 0) {
      console.log('  PASS: Publish order is consistent with dependency graph.');
    }
  }

  // 7. Output versions
  console.log('\n--- Package Versions ---');
  for (const pkg of packages) {
    console.log(`  ${pkg.name}@${pkg.version} (${pkg.deps.length} internal deps)`);
  }

  // 8. Result
  if (failures.length > 0) {
    console.error(`\n❌ Package graph check FAILED with ${failures.length} issue(s):`);
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    Deno.exit(1);
  }

  console.log(
    `\n✅ Package graph check passed (${packages.length} packages, ${publishOrder.length} publish steps).`,
  );
}

main();
