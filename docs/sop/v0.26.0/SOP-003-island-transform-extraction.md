# SOP-003: Island Transform 提取 — 核心逻辑脱离 Vite

> **Priority**: P1 | **预估**: 3.5h | **依赖**: SOP-001 | **ADR**: ADR-0061

## Objective

将 `island-transform.ts` 的核心逻辑提取为纯函数 `transformIslandSource()`，放在 `@openelement/core` 中。Vite 插件退化为薄的适配层。

## Background

当前 `island-transform.ts` 是纯 Vite Plugin：

- `transform(code, id)` 钩子 — 只能通过 Vite 调用
- 如果未来换构建工具，island 标注逻辑需要重写

提取后：核心逻辑在任何环境可复用，Vite 插件只做参数适配。

## Step 1: 创建 island-transform-core.ts (1h)

**文件**: `packages/core/src/island-transform.ts`（新建）

```typescript
export interface IslandTransformOptions {
  islandsDir: string;
  filePath: string;
}

export interface IslandTransformResult {
  code: string;
  islands: Array<{ tagName: string; filePath: string }>;
  map?: string;
}

/**
 * Pure function: inject island metadata markers into source code.
 * Zero Vite dependency. Usable in any build tool.
 */
export function transformIslandSource(
  source: string,
  options: IslandTransformOptions,
): IslandTransformResult {
  const { islandsDir, filePath } = options;
  const normalizedPath = filePath.replace(/\/g, '/');
  
  if (!normalizedPath.includes(`/${islandsDir}/`)) {
    return { code: source, islands: [] };
  }

  const parts = normalizedPath.split('/');
  const fileName = parts[parts.length - 1];
  const tagName = fileToTagName(fileName);

  if (!tagName.includes('-')) {
    return { code: source, islands: [] };
  }

  if (!/^[a-z0-9-]+$/.test(tagName)) {
    throw new Error(`Unsafe tag name: ${tagName}`);
  }

  const markers = `
// --- LessJS Island Markers ---
/** @__island */ 
/** @__tagName ${tagName} */
`;

  return {
    code: source + markers,
    islands: [{ tagName, filePath }],
  };
}

function fileToTagName(fileName: string): string {
  return fileName.replace(/\.(ts|tsx|js|jsx)$/, '');
}
```

## Step 2: 重构 Vite 插件为薄包装 (1h)

**文件**: `@openelement/adapter-vite/src/island-transform.ts`

```diff
- import type { Plugin } from 'vite';
- import { fileToTagName } from './route-scanner.js';
+ import type { Plugin } from 'vite';
+ import { transformIslandSource } from '@openelement/core/island-transform';

export function islandTransformPlugin(islandsDir: string): Plugin {
  return {
    name: 'less:island-transform',
-   transform(code, id) {
-     // ~50 lines of tagName extraction + validation
+   transform(code, id) {
+     const result = transformIslandSource(code, { islandsDir, filePath: id });
+     if (result.islands.length === 0) return null;
+     return { code: result.code, map: result.map };
    },
  };
}
```

## Step 3: 编写单元测试 (1h)

**文件**: `packages/core/__tests__/island-transform.test.ts`

```typescript
import { transformIslandSource } from '../src/island-transform.js';
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert';

Deno.test('transformIslandSource: adds markers to island files', () => {
  const result = transformIslandSource(
    'export class MyWidget extends DsdElement {}',
    { islandsDir: 'app/islands', filePath: 'app/islands/my-widget.tsx' },
  );
  assertStringIncludes(result.code, '@__island');
  assertStringIncludes(result.code, '@__tagName my-widget');
  assertEquals(result.islands[0].tagName, 'my-widget');
});

Deno.test('transformIslandSource: skips non-island files', () => {
  const result = transformIslandSource(
    'export const x = 1;',
    { islandsDir: 'app/islands', filePath: 'app/routes/index.ts' },
  );
  assertEquals(result.islands.length, 0);
});
```

## Step 4: 回归验证 (0.5h)

```bash
deno test packages/core/__tests__/island-transform.test.ts
deno test packages/adapter-vite/__tests__/island-transform.test.ts
deno task build:docs
```

**验收**: 新旧测试全部通过，island 标注行为不变。
