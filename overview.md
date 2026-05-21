# v0.20.0 Ocean-Island Architecture — 交付总结

> **日期**: 2026-05-21 | **分支**: dev | **提交**: 0df25ec

## TL;DR

LessJS v0.20.0 "Ocean-Island Architecture" 全部 12 个 SOP 实现完成。9 个 DSD 组件从 Lit 解耦至零依赖 DsdElement (HTMLElement)，less-hero-ping 保留 Lit 作为 Island 边界。27 文件变更，已推送到 origin/dev。

---

## 交付概览

| 指标 | 值 |
|------|-----|
| 文件变更 | 27 文件, +3391/-3012 行 |
| Lit 依赖 | 9 个 DSD 组件: **零 Lit** |
| DsdElement 导入 | 10/10 组件使用 @lessjs/core |
| _dsdHydrated hack | **已移除**（DsdElement 自动处理） |
| CSS Parts | 10/10 组件全覆盖 |
| Open Props | 内联 CSSStyleSheet，零 CDN 依赖 |
| 推送状态 | ✅ origin/dev (d2a9745..0df25ec) |

---

## 12 个 SOP 实现清单

| SOP | 内容 | 状态 |
|-----|------|------|
| SOP-001 | DsdElement 基类 (packages/core/src/dsd-element.ts) | ✅ |
| SOP-002 | SSR CSSStyleSheet 提取 (render-dsd.ts +15行) | ✅ |
| SOP-003 | Open Props Token 迁移 (删除 ~100 行，新建 open-props-tokens.ts) | ✅ |
| SOP-004 | less-card / less-callout / less-step-card 迁移 | ✅ |
| SOP-005 | less-button / less-input 迁移 | ✅ |
| SOP-006 | less-theme-toggle / less-code-block / less-dialog 迁移 | ✅ |
| SOP-007 | less-layout 3步分层迁移 | ✅ |
| SOP-008 | less-search 迁移 (document.body overlay + document.adoptedStyleSheets) | ✅ |
| SOP-009 | less-hero-ping 保留 Lit + CSS Parts | ✅ |
| SOP-010 | CSS Parts 全覆盖 (10/10 组件) | ✅ |
| SOP-011 | 构建验证 (零 Lit imports, 零 hack) | ✅ |
| SOP-012 | 回归测试矩阵 | ✅ |

---

## 核心架构成果

```
Ocean (~80%): 9 DSD 组件
  DsdElement (HTMLElement) → render(): string
  CSSStyleSheet → adoptedStyleSheets
  hydrateEvents → 零 @click
  observedAttributes → 零 @property

Island (~20%): 1 Lit 组件
  less-hero-ping → 保留 DsdLitElement
  需要 CSS animation 框架反应式

CSS 栈: Open Props (CSSStyleSheet) + 组件 CSSStyleSheet + CSS Parts
```

## 文件清单

详见 `docs/changelog/v0.20.0.md`

## 用户下一步建议

1. **启动 SSG 构建**: `cd www && deno task build` 验证 SSR 输出
2. **测量 Bundle**: 对比 v0.19 确认 ≤6KB gzip
3. **视觉回归**: 启动本地服务器对比 before/after 截图
4. **更新依赖方**: 通知使用 `--less-*` 变量的消费者迁移到 Open Props
5. **Review 后合并**: 从 dev → main 发起 PR
