# LessJS v0.8.0 — Architecture Design Document

**版本**: v0.8.0
**架构师**: 高见远 (Gao)
**日期**: 2026-05-07
**前置**: PRD v0.8.0, v0.7.0 审计修复基线 (354 测试通过)

---

## 1. 实现方案 + 框架选型

### P0-1: Signals 测试套件

**方案**: 为 `@lessjs/signal` (749 行, `packages/signals/src/index.ts`) 编写全面的单元测试。

当前 signals 包是一个单文件实现，包含三层架构：
- **Engine Layer**: TC39 Signal polyfill (`Signal.State`, `Signal.Computed`, `Signal.subtle.Watcher`)
- **Framework Layer**: 用户友好 API (`signal()`, `computed()`, `effect()`)
- **Sugar Layer**: `islandEffect()`, `channel()`, `themeSignal()`, `batch()`, `untracked()`

**测试策略**:
- Engine Layer: 直接测试 `_engine.State` / `_engine.Computed` / `_engine.subtle.Watcher`（通过公开 API 间接测试）
- Framework Layer: `signal()` 读写、`computed()` 自动依赖追踪、`effect()` 自动重执行与 cleanup
- Sugar Layer: `islandEffect()` 连接/断开生命周期、`channel()` 事件总线、`batch()`/`untracked()`
- 边界用例: 通知阶段写保护、循环依赖检测、内存泄漏（dispose 后不再触发）

**测试环境约束**: `deno test`，无浏览器。`MutationObserver`/`document`/`localStorage` 需 mock。`queueMicrotask` 在 Deno 中可用。

**框架选型**: 无新依赖。使用 Deno 内置 `Deno.test` + `assert` 模块。

---

### P0-2: dsd-hydration.ts 单元测试

**方案**: 为 `WithDsdHydration` Mixin 和 `DsdLitElement` 编写单元测试。

核心测试场景：
1. **DSD 检测**: `createRenderRoot()` 在 shadow root 已有子元素时返回现有 shadow root，设置 `_dsdHydrated = true`
2. **无 DSD**: shadow root 为空时 `attachShadow({ mode: 'open' })`
3. **_hydrateEvents()**: 遍历 `static hydrateEvents`，查询 shadow root，绑定事件
4. **AbortController 清理**: `disconnectedCallback()` 调用 `_hydrateAbortController.abort()`
5. **connectedCallback 自动调用**: DSD 水合时自动调用 `_hydrateEvents()`

**测试环境约束**: 需要模拟 `LitElement`、`HTMLElement`、`shadowRoot`、`customElements`。不能直接 import `lit`（浏览器依赖），需要创建测试用的 mock 基类。

**Mock 策略**: 创建一个 `MockLitElement` 类，模拟 LitElement 的 `createRenderRoot()` / `connectedCallback()` / `disconnectedCallback()` / `shadowRoot` / `attachShadow()` 生命周期。将 `WithDsdHydration` Mixin 应用于 `MockLitElement` 进行测试。

---

### P0-3: render-dsd.ts 拆分

**方案**: 将 781 行 `render-dsd.ts` 拆分为 4 个模块。

**当前结构分析** (行号区间):

| 行号区间 | 职责 | 目标模块 |
|----------|------|----------|
| 1-73 | 类型定义 + HTML 转义函数 | `html-escape.ts` |
| 75-152 | 类型定义 (ComponentLayer, HydrateEventDescriptor, RenderAdapter, DsdComponent, DsdOptions) + adapter 注册 | `types.ts` |
| 153-447 | renderDSD / renderDSDByName / 序列化属性 / DSD 模板属性构建 / Lit 启发式检测 | `render-dsd.ts` (入口，保留) |
| 449-780 | 嵌套 CE 递归渲染 (kebabToCamel, parseElementAttrs, findMatchingCloseTag, findTemplateShadowRanges, isInRange, alreadyHasDSD, inferDsdOptions, renderNestedCustomElements) | `render-nested.ts` |

