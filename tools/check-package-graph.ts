/**
 * Validate the openElement package dependency graph.
 *
 * Checks:
 * - all package deno.json files under packages/ are readable
 * - all package versions are on one release line
 * - internal jsr:@openelement/* specifiers point at that release line
 * - source-level @openelement/* imports are declared in each package deno.json
 * - no circular package dependencies exist
 * - publish-jsr.yml publishes every package after its dependencies
 */

import { PACKAGE_COUNT, PACKAGE_VERSION } from './project-constants.ts';

interface PackageInfo {
  name: string;
  version: string;
  deps: string[];
  dir: string;
  importKeys: Set<string>;
  importValues: Record<string, string>;
}

interface PublishStep {
  pkg: string;
  dir: string;
  index: number;
}

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

  const deps: string[] = [];
  for (const key of Object.keys(imports)) {
    if (key.startsWith('@openelement/')) deps.push(key);
  }

  return {
    name,
    version,
    deps,
    dir,
    importKeys: new Set(Object.keys(imports)),
    importValues: imports,
  };
}

function normalizeDep(dep: string, self: string): string | null {
  const prefix = '@openelement/';
  if (!dep.startsWith(prefix)) return dep;

  const rest = dep.slice(prefix.length);
  const slashIdx = rest.indexOf('/');
  const base = slashIdx === -1 ? dep : prefix + rest.slice(0, slashIdx);
  return base === self ? null : base;
}

function buildGraph(packages: PackageInfo[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const pkg of packages) {
    const normalized = pkg.deps
      .map((dep) => normalizeDep(dep, pkg.name))
      .filter((dep): dep is string => dep !== null);
    graph.set(pkg.name, [...new Set(normalized)]);
  }
  return graph;
}

function detectCycles(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recStack.has(neighbor)) {
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
    if (!visited.has(node)) dfs(node, []);
  }

  return cycles;
}

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
      if (nodeSet.has(dep)) {
        inDegree.set(node, (inDegree.get(node) ?? 0) + 1);
        dependents.get(dep)!.push(node);
      }
    }
  }

  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    queue.sort();
    const node = queue.shift()!;
    sorted.push(node);

    for (const neighbor of dependents.get(node) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== allNodes.length) {
    const remaining = allNodes.filter((node) => !sorted.includes(node));
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
    // Packages without src are allowed.
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
        if (char === '`' && rawLine[i - 1] !== '\\') inTemplate = false;
        continue;
      }

      if (char === '/' && next === '*') {
        inBlockComment = true;
        i++;
        continue;
      }

      if (char === '/' && next === '/') break;
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

    if (!current && !startsImportExport && !hasDynamicImport) continue;

    current += `${trimmed}\n`;
    if (trimmed.endsWith(';') || (hasDynamicImport && /\)\s*(?:as\b.*)?;?$/.test(trimmed))) {
      statements.push(current);
      current = '';
    }
  }

  if (current) statements.push(current);
  return statements;
}

function extractLessImports(source: string): string[] {
  const imports = new Set<string>();
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^'"]+?\s+from\s+)?['"](@openelement\/[^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?[^'"]+?\s+from\s+['"](@openelement\/[^'"]+)['"]/g,
    /\bimport\s*\(\s*['"](@openelement\/[^'"]+)['"]\s*\)/g,
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

function validateVersionConsistency(packages: PackageInfo[], failures: string[]): string | null {
  const versions = new Map<string, string[]>();
  for (const pkg of packages) {
    const list = versions.get(pkg.version) ?? [];
    list.push(pkg.name);
    versions.set(pkg.version, list);
  }

  if (versions.size !== 1) {
    for (const [version, names] of versions) {
      failures.push(`Package version ${version || '<missing>'}: ${names.join(', ')}`);
    }
    return null;
  }

  return packages[0]?.version ?? null;
}

function parseInternalJsrSpecifier(value: string): { packageName: string; version: string } | null {
  const match = value.match(/^jsr:(@openelement\/[^@/]+)@\^?(\d+\.\d+\.\d+)(?:\/.*)?$/);
  if (!match) return null;
  return { packageName: match[1], version: match[2] };
}

function validateInternalJsrRanges(
  packages: PackageInfo[],
  releaseVersion: string | null,
  failures: string[],
): void {
  if (!releaseVersion) return;
  for (const pkg of packages) {
    for (const [key, value] of Object.entries(pkg.importValues)) {
      if (!value.startsWith('jsr:@openelement/')) continue;
      const parsed = parseInternalJsrSpecifier(value);
      if (!parsed) {
        failures.push(
          `${pkg.dir}/deno.json import "${key}" has invalid internal JSR specifier: ${value}`,
        );
        continue;
      }
      if (parsed.version !== releaseVersion) {
        failures.push(
          `${pkg.dir}/deno.json import "${key}" points to ${parsed.packageName}@${parsed.version}; ` +
            `expected ${releaseVersion}.`,
        );
      }
    }
  }
}

