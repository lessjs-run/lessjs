# SOP-011: Unified Render Nested DSD — Single-Pass VNode Traversal

> Version: v0.28.0
> Status: Ready for Implementation
> Date: 2026-05-31
> Supersedes: N/A (new SOP)
> Depends on: ADR-0071 (Single-Pass Render Nested DSD)
> Related: SOP-008 (architecture cleanup), SOP-009 (workaround chains), SOP-010 (app shell boundary)
> Trigger: Three production bugs (sidebar missing, search [object Object], theme isolation) traced to dual tree traversal + string intermediate in the DSD rendering pipeline.

---

## 方向声明（Must-Read Before Starting）

**这条 SOP 的目的不是"修 Bug"，是"消除 Bug 存在的物理空间"。**

当前管线有三遍树遍历、一座断桥、一个冗余解析器。修其中任何一个 Bug 都是在腐肉上贴创可贴。正确做法是把这三遍合并成一遍，让桥自己消失。

改动量很小（net ~45 行删除），但**涉及核心渲染管线**。每一步执行后都要验证。不要跳步。

---

## 零、实施前准备

### 0.1 确认起点

```bash
cd C:\Users\Administrator\WorkBuddy\Claw\src-tmp
git branch --show-current   # 必须是 dev
git status --short          # 必须干净（无未提交改动）
deno task check             # 必须通过
deno task test              # 必须全部通过
```

### 0.2 记录基线

```bash
# 记录当前构建产物大小和页面数
deno task build 2>&1 | tee /tmp/build-baseline.log
find www/dist -name "index.html" | wc -l  # 记录页面数
```

### 0.3 确认问题页面存在（Bug 复现基线）

```bash
# Bug 1 基线：sidebar 不应为空
grep -o "docs-sidebar" www/dist/zh/guide/getting-started/index.html | wc -l  # 预期: 0（Bug 存在）

# Bug 2 基线：不应存在 dialog 标签或 [object Object]
grep -c "<dialog" www/dist/zh/guide/getting-started/index.html  # 预期: >0 或 0（取决于当前状态）
grep -c "\[object Object\]" www/dist/zh/guide/getting-started/index.html  # 预期: 0 或 >0

# 额外基线：less-layout 是否有 DSD template
grep -c "shadowrootmode" www/dist/zh/guide/getting-started/index.html  # 记录数量
```

**在每个验证步骤中，这些命令会被重新运行，数字必须改善。**

---

## 一、删除 parse5 依赖和执行体

### 步骤 1.1：从依赖中移除 parse5

**涉及文件**: `packages/core/deno.json`

```jsonc
// 找到：
"imports": {
  "parse5": "npm:parse5@^7.x.x",
  // ... 其他依赖
}

// 改为：
"imports": {
  // parse5 已删除 — ADR-0071 不再需要 HTML 重解析
  // ... 其他依赖
}
```

**执行动作**: 删除 `"parse5"` 这一行。

**验收命令**:

```bash
grep "parse5" packages/core/deno.json
# 预期输出: 空（无匹配）
```

**通过标准**: grep 无输出。

### 步骤 1.2：删除 render-nested.ts 文件

**涉及文件**: `packages/core/src/render-nested.ts`

**执行动作**: 删除整个文件。

```bash
rm packages/core/src/render-nested.ts
```

**验收命令**:

```bash
ls packages/core/src/render-nested.ts 2>&1
# 预期输出: No such file or directory
```

**通过标准**: 文件不存在。

### 步骤 1.3：从 core 包导出中移除 renderNestedCustomElements

**涉及文件**: `packages/core/src/index.ts`

```typescript
// 找到：
export { renderNestedCustomElements } from './render-nested.js';

// 删除这一行
```

**执行动作**: 删除该 export 行。

**验收命令**:

```bash
grep "renderNestedCustomElements" packages/core/src/index.ts
# 预期输出: 空
```

**通过标准**: grep 无输出。

