# SOP-012: Unified Render API Surface — One `renderDsd`, Clean Root Exports

> Version: v0.28.0
> Status: Ready for Implementation
> Date: 2026-05-31
> Depends on: ADR-0072 (Unified Render API Surface), ADR-0071 (Single-Pass Render)
> Related: SOP-011 (unified render pipeline)

---

## 一、目标

将 `@lessjs/core` 的公开 API 从 **3 个渲染函数 + 1 个 JSX 工厂** 精简为 **1 个渲染函数**。

```
当前 root exports              目标 root exports
──────────────────────         ──────────────────────
renderDsd                      renderDsd          ← 唯一渲染入口
renderDsdByName                renderToString     ← 保留（同步，无嵌套 CE）
renderNestedDsd                DsdElement         ← 保留
jsx, jsxDEV, jsxs              Fragment           ← 保留
For, Show                      Fragment           ← 保留
```

`renderDsdByName` 的功能合并进 `renderDsd('tag', props)`。

`renderNestedDsd` 改名为 `renderDsdTree`，不再导出。

`jsx`/`jsxDEV`/`jsxs`/`For`/`Show` 从根入口移除，保留在 `@lessjs/core/jsx-runtime` subpath。

---

## 二、实施

### Step 1: 扩展 `renderDsd` 接受 string 输入

**文件**: `packages/core/src/render-dsd.ts`

将 `renderDsd` 的第一个参数从 `tagName: string` 改为 `input: string | CustomElementConstructor`：

```typescript
export async function renderDsd(
  input: string | CustomElementConstructor,
  propsOrClass?: CustomElementConstructor | Record<string, unknown>,
  props?: Record<string, unknown>,
  sourceInfo?: { route?: string; source?: string },
  dsdOptions?: DsdOptions,
  collector?: DsdRenderCollector,
  nestingDepth?: number,
  hooks?: RenderHooks,
): Promise<RenderOutput> {
  let tagName: string;
  let componentClass: CustomElementConstructor;

  if (typeof input === 'string') {
    // Auto-lookup from registry (was renderDsdByName)
    tagName = input;
    const cls = globalThis.customElements?.get(tagName) as CustomElementConstructor;
    if (!cls) {
      log.warn(`<${tagName}> is not registered — rendering as void element`);
      const attrs = serializeAttributes((propsOrClass as Record<string, unknown>) ?? {});
      return {
        html: `<${tagName}${attrs}></${tagName}>`,
        errors: [],
        metrics: {
          tagName,
          renderTimeMs: 0,
          templateSize: 0,
          layer: 'dsd-static',
          hasError: false,
          nestingDepth: 0,
        },
        hydrationHints: [],
      };
    }
    componentClass = cls;
    // Second arg is props when first arg is string
    // But handle backward compat: if propsOrClass is a class, it's the old 3-arg signature
    if (propsOrClass && typeof propsOrClass === 'function' && propsOrClass.prototype) {
      // Old signature: renderDsd(tagName, class, props)
      componentClass = propsOrClass as CustomElementConstructor;
      // Third arg becomes the actual props
    } else {
      // New signature: renderDsd('tag', props)
      // propsOrClass is the props object
    }
  } else {
    // Direct class (was old renderDsd)
    componentClass = input;
    tagName = (input as unknown as { tagName?: string }).tagName ?? 'unknown';
  }

  // ... rest of renderDsd unchanged ...
}
```

**验收**: `deno task check` 通过。

### Step 2: 删除 `renderDsdByName` 函数体

**文件**: `packages/core/src/render-dsd.ts`

找到 `renderDsdByName` 函数定义（约第 368 行），删除整个函数体，改为一行调用：

```typescript
export async function renderDsdByName(...args) {
  // Forward to renderDsd with auto-lookup
  return renderDsd(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
}
```

或者干脆删除函数，让调用方直接调 `renderDsd('tag', props)`。

**先保留 thin wrapper**，等所有调用方迁移完毕后再删。

### Step 3: 重命名 `renderNestedDsd` → `renderDsdTree`

**文件**: `packages/core/src/jsx-render-string.ts`

