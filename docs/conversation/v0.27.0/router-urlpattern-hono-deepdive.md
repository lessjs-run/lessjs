# URLPattern + Hono 集成深度调研

> 调研日期: 2026-05-30\
> 目标: 评估在 LessJS SSR/SSG 路由系统中使用 URLPattern 作为路由匹配核心的可行性，以及与 Hono 路由的集成方案。

---

## 1. URLPattern 规范深度解析

### 1.1 规范来源

URLPattern 由 WHATWG 维护为 Living Standard：

- **规范**: <https://urlpattern.spec.whatwg.org/>
- **API 参考**: <https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API>
- **GitHub**: <https://github.com/whatwg/urlpattern>
- **Polyfill**: <https://github.com/kenchris/urlpattern-polyfill>

### 1.2 核心 API

```typescript
class URLPattern {
  constructor(init?: URLPatternInput, baseURL?: string);

  test(input?: URLPatternInput, baseURL?: string): boolean;
  exec(input?: URLPatternInput, baseURL?: string): URLPatternResult | null;

  // 只读属性 - 返回原始 pattern 字符串
  readonly protocol: string;
  readonly username: string;
  readonly password: string;
  readonly hostname: string;
  readonly port: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly hasRegExpGroups: boolean;
}

type URLPatternInput = URLPatternInit | string;

interface URLPatternInit {
  protocol?: string;
  username?: string;
  password?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
  baseURL?: string;
}

interface URLPatternResult {
  inputs: [URLPatternInit];
  protocol: URLPatternComponentResult;
  hostname: URLPatternComponentResult;
  port: URLPatternComponentResult;
  pathname: URLPatternComponentResult;
  search: URLPatternComponentResult;
  hash: URLPatternComponentResult;
  username: URLPatternComponentResult;
  password: URLPatternComponentResult;
}

interface URLPatternComponentResult {
  input: string;
  groups: Record<string, string | undefined>;
}
```

### 1.3 模式语法详解

URLPattern 语法基于 `path-to-regexp` 库设计，支持以下元素：

#### 命名组 (`:name`)

```js
const pattern = new URLPattern({ pathname: '/books/:id' });
pattern.exec('/books/123').pathname.groups; // { id: "123" }
```

#### 带正则约束的命名组 (`:name(regex)`)

```js
const pattern = new URLPattern('/books/:id(\\d+)', 'https://example.com');
pattern.test('/books/123'); // true
pattern.test('/books/abc'); // false
```

限制：

- 正则表达式只能包含 ASCII 代码点
- 正则放在 `()` 内，紧跟参数名
- 不支持带嵌套捕获组的正则（如 `(a|b)` 在某些上下文中）
- 使用正则组后 `hasRegExpGroups` 返回 `true`

#### 通配符 (`*`)

`*` 是**贪婪**的全匹配通配符，匹配零个或多个字符：

```js
const pattern = new URLPattern('/books/*', 'https://example.com');
pattern.test('/books/123'); // true
pattern.test('/books'); // false (斜杠必须匹配)
pattern.test('/books/'); // true
pattern.test('/books/123/456'); // true
```

注意：`*` 在不同 URL 组件中的默认匹配行为不同：

- `pathname` 中：匹配除 `/` 外的字符（段通配符）
- `hostname` 中：匹配除 `.` 外的字符
- 其他组件：匹配所有字符

#### 修饰符 (`?`, `+`, `*`)

| 修饰符 | 含义           | 示例                                        |
| ------ | -------------- | ------------------------------------------- |
| `?`    | 可选（0或1次） | `/books/:id?` 匹配 `/books` 和 `/books/123` |
| `+`    | 一个或多个     | `/:year+` 至少一个路径段                    |
| `*`    | 零个或多个     | `{:foo}*` 可重复零次或多次                  |

#### 组分隔符 (`{...}`)

`{}` 用于明确组的边界，内部内容不被捕获，但可应用修饰符：

```js
// 同时匹配 /book 和 /books
new URLPattern('/book{s}?').test('/book'); // true
new URLPattern('/book{s}?').test('/books'); // true

// 可选分隔符 + 捕获组
new URLPattern({ pathname: '/blog/:id(\\d+){-:title}?' });
// 匹配: /blog/123-my-post 和 /blog/123
```

