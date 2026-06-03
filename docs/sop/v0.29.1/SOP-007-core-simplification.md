# SOP-007: v0.29.1 Core Simplification and Module Merge

> Version: v0.29.1
> Date: 2026-06-03
> Status: Planned
> ADR: [ADR-0078](../../adr/ADR-0078-core-simplification-and-merge.md)
> Output: core/src 33→26 files, unified attribute serialization,
>         async-only render path, deleted legacy APIs

## Summary

v0.29.1 执行激进的代码清理，不向后兼容。通过 5 个阶段的清理，让 core 包从 33 个文件减少到 26 个，净减 ~200-220 行代码，建立一套统一的属性序列化逻辑和一套 async-only 的渲染路径。`renderDsdTree` 成为唯一的公开渲染 API。

## Core Decision

5 条规则：

1. **不向后兼容**：0.x 阶段允许 breaking changes
2. **一套属性序列化**：`serializeAttrs(tag, props)` 处理所有情况
3. **一套渲染路径**：async-only，`renderToNode` 是唯一的核心函数
4. **一个文件一个职责**：删除纯 re-export 文件，合并紧密耦合的文件
5. **零拼写错误零硬编码**：修复所有代码质量问题

## Scope

5 个 Phase 的具体工作流：

1. **Phase 1**: 零风险修复（拼写、版本、警告）
2. **Phase 2**: 统一属性序列化
3. **Phase 3**: 文件合并（7 个文件删除）
4. **Phase 4**: API 清理（删除 `renderDsdByName`）
5. **Phase 5**: 合并为单一 async 渲染路径

## Entry Criteria

开始前必须满足：

1. `dev` 分支包含 v0.29.0
2. `STATUS.md` 标识最新 release line（v0.29.0）
3. `deno task graph:check` 报告预期包数（19 个）
4. 工作树无无关改动
5. 所有现有测试通过
6. `deno task typecheck` 通过
7. `deno task lint` 通过

## Workstream 1: 零风险修复

### Problem

代码质量问题不影响功能，但影响可维护性：
- 拼写错误：`_hyrateExistingDom`
- 硬编码版本：`hub/scanner.ts:62` 的 `'0.20.0'`
- 信任边界无验证：`trustRenderHtml` 纯透传

### Target

修复 3 个零风险问题，不改变任何 API 或功能。

### Steps

**1.1 修复拼写错误**

```bash
# 查找所有 _hyrateExistingDom 的使用
grep -r "_hyrateExistingDom" packages/core/src/

# 替换为 _hydrateExistingDom
# 位置：dsd-element.ts:302, 470
```

**1.2 移除硬编码版本**

```bash
# 查找硬编码版本
grep -n "0.20.0" packages/hub/src/scanner.ts

# 改为从 deno.json 读取
# 添加函数：
async function getPackageVersion(): Promise<string> {
  const denoJson = JSON.parse(await Deno.readTextFile('deno.json'));
  return denoJson.version;
}
```

**1.3 加开发模式警告**

```typescript
// packages/core/src/security.ts
export function trustRenderHtml(html: string): string {
  if (import.meta.env?.DEV) {
    console.warn(
      '[LessJS] trustRenderHtml is a trust boundary, not a sanitizer. ' +
      'Caller must ensure HTML is safe.'
    );
  }
  return html;
}
```

### Acceptance

- [ ] 拼写错误消除（`grep -r "_hyrateExistingDom"` 返回空）
- [ ] 版本号不再硬编码（`grep -n "0.20.0" packages/hub/src/scanner.ts` 返回空）
- [ ] 开发模式下 `trustRenderHtml` 输出警告
- [ ] 所有现有测试通过
- [ ] `deno task typecheck` 通过
- [ ] `deno task lint` 通过

## Workstream 2: 统一属性序列化

### Problem

`serializeAttributes` 和 `serializeElementAttrs` 行为不一致：
- `serializeAttributes`：用 `camelToKebab`
- `serializeElementAttrs`：只处理 `className` → `class` 和 `htmlFor` → `for`

影响 DSD host 元素和普通元素的属性渲染一致性。

### Target

一个 `serializeAttrs(tag, props)` 函数处理所有情况。

### Steps

**2.1 创建统一函数**

