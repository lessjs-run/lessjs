# SOP-003: CLI 入口重命名与数据文件组织

> Version: v0.24.3\
> Priority: P2\
> Status: **COMPLETED** (2026-05-29)\
> Depends on: SOP-002 (type dedup gates must pass)\
> Source: `docs/conversation/20260529/lessjs-v0.24.3-duplicate-code-audit.md` §七

## Objective

消除两个 `less-add.ts` CLI 文件的歧义命名，将自动生成的数据文件移出路由目录，消除 changelog 页面的内容双写。

## Background

第二轮全仓库扫描（2026-05-29）发现三个组织层面的问题：

1. **`less-add.ts` 重名**：`compat-check/src/cli/less-add.ts` 和 `hub/src/cli/less-add.ts` 同名但做不同事（plan generation vs install guidance）
2. **数据文件错位**：`_hub-data-full.ts` (3867L) 是自动生成数据，不应该在 `routes/` 目录
3. **changelog 双写**：`changelog.ts` (1956L) 内联 HTML 内容与 `CHANGELOG.md` 重复

## Strategic Boundary

| Included                                               | Excluded                                           |
| ------------------------------------------------------ | -------------------------------------------------- |
| hub CLI `less-add.ts` → `less-install-guide.ts` 重命名 | 两个 CLI 逻辑合并（架构决策，不在本次范围）        |
| `_hub-data-full.ts` 移至 `www/data/` 或 `www/content/` | hub:scan 生成逻辑修改                              |
| changelog.ts 改为从 markdown 源读取                    | changelog 页面样式改动                             |
| manifest/registry/_hub-data-full.ts 仅数据             | manifest/registry/_hub-data-full.ts 引用 link 更新 |

## Step-by-Step Procedure

---

### Step 1: 重命名 hub `less-add.ts` → `less-install-guide.ts`

**Purpose**: 消除两个同名 CLI 文件的歧义。

**Files**:

- `packages/hub/src/cli/less-add.ts` → `packages/hub/src/cli/less-install-guide.ts`
- `deno.json`（work 任务中的引用）

**Actions**:

1. 检查 `deno.json` 中是否有直接引用 `hub/src/cli/less-add.ts` 的 task：

```bash
grep -n "less-add\|hub.*cli" deno.json
```

2. 如果存在 `hub:less-add` 或类似 task，更新 task 路径。

3. 重命名文件：

```bash
mv packages/hub/src/cli/less-add.ts packages/hub/src/cli/less-install-guide.ts
```

4. 更新 hub 的 `deno.json` 中任何 export 引用（如果有的话）。

5. 确认 `import.meta.main` entry 的 shebang 和用法注释更新为新名称。

6. 搜索仓库内是否有其他文件引用了旧路径：

```bash
grep -rn "less-add.ts" --include="*.ts" --include="*.json" packages/ www/ | grep -v "compat-check"
```

**Acceptance**:

- [ ] 仓库内不存在两个 `less-add.ts` CLI 文件
- [ ] hub CLI 新名称为 `less-install-guide.ts`
- [ ] 所有引用路径已更新
- [ ] `deno task typecheck` pass

---

### Step 2: 将 `_hub-data-full.ts` 移出 `routes/`

**Purpose**: 自动生成的数据文件不应放在路由目录中。

**Files**:

- `www/app/routes/registry/_hub-data-full.ts` → `www/data/registry/hub-data.ts`
- `www/app/routes/registry/_renderer.ts`（如果引用了 `_hub-data-full.ts`）
- 任何 import `_hub-data-full` 的文件

**Actions**:

**2a. 确认引用关系**：

```bash
grep -rn "_hub-data-full\|hub-data-full" www/app/ --include="*.ts" --include="*.tsx"
```

**2b. 创建新位置**：

```bash
mkdir -p www/data/registry
mv www/app/routes/registry/_hub-data-full.ts www/data/registry/hub-data.ts
```

**2c. 更新所有 import 引用**：

将所有 `from '../registry/_hub-data-full.js'` 或类似引用更新为新路径。

**2d. 确认构建仍能发现此数据文件**：

如果 SSG 构建依赖 route scanner 自动发现 `routes/` 下的文件，需要改为显式导入或虚拟模块注册。检查 `adapter-vite` 的 route scanner 是否有 `exclude` 或 `include` 配置可调整。

