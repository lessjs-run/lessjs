/**
 * @kissjs/create - cli.ts tests (Deno)
 *
 * Tests template correctness by reading the source directly.
 * We do NOT call main() because it invokes Deno.exit() which
 * kills the Deno test process.
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..', '..');
const cliSource = readFileSync(join(__dirname, '..', 'cli.ts'), 'utf-8');

function vitePath(path: string): string {
  return path.replace(/\\/g, '/');
}

// Extract each template by splitting on known keys
function extractTemplate(key: string): string {
  const marker = `'${key}': \``;
  const startIdx = cliSource.indexOf(marker);
  if (startIdx === -1) throw new Error(`Template '${key}' not found`);

  const contentStart = startIdx + marker.length;
  let depth = 1;
  let i = contentStart;

  while (i < cliSource.length && depth > 0) {
    if (cliSource[i] === '`') {
      // Check if escaped
      const backslashCount = countTrailingBackslashes(cliSource, i - 1);
      if (backslashCount % 2 === 0) {
        depth--;
        if (depth === 0) break;
      }
    }
    i++;
  }

  return cliSource.slice(contentStart, i);
}

function countTrailingBackslashes(s: string, pos: number): number {
  let count = 0;
  while (pos >= 0 && s[pos] === '\\') {
    count++;
    pos--;
  }
  return count;
}

// --- Scaffold Tests ---

Deno.test('create-kiss: deno.json has all required tasks', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));

  assertExists(denoJson.tasks['dev'], 'Missing dev task');
  assertExists(denoJson.tasks['build'], 'Missing build task');
  assertExists(denoJson.tasks['build:client'], 'Missing build:client task');
  assertExists(denoJson.tasks['build:ssg'], 'Missing build:ssg task');
  assertExists(denoJson.tasks['preview'], 'Missing preview task');
});

Deno.test('create-kiss: gitignore hides generated build artifacts', () => {
  const gitignore = extractTemplate('.gitignore');
  assertExists(gitignore.includes('.kiss/'));
  assertExists(gitignore.includes('dist/'));
  assertExists(gitignore.includes('node_modules/'));
});

Deno.test('create-kiss: deno.json build:client uses @kissjs/core', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));
  assertExists(denoJson.tasks['build:client'].includes('@kissjs/core'));
});

Deno.test('create-kiss: deno.json build:ssg uses @kissjs/core', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));
  assertExists(denoJson.tasks['build:ssg'].includes('@kissjs/core'));
});

Deno.test('create-kiss: deno.json maps Lit and package imports explicitly', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));
  assertEquals(denoJson.imports.lit, 'npm:lit@^3.2.0');
  assertEquals(denoJson.imports['@lit/reactive-element'], 'npm:@lit/reactive-element@^2');
  assertEquals(denoJson.imports['lit-element'], 'npm:lit-element@^4');
  assertEquals(denoJson.imports['lit-html'], 'npm:lit-html@^3');
  assertEquals(denoJson.imports.vite, 'npm:vite@8.0.10');
  assertEquals(denoJson.imports['@lit-labs/ssr-dom-shim'], 'npm:@lit-labs/ssr-dom-shim@^1.5.0');
  assertExists(denoJson.imports['@kissjs/adapter-lit'].includes('0.2.0'));
  assertExists(denoJson.imports['@kissjs/core'].includes('0.5.3'));
  assertExists(denoJson.imports['@kissjs/core/kiss-runtime'].includes('0.5.3'));
  assertExists(denoJson.imports['@kissjs/ui'].includes('0.5.2'));
  assertExists(denoJson.imports['@kissjs/ui/tokens/colors'].includes('0.5.2'));
  assertExists(denoJson.imports['@kissjs/ui/'].includes('0.5.2/'));
  assertEquals(denoJson.nodeModulesDir, 'auto');
});

Deno.test('create-kiss: deno.json build uses the one-command KISS build', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));
  assertEquals(
    denoJson.tasks['build'],
    'deno run --config deno.json -A jsr:@kissjs/core/cli/build',
  );
  assertExists(denoJson.tasks['build:ssr']);
  assertExists(denoJson.tasks['build:client']);
  assertExists(denoJson.tasks['build:ssg']);
});

Deno.test('create-kiss: refuses path escape and existing target before writing', () => {
  assertExists(cliSource.includes('relative(cwd, targetDir)'));
  assertExists(cliSource.includes('Refusing to create project outside the current directory'));
  assertExists(cliSource.includes('Directory "${name}" already exists.'));
  assertExists(cliSource.includes('Deno.stat(targetDir)'));
});

Deno.test('create-kiss: vite.config.ts imports kiss plugin', () => {
  const viteConfig = extractTemplate('vite.config.ts');
  assertExists(viteConfig.includes("import { kiss } from '@kissjs/core'"));
  assertExists(viteConfig.includes('kiss({'));
});

Deno.test('create-kiss: vite.config.ts includes packageIslands config', () => {
  const viteConfig = extractTemplate('vite.config.ts');
  assertExists(viteConfig.includes('@kissjs/ui'));
  assertExists(viteConfig.includes('kissUiAliases'));
  assertExists(viteConfig.includes('https://jsr.io/@kissjs/ui/0.5.2/src/kiss-button.ts'));
});

Deno.test('create-kiss: route index imports Lit directly', () => {
  const routeIndex = extractTemplate('app/routes/index.ts');
  assertExists(routeIndex.includes("from 'lit'"));
  assertEquals(routeIndex.includes('@kissjs/core'), false);
  assertExists(routeIndex.includes('LitElement'));
  assertExists(routeIndex.includes('static override styles'));
  assertExists(routeIndex.includes('override render()'));
  assertExists(routeIndex.includes('tagName'));
});

Deno.test('create-kiss: island counter imports Lit directly and self-registers', () => {
  const islandCounter = extractTemplate('app/islands/my-counter.ts');
  assertExists(islandCounter.includes("from 'lit'"));
  assertEquals(islandCounter.includes('@kissjs/core'), false);
  assertExists(islandCounter.includes('LitElement'));
  assertExists(islandCounter.includes("tagName = 'my-counter'"));
  assertExists(islandCounter.includes('declare count: number'));
  assertExists(islandCounter.includes('customElements.define(tagName, MyCounter)'));
});

Deno.test('create-kiss: generated project builds through the one-command pipeline', async () => {
  const tmpRoot = Deno.makeTempDirSync({ prefix: 'kiss-create-' });
  const projectName = 'sample-app';

  try {
    const create = new Deno.Command(Deno.execPath(), {
      args: ['run', '-A', join(repoRoot, 'packages', 'create-kiss', 'cli.ts'), projectName],
      cwd: tmpRoot,
      stdout: 'piped',
      stderr: 'piped',
    });
    const createResult = await create.output();
    assertEquals(createResult.code, 0, new TextDecoder().decode(createResult.stderr));

    const appDir = join(tmpRoot, projectName);
    const denoJsonPath = join(appDir, 'deno.json');
    const denoJson = JSON.parse(readFileSync(denoJsonPath, 'utf-8'));
    denoJson.imports['@kissjs/core'] = pathToFileURL(
      join(repoRoot, 'packages', 'kiss-core', 'src', 'index.ts'),
    ).href;
    denoJson.imports['@kissjs/core/kiss-runtime'] = pathToFileURL(
      join(repoRoot, 'packages', 'kiss-core', 'src', 'kiss-runtime.ts'),
    ).href;
    denoJson.imports['@kissjs/adapter-lit'] = pathToFileURL(
      join(repoRoot, 'packages', 'kiss-adapter-lit', 'src', 'index.ts'),
    ).href;
    denoJson.imports['@kissjs/adapter-lit/ssr'] = pathToFileURL(
      join(repoRoot, 'packages', 'kiss-adapter-lit', 'src', 'ssr.ts'),
    ).href;
    denoJson.imports['@kissjs/ui'] = pathToFileURL(
      join(repoRoot, 'packages', 'kiss-ui', 'src', 'index.ts'),
    ).href;
    denoJson.imports['@kissjs/ui/'] = pathToFileURL(
      join(repoRoot, 'packages', 'kiss-ui', 'src') + sep,
    ).href;
    denoJson.imports['vite'] = 'npm:vite@8.0.10';
    denoJson.imports['hono'] = 'npm:hono@^4';
    denoJson.imports['@hono/vite-dev-server'] = 'npm:@hono/vite-dev-server@^0.25.3';
    denoJson.tasks.build = `deno run -A ${
      join(repoRoot, 'packages', 'kiss-core', 'src', 'cli', 'build.ts')
    }`;
    writeFileSync(denoJsonPath, JSON.stringify(denoJson, null, 2));

    const uiSrc = join(repoRoot, 'packages', 'kiss-ui', 'src');
    const aliases = [
      {
        find: '@kissjs/core/kiss-runtime',
        replacement: vitePath(join(repoRoot, 'packages', 'kiss-core', 'src', 'kiss-runtime.ts')),
      },
      {
        find: '@kissjs/adapter-lit/ssr',
        replacement: vitePath(join(repoRoot, 'packages', 'kiss-adapter-lit', 'src', 'ssr.ts')),
      },
      {
        find: '@kissjs/adapter-lit',
        replacement: vitePath(join(repoRoot, 'packages', 'kiss-adapter-lit', 'src', 'index.ts')),
      },
      {
        find: '@kissjs/ui/tokens/colors',
        replacement: vitePath(join(uiSrc, 'tokens', 'colors.ts')),
      },
      { find: '@kissjs/ui/kiss-button', replacement: vitePath(join(uiSrc, 'kiss-button.ts')) },
      { find: '@kissjs/ui/kiss-card', replacement: vitePath(join(uiSrc, 'kiss-card.ts')) },
      { find: '@kissjs/ui/kiss-input', replacement: vitePath(join(uiSrc, 'kiss-input.ts')) },
      {
        find: '@kissjs/ui/kiss-code-block',
        replacement: vitePath(join(uiSrc, 'kiss-code-block.ts')),
      },
      { find: '@kissjs/ui/kiss-layout', replacement: vitePath(join(uiSrc, 'kiss-layout.ts')) },
      {
        find: '@kissjs/ui/kiss-theme-toggle',
        replacement: vitePath(join(uiSrc, 'kiss-theme-toggle.ts')),
      },
      {
        find: '@kissjs/ui/kiss-hero-ping',
        replacement: vitePath(join(uiSrc, 'kiss-hero-ping.ts')),
      },
      { find: '@kissjs/ui', replacement: vitePath(join(uiSrc, 'index.ts')) },
      {
        find: '@kissjs/core',
        replacement: vitePath(join(repoRoot, 'packages', 'kiss-core', 'src', 'index.ts')),
      },
    ];
    const viteConfigPath = join(appDir, 'vite.config.ts');
    let viteConfig = readFileSync(viteConfigPath, 'utf-8');
    viteConfig = viteConfig.replace(
      "import { kiss } from '@kissjs/core';",
      `import { kiss } from ${
        JSON.stringify(
          pathToFileURL(join(repoRoot, 'packages', 'kiss-core', 'src', 'index.ts')).href,
        )
      };`,
    );
    viteConfig = viteConfig.replace(
      "import { kissRootColorCSS } from '@kissjs/ui/tokens/colors';",
      `import { kissRootColorCSS } from ${
        JSON.stringify(
          pathToFileURL(join(uiSrc, 'tokens', 'colors.ts')).href,
        )
      };`,
    );
    viteConfig = viteConfig.replace(
      "packageIslands: ['@kissjs/ui'],",
      `packageIslands: [${JSON.stringify(pathToFileURL(join(uiSrc, 'index.ts')).href)}],`,
    );
    viteConfig = viteConfig.replace(
      'alias: kissUiAliases',
      `alias: ${JSON.stringify(aliases, null, 4)}`,
    );
    writeFileSync(viteConfigPath, viteConfig);

    Deno.symlinkSync(join(repoRoot, 'node_modules'), join(appDir, 'node_modules'), {
      type: 'dir',
    });

    const build = new Deno.Command(Deno.execPath(), {
      args: ['task', 'build'],
      cwd: appDir,
      stdout: 'piped',
      stderr: 'piped',
    });
    const buildResult = await build.output();
    const stderr = new TextDecoder().decode(buildResult.stderr);
    const stdout = new TextDecoder().decode(buildResult.stdout);
    assertEquals(buildResult.code, 0, `${stdout}\n${stderr}`);

    const indexHtmlPath = join(appDir, 'dist', 'index.html');
    assertEquals(existsSync(indexHtmlPath), true);
    assertEquals(existsSync(join(appDir, 'dist', 'client', '.vite', 'manifest.json')), true);
    const indexHtml = readFileSync(indexHtmlPath, 'utf-8');
    assertEquals(indexHtml.includes('Hello KISS!'), true);
    assertEquals(indexHtml.includes('[object Object]'), false);
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});
