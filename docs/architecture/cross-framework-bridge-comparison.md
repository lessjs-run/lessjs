# 跨框架桥接架构对比

> 分析目标：组件模型、渲染管线、Builder 之间的桥接，业界怎么做？LessJS 应该怎么适配？

---

## 对比矩阵

| 框架 | 桥1: 组件→渲染（SSR安全） | 桥2: Builder→渲染（代码生成） | 桥3: 渲染内部（状态隔离） | 核心机制 |
|------|--------------------------|------------------------------|--------------------------|---------|
| **Next.js** | `'use client'` 指令 → 编译期分 bundle | 直接 import 真实 TS 文件，webpack/turbopack 打包 | React Fiber 树，每个 SSR 请求独立 | **编译期边界 + 打包器** |
| **Astro** | `.astro` 的 `---` fence → server/client 代码物理分离 | Vite 插件编译 `.astro` → SSR 函数（AST 级别） | 每个组件是纯渲染函数 | **文件级合约 + Vite 编译** |
| **Qwik** | `$()` 后缀 → 优化器识别可序列化边界 | 不需要生成代码——Qwik 本身就是惰性加载 | Resumability，无需水合桥 | **优化器 + 序列化协议** |
| **SolidJS** | Babel `compileSsr` → 拆分 template 和 effect | Babel 编译 JSX → 纯 DOM 指令 | template 克隆，每次独立 | **编译器（比 Babel 还深）** |
| **SvelteKit** | `+page.server.ts` 文件名合约 → server 代码物理隔离 | Svelte 编译器生成纯 JS 类 | 编译输出无状态 | **文件名合约 + 编译器** |
| **Fresh** | `routes/` 下 `handler` 和 `component` 物理分离 | `fresh.gen.ts` 自动生成路由表（AST 扫描） | Preact 水合，每页独立 | **代码生成文件 + Preact hydrate** |
| **LessJS** | `renderDsd()` → `try/catch` 裸标签 fallback | `entry-renderer.ts` 用 `lines.push()` 拼 JS 字符串 | `visited Set<"tag@depth">` 同名同深度误判循环 | **运行时试探 + 字符串拼接** |

---

## 共同模式

六个框架有五个用了**编译器**做桥。只有 LessJS 用运行时试探。

| 框架 | 桥接手段 | 可靠性 |
|------|---------|--------|
| Next.js / Astro / Qwik / SolidJS / SvelteKit | 编译期 AST 分析 + 代码生成 | ✅ 编译不过就构建失败 |
| Fresh | 代码生成（fresh.gen.ts）| ✅ 生成文件可 diff |
| **LessJS** | `lines.push()` + `try/catch` + `visited.has()` | ❌ 错一个 await → `[object Promise]`，没人报警 |

---

## 但 LessJS 的核心约束是"零编译"

ADR-0057、ADR-0065、ADR-0067 反复强调：
- JSX 不是通过 Babel 编译的，是 `@lessjs/core` 的 `jsx-runtime` 原生支持
- `renderToString()` 是纯字符串拼接，不是编译器输出
- 零 Babel/SWC/TypeScript transformer

**这意味着我们不能学 Next.js 加 `'use client'` 指令，不能学 SolidJS 加 Babel 插件。**

---

## 适配 LessJS 的方案

### 桥1：组件→渲染（SSR 安全）

**不能做**：Babel 编译识别浏览器 API

**可以做**：**静态分析——不编译代码，但检查代码。**

```ts
// 新增: packages/core/src/ssr-safety-check.ts
// 这不是编译器。这是一个 lint 规则。
// 在 build 时扫描 render() 方法：
//   - 直接读 location.* → warning
//   - 直接读 document.* → warning  
//   - 调用未标记 @ssrSafe 的外部方法 → warning
```

**对比**：
- SolidJS: Babel 编译整个 JSX 成 template + effect → 编译期保证
- LessJS: 静态分析只检查不转换 → **lint 级别保证，零编译侵入**

### 桥2：Builder→渲染（代码生成）

**不能做**：把整个 builder 换成 Vite 插件 AST 编译

**可以做**：ADR-0070 已经指出的方向 + 参考 Fresh 的 `fresh.gen.ts`

```
Fresh 的做法：
  dev.ts start → 扫描 routes/ → 生成 fresh.gen.ts（TS 文件落盘）→ import 使用

LessJS 可以做的：
  build-ssg.ts → 扫描 routes/ → 生成 _app-shell.ts（TS 文件落盘）→ import 使用
```

`_app-shell.ts` 不是一个字符串拼接的产物，而是一个**真实 TypeScript 文件**，内容像这样：

```ts
// 自动生成，可 diff、可 typecheck
import { wrapAppShell } from '@lessjs/core/entry-bridge';
import { navSections, headerNav } from '@lessjs/generated/nav';

export async function renderPage(content: string, routePath: string, locale: string) {
  return wrapAppShell(content, routePath, {
    navSections,
    headerNav, 
    locales: ['en', 'zh'],
    defaultLocale: 'en',
    locale,
  });
}
```

**对比**：
- Fresh: 生成路由清单文件 → TypeScript 编译器检查
- LessJS: 生成 shell 文件 → TypeScript 编译器检查
- **共同点**：生成的代码是真正的 TypeScript，不是字符串

### 桥3：渲染内部（状态隔离）

**不能做**：parse5 每次 parse 时跟踪全局状态

**可以做**：**不要用 visited Set。用 render() 输出分析。**

当 `renderDsd('less-code-block')` 渲染完成后，它的输出是一个 DSD 模板。如果这个模板中**再次包含** `<less-code-block>`（自引用循环），这才是真正的循环。兄弟节点的同类型组件不是循环。

```ts
// 在 renderNested 的 373-433 行已有逻辑：
// "扫描 DSD children 中是否有新的 CE"
// 把这个已有逻辑提升为循环检测机制即可——不需要 visited Set
```

**对比**：
- React SSR: 每个组件渲染是纯函数，不共享状态
- LessJS: 让 renderNested 的递归自然地发现真循环（render 输出包含同名 tag），不需要 visited Set

---

## 最终建议：三座桥的适配方案

| 桥 | 参考框架 | LessJS 适配 | 新增机制 |
|----|---------|------------|---------|
| **桥1** | SolidJS (compile-time check) | 静态分析 lint，不编译 | `ssr-safety-check.ts`（~50行 glob + regex） |
| **桥2** | Fresh (code generation) | 生成 TS 文件 → typecheck | `_app-shell.ts` 生成器（替换 entry-renderer 557行） |
| **桥3** | React SSR (pure functions) | 删除 visited Set，依赖已有的嵌套检测 | 删除~10行，复用373-433行已有逻辑 |

**共同原则**：三个方案都不引入 Babel/SWC。静态分析只读不写。代码生成只写 TS 文件不拼字符串。循环检测复用已有逻辑。
