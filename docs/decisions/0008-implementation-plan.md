# ADR 0008 Implementation Plan: 架构审查与任务分解

> **Author**: architect-gao (Gao) | **Date**: 2026-05-10 | **ADR Status**: PROPOSED → IMPLEMENTATION PLAN

## 1. 可行性评估

### 1.1 总体判断：可行，但有 3 个关键技术风险

ADR 0008 的核心洞察正确：当 `viteBuild(ssr:true, noExternal)` 产出自包含 ESM bundle 后，`createServer()`、globalThis 桥接、文件 IPC 三类耦合确实变得不必要。推荐执行顺序 C → B → A → D 是合理的，但需要微调。

### 1.2 各 Phase 可行性评估

| Phase | 可行性 | 信心度 | 关键风险 |
|-------|--------|--------|----------|
| C: 消除 createServer() | **可行** | 85% | Deno `import()` 路径解析、SSR bundle 入口自举 |
| B: 替换 globalThis 桥接 | **可行** | 95% | 与 C 强耦合，必须先完成 C |
| A: 替换 .less/ 临时文件 | **可行** | 90% | `define` 注入大字符串限制、virtual:less-nav 编译时解析 |
| D: 消除 runtime-shim | **可行** | 98% | 纯清理工作，依赖前三者 |

### 1.3 遗漏风险分析

#### 风险 R1: SSR bundle 入口自举问题（ADR 未充分讨论）

当前 `build-ssg.ts` 的核心逻辑（动态路由展开、i18n locale 展开、blog 数据初始化、sitemap 生成、post-processing）都在 `createServer()` 之后用 `server.ssrLoadModule()` 执行。消除 `createServer()` 后，这些逻辑需要被重新组织。

**两种方案**：

1. **方案 A（推荐）：SSR bundle 导出 Hono app，build-ssg.ts 仍驱动渲染**
   - SSR bundle 入口导出 `app`（Hono 实例）+ 辅助函数
   - `build-ssg.ts` 用 `import()` 加载 bundle，获取 app，然后执行 `toSSG(app, ...)`
   - 动态路由/i18n 展开逻辑仍在 `build-ssg.ts` 中，通过 bundle 导出的 `renderDSD`/`wrapInDocument` 等函数执行
   - **优点**：改动最小，build-ssg.ts 逻辑结构保留
   - **缺点**：build-ssg.ts 仍需知道渲染细节

2. **方案 B：SSR bundle 自包含渲染**
   - SSR bundle 入口不仅导出 app，还包含 `toSSG()` 调用和 post-processing
   - build-ssg.ts 只做 `import() → render()`
   - **优点**：更彻底的解耦
   - **缺点**：重构量巨大，且 post-processing 需要 `node:fs` 访问，不适合放在 bundle 内

**建议采用方案 A**。

#### 风险 R2: `viteBuild(ssr:true)` 是否解析虚拟模块

ADR 假设 `virtual:less-hono-entry` 在 `viteBuild` 编译时被解析。验证：

- `build.ts` L40-43：`viteBuild()` 无参数调用，Vite 会读 `vite.config.ts` → 加载 `less()` 插件 → `virtual:less-hono-entry` 的 `resolveId` + `load` 钩子生效 → SSR build 入口使用虚拟模块 → **确认可行**。

- 但 `build-ssg.ts` L228-278 当前的 `createServer()` 使用 `configFile: false`，手动重建配置。新方案需要确保 `viteBuild(ssr:true)` 也能正确加载用户 `vite.config.ts` 中的所有插件。

#### 风险 R3: `.less/build-metadata.json` 在 Phase A 之后是否仍需保留

当前 `build-client.ts` 从 `.less/build-metadata.json` 读取 island 列表。如果 Phase A 消除所有 `.less/` 文件，`build-client.ts` 也需要改造。

**建议**：Phase A 只消除 SSG 阶段的 `.less/` 文件。`build-metadata.json` 改为内存传递（SSR build 的 `closeBundle` 钩子直接写入 `buildClient()` 可访问的位置，或通过环境变量/临时文件传递 island 列表）。更简单的方案：`build-metadata.json` 保留但移到 `dist/server/` 下，作为构建产物而非 IPC 管道。