async function main(): Promise<void> {
  const failures: string[] = [];

  const publishSteps = await readPublishOrder();
  const publishOrder = publishSteps.map((step) => step.pkg);

  console.log(`Publish order (${publishOrder.length} packages):`);
  for (const step of publishSteps) {
    console.log(`  ${step.index + 1}. ${step.pkg} (${step.dir})`);
  }

  const packageDirs: string[] = [];
  for await (const entry of Deno.readDir('packages')) {
    if (entry.isDirectory) packageDirs.push(`packages/${entry.name}`);
  }
  packageDirs.sort();

  const packages: PackageInfo[] = [];
  for (const dir of packageDirs) {
    const info = await readPackageInfo(dir);
    if (info?.name) packages.push(info);
  }

  console.log(`\nRead ${packages.length} packages:`);
  for (const pkg of packages) {
    console.log(`  ${pkg.name}@${pkg.version} -> deps: [${pkg.deps.join(', ') || 'none'}]`);
  }
  if (packages.length !== PACKAGE_COUNT) {
    failures.push(`Expected ${PACKAGE_COUNT} packages, found ${packages.length}.`);
  }

  console.log('\n--- Version Line Validation ---');
  const releaseVersion = validateVersionConsistency(packages, failures);
  if (releaseVersion && releaseVersion !== PACKAGE_VERSION) {
    failures.push(
      `Package graph version ${releaseVersion} does not match PACKAGE_VERSION ${PACKAGE_VERSION}.`,
    );
  }
  validateInternalJsrRanges(packages, releaseVersion, failures);
  if (releaseVersion) {
    console.log(`  PASS: all packages and internal JSR ranges use ${releaseVersion}.`);
  }

  const graph = buildGraph(packages);

  console.log('\n--- Cycle Detection ---');
  const cycles = detectCycles(graph);
  if (cycles.length > 0) {
    for (const cycle of cycles) {
      const msg = `Circular dependency detected: ${cycle.join(' -> ')}`;
      console.error(`  FAIL: ${msg}`);
      failures.push(msg);
    }
  } else {
    console.log('  PASS: No circular dependencies found.');
  }

  console.log('\n--- Source Import Declarations ---');
  const importFailuresBefore = failures.length;
  for (const pkg of packages) {
    const sourceFiles = await collectTsFiles(`${pkg.dir}/src`);
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
  if (failures.length === importFailuresBefore) {
    console.log('  PASS: All source-level @openelement/* imports are declared.');
  }

  console.log('\n--- Topological Sort ---');
  let topoOrder: string[] = [];
  try {
    topoOrder = topologicalSort(graph);
    console.log(`  Order: ${topoOrder.join(' -> ')}`);
  } catch (err) {
    const msg = `Topological sort failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`  FAIL: ${msg}`);
    failures.push(msg);
  }

  if (topoOrder.length > 0) {
    console.log('\n--- Publish Order Validation ---');
    const pkgDeps = new Map(packages.map((pkg) => [pkg.name, pkg.deps]));
    const publishPos = new Map<string, number>();
    publishOrder.forEach((pkg, index) => publishPos.set(pkg, index));

    for (let i = 0; i < publishOrder.length; i++) {
      const pkg = publishOrder[i];
      const normalizedDeps = (pkgDeps.get(pkg) ?? [])
        .map((dep) => normalizeDep(dep, pkg))
        .filter((dep): dep is string => dep !== null);

      for (const dep of normalizedDeps) {
        const depPos = publishPos.get(dep);
        if (depPos !== undefined && depPos > i) {
          const msg = `Publish order violation: "${pkg}" (pos ${i + 1}) depends on ` +
            `"${dep}" (pos ${depPos + 1}), but "${dep}" is published after "${pkg}".`;
          console.error(`  FAIL: ${msg}`);
          failures.push(msg);
        }
      }
    }

    const graphNames = new Set(packages.map((pkg) => pkg.name));
    for (const pkg of publishOrder) {
      if (!graphNames.has(pkg)) {
        const msg = `"${pkg}" is in publish-jsr.yml but not found in packages/.`;
        console.error(`  FAIL: ${msg}`);
        failures.push(msg);
      }
    }

    const publishNames = new Set(publishOrder);
    for (const pkg of packages) {
      if (!publishNames.has(pkg.name)) {
        const msg = `"${pkg.name}" exists in packages/ but is missing from publish-jsr.yml.`;
        console.error(`  FAIL: ${msg}`);
        failures.push(msg);
      }
    }

    if (failures.length === 0) {
      console.log('  PASS: Publish order is consistent with dependency graph.');
    }
  }

  console.log('\n--- Package Versions ---');
  for (const pkg of packages) {
    console.log(`  ${pkg.name}@${pkg.version} (${pkg.deps.length} internal deps)`);
  }

  if (failures.length > 0) {
    console.error(`\nPackage graph check FAILED with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    Deno.exit(1);
  }

  console.log(
    `\nPackage graph check passed (${packages.length} packages, ${publishOrder.length} publish steps).`,
  );
}

await main();