#### 自动前缀行为

在 `pathname` 组件中，组前的 `/` 会自动成为组的前缀。当组被 `?` 修饰时，前缀也变为可选：

```js
// 自动前缀生效
new URLPattern('/foo/:bar?/baz').test('/foo/baz'); // true

// 禁用自动前缀
new URLPattern({ pathname: '/foo/{:bar}?' }).test('/foo/baz'); // false
```

#### 末尾斜杠处理

默认不匹配末尾斜杠：

```js
new URLPattern({ pathname: '/books' }).test('/books/'); // false
new URLPattern({ pathname: '/books/' }).test('/books'); // false

// 同时匹配两种
new URLPattern({ pathname: '/books{/}?' }).test('/books'); // true
new URLPattern({ pathname: '/books{/}?' }).test('/books/'); // true
```

#### 大小写敏感性

默认大小写敏感，可通过构造选项改为不敏感：

```js
const pattern = new URLPattern('https://example.com/2022/feb/*', {
  ignoreCase: true,
});
pattern.test('https://example.com/2022/Feb/xc44rsz'); // true
```

### 1.4 Base URL 继承

URL 组件按特异度排序：`protocol` > `hostname` > `port` > `pathname` > `search` > `hash`

- 只比输入中指定组件**更不特别**的组件才从 baseURL 继承
- `username` 和 `password` **永不**从 baseURL 继承
- 未指定也未继承的组件默认为通配符 `*`

```js
const pattern = new URLPattern({ pathname: '/foo/*' }, 'https://example.com');
// 等价于：protocol="https", hostname="example.com", pathname="/foo/*"
```

---

## 2. 浏览器支持矩阵

| 浏览器               | 最早支持版本       | 发布日期 | 当前状态 |
| -------------------- | ------------------ | -------- | -------- |
| **Chrome**           | 95                 | 2021-10  | 完全支持 |
| **Edge**             | 95                 | 2021-10  | 完全支持 |
| **Firefox**          | 142                | 2026-02  | 完全支持 |
| **Safari**           | 26.0 (Safari 18.2) | 2025-09  | 完全支持 |
| **Safari iOS**       | 26.0               | 2025-09  | 完全支持 |
| **Samsung Internet** | 17.0               | -        | 完全支持 |
| **Opera**            | 81+                | -        | 完全支持 |

### 关键里程碑

- **Baseline 2025**: 2025 年 9 月起，URLPattern 在所有主流浏览器中可用
- **全球覆盖率**: ~89.15%（截至 2026-05）
- **Firefox 滞后**: Firefox 直到 v142（2026-02）才支持，是最后一个加入的主流浏览器
- **不支持**: IE 全系列、Opera Mini、KaiOS

### 对 SPA/SSR 场景的影响

如果目标浏览器需要覆盖 Firefox < 142 或 Chrome < 95，**必须使用 polyfill**。

---

## 3. Deno URLPattern 实现

### 3.1 实现方式

Deno **原生实现**了 URLPattern，作为其 Web Platform API 的一部分，与 `URL`、`URLSearchParams` 等同级。

```typescript
// Deno 中直接可用，无需导入
const pattern = new URLPattern({ pathname: '/blog/:slug' });
pattern.test('https://example.com/blog/hello'); // true
```

### 3.2 底层引擎

Deno 使用与 Chromium 相同的 Rust crate `rust-urlpattern`（来自 `denoland` 组织）来实现 URLPattern：

- **Rust crate**: <https://github.com/denosaurs/urlpattern>（WASM + JS polyfill for non-Deno 环境）
- **Deno 文档**: <https://docs.deno.com/api/web/~/URLPattern>

### 3.3 与浏览器 API 的关系

Deno 的 URLPattern：

- 实现的是与 Chrome 相同的底层引擎
- API 接口与浏览器完全一致
- 行为与浏览器完全一致
- 无 Deno 特有的扩展或限制

### 3.4 可用版本