**调整**: 严格按职责边界而非行数均分。最终拆分：

1. **`html-escape.ts`** (~73 行) — SafeHtml/UnsafeHtml 品牌类型 + `escapeHtml` / `escapeAttr` / `escapeAttrValue`
2. **`types.ts`** (~78 行) — `ComponentLayer` / `HydrateEventDescriptor` / `RenderAdapter` / `DsdComponent` / `DsdOptions` / adapter 注册
3. **`render-nested.ts`** (~330 行) — 嵌套 CE 递归渲染 + 辅助函数 (kebabToCamel, parseElementAttrs, findMatchingCloseTag, findTemplateShadowRanges, isInRange, alreadyHasDSD, inferDsdOptions)
4. **`render-dsd.ts`** (~300 行) — 入口模块，re-export + `serializeAttributes` / `buildDsdTemplateAttrs` / `renderDSD` / `renderDSDByName`

**向后兼容**: `render-dsd.ts` re-export 所有公开 API，外部 import 路径不变。

---

### P0-4: UI 统一到 DsdLitElement

**方案**: 将 3 个直接 `extends LitElement` 并手动实现 DSD 水合的组件改为 `extends DsdLitElement`。

**代码审计结果** (Q-2 回答):

| 组件 | 当前基类 | 是否手动 DSD | 需要迁移 |
|------|----------|-------------|---------|
| `less-button` | `LitElement` | 手动 `_dsdHydrated` + `createRenderRoot()` | **是** |
| `less-card` | `LitElement` | 手动 `_dsdHydrated` + `createRenderRoot()` | **是** |
| `less-input` | `LitElement` | 手动 `_dsdHydrated` + `createRenderRoot()` | **是** |
| `less-code-block` | `DsdLitElement` | Mixin | 否 |
| `less-layout` | `DsdLitElement` | Mixin | 否 |
| `less-theme-toggle` | `DsdLitElement` | Mixin | 否 |
| `less-dialog` | `DsdLitElement` | Mixin | 否 |
| `less-hero-ping` | `LitElement` | 纯 Island (Layer 3)，无 DSD | **否** |

**3 个需迁移组件**: `less-button`、`less-card`、`less-input`

**迁移步骤** (每个组件):
1. 将 `import { LitElement }` 改为 `import { DsdLitElement } from '@lessjs/adapter-lit'`
2. 将 `extends LitElement` 改为 `extends DsdLitElement`
3. 删除手动 `_dsdHydrated` 字段声明
4. 删除手动 `createRenderRoot()` override（Mixin 已提供）
5. 如有事件需 DSD 水合后绑定，添加 `static hydrateEvents`
6. 保持 `render()` 中 `if (this._dsdHydrated) return nothing` 检查不变

**less-button 迁移特殊处理**: 需添加 `static hydrateEvents` 用于 disabled anchor 的 click 拦截（如果有 DSD 交互场景）。但当前 `less-button` 是 Layer 1 (dsd-static)，无交互事件需要水合，所以仅改基类即可。

**less-input 迁移特殊处理**: 有 `@input` 事件。当前是 Layer 1 (dsd-static)，但表单输入需要客户端 JS 工作。需添加 `static hydrateEvents` 用于 input 事件绑定。

**less-card 迁移特殊处理**: 纯静态展示，无交互事件。仅改基类。

**less-hero-ping 不迁移**: 它是 Layer 3 (pure-island)，不需要 DSD 水合。直接 `extends LitElement` 是正确的。

---

### P0-5: insertAfterHead 去重

**方案**: 将 `insertAfterHead` 从 `@lessjs/ui/src/ssg-inject.ts` 移至 `@lessjs/core/src/ssg-postprocess.ts` 并导出，`@lessjs/ui` 改为引用 core 导出。

**当前重复**:
- `packages/core/src/ssg-postprocess.ts:16-25` — `insertAfterHead()` 函数（已存在但未导出）
- `packages/ui/src/ssg-inject.ts:25-34` — 完全相同的 `insertAfterHead()` 函数

