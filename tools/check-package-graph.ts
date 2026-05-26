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
}

interface PublishStep {
  pkg: string;
  dir: string;
  index: number;
}

// ─── Read publish.yml publish order ───────────────────────────

async function readPublishOrder(): Promise<PublishStep[]> {
  const content = await Deno.readTextFile('.github/workflows/publish.yml');
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

  return { name, version, deps };
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

  for (const node of allNodes) {
    inDegree.set(node, 0);
  }

  for (const [_node, deps] of graph) {
    for (const dep of deps) {
      // Only count edges to nodes that exist in the graph
      if (nodeSet.has(dep)) {
        inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1);
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

    const neighbors = graph.get(node) ?? [];
    for (const neighbor of neighbors) {
      if (!nodeSet.has(neighbor)) continue;
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