URLPattern 在 Deno 中早期就已支持（Deno 1.x 后期版本），当前最新 Deno 2.8.x 中工作正常且稳定。

---

## 4. Hono 路由器架构

### 4.1 内置路由器一览

Hono 提供**五种**内置路由器：

| 路由器            | 匹配方式             | 性能         | 适用场景          |
| ----------------- | -------------------- | ------------ | ----------------- |
| **SmartRouter**   | 包装器，自动选择最优 | 最优（委托） | 默认，推荐        |
| **RegExpRouter**  | 编译为单个大正则     | 最快         | 大多数场景        |
| **TrieRouter**    | 前缀树（Trie）       | 较快         | 复杂路由/歧义路由 |
| **LinearRouter**  | 线性遍历             | 较慢         | 一次性场景        |
| **PatternRouter** | 极简实现             | 中等         | 极小包体（<15KB） |

### 4.2 SmartRouter 选择逻辑

```typescript
new SmartRouter({
  routers: [new RegExpRouter(), new TrieRouter()],
});
```

- 启动时检测 RegExpRouter 是否支持所有路由
- 如果支持 → 使用 RegExpRouter（最快）
- 如果不支持（歧义路由、复杂正则）→ 回退到 TrieRouter

### 4.3 Hono 路由模式语法

| 语法类型 | 格式           | 示例                               |
| -------- | -------------- | ---------------------------------- |
| 静态段   | `/about`       | 精确匹配                           |
| 命名参数 | `:name`        | `/user/:id`                        |
| 可选参数 | `:name?`       | `/file/:name?`                     |
| 通配符   | `*`            | `/api/*` 或 `/wild/*/card`         |
| 正则约束 | `:name{regex}` | `:date{[0-9]+}`, `:file{.+\\.png}` |
| 全捕获   | `*` (路径)     | fallback 路由                      |

### 4.4 RegExpRouter 的限制

| 限制类型   | 说明                             | 示例                          |
| ---------- | -------------------------------- | ----------------------------- |
| 歧义路由   | 同一方法下两个不同结构的动态路径 | `/:id/:action` + `/posts/:id` |
| 嵌套捕获组 | 正则中的 `(a                     | b)` 等                        |

只有 TrieRouter 支持上述场景。

### 4.5 Hono 不基于 URLPattern

文档全文**未提及** URLPattern。Hono 的所有路由器都使用其自有的模式解析和匹配逻辑：

- RegExpRouter: `src/utils/url.ts` 中的 `getPattern()` 函数解析模式，编译为单一正则
- TrieRouter: 使用前缀树遍历
- 语法表面类似但**底层实现完全不同**

---

## 5. 模式语法兼容性对比

### 5.1 核心对比表

| 特性           |             URLPattern              |              Hono              |    path-to-regexp v8     |
| -------------- | :---------------------------------: | :----------------------------: | :----------------------: |
| 静态文本       |             `"/books"`              |           `"/books"`           |        `"/books"`        |
| 命名参数       |                `:id`                |             `:id`              |          `:id`           |
| 参数分隔符语法 |               `:name`               |            `:name`             |         `:name`          |
| 可选参数       |              `:name?`               |            `:name?`            |   `{/:name}` (花括号)    |
| 零或多个修饰符 |             `*` 修饰符              |           ❌ 不支持            | `/*splat` (花括号套通配) |
| 一或多个修饰符 |             `+` 修饰符              |           ❌ 不支持            |   `/*splat` (通配代替)   |
| 通配符         |            `*` (全匹配)             |           `*` (通配)           |    `*name` (必须命名)    |
| 正则约束位置   |        `:name(regex)` - `()`        |     `:name{regex}` - `{}`      |      不支持内联正则      |
| 正则能力       |          完整正则（ASCII）          |            完整正则            |  无内联正则（选项控制）  |
| 组分隔符       |         `{prefix}suffix?}`          |           ❌ 不支持            |  `{/:id}` (花括号分组)   |
| 自动前缀       |        pathname中`/`自动前缀        |             ❌ 无              |          ❌ 无           |
| 末尾斜杠       |             默认不匹配              |          通过展开处理          |     `trailing` 选项      |
| 大小写敏感     |           默认敏感可配置            |          通过框架处理          |     `sensitive` 选项     |
| URL全组件匹配  | protocol/host/port/path/search/hash | 仅 pathname（通过getPath扩展） |       仅 pathname        |
| `exec()` 返回  |   `URLPatternResult` (含所有组件)   |        `c.req.param()`         |    `{ path, params }`    |
| `test()` 方法  |              `boolean`              |          无直接等价物          |       无直接等价物       |
| 非贪婪通配符   |            ❌ (都是贪婪)            |         ❌ (都是贪婪)          |      ❌ (都是贪婪)       |

