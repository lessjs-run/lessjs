# @lessjs/content

统一内容插件 - Blog + Nav + Sitemap 三合一，SSG 内容管线。

**构建时仅限**：路由组件通过 `virtual:less-blog-data` / `virtual:less-nav` 虚拟模块获取数据，
而非直接导入 `@lessjs/content`（ADR 0018）。

## 安装

```bash
deno add jsr:@lessjs/content
```

## 导出路径

```json
{
  ".": "./src/index.ts", // lessContent() 插件
  "./blog-data": "./src/blog/blog-data.ts", // loadBlogData() 纯函数
  "./nav": "./src/nav/index.ts", // Nav 扫描工具
  "./sitemap": "./src/sitemap/index.ts" // Sitemap 生成工具
}
```

## 功能

- **Blog 模块**：Markdown frontmatter 解析、slug 生成、草稿过滤、虚拟模块 `virtual:less-blog-data`
- **Nav 模块**：路由文件 meta 扫描 -> sidebar 自动生成，`virtual:less-nav` 虚拟模块
- **Sitemap 模块**：SSG 产物扫描 -> `sitemap.xml` + `robots.txt` 自动生成

## 使用

### 推荐方式（通过 @lessjs/app）

```ts
// vite.config.ts
import { lessjs } from '@lessjs/app';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    lessjs({
      content: {
        blog: { contentDir: 'content/blog', basePath: '/blog' },
        nav: { routesDir: 'app/routes', headerNav: [...] },
        sitemap: { hostname: 'https://example.com' },
      },
    }),
  ],
});
```

### 独立使用（需显式传递 ctx）

```ts
// vite.config.ts
import { lessContent } from '@lessjs/content';
import { less } from '@lessjs/adapter-vite';
import { LessBuildContext } from '@lessjs/adapter-vite/build-context';
import { defineConfig } from 'vite';

const ctx = new LessBuildContext({});

export default defineConfig({
  plugins: [
    ...less({ routesDir: 'app/routes' }, ctx),
    ...lessContent({
      blog: { contentDir: 'content/blog', basePath: '/blog' },
      ctx, // ctx 必须显式传递
    }),
  ],
});
```

## 许可

MIT
