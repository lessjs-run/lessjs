/**
 * Local Workspace Consumer Build - generates a test project from the local
 * workspace create package and builds it. This is faster than the
 * post-publish smoke test because it uses local source directly, making
 * it suitable for running on every PR.
 *
 * Usage: deno run --allow-read --allow-write --allow-run --allow-env --allow-net --allow-ffi tools/consumer-local.ts
 *
 * Exit code 0 = consumer project builds successfully.
 * Exit code 1 = consumer project build failed.
 */

import { dirname, join } from 'node:path';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function vitePath(path: string): string {
  return path.replace(/\\/g, '/');
}

const tmpRoot = Deno.makeTempDirSync({ prefix: 'openelement-consumer-local-' });
const projectName = 'consumer-test-app';
const keepTemp = Deno.env.get('OPEN_ELEMENT_KEEP_CONSUMER_LOCAL') === '1';

function cleanup(): void {
  if (keepTemp) {
    console.log(`Keeping temp project at ${tmpRoot}`);
    return;
  }
  rmSync(tmpRoot, { recursive: true, force: true });
}

console.log(`Generating test project from local workspace...`);

// Step 1: Generate project using local create package
const createResult = await new Deno.Command(Deno.execPath(), {
  args: ['run', '-A', join(repoRoot, 'packages', 'create', 'cli.ts'), projectName],
  cwd: tmpRoot,
  stdout: 'piped',
  stderr: 'piped',
}).output();

if (createResult.code !== 0) {
  console.error('Failed to generate consumer project:');
  console.error(new TextDecoder().decode(createResult.stderr));
  cleanup();
  Deno.exit(1);
}

const appDir = join(tmpRoot, projectName);
console.log(`Project generated at ${appDir}`);

// Step 2: Patch deno.json imports to point to local workspace source
const denoJsonPath = join(appDir, 'deno.json');
const denoJson = JSON.parse(readFileSync(denoJsonPath, 'utf-8'));

denoJson.imports['@openelement/app'] = pathToFileURL(
  join(repoRoot, 'packages', 'app', 'src', 'index.ts'),
).href;
denoJson.imports['@openelement/app/vite'] = pathToFileURL(
  join(repoRoot, 'packages', 'app', 'src', 'vite.ts'),
).href;
denoJson.imports['@openelement/core'] = pathToFileURL(
  join(repoRoot, 'packages', 'core', 'src', 'index.ts'),
).href;
denoJson.imports['@openelement/core/logger'] = pathToFileURL(
  join(repoRoot, 'packages', 'core', 'src', 'logger.ts'),
).href;
denoJson.imports['@openelement/core/render-ir'] = pathToFileURL(
  join(repoRoot, 'packages', 'core', 'src', 'render-ir.ts'),
).href;
denoJson.imports['@openelement/core/jsx-runtime'] = pathToFileURL(
  join(repoRoot, 'packages', 'core', 'src', 'jsx-runtime.ts'),
).href;
denoJson.imports['@openelement/core/jsx-dev-runtime'] = pathToFileURL(
  join(repoRoot, 'packages', 'core', 'src', 'jsx-runtime.ts'),
).href;
denoJson.imports['@openelement/protocols'] = pathToFileURL(
  join(repoRoot, 'packages', 'protocols', 'src', 'index.ts'),
).href;
for (
  const subpath of [
    'build-types',
    'cache',
    'components',
    'conformance',
    'data',
    'islands',
    'renderer',
    'routes',
    'runtime',
    'signals',
    'validators',
  ]
) {
  denoJson.imports[`@openelement/protocols/${subpath}`] = pathToFileURL(
    join(repoRoot, 'packages', 'protocols', 'src', `${subpath}.ts`),
  ).href;
}
denoJson.imports['@openelement/adapter-vite/build-context'] = pathToFileURL(
  join(repoRoot, 'packages', 'adapter-vite', 'src', 'build-context.ts'),
).href;
denoJson.imports['@openelement/adapter-vite'] = pathToFileURL(
  join(repoRoot, 'packages', 'adapter-vite', 'src', 'index.ts'),
).href;
denoJson.imports['@openelement/signals'] = pathToFileURL(
  join(repoRoot, 'packages', 'signals', 'src', 'index.ts'),
).href;
denoJson.imports['@openelement/signals/framework'] = pathToFileURL(
  join(repoRoot, 'packages', 'signals', 'src', 'framework.ts'),
).href;
denoJson.imports['@openelement/runtime'] = pathToFileURL(
  join(repoRoot, 'packages', 'runtime', 'src', 'index.ts'),
).href;
denoJson.imports['@openelement/style-sheet'] = pathToFileURL(
  join(repoRoot, 'packages', 'style-sheet', 'src', 'index.ts'),
).href;
denoJson.imports['@openelement/content'] = pathToFileURL(
  join(repoRoot, 'packages', 'content', 'src', 'index.ts'),
).href;
denoJson.imports['@openelement/i18n'] = pathToFileURL(
  join(repoRoot, 'packages', 'i18n', 'src', 'index.ts'),
).href;
denoJson.imports['@openelement/adapter-lit'] = pathToFileURL(
  join(repoRoot, 'packages', 'adapter-lit', 'src', 'index.ts'),
).href;
denoJson.imports['@openelement/adapter-lit/ssr'] = pathToFileURL(
  join(repoRoot, 'packages', 'adapter-lit', 'src', 'ssr.ts'),
).href;
denoJson.imports['@openelement/ui'] = pathToFileURL(
  join(repoRoot, 'packages', 'ui', 'src', 'index.ts'),
).href;
denoJson.imports['@openelement/ui/'] = pathToFileURL(
  join(repoRoot, 'packages', 'ui', 'src') + '/',
).href;
denoJson.imports['lit'] = 'npm:lit@^3.2.0';
denoJson.imports['vite'] = 'npm:vite@8.0.10';
denoJson.imports['@deno/vite-plugin'] = 'npm:@deno/vite-plugin';
denoJson.imports['hono'] = 'npm:hono@4.12.23';
denoJson.imports['@hono/vite-dev-server'] = 'npm:@hono/vite-dev-server@^0.25.3';
denoJson.imports['parse5'] = 'npm:parse5@7.0.0';
denoJson.imports['entities'] = 'npm:entities@^4';
denoJson.imports['entities/'] = 'npm:entities@^4/';