```typescript
// packages/core/src/render-ir.ts
const SKIP_KEYS = new Set(['children', 'ref', 'key', 'rawHtml']);

function serializeAttrs(tag: string, props: Record<string, unknown>): string {
  const isCustomElement = tag.includes('-');
  let result = '';
  
  for (const [key, value] of Object.entries(props)) {
    if (SKIP_KEYS.has(key)) continue;
    if (key.startsWith('on') && typeof value === 'function') continue;
    if (typeof value === 'function') continue;
    if (value == null) continue;
    if (key === 'innerHTML' || key === 'textContent') continue;
    
    // React 风格映射
    let attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;
    
    // Custom Element 额外做 kebab-case
    if (isCustomElement && attrName === key) {
      attrName = camelToKebab(attrName);
    }
    
    const resolved = unwrapSignalLike(value);
    
    if (typeof resolved === 'boolean') {
      if (resolved) result += ` ${attrName}`;
      continue;
    }
    
    if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
      const styleObj: Record<string, unknown> = {};
      for (const [sk, sv] of Object.entries(resolved as Record<string, unknown>)) {
        styleObj[sk] = unwrapSignalLike(sv);
      }
      const css = styleObjectToString(styleObj);
      if (css) result += ` style="${escapeAttr(css)}"`;
      continue;
    }
    
    result += ` ${attrName}="${escapeAttr(String(resolved))}"`;
  }
  
  return result;
}
```

**2.2 修改 dsdHostNode 类型**

```typescript
// packages/core/src/render-ir.ts
export type RenderNode =
  | { kind: 'text'; value: string }
  | { kind: 'trusted-html'; value: string }
  | { kind: 'fragment'; children: RenderNode[] }
  | {
      kind: 'element';
      tag: string;
      attrs: Record<string, unknown>;  // 已经是 Record
      eventAttrs?: string;
      children: RenderNode[];
      voidElement?: boolean;
    }
  | {
      kind: 'dsd-host';
      tag: string;
      attrs: Record<string, unknown>;  // 从 string 改为 Record
      ssrPropsAttr: string;
      source: string;
      templateAttrs: string;
      styleCss: string;
      shadow: RenderNode[];
      light: RenderNode[];
      layer: string;
    };
```

**2.3 修改 wrapDsdOutput**

```typescript
// packages/core/src/render-serialize.ts
export function wrapDsdOutput(params: {
  tagName: string;
  props: Record<string, unknown>;  // 不再预序列化
  content: string;
  styleCss: string;
  layer: string;
  sourceStr: string;
  dsdOptions?: DsdOptions;
}): string {
  const { tagName, props, content, styleCss, layer, sourceStr, dsdOptions } = params;
  
  const ssrPropsAttr = Object.keys(props).length > 0
    ? ` data-ssr-props="${escapeAttrValue(JSON.stringify(props))}"`
    : '';
  
  return serializeRenderNode(
    dsdHostNode({
      tag: tagName,
      attrs: props,  // 直接传 props，不再传预序列化的 string
      ssrPropsAttr,
      source: sourceStr,
      templateAttrs: buildDsdTemplateAttrs(dsdOptions),
      styleCss,
      shadow: [trustedHtmlNode(content)],
      light: [],
      layer,
    }),
  );
}
```

**2.4 删除旧函数**

```bash
# 删除 serializeAttributes（render-serialize.ts）
# 删除 serializeElementAttrs（render-ir.ts）
```

**2.5 移动 camelToKebab**

```bash
# 从 render-serialize.ts 移入 render-ir.ts
```

**2.6 回归测试**

```bash
# 运行所有 SSG 输出测试
deno task test packages/core/__tests__/render-*.test.ts

# 对比改前改后的 SSG 输出（fixture 对比）
```

### Acceptance

- [ ] 只有一个属性序列化函数 `serializeAttrs`
- [ ] `dsd-host` 和 `element` 节点使用同一个序列化路径
- [ ] 所有现有测试通过
- [ ] SSG 输出与改前一致（fixture 对比）
- [ ] `deno task typecheck` 通过
- [ ] `deno task lint` 通过

## Workstream 3: 文件合并

### Problem

33 个源文件，其中 7 个可以合并或删除。

### Target

26 个源文件。

### Steps

**3.1 删除 jsx-render-string.ts**

```bash
# 删除文件
rm packages/core/src/jsx-render-string.ts

# 更新所有 import
# 从 './jsx-render-string.js' 改为 './render-ir.js'
grep -r "jsx-render-string" packages/core/src/ | xargs sed -i 's|jsx-render-string|render-ir|g'
```