### 步骤 1.4：清理所有 renderNestedCustomElements 的 import 引用

**涉及文件**: 全局搜索

```bash
grep -rn "renderNestedCustomElements" packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__
```

**执行动作**: 对每个匹配到的文件，删除 `import { renderNestedCustomElements }` 和 `import { ..., renderNestedCustomElements, ... }`。如果 import 只剩这一个成员，删除整行 import。

**特别注意 `entry-renderer.ts`**:

```typescript
// 找到：
lines.push(`import { wrapInDocument, renderNestedCustomElements } from '@lessjs/core';`);

// 改为：
lines.push(`import { wrapInDocument } from '@lessjs/core';`);
```

**验收命令**:

```bash
grep -rn "renderNestedCustomElements" packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__ | grep -v ".md"
# 预期输出: 空（无匹配，或仅有注释/文档引用）
```

**通过标准**: 源代码中无引用（注释和文档中的引用可以保留）。

### 步骤 1.5：删除 render-dsd.ts 中的 visited Set 逻辑

**涉及文件**: `packages/core/src/render-dsd.ts`

在 `renderNestedCustomElements` 函数中（已被删除的文件），`visited` Set 的逻辑不再需要。确认 `render-dsd.ts` 中不再有 `visited` 相关代码：

```bash
grep -n "visited" packages/core/src/render-dsd.ts
```

**执行动作**: 如果 `render-dsd.ts` 内部有 `visited` 相关的 Set 创建、`.has()`、`.add()` 调用，全部删除。

**验收命令**:

```bash
grep -n "visited" packages/core/src/render-dsd.ts
# 预期输出: 空
```

**通过标准**: grep 无输出。

### 步骤 1.6：验证 parse5 已从全局依赖中清理

```bash
# 确认 parse5 不再被任何 package 直接依赖
grep -rn "parse5" packages/ deno.json --include="*.json" --include="*.ts" | grep -v node_modules | grep -v __tests__ | grep -v ".md"
# 预期：仅文档和注释中有引用
```

**通过标准**: 依赖文件中无 parse5。

### 步骤 1.7：中间类型检查验证

```bash
deno task check
```

**通过标准**: 类型检查通过（可能会有 import 相关的报错需要逐项修复）。

---

## 二、创建统一遍历函数 `renderNestedDsd`

### 步骤 2.1：在 jsx-render-string.ts 中添加 CE 注册检查

**涉及文件**: `packages/core/src/jsx-render-string.ts`

在文件顶部（import 区域之后）添加：

```typescript
/** Check if a tag name corresponds to a registered custom element. */
function isRegisteredCustomElement(tag: string): boolean {
  return typeof customElements !== 'undefined' && !!customElements.get(tag);
}
```

**执行动作**: 插入上述函数。

### 步骤 2.2：在 renderToString 的主循环中加入 CE 渲染分支

**涉及文件**: `packages/core/src/jsx-render-string.ts`

找到 `renderToString` 函数中处理 `case 'string'`（字符串 tag）的逻辑。当前逻辑类似：

```typescript
// 当前（简化）
function renderChildren(children: VNodeChildren): string {
  return children.map((child) => {
    if (typeof child === 'string') return escapeHtml(child);
    const { tag, props, children } = child;
    const tagStr = String(tag);
    return `<${tagStr}${attrs}>${renderChildren(children)}</${tagStr}>`;
  }).join('');
}
```

**关键改动 — 改为异步 + CE 检测**：

