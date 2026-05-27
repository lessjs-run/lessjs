# LessJS 仓库级深度代码审计报告

> 审计日期：2026-05-27\
> 仓库基线：origin/dev `3e4a9cdc`\
> 审计范围：`packages/` (18 packages) + `www/` (SSG 文档站)\
> 审计维度：安全 · 架构 · 代码质量 · 性能 · 工程化 · 可维护性

---

## 一、问题总览

| 级别      | 数量 | 关键主题                                                  |
| --------- | ---- | --------------------------------------------------------- |
| 🔴 HIGH   | 3    | URL 安全、空 catch 吞错、SSG 嵌套渲染无界                 |
| 🟡 MEDIUM | 8    | any 类型泛滥、事件清理不完整、全局 CSS 注入、package 边界 |
| 🟢 LOW    | 7    | 代码重复、命名不一致、测试覆盖缺口、文档滞后              |

---

## 二、HIGH 级发现

### H-1: `sanitizeUrl()` 返回未净化的原始值

| 属性   | 值                                      |
| ------ | --------------------------------------- |
| 文件   | `packages/core/src/template.ts:293-305` |
| 严重度 | 🔴 HIGH                                 |
| 类型   | 安全 — XSS 向量                         |

**问题**：第 302 行 `return value;` 返回的是**原始输入** `value`，而非净化后的 `trimmed`。如果原始值包含被 strip 掉的空白、控制字符或不可见 Unicode，这些字符会漏过存入最终的 HTML 属性中。

```typescript
// 当前代码
function sanitizeUrl(value: string): string {
  const trimmed = Array.from(value.replace(/\s+/g, ''))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 0x1f && code !== 0x7f;
    })
    .join('').trim();
  if (!trimmed) return '';
  if (/^(https?:|mailto:|tel:|\/|\.\/|\.\.\/|#|\?)/i.test(trimmed)) return value; // ← BUG
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return '#';
  return value;
}
```

**风险**：攻击者构造含 Unicode 控制字符的 URL（如 `https://evil.com%00<script>...`），控制字符被 strip 但协议判断通过后返回的仍是含注入内容的原始值。

**修复**：

```typescript
if (/^(https?:|mailto:|tel:|\/|\.\/|\.\.\/|#|\?)/i.test(trimmed)) return trimmed; // ← 返回净化值
if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return '#';
return trimmed; // ← 始终返回净化值
```

**附加问题**：第 302 行的正则 `\.\/` 和 `\.\.\/` 中 `.` 未转义，会匹配任意字符 + `/`，而非字面量 `./` 和 `../`。修复：`\./` → `\\.\\/`, `\.\.\/` → `\\.\\.\\/`。

---

### H-2: 空 catch 块系统性吞错

| 属性   | 值                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------ |
| 文件   | `packages/ui/src/less-theme-toggle.ts` (4处), `less-layout.ts` (5处), `less-code-block.ts` (1处) |
| 严重度 | 🔴 HIGH                                                                                          |
| 类型   | 可维护性 — 错误静默丢失                                                                          |

**问题**：11+ 处 `catch { /* silent */ }` 使所有异常静默丢失，无法被日志、监控或测试捕获。

**风险**：

- 生产环境中 `localStorage.setItem` 失败（配额满 / 隐私模式）时无感知
- `CustomEvent` 构造失败时主题传播静默中断
- `getRootNode()` 失败时 shadow DOM 边界问题不可见

**修复**：

```typescript
// Before
} catch { /* silent */ }

// After
} catch (e) {
  if (import.meta.env.DEV) {
    console.debug('[less-theme-toggle] localStorage unavailable:', e);
  }
}
```

---

### H-3: SSG 嵌套渲染深度限制依赖默认参数

| 属性   | 值                                                        |
| ------ | --------------------------------------------------------- |
| 文件   | `packages/core/src/render-dsd.ts:240`, `render-nested.ts` |
| 严重度 | 🔴 HIGH                                                   |
| 类型   | 可靠性 — 深度无限递归                                     |

**问题**：`renderNestedCustomElements(content, collector, 10, hooks)` 的 `maxDepth=10` 是硬编码默认值。如果组件树中出现意外循环引用（如 A 渲染 B → B 渲染 A），10 层嵌套可能在超大站点上仍然耗尽内存。

**风险**：SSG 构建时 OOM 或无限递归导致构建崩溃。

**修复**：添加递归路径跟踪，检测循环引用：

```typescript
export async function renderNestedCustomElements(
  html: string,
  collector?: DsdRenderCollector,
  maxDepth = 10,
  hooks?: RenderHooks,
  visited = new Set<string>(), // ← 新增
): Promise<RenderOutput> {
  // ... in the tag processing loop:
  if (visited.has(tagName)) {
    log.warn(`Circular dependency detected: ${tagName}`);
    continue;
  }
  visited.add(tagName);
}
```

