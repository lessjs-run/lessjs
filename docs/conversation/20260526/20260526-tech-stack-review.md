# LessJS v0.21.16 深度技术选型报告

> 2026-05-26

---

## 一、Signals：换 alien-signals 底层，保留自研 API 层

### 现状

`@openelement/signals`（14 文件）基于 TC39 Signal.State 原生，手写 ~400 行 DAG 依赖图算法（polyfill.ts），包含 channel/islandEffect/themeSignal 等独占功能。

### 结论：混合策略

```
保留：signal() / computed() / effect() API（.value 语法兼容）
      islandEffect() / channel() / themeSignal （LessJS 差异化能力）
替换：polyfill.ts + engine.ts → alien-signals (1.6KB, Vue 3.6 核心算法)
净减：~300 行代码，删除手写 DAG
```

**理由**：

- alien-signals 780 万周下载，Vue 3.6+XState 背书，StackBlitz 维护
- TC39 Signal 停在 Stage 1 已 2 年，浏览器原生至少 2027+
- 自研 signals 社区采纳可能性低（alien 已形成网络效应）
- 保持 `.value` API 兼容只需 ~200 行 wrapper，无 breaking change

---

## 二、UI：保持独立，从 10 组件扩到 20

### 结论：不引入第三方 UI 库

| 方案                  | 推荐 | 理由                                   |
| --------------------- | :--: | -------------------------------------- |
| 引入 Shoelace 作底层  |  ❌  | Lit 依赖冲突，破坏 DSD + 零 Lit 纯净性 |
| 引入 Material Web     |  ❌  | Lit 依赖 + Material Design 样式约束    |
| 引入 Melt UI          |  ❌  | 为 Svelte 设计，无 WC 版本，移植成本高 |
| **继续自研 DSD 组件** |  ✅  | DSD-first + 零 Lit 是护城河            |

### v0.22 新增组件

select, checkbox, radio, tabs, toast, tooltip, avatar, badge, progress, skeleton

参考 Shoelace 的 ARIA 模式但不引入依赖。

---

## 三、状态管理：不需要专用库

Signals（原子状态）+ computed（派生）+ channel（跨 Island 通信）+ ReactiveHost 协议 = 已覆盖所有场景。

nanostores 不解决任何 LessJS 目前解决不了的问题。zustand/Jotai 是 React 生态不可用。

---

## 四、ORM：不需要，预留接口

LessJS 当前无数据库交互场景（SSG 是文件系统驱动，Hub 用 flexsearch 内存搜索）。

如果未来 ISR 缓存需要持久化：**Deno KV 或 SQLite + Kysely**（Deno 原生，SQL query builder，无 ORM 包袱）。

---

## 五、v0.22 技术路线图

| 优先级 | 事项                              | 说明                                                 |
| :----: | --------------------------------- | ---------------------------------------------------- |
|   P0   | Signals 迁移 alien-signals        | 删 polyfill.ts，加 wrapper，API 兼容                 |
|   P0   | 新增 10 个 DSD 组件               | select/checkbox/radio/tabs 等                        |
|   P1   | 补 5 篇核心文档                   | Tutorial + API Reference + 样式指南 + 部署 + Recipes |
|   P1   | Shoelace a11y 参考                | 研究 ARIA 模式，不引入依赖                           |
|   P2   | effectScope() 支持                | 换 alien 后自然获得                                  |
|   P2   | 数据库抽象接口                    | `getDb()` 预留，默认 no-op                           |
|  不作  | 引入第三方 UI 库 / 状态管理 / ORM | —                                                    |

---

## 六、文档 Top 5 优先补

1. **Tutorial**: 从零构建博客全流程
2. **DsdElement + Signals 完整 API Reference**
3. **WC 样式指南**: CSS Parts / Open Props / Shadow DOM
4. **多平台部署**: Deno Deploy / CF Workers / Docker
5. **Recipes**: 表单 / 数据获取 / 认证 / Markdown / i18n
