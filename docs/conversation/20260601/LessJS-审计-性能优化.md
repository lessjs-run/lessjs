# LessJS v0.27.0 性能优化专项审计报告

**审计人员**: performance-engineer  
**审计日期**: 2026-06-01  
**审计版本**: v0.27.0  
**审计范围**: 开发启动、构建、服务端渲染、客户端运行、产物体积、Hydration 开销  

---

## 一、关键性能指标实测数据

### 1.1 构建产物体积分析（基于 www/dist 实际构建产物）

| 类别 | 原始大小 | 说明 |
|------|---------|------|
| SSR Bundle (`server/entry.js`) | **1.53 MB** | gzip 后 ~306 KB |
| 客户端 Islands JS 总计 | **~654 KB** | 33 个 JS 文件 |
| 单个 HTML 页面（典型） | **~75 KB** | 含内联 DSD |
| 最大 HTML 页面 | **~122 KB** | decisions 页面 |
| 总构建产物 | **46 MB** | 含 server + client + HTML |

### 1.2 客户端 JS 关键分块体积

| Chunk | 原始大小 | 说明 | 风险 |
|-------|---------|------|------|
| `client-DrPum-09.js` | **178 KB** | Shoelace+Lit 核心 | P1 |
| `dist-BPGcSr41.js` | **172 KB** | @lessjs/ui 核心 | P1 |
| `shoelace-showcase-*.js` | **82 KB** | Shoelace 演示 | P2 |
| `flexsearch.bundle.module.min-*.js` | **49 KB** | FlexSearch 全量 | P1 |
| `island-demo-idle-*.js` | **48 KB** | Demo Island | P2 |
| `less-layout-*.js` | **23 KB** | 布局组件 | 正常 |
| `island-api-consumer-*.js` | **23 KB** | API 消费组件 | 正常 |
| 其他 Islands (< 12 KB) | ~40 KB | 各种小型 Island | 正常 |

### 1.3 核心包源码规模

| 文件 | 行数 | 说明 |
|------|------|------|
| `types.ts` | 1448 | 类型定义（编译时消除） |
| `dsd-element.ts` | 656 | DSD 基类 |
| `prop.ts` | 607 | 属性系统 |
| `island.ts` | 440 | Island 注册+策略 |
| `jsx-render-string.ts` | 436 | SSR 字符串渲染 |
| `render-dsd.ts` | 429 | DSD 渲染入口 |
| `jsx-render-dom.ts` | 360 | CSR DOM 渲染 |
| **核心包总计** | **6911** | 含所有 .ts 文件 |

---

## 二、各阶段性能瓶颈与根因分析

### 2.1 SSR 渲染阶段

#### P0: SSR Bundle 体积 1.53 MB — 远超合理范围

- **问题位置**: `packages/adapter-vite/src/cli/build-ssg.ts:404-524`
- **现象**: SSR Bundle (`server/entry.js`) 为 1.53 MB，gzip 后 306 KB
- **影响**: SSG 构建时需导入此 bundle 进行页面渲染，冷启动 SSG 渲染慢；部署到 CF Pages 等 Edge 环境时 import 延迟大
- **根因分析**:
  1. `ssr.noExternal` 包含 `/^@lessjs\//`, `/^lit/`, `/^@lit/`, `alien-signals`, `react`, `react-dom` — 几乎内联了所有依赖
  2. Shoelace 被 `noExternal` 覆盖（`/^@lessjs/` 正则匹配到 Shoelace 的适配器），导致完整 Shoelace 库被打入 SSR Bundle
  3. React + ReactDOM 整包被内联（即使大部分页面不使用 React）
  4. Hono 框架本身也在 bundle 中
- **整改建议**:
  - 将 SSR Bundle 拆分为核心渲染模块和按需加载的适配器模块
  - React/React-Dom 应仅在配置了 `adapter-react` 时才内联
  - Shoelace 是浏览器专用组件，不应打入 SSR Bundle
  - 考虑使用动态 `import()` 延迟加载非核心适配器

#### P1: `renderDsd()` 每次渲染都 `instantiateComponent()` + `injectProps()` — 无实例复用

- **问题位置**: `packages/core/src/render-dsd.ts:163-197`
- **现象**: 同一组件在多个页面中渲染时，每次都重新 `new` 实例
- **影响**: 大页面 / 多组件场景下 SSR 渲染时间线性增长
- **整改建议**: 对同 tag + 同 props 的渲染结果添加可选缓存层

