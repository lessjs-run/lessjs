# LessJS v0.27.0 安全工程师专项审计报告

**审计人**：安全工程师  
**审计日期**：2026-06-01  
**审计范围**：代码安全 + 依赖安全 + 运行时安全  
**仓库路径**：`C:\Users\Administrator\WorkBuddy\Claw\lessjs-main`

---

## 一、安全漏洞清单

### SEC-01 [P1] innerHTML 属性直接赋值未做运行时消毒

**问题位置**：
- `packages/core/src/jsx-render-dom.ts:174-175`
- `packages/core/src/jsx-render-string.ts:247-249`（SSR 路径）
- `packages/core/src/jsx-render-string.ts:411-420`（renderDsdTree 路径）
- `packages/core/src/dsd-element.ts:372`（data-signal-html 路径）
- `packages/core/src/dsd-element.ts:607`（string render 路径）
- `packages/adapter-vanilla/src/dsd-hydration.ts:136`

**现象**：`innerHTML` 属性值被直接 `String(value)` 后赋给 DOM 的 `innerHTML` 或作为原始 HTML 输出。SSR 路径中 `innerHTML` 未经过 `escapeHtml()` 处理（`jsx-render-string.ts:247-249` 直接 `String(unwrapSignalLike(props.innerHTML))`），CSR 路径中 `jsx-render-dom.ts:175` 直接 `(el as HTMLElement).innerHTML = String(value)`。

**影响**：如果开发者通过 `innerHTML` 传入用户可控内容（如评论区、动态 Markdown 渲染结果等），可导致 XSS。虽然注释标注"build-time sanitized, ADR-0064"，但运行时并无消毒保障，属于设计信任边界模糊。

**整改建议**：
1. 为 `innerHTML` 增加 Branded Type 约束（类似现有的 `SafeHtml`/`UnsafeHtml`），要求传入值必须经过显式标记（如 `unsafeHTML()` 包装函数），从类型系统层面区分安全/不安全 HTML。
2. 考虑增加可选的运行时消毒（通过 `sanitize-html` 或 `DOMPurify`），在开发模式下对 `innerHTML` 赋值发出警告。
3. 在文档中明确标注 `innerHTML` 的安全合约：调用者必须确保传入内容已消毒。

---

### SEC-02 [P1] data-signal-html 信号值直接写入 innerHTML

**问题位置**：`packages/core/src/dsd-element.ts:362-378`

**现象**：
```typescript
const applyHtml = () => {
  (el as HTMLElement).innerHTML = String(sig.value);
  this._bindEvents(el);
};
```
信号值变化时直接 `innerHTML = String(sig.value)`，无任何消毒。

**影响**：如果信号值来自用户输入或外部 API 响应，每次信号更新都会重新执行 `innerHTML` 赋值，是持续的 XSS 攻击面。

**整改建议**：
1. 对 `data-signal-html` 绑定的信号值增加消毒选项（如 `data-signal-html-safe` 要求信号值已消毒）。
2. 至少在文档中明确标注 `data-signal-html` 仅应用于已信任的 HTML 内容。
3. 考虑新增 `data-signal-text` 属性，使用 `textContent` 而非 `innerHTML` 渲染信号值，作为安全默认。

---

### SEC-03 [P2] headExtras 正则剥离 `<script>` 可被绕过

**问题位置**：`packages/core/src/html-escape.ts:104-106`

**现象**：
```typescript
safeHeadExtras = headExtras.replace(/<script[\s>][\s\S]*?<\/script\s*>/gi, '');
```
正则 `[\s\S]*?` 使用非贪婪匹配，无法处理嵌套 `<script>` 场景；且仅剥离一次，不处理编码绕过（如 `<scr ipt>`、`<script/xss>` 等）。

**影响**：攻击者可能构造特殊格式的 `<script>` 标签绕过剥离。但实际风险有限，因为 `headExtras` 通常由开发者控制。

**整改建议**：
1. 使用 DOM Parser（如 happy-dom，项目已有依赖）解析 HTML 后提取安全节点，替代正则方案。
2. 对 `on*` 事件处理器的正则剥离同样存在绕过可能，应一并使用 DOM 解析方案。