**3.2 custom-element.ts → island.ts**

```bash
# 移动 defineCustomElement 函数到 island.ts
# 删除 custom-element.ts
rm packages/core/src/custom-element.ts

# 更新 index.ts
# 从 './custom-element.js' 改为 './island.js'
```

**3.3 api.ts → types.ts**

```bash
# 移动 LessApiContext interface 到 types.ts
# 删除 api.ts
rm packages/core/src/api.ts

# 更新 index.ts
# 从 './api.js' 改为 './types.js'
```

**3.4 prop-types.ts → prop.ts**

```bash
# 移动 PropDecl, PropType, PropsFrom 到 prop.ts
# 删除 prop-types.ts
rm packages/core/src/prop-types.ts

# 更新 index.ts
# 从 './prop-types.js' 改为 './prop.js'
```

**3.5 render-errors.ts → render-dsd.ts**

```bash
# 移动 classifyError, instantiationErrorHtml, renderErrorHtml, wrongTypeErrorHtml 到 render-dsd.ts
# 删除 render-errors.ts
rm packages/core/src/render-errors.ts

# 更新 render-dsd.ts 的 import
# 删除 './render-errors.js' 的 import
```

**3.6 render-instantiate.ts → render-dsd.ts**

```bash
# 移动 instantiateComponent, injectProps 到 render-dsd.ts
# 删除 render-instantiate.ts
rm packages/core/src/render-instantiate.ts

# 更新 render-dsd.ts 的 import
# 删除 './render-instantiate.js' 的 import
```

**3.7 render-serialize.ts → render-ir.ts + render-dsd.ts**

```bash
# 移动 buildDsdTemplateAttrs 到 render-dsd.ts
# 移动 wrapDsdOutput 到 render-dsd.ts
# camelToKebab 已在 Phase 2 移入 render-ir.ts
# 删除 render-serialize.ts
rm packages/core/src/render-serialize.ts

# 更新 render-dsd.ts 的 import
# 删除 './render-serialize.js' 的 import
```

**3.8 registry.ts:isValidCustomElementName → tag-utils.ts:isValidTagName**

```typescript
// packages/core/src/registry.ts
// 删除 isValidCustomElementName 函数（~18 行）
// 改为 import { isValidTagName } from './tag-utils.js';
// 替换所有 isValidCustomElementName 调用为 isValidTagName
```

**3.9 更新 index.ts**

```typescript
// packages/core/src/index.ts
// 移除所有已删除文件的 re-export
// 更新 import 路径
```

**3.10 更新 deno.json**

```json
{
  "exports": {
    ".": "./src/index.ts",
    // 移除已删除文件的 exports
  }
}
```

### Acceptance

- [ ] core/src 26 个文件
- [ ] 所有现有测试通过
- [ ] `deno task typecheck` 通过
- [ ] `deno task graph:check` 通过
- [ ] `deno task lint` 通过
- [ ] 无 import 错误

## Workstream 4: API 清理

### Problem

`renderDsdByName` 是遗留 API，已被 `renderDsd()` 取代。

### Target

删除遗留 API。

### Steps

**4.1 删除 renderDsdByName 函数**

```bash
# packages/core/src/render-dsd.ts
# 删除 renderDsdByName 函数（~15 行）
```

**4.2 删除测试**

```bash
# packages/core/__tests__/render-dsd.test.ts
# 删除 renderDsdByName 相关测试
```

**4.3 移除 re-export**

```typescript
// packages/core/src/index.ts
// 移除 renderDsdByName 的 export
```

**4.4 确认 runtime 导出**

```bash
# 确认 runtime/exports.test.ts 已验证 renderDsdByName 不在 runtime 中
# 如果测试失败，更新测试
```

### Acceptance

- [ ] `renderDsdByName` 不存在于代码库中
- [ ] 所有现有测试通过
- [ ] `deno task typecheck` 通过
- [ ] `deno task lint` 通过

## Workstream 5: 合并为单一 async 渲染路径

### Problem

`renderToStaticNode` 和 `renderToDsdNode` 是两套几乎相同的遍历逻辑（~100 行重复）。

### Target

一个 async 函数 `renderToNode`，~90 行。

### Steps

**5.1 创建 renderToNode**

