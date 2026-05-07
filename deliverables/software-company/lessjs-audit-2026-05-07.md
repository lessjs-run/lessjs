# LessJS 框架四维审计综合报告

**项目：** LessJS — Deno-first、Web Standards-first 的现代全栈框架
**版本：** v0.6.1 / v0.6.2
**审计日期：** 2026-05-07
**审计团队：** 齐活林（主理人）· 许清楚（产品经理）· 高见远（架构师）· 寇豆码（工程师）· 严过关（QA工程师）

---

## 执行摘要

### TL;DR

LessJS 是一个理念清晰、架构方向正确但执行尚不成熟的早期框架。DSD-first + SSG + Islands 的组合在 2026 年具有真实的技术差异化价值，但面临学习曲线过陡、测试覆盖不足、核心代码存在手工同步债务、品牌定位模糊等多重挑战。综合评分 **6.1/10**——技术根基扎实，但距离生产可用和社区采用仍有显著差距。

### 四维评分总览

| 维度 | 审计人 | 评分 | 一句话结论 |
|------|--------|:----:|-----------|
| 产品与市场 | 许清楚 | **5.7/10** | 理念真诚但差异化不锋利，品牌与定位存在矛盾 |
| 架构设计 | 高见远 | **7.0/10** | 方向正确，核心决策深思熟虑，但技术债累积风险高 |
| 代码质量 | 寇豆码 | **7.2/10** | 整体质量良好，注释详尽，但存在关键重复和安全隐患 |
| 测试与质量保障 | 严过关 | **4.5/10** | 覆盖率不足，关键模块零测试，CI/CD 有多个缺口 |
| **综合** | — | **6.1/10** | **技术根基扎实，执行层面需补课** |

### 雷达图

```
          产品与市场 5.7
              ★★☆☆☆☆☆☆☆☆
             /            \
            /              \
代码质量 7.2 ★★★★★★☆☆☆☆    架构设计 7.0 ★★★★★★☆☆☆☆
            \              /
             \            /
          测试与QA 4.5
              ★★★★☆☆☆☆☆☆
```

---

## 第一维度：产品与市场（许清楚 · 产品经理）

### 核心发现

#### 1. 定位表述分裂

README 称 LessJS 为"全栈框架"，但定位页面自述为"应用骨架"。v0.6 阶段的实际能力更接近后者——没有 ORM、没有 auth、没有数据库适配器、没有 admin UI，serverless API 仅是基本 Hono 路由导出。在 v0.6 阶段自称"全栈框架"容易引起用户期望落差。

#### 2. 与 Less CSS 命名冲突

Less CSS（lesscss.org）是一个广泛使用的 CSS 预处理器。"LessJS" 在搜索引擎和开发者心智中会与 Less CSS 产生冲突。ADR 0002 规划的 `.less` 文件扩展名也与 Less CSS 已有的 `.less` 扩展名冲突，将在编辑器和构建工具层面产生实际干扰。

#### 3. DSD-first 是真实差异化但表达不力

LessJS 是唯一一个 **SSG + DSD + Islands** 三者组合的框架——Astro 的 Islands 不使用 DSD，Fresh 是 SSR-first 不是 Static-first。但"DSD-first"对大多数开发者没有直观意义，更有效的表达是"首屏零 JS、零闪烁、SEO 友好"。

#### 4. 学习曲线陡峭

从零学习 LessJS 需要掌握 8+ 个概念体系：Deno 工具链、Lit 框架、Web Components 规范、Declarative Shadow DOM、Islands 架构（4 种策略）、Hono API 路由、Vite 配置、TC39 Signals。比 Astro（学 .astro 文件即可）、Fresh（学 Preact 即可）都要高。

#### 5. "Web Standards-first" 与 Lit 硬依赖冲突

所有 UI 组件基于 Lit，所有页面组件基于 LitElement。Lit 不是 Web Standard，它与 "Web Standards-first" 存在根本张力。ADR 0002 认识到了这个问题并规划 `.less` 编译器，但状态是 DRAFT，规划在 v0.10。

### 产品维度评分明细