---

### SEC-04 [P2] Shadow DOM 使用 `mode: 'open'` — 无法防止外部 JS 访问

**问题位置**：
- `packages/core/src/dsd-element.ts:212`
- `packages/adapter-vanilla/src/dsd-hydration.ts:110`

**现象**：所有 Shadow DOM 均使用 `mode: 'open'`，外部 JS 可通过 `element.shadowRoot` 访问内部 DOM。

**影响**：第三方脚本或浏览器扩展可读写组件内部 DOM，破坏封装性。这是 Web Components 的常见设计取舍（open 模式有利于 DevTools 调试、SSR DSD 兼容），但意味着 Shadow DOM 不提供真正的安全隔离。

**整改建议**：
1. 在文档中明确说明 `mode: 'open'` 的封装语义：提供样式隔离但不提供 DOM 访问隔离。
2. 对高安全场景，考虑支持 `mode: 'closed'` 选项（需注意 DSD 兼容性）。
3. 确保 `data-signal-html` 等直接操作 `innerHTML` 的路径不被外部脚本利用来注入内容。

---

### SEC-05 [P2] DevTools 面板使用 innerHTML 注入用户拼接的 HTML

**问题位置**：`packages/adapter-vite/src/devtools/index.ts:199`

**现象**：DevTools 的 `_scan()` 方法将组件标签名直接拼接到 HTML 字符串中，再通过 `content.innerHTML = html` 插入。

```javascript
html += `<li><span class="ljt-tag">&lt;${ce.tag}&gt;</span> ${status}</li>`;
content.innerHTML = html;
```

**影响**：如果自定义元素标签名被恶意构造（虽然 WHATWG 规范限制了标签名字符），理论上可注入 HTML。但 DevTools 仅在开发模式运行，生产环境不加载，实际风险极低。

**整改建议**：
1. 对 `ce.tag` 使用 `textContent` 或 `escapeHtml()` 处理。
2. 使用 DOM API（`document.createElement`）替代 `innerHTML` 拼接。

---

## 二、XSS/注入风险点及转义逻辑整改建议

### 已有的安全措施（正面评价）

1. **`escapeHtml()` 函数**（`packages/core/src/html-escape.ts:38-41`）：使用单次正则替换，覆盖 `& < > " '` 五个字符，实现完整。被 `renderToString` 和 `renderDsdTree` 中所有文本节点和属性值正确使用。

2. **`escapeAttr()` 函数**（`packages/core/src/html-escape.ts:44-51`）：属性值转义完整，被 `serializeAttrs` 和 `head-injection.ts` 正确使用。

3. **Markdown 内容消毒**（`packages/content/src/blog/markdown.ts`）：使用 `sanitize-html` 白名单方案，配置合理，禁止 `<script>`、`<iframe>`、事件处理器和 `javascript:` URL。测试覆盖完善（7 个 XSS 回归测试）。

4. **SSR Props 原型链污染防护**（`packages/core/src/security.ts`）：`DANGEROUS_KEYS` 集合覆盖 `__proto__`、`constructor`、`prototype` 等 12 个危险键，在 `bindEvents()` 和 `injectProps()` 中使用。

5. **URL 安全校验**（`packages/adapter-vite/src/head-injection.ts`）：`validateSafeUrl()` 阻止 `javascript:`、`data:`、`vbscript:`、`file:` 协议，处理了 percent-encoding 绕过。

6. **CSP nonce 支持**（`packages/core/src/html-escape.ts:92-98`）：`wrapInDocument()` 支持 CSP nonce，格式校验完整。

7. **headExtras 安全处理**：`assertNoScriptTags()` 阻止在 headFragments 中注入 `<script>` 标签；`buildHeadExtras()` 强制脚本通过 `inject.scripts` 结构化 API 注入。

### 需要改进的转义逻辑

