# 2026-06-03 Core Simplification Audit

## 1. 审计触发

v0.29.0 引入了 RenderNode IR，但保留了兼容层。用户要求作为专业全栈架构师，对每个字节进行全面扫描。

扫描范围：
- 所有 core/src 文件（33 个）
- 所有测试文件
- 所有公开 API 导出
- 所有内部调用链

## 2. 发现的问题（按类型分组）

### A. 架构层

**A1: renderDsd 返回 HTML 而非 RenderNode**
- `renderDsd()` 返回 `RenderOutput { html: string }`
- IR 层被迫用 `mergeDsdHostHtmlWithLightDom` 做字符串拼接
- 理想状态：`renderDsd()` 应返回 `RenderNode`，让 IR 层统一处理

**A2: Sync/Async 双轨重复（~100 行）**
- `renderToStaticNode` 和 `renderToDsdNode` 是两套几乎相同的遍历逻辑
- `renderSpecialVNodeSync` vs `renderSpecialVNodeAsync`
- `renderChildrenFromProps` vs `renderChildrenFromPropsAsync`
- 重复代码约 100 行

**A3: mergeDsdHostHtmlWithLightDom 回退字符串操作**
- 位置：`render-ir.ts:373`
- 依赖 `lastIndexOf` 查找闭合标签
- 如果 HTML 结构异常会出错
- 这是 IR 层回退到字符串操作的"破窗"

**A4: 兼容转发未删除**
- `renderToString` / `renderDsdTree` 在 `jsx-render-string.ts` 中是薄转发（16 行）
- `renderDsdByName` 在 `render-dsd.ts` 中是 `renderDsd` 的薄包装（15 行）
- 遗留 API 增加维护负担

**A5: adapter-vite ↔ content 循环依赖（已知 H-16）**
- `entry-renderer.ts:16-21` 标注为已知问题
- 需要更大重构，不在本次范围

### B. 代码质量

**B1: `_hyrateExistingDom` 拼写错误**
- 位置：`dsd-element.ts:302, 470`
- 应为 `_hydrateExistingDom`
- 影响代码可读性和搜索

**B2: serializeAttributes vs serializeElementAttrs 不一致**
- `serializeAttributes`（render-serialize.ts）：用 `camelToKebab`
- `serializeElementAttrs`（render-ir.ts）：只处理 `className` → `class` 和 `htmlFor` → `for`
- 两个函数对 camelCase 属性的处理方式不同
- 影响 DSD host 元素和普通元素的属性渲染一致性

**B3: hub/scanner.ts 硬编码版本 '0.20.0'**
- 位置：`hub/scanner.ts:62`
- 版本更新时容易遗漏
- 应从 `deno.json` 或环境变量读取

**B4: renderDsdByName 遗留 API**
- 位置：`render-dsd.ts:397`
- 已被 `renderDsd()` 取代
- 只有测试使用，无外部消费者
- 增加 API 表面混乱

**B5: 43 处 `as unknown as` 类型逃逸**
- 分布在 core 全局
- 虽然是框架的预期行为（处理动态类型），但数量较多
- 需要审查是否有更安全的替代方案

**B6: 33 处全局访问点**
- `globalThis` / `window` / `document` 访问
- 虽然是框架的预期行为，但增加了 SSR 环境的复杂性
- 需要确保所有全局访问都有环境检测和降级处理

### C. 安全/鲁棒性

**C1: trustRenderHtml 纯透传无验证**
- 位置：`security.ts`
- `trustRenderHtml` 只是返回输入，无任何验证
- 依赖调用方自律，但无运行时防护
- 建议加开发模式警告

**C2: innerHTML/textContent/children 优先级隐式**
- 位置：`render-ir.ts:334-339`
- 优先级：`innerHTML` > `textContent` > `children`
- 未在文档中明确说明
- 可能导致用户误用

**C3: Custom Element 注册依赖全局**
- 位置：`render-ir.ts:228-245`
- 依赖全局 `customElements`
- SSR 环境可能不存在
- 需要环境检测和降级处理

### D. 测试/文档

**D1: Router 测试覆盖率极低**
- 485 行源码，仅 20 行测试
- 覆盖率比率 0.04（极低）
- 对比：adapter-vite 0.83，core 0.54，hub 0.26
- 需要优先补充