---

## 三、MEDIUM 级发现

### M-1: `any` 类型使用过度（50 处）

| 属性   | 值                       |
| ------ | ------------------------ |
| 范围   | 全仓库 `packages/*/src/` |
| 严重度 | 🟡 MEDIUM                |
| 类型   | 类型安全                 |

**分布**：

- `packages/adapter-vite`: 18 处（插件 API 交互）
- `packages/core`: 15 处（模板引擎、DSD 渲染）
- `packages/ui`: 8 处（DOM 操作）
- 其他: 9 处

**风险**：`any` 绕过类型检查，运行时类型错误无法在编译期发现。

**建议**：逐步替换为 `unknown` + type guard，优先级：暴露给消费者的 public API > 内部实现。

---

### M-2: CSS 自定义属性双重定义导致 shadow DOM 覆盖继承

| 属性   | 值                                                                  |
| ------ | ------------------------------------------------------------------- |
| 文件   | `www/vite.config.ts:10-13` + `packages/ui/src/open-props-tokens.ts` |
| 严重度 | 🟡 MEDIUM                                                           |
| 类型   | 架构 — CSS 级联混乱                                                 |

**问题**：v0.23.0 中 `vite.config.ts` 将 `:host { --gray-1: ... }` 映射为 `:root, :host { --gray-1: ... }`。但组件内的 `openPropsTokenSheet`（在 `adoptedStyleSheets` 中）有自己的 `:host { --gray-1: ... }` 定义。这导致：

- `:root` 定义继承到 shadow DOM
- `:host` 定义在 shadow DOM 中覆盖继承值
- 两个定义可能不同步（`openPropsTokenSheet` 版本 vs 构建时提取版本）

**风险**：主题切换时可能看到不一致的颜色（全局 `:root` 规则和组件内 `:host` 规则竞争）。

**建议**：全局 `:root` 定义仅覆盖 body 级别的 CSS 属性，让组件通过 `openPropsTokenSheet` 自管理其 shadow DOM 内的主题变量。

---

### M-3: `_propagateTheme()` 遍历全树 O(n²) 性能

| 属性   | 值                                       |
| ------ | ---------------------------------------- |
| 文件   | `packages/ui/src/less-layout.ts:961-978` |
| 严重度 | 🟡 MEDIUM                                |
| 类型   | 性能                                     |

**问题**：每次主题切换调用 `_propagateTheme()` 遍历 light DOM + shadow DOM 全树，对每个含连字符的自定义元素设置 `data-theme`。在大型文档站点（200+ 组件）上，每次切换产生数百次 DOM 写入。

**修复**：使用 MutationObserver 监听新增元素 + CSS `color-scheme` 属性替代手动传播。或使用事件驱动模式：组件订阅 `less:theme-change` 事件自行更新。

---

### M-4: `less-layout._loadContent()` 内 `DOMParser` 无错误恢复

| 属性   | 值                                         |
| ------ | ------------------------------------------ |
| 文件   | `packages/ui/src/less-layout.ts:1018-1028` |
| 严重度 | 🟡 MEDIUM                                  |
| 类型   | 可靠性                                     |

**问题**：`_loadContent()` 在 SPA 导航时 fetch 新页面并 parse，但 catch 块只有 `globalThis.location.reload()` ——任何网络错误或解析错误都触发全页刷新。无重试、无错误提示、无降级处理。

**修复**：添加指数退避重试 + 错误 toast：

```typescript
} catch (e) {
  if (retries > 0) {
    setTimeout(() => this._loadContent(path, retries - 1), 1000);
    return;
  }
  console.error('[less-layout] SPA navigation failed, reloading:', e);
  globalThis.location.reload();
}
```

---

### M-5: `connectedCallback` / `disconnectedCallback` 事件清理不完整

| 属性   | 值                                                               |
| ------ | ---------------------------------------------------------------- |
| 文件   | `packages/ui/src/less-layout.ts`, `www/app/islands/less-term.ts` |
| 严重度 | 🟡 MEDIUM                                                        |
| 类型   | 内存泄漏风险                                                     |

**问题**：

- `less-layout` 注册了 `globalThis.addEventListener('less:theme-change', ...)` 但 `disconnectedCallback` 中未移除
- `less-term` 有 `setTimeout` 但无 `clearTimeout`

**修复**：所有 `addEventListener` 对应的 `removeEventListener` 必须在 `disconnectedCallback` 中执行。

---

### M-6: SPA 导航后 search 覆盖层未清理

| 属性   | 值                                   |
| ------ | ------------------------------------ |
| 文件   | `www/app/islands/less-search.ts:221` |
| 严重度 | 🟡 MEDIUM                            |
| 类型   | 可靠性                               |

