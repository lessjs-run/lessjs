# @lessjs/i18n

国际化插件 - SSG locale 展开、路径辅助、语言切换。

## 安装

```bash
deno add jsr:@lessjs/i18n
```

## 功能

- **SSG locale 展开**：构建时为每个 locale × 每个路由渲染页面
- **`i18nStaticPaths()`**：为动态路由提供 locale 参数展开
- **`switchLocale()`**：路由辅助函数，生成跨 locale 链接
- **Language switcher**：与 `less-layout` 集成的语言切换器

## 使用

### 推荐方式（通过 @lessjs/app）

```ts
// vite.config.ts
import { lessjs } from '@lessjs/app';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    lessjs({
      i18n: {
        locales: ['en', 'zh'],
        defaultLocale: 'en',
      },
    }),
  ],
});
```

### Route 层辅助函数

```ts
// app/routes/[locale]/index.ts
import { i18nStaticPaths, switchLocale } from '@lessjs/i18n';

export function getStaticPaths() {
  return i18nStaticPaths(); // 展开所有 locale 路径
}

// 生成跨 locale 链接
const enPath = switchLocale('/zh/about', 'en'); // -> '/en/about'
```

### 独立使用（需显式传递 ctx）

```ts
import { lessI18n } from '@lessjs/i18n';
import { less } from '@lessjs/adapter-vite';
import { LessBuildContext } from '@lessjs/adapter-vite/build-context';
import { defineConfig } from 'vite';

const ctx = new LessBuildContext({});

export default defineConfig({
  plugins: [
    ...less({ routesDir: 'app/routes' }, ctx),
    lessI18n({ locales: ['en', 'zh'], defaultLocale: 'en', ctx }),
  ],
});
```

## 许可

MIT
