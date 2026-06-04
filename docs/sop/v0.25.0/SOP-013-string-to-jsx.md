# SOP-013: 31 Pages String 鈫?JSX Migration

> Priority: P1 | Nature: 鍐呭娓叉煋閲嶆瀯 | Time: 2d

## Objective

31 涓矾鐢遍〉闈粠 `return \`<open-layout...>\``瀛楃涓叉ā鏉?鈫?JSX`return (<open-layout>...</open-layout>)`銆?

## Why

| 瀛楃涓叉ā鏉?                    | JSX                        |
| -------------------------------- | -------------------------- |
| XSS 椋庨櫓锛堝繕璁?escapeHtml锛? | TypeScript 缂栬瘧鏈熷畨鍏? |
| 鏃犺娉曢珮浜?鑷姩琛ュ叏        | IDE/Prettier 鍘熺敓鏀寔   |
| 杩愯鏃跺瓧绗︿覆鎷兼帴          | 缂栬瘧鏈?VNode 鍒涘缓      |
| SSR 鏃犳硶闈欐€佸垎鏋?           | AST 鍙紭鍖?               |

## Step-by-Step

### Step 1: 瀹¤鎵€鏈夐〉闈?

```bash
grep -rn "return \`<" www/app/routes/ --include="*.ts" --include="*.tsx" | grep -v "dist/"
```

棰勬湡锛殈31 涓枃浠躲€?

### Step 2: 鍒涘缓杩佺Щ妯℃澘

姣忎釜椤甸潰浠庯細

```typescript
// Before
override render() {
  const nav = JSON.stringify(filterNav(navSections));
  return `<open-layout nav-items='${nav}' current-path="/guide/getting-started">
    <div class="container"><h1>Title</h1>...</div>
  </open-layout>`;
}
```

鍒帮細

```typescript
// After
override render() {
  const nav = JSON.stringify(filterNav(navSections));
  return (
    <open-layout navItems={nav} currentPath="/guide/getting-started">
      <div class="container"><h1>Title</h1>...</div>
    </open-layout>
  );
}
```

### Step 3: 鎵归噺杩佺Щ

鎸変紭鍏堢骇鍒嗘壒锛?

| Batch | Pages                                      | Count |
| ----- | ------------------------------------------ | ----- |
| 1     | engine/ (dsd, islands, architecture 绛?    | 8     |
| 2     | guide/ (getting-started, configuration 绛? | 14    |
| 3     | architecture/ (index, adapter-vite 绛?     | 6     |
| 4     | 鍏朵粬 (index/index, registry 绛?          | 3     |

姣忔壒杩佺Щ鍚庤繍琛?`deno task build` 楠岃瘉銆?

### Step 4: 鐗规畩澶勭悊

- `_renderZh()` / `_renderEn()` 鈫?鏀逛负 `const isZh` ternary inline JSX
- `nav-items` 鈫?`navItems`锛圝SX 涓嶆敮鎸佽繛瀛楃灞炴€э級
- `${JSON.stringify(x)}` 鈫?`{JSON.stringify(x)}`锛圝SX 琛ㄨ揪寮忥級
- `&larr;` / `&rarr;` 鈫?`鈫恅 /`鈫抈 Unicode 瀛楃锛圝SX 涓畨鍏級

### Step 5: 楠岃瘉

- [ ] 31 椤甸潰鍏ㄩ儴杩佺Щ鍒?JSX
- [ ] `deno task build` 閫氳繃
- [ ] 椤甸潰瑙嗚涓€鑷存€т笉鍙?- [ ] 鏃?`return \`<` 娈嬬暀
