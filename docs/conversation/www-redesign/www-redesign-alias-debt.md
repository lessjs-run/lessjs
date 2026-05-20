# Workspace Alias 爆炸问题 — 技术债

**文档日期**: 2026-05-19
**严重程度**: P1 — 非阻塞但影响可维护性
**影响范围**: Vite dev + SSG build 全程

## 问题

`packages/adapter-vite/src/workspace-alias.ts` 中的 `generateWorkspaceAliases()` 函数
无差别扫描 workspace 全部 15 个包的 `deno.json` exports，生成 **71 个 Vite resolve alias**。
其中约 50 个（~70%）`www/` 站点永远不会 import。

### 当前行为

```ts
// workspace-alias.ts:86-128
export function generateWorkspaceAliases(workspaceRoot: string): AliasEntry[] {
  const rootCfg = tryReadJson(resolve(workspaceRoot, 'deno.json'));
  const members: string[] = (rootCfg.workspace as string[]) || [];

  for (const member of members) {
    const memberCfg = tryReadJson(resolve(memberDir, 'deno.json'));
    // 读取每个包的 deno.json.exports → 全部转成 alias
    for (const [exportPath, sourcePath] of Object.entries(exports)) {
      aliases.push({ find: `${name}${subpath}`, replacement: resolve(...) });
    }
  }
}
```

### 问题清单

1. **www 不需要的包也生成了 alias**：core、rpc、signals、create、hub 等纯内部包
2. **非路由代码的模块也映射了**：各包的 2-6 个子路径，www 只用少数几个
3. **Vite alias 表体积膨胀**：71 条 alias，每条 Vite 匹配时都需遍历前缀匹配
4. **Deno workspace 的 redundancy**：根 `deno.json` imports 已有一份映射，`workspace-alias.ts` 又读 `deno.json` exports 再算一份

### 影响

- **功能**：无直接 bug（alias 多不导致解析失败）
- **性能**：Vite 模块解析每步前缀匹配遍历数组，O(n) 增长
- **维护**：新增包自动注册别名，实际不需要的地方也注册，调试时噪音大
- **正确性风险**：如果某个非 www 包的 `deno.json exports` 写错，可能破坏 www 的模块解析

## 建议方案

### 方案 A：按需扫描（推荐）

只对 `www/` 实际引用的包生成 alias。通过正则扫描 `www/app/**/*.ts` 中的 import 语句，
提取 `from '@lessjs/*'` 包名 → 按需查询对应包的 `deno.json` exports。

```ts
// 伪代码
function generateOnDemandAliases(workspaceRoot: string, targetDir: string): AliasEntry[] {
  const imports = scanImports(targetDir, '@lessjs/'); // 正则扫描
  const needed = new Set(imports.map(normalize));
  // 只对 needed 包生成 alias
}
```

**优点**：精确，不引入不必要映射
**缺点**：需要扫描文件系统（可缓存）

### 方案 B：白名单

在 `vite.config.ts` 中配置白名单：

```ts
workspaceAlias: {
  include: ['@lessjs/ui', '@lessjs/adapter-lit', '@lessjs/app'],
}
```

**优点**：简单
**缺点**：手动维护，新增 import 忘记加白名单会爆炸

### 方案 C：走 Deno imports 直通

Vite 的 `resolve.alias` 不需要包含全部子路径。既然
`deno.json` imports 已映射 `@lessjs/ui` → `./packages/ui/src/index.ts`，
可以只给根包加 alias，子路径由 `deno.json` imports（带 `@lessjs/ui/xxx` 映射）处理。

**但** Rolldown 不支持这种用法（见 root deno.json 第 28-29 行注释），所以当前必须做 subpath alias。

## 结论

属于历史遗留设计，不影响当前功能。建议在下一个 www 发布周期中按方案 A 重构 `workspace-alias.ts`。