| 子维度 | 评分 | 说明 |
|--------|:----:|------|
| 项目定位 | 6/10 | 诚实但不够锋利，"全栈"过度承诺 |
| 命名 | 4/10 | 与 Less CSS 冲突，不传递技术信号 |
| 竞品差异化 | 7/10 | DSD-first 是真实优势，但表达不力 |
| 目标用户 | 6/10 | 知道谁该用谁不该用，但学习曲线太高 |
| 理念执行 | 7/10 | 方向正确，Lit 硬依赖是最大偏差 |
| SWOT 综合 | 6/10 | 优势真实但不够宽，威胁很近 |
| 文档与 DX | 5/10 | 覆盖面广但深度不够，缺交互式体验 |
| 路线图 | 7/10 | 顺序合理，v0.7/v0.8 优先级可调整 |
| 商业可持续性 | 3/10 | 单人项目，无社区，无商业模型 |

### SWOT 精要

| | 正面 | 负面 |
|---|---|---|
| **内部** | S: DSD-first 技术优势、ADR 文档质量极高、三层组件模型设计优秀 | W: Lit 硬依赖、学习曲线陡峭、生态几乎为零、品牌命名冲突 |
| **外部** | O: DSD 浏览器支持率 94%+、TC39 Signals 标准化、Islands 架构趋势 | T: Astro 绝对领先、Fresh Deno 官方背书、Lit 未来不确定 |

---

## 第二维度：架构设计（高见远 · 架构师）

### 核心发现

#### 1. runtime-shim.ts 与 render-dsd.ts 手动同步 — 🔴 最严重的技术债

`runtime-shim.ts` 将 `render-dsd.ts` 的 TypeScript 代码手写为 JavaScript 字符串模板。文件头维护警告列出 8 个必须手动同步的区域。**实际差异已存在**：`runtime-shim.ts:60-68` 的 `serializeAttributes` 缺少 `escapeAttrValue` 调用（render-dsd.ts 版本有 null/undefined 处理逻辑），两者不完全等价。没有任何自动化测试验证两文件的行为一致性。

#### 2. Signal polyfill 完全内联，原生切换未实现 — 🔴

749 行 TC39 signal-polyfill 完全内联到框架中，且注释声明的 "When browser natively supports Signal, engine auto-switches to native" **实际未实现**——代码直接 `_engine = _createPolyfill()`，无 `globalThis.Signal` 检测。这是文档与实现不一致的问题。

#### 3. render-dsd.ts 职责过多（771 行）

该文件承担了：Safe/Unsafe HTML 合约、三层组件模型定义、适配器协议、DSD 渲染主函数、嵌套 CE 递归渲染、HTML 属性解析、标签匹配算法、Shadow DOM 范围检测。建议拆分为 4 个独立模块。

#### 4. 核心架构决策合理

- **adapter 注入协议**：`RenderAdapter` 接口仅 3 个方法，添加新 adapter 容易
- **core 零 Lit 依赖**：严格执行，通过 subpath exports 精确引用
- **三阶段构建管线**：Phase 分离设计合理，文件桥接模式干净
- **EntryDescriptor 两阶段分离**：纯数据变换 + 纯字符串渲染，独立可测试
- **三层组件模型**：DSD Static / DSD Interactive / Pure Island 分层合理

#### 5. 渲染性能存在瓶颈

`renderNestedCustomElements` 每次迭代对整个 HTML 执行正则扫描 + 字符串替换，这是 O(n²) 操作。CSS token 重复注入导致 SSG HTML 膨胀。全量 SSG 无增量构建能力。

### 架构债务清单

