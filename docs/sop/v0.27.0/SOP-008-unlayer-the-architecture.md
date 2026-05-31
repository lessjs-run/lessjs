# SOP-008: 架构分层净化 — 消除框架层 UI 数据注入

> Version: v0.28.x
> Status: Architecture Audit Complete → Implementation
> Date: 2026-05-31
> Supersedes: SOP-007 (SSR Manifest Nav Fix) — 完全取代，删除其所有产物
> Trigger: 架构审计发现框架层 / 内容层 / UI 层 / 应用层 的依赖方向被颠倒

---

## 一、发生了什么

SOP-007 引入了一个架构层面的严重错误：把 `navSections` 和 `headerNav` 这两个 **UI 布局组件的专属数据**，通过框架层的 `window.__ROUTE_MANIFEST__` 注入给 `less-layout`。

### 错误的依赖链（当前）

```
content/nav/scanner
  ↓
_generated-route-manifest.ts     ← 把 UI 数据 + 框架数据混装在一起
  ↓
adapter-vite/ssg-render.ts       ← 框架层读取这个文件，正则解析 JSON
  ↓ preload to globalThis
adapter-vite/ssg-postprocess.ts  ← 框架层注入 <script>window.__ROUTE_MANIFEST__</script>
  ↓ SSR 时写 globalThis，post-process 时写 <script>
less-layout._manifestData()      ← UI 组件从全局变量拿 UI 数据
router #parseLocales()           ← 路由器也从全局变量拿 locales
```

**问题本质**：

1. **框架层不应该知道 `navSections`/`headerNav` 的存在**。这是 less-layout 这个具体 UI 组件的私有配置。
2. **数据流向颠倒了**：应该是 UI 层直接 import 内容层，而不应该绕道框架层注入。
3. **`__ROUTE_MANIFEST__` 名实不符**：名字暗示"路由清单"，但实际装的是 UI 布局数据。

### 业界对比（5/5 框架一致）

| 框架             | Layout 获取 Nav 数据的方式                  | 是否通过 globalThis/window |
| ---------------- | ------------------------------------------- | -------------------------- |
| Astro            | `getCollection('docs')` 显式查询            | ❌ 否                      |
| SvelteKit        | `data` prop 继承自 `+layout.server.js`      | ❌ 否                      |
| Fresh            | 直接 import 或 handler 传 props             | ❌ 否                      |
| Next.js          | `layout.tsx` 接收 params，直接 fetch/import | ❌ 否                      |
| Starlight(Astro) | `getCollection('docs')` 显式查询            | ❌ 否                      |

**没有任何主流框架往 `window.xxx` 注入 UI 组件的导航/布局配置数据。**

### 为什么 SOP-007 会是错的

SOP-007 的正确直觉：消除 route 页面中手写的 `nav-items=` / `header-nav=` / `current-path=` 属性。

SOP-007 的错误方案：把数据绕道框架层注入 `globalThis`，让 UI 组件从全局读。

**正确方案**：`navSections` 和 `headerNav` 是构建时生成的内容数据，应该由 UI 组件直接 `import` — 这是 JS/TS 模块系统最基本的能力。绕道 `globalThis` 是**用全局变量模拟 import**，在 2026 年是反模式。

---

## 二、正确的分层架构

### 依赖方向（单向向下）

```
Application (www/)           消费: UI + Content + Framework
    ↓
UI (@lessjs/ui)              消费: Content + Framework + Style
    ↓
Content (@lessjs/content)    消费: Framework
    ↓
Framework (@lessjs/core + adapter-vite)  消费: 无（底层）
```

### 正确数据流

```
@lessjs/content
  └─ nav/scanner → 构建时扫描路由
        ↓
  _generated-nav.ts         ← 导出 navSections / headerNav
        ↓
  www/deno.json import map  ← "@lessjs/content/nav": "./app/data/_generated-nav.ts"
        ↓
@lessjs/ui/less-layout.tsx
  └─ import { navSections, headerNav } from '@lessjs/content/nav'
        ↓
  _rawNavItems() / _headerNav() — 作为 default（fallback 到 prop/attr）
```

**关键认知**：

- `@lessjs/content/nav` 是一个内容包的子导出路径
- `less-layout` 从它 import 数据，这是正常的包依赖关系
- 如果某个项目不用 `less-layout`，nav 数据仍然可以被任何其他组件 import
- 如果 `@lessjs/content/nav` 不可用，`less-layout` fallback 到空数组

### 框架层仍然可以做的事情（但必须中立）

如果路由器需要运行时知道 locales 列表（用于 SPA 导航时构造 locale 路径），有两种正确方案：

