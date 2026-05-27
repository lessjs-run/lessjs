# ADR-0055: SSR Bundle Self-Containment

- Status: ACCEPTED
- Date: 2026-05-27
- Supersedes: Partially replaces the "externalize everything" assumption from ADR-0047
- Applies to: v0.23.5+

## Context

v0.23.0 → v0.23.4 的 CI consumer smoke test 连续 5 次失败。修复路径：

1. 解决 resolver 白名单缺 `runtime`
2. 统一版本号解决 JSR 404
3. 补 `alien-signals` 到 consumer import map
4. AST 方式自动发现外部包子路径
5. 补 `hono` 到 consumer import map

每次都绕回来解决**同一个根因**：外部依赖被 externalize 到 SSR bundle，但 consumer
的 `deno.json` import map 里没有这些包。`buildSSG()` 调用 `import(entry.js)` 时
Deno 按 consumer 的 `deno.json` 解析 → 找不到 → 炸。

本质矛盾：

```
SSR 外部化策略: externalize parse5, entities, hono, alien-signals...
                → SSR bundle 里只有 top-level import

运行时执行:      buildSSG() 跑在 consumer 的 --config deno.json 下
                → import map 里没有这些包
                → 💥
```

5 轮修复，其实是 `alien-signals → hono/secure-headers → parse5 → entities` 的
打地鼠游戏。下一个还不会停。

## Decision

**SSR bundle 不外部化 `ssrExternalDefaults` 中的包。将它们 bundle 进 SSR entry，
使 SSR bundle 完全自包含。消除所有运行时 import 解析依赖。**

### Before

```ts
const ssrExternalDefaults = ['parse5', 'entities', 'hono'];
// ...
ssr: { noExternal: allNoExternal, external: manifest.specifiers }
```

### After

```ts
const ssrBundleInline = [/^parse5/, /^entities/, /^hono/];
const allNoExternal = [...defaultNoExternal, ...ssrBundleInline, ...userNoExternal];
// ...
ssr: {
  noExternal: allNoExternal;
}
// external: manifest.specifiers — REMOVED
```

### 理由

- `parse5`、`entities`、`hono` 都是纯 ESM 模块，bundle 无风险
- SSR entry 从 151 KB 增大到约 350-400 KB（仍在可接受范围）
- 导入不需要 consumer import map 任何额外条目
- 不需要 `importmap.json` 生成逻辑（可简化）
- 覆盖所有子路径导出（parse5/lib/escape.js、hono/secure-headers 等）

### 权衡

| 维度        | 外部化 (旧)                  | 自包含 (新)             |
| ----------- | ---------------------------- | ----------------------- |
| Bundle 大小 | ~151 KB                      | ~400 KB                 |
| 运行时依赖  | consumer import map          | 零                      |
| 故障面      | 每个新外部包都是潜在炸弹     | 无                      |
| 复杂度      | 高（import map 生成 + 维护） | 低（Rolldown 自己处理） |

## Consequences

### Positive

- SSR bundle 完全自包含，零运行时依赖
- consumer 模板只需声明用户直接使用的包
- 消除 "打地鼠" 式的 import map 补丁循环
- `external-resolver.ts`、`importmap.json` 逻辑可退休

### Negative

- SSR bundle 约 2.5x 大（151 → 400 KB）
- 每次 SSR build 需要重新 bundle 更多代码（可缓存）

### Neutral

- `external-resolver.ts` 和 AST exports walking 仍保留用于其他用途
- client bundle 不受影响