| ID | 严重度 | 描述 | 位置 |
|----|--------|------|------|
| TD-1 | 🔴 严重 | runtime-shim.ts 与 render-dsd.ts 手动同步 | runtime-shim.ts:1-27 |
| TD-2 | 🔴 严重 | Signal polyfill 内联，无原生切换 | signals/src/index.ts:57 |
| TD-3 | 🟡 中等 | render-dsd.ts 771 行，职责过多 | render-dsd.ts |
| TD-4 | 🟡 中等 | islandEffect 断开检测依赖 5 秒轮询 | signals/src/index.ts:626 |
| TD-5 | 🟡 中等 | less-button 手写 DSD 检测，未复用 DsdLitElement | ui/src/less-button.ts:46-54 |
| TD-6 | 🟡 中等 | build-ssg.ts 硬编码 noExternal 列表 | core/src/cli/build-ssg.ts:149-159 |
| TD-7 | 🟡 中等 | 版本号不同步（0.6.1 vs 0.6.2） | signals/rpc/create 的 deno.json |
| TD-8 | 🟢 低 | batch() 函数无实际逻辑 | signals/src/index.ts:639-645 |
| TD-9 | 🟢 低 | headExtras 无 XSS 防护 | types.ts:40-46 |
| TD-10 | 🟢 低 | PWA service worker 内嵌在 build-ssg.ts 中 | core/src/cli/build-ssg.ts:397-434 |

### 架构维度评分明细

| 子维度 | 评分 | 说明 |
|--------|:----:|------|
| 包结构 | 8/10 | core 零 Lit 依赖严格执行；ui 职责略多；无循环依赖 |
| 模块划分 | 7/10 | EntryDescriptor 分离精良；render-dsd.ts 职责过多 |
| DSD 渲染管线 | 7/10 | 算法正确；规范对齐；runtime-shim 同步风险；O(n²) |
| SSG 构建管线 | 8/10 | 三阶段分离合理；文件桥接模式；CSP nonce 处理 |
| Island 架构 | 8/10 | 三层模型设计优秀；WithDsdHydration Mixin 完善 |
| 信号系统 | 6/10 | polyfill 内联风险最大；native 未实现；islandEffect 检测粗糙 |
| 架构扩展性 | 7/10 | adapter 协议简洁；packageIslands 自动发现；无 SSR/ISR |
| 架构债务 | 5/10 | runtime-shim 同步债最大；CSS 重复注入；全量构建 |

---

## 第三维度：代码质量（寇豆码 · 工程师）

### 核心发现

#### 1. 🔴 escapeHtml/escapeAttr 和 renderNestedCustomElements 大量重复

`core/src/render-dsd.ts` 和 `core/src/runtime-shim.ts` 之间有约 300 行代码以 TypeScript/JavaScript 字符串形式重复。这是架构层面最严重的代码重复问题。此外，`ssr-handler.ts:28-31` 和 `entry-renderer.ts:233` 手动实现了部分 HTML 转义，未复用已有的 `escapeHtml()` 函数。

#### 2. 🔴 headExtras 无 XSS 防护

`core/src/types.ts:46` 的 `headExtras` 虽有 `@dangerous` JSDoc 标记，但运行时完全不做任何检查。`ssr-handler.ts:95` 注释明确 `// developer-provided HTML, intentionally not escaped`。如果 headExtras 来自用户输入，会导致 XSS。`inject.headFragments` 更是连 `@dangerous` 标记都没有。

#### 3. 🔴 多处 catch 块静默吞没错误

至少 8 处 catch 块完全吞没错误，无任何日志：
- `render-dsd.ts:292-293` — 属性设置失败静默
- `render-dsd.ts:346-348` — 样式提取失败静默
- `island.ts:115-117` — 属性设置失败静默
- `ssg-postprocess.ts:76-78` — manifest 解析失败静默
- `build-ssg.ts:63,240,429,468` — 多处静默 catch

#### 4. insertAfterHead 和 DSD 检测逻辑重复

`insertAfterHead()` 在 `ssg-postprocess.ts:16-25` 和 `ui/ssg-inject.ts:25-34` 完全重复。3 个 UI 组件（less-button, less-card, less-input）手动实现 DSD 水合检测，未使用 DsdLitElement 基类，与其它组件的 DSD 水合模式不一致。

#### 5. TypeScript 类型安全有改进空间

signals 包文件级 `deno-lint-ignore no-explicit-any`，内部大量 `any` 类型。多处不安全的类型断言绕过类型系统（`as unknown as`）。`DsdComponent` 的 `[key: string]: unknown` 索引签名过于宽泛。

### 代码质量问题清单

**Critical (3)**