**方案 A（推荐）**：localStorage / URL 推断

- 浏览器可以从当前 URL path `/zh/guide/...` 推断 locales
- 或者从 `<html lang="...">` 读取默认 locale
- 不需要任何全局注入

**方案 B**：仅注入纯路由数据

- `window.__ROUTE_CONFIG__ = { locales: ["en","zh"], basePath: "/" }`
- **不含** navSections、headerNav 等 UI 专属数据
- 用 `__CONFIG__`（配置）而非 `__MANIFEST__`（清单）

---

## 三、删除清单（无情删除）

### 文件级删除

| 文件                                        | 原因                                 |
| ------------------------------------------- | ------------------------------------ |
| `www/app/data/_generated-route-manifest.ts` | UI 数据 + 框架数据混杂，应拆分或删除 |

### 函数级删除

| 文件:行号                                 | 删除内容                     | 原因                            |
| ----------------------------------------- | ---------------------------- | ------------------------------- |
| `ui/less-layout.tsx:553-568`              | `_manifestData<T>(key)` 方法 | UI 组件不应读 globalThis 拿数据 |
| `adapter-vite/ssg-postprocess.ts:464-479` | `injectRouteManifest()` 函数 | 框架层不应注入 UI 数据          |
| `adapter-vite/index.ts:43`                | `injectRouteManifest` 导出   | 随函数删除                      |

### 代码块级删除

| 文件:行号                                | 删除内容                                                | 原因                                |
| ---------------------------------------- | ------------------------------------------------------- | ----------------------------------- |
| `adapter-vite/cli/ssg-render.ts:345-359` | SSR 前 globalThis manifest 预加载                       | 不再需要，less-layout 直接 import   |
| `adapter-vite/cli/ssg-render.ts:546-562` | post-build manifest 注入                                | 不再需要                            |
| `adapter-vite/cli/ssg-render.ts:499`     | `injectRouteManifest` import 解构                       | 随函数删除                          |
| `router/client-router.ts:302-307`        | `__ROUTE_MANIFEST__.locales` fallback                   | 用 URL 推断替代                     |
| `ui/less-layout.tsx:532`                 | `this._manifestData<NavSection[]>('navSections')` 调用  | 改为 fallback 到 `[]` 或直接 import |
| `ui/less-layout.tsx:546`                 | `this._manifestData<HeaderNavLink[]>('headerNav')` 调用 | 同上                                |

### 导入删除

| 文件:行号                            | 删除内容                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `ui/less-layout.tsx:34`              | 如果有 `import { ... } from '@lessjs/content/nav'` 但不应有 `createContext` |
| `adapter-vite/cli/ssg-render.ts:499` | `injectRouteManifest` from import                                           |

---

## 四、新增清单

### `ui/less-layout.tsx`

```typescript
// 新增 import（在文件顶部的 import 区域）
import { navSections as _navSections, headerNav as _headerNav } from '@lessjs/content/nav';

// _rawNavItems() 修改为：
private _rawNavItems(): NavSection[] {
  try {
    const prop = (this as Record<string, unknown>).navItems;
    if (prop && Array.isArray(prop)) return prop as NavSection[];
    const raw = this.getAttribute('nav-items');
    if (raw) return JSON.parse(raw);
    // Default: directly from @lessjs/content/nav
    // Falls back to [] if the import is not available (non-LessJS environments)
    return (_navSections as NavSection[]) ?? [];
  } catch (e) {
    console.warn('[less-layout] Failed to parse nav-items JSON:', e);
    return [];
  }
}

// _headerNav() 修改为：
private _headerNav(): HeaderNavLink[] {
  try {
    const prop = (this as Record<string, unknown>).headerNav;
    if (prop && Array.isArray(prop)) return prop as HeaderNavLink[];
    const raw = this.getAttribute('header-nav');
    if (raw) return JSON.parse(raw);
    // Default: directly from @lessjs/content/nav
    return (_headerNav as HeaderNavLink[]) ?? [];
  } catch (e) {
    console.warn('[less-layout] Failed to parse header-nav JSON:', e);
    return [];
  }
}
```

### `router/client-router.ts`

删除 `__ROUTE_MANIFEST__` fallback，locale 列表通过以下方式推断：

1. `<less-layout>` 上的 `locales` 属性（SSR 输出中保留）
2. 如果 SSR 输出中没有，从 URL 后缀推断（如 `/zh/xxx`）
3. 无论如何，fallback 为 `['en']`（已有的逻辑）

---

## 五、实施步骤（Step by Step）

