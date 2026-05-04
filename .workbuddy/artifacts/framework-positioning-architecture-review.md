# KISS 框架：定位、架构与未来全面审查

> 审查人：WorkBuddy | 日期：2026-05-04 | 基于：v0.5.x 代码库 + GPT-55 文档重构后状态

---

## 一、定位评估

### GPT-55 给出的定位

> "Deno-first、Web Standards-first、Static-first 的 Web Components/DSD 全栈框架"

### 我的评估：定位方向正确，但需要更锋利

GPT-55 的定位表述是准确的，但还缺一层"为什么存在"的锐度。我建议这样收束：

**KISS = 给 Web Components 一个 Jamstack 工作流。**

这句话比"全栈框架"更窄但更有力。原因是：

1. **"全栈框架"让用户期待 Next.js 级别的完备性**——forms、auth、ORM、ISR。KISS 现在没有，短期也不该有。用"全栈"定位反而拉低了信任度。
2. **Web Components + Jamstack 是市场空白**。Astro 做 islands 但不认 Web Components 为一等公民；Fresh 认 Deno 但绑 Preact；Qwik 追 resumability。没有人认真把"用 Custom Elements 写组件、用 SSG 输出、用 islands 加交互"做成一条完整管线。
3. **Deno-first 是运行时选择，不是定位**。Deno 是"怎么跑"，不是"解决什么"。定位应该先回答"解决什么"。

### 推荐定位措辞

| 层 | 当前 | 建议 |
|---|---|---|
| 一句话 | Deno-first / Web Standards-first / Static-first | **Web Components + SSG + Islands，Deno-native** |
| 核心承诺 | DSD-rendered Web Components + Island Upgrade + Hono API + SSG | 同意，但强调 SSG 是 default delivery，不是 optional |
| 不做什么 | 不是 hydration 框架 | ✅ 正确且重要 |

### 与生态对比的判断

GPT-55 的对比表基本准确，我补充几个关键差异点：

| 框架 | KISS 的差异应放在 |
|---|---|
| Astro | Astro 的 islands 是性能故事（少发 JS）；KISS 的 islands 是组件模型（Custom Elements 是一等公民） |
| Fresh | Fresh 是 server-first（每个请求都渲染）；KISS 是 static-first（构建时渲染，运行时可选） |
| Qwik | Qwik 追 resumability（零 hydration）；KISS 追 upgrade（Custom Element 原生机制），复杂度低一个数量级 |
| Next/Nuxt | 不是竞争对手，是方向参考。KISS 不该追"全栈平台" |

---

## 二、架构审查

### 2.1 包边界：方向正确，边界清晰

| 包 | 职责 | 评价 |
|---|---|---|
| @kissjs/core | 路由扫描、entry 生成、DSD SSR、SSG、CLI | ✅ 核心管线完整，不含 UI 框架 |
| @kissjs/ui | 文档站和示例的 Web Components | ✅ 纯展示层，不侵入 core |
| @kissjs/rpc | 类型安全 API/RPC | ⚠️ 目前偏实验性，0.3.0 |
| @kissjs/adapter-lit | Lit 从必选变可选的适配边界 | ✅ 这个设计是 KISS 最有辨识度的架构决策 |
| @kissjs/create | 项目脚手架 | ✅ 工具角色 |

**最值得保留的架构原则：**

1. **adapter-lit 的 protocol 模式**——通过 `globalThis.__kissLit*` 钩子把 Lit 从必选变可选。这不是临时方案，这是 KISS 的框架哲学的实现。
2. **3-Phase Build 分离**——每阶段有独立的失败模式和可验证产物，比"一次 build 全搞定"更可调试。
3. **DSD-first rendering**——纯字符串拼接、零 DOM shim，比虚拟 DOM SSR 轻一个数量级。

### 2.2 四个 P1/P2 Bug 的架构根源分析

之前审查确认了 4 个 bug，GPT-55 的文档也提到了它们。但更重要的问题是：**这些 bug 不是孤立事件，它们共享一个架构根源。**

| Bug | 表面问题 | 架构根源 |
|---|---|---|
| 根 middleware `'//*'` | scope 拼接错误 | **Scope 语义不一致**：`entry-descriptor.ts` 把根路径解析为 `"/"`，`entry-renderer.ts` 直接拼接 `scope + '/*'`，但 Hono 的 `'//*'` 不等于 `'/*'` |
| SSG 丢失 CSP | `injectCspMeta()` 未被调用 | **Phase 3 后处理不完整**：SSG 后处理只做了 island chunk map + rewrite，漏了安全头注入。构建管线缺少"后处理检查清单" |
| 嵌套 islands 路径 | 从 tagName 反推 modulePath | **构建 metadata 传递断裂**：`entry-descriptor.ts` 用 `tagName` 反推路径，但 `scanIslands()` 已经知道真实路径。上游信息在 descriptor 阶段丢失 |
| strategy 被丢弃 | buildClient 不传 strategy | **同上**：`scanPackageIslands()` 正确读取 strategy，但 buildClient 构造 `ClientIslandEntry` 时没传。信息在阶段间传递时丢失 |