```typescript
import { renderDsd } from './render-dsd.js'; // 新增 import

async function renderNestedChildren(children: VNodeChildren): Promise<string> {
  const results: string[] = [];
  for (const child of children) {
    if (typeof child === 'string') {
      results.push(escapeHtml(child));
    } else if (child.tag === Fragment) {
      results.push(await renderNestedChildren(child.children));
    } else if (typeof child.tag === 'function') {
      // Class component: instantiate, render(), recurse
      const instance = new (child.tag as any)();
      if (child.props) injectProps(instance, child.props);
      const vnode = instance.render();
      results.push(await renderNestedChildren([vnode]));
    } else {
      // String tag — is it a registered CE?
      const tagStr = String(child.tag);
      if (isRegisteredCustomElement(tagStr)) {
        // Render this CE through the full DSD pipeline inline
        const dsdResult = await renderDsd(tagStr, undefined, child.props);
        results.push(dsdResult.html);
      } else {
        // Normal HTML element: serialize normally
        const attrs = serializeAttrs(child.props);
        const inner = await renderNestedChildren(child.children);
        results.push(`<${tagStr}${attrs}>${inner}</${tagStr}>`);
      }
    }
  }
  return results.join('');
}
```

**注意**：

- 函数名从 `renderChildren` 改为 `renderNestedChildren`（标明它是异步 + 递归渲染嵌套 CE）
- 函数签名从 `(VNodeChildren) => string` 变为 `(VNodeChildren) => Promise<string>`
- 将 `renderToString` 的 body 改为调用 `renderNestedChildren`
- 或者直接重命名 `renderToString` → `renderNestedDsd`，让旧名称变成 alias（向后兼容）

**更简洁的方案**：直接新建导出 `renderNestedDsd`，旧的 `renderToString` 保留为同步版本（处理不含 CE 的简单 VNode）：

```typescript
// 新增导出 — 用于 SSG 场景（含嵌套 CE）
export async function renderNestedDsd(vnode: VNode): Promise<string> {
  // ... 上述异步遍历逻辑
}

// 保留旧导出 — 向后兼容（纯字符串序列化，不含 CE 递归）
export function renderToString(vnode: VNode): string {
  // ... 原有同步逻辑，不变
}
```

**执行动作**: 实现上述逻辑。选择"新增 `renderNestedDsd`，保留旧 `renderToString`"方案以最小化改动风险。

### 步骤 2.3：从 core 包导出 `renderNestedDsd`

**涉及文件**: `packages/core/src/index.ts`

```typescript
export { renderNestedDsd } from './jsx-render-string.js';
```

**执行动作**: 添加上述 export。

**验收命令**:

```bash
grep "renderNestedDsd" packages/core/src/index.ts
# 预期输出: 有匹配
```

---

## 三、重构 `render-dsd.ts` — 使用新的统一遍历

### 步骤 3.1：将 renderDsd 内部调用改为 `renderNestedDsd`

**涉及文件**: `packages/core/src/render-dsd.ts`

找到 `renderDsd()` 函数中调用 `renderToString` 的位置（通常在拿到 VNode 之后）：

```typescript
// 当前（简化）：
const vnode = instance.render();
const innerHtml = renderToString(vnode);
const dsdHtml = wrapDsdOutput(tagName, styles, innerHtml);
```

**执行动作**：将 `renderToString(vnode)` 改为 `await renderNestedDsd(vnode)`：

```typescript
// 改为：
const vnode = instance.render();
const innerHtml = await renderNestedDsd(vnode); // ← 异步，自动处理嵌套 CE
const dsdHtml = wrapDsdOutput(tagName, styles, innerHtml);
```

**注意**：此时不再需要后续调用 `renderNestedCustomElements`——因为嵌套 CE 已经在 `renderNestedDsd` 内部被处理了。

### 步骤 3.2：删除 render-dsd.ts 中 renderNestedCustomElements 的调用

**涉及文件**: `packages/core/src/render-dsd.ts`

找到所有对 `renderNestedCustomElements` 的调用（包括 `renderDsd` 内部的递归调用和 SSG 后处理中的调用）：

```bash
grep -n "renderNested" packages/core/src/render-dsd.ts
```

**执行动作**: 删除所有 `renderNestedCustomElements(...)` 的调用行及与其相关的错误处理和日志代码。

