# KISS 当前版本 vs v0.4.0

对比基线：[v0.4.0 Release](https://github.com/SisyphusZheng/kiss/releases/tag/v0.4.0)

## 版本变化

| Package | v0.4.0 时 | 当前版本 |
| --- | ---: | ---: |
| `@kissjs/core` | `0.3.4` | `0.5.2` |
| `@kissjs/ui` | `0.4.0` | `0.5.0` |
| `@kissjs/rpc` | `0.2.5` | `0.3.0` |
| `@kissjs/create` | `0.3.4` | `0.4.4` |
| `@kissjs/adapter-lit` | 未独立发布 | `0.2.0` |

## 主要变化

- 用户主流程从多段构建收口为 `create -> dev -> build -> deploy`。
- 新增官方单命令构建入口：`@kissjs/core/cli/build`。
- 内部仍保留三阶段：Vite SSR build、client island build、SSG，但用户文档不再把三段构建作为主路径。
- `@kissjs/core` 不再转发 `css` / `html` / `LitElement`，用户代码直接从 `lit` 导入。
- 新增 `@kissjs/adapter-lit`，把 Lit `TemplateResult` 转成可用于 DSD SSR 的 HTML 字符串。
- DSD SSR 增强：支持 Lit 静态样式提取、文本/属性转义、布尔属性、数组、nested TemplateResult、`nothing` 等。
- 移除旧 Lit hydration 叙事，当前模型改为 Declarative Shadow DOM + Island Upgrade。
- `renderNestedDsd()` 不作为 0.5 公共能力发布，nested DSD 留到 v0.6 的 DSD Renderer 2。
- create-kiss 模板升级：直接导入 Lit、补全 Lit 子包 import map、补 JSR UI alias、增加 `.gitignore`。
- package islands 的 SSR 解析路径更稳，不再强迫 Vite SSR runner 解析 JSR package island。
- client island build 改用 OXC minify，避免新项目额外依赖 esbuild。
- 文档大幅刷新：README 中文版、getting started、deployment、SSG、architecture、islands、roadmap、changelog 等统一到 0.5 心智模型。
- Roadmap 明确：v0.6 优先 DSD Renderer 2，v0.7 做 Island Upgrade，serverless/blog/admin 放到后续产品方向。
- CI/发布改进：GitHub Actions 通过 JSR OIDC 发布，dry-run/发布 include 更明确。
- 测试覆盖从 v0.4.0 release note 中的 `84/84` 扩展到当前 `296 passed`，新增 adapter-lit、SSG smoke、create-kiss E2E 等发布阻塞测试。

## 用户可感知差异

```ts
// v0.4 之前容易形成的心智
import { html, css, LitElement } from '@kissjs/core';

// 当前推荐
import { html, css, LitElement } from 'lit';
```

```json
{
  "tasks": {
    "dev": "deno run --config deno.json -A npm:vite",
    "build": "deno run --config deno.json -A jsr:@kissjs/core/cli/build"
  }
}
```

## 一句话总结

相比 v0.4.0，当前版本把 KISS 从“UI + SSG/SSR 可用原型”推进成了更可信的 0.5 正式线：主路径更简单，Core/Lit 边界更清楚，DSD SSR 更稳定，JSR create 项目已经能真实一键构建。

---

# KISS Current Version vs v0.4.0

Baseline: [v0.4.0 Release](https://github.com/SisyphusZheng/kiss/releases/tag/v0.4.0)

## Version Changes

| Package | At v0.4.0 | Current |
| --- | ---: | ---: |
| `@kissjs/core` | `0.3.4` | `0.5.2` |
| `@kissjs/ui` | `0.4.0` | `0.5.0` |
| `@kissjs/rpc` | `0.2.5` | `0.3.0` |
| `@kissjs/create` | `0.3.4` | `0.4.4` |
| `@kissjs/adapter-lit` | not separately released | `0.2.0` |

## Major Changes

- The primary user flow is now `create -> dev -> build -> deploy`.
- Added the official one-command build entry: `@kissjs/core/cli/build`.
- The internal build still has three observable phases: Vite SSR build, client island build, and SSG.
- `@kissjs/core` no longer re-exports `css`, `html`, or `LitElement`; users import them directly from `lit`.
- Added `@kissjs/adapter-lit` to convert Lit `TemplateResult` values into DSD-friendly SSR HTML.
- Improved DSD SSR with Lit static style extraction, safe text/attribute escaping, boolean attributes, arrays, nested TemplateResults, and `nothing`.
- Removed the old Lit hydration narrative. The current model is Declarative Shadow DOM plus Island Upgrade.
- `renderNestedDsd()` is not shipped as a v0.5 public capability; nested DSD is planned for v0.6 DSD Renderer 2.
- Upgraded the create-kiss template with direct Lit imports, explicit Lit subpackage import maps, JSR UI aliases, and a default `.gitignore`.
- Package island resolution is more robust and no longer forces Vite’s SSR runner to resolve JSR package islands.
- Client island builds now use OXC minification, avoiding an extra esbuild requirement in generated apps.
- Documentation was refreshed across README, getting started, deployment, SSG, architecture, islands, roadmap, and changelog.
- Roadmap was clarified: v0.6 focuses on DSD Renderer 2, v0.7 on Island Upgrade, and serverless/blog/admin move to later product directions.
- CI and publishing were hardened with JSR OIDC, clearer publish includes, dry-run checks, and real create-kiss E2E coverage.
- Test coverage grew from the v0.4.0 release note’s `84/84` to the current `296 passed`.

## User-Facing Difference

```ts
// Old mental model
import { html, css, LitElement } from '@kissjs/core';

// Current recommendation
import { html, css, LitElement } from 'lit';
```

```json
{
  "tasks": {
    "dev": "deno run --config deno.json -A npm:vite",
    "build": "deno run --config deno.json -A jsr:@kissjs/core/cli/build"
  }
}
```

## Summary

Compared with v0.4.0, the current version turns KISS from a usable UI + SSG/SSR prototype into a more trustworthy 0.5 release line: the main workflow is simpler, the Core/Lit boundary is cleaner, DSD SSR is more reliable, and newly generated JSR projects can be built through the one-command pipeline.