```typescript
// 旧函数名：renderNestedDsd
// 新函数名：renderDsdTree
export async function renderDsdTree(
  node,
  eventContext = createEventMarkerContext(),
): Promise<string> {
  // body unchanged
}
```

保留旧导出 `renderNestedDsd` 为 alias（向后兼容），标记 `@deprecated`。

**更新内部引用**:

**文件**: `packages/core/src/render-dsd.ts`

```typescript
// 旧：
import { renderNestedDsd } from './jsx-render-string.js';
// 新：
import { renderDsdTree } from './jsx-render-string.js';

// 调用处也要改
content = await renderDsdTree(result);
```

### Step 4: 清理 `index.ts` 根导出

**文件**: `packages/core/src/index.ts`

删除以下导出：

```typescript
// 删除：
export { renderDsdByName } from './render-dsd.js'; // 已合并
export { renderNestedDsd } from './jsx-render-string.js'; // 已隐藏
export { For, jsx, jsxDEV, jsxs, Show } from './jsx-runtime.js'; // JSX 归位

// 保留：
export { renderDsd, renderDsdStream } from './render-dsd.js';
export { renderToString } from './jsx-render-string.js';
export { DsdElement } from './dsd-element.js';
export { Fragment } from './jsx-runtime.js';
```

**确保 `@lessjs/core/jsx-runtime` subpath 包含所有必要导出**:

```typescript
// packages/core/src/jsx-runtime.ts — 已存在，确认包含：
export { jsx, jsxDEV, jsxs }; // Deno jsxImportSource 需要
export { For, Fragment, Show }; // 控制流组件
```

**验收**: `deno task check` 通过。`grep "renderDsdByName\|renderNestedDsd\|import.*jsx.*from '@lessjs/core'"` 仅在 entry-renderer 生成代码和测试中有引用。

### Step 5: 更新 `entry-renderer.ts` 生成代码

**文件**: `packages/adapter-vite/src/entry-renderer.ts`

#### 5.1 更新 exports re-export（约第 621 行）

```typescript
// 旧：
'export { renderDsd, renderDsdByName, renderNestedDsd, jsx, wrapInDocument, registerAdapter, getAdapter } from "@lessjs/core"';

// 新：
'export { renderDsd, wrapInDocument, registerAdapter, getAdapter } from "@lessjs/core"';
'export { jsx } from "@lessjs/core/jsx-runtime"';
```

#### 5.2 更新 `__renderAppShell` 中的调用（约第 550 行）

`renderNestedDsd(jsx("less-layout", {...}))` → 直接 `renderDsd("less-layout", {...})`：

```typescript
// 旧：
lines.push('  return await renderNestedDsd(jsx("less-layout", {');
lines.push('    currentPath: routePath,');
// ...

// 新：
lines.push('  const layoutResult = await renderDsd("less-layout", {');
lines.push('    currentPath: routePath,');
// ...
lines.push('  });');
lines.push('  return layoutResult.html;');
```

#### 5.3 更新 SSR entry `import` 行（约第 354 行）

```typescript
// 旧：
lines.push(`import { wrapInDocument } from '@lessjs/core';`);

// 新（如果需要 jsx，单独 import）：
lines.push(`import { wrapInDocument } from '@lessjs/core';`);
lines.push(`import { jsx } from '@lessjs/core/jsx-runtime';`);
```

### Step 6: 更新 `entry-descriptor.ts`

**文件**: `packages/adapter-vite/src/entry-descriptor.ts`

约第 301 行，`names` 数组：

```typescript
// 旧：
names: ['renderDsd', 'renderNestedDsd', 'jsx', 'escapeHtml'],

// 新：
names: ['renderDsd', 'renderDsdTree', 'escapeHtml'],
```

### Step 7: 更新内部调用方

**文件**: `packages/core/src/render-dsd.ts`

```typescript
// 旧：
import { renderDsdByName } from ...

// renderDsdByName 调用全部改为 renderDsd('tag', props)
```

### Step 8: 更新 API 文档

**文件**: `www/app/routes/apilist.tsx`

- 删除 `renderDsdByName` 的文档条目
- 更新 `renderDsd` 的签名说明为 `renderDsd(input: string | CustomElementConstructor, props?)`

### Step 9: 更新测试

**文件**: `packages/core/__tests__/render-dsd.test.ts`

