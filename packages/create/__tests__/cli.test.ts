/**
 * @lessjs/create - cli.ts tests (Deno)
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

Deno.test('create-less: deno.json has all required tasks', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));

  assertExists(denoJson.tasks['dev'], 'Missing dev task');
  assertExists(denoJson.tasks['build'], 'Missing build task');
  assertExists(denoJson.tasks['build:client'], 'Missing build:client task');
  assertExists(denoJson.tasks['build:ssg'], 'Missing build:ssg task');
  assertExists(denoJson.tasks['preview'], 'Missing preview task');
});

Deno.test('create-less: gitignore hides generated build artifacts', () => {
  const gitignore = extractTemplate('.gitignore');
  assertExists(gitignore.includes('.less/'));
  assertExists(gitignore.includes('dist/'));
  assertExists(gitignore.includes('node_modules/'));
});

Deno.test('create-less: deno.json build:client uses @lessjs/core', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));
  assertExists(denoJson.tasks['build:client'].includes('@lessjs/core'));
});

Deno.test('create-less: deno.json build:ssg uses @lessjs/core', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));
  assertExists(denoJson.tasks['build:ssg'].includes('@lessjs/core'));
});

Deno.test('create-less: deno.json maps Lit and package imports explicitly', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));
  assertEquals(denoJson.imports.lit, 'npm:lit@^3.2.0');
  assertEquals(denoJson.imports['@lit/reactive-element'], 'npm:@lit/reactive-element@^2');
  assertEquals(denoJson.imports['lit-element'], 'npm:lit-element@^4');
  assertEquals(denoJson.imports['lit-html'], 'npm:lit-html@^3');
  assertEquals(denoJson.imports.vite, 'npm:vite@8.0.10');
  // @lit-labs/ssr-dom-shim required by @lit/reactive-element in Vite SSR
  assertEquals(denoJson.imports['@lit-labs/ssr-dom-shim'], 'npm:@lit-labs/ssr-dom-shim@^1.5.0');
  assertExists(denoJson.imports['@lessjs/adapter-lit'].includes('0.3.0'));
  assertExists(denoJson.imports['@lessjs/core'].includes('0.6.0'));
  assertExists(denoJson.imports['@lessjs/core/less-runtime'].includes('0.6.0'));
  assertExists(denoJson.imports['@lessjs/ui'].includes('0.6.0'));
  assertExists(denoJson.imports['@lessjs/ui/tokens/colors'].includes('0.6.0'));
  assertExists(denoJson.imports['@lessjs/ui/tokens/color-values'].includes('0.6.0'));
  assertExists(denoJson.imports['@lessjs/ui/'].includes('0.6.0/'));
  assertEquals(denoJson.nodeModulesDir, 'auto');
});

Deno.test('create-less: deno.json build uses the one-command LessJS build', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));
  assertEquals(
    denoJson.tasks['build'],
    'deno run --config deno.json -A jsr:@lessjs/core/cli/build',
  );
  assertExists(denoJson.tasks['build:ssr']);
  assertExists(denoJson.tasks['build:client']);
  assertExists(denoJson.tasks['build:ssg']);
});

Deno.test('create-less: refuses path escape and existing target before writing', () => {
  assertExists(cliSource.includes('relative(cwd, targetDir)'));
  assertExists(cliSource.includes('Refusing to create project outside the current directory'));
  assertExists(cliSource.includes('Directory "${name}" already exists.'));
  assertExists(cliSource.includes('Deno.stat(targetDir)'));
});

Deno.test('create-less: vite.config.ts imports less plugin', () => {
  const viteConfig = extractTemplate('vite.config.ts');
  assertExists(viteConfig.includes("import { less } from '@lessjs/core'"));
  assertExists(viteConfig.includes('less({'));
});

Deno.test('create-less: vite.config.ts includes packageIslands config', () => {
  const viteConfig = extractTemplate('vite.config.ts');
  assertExists(viteConfig.includes('@lessjs/ui'));
  assertExists(viteConfig.includes('lessUiAliases'));
  assertExists(viteConfig.includes('https://jsr.io/@lessjs/ui/0.5.2/src/less-button.ts'));
});

Deno.test('create-less: route index imports Lit directly', () => {
  const routeIndex = extractTemplate('app/routes/index.ts');
  assertExists(routeIndex.includes("from 'lit'"));
  assertEquals(routeIndex.includes('@lessjs/core'), false);
  assertExists(routeIndex.includes('LitElement'));
  assertExists(routeIndex.includes('static override styles'));
  assertExists(routeIndex.includes('override render()'));
  assertExists(routeIndex.includes('tagName'));
});

Deno.test('create-less: island counter imports Lit directly and self-registers', () => {
  const islandCounter = extractTemplate('app/islands/my-counter.ts');
  assertExists(islandCounter.includes("from 'lit'"));
  assertEquals(islandCounter.includes('@lessjs/core'), false);
  assertExists(islandCounter.includes('LitElement'));
  assertExists(islandCounter.includes("tagName = 'my-counter'"));
  assertExists(islandCounter.includes('declare count: number'));
  assertExists(islandCounter.includes('customElements.define(tagName, MyCounter)'));
});

Deno.test('create-less: generated project builds through the one-command pipeline', async () => {
  const tmpRoot = Deno.makeTempDirSync({ prefix: 'less-create-' });
  const projectName = 'sample-app';

  try {
    const create = new Deno.Command(Deno.execPath(), {
      args: ['run', '-A', join(repoRoot, 'packages', 'create', 'cli.ts'), projectName],
      cwd: tmpRoot,
      stdout: 'piped',
      stderr: 'piped',
    });
    const createResult = await create.output();
    assertEquals(createResult.code, 0, new TextDecoder().decode(createResult.stderr));

    const appDir = join(tmpRoot, projectName);
    const denoJsonPath = join(appDir, 'deno.json');
    const denoJson = JSON.parse(readFileSync(denoJsonPath, 'utf-8'));
    denoJson.imports['@lessjs/core'] = pathToFileURL(
      join(repoRoot, 'packages', 'core', 'src', 'index.ts'),
    ).href;
    denoJson.imports['@lessjs/core/less-runtime'] = pathToFileURL(
      join(repoRoot, 'packages', 'core', 'src', 'less-runtime.ts'),
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
      join(repoRoot, 'packages', 'ui', 'src') + sep,
    ).href;
    denoJson.imports['vite'] = 'npm:vite@8.0.10';
    denoJson.imports['hono'] = 'npm:hono@^4';
    denoJson.imports['@hono/vite-dev-server'] = 'npm:@hono/vite-dev-server@^0.25.3';
    denoJson.tasks.build = `deno run -A ${
      join(repoRoot, 'packages', 'core', 'src', 'cli', 'build.ts')
    }`;
    writeFileSync(denoJsonPath, JSON.stringify(denoJson, null, 2));

    const uiSrc = join(repoRoot, 'packages', 'ui', 'src');
    const aliases = [
      {
        find: '@lessjs/core/render-dsd',
        replacement: vitePath(join(repoRoot, 'packages', 'core', 'src', 'render-dsd.ts')),
      },
      {
        find: '@lessjs/core/less-runtime',
        replacement: vitePath(join(repoRoot, 'packages', 'core', 'src', 'less-runtime.ts')),
      },
      {
        find: '@lessjs/core',
        replacement: vitePath(join(repoRoot, 'packages', 'core', 'src', 'index.ts')),
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
        find: '@lessjs/ui',
        replacement: vitePath(join(uiSrc, 'index.ts')),
      },
      {
        find: '@lessjs/ui/design-tokens',
        replacement: vitePath(join(uiSrc, 'design-tokens.ts')),
      },
      {
        find: '@lessjs/ui/tokens/colors',
        replacement: vitePath(join(uiSrc, 'tokens', 'colors.ts')),
      },
      {
        find: '@lessjs/ui/tokens/color-values',
        replacement: vitePath(join(uiSrc, 'tokens', 'color-values.ts')),
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
      {
        find: '@lessjs/ui/less-ui-plugin',
        replacement: vitePath(join(uiSrc, 'less-ui-plugin.ts')),
      },
    ];
    const viteConfigPath = join(appDir, 'vite.config.ts');
    let viteConfig = readFileSync(viteConfigPath, 'utf-8');
    viteConfig = viteConfig.replace(
      "import { less } from '@lessjs/core';",
      `import { less } from ${
        JSON.stringify(
          vitePath(join(repoRoot, 'packages', 'core', 'src', 'index.ts')),
        )
      };`,
    );
    viteConfig = viteConfig.replace(
      "import { lessRootColorCSS } from '@lessjs/ui/tokens/colors';",
      `import { lessRootColorCSS } from ${
        JSON.stringify(
          vitePath(join(uiSrc, 'tokens', 'colors.ts')),
        )
      };`,
    );
    viteConfig = viteConfig.replace(
      "packageIslands: ['@lessjs/ui'],",
      `packageIslands: [${JSON.stringify(pathToFileURL(join(uiSrc, 'index.ts')).href)}],`,
    );
    viteConfig = viteConfig.replace(
      'alias: lessUiAliases',
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
    if (!indexHtml.includes('Hello from LessJS')) {
      console.error('index.html length:', indexHtml.length);
      console.error('contains shadowrootmode:', indexHtml.includes('shadowrootmode'));
      console.error('contains template:', indexHtml.includes('<template'));
      console.error('contains LessJS ERROR:', indexHtml.includes('LessJS ERROR'));
      console.error('last 300 chars:', indexHtml.substring(indexHtml.length - 300));
    }
    assertEquals(indexHtml.includes('Hello from LessJS'), true);
    assertEquals(indexHtml.includes('[object Object]'), false);
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});
