// deno-lint-ignore no-unversioned-import
import { assertEquals } from 'jsr:@std/assert';
import { parseMarkdownFile, slugFromFilename } from '../src/blog/markdown.ts';

Deno.test('slugFromFilename: strips .md extension', () => {
  assertEquals(slugFromFilename('hello-world.md'), 'hello-world');
});

Deno.test('slugFromFilename: strips date prefix', () => {
  assertEquals(slugFromFilename('2026-05-07-hello-world.md'), 'hello-world');
});

Deno.test('slugFromFilename: no date prefix passthrough', () => {
  assertEquals(slugFromFilename('my-post.md'), 'my-post');
});

Deno.test('parseMarkdownFile: parses frontmatter and content', async () => {
  const content = `---
title: Test Post
date: "2026-05-07"
tags:
  - test
---

# Hello World

This is a test post.
`;

  const post = await parseMarkdownFile('test.md', content, 'test');
  assertEquals(post.slug, 'test');
  assertEquals(post.frontmatter.title, 'Test Post');
  assertEquals(post.frontmatter.date, '2026-05-07');
  assertEquals(post.frontmatter.tags, ['test']);
  assertEquals(post.frontmatter.draft, false);
  // HTML should contain rendered heading
  assertEquals(post.html.includes('Hello World'), true);
});

Deno.test('parseMarkdownFile: defaults for missing frontmatter', async () => {
  const content = `Just some content without frontmatter.`;
  const post = await parseMarkdownFile('simple.md', content, 'simple');
  assertEquals(post.frontmatter.title, 'simple');
  assertEquals(post.frontmatter.draft, false);
  assertEquals(post.frontmatter.tags, []);
});

Deno.test('parseMarkdownFile: derives missing date from filename prefix', async () => {
  const content = `Just some content without frontmatter.`;
  const post = await parseMarkdownFile(
    'content/blog/2026-05-13-architecture-analysis.md',
    content,
    'architecture-analysis',
  );
  assertEquals(post.frontmatter.date, '2026-05-13');
});

Deno.test('parseMarkdownFile: custom markdown renderer', async () => {
  const content = `**bold text**`;
  const customOptions = {
    // deno-lint-ignore require-await
    markdown: async (md: string) => `<p>CUSTOM: ${md}</p>`,
  };
  const post = await parseMarkdownFile('custom.md', content, 'custom', customOptions);
  assertEquals(post.html, '<p>CUSTOM: **bold text**</p>');
});

// --- XSS regression tests (v0.14.10: sanitize-html allow-list) ---

Deno.test('sanitize: strips <script> tags entirely', async () => {
  const content = `Hello <script>alert(1)</script> World`;
  const post = await parseMarkdownFile('xss1.md', content, 'xss1');
  assertEquals(post.html.includes('<script'), false);
  assertEquals(post.html.includes('alert'), false);
});

Deno.test('sanitize: strips <iframe> tags entirely', async () => {
  const content = `Hello <iframe src="evil.com"></iframe> World`;
  const post = await parseMarkdownFile('xss2.md', content, 'xss2');
  assertEquals(post.html.includes('<iframe'), false);
});

Deno.test('sanitize: strips event handler attributes (on*)', async () => {
  const content = `<p onclick="alert(1)">click me</p>`;
  const post = await parseMarkdownFile('xss3.md', content, 'xss3');
  assertEquals(post.html.includes('onclick'), false);
});

Deno.test('sanitize: strips unquoted javascript: URLs', async () => {
  const content = `<a href=javascript:alert(1)>xss</a>`;
  const post = await parseMarkdownFile('xss4.md', content, 'xss4');
  assertEquals(post.html.includes('javascript:'), false);
});

Deno.test('sanitize: strips HTML-entity-encoded javascript: URLs', async () => {
  const content = `<a href="javas&#99;ript:alert(1)">xss</a>`;
  const post = await parseMarkdownFile('xss5.md', content, 'xss5');
  assertEquals(post.html.includes('javascript:'), false);
  assertEquals(post.html.includes('&#99;'), false);
});

Deno.test('sanitize: strips data: URLs in href', async () => {
  const content = `<a href="data:text/html,<script>alert(1)</script>">xss</a>`;
  const post = await parseMarkdownFile('xss6.md', content, 'xss6');
  assertEquals(post.html.includes('data:'), false);
});

Deno.test('sanitize: allows safe http/https links', async () => {
  const content = `[safe](https://example.com) and [local](/about)`;
  const post = await parseMarkdownFile('safe1.md', content, 'safe1');
  assertEquals(post.html.includes('https://example.com'), true);
});

Deno.test('sanitize: custom renderer output is also sanitized by default', async () => {
  const content = `irrelevant`;
  const customOptions = {
    // deno-lint-ignore require-await
    markdown: async (_md: string) =>
      `<p onclick="alert(1)">evil</p><a href="javascript:alert(1)">link</a>`,
  };
  const post = await parseMarkdownFile('xss-custom.md', content, 'xss-custom', customOptions);
  assertEquals(post.html.includes('onclick'), false);
  assertEquals(post.html.includes('javascript:'), false);
});

Deno.test('sanitize: trustedHtml skips sanitization for custom renderer', async () => {
  const content = `irrelevant`;
  const customOptions = {
    trustedHtml: true,
    // deno-lint-ignore require-await
    markdown: async (_md: string) => `<p onclick="ok">trusted</p>`,
  };
  const post = await parseMarkdownFile('trusted.md', content, 'trusted', customOptions);
  assertEquals(post.html.includes('onclick'), true);
  assertEquals(post.html.includes('trusted'), true);
});

Deno.test('sanitize: strips SVG/MathML elements', async () => {
  const content = `<svg onload="alert(1)"><circle/></svg>`;
  const post = await parseMarkdownFile('xss-svg.md', content, 'xss-svg');
  assertEquals(post.html.includes('<svg'), false);
  assertEquals(post.html.includes('onload'), false);
});
