/**
 * @lessjs/adapter-vite - Independent SSG CLI (ADR 0022)
 *
 * Standalone SSG entry point that loads a previously built SSR bundle
 * using its sidecar importmap.json, then runs the full SSG rendering
 * pipeline (dynamic routes, toSSG, i18n, post-processing, PWA, sitemap)
 * independently of Vite.
 *
 * Usage:
 *   deno run --import-map=dist/server/importmap.json \
 *     -A packages/adapter-vite/src/cli/ssg.ts \
 *     --ssr-dir ./dist/server --out-dir ./dist
 *
 *   bun run packages/adapter-vite/src/cli/ssg.ts \
 *     --ssr-dir ./dist/server --out-dir ./dist
 *
 * The importmap.json is produced by build-ssg.ts during Phase 1.
 */

import { resolve } from 'node:path';
import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { createLogger } from '@lessjs/core/logger';
import { ssgRender } from './ssg-render.js';

const log = createLogger('ssg-cli');

interface CliOptions {
  ssrDir: string;
  outDir: string;
  root: string;
  base?: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    opts[key] = args[i + 1] || '';
  }
  return {
    ssrDir: resolve(opts['ssr-dir'] || './dist/server'),
    outDir: resolve(opts['out-dir'] || './dist'),
    root: resolve(opts['root'] || process.cwd()),
    base: opts['base'] || '/',
  };
}

async function loadSsrBundle(ssrDir: string) {
  const importMapPath = resolve(ssrDir, 'importmap.json');
  const entryPath = resolve(ssrDir, 'entry.js');

  // Try .mjs first (new esbuild mode), fall back to .js (Vite inline mode)
  const mjsPath = resolve(ssrDir, 'entry.mjs');
  const bundlePath = existsSync(mjsPath) ? mjsPath : entryPath;

  if (!existsSync(bundlePath)) {
    throw new Error(`SSR bundle not found — expected at ${ssrDir}/entry.{js,mjs}`);
  }

  if (!existsSync(importMapPath)) {
    log.warn(
      `No importmap.json at ${importMapPath} — bundle may not resolve outside build environment`,
    );
  } else {
    const importMap = JSON.parse(readFileSync(importMapPath, 'utf-8'));
    log.info(`Loaded import map with ${Object.keys(importMap.imports || {}).length} entries`);
    log.info(`  → pass --import-map=${importMapPath} to Deno for bare specifier resolution`);
  }

  const bundleUrl = process.platform === 'win32'
    ? 'file:///' + bundlePath.replace(/\\/g, '/')
    : 'file://' + bundlePath;

  log.info(`Loading SSR bundle → ${bundleUrl}`);
  const module = await import(bundleUrl) as Record<string, unknown>;
  return module;
}

async function main() {
  const opts = parseArgs();

  log.info('=== LessJS SSG CLI (standalone) ===');
  log.info(`SSR dir: ${opts.ssrDir}`);
  log.info(`Output dir: ${opts.outDir}`);
  log.info(`Root: ${opts.root}`);

  try {
    const module = await loadSsrBundle(opts.ssrDir);

    if (!module.default) {
      throw new Error('SSR bundle loaded but no Hono app found (no default export)');
    }

    log.info('SSR bundle loaded successfully — running SSG rendering pipeline');

    // Full SSG rendering via shared ssgRender()
    // Same pipeline as build-ssg.ts: dynamic routes, toSSG, 404 redirect,
    // clean URLs, i18n expansion, client script injection, view transitions,
    // speculation rules, CSP, DSD polyfill, PWA, sitemap.
    await ssgRender(module as Parameters<typeof ssgRender>[0], {
      root: opts.root,
      outDir: opts.outDir,
      base: opts.base || '/',
    });

    log.info(`SSG complete → ${opts.outDir}`);
  } catch (err) {
    log.error('SSG failed:', err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) {
      log.error(err.stack.split('\n').slice(0, 5).join('\n'));
    }
    process.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