| # | 问题 | 位置 |
|---|------|------|
| C1 | escapeHtml/escapeAttr 和 renderNestedCustomElements 大量重复 | render-dsd.ts vs runtime-shim.ts |
| C2 | headExtras 无任何 XSS 防护，仅有文档标记 | types.ts:46, ssr-handler.ts:95 |
| C3 | 多处 catch 块静默吞没错误 | render-dsd.ts:292,346, island.ts:115, ssg-postprocess.ts:76 等 |

**High (5)**

| # | 问题 | 位置 |
|---|------|------|
| H1 | insertAfterHead() 在 core 和 ui 中完全重复 | ssg-postprocess.ts:16-25, ui/ssg-inject.ts:25-34 |
| H2 | 3 个 UI 组件手动实现 DSD 水合检测 | less-button.ts:48-54, less-card.ts:32-38, less-input.ts:49-55 |
| H3 | wrapInDocument 在 ssr-handler.ts 和 runtime-shim.ts 中重复 | ssr-handler.ts:66-133, runtime-shim.ts:373-411 |
| H4 | headFragments 无任何安全验证 | core/src/types.ts:67 |
| H5 | islandEffect 的 setInterval 轮询可能造成性能问题 | signals/src/index.ts:626 |

### 代码质量维度评分明细

| 子维度 | 评分 | 说明 |
|--------|:----:|------|
| TypeScript 类型安全 | 6/10 | 类型导出完整，但 any 太多、断言不安全 |
| 错误处理 | 7/10 | 自定义错误层次完整，但静默 catch 太多 |
| 代码重复 | 5/10 | runtime-shim 同步是最大重复源；多处辅助函数重复 |
| 命名规范 | 8/10 | 文件/导出命名一致性好 |
| API 设计一致性 | 7/10 | 返回值统一，但参数模式有差异 |
| 死代码/未使用导出 | 8/10 | 少量未使用变量和被注释 import |
| 性能考量 | 7/10 | O(n²) 渲染算法、同步文件操作、islandEffect 轮询 |
| 安全性 | 6/10 | headExtras/headFragments XSS、CSP nonce 实现、CORS 默认配置 |

---

## 第四维度：测试与质量保障（严过关 · QA 工程师）

### 核心发现

#### 1. 3 个关键模块零测试覆盖 — 🔴 生产事故级风险

| 模块 | 行数 | 风险描述 |
|------|------|---------|
| render-dsd.ts | 770 | 框架最核心的 DSD 渲染器，任何回归导致所有 SSR 输出损坏 |
| island.ts | 321 | 用户最直接接触的 API，注册/策略/metadata 无测试保护 |
| signals | 749 | 响应式基础，零测试意味着任何行为变更不会被捕获 |

加上 `dsd-hydration.ts`（214 行零测试），这四个模块合计 **2054 行核心代码完全无自动化测试保护**。

#### 2. 完全缺失浏览器端 E2E 测试

LessJS 的核心价值（DSD、Islands hydration、Shadow DOM 渲染）**必须在真实浏览器中验证**，但当前没有任何浏览器测试。这是测试架构的最大缺陷。

#### 3. CI/CD 多个缺口

- **test.yml 遗漏 adapter-lit 测试**：有 2 个测试文件但 CI 不运行
- **test.yml 遗漏 docs 测试**：`docs/__tests__/islands-reactivity.test.ts` 存在但不运行
- **publish.yml 无测试门禁**：`push: paths: packages/*/deno.json` 直接发布，不等待 test.yml 完成
- **`--allow-dirty` 发布**：允许在 dirty working tree 中发布
- **typecheck 仅检查 6 个入口文件**：不覆盖测试文件、CLI 文件、子模块
- **lint/fmt 跳过 docs/ 目录**：Deno fmt 在 HTML tagged template literals 上有 panic bug

#### 4. 测试质量有改进空间

- `index-plugin.test.ts:195` — `assertEquals(true, true)` 纯占位断言
- 多个 UI 组件测试仅验证 `render()` 返回值非空，不验证模板正确性
- UI 测试中大量 `(instance as any)` 访问私有成员，与实现细节强耦合
- DOM mock 脆弱：手动 mock `document`/`localStorage`，替换 `globalThis.setTimeout`

