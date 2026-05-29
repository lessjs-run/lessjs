# SOP-007: route-scanner Regex → AST Upgrade

> Priority: P1 | Nature: TS AST | Time: 0.5d

## Objective

13 处 `string.match/search/replace` → TypeScript AST 静态分析，降到 ≤3 处。

## Step-by-Step

### Step 1: 安装 ts-morph

```bash
deno add npm:ts-morph
```

### Step 2: 审计现有正则

| 位置                | 正则用途                            | 替代方案                          |
| ------------------- | ----------------------------------- | --------------------------------- |
| `readBooleanMeta()` | 匹配 `client:idle` / `client:load`  | AST 读取 `static client`          |
| `readDirective()`   | 匹配 `export default island(...)`   | AST 读取 `static client.strategy` |
| `readTagName()`     | 匹配 `export const tagName = '...'` | AST `VariableDeclaration`         |
| 其余 10 处          | 路径解析 / 错误消息匹配             | 保留或转为 `path.parse`           |

### Step 3: 逐个替换

```typescript
// Before (regex)
const match = content.match(/export const tagName = ['"]([^'"]+)['"]/);

// After (AST)
const sourceFile = tsMorphProject.addSourceFileAtPath(filePath);
const decl = sourceFile.getVariableDeclaration('tagName');
const tagName = decl?.getInitializer()?.getText().replace(/['"]/g, '');
```

### Step 4: 删除不再需要的正则

完成后审计：route-scanner.ts 中正则从 13 → ≤3。

### Step 5: 验证

- [ ] 13 处正则降到 ≤3 处
- [ ] Route scan 输出 bitwise 一致
- [ ] `deno task build` 通过
