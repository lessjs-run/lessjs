# LessJS Docs Site Dogfooding — @lessjs/blog 重写方案

**日期**: 2026-05-08
**版本**: v0.8.0 → v0.9.0 规划
**目标**: 用 @lessjs/blog 重写 lessjs.com 文档站，实现 dogfooding

---

## 1. 为什么要重写

当前文档站有 **40+ 个手写 LitElement 页面**，每个页面都是完整的 `class extends LitElement` + `static styles` + `render()` 模板。这带来几个根本性问题：

### 1.1 内容与展示耦合

```typescript
// 现在：内容写死在 Lit 模板里
override render() {
  return html`
    <h1>Quick Start</h1>
    <p>创建项目...</p>
    <code-block><pre><code>deno run -A -r ...</code></pre></code-block>
  `;
}
```

修改一个文字需要编辑 TypeScript、重新编译、重新构建 SSG。对比 Markdown：

```markdown
# Quick Start

创建项目...

```sh
deno run -A -r ...
```
```

Markdown 让内容回归内容，展示回归展示。

### 1.2 维护成本极高

| 指标 | 当前 | Markdown 后 |
|------|------|------------|
| changelog.ts | 71KB / ~1500 行 Lit 模板 | ~5KB Markdown |
| 17 个 Guide 页面 | 各 4-6KB Lit 组件 | 各 1-2KB Markdown |
| 博客文章 | 140 行 CSS + 280 行模板 | 1 个 .md 文件 |
| 新增一篇文章 | 新建 .ts + 注册路由 + 更新 index | 新建 .md |

### 1.3 Dogfooding 缺失

@lessjs/blog 是 LessJS 自己的博客包，但 lessjs.com 的文档站和博客完全没有使用它。这就像 Next.js 文档站不用 Next.js 一样——框架的权威性来自吃自己的狗粮。

### 1.4 审核报告的关键发现

审核报告指出"文档完整性"是 3/5 的短板：
- 三层组件模型、DSD hydration、适配器协议缺少用户文档
- v0.6 → v0.7 迁移指南缺失
- 性能优化指南缺失

手写 Lit 组件的维护成本直接导致了文档不足。用 Markdown 重写后，写文档的门槛大幅降低。

---

## 2. @lessjs/blog 当前能力 vs 文档站需求

### 2.1 当前能力

| 能力 | 状态 |
|------|------|
| Markdown → HTML (gray-matter + marked) | ✅ |
| Frontmatter 解析 (title, date, draft, tags, excerpt) | ✅ |
| Slug 生成（日期前缀剥离） | ✅ |
| 路由自动生成 (listRoute + postRoutes) | ✅ |
| Draft 过滤 | ✅ |
| 自定义 basePath | ✅ |
| 自定义 markdown 渲染器 | ✅ |
| Vite 插件集成 | ✅ |

### 2.2 文档站需求 Gap 分析

| 需求 | @lessjs/blog 支持 | 差距 |
|------|-------------------|------|
| 博客/发布文章 | ✅ 完全支持 | — |
| Guide 文档页面 | ❌ 需扩展 | 需要导航、上一页/下一页、分节 |
| 多语言 (i18n) | ❌ 不支持 | 需要 en/zh 目录结构 |
| 代码块语法高亮 | ❌ marked 默认无 | 需要 Shiki / Prism 集成 |
| 自定义容器 (callout, warning) | ❌ 不支持 | 需要 markdown-it-container 或 remark-directive |
| ADR 页面 | ❌ 不支持 | 已有半 Markdown 模式，可保留 |
| 交互式 Demo 页面 | ❌ 不适用 | 保留 Lit 组件 |
| Changelog / Roadmap | ❌ 不适用 | 数据驱动页面，保留 Lit 组件 |
| 侧边栏导航自动生成 | ❌ 不支持 | 需要 frontmatter order + 目录扫描 |
| 搜索 | ❌ 不支持 | 需要 Pagefind 等工具 |

### 2.3 结论

@lessjs/blog 的 v0.8 范围是"博客插件"，覆盖发布类内容（blog posts, release notes）。
文档站还需要**文档页面**能力，这是两个不同的内容模型：

- **Blog**: 时间线驱动，按日期排序，有列表页和文章页
- **Docs**: 结构驱动，按导航排序，有分节、上一页/下一页、侧边栏

**建议**：@lessjs/blog 扩展为 @lessjs/content，同时支持 blog 和 docs 两种内容模型。

---

## 3. 重写方案

### 方案 A：渐进式 — Blog 先行，Docs 后跟

**Phase 1 (v0.8.x)**: 用 @lessjs/blog 重写博客部分
- 博客文章从 .ts 迁移到 .md
- 博客列表页自动生成
- @lessjs/blog 在文档站中首次 dogfooding

**Phase 2 (v0.9.0)**: 扩展 @lessjs/blog → @lessjs/content
- 新增 docs 内容模型（导航、分节、上一页/下一页）
- Guide 页面从 .ts 迁移到 .md
- 侧边栏导航从 nav-data.ts 自动生成

