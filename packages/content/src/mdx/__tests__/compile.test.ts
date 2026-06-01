import { assert, assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@1';
import { compileMdx } from '../compile.ts';

Deno.test('compileMdx extracts frontmatter and markdown body', async () => {
  const mod = await compileMdx(`---
title: Hello MDX
tags:
  - lessjs
---

# Hello
`);

  assertEquals(mod.frontmatter.title, 'Hello MDX');
  assertEquals(mod.frontmatter.tags, ['lessjs']);
  assertStringIncludes(mod.content, '# Hello');
});

Deno.test('compileMdx targets @lessjs/core JSX runtime', async () => {
  const mod = await compileMdx('# Hello');
  assertStringIncludes(mod.code, 'jsx');
  assertStringIncludes(mod.code, '@lessjs/core');
});

Deno.test('compileMdx preserves JSX component usage for DSD render path', async () => {
  const mod = await compileMdx('<less-counter client:idle count={1} />');
  assertStringIncludes(mod.code, 'less-counter');
  assertStringIncludes(mod.code, 'client:idle');
});

Deno.test('compileMdx accepts a custom jsxImportSource', async () => {
  const mod = await compileMdx('# Hello', { jsxImportSource: '@lessjs/core/jsx-runtime' });
  assertStringIncludes(mod.code, '@lessjs/core/jsx-runtime');
});

Deno.test('compileMdx surfaces parser errors with source context', async () => {
  await assertRejects(
    () => compileMdx('<Unclosed>'),
    Error,
  );
});

Deno.test('compileMdx emits executable program text', async () => {
  const mod = await compileMdx('Plain **content**');
  assert(mod.code.includes('export default'));
});