**D2: STATUS.md 版本滞后**
- 仍显示 v0.28.5
- 实际已是 v0.29.0
- 影响 AI 助手和新贡献者

**D3: 部分包测试不足**
- style-sheet / i18n / cem / app 各 1 个测试文件
- 需要加强

## 3. 核心争论：向后兼容 vs 激进清理

### 正方（兼容派）

**论点：**
- 标记 `@deprecated`，渐进迁移
- v1.0 再删除
- 减少 breaking changes
- 给用户迁移时间

**理由：**
- 尊重现有用户
- 降低迁移成本
- 更保守的策略

### 反方（清理派）

**论点：**
- 不向后兼容，直接删除
- 一步到位
- 减少过渡期的混乱代码

**理由：**
- v0.29.1 还在 0.x 阶段，semver 允许 breaking
- 消费者数量少（JSR 上无外部依赖者）
- 渐进迁移只会让代码在过渡期更乱
- 长期维护成本更低

### 用户决策

**不向后兼容。**

**理由：**
1. 0.x 阶段的 breaking changes 是预期的
2. JSR 上无外部依赖者，影响范围可控
3. 渐进迁移会产生"半迁移"状态，代码更混乱
4. 一步到位让代码库更干净

## 4. 每个合并/删除决策的思辨

### 4.1 为什么 serializeAttributes 和 serializeElementAttrs 必须统一

**现状：**
同一个 IR 里两种节点形状：
- `dsd-host` 节点：`attrs` 是 `string`（预序列化）
- `element` 节点：`attrs` 是 `Record<string, unknown>`（需要序列化）

**问题：**
这是便利性决策，不是架构必要性。`wrapDsdOutput()` 在构建 `dsdHostNode` 时提前序列化了 attrs，导致 `serializeRenderNode` 对 `dsd-host` 不再需要序列化。

**解决方案：**
让 `dsdHostNode` 的 `attrs` 也存 `Record<string, unknown>`，然后 `serializeRenderNode` 对 `element` 和 `dsd-host` 调用同一个 `serializeAttrs(tag, props)`。

**统一后的函数：**
```typescript
function serializeAttrs(tag: string, props: Record<string, unknown>): string {
  const isCustomElement = tag.includes('-');
  let result = '';
  for (const [key, value] of Object.entries(props)) {
    if (skipKeys.has(key)) continue;
    // React 风格映射（所有元素）
    let attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;
    // Custom Element 额外做 kebab-case
    if (isCustomElement && attrName === key) {
      attrName = camelToKebab(attrName);
    }
    // ... 值序列化（boolean / string / object）
  }
  return result;
}
```

### 4.2 为什么 jsx-render-string.ts 可以删除

**现状：**
16 行纯 re-export：
```typescript
export { renderToString, renderDsdTree } from './render-ir.js';
```

**问题：**
v0.29 IR 已就位，这个文件只是一个历史遗留的中间层。

**解决方案：**
删除文件，调用方直接 import `render-ir.ts`。

### 4.3 为什么 7 个文件可以合并

**文件列表：**

| 文件 | 行数 | 合并到 | 理由 |
|---|---|---|---|
| `jsx-render-string.ts` | 16 | 删除 | 纯 re-export |
| `custom-element.ts` | 13 | `island.ts` | 只有一个函数，和 `defineIsland` 功能重叠 |
| `api.ts` | 26 | `types.ts` | 只有一个 interface `LessApiContext`，纯类型 |
| `prop-types.ts` | 76 | `prop.ts` | 纯类型文件，和 `prop.ts` 紧密耦合 |
| `render-errors.ts` | 138 | `render-dsd.ts` | 只有 `render-dsd.ts` 一个消费者 |
| `render-instantiate.ts` | 59 | `render-dsd.ts` | 只有 `render-dsd.ts` 一个消费者 |
| `render-serialize.ts` | 103 | `render-ir.ts` + `render-dsd.ts` | 属性统一后，剩余函数只有 `render-dsd.ts` 用 |

**理由：**
- 减少文件数量（33 → 26）
- 一个文件一个职责
- 减少跨文件调用

### 4.4 为什么 renderDsdByName 直接删

**现状：**
```typescript
export async function renderDsdByName(
  tagName: string,
  props: Record<string, unknown> = {},
): Promise<RenderOutput> {
  return await renderDsd(tagName, { props });
}
```

