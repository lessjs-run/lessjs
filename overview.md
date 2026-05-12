# 全项目文档更新 + ADR 完全迁移到 Blog 管线

## 最终状态

### 已删除的文件
- `www/decisions/` — 25 篇原始 ADR markdown
- `www/app/decision-data.ts` — 旧的 DECISIONS 硬编码数据
- `www/app/components/decision-document-page.ts` — 旧的 ADR 渲染组件
- `www/app/lib/markdown.ts` — 旧的客户端 markdown renderer（仅被上述组件使用）
- `www/app/routes/decisions/0001-*.ts` ~ `0007-*.ts` — 7 个手写 ADR 路由文件

### 新增的文件
- `www/content/blog/0001-*.md` ~ `0021-*.md` + 4 个附属文件 = **25 篇 ADR**（带 frontmatter）
- `www/app/routes/decisions/[slug].ts` — 动态 ADR 详情页，读取 `virtual:less-blog-data` 过滤 `type === 'adr'`
- `www/app/routes/decisions/index.ts` — 重写的 ADR 索引页，同样从 blog 数据读取

### 修改的文件
- `www/app/routes/blog/index.ts` — 添加 `filter(p => p.frontmatter.type !== 'adr')` 过滤 ADR
- `www/content/blog/2026-04-30-less-compiler.md` — `/decisions/` → `/blog/` 链接
- `www/content/blog/0009-repo-simplification-issue.md` — `docs/decisions/` → `/blog/` 链接
- `README.md` / `README.en.md` — ADR 链接指向 `/blog/`
- `v0.11-release-notes.md` / `.en.md` — GitHub ADR URL → `/blog/XXXX`

### 架构变化
| 之前 | 之后 |
|------|------|
| ADR 在 `www/decisions/`，纯 markdown 文件 | ADR 在 `www/content/blog/`，带 frontmatter，走 blog 管线 |
| `/decisions/` 路由用 7 个手写 route 文件 + decision-data.ts | `/decisions/` 路由用 `[slug].ts` 动态读取 blog 数据 |
| 决策详情页用 `renderMarkdown()` 客户端渲染 | 决策详情页用 `post.html`（SSG 时已渲染好） |
| ADR 只能通过 `/decisions/` 访问 | ADR 可通过 `/decisions/` 和 `/blog/` 两个路径访问 |
| 博文引用 ADR 需要 GitHub 链接 | 博文直接 `/blog/XXXX` 链接 |

### 博文 → ADR 引用
博文现在可以直接链接 ADR 而不需要重复内容：
```markdown
详见 [ADR 0017](/blog/0017-separate-runtime-from-build-orchestration)
```
