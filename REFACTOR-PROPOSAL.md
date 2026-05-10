# LessJS 深度重构方案

> **日期**: 2026-05-10 | **作者**: Qi · 交付总监

---

## 一、D1-D5 设计问题解决方案

### D1: `runtime-shim.ts` 导出 Hono 但 `less-runtime.ts` 注释说"不导出"

**现状矛盾**：
- `less-runtime.ts:8` 写着 "Hono is NOT re-exported here"
- `runtime-shim.ts`（自动生成）第一行就是 `export { Hono } from 'hono'`
- 但两者角色不同：`less-runtime.ts` 是 SSR 虚拟模块，`runtime-shim.ts` 是客户端内联 shim

**根因**：注释描述的是 SSR 路径（`less-runtime.ts`），但 runtime-shim 的客户端路径需要 Hono 因为 SSG 入口代码在客户端构建中仍需要 Hono 来处理 API 路由。

**方案**：更新 `less-runtime.ts` 注释，精确描述两条路径的区别。

```diff
- * Note: Hono is NOT re-exported here. Generated entry code imports Hono
- * directly from 'hono' (via buildEntryDescriptor), so this indirection
- * is unnecessary. Keeping less-runtime focused on LessJS-only APIs.
+ * This is the SSR virtual module — Vite resolves `@lessjs/core/less-runtime`
+ * to this file in SSR builds. Client builds use createRuntimeShimCode()
+ * instead (see runtime-shim.ts), which inlines lightweight implementations
+ * and also re-exports Hono for client-side API route handling.
+ *
+ * Hono is NOT re-exported from THIS file because generated SSR entry code
+ * imports Hono directly from 'hono' — no indirection needed on the server side.
```

### D2: `types.ts` 混入值导出 `registerAdapter` / `getAdapter`

**现状**：`types.ts:302` 有 `export { getAdapter, registerAdapter } from './adapter-registry.js'`

**根因**：历史遗留。`adapter-registry.ts` 原本是 `types.ts` 的一部分，后来拆出但忘记删除 re-export。

**影响分析**：
- 无外部消费者通过 `@lessjs/core/types` 导入这两个函数
- `index.ts:82-88` 已经从 `./types.js` re-export `ComponentLayer, DsdOptions, HydrateEventDescriptor, RenderAdapter, registerAdapter` — 这意味着 `index.ts` 的 registerAdapter 有**两条导出路径**：`adapter-registry.ts → types.ts → index.ts` 和 `adapter-registry.ts → less-runtime.ts`

**方案**：删除 `types.ts:296-302` 的值导出，修改 `index.ts` 改为从 `adapter-registry.js` 直接导入。

```diff
# types.ts: 删除值导出
- /**
-  * Module-level adapter storage.
-  *
-  * Moved to adapter-registry.ts — types.ts should only contain type definitions.
-  * Re-exported here for backward compatibility.
-  */
- export { getAdapter, registerAdapter } from './adapter-registry.js';

# index.ts: 改为直接从 adapter-registry 导入
- export {
-   type ComponentLayer,
-   type DsdOptions,
-   type HydrateEventDescriptor,
-   registerAdapter,
-   type RenderAdapter,
- } from './types.js';
+ export { registerAdapter, getAdapter } from './adapter-registry.js';
+ export type {
+   type ComponentLayer,
+   type DsdOptions,
+   type HydrateEventDescriptor,
+   type RenderAdapter,
+ } from './types.js';
```

### D3: `ssg-postprocess.ts` 直接使用 `console.log/warn/error`

**现状**：`build-manifest.ts` 中有大量 `console.log()` 调用用于输出格式化表格。

**分析**：
- `build-manifest.ts` 是 CLI 工具代码（`deno task build` 后的输出），不是框架运行时
- `console.log` 在 CLI 场景是标准做法，不需要走 `createLogger`
- `ssg-postprocess.ts` 使用了 `createLogger`，已经规范化

**方案**：**不修改**。CLI 输出表格用 `console.log` 是合理的，`createLogger` 是给框架插件用的。

### D4: `create/cli.ts` 中 `.less/` 出现在 `.gitignore` 模板

**现状**：脚手架模板 `.gitignore` 包含 `.less/`。

**分析**：新创建的项目在 `deno task dev` 时仍可能生成 `.less/` 目录（虽然 ADR 0010 消除了大部分写入，但一些 Vite 插件残留行为可能仍在写入），所以模板保留是安全的。

**方案**：**保留**，但添加注释说明。

```diff
  # Framework internals
- .less/
+ .less/   # ADR 0010: should not be needed, kept as safety net
```