**问题**：`connectedCallback` 中 `document.querySelectorAll('.less-search-overlay').forEach(el => el.remove())` 清理孤覆盖层。但如果用户在 SPA 导航时搜索面板正打开，覆盖层会在组件 disconnect 前被移除... 实际上当前代码在 connectedCallback 中清理，但这依赖时序——如果新组件先 connect 再清理，可能有短暂的脏状态。

**修复**：overlay 清理应在 `disconnectedCallback` 中执行（已存在），移除 connectedCallback 中的重复清理。

---

### M-7: registry `_renderer.ts` 独立 SEARCH_SCRIPT 使用 `document.querySelector`

| 属性   | 值                                        |
| ------ | ----------------------------------------- |
| 文件   | `www/app/routes/registry/_renderer.ts:69` |
| 严重度 | 🟡 MEDIUM                                 |
| 类型   | 架构 — 绕过框架                           |

**问题**：registry search 脚本使用 `document.querySelector('docs-registry-home')` 直接访问 DOM 并操作 `innerHTML`。完全绕过 DsdElement 生命周期。

**建议**：将 registry search 重构为 DsdElement island 组件。

---

### M-8: `packageIslands` 配置可能引入未使用代码

| 属性   | 值                      |
| ------ | ----------------------- |
| 文件   | `www/vite.config.ts:36` |
| 严重度 | 🟡 MEDIUM               |
| 类型   | 包体积                  |

**问题**：`packageIslands: ['@lessjs/ui', '@shoelace-style/shoelace']` 可能导致未使用的组件被包含进 client bundle。

**建议**：仅 import 实际使用的组件，或确认 tree-shaking 正确工作。

---

## 四、LOW 级发现

### L-1: 路由文件内联 JSON.stringify 样板（47 文件）

**影响**：代码重复，维护负担。

### L-2: `home` 属性别名保留在代码中

**影响**：向后兼容性代码增加认知负担。应在 v0.24.0 完全迁移后清理。

### L-3: `less-theme-toggle` 使用 `this.update()` 而非依赖 DSD markers

**影响**：虽然 `_bindCurrentRenderTemplate` 应能正确绑定事件（SSG 已生成 markers），但 `update()` 作为安全网存在意味着对 DSD hydration 不够信任。

### L-4: `escapeAttr` 和 `escapeHtml` 函数签名不一致

`escapeHtml(str: string): string` vs `escapeAttr(value: string): string`。两者都返回 `string`，失去了 branded type （SafeHtml/UnsafeHtml）的类型安全性。

### L-5: 无 CSP nonce 配置在生产环境 CI 中

`.github/workflows/test.yml` 中未见 CSP header 配置。

### L-6: `deps.ts` 文件缺失

部分 package 使用裸 import 而非统一的 `deps.ts` 模式。

### L-7: 测试覆盖缺口

- `render-nested.ts` 无循环引用检测测试
- `sanitizeUrl` 无边界条件测试
- SSG 渲染失败恢复无测试

---

## 五、修复优先级清单

| 优先级 | ID      | 问题                     | 预估修复时间 |
| ------ | ------- | ------------------------ | ------------ |
| 🔴 P0  | H-1     | `sanitizeUrl` 返回原始值 | ✅ FIXED     |
| 🔴 P0  | H-2     | 空 catch 块吞错          | ✅ FIXED     |
| 🔴 P0  | H-3     | SSG 嵌套渲染循环检测     | ✅ FIXED     |
| 🟡 P1  | M-3     | `_propagateTheme` 性能   | 1 hr         |
| 🟡 P1  | M-2     | CSS 双重定义             | 30 min       |
| 🟡 P1  | M-5     | 事件清理不完整           | ✅ FIXED     |
| 🟡 P1  | M-4     | `_loadContent` 错误恢复  | 20 min       |
| 🟡 P1  | M-1     | `any` 类型替换           | 分阶段       |
| 🟢 P2  | L-1     | JSON.stringify 样板      | 1 hr         |
| 🟢 P2  | L-2~L-7 | 其他低优项               | 分阶段       |

---

## 六、架构优化建议

1. **建立组件间通信协议**：当前 `less:theme-change` CustomEvent 是临时方案。建议引入正式的 EventBus 或 Context API。
2. **CSS 自定义属性单一来源**：全局 `:root` 定义 vs 组件 `:host` 定义应明确分工——全局管 body 级别，组件自管 shadow DOM。
3. **SSG 错误恢复策略**：当前 `catch { /* silent */ }` + 全页刷新的模式需替换为分级处理（warn / retry / fallback HTML / build error）。
4. **测试金字塔**：单元测试 < 集成测试 < e2e 测试的比例不均衡。核心工具函数（escape, sanitize, template）应有 100% 覆盖。

---

_本文档将随 agent 审计结果持续更新。_