如果 `renderDsd` 内部有循环调用 `renderNestedCustomElements` 的模式（例如渲染一个 CE 的 DSD 后，又对输出调 `renderNestedCustomElements` 来处理子 CE），这些调用不再需要——子 CE 已经在 `renderNestedDsd` 的递归中被处理了。

**验收命令**:

```bash
grep -n "renderNested" packages/core/src/render-dsd.ts
# 预期输出: 空（所有 renderNested* 调用都已移除）
```

---

## 四、重构 Builder — 清除 `__wrapAppShell`

### 步骤 4.1：删除 `__wrapAppShell` 函数生成

**涉及文件**: `packages/adapter-vite/src/entry-renderer.ts`

找到 `__wrapAppShell` 的函数生成代码（约第 552-559 行）：

```typescript
// 删除整段：
lines.push('function __wrapAppShell(content, routePath, options = {}) {');
lines.push('  const defaultLocale = __getDefaultLocale();');
lines.push('  const locale = options.locale || __localeFromPath(routePath, defaultLocale);');
lines.push('  const isHome = routePath === "/";');
lines.push(
  '  const layoutHtml = `<less-layout${isHome ? " home" : ""} current-path="...">${content}</less-layout>`;',
);
lines.push('  return layoutHtml;');
lines.push('}');
```

**执行动作**: 删除整段（包括之前临时添加的 `renderNestedCustomElements` 调用）。

### 步骤 4.2：删除 `__wrapAppShell` 的调用点

**涉及文件**: `packages/adapter-vite/src/entry-renderer.ts`

找到 `content = await __wrapAppShell(content, ...)` 的两处调用：

```typescript
// 第一处 — renderRoute 函数（SSG 路径）约第 723 行
// 删除：
lines.push('  content = await __wrapAppShell(content, routePath, { locale });');

// 第二处 — Hono SSR 路径约第 280 行
// 删除：
lines.push(`    content = await __wrapAppShell(content, c.req.path, ...)`);
```

**执行动作**: 删除这两行。

### 步骤 4.3：改为直接调用 `renderNestedDsd`

`less-layout` 不再通过字符串包裹，而是作为正常 CE 被渲染。但因为 `renderRoute` 的输出是多个组件的组合（page + layout），我们需要一个新的组合方式。

**方案**：在 `renderRoute` 中，先渲染 page 组件拿到 DSD，再渲染 layout 组件把 page DSD 作为 slot：

```typescript
// 概念代码（不直接写在 entry-renderer 的 lines.push 里，而是作为运行时逻辑）
// Step 1: 渲染 page 组件
const pageResult = await renderDsdByName('page-getting-started', ...);

// Step 2: 渲染 layout 组件，page 内容作为 slot
// less-layout 的 render() 里有 <slot></slot>，浏览器会用 light DOM 内容填充
// 所以 page 的 DSD template 放在 <less-layout> 的 light DOM 位置即可
const finalHtml = `<less-layout ${layoutAttrs}>
  ${pageResult.html}  <!-- page DSD template 作为 light DOM -->
</less-layout>`;
```

**但这是不是又回到了字符串拼接？** 不是。区别在于：

- 旧方案：`<less-layout>` 本身是字符串拼接，从未经过 `renderDsd()`
- 新方案：`<less-layout>` 走 `renderDsd()`，其 `render()` 正常执行，输出 DSD template。page 内容是它的 light DOM 子节点，浏览器会自动投射到 `<slot>`

**执行动作**：

- 删除 `__wrapAppShell` 函数体
- 在 `renderRoute` 中，先渲染 page，再渲染 layout，page DSD 放在 layout 的 light DOM
- layout 的渲染通过 `renderDsd('less-layout', LayoutClass)` 正常走 DSD 管线

**简化实现**（最小改动）：

