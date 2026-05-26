# 消费者 deno.json 臃肿问题 — 框架内部实现细节泄露

> **日期**: 2026-05-26
> **关联**: ADR-0042 (Import Map Universal Resolution), ADR-0043 (external + noExternal)
> **影响**: 所有 LessJS 消费者项目

---

## 问题

一个 3 页的个人博客项目，`deno.json` imports 字段多达 21 条。其中大部分是框架内部实现细节，消费者不应感知。

### 当前消费者 deno.json（SisyphusZheng）

```json
{
  "imports": {
    "vite": "npm:vite@8.0.10",
    "@lessjs/app": "jsr:@lessjs/app@^0.21.16",
    "@lessjs/adapter-lit": "jsr:@lessjs/adapter-lit@^0.21.16",
    "@lessjs/adapter-vite": "jsr:@lessjs/adapter-vite@^0.21.16",
    "@lessjs/content": "jsr:@lessjs/content@^0.21.16",
    "@lessjs/core": "jsr:@lessjs/core@^0.21.16",
    "@lessjs/core/navigation": "jsr:@lessjs/core@^0.21.16/navigation",
    "@lessjs/i18n": "jsr:@lessjs/i18n@^0.21.16",
    "@lessjs/signals": "jsr:@lessjs/signals@^0.21.16",
    "@lessjs/signals/framework": "jsr:@lessjs/signals@^0.21.16/framework",
    "@lessjs/ui": "jsr:@lessjs/ui@^0.21.16",
    "@lessjs/ui/open-props-tokens": "jsr:@lessjs/ui@^0.21.16/open-props-tokens",
    "@lessjs/ui/": "jsr:@lessjs/ui@^0.21.16/",
    "hono": "npm:hono@^4.7.0",
    "hono/secure-headers": "npm:hono@^4.7.0/secure-headers",
    "parse5": "npm:parse5@^7.3.0",
    "entities": "npm:entities@^6.0.0",
    "entities/lib/escape.js": "npm:entities@^6.0.0/lib/escape.js"
  }
}
```

### 应该的目标

```json
{
  "imports": {
    "@lessjs/core": "jsr:@lessjs/core@^0.21.16",
    "@lessjs/ui": "jsr:@lessjs/ui@^0.21.16",
    "@lessjs/app": "jsr:@lessjs/app@^0.21.16"
  }
}
```

3 条 import 应该覆盖一个 LessJS 消费者项目的全部需求。

---

## 根因分析

### 泄漏清单

| 条目                           | 类型              | 为什么是泄漏                                  | 该由谁处理   |
| ------------------------------ | ----------------- | --------------------------------------------- | ------------ |
| `parse5`                       | SSR 传递依赖      | Rolldown external 策略要求消费者声明          | adapter-vite |
| `entities`                     | SSR 传递依赖      | 同上                                          | adapter-vite |
| `entities/lib/escape.js`       | 子路径 workaround | ADR-0042 ESM 解析泄露的产物                   | adapter-vite |
| `hono`                         | SSR 运行时        | 入口代码 import hono，消费者必须声明          | adapter-vite |
| `hono/secure-headers`          | SSR 运行时子路径  | 同上                                          | adapter-vite |
| `@lessjs/signals`              | 框架内部依赖      | 页面代码可能不用 signal，但 core re-export 了 | core         |
| `@lessjs/signals/framework`    | 框架内部子路径    | 同上                                          | core         |
| `@lessjs/adapter-lit`          | 可选适配器        | 不用 Lit 组件的项目不需要                     | adapter-vite |
| `@lessjs/adapter-vite`         | 构建工具          | 消费者通过 task 命令调用，不需要 import       | —            |
| `@lessjs/core/navigation`      | 框架内部子路径    | 消费者一般不需要直接调用                      | core         |
| `@lessjs/ui/` (trailing slash) | 子路径映射        | Rolldown 不需要消费者配这个                   | adapter-vite |
| `@lessjs/ui/open-props-tokens` | 框架内部子路径    | 通过 `@lessjs/ui` 应自动可用                  | ui           |
| `vite`                         | 构建工具          | 不需要显式声明——Deno task 自动拉              | —            |

### 为什么会泄露

ADR-0042/0043 的 Clean Architecture 设计把 `parse5`/`entities`/`hono` 标记为 `external`（不打包到 SSR bundle），让 Deno runtime 在 `import()` 时解析。这本身是干净的。但**构建这个决议没有被 adapter-vite 内化**——消费者必须自己在 deno.json 里声明这些传递依赖。