**问题：**
- 只有测试使用
- `renderDsd(tagName, ...)` 完全覆盖
- `runtime/exports.test.ts` 已经验证它不在 runtime 导出中

**解决方案：**
直接删除，不标记 `@deprecated`。

**理由：**
- 用户明确选择"不向后兼容"
- 0.x 阶段允许 breaking
- JSR 上无外部消费者

### 4.5 为什么 Sync/Async 双轨在这个环节合并

**用户要求：**
"就在这个环节"

**现状：**
- `renderToStaticNode` 和 `renderToDsdNode` 是两套几乎相同的遍历逻辑
- 约 100 行重复代码

**解决方案：**
合并到单一的 `renderToNode`（async，~90 行）。

**关于函数数量的讨论：**

**选项 A：保留三个函数**
- `renderToNode`（主入口）
- `renderSpecialVNode`（Fragment/Show/For）
- `renderChildrenFromProps`（innerHTML/textContent）

**选项 B：全部内联到一个函数**
- 一个函数，~90 行
- 更清爽

**选项 C：保留两个函数**
- `renderToNode` + `renderSpecialVNode`
- 内联 `renderChildrenFromProps`（只有 10 行）

**用户选择：选项 B**

**理由：**
- 100 行不算长
- 一个函数更清爽
- 减少函数名记忆负担

### 4.6 为什么 renderToString 可以完全删除

**历史背景：**
`renderToString` 最初是为了 Lit 兼容性创建的：
- Lit 有自己的 `render()` 返回 `TemplateResult`
- LessJS 需要一个"简单"的渲染器，只把 VNode 转成 HTML 字符串，不处理 DSD

**当前状态：**

1. **内部使用**：`_resolveRenderOutput` 是死代码，从未被调用
2. **Lit 适配器**：不使用 `renderToString`，有自己的渲染逻辑
3. **公开 API**：`renderDsdTree` 做同样的事情，而且处理 custom elements

**合并后的情况：**
如果合并到单一的 `renderToNode`（async，处理 custom elements）：
```typescript
// renderToString 变成：
export async function renderToString(node: unknown): Promise<string> {
  return serializeRenderNode(await renderToNode(node, createEventMarkerContext()));
}

// renderDsdTree 变成：
export async function renderDsdTree(node: unknown): Promise<string> {
  return serializeRenderNode(await renderToNode(node, createEventMarkerContext()));
}
```

**关键洞察：**
如果两者都变成 `renderToNode` 的 async wrapper，那它们就完全相同了！

**结论：**
`renderToString` 可以完全删除。

**理由：**
1. 内部使用：`_resolveRenderOutput` 是死代码
2. Lit 适配器：不使用 `renderToString`
3. 合并后：`renderToString` 和 `renderDsdTree` 会变成完全相同的函数
4. 语义：`renderToString` 的语义（不处理 DSD）在 LessJS 中没有意义

**副作用分析：**

| 影响范围 | 影响程度 | 说明 |
|---|---|---|
| 内部代码 | ✅ 无 | `_resolveRenderOutput` 是死代码 |
| Lit 适配器 | ✅ 无 | 不使用 `renderToString` |
| 外部用户 | ⚠️ 极小 | 边缘情况，0.x 允许 breaking |
| 测试 | ⚠️ 小 | 需要更新，机械性工作 |
| 文档 | ⚠️ 小 | 需要更新 API 文档 |

**迁移路径：**
```typescript
// 改前
import { renderToString } from '@lessjs/core';
const html = renderToString(vnode);

// 改后
import { renderDsdTree } from '@lessjs/core';
const html = await renderDsdTree(vnode);  // 注意：async
```

## 5. 关于 async 性能的误解

**用户问题：**
"按道理说全体 async 不是只会更加快速吗？"

**纠正：**
Async 不会更快，实际上会更慢。

**为什么 async 更慢？**

1. **Promise 分配开销**：每个 `async` 函数调用都会创建一个 Promise 对象
2. **微任务队列开销**：Async 操作通过微任务队列，增加了调度开销
3. **Await 开销**：每个 `await` 都会挂起和恢复函数
4. **这里没有并行化收益**：渲染 VNode 树是纯 CPU 工作，没有 I/O 可以并行化

