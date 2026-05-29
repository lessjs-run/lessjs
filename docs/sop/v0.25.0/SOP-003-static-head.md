# SOP-003: `static head` Page Metadata

> Priority: P1 | Nature: 小 feature | Time: 1d | Governing ADR: ADR-0059

## Objective

路由组件通过 `static head` 声明 title/meta，SSG 自动注入 `<head>`，替代手动 `<less-layout head-extras='...'>`。

## Step-by-Step

### Step 1: 类型定义

```typescript
// packages/core/src/dsd-element.ts
interface HeadConfig {
  title?: string;
  description?: string;
  ogImage?: string;
}

abstract class DsdElement extends HTMLElement {
  static head?: HeadConfig;
}
```

### Step 2: Route Scanner 读取

**文件**: `packages/adapter-vite/src/route-scanner.ts`

在扫描路由时读取 `static head` 声明：

```typescript
const mod = await import(routeFile);
const head = (mod.default || mod).head as HeadConfig | undefined;
return { ...entry, head };
```

### Step 3: SSG Head 注入

**文件**: `packages/adapter-vite/src/head-injection.ts`

```typescript
export function injectHead(html: string, head?: HeadConfig): string {
  if (!head) return html;
  const tags = [];
  if (head.title) tags.push(`<title>${escapeHtml(head.title)}</title>`);
  if (head.description) {
    tags.push(`<meta name="description" content="${escapeAttr(head.description)}">`);
  }
  const headHtml = tags.join('\n');
  return html.replace('</head>', `${headHtml}\n</head>`);
}
```

### Step 4: Migration

```diff
- <less-layout head-extras='<title>My Page</title><meta name="description" content="...">'>
+ class MyPage extends DsdElement { static head = { title: 'My Page', description: '...' }; }
```

逐步迁移 www 页面，保持 `head-extras` 兼容。

### Step 5: 验证

- [ ] `static head = { title: '...' }` 的页面 title/meta 在 dist HTML 的 `<head>` 中
- [ ] 现有 `head-extras` 页面不受影响
- [ ] 迁移 ≥3 个 www 页面验证