### D5: `build-ssg.ts` 886 行过大

**现状**：单文件包含 SSG 构建、HTML 渲染、岛屿注册、manifest 生成等所有逻辑。

**拆分方案**：

```
build-ssg.ts (886行)  →  拆分为:
├── build-ssg.ts        (~150行) 入口 + Vite 插件编排
├── ssg-render.ts        (~350行) HTML 渲染 + 嵌套 DSD
├── ssg-islands.ts       (~200行) 岛屿注册 + CE define 拦截
└── ssg-client-entry.ts  (~180行) 客户端入口生成
```

**优先级**：低。功能正确，只是可维护性问题。建议在 v0.10.x 周期处理。

---

## 二、docs → www 重命名执行方案

### 2.1 变更清单

#### A. 目录重命名（1 个 git mv）

```bash
git mv docs www
```

#### B. `deno.json` — 6 处修改

```diff
- "dev": "deno run -A npm:vite docs --config docs/vite.config.ts",
+ "dev": "deno run -A npm:vite www --config www/vite.config.ts",

- "build": "cd docs && deno run --config ../deno.json -A ../packages/core/src/cli/build.ts",
+ "build": "cd www && deno run --config ../deno.json -A ../packages/core/src/cli/build.ts",

- "preview": "deno run -A npm:vite preview docs --config docs/vite.config.ts",
+ "preview": "deno run -A npm:vite preview www --config www/vite.config.ts",

- "test:e2e": "npx -y @playwright/test test --config docs/e2e/playwright.config.ts",
+ "test:e2e": "npx -y @playwright/test test --config www/e2e/playwright.config.ts",

- "clean": "rm -rf packages/*/dist docs/dist docs/.less",
+ "clean": "rm -rf packages/*/dist www/dist www/.less",

- "build:docs": "deno task build",
+ "build:www": "deno task build",
```

注意：`build:docs` → `build:www` 是命名变更，更语义化。

#### C. `.gitignore` — 1 处修改

```diff
- docs/vite-build-*.txt
+ www/vite-build-*.txt
```

#### D. `.github/workflows/lint.yml` — 4 处注释修改

```diff
- # TODO: Include docs/ once upstream Deno fmt bug is fixed.
+ # TODO: Include www/ once upstream Deno fmt bug is fixed.

- - name: Check formatting (packages only, skip docs/ due to Deno fmt panic on tagged templates with HTML entities)
+ - name: Check formatting (packages only, skip www/ due to Deno fmt panic on tagged templates with HTML entities)

- # TODO: Include docs/ once Deno lint handles the same patterns.
+ # TODO: Include www/ once Deno lint handles the same patterns.

- - name: Run linter (packages only, skip docs/ entirely)
+ - name: Run linter (packages only, skip www/ entirely)
```

#### E. `.github/workflows/test.yml` — 2 处修改

```diff
- build-docs:
+ build-www:

- - name: Build docs site
+ - name: Build www site

  run: deno task build:docs    # 通过 deno.json 间接引用，已改名为 build:www
```

#### F. `www/app/routes/guide/_renderer.ts` — 1 处修改

```diff
- const GITHUB_EDIT_BASE = 'https://github.com/lessjs-run/lessjs/edit/main/docs/app/routes';
+ const GITHUB_EDIT_BASE = 'https://github.com/lessjs-run/lessjs/edit/main/www/app/routes';
```

#### G. `www/app/components/decision-document-page.ts` — 1 处修改

```diff
- <span>Source: docs/decisions/${decision.id}</span>
+ <span>Source: decisions/${decision.id}</span>
```

注意：这里 `docs/decisions` 变成 `decisions/` 更好，因为目录已经叫 `www/` 了，不需要再写前缀。

#### H. `www/app/routes/decisions/index.ts` — 1 处修改

```diff
- Source-controlled ADRs from <span class="inline-code">docs/decisions</span>, rendered directly
+ Source-controlled ADRs from <span class="inline-code">decisions/</span>, rendered directly
```

#### I. `packages/content/sitemap/generator.ts:95` — 1 处注释

```diff
- * @param distDir - Path to the SSG output directory (e.g., 'docs/dist')
+ * @param distDir - Path to the SSG output directory (e.g., 'www/dist')
```

#### J. `docs/app/routes/changelog.ts` — 多处 `docs/` 引用

changelog 中的 `docs/` 引用是**历史记录**，不应修改。但以下非历史引用需要更新：
- `docs/e2e/` → `www/e2e/`（如果出现在描述当前项目结构的段落中）

### 2.2 执行步骤

