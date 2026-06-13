type Failure = {
  path: string;
  message: string;
};

const removedPackageNames = [
  '@openelement/adapter-lit',
  '@openelement/adapter-react',
  '@openelement/adapter-vanilla',
  '@openelement/cem',
  '@openelement/compat-check',
  '@openelement/hub',
  '@openelement/rpc',
  '@openelement/runtime',
  '@openelement/ssg',
  '@openelement/style-sheet',
];

const removedPackageDirs = [
  'packages/adapter-lit',
  'packages/adapter-react',
  'packages/adapter-vanilla',
  'packages/cem',
  'packages/compat-check',
  'packages/hub',
  'packages/rpc',
  'packages/runtime',
  'packages/ssg',
  'packages/style-sheet',
];

const forbiddenRootTracked = [
  /^bench\//,
  /^coverage\//,
  /^dist\//,
  /^custom-dist\//,
  /^dist-test-/,
  /^playwright-report\//,
  /^test-results\//,
  /^debug\.log$/,
  /^hub-submission\.json$/,
  /^hub-index\//,
];

const activeScanExtensions = /\.(ts|tsx|js|jsx|json|md|yml|yaml)$/;
const activeScanRoots = [
  'deno.json',
  'README.md',
  'README.zh.md',
  '.githooks/',
  '.github/workflows/',
  'packages/',
  'tools/',
  'docs/current/',
  'docs/roadmap/',
  'docs/status/STATUS.md',
];

const allowedRemovedPackageMentions = [
  'tools/check-package-surface.ts',
  'tools/check-repo-hygiene.ts',
  'docs/current/PACKAGE_SURFACE.md',
  'docs/current/VERSION_PLAN.md',
  'docs/roadmap/ROADMAP.md',
  'docs/status/STATUS.md',
  'README.md',
  'README.zh.md',
];

const failures: Failure[] = [];

function normalize(path: string): string {
  return path.replace(/\\/g, '/');
}

async function gitFiles(): Promise<string[]> {
  const command = new Deno.Command('git', {
    args: ['-c', 'core.quotepath=false', 'ls-files', '-z'],
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  if (!output.success) {
    throw new Error(new TextDecoder().decode(output.stderr).trim() || 'git ls-files failed');
  }
  return new TextDecoder()
    .decode(output.stdout)
    .split('\0')
    .filter(Boolean)
    .map(normalize);
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

function isActiveScanFile(path: string): boolean {
  if (!activeScanExtensions.test(path)) return false;
  return activeScanRoots.some((root) => path === root || path.startsWith(root));
}

for (const dir of removedPackageDirs) {
  if (await exists(dir)) {
    failures.push({ path: dir, message: 'removed package directory is still present' });
  }
}

const files = await gitFiles();
for (const file of files) {
  if (!(await exists(file))) continue;
  if (forbiddenRootTracked.some((pattern) => pattern.test(file))) {
    failures.push({ path: file, message: 'generated or archived root artifact is tracked' });
  }
}

for (const file of files.filter(isActiveScanFile)) {
  if (allowedRemovedPackageMentions.includes(file)) continue;
  let text = '';
  try {
    text = await Deno.readTextFile(file);
  } catch {
    continue;
  }
  for (const packageName of removedPackageNames) {
    if (text.includes(packageName)) {
      failures.push({
        path: file,
        message: `active file references removed package ${packageName}`,
      });
    }
  }
}

if (failures.length > 0) {
  console.error('Repo hygiene check failed:');
  for (const failure of failures) console.error(`- ${failure.path}: ${failure.message}`);
  Deno.exit(1);
}

console.log('Repo hygiene check passed.');
