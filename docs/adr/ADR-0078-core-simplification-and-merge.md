# ADR-0078: Core Package Simplification and Module Merge

- Status: Accepted
- Date: 2026-06-03
- Target: v0.29.1
- Extends: [ADR-0077](./ADR-0077-structured-render-ir.md) (Structured Render IR)

## Context

v0.29.0 引入了 RenderNode IR（ADR-0077），建立了结构化渲染管道。但 IR 落地后仍保留了兼容层，导致：

1. **双轨重复**：`renderToStaticNode` 和 `renderToDsdNode` 是两套几乎相同的遍历逻辑（~100 行重复）
2. **兼容转发**：`jsx-render-string.ts`（16 行）只是 re-export，`renderDsdByName` 是 `renderDsd` 的薄包装
3. **序列化不一致**：`serializeAttributes` 和 `serializeElementAttrs` 对 camelCase 属性的处理方式不同
4. **遗留 API**：`renderToString` 和 `renderDsdTree` 在合并后会变成完全相同的函数
5. **死代码**：`_resolveRenderOutput` 定义了但从未被调用
6. **代码质量问题**：拼写错误（`_hyrateExistingDom`）、硬编码版本（`'0.20.0'`）、信任边界无验证

全面扫描发现 core 包有 33 个源文件，其中 7 个可以合并或删除。

## Decision

**不向后兼容。** 执行 5 个阶段的清理，让 core 包更简洁、更易维护。

### Phase 1: 零风险修复

**目标：** 修复不影响 API 的代码质量问题

**改动：**

1. `_hyrateExistingDom` → `_hydrateExistingDom`（2 处）
2. `hub/scanner.ts` 的版本从 `deno.json` 读取，不再硬编码 `'0.20.0'`
3. `trustRenderHtml` 加开发模式警告，提醒调用方这是信任边界而非 sanitizer

**影响：**

- 改动 ~10 行
- 无 API 变化
- 无功能变化

### Phase 2: 统一属性序列化

**目标：** 一个函数处理所有属性序列化

**改动：**

1. 创建 `serializeAttrs(tag, props)` 函数
   - 根据 `tag` 是否含 `-` 决定是否 kebab-case
   - 处理 React 风格映射（`className` → `class`，`htmlFor` → `for`）
2. `dsdHostNode.attrs` 从 `string` 改为 `Record<string, unknown>`
3. `wrapDsdOutput()` 不再预序列化 attrs
4. 删除 `serializeAttributes()` 和 `serializeElementAttrs()`
5. `camelToKebab` 从 `render-serialize.ts` 移入 `render-ir.ts`

**影响：**

- 改动 ~40 行
- `dsd-host` 和 `element` 节点使用同一个序列化路径
- 需要回归测试所有 SSG 输出

### Phase 3: 文件合并

**目标：** core/src 33 → 26 文件

**改动：**

| 文件                    | 行数 | 合并到                           | 理由                                        |
| ----------------------- | ---- | -------------------------------- | ------------------------------------------- |
| `jsx-render-string.ts`  | 16   | 删除                             | 纯 re-export                                |
| `custom-element.ts`     | 13   | `island.ts`                      | 只有一个函数，和 `defineIsland` 功能重叠    |
| `api.ts`                | 26   | `types.ts`                       | 只有一个 interface `LessApiContext`，纯类型 |
| `prop-types.ts`         | 76   | `prop.ts`                        | 纯类型文件，和 `prop.ts` 紧密耦合           |
| `render-errors.ts`      | 138  | `render-dsd.ts`                  | 只有 `render-dsd.ts` 一个消费者             |
| `render-instantiate.ts` | 59   | `render-dsd.ts`                  | 只有 `render-dsd.ts` 一个消费者             |
| `render-serialize.ts`   | 103  | `render-ir.ts` + `render-dsd.ts` | 属性统一后，剩余函数只有 `render-dsd.ts` 用 |

**额外改动：**

- `registry.ts:isValidCustomElementName` → 改用 `tag-utils.ts:isValidTagName`（消除重复的 tagName 验证）
- 更新 `index.ts` re-exports
- 更新 `deno.json` exports map

**影响：**

- 删除 7 个文件
- 移动 ~400 行代码
- 需要更新所有 import 路径

### Phase 4: API 清理

**目标：** 删除遗留 API

**改动：**

1. 删除 `renderDsdByName()` 函数
2. 删除 `render-dsd.test.ts` 中 `renderDsdByName` 测试
3. 从 `index.ts` 移除 `renderDsdByName` re-export
4. 确认 `runtime/exports.test.ts` 已验证它不在 runtime 中

**影响：**

- 删除 ~15 行
- **Breaking change**：删除公开 API
- 0.x 阶段允许 breaking
- JSR 上无外部消费者

### Phase 5: 合并为单一 async 渲染路径

**目标：** 一个函数，一条路径

**改动：**