1. `git mv docs www`
2. 逐文件修改上述 B-I 清单
3. `deno check` 验证
4. `deno task dev` 启动验证
5. `deno task build` 构建验证
6. Git commit

### 2.3 回滚方案

```bash
git revert HEAD   # 一步回滚
```

---

## 三、runtime-shim.ts / less-runtime.ts 消除重构方案

### 3.1 当前架构

```
                        ┌─────────────────────────────────────────┐
                        │           @lessjs/core/index.ts         │
                        │  less() Vite Plugin                     │
                        │                                         │
                        │  virtual:less-runtime                   │
                        │  ├── SSR build: import from @lessjs/core│
                        │  └── Client build: createRuntimeShimCode()│
                        └──────────┬──────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
           less-runtime.ts   runtime-shim.ts   build-ssg.ts
           (19行 barrel)    (3行 wrapper)     (886行 CLI)
                    │              │
                    │    generate-runtime-shim.ts
                    │    (229行 生成器脚本)
                    │              │
                    ▼              ▼
              SSR 虚拟模块    客户端内联 JS
              (re-export)    (扁平化 JS 函数体)
```

**三个消费者**：

1. **生成代码** (`entry-descriptor.ts:226`)：`import { renderDSD, renderDSDByName } from '@lessjs/core/less-runtime'`
2. **生成代码** (`entry-renderer.ts:267`)：`import { log, wrapInDocument } from '@lessjs/core/less-runtime'`
3. **adapter-lit** (`ssr.ts:118`)：`import { registerAdapter } from '@lessjs/core/less-runtime'`

### 3.2 为什么不能简单删除

核心约束：**adapter-lit 的 `registerAdapter()` 必须和 `renderDSD()` 在同一个模块作用域**。

当 `installLitAdapter()` 调用 `registerAdapter(litAdapter)` 时，它设置的是模块级变量 `_adapter`。`renderDSD()` 内部调用 `getAdapter()` 读同一个变量。如果 `registerAdapter` 和 `renderDSD` 不在同一个模块实例中，adapter 就丢了。

`virtual:less-runtime` 保证了：
- **SSR 构建**：所有代码打包进同一个 bundle，模块共享
- **客户端构建**：shim 把所有函数内联到一个文件，天然共享

### 3.3 方案 A：消除 `less-runtime.ts` barrel，统一用 `virtual:less-runtime`

**思路**：删掉 `less-runtime.ts` 这个 19 行的 barrel 文件，让 `virtual:less-runtime` 直接从源文件组装。

**改动**：

```diff
# 删除文件
- packages/core/src/less-runtime.ts

# index.ts: load() 中 SSR 分支改为直接从源文件导入
  if (resolvedConfig?.build?.ssr) {
    return [
-     "import { registerAdapter, renderDSD, renderDSDByName, wrapInDocument, createLogger } from '@lessjs/core';",
+     "import { registerAdapter } from '@lessjs/core/adapter-registry';",
+     "import { renderDSD, renderDSDByName } from '@lessjs/core/render-dsd';",
+     "import { wrapInDocument } from '@lessjs/core/ssr-handler';",
+     "import { createLogger } from '@lessjs/core/logger';",
      "const log = createLogger('core');",
      'export { registerAdapter, renderDSD, renderDSDByName, wrapInDocument, log };',
    ].join('\n');
  }

# entry-descriptor.ts: 生成的代码直接从源文件导入
- imports.push({ from: '@lessjs/core/less-runtime', names: ['renderDSD', 'renderDSDByName'] });
+ imports.push({ from: '@lessjs/core/render-dsd', names: ['renderDSD', 'renderDSDByName'] });

# entry-renderer.ts: 生成的代码直接从源文件导入
- lines.push(`import { log, wrapInDocument } from '@lessjs/core/less-runtime';`);
+ lines.push(`import { createLogger } from '@lessjs/core/logger';`);
+ lines.push(`import { wrapInDocument } from '@lessjs/core/ssr-handler';`);
+ lines.push(`const log = createLogger('core');`);

# entry-renderer.ts SSG re-exports:
- 'export { wrapInDocument, registerAdapter, getAdapter } from "@lessjs/core/less-runtime"',
+ 'export { wrapInDocument } from "@lessjs/core/ssr-handler"',
+ 'export { registerAdapter, getAdapter } from "@lessjs/core/adapter-registry"',

# adapter-lit/ssr.ts: 改为从 adapter-registry 直接导入
- import { registerAdapter } from '@lessjs/core/less-runtime';
+ import { registerAdapter } from '@lessjs/core/adapter-registry';

# create/cli.ts 脚手架模板:
- "@lessjs/core/less-runtime": "jsr:@lessjs/core@^${_v.core}/less-runtime",
+ # 删除此行（不再需要单独的 less-runtime subpath）
```

