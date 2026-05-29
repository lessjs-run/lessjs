# ADR-0061: 框架层与 Vite 虚拟模块解耦

> **Status**: PROPOSED\
> **Date**: 2026-05-29\
> **Target**: v0.26.0\
> **Replaces**: 部分替代 ADR-0018 中"通过虚拟模块暴露数据"的设计\
> **Related**: ADR-0018 (Zero Module State), ADR-0050 (Layered Package Architecture), ADR-0049 (Architecture Debt First)

---

## Context

### 背景

LessJS 目前有 3 类 Vite 虚拟模块（virtual modules）在路由组件和框架生成代码中使用：

| 虚拟模块                 | 消费方                                      | 提供方                                  |
| ------------------------ | ------------------------------------------- | --------------------------------------- |
| `virtual:less-nav`       | 55 个路由文件                               | `@lessjs/content` 的 `virtualNavPlugin` |
| `virtual:less-blog-data` | 5 个路由文件 + `entry-renderer.ts` 生成代码 | `@lessjs/content` 的 `blog-data-plugin` |
| `virtual:less-i18n-data` | `entry-renderer.ts` 生成代码                | `@lessjs/i18n` 的 `i18n-data-plugin`    |

### 问题

1. **框架层依赖构建工具**：路由组件必须通过 Vite 虚拟模块机制获取导航/博客/i18n 数据，离开 Vite 环境无法运行。这与 ADR-0050 确立的 Layered Package Architecture 矛盾——框架包 `@lessjs/content` 和 `@lessjs/i18n` 的数据应对构建工具透明。

2. **IDE 体验差**：虚拟模块没有真实的类型定义文件，IDE 无法跳转到定义、无法自动补全。路由类型生成器需要通过 `declare module 'virtual:less-routes'` 手动声明类型。

3. **数据管道冗余**：数据流是 `loadData() → ctx.plugins.xxxOptions → virtual module plugin.load() → virtual:less-xxx export → route import`。虚拟模块本身不做数据转换，只是将已有的内存数据包装为 ESM 导出。这个"管道"角色完全可以用普通的包导出替代。

4. **entry-renderer 硬编码**：生成的 entry 代码中包含 `from "virtual:less-blog-data"` 和 `from "virtual:less-i18n-data"` 字面量，这些字符串是运行时 Vite 依赖性——框架生成代码知道构建工具的实现细节。

5. **阻碍未来演进**：我们的愿景是"dev 模式零 bundler，生产构建 Vite 只做打包"。只要虚拟模块存在于路由组件 import 中，路由源码就无法脱离 Vite 环境运行。

### 架构愿景（来自 ADR-0050）

```
框架层（纯 ESM，零构建工具依赖）
    ↓
数据层（框架承包导出，@lessjs/content/nav, @lessjs/i18n/data）
    ↓
构建适配器（Vite，只做 alias 映射 + tree-shaking + 打包）
```

---

## Decision

### 核心决策

**分三步移除所有 `virtual:less-*` 虚拟模块，改用框架包的子路径导出。**

#### 第一步：新增子路径导出（P0）

`@lessjs/content` 新增以下子路径：

```
@lessjs/content/nav   → 导出 navSections, headerNav（来自 scanNavData 结果）
@lessjs/content/blog  → 导出 posts, getPostBySlug, getBlogOptions（来自 loadBlogData 结果）
```

`@lessjs/i18n` 新增以下子路径：

```
@lessjs/i18n/data  → 导出 locales, getDefaultLocale, getI18nOptions（来自 loadI18nData 结果）
```

**数据新鲜度保证**：子路径导出使用惰性函数模式，而非静态对象。每次 import 时通过框架内部的数据源获取最新数据，保证 dev 模式下的 HMR 数据刷新效果不变。

#### 第二步：迁移所有消费方（P0）

- **55 个路由文件**：`import { navSections } from 'virtual:less-nav'` → `import { navSections } from '@lessjs/content/nav'`
- **5 个路由文件**：`import { posts, getPostBySlug } from 'virtual:less-blog-data'` → `import { posts, getPostBySlug } from '@lessjs/content/blog'`
- **entry-renderer.ts 生成代码**：不再生成含 `virtual:less-blog-data` 和 `virtual:less-i18n-data` 的 import 语句，改用 `@lessjs/content/blog` 和 `@lessjs/i18n/data`

迁移通过自动化 codemod 脚本执行，保证一致性。

#### 第三步：移除虚拟模块基础设施（P1）

- 移除 `@lessjs/content` 中的 `virtualNavPlugin` 和 `blog-data-plugin` 的虚拟模块注册逻辑
- 移除 `@lessjs/i18n` 中的 `i18n-data-plugin` 的虚拟模块注册逻辑
- 移除 `@lessjs/adapter-vite` 中对应虚拟模块的 `resolveId`/`load` 处理
- `@lessjs/protocols/virtual-ids` 中移除对应的常量

#### 向后兼容策略

- v0.26.0：Vite 插件保留 `virtual:less-nav` → `@lessjs/content/nav` 的 alias 映射（deprecated warning）
- v0.27.0：移除 alias 兼容层

---

## Consequences

### 正面影响

