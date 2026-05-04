# KISS 项目审查报告

**审查日期**: 2026-05-04  
**项目**: KISS Framework (Keep It Simple, Stupid)  
**仓库**: https://github.com/SisyphusZheng/kiss  
**版本线**: v0.5.x (trust release)

---

## 一、项目概览

KISS 是一个 Deno-first、Web Standards-first 的全栈框架，核心理念是 **K·I·S·S**：
- **K**nowledge — 构建时优先于运行时发现
- **I**solated — 客户端 JS 只存在于 Islands 和组件边界内
- **S**emantic — HTML 是首要文档格式和无障碍基底
- **S**tatic — SSG 输出可部署为静态文件

技术栈：Hono ^4.x + Lit ^3.x + Vite ^8.x + TypeScript + Deno 2.x

### 包结构

| 包 | 版本 | 定位 | 源文件数 | 测试数 |
|---|------|------|---------|--------|
| @kissjs/core | 0.5.2 | Vite 插件、路由扫描、DSD 渲染、SSG 管线 | 18 | 17 文件 |
| @kissjs/ui | 0.5.1 | Lit Web Component 组件库 + 设计令牌 | 13 | 2 文件 |
| @kissjs/rpc | 0.3.0 | fetch/RPC 控制器工具 | 1 | 3 文件 |
| @kissjs/adapter-lit | 0.2.0 | Lit SSR 适配器 | 2 | 1 文件 |
| @kissjs/create | 0.4.5 | 项目脚手架 CLI | 1 | 1 文件 |

### 文档站 (docs/)

39 个路由文件、3 个 Island、2 个组件、3 个渲染器、4 个 ADR

---

## 二、测试与 CI 健康度

### ✅ 测试结果：305 passed, 0 failed (14s)

测试覆盖全面：
- kiss-core: 17 个测试文件，涵盖构建上下文、manifest、entry 生成、CSP/CORS 中间件、SSG 集成、DSD 渲染
- kiss-rpc: 状态机、并发调用、AbortController 集成、重试逻辑
- kiss-ui: 组件实例化、响应式属性、表单回调、主题切换、Vite 插件
- kiss-adapter-lit: 转义、布尔属性、事件/属性剥离、CSSResult 提取
- create-kiss: 模板验证、路径逃逸防护、端到端构建集成测试
- docs: Island 响应式属性检查

### ⚠️ Lint: 29 个问题

全部集中在 `docs/public/` 下的 3 个浏览器脚本文件：
- `theme-init.js` — 使用 `var`（6 个 no-var 错误 + 2 个 ban-unused-ignore）
- `mobile-sidebar.js` — 使用 `var` + 内部声明（13 个错误）
- `has-fallback.js` — 使用 `var` + 内部声明（8 个错误）

这些是有意使用 `var` 的浏览器兼容脚本（需在旧浏览器中运行），但 lint ignore 注释写错了（`deno-lint-ignore` 没有生效，因为 Deno lint 版本更新后规则名可能变化）。

### ⚠️ 格式化: deno fmt --check 失败

问题出在：
1. `docs/public/favicon.svg` — SVG 中的 `<style>` 标签格式
2. 多个 Lit 模板字符串中的长行（`islands.ts`, `design-philosophy.ts`, `contributing.ts`, `blog/index.ts` 等）
3. `KISS-v0.4.0-to-current.md` — 表格对齐
4. **Deno 2.7.14 在 Windows 上的格式化器 Panic**（dprint-core bug，非项目问题）

---

## 三、架构评估

### 🟢 优秀设计

1. **3-Phase Build Pipeline 设计清晰**
   - Phase 1: vite build → SSR bundle + build-metadata.json
   - Phase 2: build-client → 每个 Island 独立 chunk
   - Phase 3: build-ssg → 逐路由渲染 + 后处理
   - 用 metadata JSON 桥接各阶段，避免嵌套 Vite 构建

2. **DSD Renderer 设计干净**
   - 纯字符串拼接，无 DOM shim 依赖
   - 通过 `globalThis` 适配器协议支持多框架
   - 框架无关 — adapter-lit 是可选依赖