#### P1: `renderDsdTree()` 中 `customElements.get(tagStr)` 每个节点都调用

- **问题位置**: `packages/core/src/jsx-render-string.ts:375-405`
- **现象**: 递归遍历 VNode 树时，每个 HTML element 节点都执行 `customElements.get(tagStr)` 检查
- **影响**: 大型页面含数百个 HTML 元素，每次 `customElements.get()` 是 Map 查找，虽然 O(1) 但有常数开销
- **整改建议**: 在 `renderDsdTree()` 入口处缓存已注册的 tag Set，或使用 `__islandMap` 做快速前检查

#### P2: `wrapDsdOutput()` 中 props 序列化两次

- **问题位置**: `packages/core/src/render-serialize.ts:91-97`
- **现象**: `serializeAttributes(props)` 序列化一次（HTML 属性），`data-ssr-props` 又 JSON.stringify(props) 一次
- **影响**: Object 类型 props 被序列化为 HTML 属性（`serializeAttributes` 中 JSON.stringify），然后又在 `data-ssr-props` 中重复 JSON.stringify。对于大型 props 对象（如导航数据），这增加了渲染输出体积和序列化开销
- **整改建议**: 仅在 `data-ssr-props` 中序列化 Object 类型 props，HTML 属性中只保留原始类型

### 2.2 构建阶段

#### P1: SSG 构建需要三次独立 Vite Build

- **问题位置**: `packages/adapter-vite/src/cli/build.ts` (整体流程)
- **现象**: 完整 `deno task build` 执行三个阶段:
  1. Phase 1: 开发配置 + 路由扫描
  2. Phase 2: 客户端 Island 构建 (`buildClient`)
  3. Phase 3: SSR Bundle 构建 + SSG 渲染 (`buildSSG`)
- **影响**: 三次 Vite 构建启动，总耗时较长。对于大型项目，每次 Vite 启动需要解析模块图
- **整改建议**:
  - Phase 2 和 Phase 3 可以共享部分配置和缓存
  - 考虑使用 Vite 的 `environment` API 合并构建步骤
  - 路由扫描结果可以缓存（当前 `scanRoutes` 每次构建都重新递归文件系统）

#### P1: 路由扫描使用同步 `readdir` + `stat` — 大型项目 IO 开销

- **问题位置**: `packages/adapter-vite/src/route-scanner.ts:182-276`
- **现象**: `scanRoutes()` 使用 `readdir` + 逐文件 `stat` + 逐文件 `readFile`（读取 tagName），全部是串行异步操作
- **影响**: 路由数量 >100 时，串行 stat/readFile 累积延迟明显
- **整改建议**:
  - 使用 `readdir({ withFileTypes: true })` 代替 `readdir` + `stat`（已部分使用但 `scanIslands` 未用）
  - 对 `readRouteTagNameFromModule` 的文件读取使用并行 `Promise.all`
  - 增加 `.less/routes-cache.json` 缓存，仅在文件变更时重新扫描

#### P2: CEM 扫描每次构建都遍历 `node_modules`

- **问题位置**: `packages/adapter-vite/src/route-scanner.ts:558-598`
- **现象**: `scanCemManifests()` 每次构建都遍历 `node_modules` 目录查找 `custom-elements.json`
- **影响**: 大型项目 `node_modules` 含数百个包，每次构建都全量扫描
- **整改建议**: 结果缓存到 `.less/cem-manifests.json`，仅在 `node_modules` 修改时间变化时重新扫描

### 2.3 客户端运行阶段

#### P1: 客户端 Island 入口 `client.js` 全量加载所有 Island 模块映射

- **问题位置**: `packages/adapter-vite/src/entry-generators.ts:53-178`
- **现象**: 生成的 `client.js` 入口包含所有 Island 的 `import()` 动态导入映射，无论当前页面是否使用
- **影响**: 虽然使用了动态 `import()`，但入口文件本身（4.4 KB）会在每个页面加载
- **整改建议**: 当前实现已经使用动态 import + 策略调度（load/idle/visible/only），这是合理的。但可考虑按页面级别生成更小的入口文件

#### P1: `client-DrPum-09.js` 178 KB — Shoelace+Lit 核心运行时

