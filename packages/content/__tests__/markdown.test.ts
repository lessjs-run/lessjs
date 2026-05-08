// deno-lint-ignore no-unversioned-import
import { assertEquals } from 'jsr:@std/assert';
// deno-lint-ignore no-sloppy-imports
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

Deno.test('parseMarkdownFile: custom markdown renderer', async () => {
  const content = `**bold text**`;
  const customOptions = {
    // deno-lint-ignore require-await
    markdown: async (md: string) => `<p>CUSTOM: ${md}</p>`,
  };
  const post = await parseMarkdownFile('custom.md', content, 'custom', customOptions);
  assertEquals(post.html, '<p>CUSTOM: **bold text**</p>');
});
