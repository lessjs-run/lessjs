---
title: '测试'
section: '生产'
label: '测试'
order: 40
---

# 测试

测试应该证明公开契约，而不是只覆盖私有 helper。

## 应用测试

使用 Deno test 覆盖纯逻辑、page descriptor、API handler 和 custom element helper。

```bash
deno test --allow-read --allow-write --allow-env --allow-net --allow-run
```

## Build smoke

每个 release 都应该构建 `www`，并至少构建一个 generated consumer project。这样能证明 routing、JSX、DSD
output、island metadata 和 package resolution。

## Browser E2E

依赖 Custom Element upgrade、IntersectionObserver、idle callback、Declarative Shadow DOM parsing
或真实 DOM event handling 的行为，需要用 Playwright 覆盖。

## Release gates

发布门禁包括 architecture checks、package graph checks、docs checks、lint、typecheck、tests、build、DSD
report、e2e 和 publish dry-run。