| 风险点 | 位置 | 当前状态 | 建议 |
|--------|------|----------|------|
| `innerHTML` prop | jsx-render-dom.ts:174 | 无运行时消毒 | 增加类型级约束 |
| `innerHTML` SSR | jsx-render-string.ts:247 | 原始 HTML 输出 | 增加 ADR 文档化安全合约 |
| `data-signal-html` | dsd-element.ts:372 | 无消毒 | 增加安全变体 |
| DevTools innerHTML | devtools/index.ts:199 | 拼接后 innerHTML | 改用 DOM API |
| headExtras 脚本剥离 | html-escape.ts:104 | 正则方案 | 改用 DOM 解析 |
| Hub snapshot 消毒 | snapshot-playwright.ts:468 | 正则方案 | 已用于构建时，风险低 |

---

## 三、Deno 权限优化与最小权限落地方案

### 当前状态

**已改进的部分**（正面评价）：
- `deno.json` 中主要开发/构建任务已使用最小权限集：
  - `dev`：`--allow-read --allow-write --allow-net --allow-env --allow-ffi --allow-sys`
  - `build`：同上 + `--allow-run`
  - `test`：`--allow-read --allow-write --allow-env --allow-net --allow-run`
  - 代码注释明确标注"H-18 fix: Use least-privilege permissions instead of -A"

**仍使用 `-A`（全权限）的任务**：

| 任务 | 位置 | 用途 | 风险等级 |
|------|------|------|----------|
| `hub:scan` | deno.json:110 | Hub 组件扫描（需 Playwright） | P2 |
| `hub:validate` | deno.json:111 | Hub 验证 | P2 |
| `test:e2e` | deno.json:139 | E2E 测试（需 Playwright） | P2 |
| `test:e2e:install` | deno.json:140 | 安装 Playwright Chromium | P2 |
| `packages/create/deno.json` 的 `run` 任务 | - | 创建项目脚手架 | P1 |

### 整改建议

1. **`hub:scan`**：Playwright 需要 `-A` 运行是已知的 Deno 限制。建议在注释中标注原因，并在 CI 中将其限制为仅在有 Hub 变更时触发。

2. **`hub:validate`**：审查其代码确认是否真正需要 `-A`。如果只是读取文件和验证 JSON，可降级为 `--allow-read --allow-write`。

3. **`@openelement/create` 的 `run` 任务**：脚手架工具使用 `-A` 是因为需要创建目录和文件。建议降级为 `--allow-read --allow-write --allow-net`（网络权限用于获取 JSR 版本）。

4. **CI 中的 `-A` 使用**：
   - `.github/workflows/test.yml:211`：`deno run -A npm:playwright@1.59.1 install chromium --with-deps` — Playwright 安装确实需要完整权限，可接受。
   - `.github/workflows/sop-gate.yml:153`：同上。
   - `.github/workflows/publish-jsr.yml:111`：`deno run -A "jsr:@openelement/create@${CREATE_VERSION}" test-blog` — 发布后 smoke test 使用第三方包 + `-A`，存在供应链攻击风险。建议在隔离环境中运行。

5. **消费者项目模板**（`packages/create/cli.ts:133-138`）：模板中所有任务使用 `-A`，这是 Deno 生态的常见做法但不符合最小权限。建议在文档中引导消费者按需收窄权限。

---

## 四、依赖漏洞与不安全依赖清单

### 依赖版本审查（基于 deno.lock）

| 依赖 | 当前版本 | 最新稳定版 | 状态 |
|------|----------|-----------|------|
| hono | 4.12.22 | 4.x | 正常 |
| alien-signals | 3.2.1 | 3.x | 正常 |
| vite | 8.0.10 | 8.x | 正常 |
| sanitize-html | 2.17.4 | 2.x | 正常 |
| marked | 15.0.4 | 15.x | 正常 |
| gray-matter | 4.0.3 | 4.x | 正常 |
| happy-dom | 20.9.0 | 20.x | 正常 |
| lit | 3.3.3 | 3.x | 正常 |
| react/react-dom | 19.2.6 | 19.x | 正常 |
| ws | 8.20.1 | 8.x | 正常 |
| entities | 4.5.0 | 4.x | 正常 |
| typescript | 5.9.3 | 5.x | 正常 |
| @shoelace-style/shoelace | 2.20.1 | 2.x | 正常 |
| esbuild | 0.25.12 | 0.25.x | 正常 |
| flexsearch | 0.8.212 | 0.8.x | 注意：该包已长期未维护 |