**`virtual:less-runtime` 的 resolveId 仍需保留**，因为 runtime-shim.ts 的客户端代码仍通过这个虚拟模块注入。但 `less-runtime.ts` 文件本身可以删除。

**风险**：
- `@lessjs/core/adapter-registry` 是新增的 subpath export，需要在 `deno.json` 的 exports 中声明
- 生成代码的 import 路径变多（从 1 个 `less-runtime` 变成 3-4 个源文件）

### 3.4 方案 B：消除 `runtime-shim.ts` + `generate-runtime-shim.ts`，用 Vite 环境隔离替代

**思路**：不再预生成客户端 shim，而是让 Vite 的 SSR/客户端构建自然隔离依赖。

当前 runtime-shim 的存在原因：客户端构建不想拉入 `node:fs`、Vite 插件等服务器端依赖。但 `viteBuild({ ssr: false })` 本身就会排除 SSR-only 代码。

**可行性**：**低**。`render-dsd.ts` 和 `render-nested.ts` 中有 `import * as parse5 from 'parse5'`，这个依赖在客户端也需要（嵌套 DSD 渲染）。Vite 的 tree-shaking 无法自动把服务器端代码剥离。

### 3.5 方案 C（推荐）：保留架构，清理冗余

**思路**：保留 `virtual:less-runtime` + `runtime-shim.ts` 的架构（它们解决了真实问题），但做以下清理：

1. **删除 `less-runtime.ts`**（19 行 barrel）—— 任何消费者都改从源文件直接导入
2. **重命名 `runtime-shim.ts`** → `client-shim.ts` —— 更准确地表达"这是客户端构建的轻量 shim"
3. **重命名 `generate-runtime-shim.ts`** → `scripts/generate-client-shim.ts`
4. **更新 `less-runtime.ts` 的注释**，移到 `virtual:less-runtime` 在 `index.ts` 中的声明处
5. **在 `deno.json` 中添加 `@lessjs/core/adapter-registry` subpath export**

**改动清单**：

```
删除:  packages/core/src/less-runtime.ts
重命名: packages/core/src/runtime-shim.ts → packages/core/src/client-shim.ts
重命名: packages/core/scripts/generate-runtime-shim.ts → packages/core/scripts/generate-client-shim.ts
修改:  packages/core/src/index.ts       (import client-shim, 删除 less-runtime 引用)
修改:  packages/core/src/entry-descriptor.ts  (改从 render-dsd 直接导入)
修改:  packages/core/src/entry-renderer.ts     (改从源文件直接导入)
修改:  packages/adapter-lit/src/ssr.ts         (改从 adapter-registry 导入)
修改:  packages/create/cli.ts                  (删除 less-runtime subpath)
修改:  packages/core/deno.json                 (更新 exports)
修改:  deno.json                               (更新 generate:client-shim task)
```

**优点**：
- 消除了 `less-runtime.ts` 这个无意义的中间 barrel
- 命名更清晰：`client-shim` 一看就知道是客户端用的
- 保留了 `virtual:less-runtime` 虚拟模块（这是 Vite 插件注入机制的核心，不应删除）
- 保留了 `client-shim.ts` 的自动生成机制（解决 parse5 等重依赖的内联问题）

### 3.6 方案对比

| 维度 | 方案 A（删除 barrel） | 方案 B（消除 shim） | 方案 C（推荐） |
|------|----------------------|-------------------|---------------|
| 改动量 | 中 | 大 | 中 |
| 风险 | 低（导入路径变化） | 高（客户端构建可能断） | 低 |
| 收益 | 删除 1 个文件 | 删除 3 个文件 | 删除 1 文件 + 重命名 2 文件 |
| 可维护性 | 生成代码 import 更分散 | 不可行 | 命名更清晰 |
| 推荐 | 备选 | ❌ 不推荐 | ✅ 推荐 |

---

## 四、执行建议

| 优先级 | 任务 | 预估时间 |
|--------|------|---------|
| P0 | docs → www 重命名 | 30 分钟 |
| P1 | D2: types.ts 值导出清理 | 10 分钟 |
| P1 | D1: less-runtime.ts 注释修复 | 5 分钟 |
| P2 | 方案 C: 删除 less-runtime.ts + 重命名 | 30 分钟 |
| P3 | D5: build-ssg.ts 拆分 | 60 分钟（建议下个版本） |

---

*方案由齐活林（Qi）· 交付总监 制定*