3. **Adapter-lit 的 TemplateResult 插值方案**
   - 不依赖 @lit-labs/ssr，输出无 `<!--lit-part-->` 标记
   - 正确处理 Lit 3.x CSSResult.cssText
   - 事件/属性绑定在 SSR 时剥离，客户端升级时重新绑定

4. **KissError 错误体系**
   - 有清晰的错误分类（NotFound/Unauthorized/Validation/RateLimit 等）
   - 区分 operational vs non-operational（SsrRenderError/IslandUpgradeError）
   - 统一的 toJSON 序列化

5. **安全设计**
   - URL 注入防护（`validateSafeUrl`）
   - CSP nonce 支持（每请求随机 nonce）
   - CORS 默认只允许 localhost（生产必须显式配置）
   - HTML 转义一致（3 处 escapeHtml 实现逻辑一致）

6. **Island 升级架构**
   - customElements.define() 原生注册
   - 支持 eager/lazy/idle/visible 策略
   - Package islands 自动发现机制

### 🟡 需要关注

1. **3 处 `escapeHtml` 重复实现**
   - `packages/kiss-core/src/render-dsd.ts` (line 28-35)
   - `packages/kiss-adapter-lit/src/ssr.ts` (line 94-101)
   - `docs/app/lib/markdown.ts`
   
   逻辑完全一致，但独立维护。建议 adapter-lit 从 kiss-core 导入，或提取为 @kissjs/shared。

2. **globalThis 适配器协议的全局污染风险**
   - `__kissLitSsrRenderer`, `__kissLitTemplateCheck`, `__kissLitStylesExtractor`, `__kissLitAdapterInstalled`
   - 4 个全局变量，有命名冲突风险（虽然 `__kiss` 前缀降低了概率）
   - `build-ssg.ts` 还注入 `module` 和 `exports` 全局变量（line 177-179），虽然在 finally 中清理

3. **SSG 管线中的 CJS polyfill**
   ```ts
   // build-ssg.ts line 177-179
   if (typeof (globalThis as ...).module === 'undefined') {
     (globalThis as ...).module = { exports: {} };
     (globalThis as ...).exports = {};
   }
   ```
   这是为了兼容 node-domexception 的 CJS 导出。在 Deno ESM 环境中注入 `module.exports` 是 hack，虽然 finally 块会清理，但并发场景可能出问题。

4. **build-ssg.ts 中大量重复导入**
   - `import { readFileSync, writeFileSync, existsSync } from 'node:fs'` 在函数顶部和内部多次导入
   - `import { join } from 'node:path'` 同样重复
   - 应统一在文件顶部导入

5. **Demo renderer 依赖 HTML 注释作为占位符**
   ```ts
   // demo/_renderer.ts
   html.replace('<!-- api-consumer rendered by renderer in light DOM -->', '<api-consumer></api-consumer>')
   ```
   如果注释文本被修改，island 注入会静默失败，没有任何错误提示。

6. **SSG 服务端渲染不调用 connectedCallback**
   - `render-dsd.ts` line 172-176 明确注释不调用 connectedCallback
   - 这意味着依赖 connectedCallback 做初始化的组件（如表单注册、API 调用）在 SSR 时不会执行
   - 设计选择正确（SSR 无法模拟 DOM），但文档中应更明确说明这个约束

### 🔴 需要修复

1. **docs/public/ 下的 JS 文件 Lint 失败（29 个错误）**
   - `theme-init.js`, `mobile-sidebar.js`, `has-fallback.js` 中的 `var` 和内部声明
   - 这些文件使用 `deno-lint-ignore` 注释但无效
   - 建议：将这些文件加入 deno.json 的 lint exclude，或改用 `let`/`const`

2. **deno fmt --check 多处失败**
   - 多个路由文件中的 Lit 模板字符串行宽超过 100 字符
   - `KISS-v0.4.0-to-current.md` 表格未对齐
   - 应运行 `deno fmt` 修复（注意 Deno 2.7.14 的 Windows panic bug）

3. **首页硬编码颜色值**
   - `docs/app/routes/index/index.ts` hero 区域使用 `#000`, `#222`, `#aaa`
   - 不走 CSS 自定义属性，破坏主题一致性
   - 在亮色主题下可能显示异常

