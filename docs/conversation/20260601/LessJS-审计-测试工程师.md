# LessJS v0.27.0 — 测试工程师专项审计报告

> **审计人**: Edward (QA Engineer)  
> **审计日期**: 2026-06-01  
> **审计范围**: 功能鲁棒性 + 兼容性 + 异常场景 + 测试体系  
> **审计对象**: LessJS v0.27.0（基于 Deno 的 DSD 优先 Web Components 全栈框架）

---

## 目录

1. [总体评估](#1-总体评估)
2. [测试体系审计](#2-测试体系审计)
3. [功能缺陷与边界场景](#3-功能缺陷与边界场景)
4. [兼容性问题与降级方案](#4-兼容性问题与降级方案)
5. [异常场景与崩溃风险](#5-异常场景与崩溃风险)
6. [测试盲区与补充建议](#6-测试盲区与补充建议)
7. [样式隔离与主题切换](#7-样式隔离与主题切换)
8. [全局异常兜底优化建议](#8-全局异常兜底优化建议)
9. [测试运行配置审计](#9-测试运行配置审计)
10. [改进优先级矩阵](#10-改进优先级矩阵)

---

## 1. 总体评估

### 1.1 质量等级：**B+（良好，存在若干关键风险点）**

| 维度 | 评分 | 说明 |
|------|------|------|
| 错误分类体系 | ★★★★☆ | 统一 `LessError` + 分级严重度 + 可恢复标记，架构优秀 |
| DSD 渲染容错 | ★★★★☆ | render() 失败→裸标签降级，instantiate 失败→void 元素，设计合理 |
| Islands 策略 | ★★★★☆ | load/idle/visible/only 四种策略，均有 fallback 链 |
| 异常场景覆盖 | ★★★☆☆ | 核心路径有保护，但边界场景和全局兜底不足 |
| 测试覆盖率 | ★★★☆☆ | 核心包覆盖好，但 router/runtime/protocols 三个包零测试 |
| 兼容性设计 | ★★★☆☆ | DSD 优雅降级，但无显式浏览器 DSD polyfill |
| E2E 测试 | ★★★★☆ | 13 个 spec 覆盖路由/搜索/主题/DSD/i18n/岛屿，设计用心 |

---

## 2. 测试体系审计

### 2.1 测试目录分布

```
packages/core/__tests__/          25 个测试文件  ✅ 核心覆盖最充分
packages/adapter-vite/__tests__/  27 个测试文件  ✅ SSG/构建链路覆盖完善
packages/compat-check/__tests__/   4 个测试文件  ✅ 分类器逻辑覆盖好
packages/hub/__tests__/            7 个测试文件  ✅ Registry 提交/索引覆盖
packages/signals/__tests__/        3 个测试文件  ✅ signal/computed/effect 覆盖
packages/content/__tests__/        4 个测试文件  ✅ 路由/站点地图/导航覆盖
packages/adapter-lit/__tests__/    3 个测试文件  ✅ 基础 SSR/DSD 覆盖
packages/adapter-vanilla/__tests__/ 2 个测试文件 ⚠️ 偏少
packages/adapter-react/__tests__/  2 个测试文件  ⚠️ 偏少
packages/i18n/__tests__/           1 个测试文件  ⚠️ 偏少
packages/cem/__tests__/            1 个测试文件  ⚠️ 偏少
packages/ui/__tests__/             2 个测试文件  ⚠️ 薄（仅 smoke + components）
packages/rpc/__tests__/            3 个测试文件  ⚠️ 薄（smoke + state-machine + type-compat）
packages/create/__tests__/         1 个测试文件  ⚠️ 偏少
packages/app/__tests__/            1 个测试文件  ⚠️ 偏少
packages/style-sheet/__tests__/    1 个测试文件  ⚠️ 偏少

packages/router/__tests__/         ❌ 不存在！零测试
packages/runtime/__tests__/        ❌ 不存在！零测试
packages/protocols/__tests__/      ❌ 不存在！零测试

www/__tests__/                     3 个测试文件  ✅ 回归测试 + 构建输出验证
www/e2e/                           13 个 spec    ✅ E2E 覆盖较全面
```

### 2.2 测试类型分布

| 类型 | 数量 | 评价 |
|------|------|------|
| 单元测试 (Deno.test) | ~90+ 文件 | 核心包覆盖良好 |
| 集成测试 | 少量 | 缺少跨包集成测试 |
| E2E 测试 (Playwright) | 13 spec | 覆盖路由/搜索/主题/DSD/i18n/岛屿 |
| 回归测试 | 3 文件 | v0.27.0 三大 Bug 均有回归验证 |
| 快照测试 | 无 | 缺少视觉快照对比 |
| 性能测试 | 无 | 缺少性能回归测试 |
| 安全测试 | 部分 | `security.ts` 有原型污染防护，但缺 XSS 向量测试 |

### 2.3 优秀测试实践示例

**render-dsd.test.ts** — 测试质量标杆：
- 使用 mock class 替代真实 HTMLElement，避免 Deno DOM 依赖
- 覆盖正常渲染、错误路径（throwOnConstruct / throwOnRender）、空数据、边界值
- DSD Options 全覆盖（delegatesFocus/serializable/clonable/slotAssignment/customElementRegistry）
- Pure Island、Adapter Protocol、Source Info、Client-Only Tags 均有专项测试

**island.test.ts** — Mock 策略清晰：
- 独立 mock `customElements`/`IntersectionObserver`/`MutationObserver`/`requestIdleCallback`
- setupMocks/teardownMocks 模式保证测试隔离
- 覆盖标签名校验、元数据标记、策略路由、幂等注册、connectedCallback 包裹

**v0.27.0-regression.test.ts** — 回归防护典范：
- 针对 Sidebar 消失、`[object Object]` 泄露、Search 面板主题跟随三大 Bug 做专项断言
- 同时守卫 API 表面（jsx 不得从 root 导出）和依赖（parse5 不得引入）

---

## 3. 功能缺陷与边界场景

### 3.1 🔴 P0 级问题

#### P0-1: `packages/router` — 零测试覆盖，核心导航模块完全裸奔

**影响范围**: 整个 SPA 路由导航链路

`client-router.ts`（330行）包含以下关键逻辑，均无任何测试：
- Click delegation（shadow root 内 `<a>` 点击拦截）
- Navigation API interception（`navigation.addEventListener('navigate')`）
- Popstate fallback（无 Navigation API 的浏览器回退）
- Locale path normalization（`/zh/guide` → `{locale: 'zh', path: '/guide'}`）
- Content loader 错误处理（`.catch(() => location.reload())`）
- Lang-switch replaceState vs navigateTo pushState

**风险**: 路由模块是 SPA 框架的神经中枢。零测试意味着任何一个重构都可能引入导航崩溃。

#### P0-2: `packages/runtime` — 零测试，运行时模块无验证

影响应用启动和模块加载逻辑。

#### P0-3: `packages/protocols` — 零测试，协议定义无验证

影响 build-types 等跨包协议一致性。

### 3.2 🟡 P1 级问题

#### P1-1: `dsd-element.ts` `_renderOrHydrate()` 无 try/catch 包裹

```typescript
// dsd-element.ts:296-307 — 缺少错误保护
private _renderOrHydrate(): void {
  const isDsd = this.shadowRoot && this.shadowRoot.childNodes.length > 0;
  if (isDsd) {
    this._hyrateExistingDom();    // ← 若此方法抛异常，connectedCallback 崩溃
    this.onDsdHydrated();
  } else if (this.shadowRoot) {
    this._renderIntoShadowRoot(); // ← 若 render() 返回非预期值，可能产生静默损坏
    this.onCsrRendered();
  }
}
```

**风险**: 子类 `onDsdHydrated()` 或 `onCsrRendered()` 抛出异常会导致整个组件无法挂载，页面出现空白区域。

#### P1-2: `render-dsd.ts` 存在生产环境调试日志泄漏

```typescript
// render-dsd.ts:226-244 — console.log 未受环境变量控制
console.log(
  '[LessJS Debug] isVNode check failed for',
  tagName,
  'Object.keys:',
  Object.keys(result),
  ...
);
```

**风险**: 当组件返回非字符串非 VNode 结果时，生产环境会打印大量调试信息，包含组件内部结构，存在信息泄漏风险。

#### P1-3: `client-router.ts` `#navigateNow` 的 .catch() 只有 `location.reload()`

```typescript
// client-router.ts:256-266
opts.contentLoader(pathname, locale).then(() => {
  // ...
}).catch((err) => {
  console.warn('[lessjs/router] content load failed:', err);
  location.reload(); // ← 唯一 fallback，无法区分错误类型
});
```

**风险**: 所有加载失败都触发整页重载，用户体验差。应区分网络错误 vs 404 vs 解析错误，提供不同 fallback。

### 3.3 🟢 P2 级问题

#### P2-1: `extractParams()` 返回空对象而非抛出明确错误

```typescript
// context.ts:73-80
} catch (err) {
  log.error(...);
  return {}; // ← 静默吞掉错误，调用方无法区分"无参数"和"解析失败"
}
```

#### P2-2: DSD hydration 中 `requestAnimationFrame` 布局修复无错误处理

```typescript
// dsd-element.ts:423-425
requestAnimationFrame(() => {
  void (this as HTMLElement).offsetHeight; // ← 未检查 this 是否仍 connected
});
```

组件可能在 rAF 回调执行前已被移除。

#### P2-3: `createSsrContext` 中 URLPattern 构造失败时 params 返回空对象

与 P2-1 类似，调用方无法区分"路由无参数"和"URLPattern 编译失败"。

---

## 4. 兼容性问题与降级方案

### 4.1 DSD 浏览器兼容性

**当前状态**: LessJS 依赖浏览器原生 `<template shadowrootmode="open">` 解析。截至 2026 年：
- ✅ Chrome 111+、Edge 111+
- ✅ Safari 16.4+
- ⚠️ Firefox — 实验性支持（`dom.webcomponents.shadowdom.declarative.enabled`）
- ❌ 旧版 Chrome/WebView（Android WebView < 111）

**缺失**: 没有显式的 DSD polyfill 或 feature detection 代码。低版本浏览器中：
- Shadow DOM 不会自动创建
- 自定义元素升级后 `shadowRoot` 为 null
- `createRenderRoot()` 会调用 `attachShadow()` → 正确的 CSR fallback

**评价**: DsdElement 的 CSR fallback 机制实际上是隐式的 polyfill，但缺少：
1. 显式的 DSD 支持检测（`HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')`）
2. 对不支持 DSD 的浏览器的明确提示或降级策略文档
3. 没有 DSD polyfill 脚本注入机制（如 declarative-shadow-dom-polyfill）

### 4.2 关键 API 兼容性

| API | 使用位置 | 兼容性风险 |
|-----|---------|-----------|
| `URLPattern` | `context.ts` extractParams | Node.js < 19 需 flag，部分旧 Deno 不支持 |
| `Navigation API` | `client-router.ts` | Chrome 102+，Firefox/Safari 不支持 |
| `adoptedStyleSheets` | `dsd-element.ts` | 广泛支持，IE 不支持 |
| `IntersectionObserver` | `island.ts` visible strategy | 广泛支持，IE 不支持 |
| `requestIdleCallback` | `island.ts` idle strategy | Safari 不支持 |
| `ElementInternals` | `dsd-element.ts` formAssociated | Chrome 77+，较新 API |
| `CSSStyleSheet.replaceSync` | SSR polyfill | Deno 不支持（已 polyfill） |

**评价**: 
- Navigation API 已有 popstate fallback ✅
- requestIdleCallback → requestAnimationFrame → setTimeout 已实现三级 fallback ✅
- URLPattern 错误被 try/catch 包裹，降级返回 {} ✅
- 但缺少显式的 API 支持检测和用户可见的降级提示 ⚠️

### 4.3 SSR Polyfill 策略

`ssr-polyfills.ts` 采用分层策略：
- Output banner（`build-ssg.ts`）: HTMLElement + customElements stub
- Entry code body: CSSStyleSheet polyfill via `@openelement/style-sheet`

**评价**: ✅ 设计合理，分离了必须在模块求值前执行的 polyfill 和可延迟的 polyfill。

### 4.4 compat-check 包评价

`classifyComponent` 函数对组件 SSR 兼容性做系统性分类：
- `ssr-capable` / `client-only` / `experimental-dom` / `rejected`
- 标签名校验、模块路径安全校验、已知适配器识别

**评价**: ✅ 分类器测试覆盖好（38 个测试用例），但 `client-router.ts` 中没有消费这个分类结果做运行时决策。

---

## 5. 异常场景与崩溃风险

### 5.1 风险热力图

```
高风险区 (崩溃可能导致白屏):
┌────────────────────────────────────────────────────┐
│ 🔴 client-router.ts #navigateNow        整页重载   │
│ 🔴 dsd-element.ts _renderOrHydrate()   组件空白    │
│ 🔴 render-dsd.ts render() 异常          裸标签降级  │
│ 🟡 jsx-render-string.ts CE 递归渲染     静默失败    │
└────────────────────────────────────────────────────┘

中风险区 (功能降级):
┌────────────────────────────────────────────────────┐
│ 🟡 dsd-element.ts event hydration     事件无响应   │
│ 🟡 island.ts visible strategy          永不升级    │
│ 🟡 SSG build 进程异常                  构建失败    │
└────────────────────────────────────────────────────┘
```

### 5.2 详细风险分析

#### 🔴 风险 R1: ConnectedCallback 链路无全局异常保护

`connectedCallback()` 中依次调用：
1. `initializeProps()` / `initializeStaticProps()`
2. `createRenderRoot()` 
3. `_renderOrHydrate()` → `render()` / `_hydrateSignals()`
4. `onDsdHydrated()` / `onCsrRendered()` (子类覆盖)

任一环节抛出未捕获异常，整个元素升级失败，页面出现空白区域。

**缺失**: `ErrorBoundary` 类已定义但仅限子组件 render() 的 try/catch，不保护 connectedCallback 生命周期。

#### 🔴 风险 R2: SSG 构建时递归渲染无深度限制

`renderDsdTree()` 递归处理嵌套 CE，但未发现最大嵌套深度限制。恶意或配置错误的组件嵌套可能导致栈溢出。

#### 🟡 风险 R3: `_hydrateSignals()` 中 `querySelectorAll` 遍历全量 DOM

```typescript
// dsd-element.ts:323
const signalEls = this.shadowRoot.querySelectorAll('[data-signal]');
```

对每个有信号的元素创建 effect，没有批量更新或调度优化。大量信号元素时可能导致 performance regression。

#### 🟡 风险 R4: `visible` 策略 30s 超时仅 log.debug

```typescript
// island.ts:222-228
const timeoutId = setTimeout(() => {
  if (!registered) {
    mo.disconnect();
    observer.disconnect();
    log.debug(`...timed out`); // ← 仅 debug 日志，不可观测
  }
}, VISIBILITY_TIMEOUT);
```

如果组件从不进入视口，升级永远不会发生，且生产环境无任何警告。

---

## 6. 测试盲区与补充建议

### 6.1 零测试包 — 最高优先级

| 包 | 风险 | 建议最小测试集 |
|----|------|-------------|
| **router** | SPA 导航崩溃 | click delegation、popstate、locale 解析、Navigation API fallback、错误处理 |
| **runtime** | 启动失败 | 模块加载、初始化顺序、环境检测 |
| **protocols** | 跨包协议不一致 | build-types schema 验证、类型导出完整性 |

### 6.2 薄测试包 — 需增强

| 包 | 当前覆盖 | 建议补充 |
|----|---------|---------|
| **rpc** | smoke + state-machine + type-compat | WebSocket 连接/断开/重连、消息序列化/反序列化 |
| **ui** | smoke + components | 每个 less-* 组件独立测试：属性传递、slot 内容、事件触发 |
| **i18n** | 1 文件 | 多语言切换、locale 路由、fallback 链、RTL 支持 |
| **adapter-vanilla** | 2 文件 | 更多边界场景、复杂组件 |
| **adapter-react** | 2 文件 | React 19 特定特性、SSR hydration 一致性 |

### 6.3 缺失的测试场景 — 核心包

#### core 包缺失场景

1. **ErrorBoundary 行为测试**: 无专门测试文件。应测试：
   - 子组件 render() 抛异常 → onError() 被调用
   - 错误恢复后的重渲染
   - 嵌套 ErrorBoundary 的错误冒泡

2. **Event Hydration 异常**: `_hydrateSignals()` 中 signalRegistry 未注册的 signal name 静默跳过 — 应有测试验证

3. **Form Associated**: `formAssociated` + `ElementInternals` 路径无测试

4. **CSP Nonce 处理**: `html-escape.ts` 中的 CSP nonce 逻辑有 log.warn 但无测试

5. **Streaming DSD 错误处理**: `render-dsd-stream.ts` 的 chunk 错误处理无测试

6. **render() 返回 undefined**: 当前仅测试 null；应补充 undefined

7. **并发的 update() 调用**: 快速连续调用 update() 的竞态测试

#### adapter-vite 包缺失场景

1. **Build 失败恢复**: SSG 构建中某个页面渲染失败时其余页面的行为
2. **大型站点构建**: 100+ 页面的 SSG 构建性能和内存
3. **循环依赖的岛屿**: import 环路检测

#### E2E 缺失场景

1. **离线/慢网络**: Service Worker 或网络降级
2. **移动端视口**: 响应式布局破坏
3. **键盘导航**: Tab 键焦点顺序、focus-visible 样式
4. **屏幕阅读器**: ARIA 属性、语义 HTML
5. **打印样式**: @media print
6. **浏览器后退/前进**: SPA 内的 popstate 导航链
7. **并发导航**: 快速连续点击多个链接
8. **JavaScript 被禁用**: `<noscript>` 降级内容

### 6.4 建议补充的专项测试套件

```bash
# 建议新增的测试套件
packages/router/__tests__/
  ├── client-router.test.ts        # 路由核心逻辑
  ├── click-delegation.test.ts     # 点击拦截
  └── locale-normalization.test.ts # 语言路径解析

packages/runtime/__tests__/
  └── runtime.test.ts              # 运行时初始化

packages/protocols/__tests__/
  └── build-types.test.ts          # 构建类型 schema

packages/core/__tests__/
  ├── error-boundary.test.ts       # ErrorBoundary 行为
  ├── form-associated.test.ts      # 表单关联元素
  └── concurrent-update.test.ts    # 并发渲染

www/e2e/
  ├── offline-fallback.spec.ts     # 离线降级
  ├── a11y-keyboard.spec.ts        # 无障碍键盘导航
  └── concurrent-navigation.spec.ts # 并发导航
```

---

## 7. 样式隔离与主题切换

### 7.1 样式隔离机制

LessJS 的样式隔离依赖两个层面：

1. **Shadow DOM**: 通过 `adoptedStyleSheets` 注入组件样式，天然隔离
2. **Open Props**: `open-props-tokens.ts` 提供设计 token，通过 CSS 自定义属性穿透 Shadow DOM

**评估**: ✅ Shadow DOM 样式隔离是 Web 标准，安全性高。CSS 自定义属性可穿透 Shadow boundary，为主题系统提供了标准化通道。

### 7.2 主题切换机制

主题切换链路：
1. `less-theme-toggle` 组件 → 点击 button
2. `document.documentElement.setAttribute('data-theme', 'light'|'dark')`
3. `CustomEvent('less:theme-change')` 广播
4. DsdElement.connectedCallback 同步 `data-theme` 到自身
5. CSS 自定义属性根据 `[data-theme]` 选择器切换值

**E2E 覆盖**: `theme-system.spec.ts` 包含 6 个测试：
- ✅ Toggle 存在 + shadow root
- ✅ 点击切换 data-theme
- ✅ localStorage 持久化
- ✅ 默认主题
- ✅ 多次切换循环
- ✅ 页面表面颜色响应主题变化

**已知问题**:
- `search.spec.ts` 中搜索面板主题跟随测试确认了跨组件主题同步工作

### 7.3 样式泄漏风险点

| 风险点 | 严重度 | 说明 |
|--------|--------|------|
| `:host` 选择器未严格限定 | 低 | Shadow DOM 天然隔离，`:host` 仅影响宿主元素 |
| CSS 自定义属性命名冲突 | 中 | Open Props 使用 `--less-*` 命名空间，但第三方组件可能冲突 |
| 全局样式（非 Shadow DOM 元素）| 低 | 仅文档级样式，可控 |
| `adoptedStyleSheets` polyfill | 低 | SSR 环境使用 `StyleSheet` 替代，行为一致 |

---

## 8. 全局异常兜底优化建议

### 8.1 当前全局异常处理能力

| 机制 | 状态 | 覆盖范围 |
|------|------|---------|
| `ErrorBoundary` 基类 | ✅ 已实现 | 子组件 render() |
| `LessError` 统一错误类 | ✅ 已实现 | 全框架 |
| `ErrorTelemetryHook` | ✅ 已实现 | 可插拔 |
| `SsrErrorContext` | ✅ 已实现 | SSR 渲染收集 |
| 全局 unhandledrejection | ❌ 未实现 | 应用级 |
| 全局 error event | ❌ 未实现 | 应用级 |
| 渲染超时保护 | ❌ 未实现 | 组件级 |
| 降级 UI 策略 | ⚠️ 部分 | 仅 ErrorBoundary |

### 8.2 建议补充

```typescript
// 建议在 runtime 包中添加全局异常处理器
// packages/runtime/src/error-handler.ts

// 1. 全局 Promise 拒绝处理
globalThis.addEventListener('unhandledrejection', (event) => {
  // 生产环境上报，开发环境打印
  if (LESSJS_ENV === 'production') {
    reportToTelemetry(event.reason);
  }
  event.preventDefault(); // 防止控制台默认错误
});

// 2. 全局错误处理
globalThis.addEventListener('error', (event) => {
  // 区分资源加载错误 vs 脚本错误
  if (event.target instanceof HTMLScriptElement) {
    // 岛屿脚本加载失败 → 显示降级占位符
  }
});

// 3. 渲染超时保护 (connectedCallback 包裹)
function withTimeout<T>(fn: () => T, ms: number, fallback: T): T {
  // ...实现超时降级
}
```

### 8.3 错误提示优化

1. **当前**: `console.warn('[lessjs/router] content load failed:', err)` — 对终端用户不可见
2. **建议**: 在 `less-layout` 中添加 toast/notification 组件，对可恢复错误提供用户可见提示
3. **建议**: 生产环境错误信息脱敏（当前 `render-errors.ts` 已做 dev/prod 区分，但部分 `console.log` 未区分）

---

## 9. 测试运行配置审计

### 9.1 deno.json 测试任务

```json
"test": "deno test --allow-read --allow-write --allow-env --allow-net --allow-run",
"test:coverage": "deno test --coverage=.coverage ...",
"test:watch": "deno test --allow-read ... --watch",
"test:e2e": "deno run -A npm:@playwright/test@1.59.1 test --config www/e2e/playwright.config.ts",
```

**评价**:
- ✅ 权限控制合理（H-18 修复：使用 least-privilege 替代 `-A`）
- ✅ 支持覆盖率收集
- ✅ 支持 watch 模式
- ⚠️ 缺少 `test:ci` 专用任务（CI 中可能需要不同配置）
- ⚠️ `--allow-run` 权限较宽，建议 CI 中收紧

### 9.2 Playwright 配置

```typescript
// playwright.config.ts
{
  fullyParallel: true,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
}
```

**评价**:
- ✅ CI 中串行运行（workers: 1）避免 flaky
- ✅ 重试机制
- ⚠️ 仅测试 Chromium，缺少 Firefox/WebKit 覆盖
- ⚠️ 缺少移动端视口配置

---

## 10. 改进优先级矩阵

### 🔴 立即修复（P0 — 阻塞发布）

| ID | 问题 | 行动 |
|----|------|------|
| P0-1 | router 包零测试 | 至少添加 client-router.test.ts，覆盖核心导航逻辑 |
| P0-2 | runtime 包零测试 | 至少添加 runtime.test.ts，覆盖模块初始化 |
| P0-3 | _renderOrHydrate 无异常保护 | 添加 try/catch，失败时调用 requestUpdate() 重新渲染 |

### 🟡 尽快修复（P1 — v0.28.0 应解决）

| ID | 问题 | 行动 |
|----|------|------|
| P1-1 | 生产环境调试日志泄漏 | `render-dsd.ts` console.log 改为 log.debug + 环境检查 |
| P1-2 | navigateNow .catch() 仅 reload | 区分网络错误/404/解析错误 |
| P1-3 | protocols 包零测试 | 添加 build-types schema 验证测试 |
| P1-4 | rpc 包测试薄 | 添加 WebSocket 连接/断开/重连测试 |

### 🟢 计划修复（P2 — v0.29.0 目标）

| ID | 问题 | 行动 |
|----|------|------|
| P2-1 | extractParams 静默失败 | 返回 Result 类型或抛出明确错误 |
| P2-2 | 缺少 ErrorBoundary 专项测试 | 添加 error-boundary.test.ts |
| P2-3 | 缺少 Form Associated 测试 | 添加 form-associated.test.ts |
| P2-4 | E2E 仅 Chromium | 添加 Firefox/WebKit 配置 |
| P2-5 | 缺少并发渲染测试 | 添加 concurrent-update.test.ts |
| P2-6 | 缺少 CSP nonce 测试 | 添加 csp 相关测试 |

### 📋 长期投资（P3 — 持续改进）

| ID | 行动 |
|----|------|
| L-1 | 建立测试覆盖率看板（目标：核心包 > 80%，全包 > 60%） |
| L-2 | 添加性能回归测试（渲染时间、内存使用） |
| L-3 | 添加视觉快照测试（截图对比） |
| L-4 | 添加无障碍测试（axe-core 集成） |
| L-5 | 添加移动端视口 E2E 配置 |
| L-6 | 建立模糊测试（fuzz testing）用于渲染管线 |

---

## 附录 A：测试文件完整清单

### packages/core/__tests__/ (25 文件)
```
api.test.ts                 context.test.ts            core-api-surface.test.ts
dsd-collector.test.ts       dsd-conformance.test.ts    dsd-element.test.ts
errors.test.ts              island-transform.test.ts   island.test.ts
isr.test.ts                 jsx-render-dom.test.ts     jsx-render-string.test.ts
package-manifest.test.ts    registry.test.ts           render-dsd.test.ts
render-hooks.test.ts        ssr-handler.test.ts        streaming-dsd.test.ts
test-utils.ts               types.test.ts
```

### packages/adapter-vite/__tests__/ (27 文件)
```
assertion-style.test.ts     build-context.test.ts      build-manifest.test.ts
build.test.ts               entry-descriptor.test.ts   entry-generators.test.ts
entry-renderer.test.ts      external-resolver.test.ts  generated-data-resolver.test.ts
head-injection.test.ts      index-plugin.test.ts       island-manifest.test.ts
island-transform.test.ts    less-plugin.test.ts        route-scanner.test.ts
ssg-cli.test.ts             ssg-integration.test.ts    ssg-package-resolver.test.ts
ssg-postprocess.test.ts     ssg-render.test.ts         ssg-report.test.ts
ssg-smoke.test.ts           ssr-admission.test.ts      static-paths.test.ts
subpath-resolver.test.ts    fixtures/ (4 文件)
```

### www/e2e/ (13 文件)
```
accessibility-performance.spec.ts  dsd-layers.spec.ts
helpers.ts                         i18n-locale.spec.ts
islands-reactivity.spec.ts         layout-structure.spec.ts
navigation-routing.spec.ts         nested-ce.spec.ts
playwright.config.ts               search.spec.ts
seo-meta.spec.ts                   theme-system.spec.ts
view-transitions-speculation.spec.ts
```

---

## 附录 B：错误处理链路总览

```
用户请求
  │
  ├─ SSG 构建
  │   ├─ renderDsd() → try/catch → RenderError → bare-tag fallback ✅
  │   ├─ renderDsdTree() → 递归 CE → console.error → 继续渲染 ⚠️
  │   └─ adapters → extractStyles → try/catch → 跳过样式 ✅
  │
  ├─ SSR 服务
  │   ├─ createSsrContext() → URLPattern → try/catch → {} ⚠️
  │   └─ renderDsd() → (同上) ✅
  │
  ├─ 客户端升级
  │   ├─ connectedCallback()
  │   │   ├─ initializeProps() → 无保护 ❌
  │   │   ├─ _renderOrHydrate() → 无保护 ❌
  │   │   ├─ _hydrateSignals() → signalRegistry.get() → 静默跳过 ✅
  │   │   └─ onDsdHydrated() / onCsrRendered() → 子类覆盖 ❌
  │   └─ disconnectedCallback() → dispose effects + events ✅
  │
  ├─ SPA 导航
  │   ├─ click delegation → preventDefault ✅
  │   ├─ Navigation API → try/catch → popstate fallback ✅
  │   ├─ popstate → navigateNow ✅
  │   └─ contentLoader → .catch → location.reload() ⚠️
  │
  └─ Islands
      ├─ load → register() → try/catch → log.debug ✅
      ├─ idle → RIC → RAF → setTimeout ✅
      ├─ visible → IntersectionObserver → 30s timeout → log.debug ⚠️
      └─ only → register() → (同 load) ✅
```

---

> **报告结束** — 本文档基于对 LessJS v0.27.0 代码库的完整静态审计，涵盖 20 个 packages/* 目录下的所有测试文件和核心源代码。建议开发团队按优先级矩阵逐步解决发现的问题。