### 5.2 关键不兼容点

#### 不兼容 1: 可选参数语法

```js
// URLPattern: 直接在参数后加 `?`
'/books/:id?'; // 匹配 /books 和 /books/123

// Hono: 同样支持 `?`
'/books/:id?'; // 匹配 /books 和 /books/123

// path-to-regexp v8: 用花括号
'/books{/:id}'; // 匹配 /books 和 /books/123
```

**结论**: URLPattern 和 Hono 的可选参数语法兼容，但 path-to-regexp v8 不同。

#### 不兼容 2: 正则约束分隔符

```js
// URLPattern: 用小括号 ()
'/blog/:id(\\d+)';

// Hono: 用花括号 {}
'/blog/:id{[0-9]+}';

// path-to-regexp v8: 不支持内联正则
```

**结论**: 正则约束的定界符不同，URLPattern 和 Hono 模式**不兼容**。

#### 不兼容 3: 通配符行为

```js
// URLPattern: `*` 是贪婪的，匹配零个或多个字符
new URLPattern('/api/*').test('/api'); // true
new URLPattern('/api/*').test('/api/'); // true
new URLPattern('/api/*').test('/api/v1/users'); // true

// Hono: `*` 也被描述为"greedy"但行为类似
app.get('/api/*'); // 匹配 /api 及所有子路径

// path-to-regexp v8: `*name` 必须命名
match('/*splat')('/api/v1/users'); // { params: { splat: ['api', 'v1', 'users'] } }
```

**结论**: 基本行为兼容，但细节差异（如通配符是否必须命名）需要注意。

#### 不兼容 4: 路由参数提取方式

```js
// URLPattern: exec() 返回结构化结果
const result = pattern.exec('/books/123');
result.pathname.groups.id; // "123"

// Hono: c.req.param() 获取
app.get('/books/:id', (c) => {
  const id = c.req.param('id'); // "123"
});
```

**结论**: 两种 API 设计不同，但都可以提取参数。

---

## 6. Hono 与 URLPattern 共存方案

### 6.1 共享模式字符串的可能性

**核心问题**: Hono 和 URLPattern 能否使用**同一个**路由定义？

**答案**: 基本兼容但不完全。简单路由可以共享，复杂路由需要适配。

#### 可以共享的模式

```typescript
// 以下模式在 URLPattern 和 Hono 中行为一致
'/blog/:slug'; // 命名参数
'/user/:id'; // 命名参数
'/api/*'; // 通配符
'/file/:name?'; // 可选参数
'/static/*.css'; // 通配符 + 扩展名
```

#### 不能直接共享的模式

```typescript
// URLPattern: 小括号正则
'/book/:id(\\d+)'; // 在 Hono 中会被当作字面量 ()

// Hono: 花括号正则
'/book/:id{[0-9]+}'; // 在 URLPattern 中括号被解释为组分隔符

// 需要适配的格式：
// 统一为无正则约束的简单模式，或用中间层转换
```

### 6.2 推荐方案: 中间适配层

```typescript
// 定义统一的内部路由格式（两者都能从它生成）
interface RouteDefinition {
  pathname: string; // 简单模式，无正则
  paramNames: string[]; // 参数名列表
  priority?: number; // 匹配优先级
}

// 从 RouteDefinition 生成 URLPattern
function toURLPattern(route: RouteDefinition): URLPattern {
  return new URLPattern({ pathname: route.pathname });
}

// 从 RouteDefinition 生成 Hono 路由
function toHonoRoute(route: RouteDefinition): string {
  return route.pathname;
}
```

