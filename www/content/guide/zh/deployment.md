---
title: '部署'
section: '生产'
label: '部署'
order: 5
---

# 部署

openElement 默认是 static-first。Framework 输出默认是普通 HTML、JavaScript
和静态资产。运行时能力只在你显式使用 API routes、server rendering 或未来
ISR/cache adapter 时进入。

## 构建

```bash
deno task build
```

输出目录是 `dist/`。静态托管平台可以直接服务这个目录。

## 静态平台

- Cloudflare Pages：build command `deno task build`，output directory `dist`。
- Netlify：publish directory `dist`。
- Vercel：使用 static output，preset 选择 "Other"。
- GitHub Pages：如果部署到仓库子路径，需要配置 Vite base。
- S3 或 R2：上传 `dist/`，并在托管层配置 cache headers。

对静态平台来说，请求处理属于托管平台。openElement 负责生成文件、island
chunks、metadata 和 DSD HTML。CDN cache headers、redirects、CSP 和压缩属于
provider 配置。

## Nitro Runtime

Framework 产品以 Vite + Nitro 作为默认 runtime/deploy 证明。当应用需要 API
routes、SSR 或 ISR/cache intent 的 server target 时，生成应用可以通过
`createOpenElementNitroHandler()` 挂载 openElement server entry。

Provider-specific Nitro presets 是部署 recipes，不是新的 openElement 产品：

- Node/server：使用 Nitro node preset 生成可移植 server output。
- Cloudflare Workers/Pages Functions：需要 edge request handling 时使用 Nitro
  Cloudflare preset。
- Vercel/Netlify server functions：使用对应 Nitro preset，并把平台 cache 配置
  留在平台层。

## API Routes

运行时 API 行为与静态输出分离。需要动态行为时，通过 Nitro/server adapter
部署 API routes。静态页面仍然可以作为文件托管；API routes 和 ISR/cache
intent 需要 runtime target。

## Cache And ISR Intent

`renderIntent.revalidate` 记录 cache/ISR intent。静态输出证明页面可以被生成。
runtime adapter 决定这个 intent 如何映射到 provider cache headers、edge
storage 或 regeneration。

## 发布检查

- 发布前跑完整本地 gate。
- 本地预览 `dist/`。
- 确认 base path 和 asset URL。
- 在托管层配置 CSP/security headers。
- 明确选择 static-only output 或 Nitro runtime target。
- 使用静态托管时，将运行时 API 与静态页面分开部署。
