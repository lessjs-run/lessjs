# 主流框架路由机制对比分析

> 调研目标：分析主流框架如何处理路由，特别关注静态站点 + SPA 增强场景，为 LessJS 路由设计提供参考。
>
> 调研时间：2026-05-30

---

## 一、对比总览表

| 框架                   | 动态参数                                | 文件系统路由             | 编程式路由                  | SSR/CSR 路由共享          | .md/内容集成                    | 路由类型安全      |
| ---------------------- | --------------------------------------- | ------------------------ | --------------------------- | ------------------------- | ------------------------------- | ----------------- |
| **Hono**               | `:name`, `:name?`, `:name{regex}`       | 仅 HonoX                 | `app.get('/path', handler)` | 无（MPA 模式）            | 无内置支持                      | 部分              |
| **HonoX**              | `[name]`, `[...slug]`, `(group)`        | 是（`import.meta.glob`） | 否                          | 无（MPA + Islands 水合）  | 无内置支持                      | 部分              |
| **Astro**              | `[param]`, `[...path]`                  | 是（`src/pages/`）       | 否                          | SSR 模式 + 客户端 Islands | 原生支持（Content Collections） | 通过 TypeScript   |
| **Next.js App Router** | `[slug]`, `[...slug]`, `[[...slug]]`    | 是（`app/` 目录）        | `useRouter`（客户端导航）   | RSC + 客户端导航          | 通过 `generateStaticParams`     | 强（TS params）   |
| **Fresh**              | `[name]`                                | 是（`routes/` 目录）     | 否                          | MPA + Islands             | 无内置支持                      | 通过 TypeScript   |
| **Remix**              | `$param`, `$param?`                     | 是（`app/routes/`）      | 否（基于文件）              | SSR + 客户端水合          | 通过 loader                     | 部分              |
| **TanStack Router**    | `$param`（文件）/ `path: ':id'`（编程） | 是（可选）               | 是（核心 API）              | 仅客户端（React/Solid）   | 无                              | **100% 类型安全** |

---

## 二、各框架详细分析

### 1. Hono + HonoX

**路由核心机制：**

Hono 是一个基于 Web 标准的轻量级 HTTP 框架，其路由机制非常灵活：

```typescript
// 编程式路由（Hono 核心）
const app = new Hono();

// 基础路由
app.get('/', (c) => c.text('Hello'));

// 动态参数 + 正则约束
app.get('/post/:date{[0-9]+}/:title{[a-z]+}', (c) => {
  const { date, title } = c.req.param();
});

// 可选参数
app.get('/api/animal/:type?', (c) => c.text('Animal'));

// Catch-all（通配符）
app.get('/wild/*/card', (c) => c.text('...'));

// 路由分组（子应用）
const user = new Hono().basePath('/user');
user.get('/', (c) => c.text('List Users'));
app.route('/', user);
```

**HonoX 文件路由：**

HonoX 是 Hono 的元框架，通过 `import.meta.glob` 扫描 `routes/` 目录自动生成路由表：

| 文件路径                           | URL 模式       | 路由类型  |
| ---------------------------------- | -------------- | --------- |
| `routes/index.tsx`                 | `/`            | 静态      |
| `routes/about/[name].tsx`          | `/about/:name` | 动态      |
| `routes/merch/[...slug].tsx`       | `/merch/*`     | Catch-all |
| `routes/blog/(content)/[name].tsx` | `/blog/:name`  | 路由组    |
| `_renderer.tsx`                    | —              | 全局布局  |
| `_middleware.ts`                   | —              | 中间件    |
| `_404.tsx`                         | —              | 404 处理  |
| `_error.tsx`                       | —              | 错误处理  |

**SSR + 客户端路由：**

HonoX **没有 SPA 式的客户端路由**。架构是纯 MPA：

- 每次导航都是完整的 SSR 请求
- 客户端只负责 Islands 组件的水合（`createClient` 函数）
- 不是"SSR 第一屏 + 后续 SPA 导航"模式

```
服务端 (SSR): createApp() → 文件路由 → 中间件 → 布局渲染 → 返回完整 HTML
客户端:     createClient() → Islands 水合（仅交互组件加载 JS）
```

**对 LessJS 的启示：**

- Hono 的编程式路由 API 非常灵活，但缺少"SSR 同构"的客户端路由层
- 文件路由 + 中间件模式值得借鉴
- 如果需要 SSR → SPA 平滑过渡，需要额外设计

