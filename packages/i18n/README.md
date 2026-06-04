# @openelement/i18n

国际化插件 - SSG locale 展开、路径辅助、语言切换。

## 安装

```bash
deno add jsr:@openelement/i18n
```

## 功能

- **SSG locale 展开**：构建时为每个 locale × 每个路由渲染页面
- **`i18nStaticPaths()`**：为动态路由提供 locale 参数展开
- **`switchLocale()`**：路由辅助函数，生成跨 locale 链接
- **Language switcher**：与 `open-layout` 集成的语言切换器

## 使用

### 推荐方式（通过 @openelement/app）

```ts
// vite.config.ts
import { openElement } from '@openelement/app';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    openElement({
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
import { i18nStaticPaths, switchLocale } from '@openelement/i18n';

export function getStaticPaths() {
  return i18nStaticPaths(); // 展开所有 locale 路径
}

// 生成跨 locale 链接
const enPath = switchLocale('/zh/about', 'en'); // -> '/en/about'
```

### 独立使用（需显式传递 ctx）

```ts
import { openI18n } from '@openelement/i18n';
import { less } from '@openelement/adapter-vite';
import { OpenElementBuildContext } from '@openelement/adapter-vite/build-context';
import { defineConfig } from 'vite';

const ctx = new OpenElementBuildContext({});

export default defineConfig({
  plugins: [
    ...createOpenPlugin({ routesDir: 'app/routes' }, ctx),
    openI18n({ locales: ['en', 'zh'], defaultLocale: 'en', ctx }),
  ],
});
```

## 许可

MIT