**共同根源：构建元数据在 Phase 1→2→3 之间传递时，没有一个统一的 manifest 作为契约。**

这是 GPT-55 也指出的——"Compiler/Manifest 稳定化"应该是中期主轴。我完全同意，并且认为这比任何新功能都重要。

### 2.3 架构风险清单

除了已确认的 4 个 bug，我发现以下架构风险：

#### R1: `kiss-layout.ts` 的 DEFAULT_NAV 与 nav-data.ts 不同步

GPT-55 重构了 `docs/app/nav-data.ts`（7 个 section），但 `packages/kiss-ui/src/kiss-layout.ts` 的 `DEFAULT_NAV` 仍然是旧的 9-section 结构。当页面不传 `nav-items` 属性时，侧边栏会显示旧导航。

**影响**：文档站导航不一致。虽然大部分页面通过 `nav-data.ts` 驱动，但 fallback 路径展示的是过时信息。

**建议**：`DEFAULT_NAV` 应该从 `nav-data.ts` 导入，或者干脆去掉 fallback。

#### R2: `escapeHtml` 重复实现

`escapeHtml` 在三个地方有独立实现：
- `packages/kiss-core/src/render-dsd.ts`（line 28-35）
- `packages/kiss-core/src/ssr-handler.ts`（推测有另一个）
- `packages/kiss-adapter-lit/src/ssr.ts`

**风险**：如果某个实现修了但其他没修，会产生安全漏洞。HTML 转义是安全关键函数，不应该有三份拷贝。

**建议**：core 导出唯一一份 `escapeHtml`，其他包 import 它。

#### R3: SSG 后处理缺少可测试的输出契约

`build-ssg.ts` 的后处理阶段（line 319-334）做了几件事：
1. 注入 client script
2. 构建 island chunk map
3. rewrite HTML 文件
4. 打印 build manifest

但没有验证步骤。比如：如果 `injectClientScript` 因为路径问题静默失败，没有任何机制能发现。

**建议**：后处理完成后，应检查每个 HTML 文件是否包含 `<script type="module">` 和 island chunk 引用，并报告缺失。

#### R4: demo renderer 用 HTML 注释作占位符

这是已知问题，但值得再次强调：HTML 注释不是稳定的标记机制。如果用户在内容中写了类似的注释，会导致替换错误。

### 2.4 架构优势（不应该被稀释的）

1. **DSD Renderer 的纯度**——`render-dsd.ts` 是纯字符串操作，零依赖，零 DOM shim。这个纯度一旦被破坏（比如为了"方便"引入 DOM parser），就回不来了。
2. **Adapter Protocol 的抽象级别**——通过 `globalThis.__kissLit*` 钩子，Lit 从必选变可选。这个模式可以扩展到其他 UI 框架（Preact、Solid），前提是保持钩子接口稳定。
3. **构建产物的可审计性**——3-Phase Build 的每一阶段都有可检查的中间产物（`build-metadata.json`、`.kiss-client-entry.ts`、`dist/` HTML）。这比"黑盒 build"强得多。

---

## 三、文档重构评估

### GPT-55 做了什么

GPT-55 重构了 17 个源文件，主要变更：

1. **导航从 9 section 压缩到 7 section**：Start Here → Core Model → Production → Packages → Strategy → Examples → History
2. **新增 Framework Positioning 页面**：作为文档第一入口
3. **首页从宣传型改为框架模型型**：eyebrow + architecture signal card + What It Is/Is Not
4. **重写了所有 guide 页面**：routing、ssg、islands、api-routes、configuration 等
5. **Roadmap 改为 Trust Release 风格**：列出当前 4 个 hardening 项 + 5 个 release phase

### 我的评价

**好的部分：**

- **Positioning 页面的"文档承诺"段落**非常关键——"文档应该只承诺当前能验证的能力"。这比绝大多数框架文档诚实。
- **首页的 Signal Card**（Render/Client/Server/Output）比堆砌 feature list 清晰得多。
- **Roadmap 的 Trust Hardening 表格**直接指向 4 个已知 bug，没有回避问题。

**需要改进的部分：**

1. **kiss-layout.ts 的 DEFAULT_NAV 没有同步更新**——这是实际的 bug，会导致导航不一致。
2. **Islands 页面的代码示例有模板字符串嵌套问题**——`code-block` 内的 Lit 模板使用了 `html` 标签和反引号，会导致编译错误或转义问题（GPT-55 自己也注意到了这个）。
3. **文档用了中英混排**——首页 eyebrow 用英文，正文用中文。这不是问题本身，但如果定位是国际化框架，应该尽早决定文档语言策略。当前状态是"中文框架用英文架构术语"，对中文读者够了，但对外部贡献者有门槛。
4. **Strategy section 里的 `.kiss Compiler` 和 `PWA` 页面**——这些是未实现功能，放在导航里和已实现功能平级，会误导读者。应该标注 `(Planned)` 或移到 Roadmap 下方。

