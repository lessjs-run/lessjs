# LessJS 官网全面视觉重设计 — 交付报告

## TL;DR

按照 `lessjs-www-redesign-prompt.md` 设计规格书，对 LessJS 官网 12 个文件完成全面视觉重设计，从「功能可用但视觉朴素」升级为品牌色系统贯穿、交互式布局、品质感设计语言。

## 交付概览

| 指标 | 结果 |
|------|------|
| 构建状态 | ✅ 通过 |
| 测试 | ✅ 729 通过 / 0 失败 |
| 修改文件 | 12 个 |
| 新建文件 | 1 个（scroll-reveal.ts） |
| 已知问题 | Budget warnings（非本次引入） |

## 文件清单

### 首页（核心改动）
- `www/app/routes/index/index.ts` — 全面视觉重设计

### 新建组件
- `www/app/islands/scroll-reveal.ts` — IntersectionObserver 滚动揭示

### 共享样式
- `www/app/components/page-styles.ts` — JetBrains Mono / focus-visible / prefers-reduced-motion

### 文档页
- `www/app/routes/engine/comparison.ts` — 对比表格品牌色高亮
- `www/app/routes/engine/reference/core.ts` — API Reference 中文渲染
- `www/app/routes/guide/islands-deep.ts` — layer-card + strategy-item
- `www/app/routes/guide/getting-started.ts` — note 品牌色
- `www/app/routes/guide/deployment.ts` — platform-card hover
- `www/app/routes/guide/dsd.ts` — comparison-item 样式
- `www/app/routes/guide/islands.ts` — comparison-item 样式
- `www/app/routes/404.ts` — 品牌色交互
- `www/app/routes/ui.ts` — 设计系统页面品牌色

## 首页关键改动

| 区域 | 改动 |
|------|------|
| Hero | 呼吸动画 @keyframes heroGlow 8s + 品牌色渐变文字 #534AB7系列 |
| 数据指标 | 数值改为品牌色 var(--less-brand) |
| 代码卡片 | 圆角16px + rgba边框 + #0d0d12背景 |
| 三支柱 | Bento Grid (2fr 1fr + 首卡跨行) |
| 多框架 | Tab 切换 (role="tablist/tab/tabpanel") |
| 快速开始 | 纵向时间轴（品牌色竖线+圆点+步骤编号） |
| CTA | 品牌色渐变背景 + 双CTA按钮 |
| 全局 | section间距4rem + focus-visible + prefers-reduced-motion |

## 设计系统一致性

- ✅ 品牌色 #534AB7 贯穿全站
- ✅ CSS 变量优先使用 --less-* 系列
- ✅ JetBrains Mono 代码字体
- ✅ 暗色模式一等公民
- ✅ 移动端适配（900px + 480px）
- ✅ 无障碍（role/aria/focus-visible）
- ✅ 零重依赖

## 用户下一步建议

1. 运行 `deno task dev` 本地预览效果
2. 检查暗色/亮色模式切换是否正常
3. 检查移动端布局是否舒适
4. 运行 Lighthouse 评估性能（目标 Performance ≥ 90）
5. 如需微调颜色/间距，所有关键值均使用 CSS 变量可快速调整