### 1.4 执行顺序微调

ADR 推荐的 C → B → A → D 基本正确，但建议 **Phase C 和 Phase B 合并执行**：

- Phase B（替换 globalThis）在 `createServer()` 路径下无法安全执行，因为 `ssrLoadModule()` 仍可能产生多实例
- 一旦 `createServer()` 被消除（Phase C），globalThis 桥接立即变得不必要
- 合并执行避免"中间态"：不出现 globalThis 桥接已删除但 `createServer()` 仍存在的状态

**最终建议执行顺序：C+B（合并） → A → D**

## 2. 详细文件变更清单

### Phase C+B: 消除 createServer() + 替换 globalThis 桥接

#### 2.1 `packages/core/src/cli/build-ssg.ts`（905 行 → 约 500 行）

这是改动最大的文件。核心变化：移除 `createServer()` + `server.ssrLoadModule()`，改为 `viteBuild(ssr:true)` + `import()`。

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L91 | `async function buildSSG(options)` | 保留 | 函数签名不变 |
| L98-143 | `readFileSync('.less/build-metadata.json')` | **移除** | Phase A 后数据内联；当前阶段先改为从 bundle 导出读取 |
| L145-183 | `generateHonoEntryCode()` + 写入 `.less-ssg-entry.ts` | **重写** | 改为 SSR build 的入口由 Vite 虚拟模块提供 |
| L185-278 | `createServer()` + 全套配置 | **移除** | 这是 Phase C 的核心 |
| L188-204 | `noExternal` 列表 | **移至 viteBuild 配置** | 在 SSR build 配置中设置 |
| L221-224 | CJS polyfill (`globalThis.module`) | **移除** | createServer 消除后不再需要 |
| L228-278 | `createServer({...})` + `less:ssg-virtual-nav` 插件 | **移除** | 虚拟模块编译时解析 |
| L284-293 | `server.ssrLoadModule('@lessjs/adapter-lit')` | **移除** | bundle 入口自动执行 installLitAdapter() |
| L295-316 | `customElements.define` 幂等补丁 | **移至 bundle 入口** | 在生成的 entry 代码中执行 |
| L318-464 | `server.ssrLoadModule(tmpEntryPath)` + 动态路由展开 | **重写** | 改为 `import('./dist/server/entry.js')` |
| L345-350 | `server.ssrLoadModule('@lessjs/core/render-dsd')` | **改为 bundle 导入** | `const { renderDSD } = await import(...)` |
| L359-383 | blog 数据初始化 + `server.ssrLoadModule('@lessjs/content')` | **重写** | bundle 入口自动初始化 blog 数据 |
| L466-495 | `toSSG(app, fsModule, ...)` | **保留** | 改为使用 bundle 导出的 app |
| L528-664 | i18n locale 展开 + `server.ssrLoadModule(...)` | **重写** | 改为 bundle 导入 |
| L856-886 | `finally { server.close() }` + sitemap 生成 | **简化** | 移除 server.close()，sitemap 从 bundle 导入 |
| L890-903 | CJS polyfill 清理 | **移除** | |

**新 build-ssg.ts 伪代码**：

```typescript
async function buildSSG(options): Promise<void> {
  const root = options.root || process.cwd();
  const outDir = options.outDir || 'dist';

  // Phase 1: 读取构建元数据（临时保留，Phase A 再消除）
  const metadata = readBuildMetadata(root);

  // Phase 2: 导入 SSR bundle
  const ssrEntryPath = resolve(root, outDir, 'server', 'entry.js');
  const ssrBundle = await import(ssrEntryPath);
  const app = ssrBundle.default;  // Hono app

  // Phase 3: 动态路由展开（使用 bundle 导出的 renderDSD）
  const { renderDSD, wrapInDocument } = ssrBundle;
  // ... 动态路由展开逻辑（使用 bundle 内的 renderDSD）...

  // Phase 4: toSSG
  const result = await toSSG(app, fsModule, { dir: outputDir });

  // Phase 5: Post-processing（与当前相同）
  // ... i18n 展开、clean URL、client script 注入等 ...

  // Phase 6: Sitemap（使用 bundle 导出）
  if (ssrBundle.generateSitemap) {
    ssrBundle.generateSitemap(join(root, outDir), sitemapOpts);
  }
}
```