#### 5. 无 pre-commit hooks

开发者可以在本地绕过所有质量检查直接提交，这是最急需修复的质量门禁缺陷。

### 测试覆盖率估算

| 包 | 源码行 | 测试行 | 覆盖率 | 评级 |
|---|---|---|---|---|
| @lessjs/core | ~4000 | ~2800 | ~65% | 中 |
| @lessjs/adapter-lit | ~460 | ~370 | ~55% | 中 |
| @lessjs/rpc | ~400 | ~500 | ~70% | 中高 |
| @lessjs/signals | 749 | 0 | 0% | 无 |
| @lessjs/ui | ~2800 | ~1200 | ~30% | 低 |
| @lessjs/create | ~300 | ~332 | ~50% | 中低 |

**总体测试代码比率：** 5716 行测试 / 10073 行源码 ≈ 56.7%

### QA 维度评分明细

| 子维度 | 评分 | 说明 |
|--------|:----:|------|
| 覆盖广度 | 5/10 | 核心模块大部分有测试，但 3 个关键模块零覆盖 |
| 覆盖深度 | 4/10 | 许多测试仅验证导出形状或不崩溃 |
| 断言质量 | 7/10 | 有断言的测试质量较好 |
| 边界条件 | 5/10 | 部分模块充分，核心渲染器零覆盖 |
| 回归保护 | 4/10 | 仅部分已知 bug 有回归测试 |
| CI/CD 完整性 | 5/10 | 基本流程在，但有多个缺口 |
| E2E/浏览器测试 | 1/10 | 几乎不存在 |

---

## 跨维度交叉分析

### 风险热力图

| 风险 | 产品 | 架构 | 代码 | QA | 综合等级 |
|------|:----:|:----:|:----:|:---:|:---------:|
| runtime-shim 与 render-dsd 不同步 | — | 🔴 | 🔴 | 🔴 | **🔴🔴🔴** |
| 核心模块零测试（render-dsd/island/signals） | — | — | — | 🔴 | **🔴** |
| Lit 硬依赖与理念冲突 | 🔴 | 🟡 | 🟡 | — | **🔴** |
| headExtras/headFragments XSS | — | 🟢 | 🔴 | — | **🟡** |
| 学习曲线过陡 | 🔴 | — | — | — | **🔴** |
| 命名冲突（Less CSS） | 🔴 | — | — | — | **🔴** |
| Signal polyfill 内联锁定 | — | 🔴 | 🟡 | 🔴 | **🔴** |
| DSD 水合约定不可强制 | — | 🟡 | 🟡 | 🟡 | **🟡** |
| 静默 catch 吞没错误 | — | — | 🔴 | 🟡 | **🔴** |
| 发布无测试门禁 | — | — | — | 🔴 | **🔴** |
| 单人项目可持续性 | 🔴 | — | — | — | **🔴** |

### 发现关联图

```
Lit 硬依赖 ─────────────────────────────→ DSD 水合模式不统一
    │                                        │
    ↓                                        ↓
理念冲突 ("Web Standards-first")     3 个组件手写 DSD 检测
    │                                        │
    ↓                                        ↓
.less 编译器 (v0.10) 规划           代码重复 (C1, H2)
                                              │
runtime-shim 手动同步 ─────────────→ 代码重复 (C1, H3)
    │
    ↓
零同步验证测试 ────────────────────→ 潜在行为差异
    │
    ↓
render-dsd.ts 770 行零测试 ────────→ 回归风险极高
```

---

## 统一优先级排序

### P0 — 立即修复（1-2 周）

