/**
 * Local Workspace Consumer Build — generates a test project from the local
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

const tmpRoot = Deno.makeTempDirSync({ prefix: 'lessjs-consumer-local-' });
const projectName = 'consumer-test-app';

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
  rmSync(tmpRoot, { recursive: true, force: true });
  Deno.exit(1);
}

const appDir = join(tmpRoot, projectName);
console.log(`Project generated at ${appDir}`);

// Step 2: Patch deno.json imports to point to local workspace source
const denoJsonPath = join(appDir, 'deno.json');
const denoJson = JSON.parse(readFileSync(denoJsonPath, 'utf-8'));

denoJson.imports['@lessjs/app'] = pathToFileURL(
  join(repoRoot, 'packages', 'app', 'src', 'index.ts'),
).href;
denoJson.imports['@lessjs/core'] = pathToFileURL(
  join(repoRoot, 'packages', 'core', 'src', 'index.ts'),
).href;
denoJson.imports['@lessjs/core/logger'] = pathToFileURL(
  join(repoRoot, 'packages', 'core', 'src', 'logger.ts'),
).href;
denoJson.imports['@lessjs/adapter-vite/build-context'] = pathToFileURL(
  join(repoRoot, 'packages', 'adapter-vite', 'src', 'build-context.ts'),
).href;
denoJson.imports['@lessjs/adapter-vite'] = pathToFileURL(
  join(repoRoot, 'packages', 'adapter-vite', 'src', 'index.ts'),
).href;
denoJson.imports['@lessjs/signals'] = pathToFileURL(
  join(repoRoot, 'packages', 'signals', 'src', 'index.ts'),
).href;
denoJson.imports['@lessjs/signals/framework'] = pathToFileURL(
  join(repoRoot, 'packages', 'signals', 'src', 'framework.ts'),
).href;
denoJson.imports['@lessjs/content'] = pathToFileURL(
  join(repoRoot, 'packages', 'content', 'src', 'index.ts'),
).href;
denoJson.imports['@lessjs/i18n'] = pathToFileURL(
  join(repoRoot, 'packages', 'i18n', 'src', 'index.ts'),
).href;
denoJson.imports['@lessjs/adapter-lit'] = pathToFileURL(
  join(repoRoot, 'packages', 'adapter-lit', 'src', 'index.ts'),
).href;
denoJson.imports['@lessjs/adapter-lit/ssr'] = pathToFileURL(
  join(repoRoot, 'packages', 'adapter-lit', 'src', 'ssr.ts'),
).href;
denoJson.imports['@lessjs/ui'] = pathToFileURL(
  join(repoRoot, 'packages', 'ui', 'src', 'index.ts'),
).href;
denoJson.imports['@lessjs/ui/'] = pathToFileURL(
  join(repoRoot, 'packages', 'ui', 'src') + '/',
).href;
denoJson.imports['lit'] = 'npm:lit@^3.2.0';
denoJson.imports['vite'] = 'npm:vite@8.0.10';
denoJson.imports['@deno/vite-plugin'] = 'npm:@deno/vite-plugin';
denoJson.imports['hono'] = 'npm:hono@^4';
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
    find: '@lessjs/adapter-vite/build-context',
    replacement: vitePath(
      join(repoRoot, 'packages', 'adapter-vite', 'src', 'build-context.ts'),
    ),
  },
  {
    find: '@lessjs/adapter-vite',
    replacement: vitePath(join(repoRoot, 'packages', 'adapter-vite', 'src', 'index.ts')),
  },
  {
    find: '@lessjs/core/logger',
    replacement: vitePath(join(repoRoot, 'packages', 'core', 'src', 'logger.ts')),
  },
  {
    find: '@lessjs/core',
    replacement: vitePath(join(repoRoot, 'packages', 'core', 'src', 'index.ts')),
  },
  {
    find: '@lessjs/signals/framework',
    replacement: vitePath(join(signalsSrc, 'framework.ts')),
  },
  {
    find: '@lessjs/adapter-lit/ssr',
    replacement: vitePath(join(repoRoot, 'packages', 'adapter-lit', 'src', 'ssr.ts')),
  },
  {
    find: '@lessjs/adapter-lit',
    replacement: vitePath(join(repoRoot, 'packages', 'adapter-lit', 'src', 'index.ts')),
  },
  {
    find: '@lessjs/ui/open-props-tokens',
    replacement: vitePath(join(uiSrc, 'open-props-tokens.ts')),
  },
  {
    find: '@lessjs/ui/less-button',
    replacement: vitePath(join(uiSrc, 'less-button.ts')),
  },
  {
    find: '@lessjs/ui/less-card',
    replacement: vitePath(join(uiSrc, 'less-card.ts')),
  },
  {
    find: '@lessjs/ui/less-input',
    replacement: vitePath(join(uiSrc, 'less-input.ts')),
  },
  {
    find: '@lessjs/ui/less-code-block',
    replacement: vitePath(join(uiSrc, 'less-code-block.ts')),
  },
  {
    find: '@lessjs/ui/less-layout',
    replacement: vitePath(join(uiSrc, 'less-layout.ts')),
  },
  {
    find: '@lessjs/ui/less-theme-toggle',
    replacement: vitePath(join(uiSrc, 'less-theme-toggle.ts')),
  },
  {
    find: '@lessjs/ui/less-hero-ping',
    replacement: vitePath(join(uiSrc, 'less-hero-ping.ts')),
  },
  {
    find: '@lessjs/ui/less-dialog',
    replacement: vitePath(join(uiSrc, 'less-dialog.ts')),
  },
  // Parent @lessjs/ui alias MUST come after all @lessjs/ui/* subpath aliases
  {
    find: '@lessjs/ui',
    replacement: vitePath(uiSrc),
  },
  {
    find: '@lessjs/app',
    replacement: vitePath(join(repoRoot, 'packages', 'app', 'src', 'index.ts')),
  },
];

const viteConfigPath = join(appDir, 'vite.config.ts');
let viteConfig = readFileSync(viteConfigPath, 'utf-8');

viteConfig = viteConfig.replace(
  "import { lessjs } from '@lessjs/app';",
  `import { lessPipeline } from ${
    JSON.stringify(
      pathToFileURL(join(repoRoot, 'packages', 'adapter-vite', 'src', 'index.ts')).href,
    )
  };`,
);
viteConfig = viteConfig.replace('lessjs({', 'lessPipeline({');
viteConfig = viteConfig.replace(
  "packageIslands: ['@lessjs/ui'],",
  `packageIslands: [${JSON.stringify(pathToFileURL(join(uiSrc, 'index.ts')).href)}],`,
);
viteConfig = viteConfig.replace(
  'plugins: [lessPipeline',
  `resolve: { alias: ${JSON.stringify(aliases, null, 4)} },\n  plugins: [less`,
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
  rmSync(tmpRoot, { recursive: true, force: true });
  Deno.exit(1);
}

// Step 6: Verify output
const indexHtmlPath = join(appDir, 'dist', 'index.html');
if (!existsSync(indexHtmlPath)) {
  console.error('dist/index.html not found — consumer build produced no output');
  rmSync(tmpRoot, { recursive: true, force: true });
  Deno.exit(1);
}

const indexHtml = readFileSync(indexHtmlPath, 'utf-8');
if (!indexHtml.includes('Hello from LessJS')) {
  console.error('dist/index.html does not contain expected content');
  console.error('Last 300 chars:', indexHtml.substring(indexHtml.length - 300));
  rmSync(tmpRoot, { recursive: true, force: true });
  Deno.exit(1);
}

console.log('Local consumer build passed — dist/index.html contains expected output.');

// Cleanup
rmSync(tmpRoot, { recursive: true, force: true });