### Step 1: 删除 `_manifestData()`

**文件**: `packages/ui/src/less-layout.tsx`

- 删除第 553-568 行的 `_manifestData<T>` 方法体及其 JSDoc

### Step 2: 修改 `_rawNavItems()` 和 `_headerNav()`

**文件**: `packages/ui/src/less-layout.tsx`

- 在文件顶部新增 `import { navSections as _navSections, headerNav as _headerNav } from '@lessjs/content/nav';`
- `_rawNavItems()` fallback 从 `this._manifestData('navSections')` 改为 `_navSections ?? []`
- `_headerNav()` fallback 从 `this._manifestData('headerNav')` 改为 `_headerNav ?? []`

### Step 3: 删除 `injectRouteManifest()`

**文件**: `packages/adapter-vite/src/ssg-postprocess.ts`

- 删除第 464-479 行（整个函数 + JSDoc）
- 删除第 15 行注释中对该函数的引用

**文件**: `packages/adapter-vite/src/index.ts`

- 删除第 43 行的 `injectRouteManifest,`

### Step 4: 清理 `ssg-render.ts`

**文件**: `packages/adapter-vite/src/cli/ssg-render.ts`

- 删除第 345-359 行（SSR 前 manifest 预加载块）
- 删除第 546-562 行（post-build manifest 注入块）
- 删除第 499 行 `injectRouteManifest` 来自 import 解构

### Step 5: 清理 `client-router.ts`

**文件**: `packages/router/src/client-router.ts`

- 删除第 302-307 行（`__ROUTE_MANIFEST__.locales` fallback）
- locale 列表从 `<less-layout locales='["en","zh"]'>` 属性获取（SSR 时注入）

### Step 6: 删除 `_generated-route-manifest.ts`

**文件**: `www/app/data/_generated-route-manifest.ts`

- 删除整个文件
- 如其他代码引用此文件（通过 import），一并清理

### Step 7: 检查 `__ROUTE_MANIFEST__` 残余引用

```bash
grep -rn "__ROUTE_MANIFEST__" packages/ www/app/ --include="*.ts" --include="*.tsx"
```

- 确保零残留

### Step 8: `deno.json` import map 验证

**文件**: `www/deno.json`

- 确认 `"@lessjs/content/nav": "./app/data/_generated-nav.ts"` 仍然存在且正确
- 如有 `@lessjs/content/nav` 的其他 import map 引用，确认路径

### Step 9: 构建验证

```bash
cd www && deno task build
```

- 构建成功
- 产物 HTML 中包含 header nav + sidebar 内容

### Step 10: E2E 验证（可选但推荐）

- 首页 header nav 正常渲染
- 文档页 sidebar 正常渲染
- i18n 语言切换正常
- SPA 导航后 nav 仍然存在

---

## 六、验收标准

- [ ] `packages/ui/src/less-layout.tsx` 中 `_manifestData()` 方法已删除
- [ ] `packages/adapter-vite/src/ssg-postprocess.ts` 中 `injectRouteManifest()` 已删除
- [ ] `packages/adapter-vite/src/cli/ssg-render.ts` 中所有 manifest 相关代码已删除
- [ ] `packages/router/src/client-router.ts` 中 `__ROUTE_MANIFEST__` 引用已删除
- [ ] `www/app/data/_generated-route-manifest.ts` 已删除
- [ ] 全仓库 `__ROUTE_MANIFEST__` grep 结果为零或仅剩注释
- [ ] `deno task build` 在 www 目录下成功
- [ ] 构建产物的 HTML 中包含 header nav + sidebar
- [ ] `less-layout` 的 import 来自 `@lessjs/content/nav`（而非 globalThis）
- [ ] `deno fmt --check` + `deno lint` 通过
- [ ] 所有现有测试仍然通过

---

## 七、回滚计划

如果直接 import 方案在 SSR 时出现问题（理论上不应该）：

1. 恢复 `_manifestData()` 和 `injectRouteManifest()`
2. 但改为只注入框架中立数据（locales, basePath）
3. `navSections`/`headerNav` 仍然走 prop/attribute

---

## 八、影响范围

| 包             | 影响                       | 风险                    |
| -------------- | -------------------------- | ----------------------- |
| @lessjs/ui     | less-layout 的数据来源改变 | 低 — import 是标准 JS   |
| @lessjs/router | 移除 manifest fallback     | 低 — URL 推断是标准做法 |
| adapter-vite   | 删除 2 个函数 + 1 个功能   | 低 — 删除死代码         |
| www            | 删除 1 个文件              | 低 — 无人引用           |
