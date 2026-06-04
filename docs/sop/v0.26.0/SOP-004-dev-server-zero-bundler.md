# SOP-004: Dev Server 零 Bundler — Deno.serve 直跑

> **Priority**: P1 | **预估**: 5h | **依赖**: SOP-001 | **ADR**: ADR-0061

## Objective

实现 `deno task dev:fast` — 零 bundler 开发模式。用 Deno.serve + Hono 直接跑源码，Vite 降级为可选的 HMR 增强。

## Background

当前 `deno task dev` 必须经过 Vite dev server。Vite 提供 HMR 和虚拟模块解析，但也带来冷启动延迟和复杂性。

解耦后（SOP-001 完成），路由文件不再依赖 Vite 虚拟模块，可以 Deno 原生 serve。

## 架构

```
dev:fast (零 bundler)              dev:hmr (可选)
─────────────────────              ─────────────
Deno.serve                          Vite dev server
  ├── Hono app                        ├── HMR (保留)
  ├── SSR middleware                   ├── Virtual module (已废弃)
  ├── Static file server              └── 打包/transform
  └── SPA fallback

冷启动: < 1s                       冷启动: 3-5s
```

## Step 1: 创建 SSR Middleware (1.5h)

**文件**: `www/app/server.ts`（新建）

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/deno';

import 'jsr:@openelement/adapter-lit/ssr';
import 'jsr:@openelement/adapter-vanilla/ssr';
import 'jsr:@openelement/adapter-react/ssr';

const app = new Hono();

// Middleware
app.use('*', cors());

// SSR — render routes on demand (equivalent to Vite dev server SSR)
app.get('*', async (c) => {
  // Import and call the route's render function
  // Equivalent to what Vite dev server does with virtual:less-hono-entry
  const { default: renderRoute } = await import(
    `./dist/server/entry.js?t=${Date.now()}`
  );
  return renderRoute(c.req.url);
});

// Static files
app.get('/client/*', serveStatic({ root: './dist' }));

Deno.serve({ port: 3000 }, app.fetch);
```

## Step 2: 创建 Static File Server (1h)

**文件**: `www/app/middleware/static.ts`（新建）

```typescript
import type { Context, Next } from 'hono';

const STATIC_EXTS = [
  '.js',
  '.css',
  '.svg',
  '.png',
  '.jpg',
  '.woff2',
  '.json',
  '.ico',
  '.txt',
  '.xml',
  '.webmanifest',
];

export function staticFiles(): (c: Context, next: Next) => Promise<void> {
  return async (c, next) => {
    const url = new URL(c.req.url);
    if (STATIC_EXTS.some((ext) => url.pathname.endsWith(ext))) {
      // In dev:fast, serve from dist/client/
      const file = await Deno.readFile(`./dist/client${url.pathname}`);
      const contentType = getContentType(url.pathname);
      return new Response(file, {
        headers: { 'content-type': contentType, 'cache-control': 'no-cache' },
      });
    }
    await next();
  };
}
```

## Step 3: 添加 dev:fast task (0.5h)

**文件**: `deno.json`（根）

```json
{
  "tasks": {
    "dev": "cd www && deno task dev",
    "dev:fast": "cd www && deno run --allow-read --allow-net --allow-env --allow-run app/server.ts",
    "dev:hmr": "cd www && deno task dev"
  }
}
```

## Step 4: 创建可选的 HMR 增强 (1h)

**文件**: `www/app/middleware/hmr.ts`（新建）

```typescript
// Optional: inject HMR client script for Vite-enhanced dev
// When using dev:hmr, Vite injects this automatically
// When using dev:fast, skip HMR entirely

export function hmrPing(): Response {
  return new Response(
    `data: {"type":"connected"}\n\n`,
    { headers: { 'content-type': 'text/event-stream' } },
  );
}
```

## Step 5: 性能验证 + 文档 (1h)

```bash
# 冷启动速度
time deno task dev:fast  # 目标 < 1s

# 功能验证
# 访问 http://localhost:3000 → 首页正常渲染
# 访问 http://localhost:3000/guide/getting-started → 路由正常
# 访问 http://localhost:3000/en/guide/getting-started → i18n 正常

# 对比
time deno task dev:hmr  # 对比 Vite 冷启动
```

**验收**: `dev:fast` 冷启动 < 1s，所有路由可访问，无 Vite 依赖。