#### 2.2 `packages/core/src/cli/build.ts`（61 行 → 约 70 行）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L39-53 | 三阶段：viteBuild → buildClient → buildSSG | **调整顺序** | 改为：viteBuild(SSR) → buildSSG → buildClient |

新顺序：
```typescript
export async function build(): Promise<void> {
  await runPhase({ name: 'Phase 1/3 - Vite SSR build', run: () => viteBuild() });
  await runPhase({ name: 'Phase 2/3 - SSG rendering', run: () => buildSSG() });
  await runPhase({ name: 'Phase 3/3 - Client island build', run: () => buildClient() });
}
```

注意：SSR build 在 `viteBuild()` 中触发（读取 `vite.config.ts`，`build.ssr: true` 由 Vite 配置决定）。当前 `viteBuild()` 不带参数，依赖 `vite.config.ts` 的 `build.rollupOptions` 配置。

#### 2.3 `packages/core/src/types.ts`（377 行 → 约 370 行）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L306 | `const ADAPTER_KEY = Symbol.for('lessjs:adapter')` | **替换为模块变量** | `let _adapter: RenderAdapter \| undefined` |
| L309-311 | `registerAdapter()` 使用 `globalThis[ADAPTER_KEY]` | **改为** `_adapter = adapter` | |
| L314-316 | `getAdapter()` 使用 `globalThis[ADAPTER_KEY]` | **改为** `return _adapter` | |
| L306 | `Symbol.for('lessjs:adapter')` 声明 | **移除** | 不再需要 |

```typescript
// 替换后
let _adapter: RenderAdapter | undefined;

export function registerAdapter(adapter: RenderAdapter | undefined): void {
  _adapter = adapter;
}

export function getAdapter(): RenderAdapter | undefined {
  return _adapter;
}
```

#### 2.4 `packages/content/src/blog/blog-data.ts`（78 行 → 约 50 行）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L22 | `const BLOG_POSTS_KEY = Symbol.for('lessjs:content:posts')` | **移除** | |
| L23 | `const BLOG_OPTIONS_KEY = Symbol.for('lessjs:content:options')` | **移除** | |
| L26 | `const _g = globalThis as Record<symbol, unknown>` | **移除** | |
| L28-31 | `getPostsStore()` 用 globalThis 桥 | **改为** `let _posts: BlogPost[] = []` | |
| L33-35 | `setPostsStore()` | **移除** | 直接赋值 `_posts` |
| L37-40 | `getOptionsStore()` | **改为** `let _options: LessBlogOptions = {}` | |
| L42-44 | `setOptionsStore()` | **移除** | 直接赋值 `_options` |
| L47-49 | `getPosts()` | **简化** | `return _posts` |
| L52-54 | `getPostBySlug()` | **简化** | `return _posts.find(...)` |
| L57-59 | `getBlogOptions()` | **简化** | `return _options` |
| L66-77 | `initBlogData()` | **简化** | `_options = options ?? {}; _posts = routes.posts;` |

替换后与 `i18n-data.ts` 模式完全对齐。

#### 2.5 `packages/adapter-lit/src/ssr.ts`（500 行 → 约 490 行）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L47 | `const NOTHING_SYMBOL = Symbol.for('lit-nothing')` | **改为** `import { nothing as LIT_NOTHING } from 'lit'` 或保留但改为模块变量 | bundle 单实例后 Symbol.for 仍可工作，但改为直接 import 更干净 |
| L465 | `const INSTALLED_KEY = Symbol.for('lessjs:lit-adapter-installed')` | **替换** | `let _installed = false` |
| L468 | `if (globalThis[INSTALLED_KEY])` | **改为** `if (_installed)` | |
| L486 | `(globalThis as ...)[INSTALLED_KEY] = true` | **改为** `_installed = true` | |
| L498 | `(globalThis as ...)[INSTALLED_KEY] = false` | **改为** `_installed = false` | |