---

### 2. Astro

**路由核心机制：**

Astro 使用约定式文件路由，`src/pages/` 目录结构直接映射为 URL：

```
src/pages/index.astro        → /
src/pages/about.astro        → /about
src/pages/about/me.astro     → /about/me
src/pages/posts/1.md         → /posts/1
```

**动态参数支持：**

```astro
<!-- src/pages/dogs/[dog].astro -->
---
export function getStaticPaths() {
  return [
    { params: { dog: "clifford" } },
    { params: { dog: "rover" } },
    { params: { dog: "spot" } },
  ];
}
const { dog } = Astro.params;
---
<div>Good dog, {dog}!</div>
```

- `[param]` — 单级动态参数
- `[...path]` — 多级 Catch-all
- 多参数：`[lang]-[version]/info.astro`
- SSR 模式下不需要 `getStaticPaths()`，按需渲染

**内容集合集成：**

Astro 对 `.md` 内容的支持是最强的：

```astro
<!-- src/pages/blog/[...slug].astro -->
---
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const blogPosts = await getCollection('blog');
  return blogPosts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
---
<article>
  <h1>{post.data.title}</h1>
  <Content />
</article>
```

内容集合在 `src/content/` 目录下组织，通过 `getCollection()` 获取，与路由系统深度集成。

**SSR + 客户端路由：**

- 默认 SSG（静态生成），可选 SSR
- 客户端仅对交互组件（Islands）发送 JS
- `<ViewTransitions />` 提供类似 SPA 的导航体验（不依赖客户端路由）

**对 LessJS 的启示：**

- **内容集合与路由的集成模式** — 这是 LessJS DSD/SSG 场景可以直接借鉴的核心能力
- `getStaticPaths()` + `getCollection()` 的组合非常优雅
- 路由优先级规则（静态 > 具名动态 > Rest 参数）清晰明了
- ViewTransitions 作为 SPA 增强的轻量替代方案

---

### 3. Next.js App Router

**路由核心机制：**

Next.js App Router 基于 `app/` 目录的文件夹结构生成路由：

```
app/
├── layout.js                 ← 根布局（必须）
├── page.js                   ← /
├── dashboard/
│   ├── layout.js             ← /dashboard 布局
│   ├── page.js               ← /dashboard
│   ├── settings/
│   │   └── page.js           ← /dashboard/settings
│   └── analytics/
│       └── page.js           ← /dashboard/analytics
├── blog/
│   └── [slug]/
│       └── page.js           ← /blog/:slug
└── (marketing)/              ← 路由组（不影响 URL）
    └── about/
        └── page.js           ← /about
```

**动态段语法：**

| 语法          | 说明           | 示例                            | 匹配                 |
| ------------- | -------------- | ------------------------------- | -------------------- |
| `[slug]`      | 单级动态段     | `app/blog/[slug]/page.tsx`      | `/blog/hello`        |
| `[...slug]`   | Catch-all 段   | `app/shop/[...slug]/page.tsx`   | `/shop/a/b/c`        |
| `[[...slug]]` | 可选 Catch-all | `app/shop/[[...slug]]/page.tsx` | `/shop`, `/shop/a/b` |

**SSR + 客户端路由：**

Next.js 采用 **React Server Components (RSC) + 客户端导航** 的混合模式：

- 首屏：SSR 渲染 RSC payload
- 导航：客户端 `<Link>` 或 `useRouter` 发起请求，但通过 RSC payload 增量更新
- 共享布局在不同页面间保持状态，不重新渲染
- 客户端缓存 RSC payload（按路由段分割）

```tsx
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// 声明式导航（推荐）
<Link href="/dashboard">Dashboard</Link>

// 编程式导航
const router = useRouter()
router.push('/dashboard')
```

**对 LessJS 的启示：**

- 文件夹 → URL 映射 + 特殊文件约定（`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`）的设计模式非常成熟
- `generateStaticParams` 是静态生成 + 动态参数的桥梁
- 路由组 `(group)` 不影响 URL 但组织代码的思路实用
- RSC 的增量导航模式对"静态站点 + SPA 增强"很有参考价值

---

### 4. Fresh (Deno)

**路由核心机制：**

Fresh 采用约定式文件路由，`routes/` 目录下的文件自动映射为 URL：