**步骤**:
1. 在 `@lessjs/core/src/ssg-postprocess.ts` 中将 `insertAfterHead` 改为 `export function`
2. 在 `@lessjs/core/src/index.ts` 中添加 re-export: `export { insertAfterHead } from './ssg-postprocess.js'`
3. 在 `@lessjs/ui/src/ssg-inject.ts` 中删除本地 `insertAfterHead`，改为 `import { insertAfterHead } from '@lessjs/core'`
4. 同样处理 `insertBeforeBodyClose`：虽然 ui 包未使用，但为一致性也导出

---

### P1-1: Signal 原生切换

**方案**: 运行时检测 `globalThis.Signal`，存在时使用原生实现，否则回退到内嵌 polyfill。

**决策 (Q-3 回答)**: **运行时检测**。理由：
1. 构建时条件导入需要双产物或动态 import，增加构建复杂度
2. 运行时检测代码量极小（~20 行），对产物体积影响可忽略
3. TC39 Signal 提案仍在 Stage 3，浏览器支持不稳定，运行时检测更灵活
4. 产物体积减少主要来自 polyfill 的 tree-shaking（当原生可用时），运行时检测不影响这一点

**实现**:
```typescript
// packages/signals/src/index.ts 顶部修改
const _engine: SignalEngineNamespace = globalThis.Signal ?? _createPolyfill();
```

当前代码已是 `const _engine = _createPolyfill()`，只需改为优先使用 `globalThis.Signal`。

**兼容性验证**: P0-1 测试套件完成后，新增 "原生 Signal 可用" 和 "原生不可用回退" 两个测试用例。

---

### P1-2: Island Upgrade Manifest

**方案**: SSG 构建时输出每页 island 清单 JSON 文件。

**输出格式 (Q-4 回答)**: JSON 文件，与 SSG 产物同目录。

**Manifest 格式**:
```typescript
// packages/core/src/island-manifest.ts

interface IslandManifestEntry {
  /** Island tag name (e.g. 'less-theme-toggle') */
  tagName: string;
  /** Client chunk URL relative to page (e.g. '/client/islands/island-less-theme-toggle-abc123.js') */
  chunkUrl: string;
  /** Upgrade strategy */
  strategy: 'eager' | 'lazy' | 'idle' | 'visible';
  /** Component layer */
  layer: 'dsd-static' | 'dsd-interactive' | 'pure-island';
}

interface PageIslandManifest {
  /** Page route (e.g. '/guide/getting-started') */
  route: string;
  /** Islands found on this page */
  islands: IslandManifestEntry[];
  /** Build timestamp */
  builtAt: string;
}
```

**输出位置**: `{outDir}/island-manifests/{route-hash}.json`

**生成时机**: SSG 后处理阶段，扫描每页 HTML 中的 CE 标签名，结合 `buildIslandChunkMap` 映射。

---

### P1-3: @lessjs/blog 开发启动

**方案**: 创建新包 `@lessjs/blog`，以 Vite 插件形态提供博客功能。

**Markdown 解析器选型 (Q-5 回答)**: **marked**。理由：
1. 更轻量（~30KB vs markdown-it ~80KB）
2. v0.8 只需基础 Markdown → HTML，不需要插件生态
3. marked v15+ 支持 async + extension API，满足 frontmatter 提取需求
4. 如未来需要 GFM/数学公式，可迁移到 markdown-it

**插件 API**:
```typescript
// packages/blog/src/index.ts

interface LessBlogOptions {
  /** Directory containing .md files (default: 'posts') */
  contentDir?: string;
  /** Base URL path for blog (default: '/blog') */
  basePath?: string;
  /** Markdown renderer override */
  markdown?: (content: string) => string | Promise<string>;
}

function lessBlog(options?: LessBlogOptions): VitePlugin;
```

**v0.8 范围**: 扫描 .md → 生成路由 → 渲染列表页/文章页。不含 MDX、评论、标签系统。

---