具体链路：

```
消费者 vite.config.ts
  └── lessjs() 插件
        └── build-ssg.ts
              └── viteBuild({ external: ['parse5', 'entities', 'hono'] })
                    └── SSR bundle 带有裸 import 'parse5' / 'entities/lib/escape.js' / 'hono'
                          └── Deno import() 时需要这些 specifier
                                └── 消费者 deno.json imports 必须声明 ← 泄漏点
```

理想链路（内化）：

```
消费者 vite.config.ts
  └── lessjs() 插件
        └── adapter-vite 内部已包含所有 SSR 传递依赖的 import map
              └── 消费者 deno.json 只需 LessJS 顶层包
```

---

## 方案

**责任归属 `@lessjs/app`**。它是消费者唯一必装入口（`vite.config.ts` 里 `import { lessjs } from '@lessjs/app'`），不管底层用什么构建工具。

### 流程

```
@lessjs/app 初始化
  ├── 读取 consumer 的 deno.json
  ├── 调用 external-resolver（adapter-vite 已实现 pre-resolution）
  ├── 生成 import map（parse5/entities/hono 的完整子路径映射）
  ├── 注入到 SSR bundle（virtual:less-import-map）
  └── 消费者 deno.json：只需 @lessjs/core + @lessjs/ui + @lessjs/app（3 条）

adapter-vite 的 external-resolver.ts 保持现状
  ├── 继续生成 Rolldown external 列表（构建时）
  └── manifest 暴露给 app 层用于 import map 生成
```

### 为什么不是 adapter-vite

`adapter-vite` 是 optional——消费者可以选择其他构建工具。import map 的生成是框架级能力（消费者总是需要 parse5/entities/hono 的映射），应该由必装入口 `@lessjs/app` 统一处理。adapter-vite 的 external-resolver 继续做它擅长的——Rolldown external 列表——但消费者 import map 的注入由 app 层负责。

### 消费者 deno.json 变化

```diff
 {
   "imports": {
+    "@lessjs/core": "jsr:@lessjs/core@^0.21.16",
+    "@lessjs/ui": "jsr:@lessjs/ui@^0.21.16",
+    "@lessjs/app": "jsr:@lessjs/app@^0.21.16"
-    "vite": "npm:vite@8.0.10",
-    "@lessjs/adapter-lit": "jsr:@lessjs/adapter-lit@^0.21.16",
-    "@lessjs/adapter-vite": "jsr:@lessjs/adapter-vite@^0.21.16",
-    "@lessjs/content": "jsr:@lessjs/content@^0.21.16",
-    "@lessjs/core/navigation": "jsr:@lessjs/core@^0.21.16/navigation",
-    "@lessjs/i18n": "jsr:@lessjs/i18n@^0.21.16",
-    "@lessjs/signals": "jsr:@lessjs/signals@^0.21.16",
-    "@lessjs/signals/framework": "jsr:@lessjs/signals@^0.21.16/framework",
-    "@lessjs/ui/open-props-tokens": "jsr:@lessjs/ui@^0.21.16/open-props-tokens",
-    "@lessjs/ui/": "jsr:@lessjs/ui@^0.21.16/",
-    "hono": "npm:hono@^4.7.0",
-    "hono/secure-headers": "npm:hono@^4.7.0/secure-headers",
-    "parse5": "npm:parse5@^7.3.0",
-    "entities": "npm:entities@^6.0.0",
-    "entities/lib/escape.js": "npm:entities@^6.0.0/lib/escape.js"
   }
 }
```

18 条 → 3 条。这是 ADR-0047 的自然延伸——pre-resolution 解决了 Rolldown 不解析子路径，`@lessjs/app` 解决消费者不感知子路径。

---

## 涉及文件

| 文件                                             | 操作                                           |
| ------------------------------------------------ | ---------------------------------------------- |
| `packages/app/src/index.ts`                      | MODIFY — 自动注册消费者 import map（核心改动） |
| `packages/adapter-vite/src/external-resolver.ts` | MODIFY — manifest 暴露给 app 层                |
| `packages/adapter-vite/src/cli/build-ssg.ts`     | MODIFY — 使用 app 传递的 import map            |
| `docs/adr/ADR-0047`                              | UPDATE — 记录消费者 deno.json 简化             |