| # | 问题 | 来源 | 行动项 |
|---|------|------|--------|
| 1 | runtime-shim 与 render-dsd 手动同步 | 架构🔴 代码🔴 QA🔴 | 添加 escape-consistency 全量测试；启动 AST 代码生成替代方案 |
| 2 | render-dsd.ts 零测试（770 行核心渲染器） | QA🔴 | 为 escapeHtml/escapeAttr/serializeAttributes/renderDSD 添加单元测试 |
| 3 | island.ts 零测试（321 行用户 API） | QA🔴 | 为注册/策略/metadata 添加单元测试 |
| 4 | headExtras/headFragments XSS 风险 | 代码🔴 | 添加运行时警告；标记 `unsafeHeadExtras`；为 headFragments 添加基本验证 |
| 5 | CI 遗漏 adapter-lit/docs 测试 | QA🔴 | 在 test.yml 中添加 test-adapter-lit 和 test-docs job |
| 6 | publish.yml 无测试门禁 | QA🔴 | 添加 `needs: [typecheck, test-core, test-rpc, test-ui, test-create, build-docs]` |
| 7 | 静默 catch 吞没错误 | 代码🔴 | 至少添加 `console.warn`；关键路径改为更严格错误处理 |
| 8 | 添加 pre-commit hooks | QA🔴 | lint + fmt:check + typecheck |

### P1 — 重要改进（1-2 月）

| # | 问题 | 来源 | 行动项 |
|---|------|------|--------|
| 9 | Signal polyfill 内联 + 无原生切换 | 架构🔴 QA🔴 | 替换为 npm 依赖 + `globalThis.Signal` 检测 |
| 10 | signals 包零测试（749 行） | QA🔴 | 添加完整测试套件 |
| 11 | dsd-hydration.ts 零测试 | QA🔴 | 添加单元测试 |
| 12 | render-dsd.ts 职责过多（771 行） | 架构🟡 | 拆分为 4 个模块（core/nested-dsd/html-escape/dsd-options） |
| 13 | 3 个 UI 组件未使用 DsdLitElement | 架构🟡 代码🟡 | 统一使用 DsdLitElement 或提取共享 createRenderRoot |
| 14 | insertAfterHead 重复 | 代码🟡 | 抽取到 core 共享工具函数 |
| 15 | 统一所有包版本号 | 架构🟡 | 全部更新为 0.6.2 |
| 16 | 重写核心定位语 | 产品🔴 | 从"全栈框架"改为"SSG-first Web Components 框架" |
| 17 | 创建交互式 Playground | 产品🟡 | StackBlitz / WebContainers 模板 |
| 18 | 引入浏览器 E2E 测试框架 | QA🔴 | Playwright |

### P2 — 长期规划（3-6 月）

| # | 问题 | 来源 | 行动项 |
|---|------|------|--------|
| 19 | AST 代码生成替代手动 runtime-shim | 架构🔴 | 从 render-dsd.ts 自动生成 runtime-shim |
| 20 | 增量 SSG 构建 | 架构🟡 | 基于文件 hash 缓存，只重新渲染变化的页面 |
| 21 | SSR 模式支持 | 架构🟡 | 利用现有 Hono entry 添加持久化服务器模式 |
| 22 | 评估 .less 扩展名冲突 | 产品🟡 | 考虑改为 `.lessjs` 或 `.ls` |
| 23 | 建立贡献者社区 | 产品🔴 | CONTRIBUTING.md + Good First Issue + Discord |
| 24 | 性能基准测试 | 产品🟡 QA🟡 | Lighthouse 分数、Core Web Vitals、JS Bundle 大小对比 |
| 25 | 覆盖率收集和门禁 | QA🟡 | `deno coverage` 收集并上传 |
| 26 | 视觉回归测试 | QA🟡 | Chromatic/Percy |
| 27 | 安全审计自动化 | QA🟡 | `deno info` 依赖检查 |

---

## 质量保障路线图

```
Week 1-2: P0 紧急修复
├── render-dsd.ts 单元测试（escape/serialize/renderDSD）
├── island.ts 单元测试（注册/策略/metadata）
├── CI 补齐 adapter-lit/docs 测试 job
├── publish.yml 添加 test 依赖
├── headExtras/headFragments 安全警告
├── 静默 catch → console.warn
└── pre-commit hooks

Week 3-8: P1 重要改进
├── signals 包完整测试套件
├── dsd-hydration.ts 测试
├── Signal polyfill → npm 依赖 + native 检测
├── render-dsd.ts 拆分
├── UI 组件统一 DsdLitElement
├── 版本号统一
├── 核心定位语重写
├── 交互式 Playground
└── Playwright E2E 框架引入

Month 3-6: P2 长期规划
├── AST 代码生成替代 runtime-shim
├── 增量 SSG 构建
├── SSR 模式
├── 贡献者社区建设
├── 性能基准 + 覆盖率门禁
├── 视觉回归测试
└── 安全审计自动化
```