## 2. 文件列表及相对路径

### P0-1: Signals 测试套件

| 操作 | 文件路径 |
|------|----------|
| 新建 | `packages/signals/__tests__/signal.test.ts` |
| 新建 | `packages/signals/__tests__/computed.test.ts` |
| 新建 | `packages/signals/__tests__/effect.test.ts` |
| 新建 | `packages/signals/__tests__/island-effect.test.ts` |
| 新建 | `packages/signals/__tests__/channel.test.ts` |
| 新建 | `packages/signals/__tests__/theme-signal.test.ts` |
| 新建 | `packages/signals/__tests__/batch-untracked.test.ts` |

### P0-2: dsd-hydration.ts 单元测试

| 操作 | 文件路径 |
|------|----------|
| 新建 | `packages/adapter-lit/__tests__/dsd-hydration.test.ts` |

### P0-3: render-dsd.ts 拆分

| 操作 | 文件路径 |
|------|----------|
| 新建 | `packages/core/src/html-escape.ts` |
| 新建 | `packages/core/src/types.ts` |
| 新建 | `packages/core/src/render-nested.ts` |
| 修改 | `packages/core/src/render-dsd.ts` (重构为入口 + re-export) |
| 修改 | `packages/core/src/index.ts` (import 路径调整) |
| 修改 | `packages/core/__tests__/render-dsd.test.ts` (import 路径调整) |
| 修改 | `packages/adapter-lit/src/dsd-hydration.ts` (import 路径调整) |

### P0-4: UI 统一到 DsdLitElement

| 操作 | 文件路径 |
|------|----------|
| 修改 | `packages/ui/src/less-button.ts` |
| 修改 | `packages/ui/src/less-card.ts` |
| 修改 | `packages/ui/src/less-input.ts` |

### P0-5: insertAfterHead 去重

| 操作 | 文件路径 |
|------|----------|
| 修改 | `packages/core/src/ssg-postprocess.ts` (export insertAfterHead) |
| 修改 | `packages/core/src/index.ts` (re-export insertAfterHead) |
| 修改 | `packages/ui/src/ssg-inject.ts` (import from core, 删除本地实现) |

### P1-1: Signal 原生切换

| 操作 | 文件路径 |
|------|----------|
| 修改 | `packages/signals/src/index.ts` (globalThis.Signal 检测) |
| 新建 | `packages/signals/__tests__/native-signal.test.ts` |

### P1-2: Island Upgrade Manifest

| 操作 | 文件路径 |
|------|----------|
| 新建 | `packages/core/src/island-manifest.ts` |
| 修改 | `packages/core/src/index.ts` (导出 manifest 相关类型和函数) |
| 新建 | `packages/core/__tests__/island-manifest.test.ts` |

### P1-3: @lessjs/blog 开发启动

| 操作 | 文件路径 |
|------|----------|
| 新建 | `packages/blog/` (整个包目录) |
| 新建 | `packages/blog/deno.json` |
| 新建 | `packages/blog/src/index.ts` |
| 新建 | `packages/blog/src/markdown.ts` |
| 新建 | `packages/blog/src/routes.ts` |
| 新建 | `packages/blog/src/types.ts` |
| 新建 | `packages/blog/__tests__/markdown.test.ts` |
| 新建 | `packages/blog/__tests__/routes.test.ts` |

---

## 3. 数据结构和接口

### 3.1 render-dsd 拆分后的类型分布