// Override build task to use local source
denoJson.tasks.build = `deno run -A ${
  join(repoRoot, 'packages', 'adapter-vite', 'src', 'cli', 'build.ts')
}`;
delete denoJson.tasks['build:ssr'];
delete denoJson.tasks['build:client'];
delete denoJson.tasks['build:ssg'];

writeFileSync(denoJsonPath, JSON.stringify(denoJson, null, 2));

// Step 3: Patch vite.config.ts for local source resolution
const uiSrc = join(repoRoot, 'packages', 'ui', 'src');
const signalsSrc = join(repoRoot, 'packages', 'signals', 'src');

const aliases = [
  {
    find: '@openelement/adapter-vite/build-context',
    replacement: vitePath(
      join(repoRoot, 'packages', 'adapter-vite', 'src', 'build-context.ts'),
    ),
  },
  {
    find: '@openelement/adapter-vite',
    replacement: vitePath(join(repoRoot, 'packages', 'adapter-vite', 'src', 'index.ts')),
  },
  {
    find: '@openelement/core/logger',
    replacement: vitePath(join(repoRoot, 'packages', 'core', 'src', 'logger.ts')),
  },
  {
    find: '@openelement/core/render-ir',
    replacement: vitePath(join(repoRoot, 'packages', 'core', 'src', 'render-ir.ts')),
  },
  {
    find: '@openelement/core/jsx-runtime',
    replacement: vitePath(join(repoRoot, 'packages', 'core', 'src', 'jsx-runtime.ts')),
  },
  {
    find: '@openelement/core/jsx-dev-runtime',
    replacement: vitePath(join(repoRoot, 'packages', 'core', 'src', 'jsx-runtime.ts')),
  },
  {
    find: '@openelement/core',
    replacement: vitePath(join(repoRoot, 'packages', 'core', 'src', 'index.ts')),
  },
  ...[
    'build-types',
    'cache',
    'components',
    'conformance',
    'data',
    'islands',
    'renderer',
    'routes',
    'runtime',
    'signals',
    'validators',
  ].map((subpath) => ({
    find: `@openelement/protocols/${subpath}`,
    replacement: vitePath(
      join(repoRoot, 'packages', 'protocols', 'src', `${subpath}.ts`),
    ),
  })),
  {
    find: '@openelement/protocols',
    replacement: vitePath(join(repoRoot, 'packages', 'protocols', 'src', 'index.ts')),
  },
  {
    find: '@openelement/signals/framework',
    replacement: vitePath(join(signalsSrc, 'framework.ts')),
  },
  {
    find: '@openelement/runtime',
    replacement: vitePath(join(repoRoot, 'packages', 'runtime', 'src', 'index.ts')),
  },
  {
    find: '@openelement/style-sheet',
    replacement: vitePath(join(repoRoot, 'packages', 'style-sheet', 'src', 'index.ts')),
  },
  {
    find: '@openelement/adapter-lit/ssr',
    replacement: vitePath(join(repoRoot, 'packages', 'adapter-lit', 'src', 'ssr.ts')),
  },
  {
    find: '@openelement/adapter-lit',
    replacement: vitePath(join(repoRoot, 'packages', 'adapter-lit', 'src', 'index.ts')),
  },
  {
    find: '@openelement/ui/open-props-tokens',
    replacement: vitePath(join(uiSrc, 'open-props-tokens.ts')),
  },
  {
    find: '@openelement/ui/open-button',
    replacement: vitePath(join(uiSrc, 'open-button.tsx')),
  },
  {
    find: '@openelement/ui/open-card',
    replacement: vitePath(join(uiSrc, 'open-card.tsx')),
  },
  {
    find: '@openelement/ui/open-input',
    replacement: vitePath(join(uiSrc, 'open-input.tsx')),
  },
  {
    find: '@openelement/ui/open-code-block',
    replacement: vitePath(join(uiSrc, 'open-code-block.tsx')),
  },
  {
    find: '@openelement/ui/open-layout',
    replacement: vitePath(join(uiSrc, 'open-layout.tsx')),
  },
  {
    find: '@openelement/ui/open-theme-toggle',
    replacement: vitePath(join(uiSrc, 'open-theme-toggle.tsx')),
  },
  {
    find: '@openelement/ui/open-hero-ping',
    replacement: vitePath(join(uiSrc, 'open-hero-ping.tsx')),
  },
  {
    find: '@openelement/ui/open-dialog',
    replacement: vitePath(join(uiSrc, 'open-dialog.tsx')),
  },
  // Parent @openelement/ui alias MUST come after all @openelement/ui/* subpath aliases
  {
    find: '@openelement/ui',
    replacement: vitePath(uiSrc),
  },
  {
    find: '@openelement/app/vite',
    replacement: vitePath(join(repoRoot, 'packages', 'app', 'src', 'vite.ts')),
  },
  {
    find: '@openelement/app',
    replacement: vitePath(join(repoRoot, 'packages', 'app', 'src', 'index.ts')),
  },
];

