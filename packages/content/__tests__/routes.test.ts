// deno-lint-ignore no-unversioned-import
import { assertEquals } from 'jsr:@std/assert';
import { join } from 'node:path';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { generateBlogRoutes, scanPosts } from '../src/blog/routes.ts';

const TMP_DIR = join(import.meta.dirname!, '__tmp_blog_test__');

function setup() {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });
}

function cleanup() {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
}

Deno.test('scanPosts: returns empty array for missing directory', async () => {
  const posts = await scanPosts({ contentDir: '/nonexistent/path' });
  assertEquals(posts, []);
});

Deno.test('scanPosts: parses markdown files from content directory', async () => {
  setup();
  writeFileSync(
    join(TMP_DIR, 'hello-world.md'),
    `---
title: Hello World
date: "2026-05-07"
---

# Hello
`,
  );
  writeFileSync(
    join(TMP_DIR, 'second-post.md'),
    `---
title: Second Post
date: "2026-05-08"
---

# Second
`,
  );

  const posts = await scanPosts({ contentDir: TMP_DIR });
  assertEquals(posts.length, 2);
  // Sorted reverse (newest first)
  assertEquals(posts[0].frontmatter.title, 'Second Post');
  assertEquals(posts[1].frontmatter.title, 'Hello World');
  cleanup();
});

Deno.test('generateBlogRoutes: filters out draft posts', async () => {
  setup();
  writeFileSync(
    join(TMP_DIR, 'published.md'),
    `---
title: Published
date: "2026-05-07"
---

Published content.
`,
  );
  writeFileSync(
    join(TMP_DIR, 'draft.md'),
    `---
title: Draft
date: "2026-05-08"
draft: true
---

Draft content.
`,
  );

  const routes = await generateBlogRoutes({ contentDir: TMP_DIR });
  assertEquals(routes.posts.length, 1);
  assertEquals(routes.posts[0].slug, 'published');
  assertEquals(routes.postRoutes.length, 1);
  assertEquals(routes.postRoutes[0].path, '/blog/published');
  cleanup();
});

Deno.test('generateBlogRoutes: uses custom basePath', async () => {
  setup();
  writeFileSync(
    join(TMP_DIR, 'test.md'),
    `---
title: Test
date: "2026-05-07"
---

Content.
`,
  );

  const routes = await generateBlogRoutes({ contentDir: TMP_DIR, basePath: '/articles' });
  assertEquals(routes.basePath, '/articles');
  assertEquals(routes.postRoutes[0].path, '/articles/test');
  cleanup();
});
