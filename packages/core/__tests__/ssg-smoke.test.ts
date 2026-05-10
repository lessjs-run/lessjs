/**
 * @lessjs/core - SSG smoke build test
 *
 * End-to-end verification of the official one-command build path:
 *   deno task build
 *
 * The command still runs the internal three-phase pipeline, but users
 * should experience it as a single production build.
 */

import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(dirname(dirname(__dirname)));
const WWW_DIR = join(ROOT, 'www');
const WWW_DIST = join(WWW_DIR, 'dist');

function hasSsrBundle(): boolean {
  const assetsDir = join(WWW_DIST, 'assets');
  if (!existsSync(assetsDir)) return false;
  return readdirSync(assetsDir).some((file) =>
    file.startsWith('_virtual_less-hono-entry-') && file.endsWith('.js')
  );
}

function findHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (
      entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'client' &&
      entry.name !== 'server'
    ) {
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function ensureDocsBuild(): Promise<void> {
  if (
    hasSsrBundle() && existsSync(join(WWW_DIST, 'index.html'))
  ) {
    return;
  }

  const command = new Deno.Command(Deno.execPath(), {
    args: ['task', 'build'],
    cwd: ROOT,
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  assertEquals(output.code, 0, `${stdout}\n${stderr}`);
}

Deno.test('SSG smoke: one-command build produces trusted www output', async (t) => {
  await ensureDocsBuild();

  await t.step('phase 1 output exists with SSR bundle and HTML', () => {
    assert(hasSsrBundle(), 'SSR bundle should exist');

    // ADR 0011: Build metadata is now in LessBuildContext, not .less/build-metadata.json.
    // Verify the build produced real output instead.
    assert(existsSync(join(WWW_DIST, 'index.html')), 'index.html should exist after build');
  });

  await t.step('phase 2 output exists without legacy SSR client runtime', () => {
    const manifestPath = join(WWW_DIST, 'client', '.vite', 'manifest.json');
    const clientEntry = join(WWW_DIST, 'client', 'islands', 'client.js');
    assert(existsSync(manifestPath), 'Client manifest should exist');
    assert(existsSync(clientEntry), 'Client entry should exist');

    const content = readFileSync(clientEntry, 'utf-8');
    assertEquals(content.includes('@lit-labs/ssr-client'), false);
    assertEquals(content.includes('defer-hydration'), false);
  });

  await t.step('phase 3 output contains HTML, DSD, clean URLs, and PWA files', () => {
    const htmlFiles = findHtmlFiles(WWW_DIST);
    assert(htmlFiles.length > 0, 'Should have generated HTML files');

    for (const filePath of htmlFiles) {
      const content = readFileSync(filePath, 'utf-8');
      assertStringIncludes(content.toLowerCase(), '<!doctype html>');
    }

    const indexHtml = readFileSync(join(WWW_DIST, 'index.html'), 'utf-8');
    assert(
      indexHtml.includes('shadowrootmode="open"') || indexHtml.includes('<template shadowroot'),
      'SSG output should preserve Declarative Shadow DOM',
    );
    assert(existsSync(join(WWW_DIST, 'roadmap', 'index.html')), 'Clean URL output should exist');
    assert(existsSync(join(WWW_DIST, 'manifest.json')), 'PWA manifest should exist');
    assert(existsSync(join(WWW_DIST, 'sw.js')), 'PWA service worker should exist');
  });
});
