# LessJS API 命名规范 — 贴近 Web Platform

> 日期: 2026-05-29 | 架构师: 齐活林 | 基于 v0.24.3 codebase
> 目标: 统一框架命名风格，贴近 Web Platform，消除品牌前缀

> 前置要求：v0.24.3 已完成 legacy 移除（`html`/`@prop()` 不再公开）、renderer parity 和 docs truth 收敛，避免在未稳定的 API 上做大规模重命名。

---

## 问题

v0.24.3 的公共 API 在四种风格之间摇摆：

```
island(), lessBind()                   ← 名词函数 + 品牌前缀 (JSR 独有)
connectedCallback(), getAttribute()    ← Web Platform (原生)
signal(), computed(), effect()         ← Preact/Solid convention
createLogger(), renderToString()       ← create/render 前缀 (React 风格)
```

没有一个自觉的选择说明。

## 决策：贴近 Web Platform

LessJS 的差异点是"DSD-first + Web Components 一等公民"。命名应该强化这个身份。

### 命名规则表

| 类别              | 规则                       | 示例                                             |
| ----------------- | -------------------------- | ------------------------------------------------ |
| **类**            | PascalCase                 | `DsdElement`, `ErrorBoundary`, `RpcController`   |
| **函数**          | `verb` + `Noun`            | `defineIsland`, `renderToString`, `createSignal` |
| **布尔检查**      | `is` + `Noun`              | `isVNode`, `isValidTagName`                      |
| **存在检查**      | `has` + `Noun`             | `hasNavigationApi`                               |
| **获取**          | `get` + `Noun`             | `getSsrProps`                                    |
| **事件/生命周期** | `on` + `Noun`              | `onNavigate`, `onDsdHydrated`                    |
| **私有方法**      | `_verbNoun`                | `_disposeRuntime`                                |
| **静态字段**      | `static` + `noun`          | `static props`, `static styles`                  |
| **acronym**       | PascalCase (首字母大写)    | `Ssr`, `Dsd`, `Isr`, `Dom`, `VNode`              |
| **render 系列**   | `render` + `[To]` + `Noun` | `renderToString`, `renderToDom`, `renderDsd`     |
| **escape 系列**   | `escape` + `Noun`          | `escapeHtml`, `escapeAttr`                       |
| **绝对禁止**      | ❌ 品牌前缀                | ~~`lessBind`~~ → `bindEvents`                    |

### 数据获取范式：REST-first + RPC controller

LessJS 是 SSG-first 框架。核心数据获取在构建时完成，不需要运行时 GraphQL。

| 层级   | 方式                                              | 用途                                      |
| ------ | ------------------------------------------------- | ----------------------------------------- |
| 构建时 | `static data` / content system / `fetch()` in SSG | 页面数据预取，嵌入 DSD                    |
| 运行时 | `RpcController` (已有)                            | Island 内的 API 调用，loading/error state |
| 不内置 | GraphQL                                           | 用户自行安装，框架不提供内置客户端        |

**选择理由**：

- REST (fetch) 是 Web Platform 原生能力，零依赖
- `RpcController` 是基于 fetch 的轻量状态管理器，符合 LessJS 哲学
- GraphQL 客户端重（10-30KB），与零 JS 默认的理念冲突
- 如果用户需要 GraphQL，他们可以自己 install 任何客户端

### 保留的"非 Platform"例外

以下命名保留因为它们是 industry convention，改了反而更困惑：

| 保留                                 | 理由                                                            |
| ------------------------------------ | --------------------------------------------------------------- |
| `signal()`, `computed()`, `effect()` | Preact/Solid/Qwik 标准命名                                      |
| `Fragment`                           | React JSX 标准                                                  |
| `jsx()`, `jsxs()`, `jsxDEV()`        | JSX transform 标准命名                                          |
| `renderToString()`                   | React 标准（即使它违反 acronym 规则，保留 'String' 不用 'Str'） |
| `static props`                       | LessJS 自定义但简洁，没有等效 Platform API                      |

---

## 具体重命名清单

### P0 — 消除品牌前缀 + 名词函数

| 现在         | 改为             | 类型 | 理由                            |
| ------------ | ---------------- | ---- | ------------------------------- |
| `island()`   | `defineIsland()` | 函数 | `verb` + `Noun`                 |
| `lessBind()` | `bindEvents()`   | 函数 | no brand, describe what it does |

实施顺序：

- 与 v0.24.3 的 legacy 移除一起完成，防止出现“新名称 + 旧模型”并存。
- 保留旧名导出一个版本（标记 @deprecated），CI 增加 API surface 测试，下一小版本移除旧名。

### P1 — acronym 统一

| 现在                                         | 改为                | 理由               |
| -------------------------------------------- | ------------------- | ------------------ |
| `getSSRProps()`                              | `getSsrProps()`     | PascalCase acronym |
| `renderSSRError()` → 实际是 `renderSsrError` | 已 PascalCase ✅    | 无需改动           |
| `renderDSD()`                                | `renderDsd()`       | PascalCase acronym |
| `renderDSDStream()`                          | `renderDsdStream()` | PascalCase acronym |
| `renderToDOM()`                              | `renderToDom()`     | PascalCase acronym |

### P2 — 命名风格微调

| 现在                  | 改为               | 理由                     |
| --------------------- | ------------------ | ------------------------ |
| `wrapInDocument()`    | `wrapDocument()`   | 去掉不必要的 In          |
| `createIsrCacheKey()` | `createCacheKey()` | Isr 语义隐含在模块路径中 |

发布节奏：P2 可随 v0.25.0 一起落地，因为纯机械改动且无品牌前缀风险。

### 不改的

| 保留                                 | 理由                |
| ------------------------------------ | ------------------- |
| `DsdElement`                         | 已 PascalCase，正确 |
| `ErrorBoundary`                      | 已 PascalCase       |
| `signal()`, `computed()`, `effect()` | Industry standard   |
| `static props`, `static styles`      | 已简洁              |
| `onDsdHydrated()`, `onCsrRendered()` | 已符合 on 前缀规则  |

---

## 影响面评估

| 函数                                  | 调用者数量         | 类型     |
| ------------------------------------- | ------------------ | -------- |
| `island()` → `defineIsland()`         | ~15 个 island 文件 | 机械替换 |
| `lessBind()` → `bindEvents()`         | ~3 处              | 机械替换 |
| `getSSRProps` → `getSsrProps`         | ~5 处              | 机械替换 |
| `renderDSD` → `renderDsd`             | ~20 处             | 机械替换 |
| `renderDSDStream` → `renderDsdStream` | ~5 处              | 机械替换 |
| `renderToDOM` → `renderToDom`         | ~30 处             | 机械替换 |

全部改动是纯 grep + replace，可在 30 分钟内完成。