```
routes/
├── index.tsx              → /
├── about.tsx              → /about
├── about/contact.tsx      → /about/contact
├── greet/[name].tsx       → /greet/:name（动态）
└── api/
    └── joke.ts            → /api/joke（API 路由）
```

**动态参数：**

```tsx
// routes/greet/[name].tsx
import { PageProps } from '$fresh/server.ts';

export default function GreetPage(props: PageProps) {
  const { name } = props.params;
  return <p>Greetings to you, {name}!</p>;
}
```

**Islands 架构与路由的关系：**

Fresh 的核心理念是"零 JS 下发 + 选择性水合"：

| 目录       | 运行环境 | JS 下发 | 用途                        |
| ---------- | -------- | ------- | --------------------------- |
| `routes/`  | 仅服务端 | 否      | 页面路由，渲染纯 HTML       |
| `islands/` | 客户端   | 是      | 交互组件，由 Fresh 自动管理 |

```tsx
// islands/Counter.tsx
import { useState } from 'preact/hooks';
import { IS_BROWSER } from '$fresh/runtime.ts';

export default function Counter(props: { start: number }) {
  const [count, setCount] = useState(props.start);
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count - 1)} disabled={!IS_BROWSER}>-1</button>
      <button onClick={() => setCount(count + 1)} disabled={!IS_BROWSER}>+1</button>
    </div>
  );
}
```

在路由中直接引用 Islands：

```tsx
// routes/index.tsx
import Counter from '../islands/Counter.tsx';

export default function Home() {
  return (
    <div>
      <p>Welcome to Fresh.</p>
      <Counter start={3} />
    </div>
  );
}
```

**其他路由特性：**

- Handler route：具名导出 `handler` 函数处理 HTTP 请求
- 混合模式：同文件可同时包含 Component 和 Handler
- 无构建步骤：基于 Deno 的直接执行模型

**对 LessJS 的启示：**

- Islands 架构非常适合"静态站点 + 少量交互"的场景
- Handler + Component 的混合路由模式兼具灵活性和简洁性
- `IS_BROWSER` 守卫模式确保服务端/客户端代码安全分离
- 无构建步骤的理念与 Lit SSR 的流式渲染可以互补

---

### 5. Remix

**路由核心机制：**

Remix 基于 React Router 构建，使用文件系统路由：

```
app/routes/
├── _index.tsx                → /
├── about.tsx                 → /about
├── users.$userId.tsx         → /users/:userId
├── users.$userId_.edit.tsx   → /users/:userId/edit
├── blog.$.tsx                → /blog/*（splat）
└── _layout.tsx               → 布局路由
```

**动态段语法：**

| 文件          | URL        | 说明            |
| ------------- | ---------- | --------------- |
| `$param.tsx`  | `/:param`  | 基本动态段      |
| `$param?.tsx` | `/:param?` | 可选动态段      |
| `$.tsx`       | `/*`       | Splat/Catch-all |
| `_layout.tsx` | 包裹子路由 | 布局路由        |
| `_index.tsx`  | `/`        | 索引路由        |

**路由模块导出：**

每个路由文件是一个模块，可以导出以下内容：

```tsx
// app/routes/users.$userId.tsx
export async function loader({ params }) {
  return await getUser(params.userId)    // 数据加载
}

export async function action({ request }) {
  // 数据变更（表单提交等）
}

export default function Component() {
  const data = useLoaderData()            // 使用数据
  return <div>{data.name}</div>
}

export function ErrorBoundary() { ... }   // 错误处理
export function meta() { ... }            // SEO 元数据
export function headers() { ... }         // HTTP 头
```

**路由发现：**

Remix 支持"惰性路由发现"（Lazy Route Discovery），可按需加载路由模块，优化首屏性能。

**数据流特点：**

Remix 强调"加载器-操作-组件"的数据流模式：

- `loader` — 服务端数据获取（GET）
- `action` — 服务端数据变更（POST/PUT/DELETE）
- `Component` — 渲染
- 导航时自动并行执行所有匹配路由的 loader

**对 LessJS 的启示：**

- `loader` + `action` 模式将路由与数据获取紧密绑定
- 扁平文件结构（用 `.` 替换 `/`）vs 嵌套文件夹，各有利弊
- Lazy Route Discovery 对大站点性能优化有参考价值
- 需要在 SSR 静态站点场景中评估数据获取模式的适用性

