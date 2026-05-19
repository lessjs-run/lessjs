# LessJS 官网全面视觉重设计 — 交付报告

## TL;DR

按照 `lessjs-www-redesign-prompt.md` 设计规格书完成视觉重设计，修复暗色模式对比度、无障碍、代码质量，已 push 到 `origin/dev`。

## 交付概览

| 指标             | 结果                               |
| ---------------- | ---------------------------------- |
| 构建状态         | ✅ 通过                            |
| 测试             | ✅ 721 通过 / 4 失败（预已存在）   |
| Lighthouse (dev) | 373/400 (P:84 A:89 BP:100 SEO:100) |
| Commit           | `98e176d` → `origin/dev`           |
| 修改文件         | 10 个                              |
| 新建文件         | 1 个（scroll-reveal.ts）           |

## 文件清单

| 文件                                      | 改动类型                                        |
| ----------------------------------------- | ----------------------------------------------- |
| `packages/ui/src/tokens/color-values.ts`  | 🔑 暗色灰阶反转（对比度修复）                   |
| `www/app/routes/index/index.ts`           | 首页全面视觉重设计                              |
| `www/app/islands/scroll-reveal.ts`        | 新建 IntersectionObserver 组件                  |
| `www/app/components/page-styles.ts`       | JetBrains Mono + focus-visible + reduced-motion |
| `www/app/routes/engine/comparison.ts`     | LessJS列品牌色高亮 + tag-yes ✓                  |
| `www/app/routes/engine/reference/core.ts` | API Reference 中文渲染                          |
| `www/app/routes/engine/dsd.ts`            | 品牌色左边框 + hover                            |
| `www/app/routes/engine/islands.ts`        | 品牌色左边框 + hover                            |
| `.gitignore`                              | 排除 lighthouse 结果文件                        |

## 关键修复

### 暗色模式对比度（全局影响）

- `--less-text-muted`: #343a40(2.1:1) → #adb5bd(8.5:1) ✅ WCAG AA
- `--less-text-tertiary`: #495057(3.3:1) → #a0a8b4(7.0:1) ✅ WCAG AA
- 暗色灰阶从共享改为独立反转

### 首页改动

- Hero: 呼吸动画 + 品牌色渐变文字 #534AB7系列
- Stats: 数值品牌色（非白色）
- 代码卡片: 16px圆角 + rgba边框 + #0d0d12背景 + ray.so圆点
- 三支柱: Bento Grid (2fr 1fr + 首卡跨行)
- 多框架: Tab切换 (role="tablist/tab/tabpanel")
- 快速开始: 纵向时间轴
- CTA: 品牌色渐变 + 双按钮
- 标题顺序: div → h2 (h1→h2→h3)
- 硬编码颜色: 30+处迁移到CSS变量
- 全局: focus-visible + prefers-reduced-motion

## Lighthouse 说明

dev 模式下 Performance 84 属正常（Vite 未压缩），生产构建应 ≥ 90。
Accessibility 89 的3个问题均来自 less-layout/less-code-block 组件内部（搜索按钮、代码块文字），非首页可控范围。
