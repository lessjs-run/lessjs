# SOP-002: Route Type Code Generation

> Priority: P0 | Nature: 纯生成 | Time: 1d | Governing ADR: ADR-0059

## Objective

构建时扫描 `[param]` 路由模式，生成 `.less/routes.d.ts` 类型文件。

## Step-by-Step

### Step 1: 增强 RouteEntry

**文件**: `packages/adapter-vite/src/route-scanner.ts`

```typescript
export interface RouteEntry {
  path: string; // '/blog/[slug]'
  params: string[]; // ['slug']
  file: string;
  tagName: string;
  meta?: Record<string, unknown>;
}
```

在 `scanRoutes()` 返回前，对每个路由用正则 `/\[(\w+)\]/g` 提取 param 名称。

### Step 2: 创建类型生成器

**文件**: `packages/adapter-vite/src/route-type-generator.ts`

```typescript
export function generateRouteTypes(routes: RouteEntry[]): string {
  const declarations = routes
    .filter((r) => r.params.length > 0)
    .map((r) => {
      const fields = r.params.map((p) => `${p}: string`).join('; ');
      return `  '${r.path}': { ${fields} };`;
    })
    .join('\n');

  return [
    "declare module 'virtual:less-routes' {",
    '  interface RouteParams {',
    declarations,
    '  }',
    '}',
  ].join('\n');
}
```

### Step 3: 写入文件

在 SSG Phase 1 完成后调用生成器，写入 `.less/routes.d.ts`。

```typescript
// build-ssg.ts 中
const routes = await scanRoutes(config.routes.dir);
const dts = generateRouteTypes(routes);
await Deno.writeTextFile('.less/routes.d.ts', dts);
```

### Step 4: 用户侧使用

```typescript
import type { RouteParams } from 'virtual:less-routes';
const params: RouteParams['/blog/[slug]'] = { slug: 'hello' }; // ✅ type-checked
```

### Step 5: 验证

- [ ] `.less/routes.d.ts` 在 build 后生成
- [ ] `[param]` 路由有对应类型
- [ ] `deno task typecheck` 通过
- [ ] `.less/` 目录加入 `.gitignore`
