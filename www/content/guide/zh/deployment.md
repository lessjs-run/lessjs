---
title: '部署'
section: '生产'
label: '部署'
order: 5
---

# 部署

openElement 是 static-first。构建输出是普通 HTML、JavaScript 和静态资源，可以部署到任何静态平台。

## 构建

```bash
deno task build
```

输出目录是 `dist/`。

## 静态平台

- Cloudflare Pages：build command `deno task build`，output directory `dist`。
- Netlify：publish directory `dist`。
- Vercel：使用 static output，preset 选择 "Other"。
- GitHub Pages：如果部署到仓库子路径，需要配置 Vite base。
- S3 或 R2：上传 `dist/` 并配置缓存头。

## API routes

运行时 API 行为与静态输出分离。需要动态行为时，通过平台 adapter 或后续 server/API layer 部署 API routes。

## 发布检查

- 发布前跑完整本地门禁。
- 本地预览 `dist/`。
- 确认 base path 和 asset URL。
- 在托管层配置 CSP/security headers。
- 将运行时 API 与静态页面分开部署。