```typescript
// packages/core/src/html-escape.ts
export type SafeHtml = string & { readonly __safeHtml: unique symbol };
export type UnsafeHtml = string & { readonly __unsafeHtml: unique symbol };
export function escapeHtml(str: string | SafeHtml | UnsafeHtml): string;
export function escapeAttr(value: string): string;
export function escapeAttrValue(value: unknown): string;

// packages/core/src/types.ts
export type ComponentLayer = 'dsd-static' | 'dsd-interactive' | 'pure-island';

export interface HydrateEventDescriptor {
  selector: string;
  event: string;
  method: string;
}

export interface RenderAdapter {
  isTemplate?: (value: unknown) => boolean;
  render?: (value: unknown, tagName: string) => Promise<string>;
  extractStyles?: (componentClass: CustomElementConstructor) => string | undefined;
}

export interface DsdComponent {
  render(): string | unknown;
  connectedCallback?(): void;
  layer?: ComponentLayer;
  hydrateEvents?: HydrateEventDescriptor[];
  [key: string]: unknown;
}

export interface DsdOptions {
  delegatesFocus?: boolean;
  serializable?: boolean;
  slotAssignment?: 'named' | 'manual';
  customElementRegistry?: string;
  layer?: ComponentLayer;
}

export function registerAdapter(adapter: RenderAdapter | undefined): void;
```

### 3.2 Island Manifest 接口

```typescript
// packages/core/src/island-manifest.ts

export interface IslandManifestEntry {
  tagName: string;
  chunkUrl: string;
  strategy: 'eager' | 'lazy' | 'idle' | 'visible';
  layer: 'dsd-static' | 'dsd-interactive' | 'pure-island';
}

export interface PageIslandManifest {
  route: string;
  islands: IslandManifestEntry[];
  builtAt: string;
}

export function generateIslandManifest(
  htmlDir: string,
  islandChunkMap: Record<string, string>,
  strategyMap: Record<string, string>,
): PageIslandManifest[];

export function writeIslandManifests(
  outputDir: string,
  manifests: PageIslandManifest[],
): void;
```

### 3.3 Blog 插件接口

```typescript
// packages/blog/src/types.ts

export interface BlogPostFrontmatter {
  title: string;
  date: string;
  draft?: boolean;
  tags?: string[];
  excerpt?: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  content: string;
  html: string;
}

export interface LessBlogOptions {
  contentDir?: string;
  basePath?: string;
  markdown?: (content: string) => string | Promise<string>;
}

// packages/blog/src/index.ts
export function lessBlog(options?: LessBlogOptions): Plugin;
```

---

## 4. 程序调用流程

### 4.1 render-dsd.ts 拆分后的调用流

```
import { renderDSD } from '@lessjs/core/render-dsd'
       │
       ▼
render-dsd.ts (入口)
  ├── import { escapeHtml, escapeAttrValue } from './html-escape.ts'
  ├── import { type DsdComponent, type DsdOptions, type ComponentLayer,
  │           type HydrateEventDescriptor, type RenderAdapter,
  │           registerAdapter, getAdapter } from './types.ts'
  ├── import { renderNestedCustomElements } from './render-nested.ts'
  │
  ├── renderDSD()
  │   ├── serializeAttributes()       → 本地函数
  │   ├── instance.render()           → 获取 content
  │   ├── getAdapter().render()       → 框架适配器
  │   ├── renderNestedCustomElements() → render-nested.ts
  │   ├── getAdapter().extractStyles() → 提取样式
  │   └── buildDsdTemplateAttrs()     → 本地函数
  │
  └── renderDSDByName()
      └── customElements.get() + renderDSD()
```

```
render-nested.ts
  ├── kebabToCamel()
  ├── parseElementAttrs()
  ├── findMatchingCloseTag()
  ├── findTemplateShadowRanges()
  ├── isInRange()
  ├── alreadyHasDSD()
  ├── inferDsdOptions()
  └── renderNestedCustomElements()
      └── renderDSD() ← 回调 render-dsd.ts 入口
```

### 4.2 DsdLitElement 统一后的组件生命周期

```
SSR:
  1. renderDSD('less-button', LessButton, props)
  2. instance.render() → HTML string
  3. 包装 <template shadowrootmode="open">
  4. 输出 DSD HTML

Client (浏览器):
  1. 浏览器解析 DSD → 自动创建 shadow root
  2. customElements.define('less-button', LessButton) 升级
  3. WithDsdHydration.createRenderRoot() → 检测到已有 shadow root → _dsdHydrated = true
  4. connectedCallback()
     ├── super.connectedCallback()  → LitElement 生命周期
     └── _hydrateEvents()          → 绑定 static hydrateEvents 中声明的事件
  5. render() → if (_dsdHydrated) return nothing → 无重复渲染

断开:
  disconnectedCallback()
  └── _hydrateAbortController.abort() → 清理所有事件监听器
```