#### 2.6 `packages/core/src/entry-renderer.ts`（427 行 → 约 400 行）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L207-209 | SSG headExtras 文件读取 vs JSON.stringify 切换 | **简化** | bundle 化后不再需要 AsyncFunction 限制，headExtras 可直接 JSON.stringify 内联 |
| L348-363 | SSG headExtras 从文件读取的代码生成 | **移除** | 改为构建时常量注入 |

#### 2.7 `packages/core/src/index.ts`（305 行 → 约 295 行）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L199-208 | `config()` 中写入 `.less/.less-runtime.ts` + alias | **移至 Phase D** | Phase C+B 中先保留，Phase D 再清理 |

#### 2.8 `packages/core/src/render-dsd.ts`（303 行 → 约 295 行）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L49 | `import { getAdapter } from './types.js'` | **无变化** | getAdapter 改为模块变量后，import 仍然有效 |

### Phase A: 替换 .less/ 临时文件 IPC 为编译时内联

#### 2.9 `packages/content/src/index.ts`（187 行 → 约 140 行）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L93-106 | `buildStart()` 中写 `.less/blog-options.json` | **移除** | 改为 `config()` 中 `define` 注入 |
| L109-133 | `buildStart()` 中写 `.less/nav-data.json` + `.less/header-nav.json` | **移除** | 改为 `config()` 中 `define` 注入 |
| L137-151 | `buildStart()` 中写 `.less/sitemap-options.json` | **移除** | 改为 `config()` 中 `define` 注入 |
| L154-163 | `config()` 中 `define: { __LESS_BLOG_BASE_PATH__ }` | **扩展** | 增加更多 define 常量 |
| L166-181 | `virtualNavPlugin` (`less:virtual-nav`) | **重写** | 从 `define` 常量导出，而非运行时读取 |

新 `config()` hook：
```typescript
config() {
  const defines: Record<string, string> = {};
  if (blogOpts) {
    defines['__LESS_BLOG_BASE_PATH__'] = JSON.stringify(blogOpts.basePath ?? '/blog');
    defines['__LESS_BLOG_OPTIONS__'] = JSON.stringify(blogOpts);
  }
  if (navOpts) {
    const navSections = scanNavData(navOpts);
    const headerNav = navOpts.headerNav || [];
    defines['__LESS_NAV_DATA__'] = JSON.stringify(navSections);
    defines['__LESS_HEADER_NAV__'] = JSON.stringify(headerNav);
  }
  if (sitemapOpts) {
    defines['__LESS_SITEMAP_OPTIONS__'] = JSON.stringify(sitemapOpts);
  }
  return { define: defines };
}
```

新 `virtualNavPlugin`：
```typescript
const virtualNavPlugin: Plugin = {
  name: 'less:virtual-nav',
  resolveId(id) { if (id === VIRTUAL_NAV_ID) return RESOLVED_NAV_ID; },
  load(id) {
    if (id === RESOLVED_NAV_ID) {
      // 使用 Vite define 注入的编译时常量
      return `export const navSections = __LESS_NAV_DATA__;\nexport const headerNav = __LESS_HEADER_NAV__;`;
    }
  },
};
```

#### 2.10 `packages/i18n/src/index.ts`（78 行 → 约 55 行）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L56-73 | `buildStart()` 中写 `.less/i18n-options.json` | **移除** | 改为 `config()` 中 `define` 注入 |

#### 2.11 `packages/core/src/cli/build-ssg.ts`（再次修改）

| 改动 | 说明 |
|------|------|
| 移除所有 `readFileSync('.less/*.json')` | 改为从 SSR bundle 导出或 define 常量获取 |
| 移除 `.less/head-extras.html` 写入 | headExtras 已通过 define 内联到 bundle |

#### 2.12 `packages/core/src/entry-renderer.ts`（再次修改）

| 改动 | 说明 |
|------|------|
| 移除 L348-363 的 SSG headExtras 文件读取代码生成 | 改为 `__LESS_HEAD_EXTRAS__` define 常量 |

#### 2.13 `packages/core/src/build.ts`（再次修改）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L79-117 | `closeBundle()` 写 `.less/build-metadata.json` | **改为写到 dist/server/ 下** | 作为构建产物而非 IPC |