```typescript
// renderRoute 中：
lines.push('  const pageHtml = await __pageRenderFn(route);'); // 保持不变
lines.push(
  '  const layoutAttrs = `current-path="${__layoutAttr(routePath)}" locale="${__layoutAttr(locale)}" ...`;',
);
lines.push('  const layoutHtml = await renderNestedDsd({');
lines.push('    tag: "less-layout",');
lines.push('    props: { ...layoutProps },');
lines.push('    children: [pageHtml]  // raw HTML string as child (特殊处理)');
lines.push('  });');
lines.push('  content = layoutHtml;');
```

但这要求 `renderNestedDsd` 能处理 string children（已经是 HTML 的字符串不需要再序列化）——这需要一个小改动。

**更简单方案**：直接在 `renderRoute` 中用 `renderDsd` 渲染 `less-layout`，page 内容通过 prop 传入：

实际上要看 `less-layout` 的 `render()` 是如何使用 `<slot>` 的。如果 `<slot>` 是浏览器原生 slot，light DOM 内容会自动填充。所以：

```typescript
// 最终方案（最简单）：
lines.push('  const pageHtml = await __pageRenderFn(route);');
lines.push(
  '  const layoutResult = await renderDsd("less-layout", null, { currentPath: routePath, locale, locales, navItems, headerNav });',
);
lines.push('  // 在 less-layout 的 DSD template 前面插入 page 内容作为 light DOM');
lines.push(
  '  content = layoutResult.html.replace(/<template shadowrootmode="open">/, pageHtml + "<template shadowrootmode=\\"open\\">");',
);
```

**等一下**——这个方案还是字符串操作。我们需要更干净的方法。

**最终最终方案**：让 `renderRoute` 生成的代码构造一个 VNode 树，然后调 `renderNestedDsd`：

实际上，考虑到 less-layout 使用 `<slot>` —— 它是浏览器 API，需要 light DOM 子节点。DSD template 是 shadow DOM 的内容，`<slot>` 从 light DOM 投射内容。

所以正确的方式是：

1. 渲染 page 组件 → page DSD (shadow DOM 内容)
2. 渲染 less-layout 组件 → layout DSD (shadow DOM 内容，包含 `<slot>`)
3. 最终 HTML = `<less-layout>${page DSD}</less-layout>` — page 在 light DOM，layout DSD 在 shadow DOM

**这就是字符串拼接 `<less-layout>content</less-layout>` —— 但这个字符串拼接是正确的**，因为：

- `less-layout` 的 DSD template 由 `renderDsd()` 正确生成
- page 内容放在 light DOM 位置，浏览器的 `<slot>` 机制处理剩余

关键区别：**旧方案 `<less-layout>` 本身没有 DSD template。新方案有。**

```typescript
// entry-renderer.ts 中的生成代码：
lines.push('  const pageResult = await __pageRenderFn(route);');
lines.push('  const layoutResult = await renderDsd("less-layout", null, {');
lines.push('    currentPath: routePath,');
lines.push('    locale: locale,');
lines.push('    locales: __locales,');
lines.push('    navItems: __navSections,');
lines.push('    headerNav: __headerNav,');
lines.push('  });');
lines.push('  // Wrap page DSD inside less-layout light DOM (slot fills automatically)');
lines.push('  content = layoutResult.html.replace(');
lines.push('    "</less-layout>",');
lines.push('    pageResult.html + "</less-layout>"');
lines.push('  );');
```

**执行动作**: 将上述逻辑替换掉原来的 `__wrapAppShell` 字符串拼接。

**验收命令**:

```bash
grep "__wrapAppShell" packages/adapter-vite/src/entry-renderer.ts
# 预期输出: 空
```

---

## 五、确保 less-layout SSR 安全

### 步骤 5.1：确认 _currentPath() 不访问浏览器 API

**涉及文件**: `packages/ui/src/less-layout.tsx`

已经有一个修复（来自之前的尝试），确认它还在：

```typescript
private _currentPath(): string {
  // SSR-safe: prefer attribute/prop over Router
  const prop = (this as any).currentPath;
  if (typeof prop === 'string' && prop.length > 0) return prop;
  const attr = this.getAttribute('current-path');
  if (attr && attr.length > 0) return attr;
  try { return this.routing.path; } catch { return '/'; }
}
```