### 6.3 SSR/SSG 路由统一方案

```typescript
// 服务端使用 Hono 的路由机制
import { Hono } from 'hono';

const app = new Hono();

// 注册路由，同时提取路由定义供客户端使用
const routes = new Map<string, RouteDefinition>();

function defineRoute(
  method: string,
  path: string,
  handler: HonoHandler,
) {
  routes.set(path, { pathname: path, paramNames: extractParams(path) });
  app.on(method, path, handler);
}

// 导出路由定义表，供客户端 URLPattern 使用
export { routes };
```

---

## 7. 客户端 (SPA) 使用方案

### 7.1 方案 A: 原生 URLPattern

```typescript
// 适用于: Chrome 95+, Edge 95+, Safari 18.2+, Firefox 142+
const pattern = new URLPattern({ pathname: '/blog/:slug' });
const result = pattern.exec(window.location.pathname);

if (result) {
  const slug = result.pathname.groups.slug; // "my-post"
  // 渲染对应组件
}
```

### 7.2 方案 B: Polyfill + 条件加载

```typescript
// 推荐: 条件加载 polyfill
async function ensureURLPattern(): Promise<void> {
  if (!globalThis.URLPattern) {
    await import('urlpattern-polyfill');
  }
}

// 启动时调用
await ensureURLPattern();

// 之后正常使用
const pattern = new URLPattern({ pathname: '/blog/:slug' });
```

**Polyfill 详情**:

| 属性     | 值                                                |
| -------- | ------------------------------------------------- |
| 包名     | `urlpattern-polyfill`                             |
| 仓库     | <https://github.com/kenchris/urlpattern-polyfill> |
| 许可     | MIT                                               |
| 体积     | ~16KB (v9.0.0 优化后)                             |
| 依赖     | 零外部依赖                                        |
| 测试     | 通过与浏览器相同的 Web Platform Test 套件         |
| ESM      | ✅                                                |
| CommonJS | ✅                                                |
| Node.js  | v15+                                              |

### 7.3 方案 C: 轻量自实现

对于只需要 `pathname` 匹配的简单场景，可以实现一个微型匹配器：

```typescript
// 仅在需要极简方案时使用
function matchPath(pattern: string, path: string): Record<string, string> | null {
  const regex = new RegExp(
    '^' + pattern.replace(/:(\w+)/g, (_, name) => `(?<${name}>[^/]+)`) + '$',
  );
  const match = path.match(regex);
  return match?.groups ?? null;
}

// 使用
matchPath('/blog/:slug', '/blog/my-post'); // { slug: "my-post" }
matchPath('/blog/:slug', '/blog'); // null
```

### 7.4 SSR Hydration 中的 URLPattern

```typescript
// 服务端: Hono 路由 → 渲染 HTML + 注入路由数据
app.get('/blog/:slug', async (c) => {
  const slug = c.req.param('slug');
  const data = await fetchBlogPost(slug);

  return c.html(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="app" data-route="/blog/${slug}">
          ${renderPage(data)}
        </div>
        <script>
          window.__ROUTE__ = ${
    JSON.stringify({
      pathname: '/blog/${slug}',
      params: { slug: '${slug}' },
    })
  };
        </script>
        <script type="module" src="/client-entry.js"></script>
      </body>
    </html>
  `);
});

// 客户端: Hydration 时使用预注入数据，避免二次匹配
// client-entry.js
const routeData = window.__ROUTE__;
if (routeData) {
  // 直接使用服务器传入的路由数据
  hydrateRoot(document.getElementById('app'), routeData);
} else {
  // 降级: 使用 URLPattern 匹配
  const result = urlPatternRouter.match(window.location.pathname);
  if (result) {
    renderPage(result);
  }
}
```

**核心原则**: SSR hydration 阶段**不应依赖** URLPattern 进行路由匹配，而应使用服务器端注入的路由数据。

---

## 8. 降级策略

### 8.1 降级优先级

```
优先级 1: 原生 URLPattern (Chrome 95+, Edge 95+, Safari 18.2+, Firefox 142+, Deno)
    ↓ 不可用