```typescript
// packages/core/src/render-ir.ts
export async function renderToNode(
  node: unknown,
  eventContext: EventMarkerContext = createEventMarkerContext(),
): Promise<RenderNode> {
  // 早期返回：primitives
  if (node == null || node === false) return fragmentNode([]);
  if (typeof node === 'string' || typeof node === 'number') return textNode(node);
  if (isSignalLike(node)) return await renderToNode(node.value, eventContext);
  if (!isVNode(node)) return textNode(String(node));

  const { tag, props, children } = node;

  // 控制流：Fragment
  if (tag === Fragment || (typeof tag === 'symbol' && String(tag) === 'Symbol(lessjs.fragment)')) {
    const parts: RenderNode[] = [];
    for (const child of children) parts.push(await renderToNode(child, eventContext));
    return fragmentNode(parts);
  }

  // 控制流：Show
  if (tag === SHOW_TAG || tag === 'show') {
    const whenVal = isSignalLike(props?.when) ? (props!.when as { value: unknown }).value : props?.when;
    const target = whenVal ? children[0] : children[1];
    return target ? await renderToNode(target, eventContext) : fragmentNode([]);
  }

  // 控制流：For
  if (tag === FOR_TAG || tag === 'fore') {
    const items = (isSignalLike(props?.each)
      ? (props!.each as { value: unknown }).value
      : props?.each) as unknown[];
    const renderFn = children[0] as unknown as ((item: unknown, idx: number) => unknown);
    if (!Array.isArray(items) || typeof renderFn !== 'function') {
      return fragmentNode([]);
    }
    const parts: RenderNode[] = [];
    for (let index = 0; index < items.length; index++) {
      parts.push(await renderToNode(renderFn(items[index], index), eventContext));
    }
    return fragmentNode(parts);
  }

  // 组件函数/类
  if (typeof tag === 'function') {
    try {
      return await renderToNode(callComponent(tag, props, children), eventContext);
    } catch (err) {
      console.error(
        `[LessJS/SSR] render failed for <${String(tag)}>:`,
        err instanceof Error ? err.message : String(err),
      );
      return fragmentNode([]);
    }
  }

  // HTML/SVG 元素
  const tagName = String(tag);
  const childNodes: RenderNode[] = [];

  // innerHTML / textContent
  if (props?.innerHTML !== undefined) {
    const value = unwrapSignalLike(props.innerHTML);
    childNodes.push(props.rawHtml === true ? trustedHtmlNode(value) : textNode(value));
  } else if (props?.textContent !== undefined) {
    childNodes.push(textNode(unwrapSignalLike(props.textContent)));
  } else {
    for (const child of children) childNodes.push(await renderToNode(child, eventContext));
  }

  // Custom Element → DSD
  if (
    typeof customElements !== 'undefined' &&
    customElements.get &&
    customElements.get(tagName)
  ) {
    try {
      const dsdResult = await renderDsd(tagName, {
        componentClass: customElements.get(tagName) as CustomElementConstructor,
        props,
      });
      return mergeDsdHostHtmlWithLightDom(dsdResult.html, tagName, childNodes);
    } catch (err) {
      console.error(
        `[LessJS/SSR] renderDsd failed for registered CE <${tagName}>:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  return {
    kind: 'element',
    tag: tagName,
    attrs: props,
    eventAttrs: serializeEventMarkers(props, eventContext),
    children: childNodes,
    voidElement: VOID_ELEMENTS.has(tagName),
  };
}
```

**5.2-5.7 删除旧函数**

```bash
# 删除 renderToStaticNode()
# 删除 renderSpecialVNodeSync()
# 删除 renderChildrenFromProps()（sync 版本）
# 删除 renderToDsdNode()
# 删除 renderSpecialVNodeAsync()
# 删除 renderChildrenFromPropsAsync()
```

**5.8 删除 renderToString**

```bash
# packages/core/src/render-ir.ts
# 删除 renderToString 函数
```

**5.9 更新 renderDsdTree**

```typescript
// packages/core/src/render-ir.ts
export async function renderDsdTree(node: unknown): Promise<string> {
  return serializeRenderNode(await renderToNode(node, createEventMarkerContext()));
}
```

**5.10 删除 _resolveRenderOutput**

```bash
# packages/core/src/dsd-element.ts
# 删除 _resolveRenderOutput 方法（死代码）
```

**5.11 更新调用方**

```bash
# 查找所有 renderToString 调用
grep -r "renderToString" packages/ www/