**什么时候 async 更快？**
- 当你有多个独立的 I/O 操作（网络请求、文件读取）可以并行运行时

**什么时候 async 更慢？**
- 纯 CPU 密集型工作（比如渲染）
- 不需要同步等待的同步操作

**那为什么要用 async？**

真正的原因不是性能，而是 API 契约：
- `renderDsd()` 需要实例化组件并调用它们的 `render()` 方法
- 组件的 `render()` 方法**未来可能**是 async 的
- 为 async 组件渲染做未来准备

**性能差异可以忽略**（每次渲染微秒级），所以实际上不是问题。

## 6. 影响评估

| 指标 | 改前 | 改后 | 变化 |
|---|---|---|---|
| core/src 文件数 | 33 | 26 | **-7 (-21%)** |
| 属性序列化函数 | 2 | 1 | **-1** |
| 重复 tagName 验证 | 2 | 1 | **-1** |
| 渲染函数 | 2（sync + async） | 1（async-only） | **-1** |
| 公开渲染 API | 2（renderToString + renderDsdTree） | 1（renderDsdTree） | **-1** |
| 遗留 API | 存在 | 删除 | 清理 |
| 死代码 | 存在（_resolveRenderOutput） | 删除 | 清理 |
| 拼写错误 | 1 | 0 | 修复 |
| 硬编码版本 | 1 | 0 | 修复 |
| **净减代码行** | — | **~200-220** | 精简 |

## 7. 与 ADR-0077 的关系

**v0.29.0 (ADR-0077):**
- 引入 IR，但保留兼容层
- 目标是建立结构化渲染管道

**v0.29.1 (ADR-0078):**
- 清理 IR 之后的遗留
- 删除兼容层
- 统一序列化
- 合并双轨
- 删除不必要的 API

**关系：**
ADR-0078 是 ADR-0077 的自然延续和完成。v0.29.0 建立了 IR，v0.29.1 让 IR 成为唯一的渲染路径。

## 8. 不会动的（有意保留）

**render-dsd-stream.ts (136 行)**
- 有独立测试
- 有公开 API
- 有文档引用
- 是合法功能

**error-boundary.ts (77 行)**
- 有独立测试
- 被 runtime re-export
- 是合法功能

**signal-context.ts (96 行)**
- 被 `less-layout.tsx` 和 `home-console.tsx` 实际使用
- 是合法功能

**context.ts (124 行)**
- SSR 核心模块
- 多处使用

**adapter-vite ↔ content 循环依赖**
- 已知 H-16
- 需要更大重构
- 不在本次范围

## 9. 执行计划

### 5 个 Phase 的完整清理

1. **Phase 1**: 零风险修复（拼写、版本、警告）
2. **Phase 2**: 统一属性序列化（`serializeAttrs`）
3. **Phase 3**: 文件合并（7 个文件删除）
4. **Phase 4**: API 清理（删除 `renderDsdByName`）
5. **Phase 5**: 合并为单一 async 渲染路径
   - 创建 `renderToNode`（一个函数，~90 行）
   - 删除 `renderToString`（完全删除）
   - 删除 `_resolveRenderOutput`（死代码）
   - `renderDsdTree` 成为唯一的公开渲染 API

### 三份文档

1. **Conversation**: `docs/conversation/20260603/20260603-core-simplification-audit.md`（本文档）
2. **ADR-0078**: `docs/adr/ADR-0078-core-simplification-and-merge.md`
3. **SOP-007**: `docs/sop/v0.29.1/SOP-007-core-simplification.md`

## 10. 总结

本次审计发现了 v0.29.0 IR 落地后的多个遗留问题，包括：
- 架构层：双轨重复、兼容转发、字符串操作回退
- 代码质量：拼写错误、序列化不一致、硬编码版本
- 安全/鲁棒性：信任边界无验证、优先级隐式
- 测试/文档：覆盖率不足、版本滞后

用户明确选择"不向后兼容"，执行激进的清理策略。

最终目标：
- core/src 33 → 26 文件
- 净减 ~200-220 行代码
- 一套属性序列化逻辑
- 一套渲染路径（async-only）
- 一个公开渲染 API（`renderDsdTree`）
- 零拼写错误、零硬编码版本

这将让 LessJS 的代码库更干净、更易维护、更接近 v1.0 的稳定状态。
