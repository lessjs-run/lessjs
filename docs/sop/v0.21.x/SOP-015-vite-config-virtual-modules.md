# SOP-015: Vite 配置 — Virtual Module 解析（@deno/vite-plugin 冲突）

> **版本**: 1.0
> **日期**: 2026-05-25
> **关联 ADR**: ADR-0041 (ESM Module Graph First)

## 症状

消费者项目运行 `deno task build` 时报错：

```
[plugin deno] Error: Unsupported scheme "virtual" for module "virtual:less-hono-entry"
```

## 根因

`@deno/vite-plugin` 的 `resolveId` 钩子（`enforce: 'pre'`）对所有模块 ID 调用 Deno 原生加载器。当遇到 `virtual:less-hono-entry` 时，Deno 原生 loader 无法识别 `virtual:` 协议前缀，直接抛出错误。LessJS 插件的 `resolveId` 和 `load` 钩子无法被调用，因为 `@deno/vite-plugin` 先一步失败。

## 修复

在 `vite.config.ts` 中，在 `deno()` 插件之前添加一个 `enforce: 'pre'` 的解析钩子，拦截所有 `virtual:*` ID 并返回 Vite 约定的 `\0` 前缀格式（让 LessJS 插件的 `load` 钩子处理内容）：

```ts
import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';
import { lessjs } from '@openelement/app';

export default defineConfig({
  plugins: [
    // SOP-015: Virtual module passthrough — @deno/vite-plugin doesn't
    // support the "virtual:" scheme. This resolve hook intercepts virtual
    // module IDs before @deno/vite-plugin, letting the lessjs plugin handle them.
    { name: 'virtual-passthrough', resolveId(id) { if (id.startsWith('virtual:')) return '\0' + id; }, enforce: 'pre' },
    deno(),
    lessjs({...}),
  ],
});
```

### 工作原理

1. `virtual-passthrough`（`enforce: 'pre'`）先于 `deno()` 运行
2. 遇到 `virtual:less-hono-entry` → 返回 `\0virtual:open-hono-entry`（Vite 虚拟模块约定格式）
3. `deno()` 的 `resolveId` 不会再被调用
4. Vite 进入 `load` 阶段 → LessJS 的 `less:virtual-entry` 插件 `load` 钩子识别 `\0` 前缀并提供虚拟模块内容

## 排查步骤

1. 确认 `vite.config.ts` 中有 `virtual-passthrough` 解析钩子
2. 确认返回格式为 `'\0' + id`（`\0` 是 Vite 虚拟模块约定）
3. 确认 `@deno/vite-plugin` 版本 >= 2
4. 确认 `deno.json` 中有 `"@deno/vite-plugin": "npm:@deno/vite-plugin@2"`