# 替换为 renderDsdTree（加 await）
```

**5.12 更新测试**

```bash
# 查找所有测试中的 renderToString 调用
grep -r "renderToString" packages/core/__tests__/

# 替换为 renderDsdTree（加 await）
```

**5.13 移除 re-export**

```typescript
// packages/core/src/index.ts
// 移除 renderToString 的 export
```

### Acceptance

- [ ] 只有一个渲染函数 `renderToNode`
- [ ] `renderDsdTree` 是唯一的公开渲染 API
- [ ] `renderToString` 完全删除
- [ ] `_resolveRenderOutput` 删除（死代码）
- [ ] 净减 ~120 行
- [ ] 所有现有测试通过（测试中的调用加 `await`）
- [ ] `deno task typecheck` 通过
- [ ] `deno task lint` 通过

## Execution Order

1. **Phase 1**: 零风险修复（3 步）
2. **Phase 2**: 统一属性序列化（6 步）
3. **Phase 3**: 文件合并（10 步）
4. **Phase 4**: API 清理（4 步）
5. **Phase 5**: 合并为单一 async 渲染路径（13 步）
6. 运行全部门禁测试
7. 更新 changelog、release note、STATUS.md
8. 所有 19 包 bump 到 0.29.1
9. Push dev，监控 CI
10. Merge to main，验证 publish workflow

## Verification

### Focused gates

- `render-ir.test.ts`（属性序列化统一测试）
- `render-dsd.test.ts`（renderDsdByName 删除后测试）
- `core-api-surface.test.ts`（API 表面测试）
- `runtime/exports.test.ts`（runtime 导出测试）
- SSG output fixture 对比测试

### Full local gates

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno audit
deno task graph:check
deno task graph:check-imports
deno task docs:check-strategy
deno task docs:check-current
deno task build
deno task dist:check-object-object
deno task dsd:check-report
deno task test
LESSJS_E2E_PORT=4175 CI=1 deno task test:e2e
deno task publish:dry-run
```

### Remote gates

- `dev`: Lint & Format, Test, SOP Gate, CodeQL
- `main`: Lint & Format, Test, SOP Gate, CodeQL, Code Quality
- `main`: Publish to JSR with post-publish consumer smoke

## Exit Criteria

v0.29.1 完成当且仅当：

- [ ] core/src 26 个文件
- [ ] 一套属性序列化函数
- [ ] 一套渲染路径（async-only）
- [ ] `renderDsdByName` 已删除
- [ ] `renderToString` 已删除
- [ ] `_resolveRenderOutput` 已删除（死代码）
- [ ] 拼写错误已修复
- [ ] 硬编码版本已修复
- [ ] `trustRenderHtml` 有开发模式警告
- [ ] 所有 19 包 bump 到 0.29.1
- [ ] changelog 和 release note 准确描述
- [ ] 全部门禁通过
- [ ] dev CI green
- [ ] main publish workflow 成功

## Explicit Non-Goals

1. **不改 router**
   - Router 测试覆盖率低是独立问题
   - 不在本次范围

2. **不改 adapter-vite ↔ content 循环依赖**
   - 已知 H-16
   - 需要更大重构
   - 不在本次范围

3. **不改 render-dsd-stream / error-boundary / signal-context**
   - 这些是合法功能
   - 有独立测试和使用者
   - 不需要删除

4. **不引入新公开 API**
   - 本次是清理，不是扩展
   - 保持 API 表面最小化

5. **不做 UI Shell 双轨**
   - 那是 v0.30.0 的目标
   - 不在本次范围

## Reviewer Checklist

审查时检查：

- [ ] core/src 是否 26 个文件？
- [ ] 是否只有一套属性序列化函数？
- [ ] 是否只有一套渲染路径？
- [ ] `renderDsdByName` 是否已删除？
- [ ] `renderToString` 是否已删除？
- [ ] `renderDsdTree` 是否返回 `Promise<string>`？
- [ ] `_resolveRenderOutput` 是否已删除？
- [ ] 拼写错误是否已修复？
- [ ] 硬编码版本是否已修复？
- [ ] 所有测试是否通过？
- [ ] 全部门禁是否通过？

## Related

- [ADR-0078](../../adr/ADR-0078-core-simplification-and-merge.md): 架构决策
- [Conversation](../../conversation/20260603/20260603-core-simplification-audit.md): 审计思辨过程
- [ADR-0077](../../adr/ADR-0077-structured-render-ir.md): Structured Render IR（前置工作）