#### 2.14 `packages/core/src/cli/build-client.ts`（198 行 → 约 185 行）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L44-55 | `readFileSync('.less/build-metadata.json')` | **改为 `dist/server/build-metadata.json`** | 元数据位置变更 |

### Phase D: 消除 runtime-shim 机制

#### 2.15 `packages/core/src/runtime-shim.ts` → **删除**

`createRuntimeShimCode()` 巨型字符串不再需要。

#### 2.16 `packages/core/scripts/generate-runtime-shim.ts` → **删除**

AST 提取 + 编译 + 字符串化的脚本不再需要。

#### 2.17 `packages/core/src/index.ts`（再次修改）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L32 | `import { createRuntimeShimCode } from './runtime-shim.js'` | **移除** | |
| L199-208 | `config()` 中写 `.less/.less-runtime.ts` + alias | **移除** | bundle 直接 import less-runtime |

#### 2.18 `packages/core/src/less-runtime.ts` → **保留**

轻量 re-export 模块，API 不变。只是不再需要文件系统 alias。

#### 2.19 `docs/vite.config.ts`（183 行 → 约 175 行）

| 行号 | 当前代码 | 改动 | 说明 |
|------|----------|------|------|
| L141 | `{ find: '@lessjs/core/less-runtime', replacement: runtimeShim }` | **移除** | 不再需要 shim alias |
| L15-16 | `const runtimeShim = resolve(...)` | **移除** | |

## 3. 依赖关系图

### 3.1 Phase 依赖

```
Phase C+B ──────────────────→ Phase A ──────────────────→ Phase D
(消除 createServer +          (替换 .less/ 临时文件)       (消除 runtime-shim)
 替换 globalThis)
     │                              │                         │
     │ 必须先完成                    │ 依赖 C+B 完成           │ 纯清理
     │ (bundle 单实例是              │ (define 注入需要         │
     │  后续变更的前提)              │  SSR build 路径)        │
     ▼                              ▼                         ▼
  GitHub Issues #2,#3,#4       build-client.ts          runtime-shim.ts
  被修复                        改用 dist/server/         generate-runtime-shim.ts
                               build-metadata.json       删除
```

### 3.2 文件修改依赖（Phase C+B 内部）

```
build-ssg.ts (重写核心)
    ↑ 依赖
    ├── types.ts (registerAdapter/getAdapter 改为模块变量)
    ├── blog-data.ts (globalThis → 模块变量)
    ├── adapter-lit/ssr.ts (INSTALLED_KEY → 模块变量)
    ├── entry-renderer.ts (headExtras 内联方式简化)
    └── build.ts (调整阶段顺序)

entry-renderer.ts
    ↑ 被依赖
    └── 生成的 entry 代码必须包含 installLitAdapter() 自执行
```

### 3.3 关键路径

```
types.ts 改模块变量 → adapter-lit/ssr.ts 适配 → build-ssg.ts 重写 → 集成测试
```

## 4. 技术风险与缓解策略

### 4.1 R1: Deno 中 `import()` 路径解析（高风险）

**问题**：Deno 的动态 `import()` 对文件路径的要求比 Node.js 更严格。

**缓解**：
```typescript
// 使用 file:// URL + 绝对路径
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ssrEntryPath = resolve(root, outDir, 'server', 'entry.js');
const ssrBundle = await import(pathToFileURL(ssrEntryPath).href);
```

**验证步骤**：
1. 在 Deno 中手动 `import()` 一个 Vite SSR 产出文件
2. 确认 Deno 能解析 bundle 内的相对 import
3. 确认 `import.meta.url` 在 bundle 内正确

### 4.2 R2: SSR bundle 入口需要自执行 installLitAdapter()（中风险）

**问题**：当前 `build-ssg.ts` 通过 `server.ssrLoadModule('@lessjs/adapter-lit')` 安装 adapter。消除后，adapter 需要在 bundle 内自动安装。

**缓解**：在 `entry-renderer.ts` 的 `renderEntry()` 中，SSG 模式下自动添加：
```typescript
// 在生成的 entry 代码中
import { installLitAdapter } from '@lessjs/adapter-lit';
installLitAdapter();
```

