/**
 * Run package-scoped release tasks in dependency order.
 *
 * This is intentionally small and graph-driven: root deno.json should not carry
 * a hand-maintained 19-package publish or typecheck chain.
 */

interface PackageInfo {
  name: string;
  version: string;
  dir: string;
  deps: string[];
  exports: unknown;
}

const COMMANDS = new Set(['typecheck', 'publish', 'publish:dry-run']);

function normalizeDep(specifier: string, self: string): string | null {
  const prefix = '@openelement/';
  if (!specifier.startsWith(prefix)) return null;
  const rest = specifier.slice(prefix.length);
  const slashIndex = rest.indexOf('/');
  const base = slashIndex === -1 ? specifier : prefix + rest.slice(0, slashIndex);
  return base === self ? null : base;
}

async function readPackage(dir: string): Promise<PackageInfo | null> {
  const path = `${dir}/deno.json`;
  try {
    const json = JSON.parse(await Deno.readTextFile(path));
    if (!json.name) return null;
    const imports: Record<string, string> = json.imports ?? {};
    const deps = Object.keys(imports)
      .map((specifier) => normalizeDep(specifier, json.name))
      .filter((specifier): specifier is string => specifier !== null);
    return {
      name: json.name,
      version: json.version ?? '',
      dir,
      deps: [...new Set(deps)],
      exports: json.exports,
    };
  } catch {
    return null;
  }
}

async function readPackages(): Promise<PackageInfo[]> {
  const packages: PackageInfo[] = [];
  for await (const entry of Deno.readDir('packages')) {
    if (!entry.isDirectory) continue;
    const info = await readPackage(`packages/${entry.name}`);
    if (info) packages.push(info);
  }
  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

function sortPackages(packages: PackageInfo[]): PackageInfo[] {
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const inDegree = new Map(packages.map((pkg) => [pkg.name, 0]));
  const dependents = new Map(packages.map((pkg) => [pkg.name, [] as string[]]));

  for (const pkg of packages) {
    for (const dep of pkg.deps) {
      if (!byName.has(dep)) continue;
      inDegree.set(pkg.name, (inDegree.get(pkg.name) ?? 0) + 1);
      dependents.get(dep)!.push(pkg.name);
    }
  }

  const queue = packages
    .filter((pkg) => inDegree.get(pkg.name) === 0)
    .map((pkg) => pkg.name)
    .sort();
  const sorted: PackageInfo[] = [];

  while (queue.length > 0) {
    const name = queue.shift()!;
    sorted.push(byName.get(name)!);
    for (const dependent of dependents.get(name) ?? []) {
      const next = (inDegree.get(dependent) ?? 1) - 1;
      inDegree.set(dependent, next);
      if (next === 0) {
        queue.push(dependent);
        queue.sort();
      }
    }
  }

  if (sorted.length !== packages.length) {
    const unresolved = packages
      .map((pkg) => pkg.name)
      .filter((name) => !sorted.some((pkg) => pkg.name === name));
    throw new Error(`Package graph has a cycle or unresolved nodes: ${unresolved.join(', ')}`);
  }

  return sorted;
}

async function readWorkflowPublishOrder(): Promise<string[] | null> {
  try {
    const content = await Deno.readTextFile('.github/workflows/publish-jsr.yml');
    const order: string[] = [];
    for (const line of content.split('\n')) {
      const match = line.match(/publish_if_missing\s+"([^"]+)"/);
      if (match) order.push(match[1]);
    }
    return order.length > 0 ? order : null;
  } catch {
    return null;
  }
}

async function orderForRelease(packages: PackageInfo[]): Promise<PackageInfo[]> {
  const topo = sortPackages(packages);
  const workflowOrder = await readWorkflowPublishOrder();
  if (!workflowOrder) return topo;

  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  if (workflowOrder.length !== packages.length || workflowOrder.some((name) => !byName.has(name))) {
    throw new Error(
      'GitHub publish workflow package list no longer matches packages/*/deno.json. ' +
        'Run deno task graph:check for details.',
    );
  }

  const ordered = workflowOrder.map((name) => byName.get(name)!);
  assertDependencyFirst(ordered);
  return ordered;
}

