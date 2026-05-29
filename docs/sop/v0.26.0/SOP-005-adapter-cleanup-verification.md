# SOP-005: Adapter 清理 + 全量回归验证

> **Priority**: P1 | **预估**: 4h | **依赖**: SOP-001→004 | **ADR**: ADR-0061

## Objective

清理 adapter-vite 中剩余的 Vite 特定代码，完成全量回归门禁。

## Step 1: 创建 I/O 薄抽象 (1h)

**文件**: `packages/adapter-vite/src/io-utils.ts`（新建）

```typescript
// Thin abstraction over Deno file I/O.
// Enables future Node/Bun compat without changing call sites.

export async function readTextFile(path: string): Promise<string> {
  // @ts-ignore: Deno namespace
  return await Deno.readTextFile(path);
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  // @ts-ignore: Deno namespace
  await Deno.writeTextFile(path, content);
}

export function readTextFileSync(path: string): string {
  // @ts-ignore: Deno namespace
  return Deno.readTextFileSync(path);
}
```

## Step 2: 重构 Deno 特定调用 (1h)

**文件**: `packages/adapter-vite/src/workspace-alias.ts`

```diff
- Deno.readTextFileSync(path)
+ readTextFileSync(path)  // from ./io-utils.js
```

**文件**: `packages/adapter-vite/src/ssg-package-resolver.ts`

```diff
- await Deno.readTextFile(localPath)
+ await readTextFile(localPath)  // from ./io-utils.js
```

**文件**: `packages/adapter-vite/src/cli/build-ssg.ts`

```diff
- // M-18 fix: Use process.platform instead of Deno.build.os
+ // Use platform-agnostic check
+ const isWindows = (await import('./io-utils.js')).platform() === 'win32';
```

## Step 3: 全量回归门禁 (2h)

### 门禁矩阵

| Gate      | 命令                                                                       | 阻断级别 |
| --------- | -------------------------------------------------------------------------- | -------- |
| fmt       | `deno fmt --check`                                                         | 🔴 阻断  |
| lint      | `deno lint`                                                                | 🔴 阻断  |
| typecheck | `deno task typecheck`                                                      | 🔴 阻断  |
| graph     | `deno task graph:check`                                                    | 🔴 阻断  |
| test      | `deno test --allow-read --allow-write --allow-env --allow-net --allow-run` | 🔴 阻断  |
| build     | `deno task build:docs`                                                     | 🔴 阻断  |
| SSG smoke | `deno test packages/adapter-vite/__tests__/ssg-smoke.test.ts`              | 🔴 阻断  |
| dev:fast  | `timeout 5 deno task dev:fast`                                             | 🟡 警告  |

### 验证脚本

```bash
#!/bin/bash
set -e
echo "=== v0.26.0 Release Gate ==="

echo "[1/8] fmt..."
deno fmt --check

echo "[2/8] lint..."
deno lint

echo "[3/8] typecheck..."
deno task typecheck

echo "[4/8] graph..."
deno task graph:check

echo "[5/8] test..."
deno test --allow-read --allow-write --allow-env --allow-net --allow-run

echo "[6/8] build:docs..."
deno task build:docs

echo "[7/8] SSG smoke..."
deno test packages/adapter-vite/__tests__/ssg-smoke.test.ts

echo "[8/8] virtual:less check..."
grep -r "virtual:less-" www/app/routes/ && echo "FAIL: virtual imports remain" && exit 1 || echo "PASS: zero virtual imports"

echo "=== ALL GATES GREEN ==="
```

## Step 4: 文档更新 (0h — 与代码同步)

更新以下文档反映新 import 路径：

- `README.md` — dev 模式说明
- `CONTRIBUTING.md` — 开发流程
- `www/app/routes/guide/content-system.tsx` — virtual:less-blog-data 引用
- `docs/reference/` — API 引用

**验收**: 8/8 门禁全部绿色，零 `virtual:less-` 引用残留。
