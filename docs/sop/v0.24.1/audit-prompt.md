# AI 仓库审计提示词

> 将此提示词发给 AI（Claude / GPT / Gemini 等），请求对 LessJS 仓库进行全量审计。

---

## 提示词正文

```
你是 LessJS（https://github.com/lessjs-run/lessjs）的资深架构审计专家。请对当前仓库进行一次全面深度审计。

## 项目背景

LessJS 是一个 DSD-first Web Components 框架，Deno monorepo，通过 JSR 发布 @lessjs/* 系列包。
刚刚完成了 v0.24.1 重大版本：从自建 html tagged template DSL 全量迁移到 JSX+Signal 组件模型（ADR-0057）。

核心变化：
- html`...` tagged template → JSX syntax（jsx-runtime, VNode, renderToString, renderToDOM）
- @prop() decorator → static props = { name: Type }
- TemplateResult → VNode（5-field frozen interface: tag/props/children/key/ref）
- html/classMap/when/choose/repeat/ref/unsafeHTML 全部删除
- 新增 @lessjs/signals 作为 @lessjs/core 的显式依赖
- effect() 驱动 VNode 信号追踪和 DOM re-render

## 审计维度

### 1. 代码一致性（P0）
- 检查是否有残留的 html` / TemplateResult / @prop / classMap / when / choose / repeat / ref / unsafeHTML 引用
- www 路由页面和 docs 文档是否还在引用已删除的 API
- CHANGELOG 和 release note 是否准确反映实际代码
- 所有 deno.json 版本号、跨包依赖是否一致

### 2. 架构完整性（P0）
- JSX pipeline 是否完整：build（esbuild/vite config）→ renderToString（SSR）→ renderToDOM（CSR）→ effect（响应式）
- DSD 管线的 VNode 路径是否与 TemplateResult 路径正确并行
- 包依赖图是否有循环引用（18 packages, @lessjs/signals → @lessjs/core → ...）
- SVG namespace 处理是否正确
- 事件系统：onClick → addEventListener 是否正确绑定和清理

### 3. 测试覆盖（P1）
- 939 tests 是否覆盖所有关键路径
- JSX runtime 测试（jsx-runtime, renderToString, renderToDOM）
- SVG namespace 测试
- signal effect + VNode re-render 测试
- 组件迁移后的回归测试

### 4. 文档完整性（P0）
- docs/reference/ 下的文档是否与 v0.24.1 代码一致
- www 文档站点是否展示正确的 API 和示例
- 是否有需要删除的过时文档（html template 相关）
- 是否有需要新建的文档（JSX components / static props / signal reactivity）
- i18n 中文文档是否同步

### 5. 构建与部署（P1）
- deno task build 是否成功（www 全站构建）
- www/dist 产物中无 [object Object] 渲染
- island 组件的 JSX chunk 是否正确使用 LessJS Fragment（非 React $$typeof）
- Cloudflare Pages / CDN 缓存策略

### 6. CI/CD 门禁（P1）
- graph:check / fmt:check / lint / typecheck / test 是否全部通过
- publish-jsr.yml 的 publish order 是否正确（signals → core）
- SOP gate 是否需要更新

## 审计方法

1. 从仓库根目录开始，先看 CHANGELOG.md 和 docs/release/0.24.1.md 了解版本范围
2. 检查 packages/core/src/ 核心代码（dsd-element.ts, jsx-runtime.ts, jsx-render-dom.ts, jsx-render-string.ts, vnode.ts, prop.ts, index.ts）
3. 检查 packages/adapter-vite/src/ 构建管线（build-client.ts, build-ssg.ts, ssg-package-resolver.ts）
4. 检查 packages/ui/src/ 所有组件的渲染方式是否已迁移到 JSX
5. 检查 www/app/routes/ 和 www/content/ 文档内容
6. 检查 docs/ 目录结构，标记过时/缺失文档
7. 运行构建和测试验证

## 输出格式

按优先级输出，每项包含：
- 严重程度：P0（阻塞）/ P1（重要）/ P2（增强）
- 文件路径
- 问题描述
- 修复建议

输出前先给一个 TL;DR 总结（3-5 句话）。
```