### 依赖安全建议

1. **flexsearch@0.8.212**：该 npm 包已超过 2 年未更新，且 npm 上的 `flexsearch` 包与 GitHub 上的 `flexsearch` 不同（已被社区标记为可能非官方发布）。建议：
   - 迁移到 `flexsearch` 的官方 JSR 版本或 `orama` 等替代方案
   - 如果仅在构建时使用，风险可控

2. **deno.lock 完整性**：项目使用 `deno.lock`（version 5）锁定所有依赖哈希，确保依赖完整性。CI 中通过 `deno audit` 检查已知漏洞。

3. **CI 依赖审计**：`test.yml` 和 `sop-gate.yml` 均包含 `deno audit` 步骤，这是积极的实践。

4. **vendor 模式**：`deno.json` 中 `"vendor": true` 启用依赖本地缓存，减少供应链攻击面。

---

## 五、发布/CI 流程安全加固建议

### 已有的安全措施（正面评价）

1. **CodeQL 静态分析**（`.github/workflows/codeql.yml`）：每周定期扫描 + PR 触发，使用 `security-extended,security-and-quality` 查询集。

2. **发布前测试门控**：`publish-jsr.yml` 在发布前运行完整测试套件（`uses: ./.github/workflows/test.yml`）。

3. **脏工作树检测**：发布脚本检查 `git status --porcelain`，拒绝在脏工作树上发布。

4. **最小 CI 权限**：`publish-jsr.yml` 使用 `permissions: contents: read, id-token: write`，遵循最小权限原则。

5. **JSR 发布幂等性**：`publish_if_missing()` 检查版本是否已存在，避免重复发布。

6. **消费者 Smoke Test**：发布后自动创建消费者项目并构建验证（SOP-013）。

### 需要改进的安全问题

#### SEC-06 [P1] `DENO_DEPLOY_TOKEN` 在 CI 日志中可能泄露

**问题位置**：`.github/workflows/deploy-api.yml:26`

```yaml
deno deploy \
  --app=less-demo-api \
  --prod \
  --token="${{ secrets.DENO_DEPLOY_TOKEN }}" \
  .
```

**现象**：虽然使用了 `secrets.` 语法（GitHub Actions 会遮蔽日志中的值），但 `--token=` 直接传入命令行参数，在进程列表中可见。

**整改建议**：
1. 使用 `DENO_DEPLOY_TOKEN` 环境变量替代命令行参数：
   ```yaml
   env:
     DENO_DEPLOY_TOKEN: ${{ secrets.DENO_DEPLOY_TOKEN }}
   run: deno deploy --app=less-demo-api --prod .
   ```
2. 确认 `deno deploy` CLI 支持环境变量方式传入 token。

#### SEC-07 [P2] 发布工作流缺少分支保护

**问题位置**：`.github/workflows/publish-jsr.yml:5-6`

```yaml
on:
  push:
    branches: [main]
```

**现象**：任何推送到 `main` 分支的提交（只要触及 `packages/*/deno.json` 等路径）都会触发自动发布。如果 `main` 分支没有保护规则（需要 PR 审核等），恶意贡献者可直接推送触发发布。

**整改建议**：
1. 确保 `main` 分支启用 GitHub 分支保护（需要 PR 审核、状态检查通过等）。
2. 考虑将自动发布改为 `workflow_dispatch` 手动触发，仅在审核后执行。
3. 增加发布签名人机制（发布需至少一名 maintainer 确认）。

#### SEC-08 [P2] `publish-manual.yml` 的 `packages` 输入未严格校验

**问题位置**：`.github/workflows/publish-manual.yml:6-9`

**现象**：`github.event.inputs.packages` 直接用于字符串匹配，虽然 `wants()` 函数使用逗号分隔匹配，但输入值被嵌入到 shell 脚本的字符串比较中。当前实现是安全的（使用 `[[ "$requested" == *",$1,"* ]]` 模式匹配），但建议增加输入校验。