`import { renderDsd, renderDsdByName }` → `import { renderDsd }`，`renderDsdByName` 调用改为 `renderDsd('tag', props)`。

**文件**: `packages/core/__tests__/jsx-render-string.test.ts`

`import { renderNestedDsd }` → `import { renderDsdTree }`。

**文件**: `packages/adapter-vite/__tests__/entry-descriptor.test.ts`

`names` 数组更新。

**文件**: `packages/create/__tests__/cli.test.ts`

模板依赖数量预期调整（如果 parse5 相关的改动影响了计数）。

---

## 三、验证

### 3.1 门禁

```bash
deno task check     # 类型检查
deno task lint      # Lint
deno task fmt:check # 格式化
deno task test      # 全部测试
```

**通过标准**: 全部通过。

### 3.2 构建验证

```bash
deno task build
```

**通过标准**: 构建成功，页面数不低于基线。无 `[object Object]`、`[object Promise]`、`<dialog>`。

### 3.3 回归验证

```bash
for page in "zh/guide/getting-started/index.html" "index.html" "zh/registry/index.html"; do
  echo "=== $page ==="
  grep -c "less-layout" "www/dist/$page"
  grep -c "shadowrootmode" "www/dist/$page"
  grep -c "less-search" "www/dist/$page"
done
```

**通过标准**: 所有页面 layout/search/DSD 正常。

### 3.4 Registry 验证

```bash
grep -c "data-srcdoc" www/dist/en/registry/@lessjs~ui/less-card/index.html
# 预期: 1
```

### 3.5 API 导出验证

```bash
# 确认根入口不再导出旧函数
grep -c "renderDsdByName" packages/core/src/index.ts    # 预期: 0
grep -c "renderNestedDsd" packages/core/src/index.ts     # 预期: 0
grep -c "\bjsx\b" packages/core/src/index.ts             # 预期: 0（仅注释/type）
grep -c "\bFor\b" packages/core/src/index.ts             # 预期: 0（仅导入语句无导出）

# 确认 jsx-runtime subpath 仍有
grep "jsx\|For\|Show" packages/core/src/jsx-runtime.ts | grep "export" | wc -l  # 预期: >= 5
```

---

## 四、最终 Checklist

### 删除项

- [ ] `renderDsdByName` 函数体从 `render-dsd.ts` 删除
- [ ] `renderDsdByName` export 从 `index.ts` 删除
- [ ] `renderNestedDsd` export 从 `index.ts` 删除
- [ ] `jsx`, `jsxDEV`, `jsxs` export 从 `index.ts` 删除
- [ ] `For`, `Show` export 从 `index.ts` 删除
- [ ] `renderDsdByName` 从 `entry-renderer.ts` 生成 re-export 行删除
- [ ] `renderNestedDsd` 从 `entry-renderer.ts` 生成 re-export 行删除
- [ ] `jsx` 从 `entry-renderer.ts` 生成 re-export 行删除（改为 subpath）

### 新增项

- [ ] `renderDsd(input: string | class, props?)` 签名扩展
- [ ] `renderDsdTree` 内部函数名（原 `renderNestedDsd`）
- [ ] `renderDsd('tag', props)` 自动查 registry 逻辑
- [ ] `@lessjs/core/jsx-runtime` import 在 entry-renderer 生成代码
- [ ] `For`/`Show` 确认在 `jsx-runtime.ts` 导出

### 更新项

- [ ] `render-dsd.ts` 内部 `renderNestedDsd` → `renderDsdTree`
- [ ] `entry-renderer.ts` `__renderAppShell` 改用 `renderDsd()`
- [ ] `entry-descriptor.ts` `names` 数组
- [ ] 测试文件 import 路径
- [ ] `apilist.tsx` API 文档

### 验证项

- [ ] `deno task check` ❯ 通过
- [ ] `deno task lint` ❯ 通过
- [ ] `deno task fmt:check` ❯ 通过
- [ ] `deno task test` ❯ 全部通过
- [ ] `deno task build` ❯ 成功，页面数 ≥ 基线
- [ ] 回归：sidebar/search/theme 正常
- [ ] Registry iframe 正常
- [ ] API 导出验证通过
