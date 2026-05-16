# 第三轮修复完成

## 修复内容

| 修复                            | 文件                                            | 说明                                                      |
| ------------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| Vanilla adapter render fallback | `packages/adapter-vanilla/src/dsd-hydration.ts` | Mixin 层自动调用 `render()`，所有 `ssr:false` island 受益 |
| Shoelace 颜色对比度             | `www/app/islands/shoelace-showcase.ts`          | Primary/Success/Neutral 按钮颜色加深                      |

## 文档更新

| 文件                                                   | 变更                           |
| ------------------------------------------------------ | ------------------------------ |
| `docs/changelog/v0.17.4.md`                            | 追加 Third-Round Findings 章节 |
| `docs/status/STATUS.md`                                | 新增 Third Round 记录          |
| `docs/conversation/vanilla-adapter-render-fallback.md` | 新建事故报告                   |
| `docs/conversation/README.md`                          | 引用新文件                     |

## 提交

`0b2673d` — 已 push 到 `origin/dev`