**整改建议**：在 shell 脚本开始前验证 `packages` 输入仅包含允许的包名和逗号：
```bash
if ! [[ "${{ github.event.inputs.packages }}" =~ ^[a-z,-]+$ ]]; then
  echo "::error::Invalid packages input"
  exit 1
fi
```

#### SEC-09 [P2] CI 中 Playwright 安装使用 `-A` 且下载外部二进制

**问题位置**：`.github/workflows/test.yml:284`、`.github/workflows/sop-gate.yml:153`

**现象**：`deno run -A npm:playwright@1.59.1 install chromium --with-deps` 使用全权限运行 Playwright 安装器，该安装器会下载 Chromium 二进制文件并安装系统依赖包。

**影响**：Playwright 安装器具有 `-A` 权限，可执行任意系统命令。虽然 Playwright 是知名项目，但供应链攻击风险不可忽视。

**整改建议**：
1. 使用 `npx playwright install chromium` 替代 `deno run -A`（限制权限范围）。
2. 缓存 Playwright 浏览器二进制文件，避免每次 CI 运行都重新下载。

---

## 六、运行时安全评估

### Shadow DOM 隔离评估

| 隔离维度 | 状态 | 说明 |
|----------|------|------|
| 样式隔离 | 有效 | Shadow DOM 正确隔离组件样式，`adoptedStyleSheets` 使用规范 |
| DOM 封装 | 部分 | `mode: 'open'` 允许外部 JS 通过 `.shadowRoot` 访问 |
| 事件隔离 | 有效 | Shadow DOM 事件重定向机制正常，DSD hydration 正确绑定事件 |
| 插槽内容 | 安全 | `<slot>` 机制正确分发 light DOM，不影响 shadow DOM 内部 |

### 组件状态泄露评估

1. **`data-ssr-props` 属性**：SSR Props 通过 HTML 属性传递，JSON 序列化后在客户端解析。`DANGEROUS_KEYS` 集合防止原型链污染。但 `data-ssr-props` 中的敏感数据（如 API 密钥）会暴露在 HTML 源码中。

2. **`params` 属性**：路由参数通过 HTML 属性传递（`dsd-element.ts:274-279`），JSON.parse 失败时静默忽略（安全但可能隐藏问题）。

3. **Signal 注册表**：`signalRegistry` 是私有 Map，外部无法直接访问，封装良好。

---

## 七、总结与优先级建议

### 高优先级（P1）- 建议在下一版本修复

| 编号 | 问题 | 建议措施 |
|------|------|----------|
| SEC-01 | `innerHTML` 属性无运行时安全约束 | 引入 Branded Type + 显式标记函数 |
| SEC-02 | `data-signal-html` 信号值直接写入 innerHTML | 增加安全变体或文档警告 |
| SEC-06 | `DENO_DEPLOY_TOKEN` 命令行传参 | 改用环境变量 |

### 中优先级（P2）- 建议在下两个版本内修复

| 编号 | 问题 | 建议措施 |
|------|------|----------|
| SEC-03 | headExtras 正则剥离可被绕过 | 改用 DOM 解析方案 |
| SEC-04 | Shadow DOM `mode: 'open'` 无 DOM 隔离 | 文档明确 + 可选 closed 模式 |
| SEC-05 | DevTools innerHTML 拼接 | 改用 DOM API |
| SEC-07 | 发布工作流缺少分支保护 | 启用分支保护规则 |
| SEC-08 | 手动发布输入未严格校验 | 增加输入格式验证 |
| SEC-09 | CI 中 Playwright 安装使用 `-A` | 缓存 + 替代安装方式 |

### 优化建议

1. **安全文档化**：将 `innerHTML` 的安全合约、Deno 权限最小化指南写入 ADR 或安全策略文档。
2. **安全测试扩展**：在现有 XSS 回归测试基础上，增加以下测试：
   - `innerHTML` prop 传入恶意 HTML 的防御测试
   - `data-signal-html` 信号值注入测试
   - headExtras 绕过测试（编码变形、嵌套标签等）
3. **自动化安全检查**：在 CI 中增加 `deno lint` 对 `innerHTML`、`eval`、`document.write` 的使用警告。
4. **flexsearch 替换**：评估迁移到维护更活跃的搜索方案。