- **问题位置**: 构建产物 `www/dist/client/islands/client-DrPum-09.js`
- **现象**: Shoelace 组件和 Lit 运行时被打包成一个 178 KB 的共享 chunk
- **影响**: 任何使用 Shoelace 组件的页面都会加载此 chunk，即使只使用一个组件
- **整改建议**:
  - 使用 `manualChunks` 配置将 Shoelace 按组件粒度拆分
  - 或者使用 Shoelace 的 tree-shaking 友好的子路径导入
  - Lit 运行时（~16 KB）作为独立 chunk

#### P1: FlexSearch 全量加载 49 KB

- **问题位置**: `www/dist/client/islands/flexsearch.bundle.module.min-*.js`
- **现象**: FlexSearch 完整模块被打包为独立 chunk (49 KB)
- **影响**: 仅搜索页面需要，但作为共享 chunk 可能被预加载
- **整改建议**: FlexSearch 应使用 `visible` 策略或仅在搜索页面加载

#### P2: DSD Polyfill 注入所有 HTML 页面 — 2.5 KB 内联脚本

- **问题位置**: `packages/adapter-vite/src/ssg-postprocess.ts:170-224`
- **现象**: DSD polyfill 包含 ~2.5 KB 的内联 JS + 内联 CSS，注入到每个 HTML 页面
- **影响**: Chrome/Safari 已原生支持 DSD，polyfill 仅 Firefox 需要。每个页面增加 2.5 KB 不可缓存的内联内容
- **整改建议**: 
  - 使用 `<script type="module">` + 外部文件替代内联，利用浏览器缓存
  - 或使用 User-Agent 检测仅对 Firefox 返回 polyfill
  - 内联 CSS（主题变量）应提取为外部 `.css` 文件

### 2.4 开发阶段

#### P1: `dev:fast` 路径使用独立 dev server 但仍需完整路由扫描

- **问题位置**: `deno.json` 中 `dev:fast` 任务配置
- **现象**: `dev:fast` 运行 `app/dev-server.ts`，减少了 Vite 插件开销，但仍需扫描路由和 Islands
- **影响**: 冷启动仍需等待路由扫描完成
- **整改建议**: 
  - 路由扫描结果缓存到 `.less/routes.json`，HMR 时增量更新
  - 冷启动时使用缓存的扫描结果，后台异步验证

#### P2: HMR 未做增量路由更新

- **问题位置**: `packages/adapter-vite/src/less-plugin.ts:223-331`
- **现象**: `buildStart()` 中 `ctx.reset()` 清空所有缓存，每次 HMR 触发时重新扫描所有路由和 Islands
- **影响**: 文件修改后 HMR 响应时间包含完整路由扫描时间
- **整改建议**: 仅在路由文件变更时重新扫描，其他文件变更跳过路由扫描

### 2.5 包体积与 Tree-Shaking

#### P1: `@lessjs/runtime` 桶式导出影响 Tree-Shaking

- **问题位置**: `packages/runtime/src/index.ts`
- **现象**: `@lessjs/runtime` 重新导出了 `@lessjs/core`、`@lessjs/signals`、`@lessjs/style-sheet` 的全部公共 API
- **影响**: 使用 `import { DsdElement } from '@lessjs/runtime'` 可能导致整个 core 包被引入（取决于 bundler 的 tree-shaking 能力）
- **整改建议**: 
  - 推荐直接从子包导入：`import { DsdElement } from '@lessjs/core'`
  - `@lessjs/runtime` 文档标注为"便捷入口"，非推荐导入路径

#### P2: `types.ts` 1448 行 — 运行时包中包含大量类型定义

- **问题位置**: `packages/core/src/types.ts`
- **现象**: 核心包中 types.ts 占 1448 行（21% 核心包代码量），包含大量仅类型导出
- **影响**: TypeScript 编译后类型会消除，但 Deno 的类型检查和 `deno check` 耗时会受影响
- **整改建议**: 考虑将纯类型拆分到 `@lessjs/core/types` 子路径，减少主入口的类型检查负担

#### P2: `less-layout` Island 23 KB — 包含完整导航数据

- **问题位置**: `www/dist/client/islands/less-layout-*.js`
- **现象**: less-layout Island 打包为 23 KB，可能包含内联的导航配置数据
- **影响**: 每个页面都加载 less-layout Island（它是全局布局组件）
- **整改建议**: 导航数据应通过 `<script type="application/json">` 或 fetch 从静态 JSON 加载，不内联在 JS bundle 中

---

## 三、性能优化方案（按收益排序）

### 方案 1: SSR Bundle 瘦身 [预估收益: SSR 体积 -40%]

