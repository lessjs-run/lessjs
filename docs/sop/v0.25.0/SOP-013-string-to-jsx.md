# SOP-013: 31 Pages String → JSX Migration

> Priority: P1 | Nature: 内容渲染重构 | Time: 2d

## Objective

31 个路由页面从 `return \`<less-layout...>\``字符串模板 → JSX`return (<less-layout>...</less-layout>)`。

## Why

| 字符串模板                  | JSX                   |
| --------------------------- | --------------------- |
| XSS 风险（忘记 escapeHtml） | TypeScript 编译期安全 |
| 无语法高亮/自动补全         | IDE/Prettier 原生支持 |
| 运行时字符串拼接            | 编译期 VNode 创建     |
| SSR 无法静态分析            | AST 可优化            |

## Step-by-Step

### Step 1: 审计所有页面

```bash
grep -rn "return \`<" www/app/routes/ --include="*.ts" --include="*.tsx" | grep -v "dist/"
```

预期：~31 个文件。

### Step 2: 创建迁移模板

每个页面从：

```typescript
// Before
override render() {
  const nav = JSON.stringify(filterNav(navSections));
  return `<less-layout nav-items='${nav}' current-path="/guide/getting-started">
    <div class="container"><h1>Title</h1>...</div>
  </less-layout>`;
}
```

到：

```typescript
// After
override render() {
  const nav = JSON.stringify(filterNav(navSections));
  return (
    <less-layout navItems={nav} currentPath="/guide/getting-started">
      <div class="container"><h1>Title</h1>...</div>
    </less-layout>
  );
}
```

### Step 3: 批量迁移

按优先级分批：

| Batch | Pages                                      | Count |
| ----- | ------------------------------------------ | ----- |
| 1     | engine/ (dsd, islands, architecture 等)    | 8     |
| 2     | guide/ (getting-started, configuration 等) | 14    |
| 3     | architecture/ (index, adapter-vite 等)     | 6     |
| 4     | 其他 (index/index, registry 等)            | 3     |

每批迁移后运行 `deno task build` 验证。

### Step 4: 特殊处理

- `_renderZh()` / `_renderEn()` → 改为 `const isZh` ternary inline JSX
- `nav-items` → `navItems`（JSX 不支持连字符属性）
- `${JSON.stringify(x)}` → `{JSON.stringify(x)}`（JSX 表达式）
- `&larr;` / `&rarr;` → `←` / `→` Unicode 字符（JSX 中安全）

### Step 5: 验证

- [ ] 31 页面全部迁移到 JSX
- [ ] `deno task build` 通过
- [ ] 页面视觉一致性不变
- [ ] 无 `return \`<` 残留