**Phase 3 (v0.9.x)**: 混合模式
- 交互页面保留 Lit 组件
- 内容页面全部 Markdown 化
- Changelog/Roadmap 数据驱动

**优点**：风险可控，每一步都可验证
**缺点**：时间长，中间态维护两套模式

### 方案 B：一次性 — @lessjs/content 统一

先开发 @lessjs/content（blog + docs 统一），再一次性重写。

**优点**：无中间态，架构干净
**缺点**：前期开发量大，dogfooding 滞后

### 方案 C：Blog 先行 + 同步扩展

**推荐**。在用 @lessjs/blog 重写博客的同时，就在博客的 dogfooding 过程中发现需要扩展的地方，直接在 @lessjs/blog 内扩展（不换包名），最终演进为同时支持 blog + docs 的内容插件。

---

## 4. 推荐方案：方案 C 详细设计

### 4.1 内容目录结构

```
docs/
  content/
    blog/
      2026-05-08-v0-8-0.md
      2026-05-03-v0-5-alpha1.md
      2026-05-02-v0-5-0.md
      ...
    docs/
      getting-started.md
      architecture.md
      routing.md
      ssg.md
      islands.md
      ...
    decisions/
      0001-keep-hono-vite-dev-server.md
      0002-kiss-compiler-eliminate-lit.md
      ...
  app/
    routes/
      index/          # 保留：首页 (Lit 组件)
      demo/           # 保留：交互式 Demo (Lit 组件)
      404.ts          # 保留
      blog/
        index.ts      # 重写：用 lessBlog() 数据渲染
        [slug].ts     # 新增：动态博客文章页
      guide/
        _renderer.ts  # 重写：Markdown 文档渲染器
        [slug].ts     # 新增：动态文档页
      decisions/
        [slug].ts     # 重写：用 Markdown 渲染
      changelog.ts    # 保留或数据驱动
      roadmap.ts      # 保留或数据驱动
```

### 4.2 @lessjs/blog 需要扩展的能力

#### 4.2.1 文档内容模型

```typescript
// 新增接口
interface DocPageFrontmatter {
  title: string;
  order: number;          // 导航排序
  section: string;        // 所属分节 ("Start Here", "Core Model", etc.)
  navLabel?: string;      // 侧边栏显示文本（默认用 title）
  prev?: string;          // 上一页路径
  next?: string;          // 下一页路径
}

interface DocPage {
  slug: string;
  frontmatter: DocPageFrontmatter;
  content: string;
  html: string;
  section: string;
  order: number;
}

// 新增函数
function scanDocs(options?: LessDocsOptions): Promise<DocPage[]>;
function generateDocsRoutes(options?: LessDocsOptions): Promise<DocsRoutes>;
function generateNavData(options?: LessDocsOptions): Promise<NavSection[]>;
```

#### 4.2.2 Markdown 增强

```typescript
// lessBlog/lessDocs 的 markdown 选项扩展
interface MarkdownOptions {
  /** 语法高亮器 (shiki, prism, highlight.js) */
  highlighter?: 'shiki' | 'prism' | 'none';
  /** 自定义容器 (callout, warning, tip, etc.) */
  containers?: MarkdownContainer[];
  /** 自定义 marked 扩展 */
  extensions?: marked.MarkedExtension[];
}

interface MarkdownContainer {
  /** 容器类型名 */
  type: string;
  /** 渲染为的 CSS class */
  className?: string;
  /** 标题模板 */
  titleTemplate?: (info: string) => string;
}
```

实现方式：使用 marked 的 `extensions` API 或切换到 `remark`（unified 生态）。

#### 4.2.3 代码块语法高亮

推荐 **Shiki**（与 Vite 生态集成好，支持 VS Code 主题）：

```typescript
import { getHighlighter } from 'shiki';

const highlighter = await getHighlighter({ theme: 'github-dark' });

// marked renderer override
const renderer = {
  code(code: string, lang: string) {
    return highlighter.codeToHtml(code, { lang: lang || 'text' });
  },
};
```

### 4.3 迁移映射