---

### 6. TanStack Router

**路由核心机制：**

TanStack Router 是一个独立的路由库，同时支持**编程式路由**和**文件路由**：

**编程式（Code-Based）：**

```tsx
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div>Hello World</div>,
});

const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/user/$userId',
  component: () => {
    const { userId } = userRoute.useParams();
    return <div>User: {userId}</div>;
  },
});

const routeTree = rootRoute.addChildren([indexRoute, userRoute]);
const router = createRouter({ routeTree });
```

**文件路由（File-Based）：**

类似 Next.js 的约定式结构，通过 CLI 工具自动生成路由树。支持虚拟文件路由（Virtual File Routes）。

**核心特色：**

| 特性             | 说明                                             |
| ---------------- | ------------------------------------------------ |
| 类型安全         | 路径参数、Search Params 全部类型化，无字符串魔数 |
| Search Param API | 支持 schema 校验（Zod）、类型推导、前后处理      |
| 并行 Loader      | 多个路由的 loader 并行执行，避免瀑布请求         |
| 自动代码分割     | 文件路由模式自动分割                             |
| 轻量             | 压缩后仅 12kb                                    |
| 路由遮罩         | 不变更 URL 显示不同内容                          |
| 滚动恢复         | 内置支持                                         |

**Search Param 类型安全示例：**

```tsx
const searchRoute = createRoute({
  path: '/search',
  validateSearch: (search) => ({
    query: z.string().parse(search.query),
    page: z.number().optional().default(1),
  }),
});
```

**对 LessJS 的启示：**

- **Search Param 的类型安全处理** 是最值得借鉴的特性
- 编程式路由与文件路由的双轨制可以在不同场景灵活选择
- 12kb 的轻量体积证明功能丰富不一定要大体积
- 类型辅助（ESLint 插件）为路由开发提供了极好的 DX

---

### 7. path-to-regexp vs URLPattern

**对比分析：**

| 维度              | path-to-regexp                             | URLPattern                                   |
| ----------------- | ------------------------------------------ | -------------------------------------------- |
| **来源**          | 第三方 NPM 库（pillarjs/path-to-regexp）   | 浏览器原生 Web API                           |
| **规范**          | 自定义语法（`:name`, `:name?`, `*`, 正则） | WHATWG URL Pattern 规范                      |
| **匹配范围**      | 仅路径（pathname）                         | 完整 URL（协议/主机/端口/路径/查询/哈希）    |
| **兼容性**        | 所有 JS 运行时（Node/Deno/Bun/浏览器）     | Baseline 2025（2025年9月起主流浏览器均支持） |
| **体积**          | ~3KB（压缩后）                             | 0（浏览器内置）                              |
| **Bun/Deno 支持** | 是                                         | 部分（需要运行时实现）                       |
| **正则捕获组**    | 完全支持                                   | 有限支持（`hasRegExpGroups` 检测）           |
| **服务端使用**    | 无限制                                     | Node.js 21+ 实验性支持                       |
| **命名组**        | `:name` / `:name{regex}`                   | `:name`                                      |
| **通配符**        | `*`, `**`                                  | `*`（单级）, 无 `**` 等价物                  |
| **可选参数**      | `:name?`                                   | 不直接支持                                   |
| **生态成熟度**    | 极高（Express/React Router/Hono 等）       | 较新，社区资料少                             |

**语法兼容性：**

URLPattern 的语法设计**基于** path-to-regexp，两者核心模式兼容：

- `:name` — 命名捕获组
- `*` — 单级通配符
- 文字字符串精确匹配

**主要差异：**

1. **path-to-regexp** 提供更多高级特性：
   - 正则约束（`:name{[0-9]+}`）
   - 可选参数（`:name?`）
   - 多级通配（`**`）
   - 自定义匹配器

2. **URLPattern** 的优势：
   - 零依赖（浏览器原生）
   - 全面 URL 组件匹配
   - Worker 线程可用
   - 标准化语法保证长期稳定

**共存方案：**

可以设计一个统一的 RoutePattern 接口，在服务端使用 path-to-regexp，在客户端优先使用 URLPattern：