```bash
grep -rn "hub-data" packages/adapter-vite/src/
```

**2e. 重建验证**：

```bash
deno task build
```

**Acceptance**:

- [ ] `www/app/routes/registry/` 下不存在 `_hub-data-full.ts`
- [ ] 数据文件在新位置 `www/data/registry/hub-data.ts`
- [ ] 所有引用已更新
- [ ] `deno task build` pass（hub 数据仍能正确注入页面）

---

### Step 3: 消除 changelog 页面双写

**Purpose**: changelog.ts 不再内联 HTML 内容，改为从 markdown 源动态生成。

**Files**:

- `www/app/routes/changelog.ts`
- `CHANGELOG.md`

**方案 A — 最小改动（推荐）**：changelog.ts 改为在运行时读取 CHANGELOG.md 并渲染

1. 在 `changelog.ts` 中 import CHANGELOG.md（Vite 原生支持 `.md` 导入为字符串）
2. 使用简单的 markdown-to-HTML 转换（或直接用 Vite 的 markdown 预处理）
3. 删除 changelog.ts 中的 1900+ 行内联 HTML

实际上，当前的 changelog.ts 模板是手工编写的 HTML 版本，与 CHANGELOG.md 的格式不同。如果采用此方案，changelog 页面的视觉需要重新适配。

**方案 B — 内容层方案**：利用 lessjs content 系统

1. 将 `CHANGELOG.md` 或 `docs/release/*.md` 注册为 content source
2. changelog.ts 通过 `virtual:less-content` 获取内容
3. 模板层负责渲染

**方案 C — 保持现状但文档化**：

1. 在 changelog.ts 头部添加注释：更新时需同步 `CHANGELOG.md`
2. 添加 CI gate（如 `deno task ci:check-changelog-sync`）检查两个文件是否一致

**推荐方案 A**，因为：

- 不需要引入新的内容层依赖
- Vite 原生支持 `.md` 导入
- 改动集中在一个文件内

**Actions (方案 A)**：

1. 在 vite.config 中确保 `.md` 文件被处理（Vite 默认已支持）

2. 修改 `changelog.ts`：

```typescript
// 替换 1900+ 行内联 HTML 为:
import changelogMd from '../../../CHANGELOG.md?raw';
// 或使用 Vite 的 markdown 插件预处理
```

3. 实现简单的 markdown 渲染器（或使用现有依赖如 marked/markdown-it）：

```typescript
function renderMarkdown(md: string): string {
  // 只处理 ## headers 和 - 列表
  // 保留 <code> 和 <a> 等内联标签
  // 不需要完整的 CommonMark 兼容
}
```

3. 验证页面输出与之前一致。

**Acceptance**:

- [ ] `changelog.ts` 不再内联 1900+ 行 HTML 内容
- [ ] changelog 页面内容来源于 `CHANGELOG.md`
- [ ] 页面视觉效果无变化（或变化可接受）
- [ ] `deno task build` pass
- [ ] 以后更新 changelog 只需编辑 `CHANGELOG.md`

---

## Quality Gates Summary

| Gate | Criteria                                                            |
| ---- | ------------------------------------------------------------------- |
| G1   | 仓库内只有一个 `less-add.ts` CLI（compat-check 的 plan generation） |
| G2   | hub CLI 新名 `less-install-guide.ts`，所有引用已更新                |
| G3   | `_hub-data-full.ts` 不在 `routes/` 下                               |
| G4   | `changelog.ts` 内容来源于 `CHANGELOG.md`                            |
| G5   | 全量 gate 通过                                                      |

## Dependencies

```
Step 1 (less-add 重命名) ← 独立
Step 2 (hub-data 搬迁)  ← 独立
Step 3 (changelog 双写) ← 独立

Steps 1-3 可并行 → 全量回归
```

## Risks

| Risk                                          | Mitigation                                |
| --------------------------------------------- | ----------------------------------------- |
| hub-data 移出 routes/ 后 SSG 构建找不到数据   | Step 2 先 grep 引用再搬迁，失败可回退     |
| changelog markdown 渲染与原有 HTML 格式不一致 | 方案 A 先用 simplest parser，对比输出再调 |
| less-add 重命名后外部依赖未更新               | grep 全仓库引用确认                       |
