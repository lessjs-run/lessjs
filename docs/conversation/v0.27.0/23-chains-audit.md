# Conversation: 全量架构审计 — 23 条 workaround 链条

> Date: 2026-05-31
> Participants: Zhi (用户), Qi (交付总监), Xu (产品经理), Gao (架构师)
> Status: 审计完成 → ADR → SOP → 实施

---

## 背景

用户发现 SOP-008 清理 `__ROUTE_MANIFEST__` 后，`virtual:less-nav` 这个"修复"本身就是一个新的 workaround。用户追问：是不是 virtual 模块都可以被 ESM 磁盘文件取代？

由此触发了一次全面的、不留死角的架构链条审计。

## 审计方法

### 五轮扫描

| 轮次 | grep 模式                                                                             | 分析维度                                                                                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1   | 8 种（virtual, globalThis, __LESS_, data-less-, enforce, window.__, define, locale=） | 定义→解析→消费三端对齐                                                                                                                                                                            |
| R2   | 12 维深度扫描                                                                         | 代码生成、try/catch、正则解析、文件大小、node:依赖、硬编码路径、phase token、HMR、HTML post-process、设计注释、超长文件、build context 复杂度                                                     |
| R3   | 16 维极限扫描                                                                         | monorepo依赖、CI/CD、test workaround、版本管理、JSR发布、lockfile、adapter共享代码、i18n架构、SSR handler、RPC/Signals/Hub包、content扫描、主题系统、PWA、error boundary、bundle size、Deno兼容层 |
| R4   | 深度文件审计                                                                          | adapter代码共享、CSP、Dead code、内容扫描器、SSR错误、Cross-runtime                                                                                                                               |
| R5   | 确认零遗漏                                                                            | HMR、Dev server、API routes、compat-check、cem、runtime、依赖图、发布顺序                                                                                                                         |

### 覆盖范围

- 401,000+ 行代码
- 20 个 workspace 包
- 7 个 GitHub Actions workflow
- 19 个包的发布顺序和依赖图

## 全部 23 条链条

### 🔴 P0（4 条）— 一次修复多链死

| #  | 名称                      | 位置                                   | 本质                                         |
| -- | ------------------------- | -------------------------------------- | -------------------------------------------- |
| 1  | 数据 Virtual 级联         | `virtual:less-nav/blog-data/i18n-data` | 3 个磁盘文件已存在，却通过 virtual 绕 3 圈   |
| 5  | phase-context 惰性分发    | `phase-context.ts`                     | 因为 virtual 模块在 buildStart() 后才可用    |
| 6  | enforce:'pre' 竞态        | `ssg-package-resolver.ts:176`          | **根源** — JSR resolver 拦截了不应拦截的路径 |
| 13 | re-export 绑定 virtual 名 | `entry-renderer.ts:599,604`            | 生成的代码写死 `from "virtual:less-..."`     |

**修链条 6 一次，1+5+11+13 四条链同时死。**

### 🟡 P1（12 条）— 品牌、状态、解析

| #  | 名称                                | 位置                                                                            |
| -- | ----------------------------------- | ------------------------------------------------------------------------------- |
| 2  | `__LESS_*` 品牌常數                 | `__LESS_CLIENT_ONLY_TAGS__`, `__LESS_HEAD_EXTRAS__`, `__LESS_BLOG_BASE_PATH__`  |
| 3  | `data-less-e` DOM 品牌              | `event-hydration.ts:47,147` — 出现在所有 SSR HTML 输出                          |
| 4  | `locale=` 手动传参                  | 28 条 route 页面手工计算 locale                                                 |
| 8  | try/catch 静默吞错                  | 43+ 处空的 catch {} 块                                                          |
| 9  | Route Scanner 正则解析              | `route-scanner.ts` 668 行 regex-based                                           |
| 10 | SSG HTML 正则操作                   | `ssg-postprocess.ts` 正则 replace `<head>`                                      |
| 11 | 硬编码 `www/` 路径                  | `build-ssg.ts:501` `resolve(root, 'www/app/data/...')`                          |
| 14 | `__island`/`__tagName` 注入         | `island-transform.ts:72-77` — 品牌标记写入用户源码                              |
| 16 | Core 模块级可变状态                 | `_adapter`, `_warnedHeadExtrasScripts`, `_telemetryHook`, `_visibilityTimeouts` |
| 17 | `HydrateEventDescriptor` deprecated | `core/types.ts:560` — 3 个 adapter 仍在使用                                     |
| 19 | SSR Error HTML Leak 品牌            | `render-errors.ts:129,135,151` — `<!-- LessJS ERROR: ... -->`                   |
| 20 | Cross-Runtime Detection             | `typeof Deno !== 'undefined'` in core                                           |
| 21 | Content Scanner 手动解析 JS         | `nav/scanner.ts:32-82` — 逐字符解析 export const meta                           |

### 🟠 P2（1 条）— 大重构

| # | 名称                      | 位置                                      |
| - | ------------------------- | ----------------------------------------- |
| 7 | Entry Renderer 字符串生成 | `entry-renderer.ts` 785 行 `lines.push()` |

### 🟢 P3（6 条）— 顺手清

| #  | 名称                       | 位置                                           |
| -- | -------------------------- | ---------------------------------------------- |
| 12 | Phase Token 类型绕道       | `build-context.ts:188-208` `Symbol() as never` |
| 15 | 死代码 `dom-simulation.ts` | ADR-0032 替换后未删文件                        |
| 18 | `normalizeLocalePath` 重复 | i18n + router 各一份                           |
| 22 | CSP Nonce 占位符           | `NONCE_PLACEHOLDER` 字符串替换                 |
| 23 | Dead Export build-context  | `deno.json:70` — 零引用                        |

## 依赖关系图

```
ssg-package-resolver 竞态 (链条6) ← 根源
  ├→ 3 data virtual (链条1)
  │   ├→ phase-context 惰性分发 (链条5)
  │   ├→ re-export 绑定 virtual 名 (链条13)
  │   └→ Entry Renderer 字符串生成要处理 virtual (链条7)
  └→ www/ 路径硬编码 (链条11)

品牌污染线:
  __LESS_* (链条2) → data-less-e (链条3) → __island/__tagName (链条14) → SSR Error Leak (链条19)

状态污染线:
  Core 模块级 let ×5 (链条16)
  try/catch 静默吞错 ×43 (链条8)

代码脆弱线:
  Route Scanner regex (链条9) → Content Scanner regex (链条21)
  Entry Renderer 字符串生成 (链条7)
  SSG HTML regex (链条10)

清理线:
  死代码 (链条15) → Deprecated API (链条17) → Dead Export (链条23)
```

## 确认正常（第五轮验证）

以下领域经过深度检查，确认**无 workaround 或设计问题**：

- **依赖图**：19 个包，零循环依赖
- **发布顺序**：拓扑排序正确，线性无冲突
- **HMR**：Vite 原生处理，无额外代码
- **API routes**：标准 route scanner 流程
- **Dev server**：Hono dev server 插件，配置精简
- **compat-check**：独立包，导入 core 的 `isValidTagName` 后 re-export
- **cem**：独立包，CEM 格式纯解析
- **runtime**：纯 facade，零实现
- **PWA service worker**：正常生成
- **Open Props theme**：正常
- **@ts-ignore**：仅 1 处 Vite 类型缺口，非 LessJS 问题

## 下一步

→ ADR-0069：消除 workaround 链条
→ SOP-009：step-by-step 实施
→ 实施：P0 → P1 → P2 → P3 逐级修复
