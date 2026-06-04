# @openelement/content

统一内容插件 - Blog + Nav + Sitemap 三合一，SSG 内容管线。

**构建时仅限**：路由组件通过 `@openelement/generated/blog-data` / `@openelement/generated/nav` 虚拟模块获取数据，
而非直接导入 `@openelement/content`（ADR 0018）。

## 安装

```bash
deno add jsr:@openelement/content
```

## 导出路径

```json
{
  ".": "./src/index.ts", // openContent() 插件
  "./blog-data": "./src/blog/blog-data.ts", // loadBlogData() 纯函数
  "./mdx": "./src/mdx/index.ts", // compileMdx() build-time MDX 编译
  "./nav": "./src/nav/index.ts", // Nav 扫描工具
  "./sitemap": "./src/sitemap/index.ts" // Sitemap 生成工具
}
```

## 功能

- **Blog 模块**：Markdown frontmatter 解析、slug 生成、草稿过滤、虚拟模块 `@openelement/generated/blog-data`
- **MDX 模块**：`compileMdx()` 将 `.mdx` 编译为 `@openelement/core` JSX runtime 代码，继续走 DSD 渲染路径
- **Nav 模块**：路由文件 meta 扫描 -> sidebar 自动生成，`@openelement/generated/nav` 虚拟模块
- **Sitemap 模块**：SSG 产物扫描 -> `sitemap.xml` + `robots.txt` 自动生成

## MDX

```ts
import { compileMdx } from '@openelement/content/mdx';

const mod = await compileMdx(source, {
  jsxImportSource: '@openelement/core',
});
```

`.mdx` 文件里的 openElement custom elements 和 `client:*` 属性会编译到同一条 JSX/DSD
路径；不引入浏览器端 MDX parser，也不引入 React provider 概念。

## 使用

### 推荐方式（通过 @openelement/app）

```ts
// vite.config.ts
import { openElement } from '@openelement/app';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    openElement({
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
import { openContent } from '@openelement/content';
import { less } from '@openelement/adapter-vite';
import { OpenElementBuildContext } from '@openelement/adapter-vite/build-context';
import { defineConfig } from 'vite';

const ctx = new OpenElementBuildContext({});

export default defineConfig({
  plugins: [
    ...createOpenPlugin({ routesDir: 'app/routes' }, ctx),
    ...openContent({
      blog: { contentDir: 'content/blog', basePath: '/blog' },
      ctx, // ctx 必须显式传递
    }),
  ],
});
```

## 许可

MIT