| 当前文件 | 迁移到 | 方式 |
|----------|--------|------|
| blog/v0-5-alpha1.ts (424行) | content/blog/2026-05-03-v0-5-alpha1.md (~3KB) | 提取内容为 Markdown，.bug-card/.principle 用 callout 容器 |
| blog/v0-5-0.ts | content/blog/2026-05-02-v0-5-0.md | 同上 |
| blog/v0-4-0.ts | content/blog/2026-04-30-v0-4-0.md | 同上 |
| blog/less-compiler.ts | content/blog/2026-04-30-less-compiler.md | 同上 |
| guide/getting-started.ts | content/docs/getting-started.md | 提取内容，代码块用 fenced code |
| guide/architecture.ts | content/docs/architecture.md | 同上 |
| guide/islands.ts | content/docs/islands.md | .comparison grid → 自定义容器或 HTML |
| 其余 14 个 guide 页面 | content/docs/*.md | 逐个提取 |
| decisions/0001-0006 | content/decisions/*.md | 已半 Markdown，直接迁移 |
| changelog.ts (71KB) | 保留 Lit 组件 + 数据驱动 | 内容量大且格式复杂 |
| roadmap.ts | 保留 Lit 组件 + 数据驱动 | 交互性内容 |
| ui.ts | 保留 Lit 组件 | 组件展示页 |
| demo/index.ts | 保留 Lit 组件 | 交互式 Demo |
| 首页 index.ts | 保留 Lit 组件 | 定制 Landing Page |

### 4.4 不迁移的页面

以下页面保持 Lit 组件形式，因为它们不是"内容驱动"的：

1. **首页** — 定制 hero landing page，需要全屏布局、动画
2. **Demo 页面** — 交互式组件展示，需要 island 组件
3. **UI 展示页** — 组件库文档，需要实时渲染组件
4. **Changelog** — 71KB 结构化版本历史，数据驱动更合适
5. **Roadmap** — 交互式路线图，数据驱动更合适

### 4.5 技术实现路线

#### Step 1: @lessjs/blog 扩展 (v0.8.x)

在 `packages/blog/` 内新增：

```
src/
  index.ts           # 扩展导出
  types.ts           # 新增 DocPage, DocPageFrontmatter, LessDocsOptions
  markdown.ts        # 增强：Shiki 高亮 + 自定义容器
  routes.ts          # 保留：博客路由
  docs.ts            # 新增：文档路由 + 导航生成
  nav.ts             # 新增：侧边栏导航自动生成
```

#### Step 2: 文档站 Blog 迁移 (v0.8.x)

1. 创建 `docs/content/blog/` 目录
2. 将 4 篇博客文章提取为 .md
3. `blog/index.ts` 改用 `scanPosts()` 数据渲染列表
4. 新增 `blog/[slug].ts` 动态文章页
5. 删除手写的 `blog/v0-5-alpha1.ts` 等

#### Step 3: 文档站 Docs 迁移 (v0.9.0)

1. 创建 `docs/content/docs/` 目录
2. 17 个 guide 页面逐个提取为 .md
3. `guide/_renderer.ts` 改为 Markdown 渲染器
4. 新增 `guide/[slug].ts` 动态文档页
5. `nav-data.ts` 改为从 frontmatter 自动生成
6. 删除手写的 17 个 guide .ts 文件

#### Step 4: 增强与优化 (v0.9.x)

1. Pagefind 全文搜索
2. i18n 支持 (en/zh 目录结构)
3. RSS feed 生成
4. OG image 自动生成
5. 代码块 Copy 按钮

---

## 5. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 自定义容器不够灵活 | 部分 blog 文章视觉效果降级 | 支持容器 + inline HTML fallback |
| Shiki 增大 bundle | SSG 构建变慢 | 只在构建时使用，不进入客户端 bundle |
| [slug].ts 动态路由 | LessJS 核心需支持 | 先确认 core 是否已有 dynamic route，没有则需扩展 |
| 迁移期间文档不可用 | 用户看到空页 | 渐进迁移，旧页面在新页面上线后删除 |
| marked 扩展性不足 | 复杂 markdown 需求不满足 | 预留切换到 unified/remark 的接口 |

---

## 6. 时间线

| 阶段 | 版本 | 时间 | 内容 |
|------|------|------|------|
| Blog dogfooding | v0.8.x | 05-08 ~ 05-12 | @lessjs/blog 重写博客 + 首次 dogfooding |
| Docs 扩展 | v0.9.0 | 05-13 ~ 05-20 | @lessjs/blog 扩展 docs 能力 + Guide 迁移 |
| 增强搜索/i18n | v0.9.x | 05-21 ~ 05-30 | Pagefind + i18n + RSS |

---

## 7. 审核报告建议的整合

审核报告中的 P0/P1 建议与 docs 重写高度相关：

| 审核建议 | 与重写的关系 |
|----------|-------------|
| P0: 消除 runtime-shim.ts 手工同步风险 | 独立任务，与重写并行 |
| P0: 明确错误分类指南 | 在 @lessjs/content 中实施 |
| P1: 完善高级特性文档 | **重写直接解决** — Markdown 门槛低，写文档更快 |
| P1: 添加集成测试 | dogfooding 本身就是最佳集成测试 |
| P1: 优化嵌套 DSD 渲染性能 | 独立任务 |
| P2: 性能监控 | SSG 构建时间可作为 dogfooding 的指标 |

**关键洞察**：审核报告说"文档完整性 3/5"——而文档不足的根本原因是手写 Lit 组件的维护成本太高。用 Markdown 重写后，写文档的边际成本从"新建 .ts + 编译 + 构建"降到"新建 .md + 推送"，文档质量自然会提升。