4. **counter-island.ts 边框不一致**
   - 使用 `1px solid` 而项目标准是 `0.5px`

5. **`@kissjs/ui` 版本不一致**
   - `deno.json` README 列 `@kissjs/ui` 为 `0.5.0`
   - 实际 `packages/kiss-ui/deno.json` 版本是 `0.5.1`
   - `@kissjs/create` 脚手架生成的模板中引用的版本也需要同步

---

## 四、代码质量评估

### 类型安全：🟢 良好
- 全项目启用 `strict: true`
- 正确使用 `override` 关键字
- Lit reactive properties 使用 `declare` 避免字段遮蔽
- 测试中有专门的"reactive properties are not shadowed"检查

### 代码组织：🟢 良好
- 入口分离：index.ts (Vite 插件) vs render-dsd.ts (DSD 渲染器) vs cli/ (构建脚本)
- entry-descriptor.ts (纯数据) vs entry-renderer.ts (纯渲染) 分离清晰
- 错误体系结构化

### 文档：🟡 中等
- 4 个 ADR 记录关键决策
- 代码注释详尽
- 但缺乏 API 参考文档（类型定义需要读源码）
- Blog 中有大量中文技术内容但散落在各处

### 测试覆盖：🟢 良好
- 305 个测试全部通过
- 核心模块测试覆盖率高
- create-kiss 有端到端集成测试
- 但缺少 SSR 渲染的浏览器端 E2E 测试

---

## 五、依赖与兼容性

### 依赖图
```
@kissjs/create  →  @kissjs/core, @kissjs/ui, @kissjs/adapter-lit
@kissjs/core    →  hono, @hono/vite-dev-server, vite (peer)
@kissjs/ui      →  lit
@kissjs/adapter-lit →  lit (dev only)
@kissjs/rpc     →  (零依赖)
```

### 零依赖的 @kissjs/rpc
- 使用结构类型（structural typing）而非导入 Lit 的 ReactiveController 接口
- 零外部依赖，可独立使用

### Deno-first 但 Node.js 兼容
- 所有构建脚本使用 `node:fs`, `node:path`, `node:process`
- Vite 本身是 Node.js 工具
- 运行时产物（SSG 输出）是纯静态 HTML，与运行时无关

---

## 六、优先级建议

### P0（立即修复）
1. 修复 lint 错误：为 `docs/public/*.js` 添加 lint exclude 或改写
2. 修复 fmt 错误：运行 `deno fmt`（需升级 Deno 或手动修复以避免 Windows panic）
3. 首页硬编码颜色 → 改用 CSS 自定义属性

### P1（下个迭代）
4. 统一 `escapeHtml` 实现（提取到共享模块或从 core 导出）
5. Demo renderer 的 HTML 注释占位符 → 改用更可靠的注入方式
6. `@kissjs/ui` 版本号一致性
7. counter-island 边框统一为 0.5px
8. build-ssg.ts 中重复的 import 语句清理

### P2（路线图考虑）
9. CJS polyfill (`module.exports`) → 考虑替代方案或升级 node-domexception
10. globalThis 适配器协议 → 考虑更安全的注册机制（如 WeakMap）
11. 浏览器端 E2E 测试覆盖（当前只有 Node/Deno 环境测试）
12. API 参考文档自动生成（从 TypeScript 类型定义）

---

## 七、总结

KISS 框架在 v0.5.x 阶段展现出**扎实的架构设计**：

- DSD-first 渲染模型是正确方向，避免了 SSR hydration 的复杂性
- 3-Phase 构建管线设计清晰，每阶段职责明确
- Adapter 协议让 Lit 从必选变成可选，为未来 .kiss 编译器铺路
- 305 个测试全部通过，代码质量有保障

主要改进空间在于**工程细节**：lint/fmt 失败、escapeHtml 重复、文档站中的一些不一致。这些都不是架构级问题，而是 v0.5 trust release 阶段正常的打磨需求。

整体评价：**框架核心设计成熟度高，工程细节需继续打磨，适合继续向 v0.6+ 推进。**
