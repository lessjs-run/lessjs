# LessJS v0.25.0 — Declarative Architecture & Type-Safe Routes

> **Status**: PLANNED\
> **Target version**: v0.25.0 (原 v0.24.4 → scope 合并为 minor)\
> **Release theme**: 将构建管线从脚本式转为声明式，引入类型安全路由参数\
> **Depends on**: v0.24.3 (consolidation complete, all gates green)\
> **See also**: `docs/conversation/20260629/v0.25.0-0.26.0-declarative-reactive-roadmap.md`

---

## Mission

v0.24.4 是架构风格升级版本，不新增功能。目标是把当前脚本式构建管线重构为声明式配置驱动，并为文件系统路由引入编译期类型安全。

```text
Before v0.24.4
  build.ts / build-client.ts / build-ssg.ts 三阶段硬编码调用
  路由参数是运行时 string → string 的 Map
  无类型推导，拼写错误只在运行时暴露

After v0.24.4
  声明式 BuildPipeline API：phases + routes + i18n + output 配置
  路由参数类型在构建时生成，IDE 自动补全
  /registry/[package]/[component] → params.package (string), params.component (string)
```

## Strategic Boundary

| Included                      | Excluded                 |
| ----------------------------- | ------------------------ |
| BuildPipeline 声明式 API 设计 | 三阶段内部实现的逻辑改动 |
| 路由类型代码生成              | 运行时路由匹配逻辑改动   |
| 路由参数类型推导              | 通用 i18n 路由类型       |
| TypeScript 类型文件生成       | 运行时参数校验/转换      |

## Task Groups

| Group | Priority | Name                          | Outcome                                           |
| ----- | -------- | ----------------------------- | ------------------------------------------------- |
| TG-01 | P0       | Declarative BuildPipeline API | `new LessBuildPipeline({...})` 替代三阶段硬编码   |
| TG-02 | P0       | Route Type Code Generation    | 构建时生成 `less-routes.d.ts`，含完整路由参数类型 |
| TG-03 | P1       | Route Scanner Enhancement     | scanner 输出适配类型生成所需数据                  |
| TG-04 | P1       | Entry Renderer Adaptation     | entry-renderer 适配声明式配置                     |
| TG-05 | P1       | Docs & Migration Guide        | 文档更新，声明式配置迁移指南                      |
| TG-06 | P2       | Full Regression Gates         | 全量 gate 通过，零功能回归                        |

---

## TG-01: Declarative BuildPipeline API

### Problem

当前构建流程是三个独立脚本的硬编码串联：

```typescript
// build.ts — Phase 1
await viteBuild({ ... })  // 硬编码参数

// build-client.ts — Phase 2
await viteBuild({ ... })  // 硬编码参数

// build-ssg.ts — Phase 3
for (const route of scanRoutes()) {
  const html = await renderRoute(route);
  await writeFile(route.outputPath, html);
}
```

- 配置分散在多个文件和 deno.json task 中
- 三阶段之间的 ctx 传递是隐式的（LessBuildContext class）
- 新增一阶段（如 Phase 4: 图片优化）需要改多处

### Proposed API

```typescript
// 用户侧：vite.config.ts
import { lessPipeline } from '@lessjs/adapter-vite';

export default defineConfig({
  plugins: [
    lessPipeline({
      phases: ['ssr-bundle', 'client-chunks', 'ssg'],

      routes: {
        dir: 'app/routes',
        pattern: '**/*.{ts,tsx}',
        exclude: ['**/_*.ts'], // _renderer, _hub-data 等
      },

      i18n: {
        locales: ['en', 'zh'],
        defaultLocale: 'en',
      },

      output: {
        cleanUrls: true,
        dsd: true,
        sitemap: true,
      },

      islands: {
        dir: 'app/islands',
        strategies: ['load', 'idle', 'visible', 'only'],
      },

      content: {
        blog: { contentDir: 'content/blog' },
        nav: { routesDir: 'app/routes' },
      },
    }),
  ],
});
```

### Internal Design