function assertDependencyFirst(packages: PackageInfo[]): void {
  const position = new Map(packages.map((pkg, index) => [pkg.name, index]));
  for (const pkg of packages) {
    for (const dep of pkg.deps) {
      const depIndex = position.get(dep);
      if (depIndex === undefined) continue;
      if (depIndex > position.get(pkg.name)!) {
        throw new Error(
          `Package publish order is invalid: ${pkg.name} appears before dependency ${dep}.`,
        );
      }
    }
  }
}

function exportEntries(pkg: PackageInfo): string[] {
  if (typeof pkg.exports === 'string') return [pkg.exports];
  if (!pkg.exports || typeof pkg.exports !== 'object') return [];
  const entries = Object.values(pkg.exports as Record<string, unknown>)
    .filter((value): value is string => typeof value === 'string')
    .filter((value) => value.endsWith('.ts') || value.endsWith('.tsx'));
  return [...new Set(entries)];
}

async function runCommand(
  command: string,
  args: string[],
  cwd?: string,
): Promise<void> {
  console.log(`$ ${[command, ...args].join(' ')}${cwd ? `  # cwd=${cwd}` : ''}`);
  const proc = new Deno.Command(command, {
    args,
    cwd,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await proc.spawn().status;
  if (!status.success) {
    throw new Error(`Command failed with exit code ${status.code}: ${command} ${args.join(' ')}`);
  }
}

async function typecheckPackage(pkg: PackageInfo): Promise<void> {
  const entries = exportEntries(pkg);
  if (entries.length === 0) {
    console.log(`[typecheck] ${pkg.name}: skipped, no TS exports`);
    return;
  }
  const rootEntries = entries.map((entry) => `${pkg.dir}/${entry.replace(/^\.\//, '')}`);
  await runCommand('deno', ['check', ...rootEntries]);
}

async function publishPackage(pkg: PackageInfo, dryRun: boolean): Promise<void> {
  const args = ['publish', '-c', 'deno.json'];
  if (dryRun) args.push('--dry-run', '--allow-dirty');
  await runCommand('deno', args, pkg.dir);
}

function assertVersionConsistency(packages: PackageInfo[]): void {
  const versions = new Map<string, string[]>();
  for (const pkg of packages) {
    const list = versions.get(pkg.version) ?? [];
    list.push(pkg.name);
    versions.set(pkg.version, list);
  }
  if (versions.size <= 1) return;
  const lines = [...versions.entries()].map(([version, names]) =>
    `  ${version || '<missing>'}: ${names.join(', ')}`
  );
  throw new Error(`Package versions are not consistent:\n${lines.join('\n')}`);
}

async function main(): Promise<void> {
  const [command] = Deno.args;
  if (!COMMANDS.has(command)) {
    throw new Error(
      `Usage: deno run --allow-read --allow-run tools/run-package-graph-task.ts ${
        [...COMMANDS].join('|')
      }`,
    );
  }

  const allPackages = await readPackages();
  const packages = command.startsWith('publish')
    ? await orderForRelease(allPackages)
    : sortPackages(allPackages);
  if (packages.length === 0) throw new Error('No packages found under packages/.');
  console.log(
    `[graph-task] ${command}: ${packages.length} packages in dependency order: ${
      packages.map((pkg) => pkg.name).join(' -> ')
    }`,
  );

  if (command.startsWith('publish')) {
    assertVersionConsistency(packages);
  }

  for (const pkg of packages) {
    if (command === 'typecheck') {
      await typecheckPackage(pkg);
    } else {
      await publishPackage(pkg, command === 'publish:dry-run');
    }
  }

  if (command === 'typecheck') {
    await runCommand('deno', ['check', 'www/vite.config.ts', 'www/e2e/playwright.config.ts']);
  }
}

await main();
