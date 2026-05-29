# SOP-011: island.test.ts Old Name Cleanup

> Priority: P2 | Nature: 文档 | Time: 0.1d

## Objective

`island.test.ts` 注释和字符串中的 `island()` → `defineIsland()`。

## Step-by-Step

### Step 1: 替换所有引用

```bash
sed -i 's/\bisland()/defineIsland()/g' packages/core/__tests__/island.test.ts
sed -i 's/island() registration/defineIsland() registration/' packages/core/__tests__/island.test.ts
```

### Step 2: 替换 section 标题

```diff
- // ─── island() - tag name validation ───
+ // ─── defineIsland() - tag name validation ───
```

### Step 3: 替换错误消息引用

```diff
- throw new Error('Expected island() to throw...');
+ throw new Error('Expected defineIsland() to throw...');
```

### Step 4: 验证

- [ ] 0 处 `island()` 在 island.test.ts 中（除函数定义本身）
- [ ] `deno test packages/core/__tests__/island.test.ts` 通过