1. 创建 `renderToNode(node, eventContext): Promise<RenderNode>`（~90 行）
   - 合并 `renderToDsdNode` 的主逻辑
   - 内联 `renderSpecialVNodeAsync`（Fragment/Show/For）
   - 内联 `renderChildrenFromPropsAsync`（innerHTML/textContent）
2. 删除 `renderToStaticNode()`
3. 删除 `renderSpecialVNodeSync()`
4. 删除 `renderChildrenFromProps()`（sync 版本）
5. 删除 `renderToDsdNode()`
6. 删除 `renderSpecialVNodeAsync()`
7. 删除 `renderChildrenFromPropsAsync()`
8. **删除 `renderToString()`**（完全删除）
9. `renderDsdTree` 改为调用 `renderToNode`：
   ```typescript
   export async function renderDsdTree(node: unknown): Promise<string> {
     return serializeRenderNode(await renderToNode(node, createEventMarkerContext()));
   }
   ```
10. 删除 `_resolveRenderOutput()`（死代码）
11. 更新所有调用方（把 `renderToString` 改为 `renderDsdTree`）
12. 更新测试（加 `await`）

**影响：**

- 删除 ~120 行
- **Breaking change**：`renderToString` 完全删除
- `renderDsdTree` 成为唯一的公开渲染 API
- 所有测试需要更新（加 `await`）

**为什么删除 `renderToString`？**

1. **内部使用**：`_resolveRenderOutput` 是死代码，从未被调用
2. **Lit 适配器**：不使用 `renderToString`，有自己的渲染逻辑
3. **合并后**：`renderToString` 和 `renderDsdTree` 会变成完全相同的函数
4. **语义**：`renderToString` 的语义（不处理 DSD）在 LessJS 的 DSD-first 架构中没有意义

**迁移路径：**

```typescript
// 改前
import { renderToString } from '@lessjs/core';
const html = renderToString(vnode);

// 改后
import { renderDsdTree } from '@lessjs/core';
const html = await renderDsdTree(vnode); // 注意：async
```

## Consequences

### Positive

1. **代码简化**
   - core/src 33 → 26 文件（-21%）
   - 净减 ~200-220 行代码
   - 一套属性序列化逻辑
   - 一套渲染路径（async-only）
   - 一个公开渲染 API

2. **维护成本降低**
   - 减少跨文件调用
   - 减少函数名记忆负担
   - 减少 API 表面

3. **代码质量提升**
   - 消除拼写错误
   - 消除硬编码版本
   - 消除死代码
   - 消除重复的 tagName 验证

4. **架构一致性**
   - DSD-first 架构更纯粹
   - IR 成为唯一的渲染路径
   - 信任边界更明确

### Negative

1. **Breaking changes**
   - `renderToString` 完全删除
   - `renderDsdByName` 删除
   - `renderDsdTree` 仍然是 async（无变化）

2. **迁移成本**
   - 使用 `renderToString` 的代码需要改为 `renderDsdTree`
   - 测试需要加 `await`

3. **学习曲线**
   - 新用户需要理解为什么只有一个渲染 API
   - 需要理解 async 的必要性

### Mitigations

1. **0.x 阶段允许 breaking**
   - Semver 规则：0.x 版本允许 breaking changes
   - 用户预期：使用 0.x 版本的用户应该预期 API 变化

2. **JSR 上无外部依赖者**
   - 影响范围可控
   - 不会影响下游包

3. **清晰的迁移路径**
   - `renderToString` → `renderDsdTree`（加 `await`）
   - 机械性替换，不涉及逻辑变化

4. **文档更新**
   - 更新 API 文档
   - 更新迁移指南
   - 在 release notes 中明确说明

## Non-Goals

1. **不改 router**
   - Router 测试覆盖率低是独立问题
   - 不在本次范围

2. **不改 adapter-vite ↔ content 循环依赖**
   - 已知 H-16
   - 需要更大重构
   - 不在本次范围

3. **不改 render-dsd-stream / error-boundary / signal-context**
   - 这些是合法功能
   - 有独立测试和使用者
   - 不需要删除

4. **不引入新公开 API**
   - 本次是清理，不是扩展
   - 保持 API 表面最小化

5. **不做 UI Shell 双轨**
   - 那是 v0.30.0 的目标
   - 不在本次范围

## Related

- [ADR-0077](./ADR-0077-structured-render-ir.md): Structured Render IR
- [SOP-007](../sop/v0.29.1/SOP-007-core-simplification.md): 详细执行指南
- [Conversation](../conversation/20260603/20260603-core-simplification-audit.md): 审计思辨过程

## Summary

v0.29.1 执行激进的代码清理，不向后兼容。通过 5 个阶段的清理，让 core 包从 33 个文件减少到 26 个，净减 ~200-220 行代码，建立一套统一的属性序列化逻辑和一套 async-only 的渲染路径。`renderDsdTree` 成为唯一的公开渲染 API，`renderToString` 和 `renderDsdByName` 被完全删除。这将让 LessJS 的代码库更干净、更易维护、更接近 v1.0 的稳定状态。