### 4.3 R3: `viteBuild(ssr:true)` 的虚拟模块解析（中风险）

**问题**：SSR build 必须正确解析 `virtual:less-hono-entry` 等虚拟模块。

**缓解**：
- 确保 `viteBuild()` 加载用户 `vite.config.ts`（而非 `configFile: false`）
- 验证 SSR build 配置中 `build.ssr: true` 正确设置
- 验证所有 Vite 插件（`less:core`, `less:virtual-entry`, `less:content`, `less:i18n`）在 SSR build 中正常工作

### 4.4 R4: SSR bundle 体积（低风险）

**问题**：`noExternal` 将 lit/parse5/entities 全部打包。

**缓解**：当前 `createServer()` 也是全量加载，体积不减。Vite 的 tree-shaking 可能反而减小体积。

### 4.5 R5: headExtras 大字符串通过 define 注入（低风险）

**问题**：`define` 注入大字符串可能影响构建性能。

**缓解**：
- docs 站点的 headExtras 约 5KB，在可接受范围内
- 如果未来超限，可改为 `virtual:less-head-extras` 模块

### 4.6 R6: blog 数据在 bundle 内初始化的时序（中风险）

**问题**：当前 `build-ssg.ts` 先 `ssrLoadModule('@lessjs/content')` 初始化 blog 数据，再 `ssrLoadModule(routeModule)` 渲染路由。bundle 化后，所有模块在 `import()` 时同时加载，时序需要保证。

**缓解**：
- 在 SSR bundle 入口中，`initBlogData()` 应在路由注册之前执行
- `initBlogData()` 是幂等的，重复调用不会出问题
- 可在 `entry-renderer.ts` 的 SSG 模式代码中添加初始化调用

## 5. GitHub Issues 关联映射

| Issue | 描述 | 根因 | 修复 Phase | 修复方式 |
|-------|------|------|-----------|---------|
| #1 | `serializeAttributes()` 缺少 camelToKebab | render-dsd.ts 未转换属性名 | **已修复** | `render-dsd.ts` L66-68 已有 `camelToKebab`，L78 使用 |
| #2 | build-ssg CLI 崩溃 | `.less-ssg-entry.ts` 内联大字符串破坏 Vite SSR AsyncFunction | **Phase C** | 消除 `createServer()` + `ssrLoadModule()`，不再通过 AsyncFunction 评估代码 |
| #3 | Lit SSR adapter 注册失败 | Vite 模块多实例导致 globalThis 桥接不可靠 | **Phase C+B** | bundle 单实例 + 模块变量，消除跨实例问题 |
| #4 | Blog 数据 SSG 渲染为空 | 同 Issue #3 根因（blog-data 的 globalThis 桥接跨实例失效） | **Phase C+B** | bundle 单实例 + 模块变量，blog 数据在 bundle 内共享 |

**Issue #1**：已验证 `render-dsd.ts` L71-91 的 `serializeAttributes()` 在 L78 使用 `camelToKebab(key)` 转换，Issue #1 在当前代码已修复。

**Issue #2**：根因是 `entry-renderer.ts` 生成的代码包含内联大字符串（headExtras），Vite SSR 通过 `new AsyncFunction()` 评估时，字符串中的反引号/`${}` 破坏语法。Phase C 消除 `createServer()` 后，代码由 `viteBuild()` 编译，不再通过 AsyncFunction 评估，从根本上解决问题。

**Issue #3 和 #4**：根因相同——Vite SSR 的 `ssrLoadModule()` 在某些配置下产生模块多实例，导致 `registerAdapter()` 和 `initBlogData()` 的作用域与 `renderDSD()`/`getPosts()` 不同。Phase C 消除 `createServer()`，Phase B 将 globalThis 桥接改为模块变量，两个 Issue 同时修复。

## 6. 测试策略

### 6.1 Phase C+B 完成后的验证