**验收命令**:

```bash
grep -A 10 "_currentPath" packages/ui/src/less-layout.tsx | grep "currentPath\|current-path\|routing.path"
# 预期: 优先读 prop/attr，兜底 Router
```

**通过标准**: `_currentPath()` 不直接调 `this.routing.path` 作为第一个选择。

### 步骤 5.2：确认 less-theme-toggle SSR 安全

**涉及文件**: `packages/ui/src/less-theme-toggle.tsx`

less-theme-toggle 在 SSR 时可能读 `localStorage`。确认 `render()` 方法是 SSR 安全的：

**执行动作**: 阅读 `less-theme-toggle.tsx` 的 `render()` 方法。如果涉及 `localStorage`，加上 `typeof localStorage !== 'undefined'` 守卫。

### 步骤 5.3：确认 less-search 不包含 `<dialog>`

**涉及文件**: `www/app/islands/less-search.tsx`

如果之前的修复（dialog → div）已生效，确认：

**验收命令**:

```bash
grep "<dialog" www/app/islands/less-search.tsx
# 预期输出: 空
```

---

## 六、构建和全量验证

### 步骤 6.1：类型检查

```bash
deno task check
```

**通过标准**: 零错误。

### 步骤 6.2：全量测试

```bash
deno task test
```

**通过标准**: 所有测试通过（约 953 个）。

### 步骤 6.3：SSG 构建

```bash
deno task build 2>&1 | tee /tmp/build-after.log
```

**通过标准**:

- 构建成功，无错误
- 页面数不低于基线
- 无 "Cycle detected" 警告（因为 visited Set 已删除）
- 无 `[object Promise]` 或 `[object Object]` 在输出中

### 步骤 6.4：Bug 修复验证

```bash
# Bug 1 验证：sidebar 应该出现
echo "=== Bug 1: Sidebar ===" 
grep -c "docs-sidebar" www/dist/zh/guide/getting-started/index.html
# 预期: > 0

# Bug 2 验证：无 [object Object]
echo "=== Bug 2: [object Object] ==="
grep -c "\[object Object\]" www/dist/zh/guide/getting-started/index.html
# 预期: 0

# Bug 3 验证：无 <dialog>
echo "=== Bug 3: <dialog> ==="
grep -c "<dialog" www/dist/zh/guide/getting-started/index.html
# 预期: 0

# 额外验证：less-layout 有 DSD template
echo "=== less-layout DSD ==="
grep -c "shadowrootmode" www/dist/zh/guide/getting-started/index.html
# 预期: >= 基线 + 1（因为 less-layout 现在也有 DSD 了）

# less-search 和 less-theme-toggle 存在
echo "=== less-search/theme ==="
grep -c "less-search" www/dist/zh/guide/getting-started/index.html
# 预期: > 0
grep -c "less-theme-toggle" www/dist/zh/guide/getting-started/index.html
# 预期: > 0
```

### 步骤 6.5：多页面抽样验证

```bash
# 中英文各抽样 3 个页面
for page in \
  "index.html" \
  "zh/guide/getting-started/index.html" \
  "zh/registry/index.html" \
  "en/guide/getting-started/index.html" \
  "en/registry/index.html" \
  "zh/engine/architecture/index.html"; do
  echo "=== $page ==="
  echo "  sidebar: $(grep -c 'docs-sidebar' www/dist/$page 2>/dev/null || echo 0)"
  echo "  search:  $(grep -c 'less-search' www/dist/$page 2>/dev/null || echo 0)"
  echo "  layout:  $(grep -c 'less-layout' www/dist/$page 2>/dev/null || echo 0)"
done
```

**通过标准**: 所有页面 sidebar > 0, search > 0, layout > 0。

### 步骤 6.6：Registry 组件页验证

