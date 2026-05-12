---
title: '部署指南 — Cloudflare Pages + API Functions'
date: '2026-05-12'
type: 'post'
tags: ['deployment', 'cloudflare']
draft: false
excerpt: '如何将 LessJS 官网部署到 Cloudflare Pages，并启用 API 路由支持终端交互。'
---

## 前提

- Cloudflare Pages 项目已创建（`lessjs.pages.dev`）
- GitHub 仓库已连接，自动部署已启用
- 域名（可选）已配置：`lessjs.org`

## 构建配置

在 Cloudflare Pages 仪表盘 → 项目 → 设置 → 构建：

| 字段 | 值 |
|------|-----|
| **构建命令** | `cd www && deno run --config ../deno.json -A ../packages/adapter-vite/src/cli/build.ts` |
| **构建输出目录** | `www/dist` |
| **根目录** | `src-tmp` |
| **环境变量** | 无需 |

## Pages Functions

`functions/api/term.ts` 放在仓库根目录 `src-tmp/functions/`（与 `www/`、`packages/` 同级）。Cloudflare Pages 在部署时会自动扫描根目录下的 `functions/` 目录，将其中的文件编译为 serverless functions，无需额外配置。

构建部署后，在 Cloudflare Pages 仪表盘 → 项目 → Functions 中能看到 `api/term` 已激活。

## 验证部署

部署完成后，访问：
```
https://your-project.pages.dev/api/term
```

发送 POST 请求：
```bash
curl -X POST https://your-project.pages.dev/api/term \
  -H "Content-Type: application/json" \
  -d '{"cmd":"neofetch"}'
```

应返回包含 LessJS 系统信息的 JSON。

## 页面路由

首页的终端会自动调用 `/api/term`。如果 API 不可用：
- 基础命令（help, version, whoami, uname, dsd, clear）由客户端本地处理
- build, ls, neofetch 需要 API — 不可用时显示提示信息

## 注意事项

- `functions/` 目录不会包含在 SSG 构建产物中 — Cloudflare 单独处理
- 函数代码需使用标准 Web API（`Request`/`Response`），不含 Node.js 特有 API
- 如需新增 API 路由，在 `functions/` 下创建对应路径文件即可
