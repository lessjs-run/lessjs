# @lessjs/app

LessJS 统一入口（伞包）。`lessjs()` 将 `@lessjs/adapter-vite` + `@lessjs/content` + `@lessjs/i18n` 合并为一个调用。

**推荐所有 LessJS 项目使用此入口。**

## 安装

```bash
deno add jsr:@lessjs/app
```

## 使用

```ts
// vite.config.ts
import { lessjs } from '@lessjs/app';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    lessjs({
      // Core 配置
      routesDir: 'app/routes',
      islandsDir: 'app/islands',

      // Content 模块（可选）
      content: {
        blog: { contentDir: 'content/blog', basePath: '/blog' },
        nav: { routesDir: 'app/routes', headerNav: [...] },
        sitemap: { hostname: 'https://example.com' },
      },

      // i18n 模块（可选）
      i18n: {
        locales: ['en', 'zh'],
        defaultLocale: 'en',
      },

      // HTML / Island 配置
      html: { title: 'My App' },
      island: { upgradeStrategy: 'lazy' },
    }),
  ],
});
```

## 工作原理

`lessjs()` 内部：

1. 创建共享 `LessBuildContext`
2. 调用 `less(options, ctx)` — 注册构建编排插件
3. 如果传了 `content`，调用 `lessContent({ ...content, ctx })` — 内容插件
4. 如果传了 `i18n`，调用 `lessI18n({ ...i18n, ctx })` — 国际化插件

所有插件共享同一个 `ctx`，无需 globalThis 或 `onSSRInit` 桥接。

## 选项

`lessjs()` 接受 `LessjsOptions`，它是 `FrameworkOptions` 的超集：

| 选项 | 类型 | 说明 |
|------|------|------|
| `routesDir` | `string` | 路由目录（默认 `'app/routes'`） |
| `islandsDir` | `string` | Island 目录（默认 `'app/islands'`） |
| `componentsDir` | `string` | 组件目录（默认 `'app/components'`） |
| `html` | `HtmlConfig?` | HTML 模板配置 |
| `middleware` | `string[]?` | 全局中间件 |
| `inject` | `InjectConfig?` | Head 注入 |
| `packageIslands` | `string[]?` | 三方包 Island |
| `island` | `IslandConfig?` | Island 配置 |
| `content` | `LessContentOptions?` | 内容模块配置（blog/nav/sitemap） |
| `i18n` | `LessI18nOptions?` | 国际化配置 |

## 许可

MIT
