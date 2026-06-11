/**
 * Run package-scoped release tasks in dependency order.
 *
 * This is intentionally small and graph-driven: root deno.json should not carry
 * a hand-maintained 19-package publish or typecheck chain.
 */

import { RELEASE_PACKAGE_ORDER } from './package-release-order.ts';

interface PackageInfo {
  name: string;
  version: string;
  dir: string;
  deps: string[];
  exports: unknown;
}

const COMMANDS = new Set(['typecheck', 'publish', 'publish:dry-run']);
const JSR_PUBLISH_TIMEOUT_MS = 5 * 60 * 1000;
const JSR_PROPAGATION_ATTEMPTS = 24;
const JSR_PROPAGATION_DELAY_MS = 5_000;
const JSR_METADATA_TIMEOUT_MS = 10_000;

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

function readReleasePublishOrder(): string[] {
  return RELEASE_PACKAGE_ORDER.map((step) => step.pkg);
}

function orderForRelease(packages: PackageInfo[]): PackageInfo[] {
  const releaseOrder = readReleasePublishOrder();

  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  if (releaseOrder.length !== packages.length || releaseOrder.some((name) => !byName.has(name))) {
    throw new Error(
      'Release package order no longer matches packages/*/deno.json. ' +
        'Run deno task graph:check for details.',
    );
  }

  const ordered = releaseOrder.map((name) => byName.get(name)!);
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

async function runCommandWithTimeout(
  command: string,
  args: string[],
  cwd: string | undefined,
  timeoutMs: number,
): Promise<{ success: boolean; code: number; timedOut: boolean }> {
  console.log(`$ ${[command, ...args].join(' ')}${cwd ? `  # cwd=${cwd}` : ''}`);
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const proc = new Deno.Command(command, {
      args,
      cwd,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
      signal: controller.signal,
    });
    const status = await proc.spawn().status;
    return { success: status.success, code: status.code, timedOut };
  } catch (err) {
    if (timedOut && err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, code: 1, timedOut: true };
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
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

async function jsrVersionExists(pkg: string, version: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), JSR_METADATA_TIMEOUT_MS);
  try {
    const response = await fetch(`https://jsr.io/${pkg}/${version}_meta.json`, {
      signal: controller.signal,
    });
    if (response.status === 404) return false;
    if (!response.ok) {
      throw new Error(
        `JSR metadata check failed for ${pkg}@${version}: HTTP ${response.status}`,
      );
    }
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        `JSR metadata check timed out for ${pkg}@${version} after ${
          JSR_METADATA_TIMEOUT_MS / 1000
        }s`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJsrVersion(pkg: PackageInfo): Promise<boolean> {
  for (let attempt = 1; attempt <= JSR_PROPAGATION_ATTEMPTS; attempt++) {
    try {
      if (await jsrVersionExists(pkg.name, pkg.version)) return true;
    } catch (err) {
      console.warn(
        `[publish] ${pkg.name}@${pkg.version}: JSR metadata check attempt ${attempt} failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    if (attempt < JSR_PROPAGATION_ATTEMPTS) {
      console.log(
        `[publish] ${pkg.name}@${pkg.version}: waiting for JSR propagation ` +
          `(${attempt}/${JSR_PROPAGATION_ATTEMPTS})`,
      );
      await sleep(JSR_PROPAGATION_DELAY_MS);
    }
  }
  return false;
}

async function assertCleanWorktree(): Promise<void> {
  const command = new Deno.Command('git', {
    args: ['status', '--porcelain'],
    stdout: 'piped',
    stderr: 'inherit',
  });
  const output = await command.output();
  if (!output.success) {
    throw new Error(`git status failed with exit code ${output.code}`);
  }

  const status = new TextDecoder().decode(output.stdout).trim();
  if (status) {
    console.error(status);
    throw new Error('Refusing to publish from a dirty worktree.');
  }
}

async function publishPackage(
  pkg: PackageInfo,
  dryRun: boolean,
): Promise<'dry-run' | 'skipped' | 'published' | 'recovered'> {
  const args = ['publish', '-c', 'deno.json', '--allow-slow-types'];
  if (dryRun) {
    args.push('--dry-run', '--allow-dirty');
    await runCommand('deno', args, pkg.dir);
    return 'dry-run';
  }

  if (await jsrVersionExists(pkg.name, pkg.version)) {
    console.log(`[publish] ${pkg.name}@${pkg.version}: already exists; skipping.`);
    return 'skipped';
  }

  console.log(`[publish] ${pkg.name}@${pkg.version}: publishing.`);
  const status = await runCommandWithTimeout(
    'deno',
    [...args, '--no-check'],
    pkg.dir,
    JSR_PUBLISH_TIMEOUT_MS,
  );

  if (status.success) {
    if (!(await waitForJsrVersion(pkg))) {
      throw new Error(
        `${pkg.name}@${pkg.version} publish finished but JSR metadata never appeared.`,
      );
    }
    console.log(`[publish] ${pkg.name}@${pkg.version}: published and visible on JSR.`);
    return 'published';
  }

  const reason = status.timedOut
    ? `timed out after ${JSR_PUBLISH_TIMEOUT_MS / 60_000} minutes`
    : `failed with exit code ${status.code}`;
  console.warn(`[publish] ${pkg.name}@${pkg.version}: command ${reason}; checking JSR state.`);
  if (await waitForJsrVersion(pkg)) {
    console.warn(
      `[publish] ${pkg.name}@${pkg.version}: version exists on JSR after command ${reason}; continuing.`,
    );
    return 'recovered';
  }

  throw new Error(
    `${pkg.name}@${pkg.version} publish ${reason}, and the version is not visible on JSR.`,
  );
}

function printJsrRecoveryPlan(packages: PackageInfo[]): void {
  console.log(
    '[publish] Live mode skips versions already visible on JSR and publishes ' +
      'the remaining packages sequentially.',
  );
  console.log(
    '[publish] If a publish command times out or exits non-zero after JSR accepts ' +
      'the immutable version, the script rechecks JSR metadata before failing.',
  );
  console.log(
    `[publish] Per-package publish timeout: ${JSR_PUBLISH_TIMEOUT_MS / 60_000} minutes. ` +
      'This keeps recovery moving when deno publish hangs after JSR accepts a version.',
  );
  console.log(
    `[publish] Candidate order: ${
      packages.map((pkg) => `${pkg.name}@${pkg.version}`).join(' -> ')
    }`,
  );
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

function parseOnlyFilter(args: string[]): Set<string> | null {
  const values: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--only') {
      const value = args[++i];
      if (!value) throw new Error('--only requires a comma-separated package list.');
      values.push(value);
    } else if (arg.startsWith('--only=')) {
      values.push(arg.slice('--only='.length));
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  const names = values
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  return names.length > 0 ? new Set(names) : null;
}

function packageKeys(pkg: PackageInfo): string[] {
  return [pkg.name, pkg.name.replace('@openelement/', '')];
}

function filterPackagesWithDependencies(
  packages: PackageInfo[],
  only: Set<string> | null,
): PackageInfo[] {
  if (!only) return packages;

  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const selected = new Set<string>();
  const requested = packages.filter((pkg) => packageKeys(pkg).some((key) => only.has(key)));

  if (requested.length === 0) {
    throw new Error(`No packages match --only ${[...only].join(',')}`);
  }

  function visit(pkg: PackageInfo): void {
    if (selected.has(pkg.name)) return;
    for (const dep of pkg.deps) {
      const depPkg = byName.get(dep);
      if (depPkg) visit(depPkg);
    }
    selected.add(pkg.name);
  }

  for (const pkg of requested) visit(pkg);
  return packages.filter((pkg) => selected.has(pkg.name));
}

async function main(): Promise<void> {
  const [command, ...args] = Deno.args;
  if (!COMMANDS.has(command)) {
    throw new Error(
      `Usage: deno run --allow-read --allow-run tools/run-package-graph-task.ts ${
        [...COMMANDS].join('|')
      } [--only package-a,package-b]`,
    );
  }
  const only = parseOnlyFilter(args);

  const allPackages = await readPackages();
  const orderedPackages = command.startsWith('publish')
    ? orderForRelease(allPackages)
    : sortPackages(allPackages);
  const packages = filterPackagesWithDependencies(orderedPackages, only);
  if (packages.length === 0) throw new Error('No packages found under packages/.');
  console.log(
    `[graph-task] ${command}: ${packages.length} packages in dependency order: ${
      packages.map((pkg) => pkg.name).join(' -> ')
    }`,
  );

  if (command.startsWith('publish')) {
    assertVersionConsistency(packages);
  }
  if (command === 'publish') {
    await assertCleanWorktree();
    printJsrRecoveryPlan(packages);
  }

  const publishResults = new Map<string, number>();
  for (const pkg of packages) {
    if (command === 'typecheck') {
      await typecheckPackage(pkg);
    } else {
      const result = await publishPackage(pkg, command === 'publish:dry-run');
      publishResults.set(result, (publishResults.get(result) ?? 0) + 1);
    }
  }

  if (command.startsWith('publish')) {
    const summary = [...publishResults.entries()]
      .map(([result, count]) => `${result}: ${count}`)
      .join(', ');
    console.log(`[graph-task] ${command} summary: ${summary}`);
  }

  if (command === 'typecheck') {
    await runCommand('deno', ['check', 'www/vite.config.ts', 'www/e2e/playwright.config.ts']);
  }
}

await main();