| 验证项 | 方法 | 通过标准 |
|--------|------|---------|
| SSR build 产出自包含 bundle | `vite build` → 检查 `dist/server/entry.js` | 文件存在，包含 lit/parse5 代码 |
| `import()` 在 Deno 中可用 | 手动 `deno eval 'await import("./dist/server/entry.js")'` | 无模块解析错误 |
| adapter 注册可见 | bundle 导出的 app 能渲染 Lit 组件 | `<less-button>` 产出正确 DSD HTML |
| blog 数据非空 | `getPosts()` 在 bundle 内返回数据 | 动态路由 `/blog/:slug` 正常渲染 |
| 全量单元测试 | `deno task test` | 41 个测试文件全部通过 |
| docs 站点构建 | `deno task build` | 完整构建无错误，产出 HTML 正确 |
| Issue #2 验证 | `deno task build:ssg` 不再崩溃 | 无 AsyncFunction 语法错误 |
| Issue #3 验证 | Lit 组件 SSG 渲染非空 | `<less-button>` 等组件产出完整 HTML |
| Issue #4 验证 | blog 动态路由渲染 | `/blog/v0-8-0` 产出有内容的 HTML |
| globalThis 无污染 | `Object.getOwnPropertySymbols(globalThis)` | 无 `lessjs:*` 相关 Symbol |

### 6.2 Phase A 完成后的验证

| 验证项 | 方法 | 通过标准 |
|--------|------|---------|
| `.less/` 目录为空 | 构建后检查 `.less/` | 无 `.json`/`.html` 文件（仅 `.ts` 在 Phase D 前可能残留） |
| `define` 常量正确注入 | 检查 `dist/server/entry.js` 中 `__LESS_NAV_DATA__` 等 | 常量值正确内联 |
| `virtual:less-nav` 编译时解析 | SSR build 不报虚拟模块错误 | navSections/headerNav 正确导出 |
| headExtras 正确内联 | 检查产出 HTML 的 `<head>` | CDN links、analytics 等正确注入 |
| build-client 仍正常 | `deno task build` 全流程 | client islands 正常产出 |

### 6.3 Phase D 完成后的验证

| 验证项 | 方法 | 通过标准 |
|--------|------|---------|
| `runtime-shim.ts` 已删除 | 文件不存在 | 确认删除 |
| `generate-runtime-shim.ts` 已删除 | 文件不存在 | 确认删除 |
| `less-runtime.ts` 正常工作 | `import { renderDSD } from '@lessjs/core/less-runtime'` | API 不变 |
| docs 站点无 shim alias | `docs/vite.config.ts` 无 `@lessjs/core/less-runtime` alias | 构建正常 |
| 全量测试 | `deno task test` + `deno task build` | 41 测试 + docs 全流程通过 |
| `.less/` 目录完全不存在 | 构建后检查 | 无 `.less/` 目录 |

### 6.4 回归测试矩阵

每个 Phase 完成后，必须通过以下回归测试：

```
✓ deno task test          (41 个测试文件)
✓ deno task build         (docs 站点完整构建)
✓ deno task dev           (开发服务器正常启动)
✓ 手动验证页面渲染         (首页、guide、blog 动态路由)
✓ 检查产出 HTML 结构       (DSD 正确、headExtras 完整)
```

## 7. 工作量估算

| Phase | 涉及文件数 | 预估改动行数 | 复杂度 |
|-------|-----------|-------------|--------|
| C+B | 7 | ~500 行（build-ssg.ts 减 400，其他增减约 100） | 高 |
| A | 5 | ~200 行 | 中 |
| D | 4 | ~50 行（主要是删除） | 低 |
| **合计** | **12+** | **~750 行** | |

## 8. 实施建议

1. **Phase C+B 分 3 步提交**：
   - Step 1: types.ts + blog-data.ts + adapter-lit/ssr.ts 的 globalThis → 模块变量（纯重构，行为不变）
   - Step 2: build-ssg.ts 核心重写（createServer → viteBuild + import）
   - Step 3: entry-renderer.ts + build.ts 调整

2. **每个 Step 后运行完整测试**，确保中间态也可工作

3. **Phase A 的 `define` 注入可逐步替换**，每个 `.less/*.json` 单独替换，降低风险

4. **保留回滚能力**：每个 Phase 的 git commit 应该是可独立回滚的

---

_审查完成日期: 2026-05-10 | 审查人: architect-gao_