---

## 附录

### A. 审计范围

- **代码仓库：** LessJS monorepo（6 个包）
- **源文件：** 46 个 TypeScript 文件，约 10,073 行
- **测试文件：** 20 个测试文件，约 5,716 行
- **CI/CD：** 4 个 GitHub Actions workflow
- **文档：** 5 个 ADR（Architecture Decision Records）

### B. 审计方法论

| 维度 | 方法 |
|------|------|
| 产品与市场 | README/文档分析、竞品对比（6 产品）、SWOT 分析、路线图评估 |
| 架构设计 | 源码结构分析、依赖关系图、模块职责审计、DSD/SSG/Island 管线追踪 |
| 代码质量 | TypeScript 类型安全审查、错误处理审计、代码重复检测、安全扫描 |
| 测试与 QA | 覆盖率估算、断言有效性评估、CI/CD 流程审计、缺失场景识别 |

### C. 竞品对比速查

| 特性 | LessJS | Astro | Fresh | Qwik | SvelteKit | Next.js |
|------|--------|-------|-------|------|-----------|---------|
| 渲染模式 | SSG | SSG/SSR | SSR | SSR/SSG | SSR/SSG | SSR/SSG/ISR |
| DSD | ✅ 核心 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Islands | ✅ 4 策略 | ✅ | ✅ | ❌ (Resumability) | ❌ | ❌ (Partial) |
| Web Components | ✅ 原生 | ❌ | ❌ | ❌ | ❌ | ❌ |
| 运行时 | Deno | Node | Deno | Node | Node | Node |
| UI 框架 | Lit (当前) | 多框架 | Preact | Qwik | Svelte | React |
| GitHub Stars | 新项目 | 49k+ | 13k+ | 21k+ | 81k+ | 130k+ |

### D. 关键文件引用索引

| 发现 | 文件 | 行号 |
|------|------|------|
| 定位表述 | `docs/app/routes/guide/positioning.ts` | 全文 |
| Lit 硬依赖 | `packages/ui/deno.json` | :21 |
| runtime-shim 维护警告 | `packages/core/src/runtime-shim.ts` | :1-27 |
| serializeAttributes 差异 | `packages/core/src/runtime-shim.ts` | :60-68 |
| Signal 原生切换未实现 | `packages/signals/src/index.ts` | :8 vs :57 |
| headExtras @dangerous | `packages/core/src/types.ts` | :40-46 |
| 静默 catch | `packages/core/src/render-dsd.ts` | :292-293, :346-348 |
| CI 遗漏 adapter-lit | `.github/workflows/test.yml` | 全文 |
| 发布无测试门禁 | `.github/workflows/publish.yml` | :5-9 |
| --allow-dirty | `.github/workflows/publish.yml` | :43 |
| 零覆盖渲染器 | `packages/core/src/render-dsd.ts` | 全文 770 行 |
| 零覆盖 island | `packages/core/src/island.ts` | 全文 321 行 |
| 零覆盖信号系统 | `packages/signals/src/index.ts` | 全文 749 行 |
| 零覆盖 DSD 水合 | `packages/adapter-lit/src/dsd-hydration.ts` | 全文 214 行 |
| DOM mock 脆弱性 | `packages/ui/__tests__/components.test.ts` | :303-329 |
| 无效断言 | `packages/core/__tests__/index-plugin.test.ts` | :195 |
| islandEffect 轮询 | `packages/signals/src/index.ts` | :626 |
| batch() 空操作 | `packages/signals/src/index.ts` | :639-645 |
| 无 pre-commit hooks | 项目根目录 | 无 .husky 或 hooks |
| DSD 水合约定 | `packages/adapter-lit/src/dsd-hydration.ts` | :88 |

---

> **报告生成：** 2026-05-07 | **团队：** 齐活林（主理人）· 许清楚（PM）· 高见远（Architect）· 寇豆码（Engineer）· 严过关（QA）