```typescript
interface RouteMatcher {
  match(path: string): Record<string, string> | null;
  test(path: string): boolean;
}

// 服务端适配器
class PathToRegexpMatcher implements RouteMatcher {
  private regexp: RegExp;
  private keys: string[];

  constructor(pattern: string) {
    const result = pathToRegexp(pattern);
    this.regexp = result.regexp;
    this.keys = result.keys;
  }

  match(path: string) {
    const m = this.regexp.exec(path);
    if (!m) return null;
    const params: Record<string, string> = {};
    this.keys.forEach((key, i) => params[key.name] = m[i + 1]);
    return params;
  }
}

// 客户端适配器（URLPattern 可用时）
class URLPatternMatcher implements RouteMatcher {
  private pattern: URLPattern;

  constructor(pattern: string) {
    this.pattern = new URLPattern({ pathname: pattern });
  }

  match(path: string) {
    const result = this.pattern.exec({ pathname: path });
    return result?.pathname?.groups ?? null;
  }
}
```

**对 LessJS 的启示：**

- SSG/服务端场景优先用 path-to-regexp（成熟、灵活）
- 客户端 SPA 增强场景可考虑 URLPattern（零依赖、快速）
- 设计抽象层使得未来可以平滑切换到 URLPattern
- 注意：Deno 对 URLPattern 的支持优于 Node.js

---

## 三、对 LessJS 的设计建议

基于以上调研，对 LessJS 路由设计提出以下建议：

### 3.1 核心能力优先级

| 优先级 | 能力                     | 参考               | 理由                   |
| ------ | ------------------------ | ------------------ | ---------------------- |
| P0     | 文件系统路由（Flat）     | Fresh / HonoX      | 简单直接，适合静态站点 |
| P0     | 动态参数 `[slug]`        | Astro / Next.js    | SSG 场景必需           |
| P0     | 编程式路由 API           | Hono               | 灵活性和可扩展性基础   |
| P1     | Content Collections 集成 | Astro              | LessJS 核心场景        |
| P1     | SSR + SPA 增强路由共享   | Next.js / TanStack | 渐进式增强             |
| P1     | 中间件链                 | Hono/HonoX         | 认证、重定向等         |
| P2     | Search Param 类型安全    | TanStack Router    | DX 提升                |
| P2     | 路由组 `(group)`         | HonoX / Next.js    | 代码组织               |

### 3.2 推荐架构

```
LessJS 路由设计
├── 服务端路由（SSG/SSR）
│   ├── 文件系统路由解析器（基于 import.meta.glob）
│   ├── 编程式路由注册（兼容 Hono 风格）
│   ├── 中间件链
│   └── 动态参数 + 约束（path-to-regexp）
│
├── 客户端路由（SPA 增强）
│   ├── 与 SSR 路由共享路径定义
│   ├── Islands/活性标记的水合
│   ├── URLPattern（兜底 path-to-regexp）
│   └── ViewTransitions API 集成
│
└── 内容路由（Content Collections）
    ├── .md/.mdx 自动路由生成
    ├── getStaticPaths() 接口
    └── Frontmatter → 路由元数据
```

### 3.3 关键决策

1. **路由定义共享**：路由模式在 SSR 和 CSR 之间共享定义，用一个 JSON/TS 路由 manifest 桥接
2. **Hybrid MPA+SPA**：借鉴 Astro ViewTransitions + Fresh Islands，而非全量 SPA 路由
3. **内容驱动路由**：将 Content Collections 作为一等路由源，类似 Astro 但适配 Lit SSR 输出
4. **渐进增强**：静态站点默认 MPA，按需注水 SPA 导航，不需要全有或全无

---

## 四、总结

| 框架                   | 最大优势                                  | LessJS 最值得借鉴            |
| ---------------------- | ----------------------------------------- | ---------------------------- |
| **Hono/HonoX**         | 编程式路由灵活 + 文件路由简单             | 中间件 + 路由分组 + 文件路由 |
| **Astro**              | 内容集合与路由深度集成                    | Content Collections 路由生成 |
| **Next.js App Router** | RSC + 客户端导航混合架构                  | 路由段粒度 + 并行路由        |
| **Fresh**              | Islands 架构 + 零 JS 下发                 | Islands 与路由的结合方式     |
| **Remix**              | 路由模块一体化（loader/action/component） | 路由数据流模式               |
| **TanStack Router**    | 100% 类型安全 + Search Param API          | Search Param 类型系统        |
| **URLPattern**         | 原生 API + 零依赖                         | 客户端路由匹配的轻量方案     |