const viteConfigPath = join(appDir, 'vite.config.ts');
let viteConfig = readFileSync(viteConfigPath, 'utf-8');

viteConfig = viteConfig.replace(
  "packageIslands: ['@openelement/ui'],",
  `packageIslands: [${JSON.stringify(pathToFileURL(join(uiSrc, 'index.ts')).href)}],`,
);
viteConfig = viteConfig.replace(
  'plugins: [',
  `resolve: { alias: ${JSON.stringify(aliases, null, 4)} },\n  plugins: [`,
);
writeFileSync(viteConfigPath, viteConfig);

// Step 4: Symlink node_modules from repo root
try {
  Deno.symlinkSync(join(repoRoot, 'node_modules'), join(appDir, 'node_modules'), {
    type: 'dir',
  });
} catch {
  // Symlink may already exist or node_modules may not exist
}

// Step 5: Build the project
console.log('Building consumer project...');
const buildResult = await new Deno.Command(Deno.execPath(), {
  args: ['task', 'build'],
  cwd: appDir,
  stdout: 'piped',
  stderr: 'piped',
}).output();

const stdout = new TextDecoder().decode(buildResult.stdout);
const stderr = new TextDecoder().decode(buildResult.stderr);

if (buildResult.code !== 0) {
  console.error('Consumer build FAILED:');
  console.error(stdout);
  console.error(stderr);
  cleanup();
  Deno.exit(1);
}

if (!stdout.includes('Routes: 1 page(s), 1 API route(s)')) {
  console.error('Consumer build did not scan the expected page/API route surface.');
  console.error(stdout);
  console.error(stderr);
  cleanup();
  Deno.exit(1);
}

// Step 6: Verify output
const indexHtmlPath = join(appDir, 'dist', 'index.html');
if (!existsSync(indexHtmlPath)) {
  console.error('dist/index.html not found; consumer build produced no output');
  console.error(stdout);
  console.error(stderr);
  cleanup();
  Deno.exit(1);
}

const indexHtml = readFileSync(indexHtmlPath, 'utf-8');
if (!indexHtml.includes('Hello from openElement')) {
  console.error('dist/index.html does not contain expected content');
  console.error('Last 300 chars:', indexHtml.substring(indexHtml.length - 300));
  cleanup();
  Deno.exit(1);
}

if (!indexHtml.includes('data-open-layout="app-shell"')) {
  console.error('dist/index.html does not contain expected app shell marker');
  console.error('Last 300 chars:', indexHtml.substring(indexHtml.length - 300));
  cleanup();
  Deno.exit(1);
}

console.log(
  'Local consumer build passed; generated page, app shell, and API route surface verified.',
);

// Cleanup
cleanup();
