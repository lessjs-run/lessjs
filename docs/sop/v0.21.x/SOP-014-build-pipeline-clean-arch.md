# SOP-014: v0.21.x 构建管线标准作业程序（Clean Architecture）

> **版本**: 1.0
> **日期**: 2026-05-25
> **适用范围**: LessJS v0.21.x → v0.22.0
> **关联 ADR**: ADR-0042, ADR-0043, ADR-0044, ADR-0045
> **前置知识**: [SOP-008 SSG Product Stack Hardening](./SOP-008-ssg-product-hardening.md), [SOP-011 JSR Consumer ESM Graph](./SOP-011-jsr-consumer-esm-graph.md)

---

## 目录

1. [概述](#1-概述)
2. [Phase 1: Client Build 流程](#2-phase-1-client-build-流程)
3. [Phase 2: Client Island Build 流程](#3-phase-2-client-island-build-流程)
4. [Phase 3: SSG Render 流程 (Clean Architecture)](#4-phase-3-ssg-render-流程-clean-architecture)
5. [Import Map 维护规范](#5-import-map-维护规范)
6. [Consumers 模板更新规范](#6-consumers-模板更新规范)
7. [常见问题排查指南](#7-常见问题排查指南)
8. [验证清单](#8-验证清单)

---

## 1. 概述

### 1.1 构建管线全景

```
deno task build
│
├── Phase 1: Client Build (viteBuild)
│   ├── Route scanning
│   ├── Island discovery
│   ├── Virtual entry generation
│   └── Hono entry code
│
├── Phase 2: Client Island Build
│   ├── Island code transpilation
│   ├── Chunk splitting
│   └── Client bundle output (dist/assets/)
│
└── Phase 3: SSG Render (Clean Architecture) ★ 本次重构重点
    ├── SSR polyfill banner 注入
    ├── viteBuild({ssr:true, external+noExternal})
    │   ├── noExternal: @openelement/* + lit + @lit/*
    │   └── external: parse5, entities, hono, ...
    ├── Deno import() 解析 external 依赖
    ├── ssgRender() 渲染所有页面
    └── Post-processing (islands, view-transition, PWA)
```

### 1.2 核心变更（vs 旧架构）

| 维度                     | 旧架构                             | 新架构 (Clean)                 |
| ------------------------ | ---------------------------------- | ------------------------------ |
| 分辨率来源               | Rolldown（打包工具）               | Deno import map（运行时）      |
| SSR bundle 策略          | `noExternal: ALL`                  | `external` + `noExternal` 两层 |
| Polyfill 方式            | 分散（entry code + output banner） | 统一 `ssr-polyfills.ts` 模块   |
| `parse5`/`entities` 处理 | Rolldown 打包 → 子路径 bug         | Deno `import()` → 正确解析     |
| importmap.json           | 包含所有依赖版本                   | 仅包含 external 依赖           |

---

## 2. Phase 1: Client Build 流程

### 2.1 入口

```bash
deno task build
# → deno run --config deno.json -A packages/adapter-vite/src/cli/build.ts
```

`build.ts` 调用 `viteBuild()`，触发 Vite 配置中的 `lessjs()` 插件。

### 2.2 less:build 插件 — buildStart()

```
buildStart()
├── scanRoutes(routesDir)        → routes: RouteEntry[]
├── scanIslands(islandsDir)      → islandFiles, islandTagNames
├── scanIslandMeta(islandsDir)   → islandMeta
├── getPackageManifests()        → packageManifests
└── generateHonoEntryCode()      → honoEntryCode
```

所有数据写入 `ctx.phase1`。

### 2.3 关键配置

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    deno(),           // Deno import map → Vite resolve
    lessjs({...}),    // LessJS build pipeline
  ],
});
```

**不变**：Phase 1 和 Phase 2 不受 Clean Architecture 重构影响。

---

## 3. Phase 2: Client Island Build 流程

### 3.1 流程

```
closeBundle() → buildClient(ctx.phase1)
├── 收集 island 文件
├── 生成 client island entry
├── Import map resolution (deno.json) ← ADR-0046 新增
├── viteBuild({ssr:false}) → dist/assets/
└── chunk splitting (shared deps)
```

### 3.2 Import Map Resolution（ADR-0046）

Phase 2 现在通过 deno.json import map 解析裸标识符（bare specifier），与 Phase 1
和 Phase 3 统一。

**解析机制**：

- 插件 `less:deno-import-map-resolve` 读取消费者的 `deno.json`，解析 `imports` 字段
- 对 `npm:` / `jsr:` 开头的目标，回退到默认 node_modules 解析
- 对相对路径 / 文件路径目标，通过 Rolldown 的 `this.resolve()` 递归解析
- 支持 prefix/subpath matching（如 `@openelement/ui/` → `jsr:@openelement/ui@^0.21/`）

**配置示例**：

```ts
// packages/adapter-vite/src/cli/build-client.ts — Phase 2 构建配置
const clientConfig: InlineConfig = {
  configFile: false,
  root,
  // ...
  resolve: {
    alias: serializedAlias || [],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'], // ADR-0046
  },
  plugins: [
    {/* less:virtual-client-entry */},
    {
      name: 'less:deno-import-map-resolve', // ADR-0046
      enforce: 'pre',
      async resolveId(id, importer) {
        // 读取 deno.json → 解析 import map → this.resolve()
      },
    },
  ],
};
```

**消费者 deno.json 示例**：

```jsonc
{
  "imports": {
    "@openelement/ui": "jsr:@openelement/ui@^0.21",
    "@openelement/ui/": "jsr:@openelement/ui@^0.21/", // ★ subpath mapping
    "@openelement/core": "jsr:@openelement/core@^0.21",
    "lit": "npm:lit@^3.2.0"
    // ...
  }
}
```

**与 Phase 1 / Phase 3 的一致性**：

| Phase   | Resolution                                                       | 解析来源                 |
| ------- | ---------------------------------------------------------------- | ------------------------ |
| Phase 1 | import map (@deno/vite-plugin)                                   | deno.json + Vite plugin  |
| Phase 2 | import map (less:deno-import-map-resolve)                        | deno.json 直接读取       |
| Phase 3 | import map (Deno ESM Runtime + @openelement/ssg-package-resolve) | deno.json + Deno Runtime |

---

## 4. Phase 3: SSG Render 流程 (Clean Architecture)

### 4.1 完整流程

```typescript
// packages/adapter-vite/src/cli/build-ssg.ts

async function buildSSG(options, ctx) {
  // Step 1: 扫描路由和 islands
  const routes = await scanRoutes(routesDir);
  const islandFiles = await scanIslands(islandsRoot);
  const islandMeta = await scanIslandMeta(islandsRoot, islandFiles);

  // Step 2: 生成 SSR polyfill banner（ADR-0044）
  const polyfillBanner = generateSsrPolyfillBanner();
  // CSSStyleSheet → HTMLElement → customElements

  // Step 3: 生成 Hono entry code（含 polyfill banner）
  const ssgEntryCode = polyfillBanner + '\n' + generateHonoEntryCode(routes, {...});

  // Step 4: viteBuild SSR — 两层依赖策略（ADR-0043）
  await viteBuild({
    build: {
      ssr: true,
      outDir: ssrOutDir,
      rollupOptions: {
        input: { entry: VIRTUAL_SSG_ENTRY_ID },
        output: {
          format: 'esm',
          // ✅ 不再需要 output.banner（polyfill 已在 entry code 中）
        },
      },
    },
    ssr: {
      noExternal: [
        /^@openelement\//,     // LessJS 框架包
        /^lit/,            // lit, lit-html, lit-element
        /^@lit/,           // @lit/reactive-element
        /^@lit-labs\//,    // @lit-labs/ssr-dom-shim
      ],
      external: [
        'parse5',          // HTML parser（子路径导出）
        'entities',        // HTML entity codec（子路径导出）
        'hono',            // HTTP framework
        'hono/*',          // Hono subpath exports
        'node-fetch',      // Deno has native fetch
        'fetch-blob',
        'data-uri-to-buffer',
        'formdata-polyfill',
        'domexception',
        'node-domexception',
      ],
    },
    plugins: [
      // Virtual SSG entry module
      virtualSsgEntryPlugin(ssgEntryCode),
      // Optional package stubs（不变）
      optionalPackageStubsPlugin(),
      // JSR package resolver（不变）
      createLessJsrPackageResolverPlugin({...}),
      // Client-only island stubs（不变）
      clientOnlyIslandStubsPlugin(),
      // Virtual nav/data modules（不变）
      virtualNavPlugin(),
      ssgDataDispatchPlugin(),
    ],
  });

  // Step 5: 生成 importmap.json sidecar（仅 external 依赖）
  writeImportMap(ssrOutDir, {
    'hono': 'npm:hono@^4.12.18',
    'parse5': 'npm:parse5@7.0.0',
    'entities': 'npm:entities@^4',
    'entities/': 'npm:entities@^4/',
  });

  // Step 6: Deno import() 加载 SSR bundle
  // Deno 通过 import map 解析所有 external import
  const module = await import(ssrBundleUrl);

  // Step 7: SSG 渲染
  await ssgRender(module, options, ctx);

  // Step 8: ISR manifest（不变）
  writeIsrManifest(module);
}
```

### 4.2 依赖划分决策树

```
新增了一个依赖，应该放在 noExternal 还是 external？

1. 是否是 @openelement/* 包？
   → YES: noExternal（需要 TypeScript 编译）
   → NO: 继续

2. 是否是 lit / @lit/* 包？
   → YES: noExternal（需要 decorator 编译）
   → NO: 继续

3. 是否被 SSG entry code 直接或间接 import？
   → YES: 继续
   → NO: 不需要配置（不会出现在 SSR bundle 中）

4. 该 npm 包是否有子路径导出 (exports field with "./*": ...) 且被其依赖引用？
   → YES: external（Rolldown 无法正确解析）
   → NO: 继续

5. Deno 是否有该 API 的原生替代？
   → YES: external（避免冗余打包）
   → NO: external（默认策略，减少 Rolldown 负担）
```

### 4.3 Polyfill Banner 结构

```typescript
// packages/adapter-vite/src/ssr-polyfills.ts

export function generateSsrPolyfillBanner(): string {
  const parts: string[] = [];

  // Layer 1: CSSStyleSheet
  parts.push([
    `import { StyleSheet } from '@openelement/core';`,
    `if (typeof globalThis.CSSStyleSheet === 'undefined') {`,
    `  globalThis.CSSStyleSheet = class {`,
    `    replaceSync(_css: string) {}`,
    `    get cssRules() { return []; }`,
    `  };`,
    `}`,
  ].join('\n'));

  // Layer 2: HTMLElement (from @lit-labs/ssr-dom-shim)
  parts.push([
    `import { HTMLElement as _SsrHTMLElement } from '@lit-labs/ssr-dom-shim';`,
    `if (!globalThis.HTMLElement) {`,
    `  globalThis.HTMLElement = _SsrHTMLElement;`,
    `}`,
  ].join('\n'));

  // Layer 3: customElements
  parts.push([
    `if (typeof globalThis.customElements === 'undefined') {`,
    `  const _registry = new Map();`,
    `  globalThis.customElements = {`,
    `    define(name, ctor) { _registry.set(name, ctor); },`,
    `    get(name) { return _registry.get(name); },`,
    `    whenDefined(_name) { return Promise.resolve(); },`,
    `    upgrade(_root) {},`,
    `  };`,
    `}`,
  ].join('\n'));

  return parts.join('\n\n');
}
```

---

## 5. Import Map 维护规范

### 5.1 原则

1. **`deno.json` `"imports"` 是唯一分辨率来源**（ADR-0042）
2. **所有 npm 依赖使用 `npm:` 前缀**，不用 bare specifier
3. **有子路径导出的包加 subpath mapping**：`"entities/": "npm:entities@^4/"`
4. **版本号使用 semver range**：`^4` 而非精确版本（允许补丁更新）

### 5.2 Import Map 模板

```jsonc
{
  "imports": {
    // === LessJS 框架包（jsr: scheme） ===
    "@openelement/core": "jsr:@openelement/core@^0.21",
    "@openelement/core/navigation": "jsr:@openelement/core@^0.21/navigation",
    "@openelement/core/logger": "jsr:@openelement/core@^0.21/logger",
    "@openelement/core/errors": "jsr:@openelement/core@^0.21/errors",
    "@openelement/signals": "jsr:@openelement/signals@^0.21",
    "@openelement/signals/framework": "jsr:@openelement/signals@^0.21/framework",
    "@openelement/ui": "jsr:@openelement/ui@^0.21",
    "@openelement/ui/": "jsr:@openelement/ui@^0.21/", // ★ subpath mapping
    "@openelement/adapter-lit": "jsr:@openelement/adapter-lit@^0.21",
    "@openelement/adapter-vite": "jsr:@openelement/adapter-vite@^0.21",
    "@openelement/app": "jsr:@openelement/app@^0.21",
    "@openelement/content": "jsr:@openelement/content@^0.21",
    "@openelement/i18n": "jsr:@openelement/i18n@^0.21",

    // === Lit 生态（npm: scheme） ===
    "lit": "npm:lit@^3.2.0",
    "@lit/reactive-element": "npm:@lit/reactive-element@^2",
    "lit-html": "npm:lit-html@^3",
    "lit-element": "npm:lit-element@^4",
    "@lit-labs/ssr-dom-shim": "npm:@lit-labs/ssr-dom-shim@^1.5.0",

    // === SSR 传递依赖（npm: scheme） ===
    "hono": "npm:hono@^4.12.18",
    "parse5": "npm:parse5@7.0.0", // 锁定版本（避免 breaking）
    "entities": "npm:entities@^4",
    "entities/": "npm:entities@^4/", // ★ subpath mapping

    // === 开发工具（npm: scheme） ===
    "vite": "npm:vite@8.0.10",
    "@deno/vite-plugin": "npm:@deno/vite-plugin@2",
    "typescript": "npm:typescript@^5.9.0"
  },
  "vendor": true
}
```

### 5.3 新增依赖流程

1. 在 `deno.json` 的 `"imports"` 中添加新依赖
2. 判断是否需要 subpath mapping（检查包的 `exports` 字段是否有 `"./*"` ）
3. 如果需要，添加 `"pkg/": "npm:pkg@version/"` 条目
4. 运行 `deno task typecheck` 确保类型解析正确
5. 如该依赖在 SSR 阶段使用，同步更新 `build-ssg.ts` 的 `ssrExternal` 列表
6. 运行 `deno task build` 验证构建通过

### 5.4 同步检查

CI 中增加 import map 一致性检查：

```bash
# 检查 SSR external 列表与 import map 的一致性
deno run --allow-read tools/check-import-map-consistency.ts
```

---

## 6. Consumers 模板更新规范

### 6.1 模板位置

`packages/create/cli.ts` → `buildTemplates()` → `deno.json` 模板

### 6.2 消费者 deno.json 模板要求

与 workspace `deno.json` 保持一致的 SSR 依赖覆盖：

```typescript
function buildTemplates(v: Record<string, string>): Record<string, string> {
  return {
    'deno.json': JSON.stringify(
      {
        imports: {
          // LessJS 框架（jsr:，使用版本变量）
          '@openelement/app': `jsr:@openelement/app@^${v.app}`,
          '@openelement/core': `jsr:@openelement/core@^${v.core}`,
          '@openelement/core/navigation': `jsr:@openelement/core@^${v.core}/navigation`,
          '@openelement/signals': `jsr:@openelement/signals@^${v.signals}`,
          '@openelement/signals/framework': `jsr:@openelement/signals@^${v.signals}/framework`,
          '@openelement/ui': `jsr:@openelement/ui@^${v.ui}`,
          '@openelement/ui/': `jsr:@openelement/ui@^${v.ui}/`, // ★ subpath
          '@openelement/adapter-lit': `jsr:@openelement/adapter-lit@^${v.adapterLit}`,
          '@openelement/adapter-vite': `jsr:@openelement/adapter-vite@^${v.adapterVite}`,
          '@openelement/content': `jsr:@openelement/content@^${v.content}`,
          '@openelement/i18n': `jsr:@openelement/i18n@^${v.i18n}`,
          '@openelement/ui/open-props-tokens': `jsr:@openelement/ui@^${v.ui}/open-props-tokens`,

          // Lit 生态
          'lit': 'npm:lit@^3.2.0',
          '@lit/reactive-element': 'npm:@lit/reactive-element@^2',

          // SSR 传递依赖 ★ NEW
          'hono': 'npm:hono@^4.12.18',
          'parse5': 'npm:parse5@7.0.0',
          'entities': 'npm:entities@^4',
          'entities/': 'npm:entities@^4/', // ★ subpath

          // 开发工具
          'vite': 'npm:vite@8.0.10',
          '@deno/vite-plugin': 'npm:@deno/vite-plugin@2',
        },
        nodeModulesDir: 'auto',
        tasks: {/* ... */},
        compilerOptions: { lib: ['ES2022', 'DOM', 'DOM.Iterable'] },
      },
      null,
      2,
    ),
    // ...
  };
}
```

### 6.3 消费者模板更新检查清单

- [ ] `deno.json` import map 覆盖所有 SSR 传递依赖
- [ ] 包含 `entities/` subpath mapping
- [ ] 版本号使用 `^` semver range（非精确版本）
- [ ] `nodeModulesDir: "auto"`（消费者项目用 npm 风格）
- [ ] `vite.config.ts` 中 `ssr.noExternal` 配置与 import map 一致
- [ ] 运行 `deno task build` 在消费者项目中验证

---

## 7. 常见问题排查指南

### 7.1 `Error: Cannot find module 'entities/lib/escape.js'`

**症状**：SSG Phase 3 构建失败，Rolldown 报无法解析 `entities/lib/*`

**根因**：`entities` 在 `ssr.noExternal` 中，Rolldown 无法处理 npm 子路径导出

**解决**：

1. 确认 `entities` 在 `ssr.external` 中（不在 `ssr.noExternal` 中）
2. 确认 `deno.json` 有 `"entities/": "npm:entities@^4/"` subpath mapping
3. 重新运行 `deno task build`

### 7.2 `ReferenceError: customElements is not defined`

**症状**：SSR bundle import 时报 `customElements is not defined`

**根因**：SSR polyfill banner 未正确注入或顺序错误

**解决**：

1. 检查 `ssr-polyfills.ts` 是否正确生成 polyfill banner
2. 检查 polyfill banner 是否作为 SSG entry code 的第一部分
3. 确认 polyfill 顺序：CSSStyleSheet → HTMLElement → customElements
4. 如果使用第三方 WC 库在模块顶层调用 `customElements.define()`，确认没有 `typeof customElements === 'undefined'` 检查被绕过

### 7.3 `Error: Build failed: ... jsr:@openelement/* ...`

**症状**：消费者项目构建时 rollup 报 `jsr:` 前缀的模块无法解析

**根因**：JSR 特定 specifier 泄露到 Vite/Rolldown 模块图中

**解决**：

1. 检查 `@openelement/create` 生成的模板中 import map 是否用 `jsr:` scheme
2. 确认 `@deno/vite-plugin` 正确配置
3. 确认 `deno.json` 有正确的 `"imports"` 映射
4. 运行 `deno task typecheck` 验证类型解析

### 7.4 `Error: Cannot find module 'hono'`

**症状**：SSR bundle import 时 Deno 报无法找到 hono

**根因**：hono 在 `ssr.external` 中但 import map 未覆盖

**解决**：

1. 确认 `deno.json` 有 `"hono": "npm:hono@^4.12.18"`
2. 确认 `importmap.json` sidecar 包含 hono 条目
3. 运行 `deno vendor` 预缓存依赖

### 7.5 构建速度变慢

**症状**：首次 SSG build 比之前慢

**根因**：Deno `import()` 在首次运行时需要下载/缓存 external 依赖

**解决**：

1. 运行 `deno vendor` 预缓存所有依赖
2. 在 CI 中缓存 vendor 目录
3. 使用 `deno.json` 的 `"vendor": true` 配置

### 7.6 Import map 与 importmap.json 不一致

**症状**：SSR bundle 中某个 external import 解析失败

**根因**：`deno.json` 和 `importmap.json` 的依赖映射不一致

**解决**：

1. 运行一致性检查脚本：`deno run tools/check-import-map-consistency.ts`
2. 手动对比两份文件中的 SSR 依赖条目
3. 更新不一致的条目
4. 考虑在 CI 中自动化此检查

---

## 8. 验证清单

### 8.1 开发环境验证

```bash
# 1. 类型检查
deno task typecheck

# 2. Lint 检查
deno task lint

# 3. 格式化检查
deno task fmt:check

# 4. 单元测试
deno task test

# 5. 构建验证
deno task build

# 6. 构建产物检查
ls www/dist/
# 预期输出：index.html, assets/, server/, importmap.json, isr-manifest.json

# 7. DSD 报告检查
deno task dsd:check-report

# 8. Hub 验证
deno task hub:validate --strict --json
```

### 8.2 消费者项目验证

```bash
# 1. 从 JSR 创建新项目
deno run -A jsr:@openelement/create test-app

# 2. 检查生成的 deno.json
cat test-app/deno.json | grep -E "entities|parse5|hono"
# 预期：包含 entities, entities/, parse5, hono

# 3. 安装依赖并构建
cd test-app
deno install
deno task build

# 4. 验证构建产物
ls dist/
# 预期：index.html, assets/, server/
```

### 8.3 CI 验证（建议添加到 CI pipeline）

```yaml
# .github/workflows/ssg-clean-arch-check.yml
steps:
  - name: Import map consistency check
    run: deno run --allow-read tools/check-import-map-consistency.ts

  - name: Consumer template smoke test
    run: deno run --allow-read --allow-write --allow-net --allow-env --allow-run tools/consumer-smoke-test.ts

  - name: SSG build verification
    run: deno task build && test -f www/dist/index.html
```

---

## 附录 A：文件变更清单

| 文件                                         | 操作     | 说明                                           |
| -------------------------------------------- | -------- | ---------------------------------------------- |
| `deno.json`                                  | MODIFY   | 补全 SSR deps import map + `entities/` subpath |
| `packages/adapter-vite/src/ssr-polyfills.ts` | **NEW**  | 统一 SSR polyfill 模块                         |
| `packages/adapter-vite/src/cli/build-ssg.ts` | REFACTOR | external+noExternal 两层策略                   |
| `packages/adapter-vite/src/build-context.ts` | MODIFY   | 添加 `ssrExternal` 字段                        |
| `packages/create/cli.ts`                     | MODIFY   | 消费者模板 import map 更新                     |
| `packages/create/__tests__/cli.test.ts`      | MODIFY   | 测试更新                                       |

## 附录 B：相关文档索引

| 文档                                      | 路径                                                 |
| ----------------------------------------- | ---------------------------------------------------- |
| ADR-0042: Import Map Universal Resolution | `docs/adr/0042-import-map-universal-resolution.md`   |
| ADR-0043: SSG Phase 3 Dependency Strategy | `docs/adr/0043-ssg-phase3-dependency-strategy.md`    |
| ADR-0044: SSR Browser API Polyfill        | `docs/adr/0044-ssr-browser-api-polyfill.md`          |
| ADR-0045: Native API First-Class          | `docs/adr/0045-native-api-first-class.md`            |
| System Design                             | `deliverables/system_design.md`                      |
| SOP-008: SSG Product Stack Hardening      | `docs/sop/v0.21.x/SOP-008-ssg-product-hardening.md`  |
| SOP-011: JSR Consumer ESM Graph           | `docs/sop/v0.21.x/SOP-011-jsr-consumer-esm-graph.md` |
