// deno-lint-ignore no-unversioned-import
import { assertEquals, assertExists } from 'jsr:@std/assert';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
// deno-lint-ignore no-sloppy-imports
import {
  extractCustomElementTags,
  generateIslandManifests,
  type PageIslandManifest,
  writeIslandManifests,
} from '../src/island-manifest.ts';

const TMP_DIR = join(import.meta.dirname!, '__tmp_manifest_test__');

function setup() {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });
}

function cleanup() {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
}

Deno.test('extractCustomElementTags: extracts hyphenated tags', () => {
  const html =
    '<div><less-theme-toggle></less-theme-toggle><less-hero-ping auto></less-hero-ping></div>';
  const tags = extractCustomElementTags(html);
  assertEquals(tags.sort(), ['less-hero-ping', 'less-theme-toggle']);
});

Deno.test('extractCustomElementTags: ignores non-custom elements', () => {
  const html = '<div class="foo"><span>text</span><p>paragraph</p></div>';
  const tags = extractCustomElementTags(html);
  assertEquals(tags, []);
});

Deno.test('extractCustomElementTags: handles tags with attributes', () => {
  const html = '<less-button disabled>Click</less-button><less-input type="text" />';
  const tags = extractCustomElementTags(html);
  assertEquals(tags.sort(), ['less-button', 'less-input']);
});

Deno.test('generateIslandManifests: produces manifests with known islands', () => {
  setup();
  writeFileSync(join(TMP_DIR, 'index.html'), '<less-theme-toggle></less-theme-toggle>');

  const chunkMap = { 'less-theme-toggle': '/client/islands/island-less-theme-toggle-abc.js' };
  const strategyMap = { 'less-theme-toggle': 'idle' as const };
  const layerMap = { 'less-theme-toggle': 'dsd-interactive' as const };

  const manifests = generateIslandManifests(TMP_DIR, chunkMap, strategyMap, layerMap);
  assertEquals(manifests.length, 1);
  assertEquals(manifests[0].route, '/');
  assertEquals(manifests[0].islands.length, 1);
  assertEquals(manifests[0].islands[0].tagName, 'less-theme-toggle');
  assertEquals(
    manifests[0].islands[0].chunkUrl,
    '/client/islands/island-less-theme-toggle-abc.js',
  );
  assertEquals(manifests[0].islands[0].strategy, 'idle');
  assertEquals(manifests[0].islands[0].layer, 'dsd-interactive');
  assertExists(manifests[0].builtAt);
  cleanup();
});

Deno.test('generateIslandManifests: empty islands for pages without custom elements', () => {
  setup();
  writeFileSync(join(TMP_DIR, 'about.html'), '<div><span>hello</span></div>');

  const manifests = generateIslandManifests(TMP_DIR, {});
  assertEquals(manifests.length, 1);
  assertEquals(manifests[0].route, '/about');
  assertEquals(manifests[0].islands, []);
  cleanup();
});

Deno.test('generateIslandManifests: defaults strategy to lazy and layer to dsd-static', () => {
  setup();
  writeFileSync(join(TMP_DIR, 'guide.html'), '<less-button>Click</less-button>');

  const chunkMap = { 'less-button': '/client/islands/island-less-button-xyz.js' };
  const manifests = generateIslandManifests(TMP_DIR, chunkMap);

  assertEquals(manifests[0].islands[0].strategy, 'lazy');
  assertEquals(manifests[0].islands[0].layer, 'dsd-static');
  cleanup();
});

Deno.test('writeIslandManifests: creates JSON files in island-manifests dir', () => {
  setup();
  const manifests: PageIslandManifest[] = [
    {
      route: '/',
      islands: [{
        tagName: 'less-toggle',
        chunkUrl: '/client/toggle.js',
        strategy: 'eager',
        layer: 'dsd-static',
      }],
      builtAt: '2026-05-08T00:00:00.000Z',
    },
  ];

  writeIslandManifests(TMP_DIR, manifests);

  const manifestDir = join(TMP_DIR, 'island-manifests');
  assertExists(manifestDir);

  const files = Array.from(Deno.readDirSync(manifestDir));
  assertEquals(files.length, 1);

  const content = JSON.parse(readFileSync(join(manifestDir, files[0].name), 'utf-8'));
  assertEquals(content.route, '/');
  assertEquals(content.islands.length, 1);
  assertEquals(content.islands[0].tagName, 'less-toggle');
  cleanup();
});
