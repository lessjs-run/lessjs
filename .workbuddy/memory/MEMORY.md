# MEMORY.md - KISS 项目长期记忆

## 项目概况
- KISS Framework: Deno-first, DSD + Island 架构全栈框架
- 仓库: https://github.com/SisyphusZheng/kiss
- 版本线: v0.5.x (trust release)
- 用户: 万控智造柜体销售助理，个人框架实验项目

## 技术栈
- Hono ^4.x + Lit ^3.x + Vite ^8.x + TypeScript + Deno 2.x
- 5 个子包: core(0.5.2), ui(0.5.1), rpc(0.3.0), adapter-lit(0.2.0), create(0.4.5)
- 3-Phase Build: vite build → build-client → build-ssg

## 已知问题 (2026-05-04 审查 → Trust Release 修复后)
- ✅ 根 middleware scope `'//*'` → 已修
- ✅ SSG 丢失 CSP 注入 → 已修
- ✅ 嵌套 islands 路径错误 → 已修
- ✅ Island strategy 被丢弃 → 已修
- ✅ buildIslandChunkMap 双前缀 → 已修
- ✅ kiss-layout.ts DEFAULT_NAV 不同步 → 已修
- ✅ escapeHtml 重复实现 → 已标注 canonical 位置
- docs/public/*.js lint 失败 (29 个 no-var 错误) — 第三方文件
- deno fmt --check 多处失败 + Deno 2.7.14 Windows panic — Deno 上游问题
- 首页硬编码颜色 (#000, #222, #aaa) 破坏主题
- Demo renderer 用 HTML 注释作占位符
- scanPackageIslands 测试有 Deno signal listener 泄漏（非项目 bug）

## 用户偏好
- 中文交流，偏好极简技术风格 UI
- 倾向有抱负的架构愿景，沟通偏好直接
- 文档先行，deno lint + deno fmt

## 2026-05-02 关键 Bug 修复
- Bug 1: SSG DSD 输出缺少 <style> → extractLitStyles 误用 strings 属性
- Bug 2: Island 在父 DSD shadow DOM 内 LitElement 更新卡死 → connectedCallback 竞态