### 4.3 Island Manifest 生成流程

```
SSG 构建:
  1. Vite build (client + server)
  2. SSG 渲染每页 HTML
  3. 后处理: injectClientScript / injectDsdPolyfill / injectCspMeta
  4. 新增: generateIslandManifest()
     ├── 扫描 {outDir} 下所有 .html 文件
     ├── 对每个文件: 正则匹配 <xxx-yyy> CE 标签名
     ├── 结合 buildIslandChunkMap() 获取 chunk URL
     ├── 结合 island 元数据获取 strategy + layer
     └── 输出 PageIslandManifest[]
  5. writeIslandManifests() → 写入 JSON 文件
```

---

## 5. 任务列表

按依赖关系和实施顺序排列。`[dep: X]` 表示依赖任务 X 完成后才能开始。

| # | 任务 | 优先级 | 依赖 | 预估规模 |
|---|------|--------|------|----------|
| T1 | 创建 signals 测试套件：signal + computed + batch + untracked | P0 | 无 | ~120 行测试 |
| T2 | 创建 signals 测试套件：effect + islandEffect | P0 | T1 | ~100 行测试 |
| T3 | 创建 signals 测试套件：channel + themeSignal | P0 | T1 | ~80 行测试 |
| T4 | 创建 dsd-hydration 单元测试（MockLitElement + Mixin 测试） | P0 | 无 | ~150 行测试 |
| T5 | 拆分 html-escape.ts（从 render-dsd.ts 提取） | P0 | 无 | 新建 ~73 行 |
| T6 | 拆分 types.ts（从 render-dsd.ts 提取） | P0 | T5 | 新建 ~78 行 |
| T7 | 拆分 render-nested.ts（从 render-dsd.ts 提取） | P0 | T5, T6 | 新建 ~330 行 |
| T8 | 重构 render-dsd.ts 为入口 + re-export | P0 | T5, T6, T7 | 修改至 ~300 行 |
| T9 | 修复拆分后的 import 路径（index.ts, test, adapter-lit） | P0 | T8 | 小改 |
| T10 | 运行全量测试验证拆分无回归 | P0 | T9 | 验证 |
| T11 | less-button 迁移到 DsdLitElement | P0 | 无 | 修改 ~15 行 |
| T12 | less-card 迁移到 DsdLitElement | P0 | 无 | 修改 ~10 行 |
| T13 | less-input 迁移到 DsdLitElement | P0 | 无 | 修改 ~15 行 |
| T14 | insertAfterHead 从 core 导出 | P0 | 无 | 修改 ~5 行 |
| T15 | ui/ssg-inject.ts 改为引用 core 的 insertAfterHead | P0 | T14 | 修改 ~5 行 |
| T16 | Signal 原生切换：globalThis.Signal 检测 | P1 | T1, T2, T3 | 修改 ~20 行 |
| T17 | Signal 原生切换测试 | P1 | T16 | 新增 ~40 行 |
| T18 | Island Manifest 类型定义 + generateIslandManifest 实现 | P1 | T8 | 新增 ~120 行 |
| T19 | Island Manifest 测试 | P1 | T18 | 新增 ~80 行 |
| T20 | @lessjs/blog 包脚手架 + deno.json | P1 | 无 | 配置文件 |
| T21 | Blog Markdown 解析器 (marked 集成) | P1 | T20 | 新增 ~60 行 |
| T22 | Blog 路由生成 + Vite 插件 | P1 | T20, T21 | 新增 ~100 行 |
| T23 | Blog 测试 | P1 | T21, T22 | 新增 ~80 行 |

