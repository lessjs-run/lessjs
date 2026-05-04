/**
 * @kissjs/create - cli.ts tests (Deno)
 *
 * Tests template correctness by reading the source directly.
 * We do NOT call main() because it invokes Deno.exit() which
 * kills the Deno test process.
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliSource = readFileSync(join(__dirname, '..', 'cli.ts'), 'utf-8');

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

// ─── Scaffold Tests ────────────────────────────────────────

Deno.test('create-kiss: deno.json has all required tasks', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));

  assertExists(denoJson.tasks['dev'], 'Missing dev task');
  assertExists(denoJson.tasks['build'], 'Missing build task');
  assertExists(denoJson.tasks['build:client'], 'Missing build:client task');
  assertExists(denoJson.tasks['build:ssg'], 'Missing build:ssg task');
  assertExists(denoJson.tasks['preview'], 'Missing preview task');
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
  assertExists(denoJson.imports['@kissjs/core'].includes('0.5.0-alpha.5'));
  assertExists(denoJson.imports['@kissjs/ui'].includes('0.4.6'));
});

Deno.test('create-kiss: deno.json build runs the full three-phase pipeline', () => {
  const denoJson = JSON.parse(extractTemplate('deno.json'));
  assertExists(denoJson.tasks['build'].includes('build:ssr'));
  assertExists(denoJson.tasks['build'].includes('build:client'));
  assertExists(denoJson.tasks['build'].includes('build:ssg'));
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
  assertExists(islandCounter.includes('customElements.define(tagName, MyCounter)'));
});
