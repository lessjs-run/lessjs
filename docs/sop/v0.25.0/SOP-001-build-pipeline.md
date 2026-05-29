# SOP-001: BuildPipeline 声明式 API

> Priority: P0 | Nature: 纯重构 | Time: 2d | Governing ADR: ADR-0058

## Objective

把 `build.ts → build-client.ts → build-ssg.ts` 三阶段硬编码包装为 `BuildPipeline` 类，
提供 `lessPipeline()` 单一配置入口。零逻辑变更，纯粹包装。

## Step-by-Step

### Step 1: 创建 BuildPipeline 类

**文件**: `packages/adapter-vite/src/build-pipeline.ts`

```typescript
export interface PipelineConfig {
  phases?: ('ssr-bundle' | 'client-chunks' | 'ssg')[];
  routes: { dir: string };
  i18n?: { locales: string[]; defaultLocale: string };
  output?: { cleanUrls?: boolean };
}

export class BuildPipeline {
  constructor(private config: PipelineConfig) {}
  async run(ctx: LessBuildContext): Promise<void> {
    const phases = this.config.phases ?? ['ssr-bundle', 'client-chunks', 'ssg'];
    for (const phase of phases) {
      switch (phase) {
        case 'ssr-bundle':
          await buildSSR(ctx, this.config);
          break;
        case 'client-chunks':
          await buildClient(ctx, this.config);
          break;
        case 'ssg':
          await buildSSG(ctx, this.config);
          break;
      }
    }
  }
}
```

**关键**: `buildSSR/buildClient/buildSSG` 接收 `PipelineConfig` 并透传 esbuild 配置，
从根本上解决 `configFile: false` 的 JSX 配置问题。

### Step 2: 导出 lessPipeline()

**文件**: `packages/adapter-vite/src/less-plugin.ts`

```typescript
export function lessPipeline(config: PipelineConfig): Plugin {
  // 内部调用 BuildPipeline，保持现有 less() 兼容
  return lessPlugin({ pipeline: 'declarative', ...config });
}
```

### Step 3: 保持 less() 兼容

现有 `less()` 函数不变，内部转为调用 `BuildPipeline`。标记 `@deprecated`。

### Step 4: 验证

- [ ] `lessPipeline({ routes: { dir: 'app/routes' } })` 可替代 `less({ ... })`
- [ ] `deno task build` 前后产物 bitwise 一致
- [ ] `configFile: false` 不再影响 JSX 配置
- [ ] 现有项目零修改正常工作

### Step 5: 清理

- 删除 `build.ts` 中的三阶段串行逻辑（保留各阶段函数本身）
- 更新 `less-plugin.ts` 注释
