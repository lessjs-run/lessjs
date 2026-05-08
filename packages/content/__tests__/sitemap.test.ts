// deno-lint-ignore no-unversioned-import
import { assertEquals } from 'jsr:@std/assert';
import { join } from 'node:path';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
// deno-lint-ignore no-sloppy-imports
import {
  generateSitemap,
  renderRobotsTxt,
  renderSitemapXml,
  scanHtmlFiles,
} from '../src/sitemap/generator.ts';

const TMP_DIR = join(import.meta.dirname!, '__tmp_sitemap_test__');

function setup() {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });
}

function cleanup() {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
}

Deno.test('renderSitemapXml: generates valid sitemap XML', () => {
  const urls = [
    {
      loc: 'https://lessjs.org/',
      priority: 1.0,
      changefreq: 'weekly' as const,
      lastmod: '2026-05-08',
    },
    {
      loc: 'https://lessjs.org/guide/getting-started',
      priority: 0.7,
      changefreq: 'weekly' as const,
      lastmod: '2026-05-08',
    },
  ];
  const xml = renderSitemapXml(urls);
  assertEquals(xml.includes('<?xml version="1.0"'), true);
  assertEquals(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), true);
  assertEquals(xml.includes('<loc>https://lessjs.org/</loc>'), true);
  assertEquals(xml.includes('<priority>1.0</priority>'), true);
  assertEquals(xml.includes('<priority>0.7</priority>'), true);
  assertEquals(xml.includes('<changefreq>weekly</changefreq>'), true);
  assertEquals(xml.includes('<lastmod>2026-05-08</lastmod>'), true);
});

Deno.test('renderRobotsTxt: generates robots.txt', () => {
  const txt = renderRobotsTxt('https://lessjs.org');
  assertEquals(txt.includes('User-agent: *'), true);
  assertEquals(txt.includes('Allow: /'), true);
  assertEquals(txt.includes('Sitemap: https://lessjs.org/sitemap.xml'), true);
});

Deno.test('scanHtmlFiles: finds index.html files recursively', () => {
  setup();
  mkdirSync(join(TMP_DIR, 'guide'), { recursive: true });
  mkdirSync(join(TMP_DIR, 'examples'), { recursive: true });

  writeFileSync(join(TMP_DIR, 'index.html'), '<html></html>');
  writeFileSync(join(TMP_DIR, 'guide', 'index.html'), '<html></html>');
  writeFileSync(join(TMP_DIR, 'examples', 'index.html'), '<html></html>');

  const paths = scanHtmlFiles(TMP_DIR);
  assertEquals(paths.length, 3);
  assertEquals(paths.includes('/'), true);
  assertEquals(paths.includes('/guide'), true);
  assertEquals(paths.includes('/examples'), true);

  cleanup();
});

Deno.test('scanHtmlFiles: ignores non-index.html files', () => {
  setup();
  writeFileSync(join(TMP_DIR, 'index.html'), '<html></html>');
  writeFileSync(join(TMP_DIR, 'other.html'), '<html></html>');

  const paths = scanHtmlFiles(TMP_DIR);
  assertEquals(paths.length, 1);
  assertEquals(paths[0], '/');

  cleanup();
});

Deno.test('generateSitemap: writes sitemap.xml and robots.txt', () => {
  setup();
  mkdirSync(join(TMP_DIR, 'guide'), { recursive: true });
  writeFileSync(join(TMP_DIR, 'index.html'), '<html></html>');
  writeFileSync(join(TMP_DIR, 'guide', 'index.html'), '<html></html>');

  generateSitemap(TMP_DIR, {
    hostname: 'https://lessjs.org',
  });

  assertEquals(generated.length, 2);
  assertEquals(existsSync(join(TMP_DIR, 'sitemap.xml')), true);
  assertEquals(existsSync(join(TMP_DIR, 'robots.txt')), true);

  // Verify sitemap content
  const sitemapContent = Deno.readTextFileSync(join(TMP_DIR, 'sitemap.xml'));
  assertEquals(sitemapContent.includes('https://lessjs.org/'), true);
  assertEquals(sitemapContent.includes('https://lessjs.org/guide'), true);

  // Verify robots.txt content
  const robotsContent = Deno.readTextFileSync(join(TMP_DIR, 'robots.txt'));
  assertEquals(robotsContent.includes('Sitemap: https://lessjs.org/sitemap.xml'), true);

  cleanup();
});

Deno.test('generateSitemap: respects exclude option', () => {
  setup();
  mkdirSync(join(TMP_DIR, 'guide'), { recursive: true });
  mkdirSync(join(TMP_DIR, 'secret'), { recursive: true });
  writeFileSync(join(TMP_DIR, 'index.html'), '<html></html>');
  writeFileSync(join(TMP_DIR, 'guide', 'index.html'), '<html></html>');
  writeFileSync(join(TMP_DIR, 'secret', 'index.html'), '<html></html>');

  generateSitemap(TMP_DIR, {
    hostname: 'https://lessjs.org',
    exclude: ['/secret'],
    robotsTxt: false,
  });

  const sitemapContent = Deno.readTextFileSync(join(TMP_DIR, 'sitemap.xml'));
  assertEquals(sitemapContent.includes('/secret'), false);
  assertEquals(sitemapContent.includes('/guide'), true);

  cleanup();
});