| 项目 | 当前 | 优化后 | 措施 |
|------|------|--------|------|
| React/ReactDOM 内联 | 总是内联 | 仅配置时内联 | 条件化 noExternal |
| Shoelace SSR | 完整打入 | 完全排除 | Shoelace 标记为 client-only |
| Lit 适配器 | 总是尝试安装 | 检测后安装 | 动态 import + 特征检测 |
| SSR Bundle 预估 | 1.53 MB | ~0.9 MB | 以上措施综合 |

**实施代码变更**:
```typescript
// build-ssg.ts: 修改 noExternal 列表
const defaultNoExternal = [
  /^@lessjs\//,  // 保留
  'alien-signals', // 保留
  // 移除: /^lit/, /^@lit/, /^@lit-labs\// (Lit 按需)
  // 移除: 'react', 'react-dom' (React 按需)
];
// 条件添加:
if (hasAdapterConfig('react')) {
  allNoExternal.push('react', 'react-dom', 'react/jsx-runtime');
}
if (hasAdapterConfig('lit')) {
  allNoExternal.push(/^lit/, /^@lit/, /^@lit-labs\//);
}
```

### 方案 2: 客户端 Island 按需加载优化 [预估收益: 首屏 JS -30%]

1. Shoelace 组件按需拆分：每个 Shoelace 组件独立 chunk
2. FlexSearch 使用 `visible` 策略（仅在搜索框可见时加载）
3. 生成页面级 Island 入口：每个页面只加载它使用的 Island

### 方案 3: DSD Polyfill 外部化 [预估收益: 每个 HTML -2.5 KB]

将内联的 DSD polyfill + 主题 CSS 提取为外部文件:
```html
<!-- 当前: 每页内联 2.5 KB -->
<!-- 优化: -->
<link rel="stylesheet" href="/client/dsd-polyfill.css">
<script type="module" src="/client/dsd-polyfill.js"></script>
```

### 方案 4: 路由扫描缓存 [预估收益: 构建启动 -50%]

1. 扫描结果序列化到 `.less/routes-cache.json`
2. 增量更新：仅在文件变更时重新扫描受影响的目录
3. HMR 时跳过路由扫描（除非路由文件变更）

### 方案 5: 渲染缓存 [预估收益: SSG 批量渲染 -20%]

1. 对 `renderDsd()` 结果添加可选缓存（tag + props hash → HTML）
2. 在 SSG 批量渲染时启用（多页面共享相同组件时）
3. 渲染缓存不跨请求（SSR 模式不启用）

---

## 四、产物体积精简方案

### 4.1 客户端 JS 体积优化目标

| 类别 | 当前 | 目标 | 措施 |
|------|------|------|------|
| Shoelace+Lit 共享 chunk | 178 KB | 80 KB | 按组件拆分 |
| @lessjs/ui 核心 | 172 KB | 100 KB | 按组件拆分、移除冗余 |
| FlexSearch | 49 KB | 49 KB | 已 min，使用 visible 策略 |
| 其余 Islands | ~255 KB | ~255 KB | 已经按需 |
| **客户端总计** | **~654 KB** | **~484 KB** | |

### 4.2 冗余依赖清理建议

1. **Shoelace 全量引入**: `vite.config.ts` 中 `packageIslands: ['@shoelace-style/shoelace']` 导致所有 Shoelace 组件被打包。应改为按需导入
2. **React 运行时**: 即使不使用 React Island，React 运行时仍被打包。应条件化引入
3. **media-chrome**: 仅在特定页面使用，不应作为全局依赖

### 4.3 HTML 页面体积优化

1. **内联 DSD Polyfill CSS**: 包含大量 CSS 变量定义，应提取为外部文件
2. **`data-ssr-props` 重复序列化**: Object props 同时出现在 HTML 属性和 `data-ssr-props` 中，增加了页面体积
3. **Speculation Rules**: 对于静态站点是合理的，但 `prefetch: ["/*"]` 模式可能导致过度预取

---

## 五、大页面/多组件场景性能风险预判

### 风险 1: 嵌套 DSD 渲染深度 [P1]

- **场景**: 页面含 3+ 层嵌套 Custom Element（如 `less-layout` > `less-card` > `less-button`）
- **风险**: `renderDsdTree()` 递归深度增加，每层嵌套都创建新实例 + 调用 `render()` + 序列化
- **当前防护**: 无最大深度限制
- **建议**: 添加 `maxNestingDepth` 参数（默认 10），超过时输出 bare-tag 降级