优先级 2: urlpattern-polyfill (~16KB, 零依赖, 通过 Web Platform Tests)
    ↓ 不想引入 polyfill
优先级 3: path-to-regexp v8 (Hono 已在用, 但语法不同)
    ↓ 不需要完整路由
优先级 4: 简单正则 (仅 pathname 匹配, 体积最小)
```

### 8.2 推荐降级实现

```typescript
interface Router {
  match(path: string): { params: Record<string, string> } | null;
}

async function createRouter(routes: string[]): Promise<Router> {
  // 1. 尝试原生 URLPattern
  if (globalThis.URLPattern) {
    return new URLPatternRouter(routes);
  }

  // 2. 尝试加载 polyfill
  try {
    await import('urlpattern-polyfill');
    if (globalThis.URLPattern) {
      return new URLPatternRouter(routes);
    }
  } catch {
    // polyfill 加载失败，继续降级
  }

  // 3. 降级到简单正则匹配
  return new SimpleRegexRouter(routes);
}

class URLPatternRouter implements Router {
  #patterns: Map<string, URLPattern>;

  constructor(routes: string[]) {
    this.#patterns = new Map();
    for (const route of routes) {
      this.#patterns.set(route, new URLPattern({ pathname: route }));
    }
  }

  match(path: string) {
    for (const [route, pattern] of this.#patterns) {
      const result = pattern.exec({ pathname: path });
      if (result) {
        return { params: result.pathname.groups as Record<string, string> };
      }
    }
    return null;
  }
}

class SimpleRegexRouter implements Router {
  #routes: Array<{ regex: RegExp; params: string[] }>;

  constructor(routes: string[]) {
    this.#routes = routes.map((route) => {
      const paramNames: string[] = [];
      const regexStr = route.replace(/:(\w+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      });
      return {
        regex: new RegExp(`^${regexStr}$`),
        params: paramNames,
      };
    });
  }

  match(path: string) {
    for (const { regex, params } of this.#routes) {
      const m = path.match(regex);
      if (m) {
        const result: Record<string, string> = {};
        params.forEach((name, i) => {
          result[name] = m[i + 1];
        });
        return { params: result };
      }
    }
    return null;
  }
}
```

### 8.3 Polyfill 体积评估

| 方案                  | 体积  | 收益                               |
| --------------------- | ----- | ---------------------------------- |
| `urlpattern-polyfill` | ~16KB | 完整 URLPattern API，通过 WPT 测试 |
| `path-to-regexp` v8   | ~5KB  | Hono 已在用，语法需适配            |
| 简单正则              | ~1KB  | 仅支持命名参数和静态路径           |
| 原生 URLPattern       | 0KB   | 无需额外代码                       |

### 8.4 推荐策略

**对于 LessJS (目标现代浏览器 + Deno SSR)**:

1. **SSR 端 (Deno)**: 直接使用原生 URLPattern（零成本）
2. **客户端**: 条件加载 polyfill
   - 构建时检测目标浏览器支持情况
   - 支持时使用原生 API
   - 不支持时按需加载 `urlpattern-polyfill`
3. **共享路由定义**: 使用统一的路由描述格式，同时生成 Hono 路由和 URLPattern 实例

---

## 9. 与邻接技术的对比

### 9.1 URLPattern vs path-to-regexp

| 维度          | URLPattern                          | path-to-regexp v8     |
| ------------- | ----------------------------------- | --------------------- |
| 标准化        | WHATWG 标准                         | 社区库                |
| 全 URL 匹配   | ✅ (protocol/host/path/search/hash) | ❌ 仅 pathname        |
| 正则能力      | ✅ 内联正则                         | ❌ 通过选项控制       |
| 可选参数      | `:name?`                            | `{/:name}`            |
| 体积 (运行时) | 0KB (原生)                          | ~5KB                  |
| 浏览器支持    | 89%+ (见矩阵)                       | 100%                  |
| test() 方法   | ✅                                  | ❌                    |
| compile()     | ❌                                  | ✅                    |
| Hono 集成     | 无直接支持                          | RegExpRouter 内部类似 |

### 9.2 URLPattern vs Hono RegExpRouter

| 维度       | URLPattern       | RegExpRouter                 |
| ---------- | ---------------- | ---------------------------- |
| 匹配方式   | 按组件编译正则   | 所有路由编译为单一大正则     |
| 匹配速度   | 单模式快         | 多路由极快（单次匹配）       |
| 歧义路由   | 不存在（单模式） | ❌ 不支持                    |
| 嵌套捕获组 | 部分支持         | ❌ 不支持                    |
| 路由优先级 | 由调用方控制     | 注册顺序 + 长度              |
| API 复杂度 | 简单（2个方法）  | 复杂（路由注册/分层/中间件） |

---

## 10. 结论与建议

### 10.1 核心发现

1. **URLPattern 是成熟的 Web 标准**，Deno 原生支持，浏览器覆盖率 ~89%
2. **Firefox 142+ 支持是关键节点**（2026年2月），覆盖大部分现代用户
3. **Hono 不使用 URLPattern**，两者模式语法**80% 兼容但关键部分不同**（正则定界符）
4. **共享同一模式字符串不可行**，需要适配层或统一路由描述格式
5. **Polyfill 方案成熟**，`urlpattern-polyfill` 通过 Web Platform Tests，体积可控

### 10.2 对 LessJS 的建议

**推荐方案: 分层路由架构**

```
┌─────────────────────────────────────────────┐
│          Route Definition (统一格式)           │
│  { path: "/blog/:slug", params: ["slug"] }   │
└──────────────┬──────────────────────────────┘
               │
     ┌─────────┴─────────┐
     │                   │
     ▼                   ▼
