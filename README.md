# LessJS

[简体中文](./README.md) | [English](./README.en.md)

LessJS 是一个 Deno-first 的 Web Components 框架，核心方向是
**Declarative Shadow DOM + SSR/SSG + Island Upgrade**。它先输出可读、可爬取、可缓存的
HTML，再只升级真正需要浏览器 API 的交互组件。

当前项目已经是可运行的早期框架，但还不是成熟的 registry 生态。后续路线必须先稳定渲染内核和包协议，再做本地组件索引，最后才讨论公共 WC registry hub。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-published-blue)](https://jsr.io/@lessjs/core)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?label=core&style=flat-square)](https://jsr.io/@lessjs/core)
[![@lessjs/ui](https://img.shields.io/jsr/v/@lessjs/ui?label=ui&style=flat-square)](https://jsr.io/@lessjs/ui)

## LessJS 是什么

LessJS 更准确的定位是 Web Standards-first 的渲染工程栈：

- **Engine**：`renderDSD()`、嵌套 Custom Element 渲染、路由渲染、SSG 输出、DSD 指标和 adapter 接口。
- **Protocol**：当前已有 package island metadata，后续扩展为 CEM-compatible 的 WC package manifest。
- **Ecosystem**：先做本地 registry index、验证产物、安装辅助和文档索引，再做公共 hub。

LessJS 不承诺“任意 Web Component 都能自动 SSR”。一键安装、自动注册、自动渲染和自动水合只对声明 manifest 且通过验证的包成立。

## 包概览

| 包                     | 版本   | 职责                                     | 外部依赖                  |
| ---------------------- | ------ | ---------------------------------------- | ------------------------- |
| `@lessjs/core`         | 0.14.9 | DSD 渲染、island、navigation、错误、日志 | `parse5`                  |
| `@lessjs/adapter-vite` | 0.14.9 | Vite 编排、路由扫描、SSG、island chunk   | `vite`, `hono`, `esbuild` |
| `@lessjs/adapter-lit`  | 0.14.9 | Lit `TemplateResult` 到 DSD HTML 的桥接  | `lit`                     |
| `@lessjs/app`          | 0.14.9 | 推荐入口 `lessjs()`                      | workspace 包              |
| `@lessjs/content`      | 0.14.9 | Blog、Nav、Sitemap 构建插件              | `marked`, `gray-matter`   |
| `@lessjs/i18n`         | 0.14.9 | locale 展开和路由辅助                    | 无                        |
| `@lessjs/ui`           | 0.14.9 | LessJS Web Components 和 package islands | `lit`                     |
| `@lessjs/signals`      | 0.14.9 | Signals helper 和 island effect          | 无                        |
| `@lessjs/rpc`          | 0.14.9 | Fetch RPC controller                     | 无                        |
| `@lessjs/create`       | 0.14.9 | 项目脚手架 CLI                           | 无                        |

## 渲染链路

```text
Route module 或 Web Component
  -> render() 返回 string 或 Lit TemplateResult
  -> renderDSD() 输出 Declarative Shadow DOM HTML
  -> 嵌套 Custom Elements 通过 parse5 AST 递归展开
  -> SSG 写出静态 HTML 和 island assets
  -> 浏览器解析 <template shadowrootmode="open">
  -> Custom Elements 升级已有 host
  -> dsd-interactive 组件按声明的 hydrateEvents 绑定事件
```

当前稳定模型是 SSG-first。ISR、Edge SSR、多 adapter 矩阵和公共 registry hub 是 roadmap 项，不是当前生产承诺。

## 快速开始

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app
deno task dev
deno task build
```

要求：

- Deno 2.7+
- 支持 Declarative Shadow DOM 的现代浏览器

## 路线边界

现实路线是：

1. **Renderer kernel**：稳定 DSD 渲染、adapter contract、route rendering、metrics 和 package island SSR。
2. **WC package protocol**：把 `PackageIslandMeta` 扩展为兼容 Custom Elements Manifest 的协议，增加 `ssr`、`dsd`、`hydrate` 和 diagnostics 字段。
3. **Local registry index**：扫描 workspace 和已安装包，验证 manifest，展示 SSR/SSG 输出、bundle cost、文档完整度和测试状态。
4. **Install automation**：`less add <package>` 只对通过验证的包更新配置和生成注册入口。
5. **Public hub**：只有在 provenance、审核、举报、安全响应和维护边界明确后，才公开中心化 hub。

## 标准定位

LessJS 采用已经能落地的平台能力，把仍在演进的标准作为清晰边界：

- WHATWG HTML 定义了 Declarative Shadow DOM 的 `shadowrootmode`、`shadowrootdelegatesfocus`、`shadowrootclonable`、`shadowrootserializable` 和 `shadowrootcustomelementregistry` 等属性。
- Custom Elements Manifest 是 tag、attribute、property、event、slot、CSS part、CSS custom property 和 custom state 的元数据基础。
- Open UI 作为 parts、states、behaviors、accessibility 和 form semantics 的组件契约词汇，不作为工具链依赖。
- OpenWC 可作为测试、lint、demo、发布经验参考，但 LessJS 保持 Deno、Playwright、自举 SSG 作为验证主线。
- Lit 和 FAST 证明 Web Components 有真实作者体验；LessJS 应通过 adapter 和 manifest 集成，而不是绑定单一作者库。
- Scoped Custom Element Registries 和 CSS Houdini 作为未来集成面跟踪，不写成当前核心承诺。

## 关键文档

- [Roadmap](www/app/routes/roadmap.ts)
- [Standards-first renderer ADR](www/content/blog/0024-standards-first-wc-renderer-roadmap.md)
- [Renderer kernel / registry SOP](www/app/routes/zh/decisions/20260515-1-renderer-kernel-registry-sop.ts)
- [Architecture guide](www/app/routes/guide/architecture.ts)
- [Standards & registry guide](www/app/routes/guide/standards-registry.ts)
- [DSD guide](www/app/routes/guide/dsd.ts)
- [Island guide](www/app/routes/guide/islands.ts)
- [API reference](www/app/routes/reference/core.ts)
- [v0.14.9 changelog](deliverables/review260516/CHANGELOG-v0.14.9.md)

## License

MIT
