# LessJS v0.5.4 — 品牌重塑与架构统一

> **Less is More.**  
> 今天的发布完成了 LessJS 框架的全面品牌重塑：从组件标签、CSS 变量、构建日志到文档站点，KISS 正式成为过去式。

---

## 🔄 品牌迁移：KISS → LessJS

### 组件系统重命名
所有 UI 组件标签完成 `kiss-*` → `less-*` 迁移：

| 旧名 | 新名 |
|------|------|
| `<kiss-layout>` | `<less-layout>` |
| `<kiss-button>` | `<less-button>` |
| `<kiss-card>` | `<less-card>` |
| `<kiss-input>` | `<less-input>` |
| `<kiss-code-block>` | `<less-code-block>` |
| `<kiss-theme-toggle>` | `<less-theme-toggle>` |
| `<kiss-hero-ping>` | `<less-hero-ping>` |
| `<kiss-ui-plugin>` | `<less-ui-plugin>` |

### CSS 设计令牌
- 所有 `--kiss-*` CSS 自定义属性 → `--less-*`（颜色、间距、字体、阴影、圆角、动画等 60+ 个变量）
- 代码文件重命名：`kiss-button.ts` → `less-button.ts`（共 8 个源文件）

### 事件与属性
| 旧 | 新 |
|----|----|
| `kiss:ready` | `less:ready` |
| `kiss:build` | `less:build` |
| `data-kiss` | `data-less` |
| `#kiss-anti-flash` | `#less-anti-flash` |
| `localStorage('kiss-theme')` | `localStorage('less-theme')` |

### Vite 插件名统一
```
kiss:core          →  less:core
kiss:virtual-entry →  less:virtual-entry
kiss:island-transform →  less:island-transform
less:build         →  less:build
```

### 框架内在细节
- 模板变量 `kissUiAliases` → `lessUiAliases`
- 默认文档标题 `KISS App` → `LessJS`
- 构建日志 `KISS Architecture` → `LessJS Architecture`
- 构建前缀 `[KISS]` → `[LessJS]`
- PWA fallback name `KISS App` → `LessJS App`
- default title in ssr-handler / render-dsd / runtime-shim 统一为 `LessJS`

---

## 🎨 视觉资产

### Logo 系统
文档站新增 4 种 Logo variant（由社区提供 `<` 符号设计）：

| 文件 | 用途 |
|------|------|
| `assets/less-logo.svg` | 透明底符号，GitHub/npm 头像 |
| `assets/less-logo-inverted.svg` | 黑底白标，暗色环境 |
| `assets/less-logo-horizontal.svg` | 横排含"less is more"标语 |
| `assets/less-favicon.svg` | 32×32 浏览器 tab 图标 |

### 首页 Hero 区
- 内嵌 `<` 符号 Logo + 「Less」大字横向排列
- 暗色背景 + 白色符号，视觉冲击更强

### 标语
- **「Less is More」** 写入 meta description 和 PWA name

---

## 🚀 发布管线

### JSR 双发
- 自动化管线支持 JSR + npm 同步发布
- 新增 `workflow_dispatch` 手动触发支持
- `publish-manual.yml` 同步支持 npm 双发

### 构建修复
- SSG 阶段 `customElements.define` 重复注册保护
- `globalThis.__kissSsrDefinePatched` 类型断言修复
- dnt 导入 `jsr:@deno/dnt` 追加版本号 `@^0.42`
- 5 个 `_build_npm.ts` dnt 构建脚本就绪

### 配置修复
- `.workbuddy/` 移除 git 跟踪 + `.gitignore` 新增
- `deploy.yml` CNAME 更新为 `lessjs.com`
- publish CI 使用 `-c deno.json` 避免 workspace 根目录配置冲突
- 所有 `_build_npm.ts` 的 `jsr:@deno/dnt` 导入补全版本号

---

## 📝 文档与说明

### 文档站全面更新
- 全站 KISS → LessJS 品牌升级（首页、导航、页脚、指南、博客、更新日志）
- Guide 标题中文化
- README 中文优先
- 废弃的 `@kissjs/*` 文档引用替换为 `@lessjs/*`

### 遗留路径修复
- `packages/core/__tests__/route-scanner.test.ts` — `packages/vite/` → `packages/core/`
- `packages/core/__tests__/ssg-integration.test.ts` — `packages/kiss-core/` → `packages/core/`
- `docs/app/routes/roadmap.ts` — 残留 `@kissjs/ui` 修复
- `docs/app/routes/index/index.ts` — 首页 KISS 品牌移除

---

## 🔧 历史记录

- 项目原代号 KISS（Keep It Simple, Stupid），现正式对外品牌为 **LessJS**
- 包名：`@lessjs/*`（JSR）/ `@lessjs/*`（npm）
- 文档站：`lessjs.com`（资源配置中）
- GitHub: `github.com/lessjs-run/lessjs`

---

*Built with LessJS Framework · Self-bootstrapped from JSR · LessJS Architecture — K·I·S·S*