---

## 四、未来路线评估

### GPT-55 的路线建议

| 阶段 | 内容 | 我的评价 |
|---|---|---|
| 现在 | Trust Release：修 4 个 bug | ✅ 完全同意，这是最高优先级 |
| v0.6 | DSD Renderer 2 | ⚠️ 同意方向，但应该先定义"Renderer 2 的验收标准" |
| v0.7 | Island Upgrade Manifest | ✅ 这是架构根源修复，应该提前到 v0.6 |
| v0.8 | Serverless Fullstack | ⚠️ 太早。应该在 v0.7 manifest 稳定后再说 |
| v0.9 | SSG + ISR + PWA | ⚠️ ISR 的复杂度被低估了 |
| v0.10 | .kiss Compiler Alpha | ✅ 作为长期探索项合理 |

### 我的路线调整建议

**v0.5.x: Trust Release（现在→2周）**

修 4 个 bug + 补回归测试。具体：

| # | 修什么 | 怎么修 | 测试 |
|---|---|---|---|
| 1 | 根 middleware scope | `scope === '/' ? '/*' : scope + '/*'` | Hono 实例化测试 |
| 2 | SSG CSP 注入 | `build-ssg.ts` 后处理阶段调用 `injectCspMeta()` | 检查输出 HTML 含 CSP meta |
| 3 | 嵌套 islands 路径 | `entry-descriptor.ts` 传入原始 `islandFiles`，不用 tagName 反推 | 构建含子目录 islands 的项目 |
| 4 | Strategy 传递 | `buildClient` 传入 `strategy` 字段 | 检查 client entry 含 eager 声明 |

**v0.6: Build Manifest（2周→6周）**

这才是真正的架构升级。目标是让 Phase 1→2→3 之间有一个统一的 manifest 契约：

```
.kiss/manifest.json
{
  "routes": [...],
  "islands": [
    { "tagName": "my-counter", "filePath": "app/islands/my-counter.ts", "strategy": "lazy" },
    { "tagName": "posts-index", "filePath": "app/islands/posts/index.ts", "strategy": "eager", "isPackage": false }
  ],
  "middleware": [
    { "scope": "/", "filePath": "app/routes/_middleware.ts" }
  ],
  "apiRoutes": [...]
}
```

Phase 2 和 Phase 3 都读这个 manifest，不再各自扫描/反推。这同时解决了 bug 3 和 bug 4 的架构根源。

**v0.7: Renderer Hardening（6周→10周）**

- safe/unsafe HTML 边界
- 嵌套 DSD 支持
- slot/projection 行为验证
- render 错误指向 route/tag/source
- escapeHtml 统一到一份实现

**v0.8+: 按需扩展**

不急。v0.7 之后根据用户反馈决定是走 serverless fullstack 还是 SSG 质量标准。

### 不应该做的事

1. **不要做 SPA client router**——KISS 的灵魂是 SSG + island upgrade。如果用户需要 SPA，让他们用 Remix/Next。
2. **不要做全量状态管理**——island 级状态够了。全局 store 会破坏"岛屿升级"模型。
3. **不要急着消除 Lit**——.kiss compiler 是优化路径，不是框架成立的条件。Lit 在 Web Components 生态里仍然是最成熟的选择。
4. **不要做"万能组件框架"**——KISS 的价值在于把平台能力整理成管线，不是包一层新抽象。

---

## 五、总体判断

### KISS 最有价值的不是功能，是气质

这个框架有一种少见的气质：它不是把"平台不好用"当作前提然后包一层，而是认真地把浏览器已有的能力整理成一条可生产的路径。DSD 不是 hack，island 不是 workaround，Hono 不是重新发明——它们各自是正确层次的正确选择。

### 当前最大风险是 Trust Gap

4 个 P1/P2 bug 的共同信号是：**KISS 的文档承诺和构建产物之间有 gap**。文档说 middleware 按路由树挂载，但根级 middleware 只覆盖 `/`；文档说 CSP 可配置，但 SSG 产物没有 CSP；文档说 strategy 支持 eager/lazy，但构建时被丢掉了。

这个 gap 在功能少的时候可以手动覆盖，但随着功能增加，每一个未验证的承诺都会变成用户踩的坑。**Trust Release 的目标就是把 gap 关闭，而不是把功能铺开。**

### GPT-55 的定位分析和文档重构方向是对的

定位分析准确，文档重构的信息架构改进（Positioning 作为第一入口、Core Model 分离 Production、Roadmap 标明 hardening 项）都是正确的。但执行层面有几个需要修的问题（DEFAULT_NAV 不同步、代码示例转义、未实现功能与已实现功能平级）。

### 下一步

1. 修 4 个 bug + 补测试（Trust Release）
2. 同步 `kiss-layout.ts` 的 DEFAULT_NAV
3. 统一 escapeHtml 实现
4. 开始 Build Manifest 设计（v0.6 的核心）
5. 文档里未实现功能标注 `(Planned)`

---

> KISS 不需要更多功能。它需要已经承诺的功能真的工作。