```typescript
// 框架侧：声明式 Phase 接口
interface BuildPhase {
  name: string;
  dependsOn: string[];     // 依赖的前序 phase
  run(ctx: BuildContext): Promise<BuildResult>;
}

// 内置 phases
const SSR_BUNDLE_PHASE: BuildPhase = { name: 'ssr-bundle', dependsOn: [], run: ... };
const CLIENT_CHUNKS_PHASE: BuildPhase = { name: 'client-chunks', dependsOn: ['ssr-bundle'], run: ... };
const SSG_PHASE: BuildPhase = { name: 'ssg', dependsOn: ['ssr-bundle', 'client-chunks'], run: ... };

// Pipeline 编排
class BuildPipeline {
  constructor(config: PipelineConfig) { }
  async run(): Promise<PipelineResult> { }
}
```

### Acceptance

- [ ] `lessPipeline({...})` 替代 `less()` Vite plugin 的三阶段硬编码
- [ ] 现有三阶段行为完全保留
- [ ] 新增 Phase 只需实现 `BuildPhase` 接口并加入 `phases` 数组
- [ ] 构建日志输出阶段名称和耗时

---

## TG-02: Route Type Code Generation

### Problem

```typescript
// 当前：运行时解析，零编译期安全
const params = this._getRouteParams();
// params 类型是 Record<string, string> — 不知道有哪些字段
console.log(params.pakcage); // 拼写错误，运行时才发现
```

### Proposed Solution

构建时扫描路由文件系统，生成类型声明文件：

```typescript
// 构建时生成：.less/routes.d.ts
declare module 'virtual:less-routes' {
  interface RouteParams {
    '/': Record<string, never>;
    '/guide/getting-started': Record<string, never>;
    '/blog/[slug]': { slug: string };
    '/registry/[package]': { package: string };
    '/registry/[package]/[component]': { package: string; component: string };
  }
}

// 用户侧使用
import type { RouteParams } from 'virtual:less-routes';

class MyPage extends DsdElement {
  override render() {
    const params = this._getRouteParams() as RouteParams['/blog/[slug]'];
    // params.slug  ← IDE 自动补全，类型 string
    // params.slug 拼写错误 ← 编译时报错
  }
}
```

### Implementation Plan

1. **route-scanner.ts** 增强：在扫描文件系统路由时，同时提取 `[param]` 模式
2. **类型生成器**：根据扫描结果生成 `less-routes.d.ts`
3. **virtual:less-routes** 虚拟模块：在 Vite 中注册，暴露类型
4. **DsdElement._getRouteParams()** 返回类型与 RouteParams 关联

### Acceptance

- [ ] `[param]` 路由有对应类型定义
- [ ] IDE 对 `params.xxx` 有自动补全
- [ ] 拼写错误在编译期暴露
- [ ] 不影响现有 DSD 渲染和路由匹配

---

## TG-03: Route Scanner Enhancement

### Purpose

当前 route-scanner 只扫描文件路径和 tagName。需增强以支持类型生成。

### Actions

1. 在 `RouteEntry` 中新增 `params: string[]` 字段（从 filename 提取 `[param]` 模式）
2. 输出 `RouteManifest` 供类型生成器消费
3. 保持现有 scanner 性能（O(n) 文件系统遍历）

### Acceptance

- [ ] `RouteEntry.params` 包含所有动态参数名
- [ ] 类型生成器可消费 RouteManifest

---

## TG-04: Entry Renderer Adaptation

### Purpose

entry-renderer.ts 需要适配新的声明式配置。

### Actions

1. 将硬编码的选项改为从 `PipelineConfig` 读
2. SSR entry 生成逻辑适配新的 phase 接口
3. 保持生成的 client entry 输出不变

### Acceptance

- [ ] entry-renderer 接受 `PipelineConfig` 参数
- [ ] 生成的 client entry 与之前完全一致（diff 验证）

---

## Entry Criteria

- [ ] v0.24.3 所有 SOP 完成，所有 gate 绿色
- [ ] ADR-0058 (TemplateResult removal) 已 IMPLEMENTED

## Execution Rules

1. **先设计 API，再实现**：PipelineConfig 接口设计必须先稳定
2. **保持向后兼容**：`less()` 函数仍可用，`lessPipeline()` 是新增方式
3. **类型生成是构建时**：不增加运行时开销
4. **不改变路由匹配逻辑**：只增加类型，不改运行时行为

## Non-Goals

- 不重写 Vite plugin 核心逻辑
- 不引入新的运行时依赖
- 不改变 DSD/SSG 渲染管线
- 不改变 deno.json task 结构