```bash
# 验证 Hub 组件 iframe 仍正常
grep -c "data-srcdoc" www/dist/en/registry/@lessjs~ui/less-card/index.html
# 预期: > 0

# 验证 less-card iframe 包含 design tokens
grep -o 'data-srcdoc="[^"]*"' www/dist/en/registry/@lessjs~ui/less-card/index.html | head -1 | base64 -d | grep -c "less-bg-card"
# 预期: > 0
```

**通过标准**: iframe srcdoc 存在且包含 design token CSS 变量。

---

## 七、清理和提交

### 步骤 7.1：确认无遗留文件

```bash
# 确认 render-nested.ts 已删除
ls packages/core/src/render-nested.ts 2>&1 | grep "No such file"

# 确认无 parse5 依赖
grep -rn "parse5" packages/ deno.json --include="*.json" | grep -v node_modules | grep -v __tests__
```

### 步骤 7.2：Git 提交

```bash
git add -A
git status --short
# 确认改动列表合理

git commit -m "refactor(core): single-pass renderNestedDsd — unify renderToString + renderNestedCustomElements

Delete parse5 dependency, render-nested.ts, visited Set cycle detection,
and __wrapAppShell string concatenation. Replace with renderNestedDsd —
a single async VNode tree traversal that recursively renders nested custom
elements inline via renderDsd().

Net: -45 lines, -1 dependency, 3 production bugs become structurally
impossible.

ADR-0071, SOP-011"
```

### 步骤 7.3：推送

```bash
git push origin dev
```

---

## 最终 Checklist

### 删除项

- [ ] `parse5` 从 `packages/core/deno.json` 删除
- [ ] `packages/core/src/render-nested.ts` 文件删除
- [ ] `renderNestedCustomElements` export 从 `index.ts` 删除
- [ ] 所有 `import { renderNestedCustomElements }` 引用清理
- [ ] `visited` Set 逻辑从 `render-dsd.ts` 删除
- [ ] `renderNestedCustomElements()` 调用从 `render-dsd.ts` 删除
- [ ] `__wrapAppShell` 函数生成从 `entry-renderer.ts` 删除
- [ ] `__wrapAppShell` 调用点从 `entry-renderer.ts` 删除

### 新增项

- [ ] `isRegisteredCustomElement(tag)` 在 `jsx-render-string.ts`
- [ ] CE 渲染分支在 `renderNestedChildren` 遍历中
- [ ] `renderNestedDsd` 导出在 `jsx-render-string.ts`
- [ ] `renderNestedDsd` export 在 `core/src/index.ts`
- [ ] `renderDsd` 内部改用 `await renderNestedDsd(vnode)`
- [ ] `renderRoute` 中 `renderDsd('less-layout')` + page 内容嵌入

### 验证项

- [ ] `deno task check` 通过
- [ ] `deno task test` 全部通过
- [ ] `deno task build` 成功，页面数 ≥ 基线
- [ ] Bug 1: sidebar 出现在 docs 页面（grep count > 0）
- [ ] Bug 2: 无 `[object Object]`（grep count = 0）
- [ ] Bug 3: 无 `<dialog>`（grep count = 0）
- [ ] less-layout 有 DSD template（shadowrootmode count 增加）
- [ ] less-search + less-theme-toggle 在输出中（grep count > 0）
- [ ] 中英文 6 个页面全部通过
- [ ] Registry 组件页面 iframe srcdoc 正常

---

## 风险与回滚

### 风险

- **核心渲染管线改动** — 如果 `renderNestedDsd` 有逻辑错误，可能影响所有 351 个页面。
- **异步传播** — `renderToString` 的调用者如果依赖同步行为，会 break。

### 回滚方案

```bash
git revert HEAD  # 回滚到改动前
git push origin dev
```

### 回滚触发条件

- 类型检查不通过
- 测试不通过
- 构建失败
- 验证步骤中任何关键指标（sidebar/search/registry）不达标