**并行机会**:
- T1-T4 可与 T5-T8 并行（测试编写不依赖拆分）
- T11-T13 可并行
- T14-T15 可与 T11-T13 并行
- T16-T17 依赖 T1-T3（先有测试才能安全重构）
- T18-T19 依赖 T8（manifest 需要清晰的渲染管线）
- T20-T23 独立于其他任务，但建议在 T8 后开始

---

## 6. 依赖包列表

| 包名 | 用途 | 引入位置 | 版本建议 |
|------|------|----------|----------|
| `marked` | Markdown → HTML | `packages/blog` | ^15.0.0 |
| `gray-matter` | Frontmatter 解析 | `packages/blog` | ^4.0.3 |

**无新依赖的需求**: P0-1 ~ P0-5, P1-1, P1-2 均不引入外部依赖。

---

## 7. 共享知识

### 7.1 命名约定

- **文件命名**: kebab-case (`render-dsd.ts`, `html-escape.ts`, `render-nested.ts`)
- **导出命名**: camelCase 函数, PascalCase 类/接口/类型
- **测试文件**: `__tests__/{module-name}.test.ts`
- **包子路径导出**: bare specifier（`@lessjs/core/render-dsd`），通过 `deno.json` exports 配置

### 7.2 Import 路径规则

- **包内**: 相对路径 + `.js` 后缀（`import { foo } from './html-escape.js'`）
- **跨包**: bare specifier（`import { DsdLitElement } from '@lessjs/adapter-lit'`）
- **JSR 发布**: 所有跨包 import 必须使用 bare specifier，不能使用相对路径

### 7.3 测试 Mock 约定

- **HTMLElement mock**: 创建最小化的 mock 类，只实现测试所需的属性/方法
- **shadowRoot mock**: 返回 `{ childElementCount, querySelectorAll, querySelector }` 等必要方法
- **customElements mock**: `globalThis.customElements = { get, define }` 在测试 setup 中设置

### 7.4 DSD 组件迁移检查清单

每个从 `LitElement` 迁移到 `DsdLitElement` 的组件：
1. 替换 import 和 extends
2. 删除手动 `_dsdHydrated` 字段和 `createRenderRoot()` override
3. 检查是否有需要 DSD 水合后绑定的事件 → 添加 `static hydrateEvents`
4. 保持 `render()` 中 `_dsdHydrated` 检查（Mixin 提供该属性）
5. 检查 `connectedCallback()` / `disconnectedCallback()` 是否需要调整（Mixin 已处理基本生命周期）
6. 运行现有测试确认无回归

---

## 8. 待明确事项

### 已在本文中回答的问题

| # | 问题 | 决策 |
|---|------|------|
| Q-1 | render-dsd.ts 拆分的具体模块边界 | 4 模块: `html-escape.ts` / `types.ts` / `render-nested.ts` / `render-dsd.ts`(入口) |
| Q-2 | 哪 3 个 UI 组件未使用 DsdLitElement | `less-button` / `less-card` / `less-input`（`less-hero-ping` 不需要，它是纯 Island） |
| Q-3 | Signal 原生切换策略 | **运行时检测** `globalThis.Signal`，回退到内嵌 polyfill |
| Q-4 | Island Manifest 输出格式 | JSON 文件，与 SSG 产物同目录，每页一个 |
| Q-5 | Blog Markdown 解析器选型 | **marked**（轻量，v0.8 不需要插件生态） |

### 仍需确认的问题

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| Q-6 | v0.8.0 是否需要提升包版本号 | 发布策略 | 建议 YES：render-dsd 拆分改变内部导入路径（虽然 re-export 保持兼容，但 deno.json exports 可能变化）。所有包统一升到 0.8.0 |
| Q-7 | P2 项是否推迟到 v0.9 | 版本规划 | 建议 YES：Playwright E2E 和 Interactive Playground 在 v0.9（Fullstack）时与全栈测试基础设施一起做 |

---

_文档作者: 高见远 (Gao) · Architect | 2026-05-07_
