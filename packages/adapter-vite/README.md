# @lessjs/adapter-vite

LessJS Vite 构建编排适配器 — 路由扫描、Island 转换、SSG 三阶段管线。

**不含运行时。** 纯运行时（renderDSD, island, escapeHtml 等）在 `@lessjs/core`。

## 安装

```bash
deno add jsr:@lessjs/adapter-vite
```

## 导出路径

```json
{
  ".": "./src/index.ts",            // less() 插件 + 构建工具
  "./build-context": "./src/build-context.ts", // LessBuildContext
  "./virtual-ids": "./src/virtual-ids.ts"      // 虚拟模块 ID
}
```

## `.` — 主入口

### `less()` Vite 插件

生成 7 个插件构成的插件数组：

| 插件名 | 职责 |
|--------|------|
| `less:core` | 路由扫描、Hono entry 生成、config 注入 |
| `less:core-resolve` | JSR 远程 @lessjs/core 子路径解析（ADR 0016） |
| `less:data-dispatch` | 分发虚拟数据模块解析到 content/i18n 插件 |
| `less:virtual-entry` | `virtual:less-hono-entry` 虚拟模块 |
| `@hono/vite-dev-server` | 开发服务器 Hono SSR |
| `less:island-transform` | Island 组件标记转换 |
| `less:build` | Phase 2/3 SSG 构建编排 |
| `less:devtools` | 开发调试工具 |

```ts
// vite.config.ts
import { less } from '@lessjs/adapter-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    less({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      html: { title: 'My App' },
    }),
  ],
});
```

### 配置选项

| 选项 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `routesDir` | `string` | `'app/routes'` | 页面路由目录 |
| `islandsDir` | `string` | `'app/islands'` | Island 组件目录 |
| `componentsDir` | `string` | `'app/components'` | 共享组件目录 |
| `html` | `HtmlConfig?` | `{}` | HTML 模板配置（title、lang、head） |
| `middleware` | `string[]?` | — | 全局中间件路径 |
| `inject` | `InjectConfig?` | — | 自定义 head 注入（stylesheets, scripts, headFragments） |
| `packageIslands` | `string[]?` | — | 第三方包 Island（如 `['@lessjs/ui']`） |
| `island` | `IslandConfig?` | — | Island 升级策略等 |
| `headExtras` | `string?` | — | 自定义 head 片段 HTML |

### 构建工具函数

```ts
import {
  LessBuildContext,
  printBuildManifest,
  scanClientBuild,
  scanSSGOutput,
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  injectClientScript,
  injectCspMeta,
  injectDsdPolyfill,
  injectSpeculationRules,
  injectViewTransitionMeta,
  insertAfterHead,
  extractCustomElementTags,
  generateIslandManifests,
  writeIslandManifests,
} from '@lessjs/adapter-vite';
```

## `./build-context` — 构建上下文

```ts
import { LessBuildContext } from '@lessjs/adapter-vite/build-context';

const ctx = new LessBuildContext(options);
// 跨 Phase 共享状态: routes, island manifests, data
```

构建上下文是三个 SSG Phase 之间的数据桥梁：
- **Phase 1**: 路由扫描 → ctx.phase1 写入 routes / honoEntryCode / islandTagNames
- **Phase 2**: 客户端 Island 构建 → ctx.phase2 写入 islandManifests
- **Phase 3**: SSG 渲染 → 读取前面两阶段产物，输出静态 HTML

## `./virtual-ids` — 虚拟模块 ID 常量

```ts
import {
  VIRTUAL_ENTRY_ID,
  RESOLVED_ENTRY_ID,
  VIRTUAL_CLIENT_ENTRY_ID,
  RESOLVED_CLIENT_ENTRY_ID,
  VIRTUAL_SSG_ENTRY_ID,
  RESOLVED_SSG_ENTRY_ID,
  VIRTUAL_NAV_ID,
  RESOLVED_NAV_ID,
  VIRTUAL_BLOG_DATA_ID,
  RESOLVED_BLOG_DATA_ID,
  VIRTUAL_I18N_DATA_ID,
  RESOLVED_I18N_DATA_ID,
} from '@lessjs/adapter-vite/virtual-ids';
```

## SSG 三阶段管线

```
Phase 1: less() Vite Plugin
  → 路由扫描 + Island 扫描
  → 生成 virtual:less-hono-entry（Hono 应用代码）
  → closeBundle() 触发 Phase 2/3

Phase 2: buildClient()
  → 生成 virtual:less-client-entry
  → viteBuild() islands → dist/client/islands/*.js

Phase 3: buildSSG()
  → 生成 virtual:less-ssg-entry
  → viteBuild(ssr:true, noExternal) → SSR bundle
  → 加载 bundle → Hono toSSG() → 静态 HTML
  → 后处理: client script, View Transitions, Speculation Rules,
    CSP, DSD polyfill, PWA
```

## 推荐用法

对于结合 content + i18n 的完整项目，推荐使用 `@lessjs/app` 的统一 `lessjs()` 入口而不是直接使用 `less()`：

```ts
// vite.config.ts (推荐)
import { lessjs } from '@lessjs/app';

export default defineConfig({
  plugins: [
    lessjs({
      routesDir: 'app/routes',
      content: { blog: { contentDir: 'content/blog' } },
      i18n: { locales: ['en', 'zh'], defaultLocale: 'en' },
    }),
  ],
});
```

## 许可

MIT