1. **框架层真正零构建工具依赖**：路由组件可以在任何 ESM 环境运行（Deno、Node、Bun），不依赖 Vite 虚拟模块
2. **IDE 体验改善**：所有 import 指向真实文件，TypeScript 类型检查、跳转定义、自动补全正常工作
3. **概念简化**：用户不需要理解"虚拟模块"概念，只需要理解标准的 ESM import
4. **entry-renderer 解耦**：生成的 entry 代码只包含标准 ESM import，不含 Vite 特有的 `virtual:` 协议
5. **包依赖图改善**：`@lessjs/content` 和 `@lessjs/i18n` 不再需要与 Vite 插件机制耦合
6. **为未来铺路**：这是实现"dev 模式零 bundler"的奠基工作

### 负面影响

1. **55 个路由文件需要一次性迁移**：这是 v0.26.0 最大的工作量，但可以通过 codemod 自动化
2. **子路径导出增加包管理的复杂度**：需要在 `deno.json` 和 `package.json` 中正确配置 exports map
3. **数据新鲜度需要重新验证**：从虚拟模块的 `load()` 钩子（每次请求重新执行）变为 ESM 模块缓存后，需要确保 dev 模式下的数据刷新行为不变
4. **短期会有 deprecated warning 噪声**：在兼容期内，使用旧 `virtual:less-*` 路径的用户会看到警告

### 中性影响

- 路由组件的**运行时行为不变**：数据内容、格式、语义完全一致
- 构建产物的**体积不变**：tree-shaking 效果与虚拟模块相同
- 此决策**不涉及移除 Vite**：生产构建仍然使用 Vite，只是 Vite 的职责从"数据管道 + 打包"收缩为"alias 映射 + 打包"

---

## Alternatives Considered

### 方案 A：保持现状

不修改任何虚拟模块，维持当前的耦合。

**拒绝理由**：

- 与 ADR-0050 Layered Package Architecture 的"框架包不应泄露构建工具依赖"原则矛盾
- 阻碍"dev 模式零 bundler"这个长期目标
- 虚拟模块的 IDE 体验问题持续存在
- 技术债务随时间增长（更多路由文件意味着更大的迁移成本）

### 方案 B：完全去掉 Vite

不仅是移除虚拟模块，而是用 Deno 原生工具链替代 Vite。

**拒绝理由**：

- Deno 生态的打包、HMR、CSS 处理能力尚不成熟
- Vite 的插件生态（如 @hono/vite-dev-server）提供了大量开箱即用的能力
- 完全去掉 Vite 的工程成本远超当前版本范围
- 这不是"框架层解耦"的范围——我们的目标是让框架层不依赖 Vite，而不是不用 Vite

### 方案 C：用 import map 映射代替子路径导出

```
// deno.json
{
  "imports": {
    "@lessjs/content/nav": "./packages/content/src/nav/index.ts"
  }
}
```

**拒绝理由**：

- import map 是环境配置，不是包自身的 API 契约
- 用户在自己的项目中需要手动配置 import map 才能使用
- 子路径导出（exports map）才是包的正式 API 声明

### 方案 D：保留虚拟模块 ID，改为框架包 re-export

Vite 插件将 `virtual:less-nav` 映射到 `@lessjs/content/nav` 的 re-export。

**部分采用**：

- 这实际上是向后兼容策略，在 v0.26.0 使用
- 但不应作为长期方案，因为仍保留了 `virtual:` 协议的使用

---

## 迁移计划

### v0.26.0（本次）

1. `@lessjs/content` 新增 `/nav`、`/blog` 子路径导出
2. `@lessjs/i18n` 新增 `/data` 子路径导出
3. codemod 脚本批量迁移 55 + 5 个路由文件
4. entry-renderer 生成代码切换为新路径
5. Vite 插件添加 `virtual:less-*` → framework 子路径的 alias 映射（兼容层）
6. 全量回归测试（typecheck + test + build + e2e）

### v0.27.0（后续）

1. 移除 Vite 插件中的 `virtual:less-*` alias 兼容层
2. 移除 `@lessjs/content` 和 `@lessjs/i18n` 中的虚拟模块插件代码
3. 移除 `@lessjs/protocols/virtual-ids` 中废弃的常量

---

## Acceptance Criteria

- [ ] `@lessjs/content/nav` 导出 `navSections`, `headerNav`
- [ ] `@lessjs/content/blog` 导出 `posts`, `getPostBySlug`, `getBlogOptions`
- [ ] `@lessjs/i18n/data` 导出 `locales`, `getDefaultLocale`, `getI18nOptions`
- [ ] 55+5 个路由文件不再 import `virtual:less-*`
- [ ] entry-renderer 生成代码不含 `virtual:` 前缀的 import
- [ ] `deno task typecheck` 通过
- [ ] `deno task lint` 通过
- [ ] `deno task test` 通过
- [ ] `deno task build` 通过（SSG/SSR 构建成功）
- [ ] `deno task test:e2e` 通过（Playwright 92+ 用例通过）
- [ ] dev 模式（`deno task dev`）导航数据、博客数据、i18n 数据正常加载
- [ ] 生成的 `www/dist/` 产物与原版行为一致