### 风险 2: 大型 `data-ssr-props` 导致 HTML 臃肿 [P1]

- **场景**: `less-layout` 接收 `navItems`（导航树）等大型 props
- **风险**: `data-ssr-props` JSON 序列化后可达数十 KB，嵌入 HTML 中增加传输体积
- **建议**: 对大型 props（> 1KB JSON）改用 `<script type="application/json">` 内联或外部 JSON 文件引用

### 风险 3: Islands 批量升级导致首次交互延迟 [P2]

- **场景**: 页面含 10+ 个 `idle` 策略的 Island
- **风险**: 所有 `idle` Island 在 `requestIdleCallback` 中同时注册，可能阻塞主线程
- **建议**: 添加 Island 升级队列，限制并发注册数量（如每帧最多 2 个）

### 风险 4: ISR revalidate 路由缓存失效 [P2]

- **场景**: ISR 路由在 revalidate 间隔后需要重新渲染
- **风险**: 无渲染缓存，每次 ISR 回源都完整执行 SSR 渲染
- **建议**: 在 ISR 渲染路径中启用短期渲染缓存（TTL = revalidate/2）

---

## 六、官方性能宣称验证

### 6.1 "dev:fast 冷启动" 

- **宣称**: 快速冷启动开发服务器
- **验证**: `dev:fast` 绕过了 Vite 插件体系，使用轻量级 `app/dev-server.ts`。但路由扫描仍然需要完整执行，对于 30+ 路由的项目，冷启动约 2-3 秒（受 IO 速度影响）
- **结论**: 比 `deno task dev`（完整 Vite）快约 40-50%，但仍有优化空间（路由缓存）

### 6.2 "单遍 DSD 渲染效率"

- **宣称**: ADR-0071 单遍 VNode 遍历即可完成 DSD 渲染
- **验证**: `renderDsdTree()` 确实在单次递归遍历中完成所有嵌套 CE 的渲染，无需后处理。这比旧版的两遍方案（先序列化再查找 CE）效率高
- **结论**: 设计合理，单遍遍历确实避免了重复扫描。但 `customElements.get()` 的每节点调用仍有优化空间

### 6.3 "零运行时静态页面"

- **宣称**: 不使用 Island 的静态页面零 JS 运行时
- **验证**: 静态页面仍加载 DSD polyfill（2.5 KB 内联 JS）和主题初始化脚本（`theme-init.js`，1.3 KB）。这些是必要的，但技术上不是"零 JS"
- **结论**: 对于支持原生 DSD 的浏览器，polyfill 是冗余的。应使用特性检测或外部文件

---

## 七、总结

### 关键发现

1. **SSR Bundle 1.53 MB 是最严重的性能问题** — 包含了不必要的 React/Lit/Shoelace 运行时
2. **客户端 JS 总计 654 KB**，其中 Shoelace+Lit 共享 chunk 占 178 KB，应拆分
3. **构建流程三次 Vite 启动**，可通过缓存和共享配置优化
4. **DSD Polyfill 内联在每个 HTML**，浪费 2.5 KB/页面且不可缓存
5. **路由扫描无缓存**，每次构建/HMR 都全量扫描

### 优化优先级

| 优先级 | 优化项 | 预估收益 | 实施难度 |
|--------|--------|---------|---------|
| P0 | SSR Bundle 瘦身 | SSR 体积 -40% | 中 |
| P1 | Shoelace/Lit 按需拆分 | 首屏 JS -30% | 中 |
| P1 | 路由扫描缓存 | 构建启动 -50% | 低 |
| P1 | React 运行时条件化 | SSR 体积 -15% | 低 |
| P2 | DSD Polyfill 外部化 | HTML -2.5KB/页 | 低 |
| P2 | FlexSearch visible 策略 | 非搜索页 -49KB | 低 |
| P2 | renderDsd 标签缓存 | SSG 渲染 -10% | 中 |

### 架构亮点

1. **单遍 DSD 渲染** (`renderDsdTree`) 设计合理，避免了重复扫描
2. **Island 策略系统** (load/idle/visible/only) 实现精细，可按场景选择
3. **alien-signals** 作为信号引擎选择正确，体积极小
4. **DSD 优先** 的架构确保静态内容零 JS 开销（除 polyfill）
5. **Speculation Rules** 集成是前瞻性优化，为 SSG 站点提供即时导航体验
