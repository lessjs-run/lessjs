# @lessjs/core

LessJS 纯运行时 — DSD SSR 渲染、Island 升级、导航、日志。

**不含 Vite、不含 CLI、不含构建逻辑。** 构建编排在 `@lessjs/adapter-vite`，统一入口在 `@lessjs/app`。

## 安装

```bash
deno add jsr:@lessjs/core
```

## 导出路径

```json
{
  ".": "./src/index.ts",         // 所有运行时导出
  "./errors": "./src/errors.ts", // LessError / SsrRenderError
  "./context": "./src/context.ts", // SSR 上下文
  "./logger": "./src/logger.ts", // createLogger()
  "./navigation": "./src/navigation.ts", // 客户端导航
  "./constants": "./src/constants.ts"    // 常量
}
```

## `.` — 主入口

从 `@lessjs/core` 导入：

```ts
// 渲染
import { renderDSD, renderDSDByName, escapeHtml, escapeAttr, escapeAttrValue } from '@lessjs/core';
import { renderSsrError, wrapInDocument, camelToKebab } from '@lessjs/core';

// Island
import { island, lessBind, getSSRProps } from '@lessjs/core';
import type { IslandOptions } from '@lessjs/core';

// 适配器
import { registerAdapter, getAdapter } from '@lessjs/core';
import type { RenderAdapter } from '@lessjs/core';

// 错误
import { LessError, SsrRenderError } from '@lessjs/core';

// SSR 上下文
import { createSsrContext, extractParams, parseQuery } from '@lessjs/core';
import type { SsrContext, RouteEntry, FrameworkOptions } from '@lessjs/core';

// 类型
import type { ComponentLayer, DsdOptions, HydrateEventDescriptor } from '@lessjs/core';
import type { SafeHtml, UnsafeHtml } from '@lessjs/core';
```

## `./logger` — 结构化日志

```ts
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('my-package');
log.info('Hello');
log.warn('Something is off');
log.error('Something broke', err);
```

级别：`debug` | `info` | `warn` | `error`

## `./errors` — 错误类型

```ts
import { LessError, SsrRenderError } from '@lessjs/core/errors';

// LessError: 通用框架错误
throw new LessError('Route scan failed', 'ROUTE_SCAN_ERROR', 500);

// SsrRenderError: 渲染阶段错误（4xx/5xx）
throw new SsrRenderError(404, 'Page not found');
```

## `./context` — SSR 上下文

```ts
import { createSsrContext, extractParams, parseQuery } from '@lessjs/core/context';

const ctx = createSsrContext({
  request: new Request('https://example.com/posts/hello'),
  params: { slug: 'hello' },
});

// 提取路由参数
const { slug } = extractParams(ctx, ['slug']);

// 解析查询字符串
const query = parseQuery(ctx, ['page', 'tag']);
```

## `./navigation` — 客户端导航

```ts
import { navigate, onNavigate, matchRoute, hasNavigationApi } from '@lessjs/core/navigation';
import type { NavigationCallback } from '@lessjs/core/navigation';

// 编程式导航
navigate('/blog/hello-world');

// 监听导航事件
onNavigate(({ url }) => console.log('Navigated to', url));

// 检查浏览器是否支持 Navigation API
if (hasNavigationApi()) { /* 使用原生 Navigation API */ }
```

## 核心渲染模型

```
Route component → render() → string
  → renderDSD() → L2 嵌套 DSD HTML（parse5 AST 递归）
  → SSG 输出: static HTML + inline DSD templates
  → 浏览器: 原生 DSD 附加 → Custom Element 升级
  → DSD Hydration: 跳过重渲染，仅绑定事件
  → Island chunk 按需加载
```

## 许可

MIT