┌─────────┐      ┌──────────────┐
│  SSR 端  │      │  客户端 (CSR)  │
│ (Deno)  │      │  (Browser)   │
├─────────┤      ├──────────────┤
│ · Hono  │      │ · URLPattern │
│   路由   │      │   (原生优先)  │
│ · 渲染   │      │ · polyfill   │
│ · 注水   │      │   降级        │
└─────────┘      └──────────────┘
```

**关键决策**:

- SSR 使用 Hono（已有集成，性能最优）
- 客户端使用 URLPattern（标准化，原生速度）
- 通过中间层转换路由定义（编译时生成）
- 降级方案: URLPattern → polyfill → 简单正则

### 10.3 实施路径

1. **阶段 1**: 定义统一路由描述格式（JSON Schema）
2. **阶段 2**: 实现路由定义 → Hono 路由注册的编译器
3. **阶段 3**: 实现路由定义 → URLPattern 实例的编译器
4. **阶段 4**: 实现客户端条件加载（原生 + polyfill fallback）
5. **阶段 5**: SSR hydration 路由数据注入（避免客户端重复匹配）

---

## 附录 A: 快速参考卡

### URLPattern 构造形式

```js
// 完整 URL
new URLPattern('https://example.com/blog/:slug');

// 相对路径 + baseURL
new URLPattern('/blog/:slug', 'https://example.com');

// 结构化对象
new URLPattern({
  protocol: 'https',
  hostname: 'example.com',
  pathname: '/blog/:slug',
});

// 结构化 + baseURL
new URLPattern({
  pathname: '/blog/:slug',
  baseURL: 'https://example.com',
});
```

### URLPattern 常用模式

| 需求           | 模式                                |
| -------------- | ----------------------------------- |
| 匹配静态路径   | `/about`                            |
| 捕获单个参数   | `/user/:id`                         |
| 可选的参数     | `/file/:name?`                      |
| 通配所有子路径 | `/api/*`                            |
| 正则约束       | `/post/:date(\\d{4}-\\d{2}-\\d{2})` |
| 可选复数       | `/{:prefix.}?example.com`           |
| 末尾斜杠可选   | `/books{/}?`                        |

### Hono 常用模式

| 需求            | 模式                |
| --------------- | ------------------- |
| 命名参数        | `/user/:id`         |
| 可选参数        | `/file/:name?`      |
| 通配符          | `/api/*`            |
| 正则约束        | `:date{[0-9]+}`     |
| 跨段正则        | `:file{[a-z/]+.js}` |
| 全捕获 fallback | `*`                 |
