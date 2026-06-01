# LessJS v0.27.0 工程化/DevOps 专项审计报告

**审计人**：devops-engineer
**审计日期**：2026-06-01
**审计范围**：Monorepo 工程配置、构建流程、CI/CD、依赖管理、发布流程、工程规范

---

## 一、总体评价

LessJS v0.27.0 的工程体系整体**成熟度较高**，体现了从 v0.18 一路迭代到 v0.27 的工程积累。CI 门禁体系完备（SOP Gate 12 项检查），Deno Workspace + JSR 发布链路清晰，工具链脚本（`tools/`）质量上乘。但在 CI 效率、依赖版本策略、部分工程规范细节上存在可改进空间。

**评分**：7.5/10

---

## 二、问题清单

### 2.1 工程配置问题

#### P1-ENG-01：根 `deno.json` 的 `imports` 膨胀，维护成本高

- **位置**：`deno.json:25-97`
- **现象**：根 deno.json 的 `imports` 映射包含 47 条 `@lessjs/*` 条目，涵盖所有子包的主入口和子路径导出。此外还有 25 条 npm 依赖。每当子包新增导出路径，都需要手动同步更新根 imports。
- **影响**：
  - 维护负担大，新增子路径导出容易遗漏根映射
  - `@lessjs/ui/*` 有 10 个组件逐一列出（L49-L58），注释说明是 Vite alias prefix-matching 的限制，但这种脆弱性应被工具化
- **整改建议**：
  1. 编写自动化脚本验证根 imports 与子包 exports 的一致性（类似 `check-import-map.ts` 但针对 workspace 内部映射）
  2. 长期跟踪 Deno/Vite 对 subpath exports 的支持改进，减少手动枚举

#### P1-ENG-02：`hub:scan` 和 `hub:validate` 使用 `-A`（全权限）

- **位置**：`deno.json:110-111`
- **现象**：
  ```json
  "hub:scan": "deno run -A packages/hub/scan.ts",
  "hub:validate": "deno run -A packages/hub/src/cli/validate.ts",
  ```
  其他任务（`dev`、`build`、`test`）已改为最小权限（H-18 fix 注释），但 hub 相关脚本仍使用 `-A`。
- **影响**：不遵循项目自身的最小权限原则，存在供应链风险。Hub CI 的 `hub-ci.yml:37` 也使用 `deno run -A`。
- **整改建议**：对 `hub:scan` 和 `hub:validate` 进行权限审计，替换为具体 `--allow-*` 标志。

#### P2-ENG-03：子包 `build` task 定义不一致

- **位置**：各子包 `deno.json` 的 `tasks.build`
- **现象**：
  - `adapter-lit`：`deno check src/index.ts src/ssr.ts src/dsd-hydration.ts`（类型检查代替构建）
  - `core`：`deno check src/index.ts src/render-dsd.ts`（`render-dsd.ts` 已不在 exports 中，疑似过时路径）
  - `hub`：`deno check mod.ts src/schema.ts src/builder.ts src/indexer.ts src/submitter.ts src/snapshot.ts`
  - 其他包：无 `build` task 或类似 `deno check`
  - 大部分子包的 `build` task 实质是 `deno check`（类型检查），并非真正的构建步骤
- **影响**：由于 Deno + JSR 是源码发布，不需要传统的编译/打包步骤，但 `build` 这个命名有误导性，且 `core` 的 `build` 引用了不存在的 `render-dsd.ts`
- **整改建议**：
  1. 将子包的 `build` task 重命名为 `typecheck` 或 `check`，避免误导
  2. 修复 `core` 的 `build` task 中 `src/render-dsd.ts` 的路径（应改为 `src/render-dsd-stream.ts` 或删除）

#### P2-ENG-04：`tsconfig.json` 与 `deno.json` 的 `compilerOptions` 部分重复

- **位置**：`tsconfig.json`、`deno.json:177-185`
- **现象**：
  - `tsconfig.json` 定义了 `jsx: "react-jsx"`, `jsxImportSource: "@lessjs/core"`, `skipLibCheck: true` 等
  - `deno.json` 的 `compilerOptions` 也定义了相同的 `jsx`, `jsxImportSource`, `skipLibCheck`
  - 部分子包（如 `adapter-react`）又覆盖了 `jsxImportSource: "react"`
- **影响**：配置分散在三个层级（tsconfig.json / 根 deno.json / 子包 deno.json），维护者需理解优先级关系，容易出错
- **整改建议**：明确 tsconfig.json 的用途（是否仅用于 IDE？），考虑将其合并到根 deno.json 或移除冗余项，并添加注释说明配置优先级

#### P2-ENG-05：`.gitignore` 存在重复条目

- **位置**：`.gitignore:59-60`
- **现象**：
  ```
  /node_modules
  node_modules
  ```
  L2 已有 `node_modules/`，L59 和 L60 再次声明 `/node_modules` 和 `node_modules`
- **影响**：不影响功能，但反映维护疏忽
- **整改建议**：移除 L59-60 的重复条目

#### P2-ENG-06：`.gitignore` 包含 `.workbuddy/` 两次

- **位置**：`.gitignore:44-45`
- **现象**：
  ```
  .workbuddy/
  .workbuddy/
  ```
- **影响**：冗余
- **整改建议**：去重

---

### 2.2 CI/CD 流水线问题

#### P1-CI-01：`test.yml` 中 `deno install` 重复执行，缓存键不完整

- **位置**：`.github/workflows/test.yml` 全文
- **现象**：
  - test.yml 有 14 个独立 job，每个 job 都独立执行 `deno install --node-modules-dir`
  - 缓存键为 `${{ runner.os }}-deno-${{ hashFiles('deno.lock') }}`，仅缓存 `node_modules` 目录
  - 未缓存 Deno 全局缓存（`~/.cache/deno` 或 `DENO_DIR`），Deno 下载的 JSR/npm 包在每次 job 都重新解析
- **影响**：
  - 14 个 job 串行/并行均需重复安装，即使命中 GitHub Actions cache，仍需 `deno install` 步骤运行
  - 缺少 Deno 缓存意味着 npm tarball 解压等操作重复执行
  - 整体 CI 执行时间较长
- **整改建议**：
  1. 将 `~/.cache/deno` 加入缓存路径，或使用 `denoland/setup-deno` 自带的缓存功能
  2. 考虑使用 `deno cache` 预热步骤，避免每个 job 重复解析依赖

#### P1-CI-02：`test.yml` 中 14 个 job 无依赖关系，无统一门禁

- **位置**：`.github/workflows/test.yml`
- **现象**：
  - 14 个 job 全部独立运行，无 `needs` 依赖
  - 缺少一个汇总 job（类似 sop-gate.yml 的 `gate-summary`）
  - PR 合并者需逐一检查 14 个 job 的状态，容易遗漏失败
- **影响**：门禁不严，可能合入失败 PR
- **整改建议**：添加 `test-summary` job，`needs` 所有测试 job，使用 `if: always()` 汇总结果

#### P1-CI-03：`test.yml` 与 `sop-gate.yml` 功能大量重叠

- **位置**：`.github/workflows/test.yml`、`.github/workflows/sop-gate.yml`
- **现象**：
  - `test.yml` 包含 typecheck、audit、test-*、build-www 等 job
  - `sop-gate.yml` 也包含 typecheck、audit、test、build、lint、fmt:check 等 job
  - `publish-jsr.yml` 通过 `workflow_call` 引用 `test.yml`
  - `lint.yml` 又独立运行 fmt:check 和 lint
  - 同一个 PR 会触发 `test.yml` + `sop-gate.yml` + `lint.yml` 三条流水线，大量重复执行
- **影响**：
  - CI 资源浪费严重，单个 PR 可能触发 3x 重复的 typecheck/lint/test
  - 维护成本高，修改检查逻辑需同步多处
- **整改建议**：
  1. 将 `test.yml` 设计为可复用的 workflow（已有 `workflow_call`，但 job 可拆分为更细粒度的 reusable workflow）
  2. `sop-gate.yml` 应通过 `uses: ./.github/workflows/test.yml` 复用测试 job，避免重复定义
  3. 将 `lint.yml` 合并到 `test.yml` 或 `sop-gate.yml`，消除独立 lint 流水线

#### P1-CI-04：`publish-jsr.yml` 发布 20 个包无并行控制

- **位置**：`.github/workflows/publish-jsr.yml:39-83`
- **现象**：单个 shell step 内串行发布 20 个包，每包先 `deno info` 检查再 `deno publish`
- **影响**：
  - 发布耗时长（20 个包串行 × 2-5s/包 ≈ 40-100s）
  - 中间失败不会回滚已发布版本
  - 不支持选择性重发
- **整改建议**：
  1. 当前 `publish_if_missing` 跳过已发布版本的设计已规避了重发问题，这是好的
  2. 考虑用 GitHub Actions matrix strategy 并行发布无依赖包（leaf packages），缩短总时间
  3. 添加发布失败的 alert 通知

#### P2-CI-05：`deploy-api.yml` 使用明文 secret 引用但无环境保护

- **位置**：`.github/workflows/deploy-api.yml:27`
- **现象**：`${{ secrets.DENO_DEPLOY_TOKEN }}` 直接在 `run` 块中使用，且 job 无 `environment` 保护
- **影响**：任何推送到 main 且修改 `demo/` 的 commit 会自动部署，无人工审批
- **整改建议**：添加 `environment: production` 以启用 GitHub Environments 的审批流程

#### P2-CI-06：`hub-ci.yml` 的 auto-merge 逻辑在 CI 中执行

- **位置**：`.github/workflows/hub-ci.yml:42-66`
- **现象**：CI 中根据兼容性 tier 自动 squash merge PR，跳过人工审查
- **影响**：
  - `ssr-capable` 和 `client-only` 的 hub 提交会被自动合并，虽然有兼容性校验，但自动合并本身存在风险
  - `dependabot[bot]` 被排除，但未排除其他 bot 账户
- **整改建议**：
  1. 至少添加 `environment: hub-auto-merge` 以保留审批选项
  2. 考虑将 auto-merge 限制为仅 repo maintainer 提交的 PR

#### P2-CI-07：`codeql.yml` 触发条件过于宽松

- **位置**：`.github/workflows/codeql.yml:12-15`
- **现象**：CodeQL 在所有 PR 上运行，而 CodeQL 分析通常耗时较长且结果更新缓慢
- **影响**：增加 CI 负载，但安全分析在 PR 级别收益有限
- **整改建议**：将 PR 触发改为 `paths` 过滤，仅对 `packages/core/`、`packages/adapter-vite/` 等核心包的变更触发

#### P2-CI-08：缺少 `deno.lock` 一致性检查

- **位置**：CI 流水线（全局）
- **现象**：CI 中没有 `deno install --check` 或 `deno lock --check` 步骤验证 deno.lock 与 deno.json 的一致性
- **影响**：如果开发者修改 deno.json 但忘记更新 deno.lock，CI 可能安装了错误版本的依赖
- **整改建议**：在 SOP Gate 中添加 `deno install --check` 步骤，确保 lock 文件与配置一致

---

### 2.3 依赖管理问题

#### P1-DEP-01：根 `deno.json` 混入了仅 www 使用的依赖

- **位置**：`deno.json:74-97`
- **现象**：根 deno.json 的 `imports` 中包含以下仅用于 www 站点或特定 adapter 的依赖：
  - `@playwright/test`（仅 e2e 测试使用）
  - `@shoelace-style/shoelace`（仅 www 站点使用）
  - `media-chrome`（仅 www 站点使用）
  - `flexsearch`（仅 www 站点搜索使用）
  - `happy-dom`（仅测试使用）
  - `react` / `react-dom` / `@types/react` / `@types/react-dom`（仅 adapter-react 使用）
  - `ws`（仅开发时使用）
  - `lit` / `lit-element` / `lit-html` / `@lit/reactive-element` / `@lit-labs/ssr-dom-shim`（仅 adapter-lit 和 www 使用）
- **影响**：
  - 所有子包的工作空间都能隐式访问这些依赖，破坏了包边界的清晰性
  - JSR 发布时 `deno publish` 可能因多余依赖产生警告
  - 不符合 Deno workspace 的最佳实践（依赖应声明在最小粒度的 deno.json 中）
- **整改建议**：
  1. 将 www 专用依赖移到 `www/deno.json`
  2. 将 adapter-react 专用依赖移到 `packages/adapter-react/deno.json`
  3. 将 lit 系列依赖移到 `packages/adapter-lit/deno.json`
  4. 将 `@playwright/test` 移到 `www/deno.json` 或 e2e 配置中

#### P1-DEP-02：子包间 `hono` 版本声明不一致

- **位置**：根 `deno.json:80`、`packages/adapter-vite/deno.json`
- **现象**：
  - 根 deno.json：`"hono": "npm:hono@^4.12.18"`（最小版本约束）
  - `packages/adapter-vite/deno.json`：`"hono": "npm:hono@^4"`（宽松版本约束）
  - `tools/consumer-local.ts:93`：`"hono": "npm:hono@^4"`（与子包一致）
- **影响**：adapter-vite 的 hono 依赖范围更宽松（`^4`），可能解析到与根不同的版本。虽然 lock 文件锁定了解析结果，但语义不一致可能导致发布后消费者安装到不同版本
- **整改建议**：统一 hono 版本约束为 `^4.12.18` 或 `^4`，建议子包与根保持一致

#### P1-DEP-03：`deno.lock` 中存在重复依赖条目

- **位置**：`deno.lock`
- **现象**：lock 文件中存在以下重复解析的包：
  - `entities`：2 个条目（根 `entities@^4` 和 `entities@^4/`）
  - `fsevents`：2 个条目（不同平台的可选依赖）
  - `playwright-core`：2 个条目（`playwright@1.57.0` 和 `@playwright/test@1.59.1` 引入不同版本）
  - `playwright`：2 个条目（同上原因）
- **影响**：
  - `playwright-core` 和 `playwright` 的重复是因为根 deno.json 锁定了 `@playwright/test@1.59.1` 但 lock 文件中还存在 `playwright@1.57.0` 的条目，说明存在版本漂移
  - `entities` 的重复是因为根 imports 中同时声明了 `"entities"` 和 `"entities/"` (trailing-slash)，这是 Deno 对子路径导出的特殊处理
- **整改建议**：
  1. 清理 lock 文件中 `playwright@1.57.0` 相关条目，确保 `@playwright/test` 和 `playwright` CLI 版本一致
  2. `entities` 的双重声明是 Deno 设计如此，可接受但应添加注释说明

#### P2-DEP-04：`router` 包硬编码了 `marked` 的精确版本

- **位置**：`packages/router/deno.json`
- **现象**：`"marked": "npm:marked@15.0.4"` — 精确版本锁定
- **影响**：与其他包使用 `^` 范围约束不一致。根 deno.json 中 `marked` 为 `^15`（通过 lock 解析到 15.0.4），router 包却硬编码了精确版本
- **整改建议**：统一为 `"npm:marked@^15"` 或 `"npm:marked@15"` 以保持一致性

#### P2-DEP-05：`vite@8.0.10` 精确版本锁定，但版本已落后

- **位置**：根 `deno.json:83`、多个子包
- **现象**：所有引用 vite 的配置均使用 `npm:vite@8.0.10` 精确锁定。当前 Vite 最新版可能更高
- **影响**：
  - 精确锁定可能是为了保证构建可复现性，但这也意味着安全更新不会自动获取
  - 如果 Vite 8.0.10 有安全漏洞，需手动升级
- **整改建议**：保持精确锁定策略但定期（如每月）检查 Vite 更新，或改为 `npm:vite@^8.0.10` 并在 lock 文件中锁定

#### P2-DEP-06：`protocols` 和 `rpc` 包无任何依赖声明但被标记为可发布

- **位置**：`packages/protocols/deno.json`、`packages/rpc/deno.json`
- **现象**：
  - `protocols` 的 `imports` 为空对象 `{}`
  - `rpc` 没有 `imports` 字段
  - 两者都是零依赖的纯类型/工具包
- **影响**：无功能影响，但值得确认这些包是否真的不需要任何类型定义
- **整改建议**：确认 `@lessjs/protocols` 是否需要 `typescript` 作为 dev dependency

---

### 2.4 枥建与产物问题

#### P2-BLD-01：`build` task 需要 `cd www`，不支持从任意目录构建

- **位置**：`deno.json:105-108`
- **现象**：
  ```json
  "build": "cd www && deno run ... ../packages/adapter-vite/src/cli/build.ts"
  "dev": "cd www && deno run ... npm:vite --config vite.config.ts"
  ```
  所有构建/开发命令都需要先 `cd www`，这与 Monorepo 的灵活性相矛盾
- **影响**：
  - 子包无法独立构建
  - `build:docs` 是 `build` 的别名，命名有歧义
- **整改建议**：
  1. 考虑将 Vite root 配置提取为参数或使用 `--root www` 代替 `cd www`
  2. `build:docs` 重命名为 `build:www` 更准确

#### P2-BLD-02：缺少构建缓存策略

- **位置**：CI 流水线
- **现象**：`build-www` 和 `dsd-report-gate` 以及 `test-e2e` 都需要运行 `deno task build`，但在不同 job 中重复执行
- **影响**：每次 CI 运行可能执行 2-3 次完整 SSG 构建，总耗时可观
- **整改建议**：使用 GitHub Actions 的 `actions/upload-artifact` / `actions/download-artifact` 在 job 间共享 `www/dist` 构建产物

---

### 2.5 发布流程问题

#### P1-PUB-01：`publish` task 是单条长命令，无原子性保证

- **位置**：`deno.json:134`
- **现象**：
  ```json
  "publish": "deno audit && deno task typecheck && deno task lint && deno task fmt:check && deno task test && deno task build && deno task publish:rpc && ..."
  ```
  15 个 publish 子任务通过 `&&` 串联
- **影响**：
  - 如果中间包发布失败（如 JSR 网络错误），前面的包已发布，后面的未发布，状态不一致
  - 本地执行 publish 缺少 `--dry-run` 前置检查
- **整改建议**：
  1. `publish` 应先执行 `publish:dry-run`，确保所有包可发布后再执行实际发布
  2. 考虑将 `publish` task 拆分为 `publish:check` + `publish:execute` 两步

#### P2-PUB-02：`publish-manual.yml` 缺少 `adapter-vanilla`、`hub` 等包

- **位置**：`.github/workflows/publish-manual.yml:7`
- **现象**：手动发布工作流的默认包列表不包含 `adapter-vanilla`、`hub`、`protocols`、`runtime`、`router`、`style-sheet`、`cem`、`compat-check`
- **影响**：手动发布时这些包会被跳过，除非显式添加到输入参数
- **整改建议**：更新默认包列表，包含所有可发布的子包，或从 `packages/` 自动发现

#### P2-PUB-03：`publish-jsr.yml` 的 consumer-smoke 测试等待时间硬编码

- **位置**：`.github/workflows/publish-jsr.yml:99`
- **现象**：`sleep 30` 等待 JSR 传播
- **影响**：
  - 30s 可能不够（JSR 全球传播延迟不固定）
  - 如果 JSR 传播较快，30s 是浪费
- **整改建议**：改为轮询 + 超时机制（当前 `publish_if_missing` 已有重试逻辑，可复用相同模式）

---

### 2.6 规范与 Git 流程问题

#### P1-STD-01：pre-commit hook 覆盖范围不完整

- **位置**：`.githooks/pre-commit`
- **现象**：
  - `deno fmt --check packages/` — 仅检查 packages 目录，未覆盖 `tools/`、`www/`
  - `deno lint packages/` — 同上
  - `deno check` 仅检查 7 个入口点，而根 `deno.json` 的 `typecheck` task 检查 30+ 个入口点
- **影响**：
  - 提交 `tools/` 或 `www/` 的代码不会触发格式检查和 lint
  - pre-commit 的 typecheck 范围远小于 CI 的 typecheck，可能漏检类型错误
- **整改建议**：
  1. pre-commit 应检查所有源码目录（至少 `packages/` + `tools/`）
  2. typecheck 应与 CI 的 `typecheck` task 保持一致，或至少覆盖 `tools/`
  3. 考虑使用 `deno task typecheck` 替代手动枚举入口点

#### P2-STD-02：Git hooks 需要手动安装

- **位置**：`deno.json:146-147`
- **现象**：需要运行 `deno task hooks:install` 才能启用 pre-commit hook
- **影响**：新贡献者克隆仓库后不会自动启用 hooks，可能提交未通过检查的代码
- **整改建议**：
  1. 在 CONTRIBUTING.md 中明确说明 hooks 安装步骤（当前未提及）
  2. 考虑在 `deno task dev` 或首次运行时提示安装 hooks
  3. 或使用 `lefthook` / `husky` 等工具自动安装

#### P2-STD-03：缺少 commit 规范校验

- **位置**：全局
- **现象**：项目没有 commitlint 或类似的 commit message 格式校验
- **影响**：commit message 格式不统一，CHANGELOG 生成困难
- **整改建议**：添加 commitlint + conventional commits 规范，或在 pre-commit hook 中添加 message 格式校验

#### P2-STD-04：`.gstack/` 目录用途不明

- **位置**：根目录
- **现象**：`.gstack/` 目录存在于仓库中，但 `.gitignore` 未忽略它，CONTRIBUTING.md 也未说明其用途
- **影响**：可能是工具生成的工作目录，应被 gitignore 或在文档中说明
- **整改建议**：确认 `.gstack/` 用途，若为生成目录则添加到 `.gitignore`

---

### 2.7 构建效率与缓存

#### P1-PERF-01：CI 中 `deno install` 重复执行 14+ 次

- **位置**：`.github/workflows/test.yml`
- **现象**：14 个 job 每个都独立运行 `deno install --node-modules-dir`，且仅缓存 `node_modules`
- **影响**：保守估计每个 `deno install` 耗时 10-30s，14 个 job 累计浪费 2-7 分钟
- **整改建议**：
  1. 将公共 setup 步骤提取为 composite action
  2. 增加 Deno 缓存目录的缓存
  3. 考虑使用 GitHub Actions 的 job 级别共享机制

#### P2-PERF-02：`test:coverage` 生成的 lcov 未在 CI 中使用

- **位置**：`deno.json:137`
- **现象**：`test:coverage` 生成 `.coverage/lcov.info`，但 CI 流水线中没有任何 job 使用覆盖率报告
- **影响**：覆盖率数据生成但未被消费，也没有覆盖率门禁（如最低覆盖率要求）
- **整改建议**：
  1. 在 SOP Gate 中添加覆盖率门禁（如 ≥60%，与 CONTRIBUTING.md 中的目标一致）
  2. 或使用 Codecov/Coveralls 等服务跟踪覆盖率趋势

---

## 三、审计发现汇总

| 编号 | 级别 | 类别 | 问题摘要 |
|------|------|------|----------|
| P1-ENG-01 | P1 | 工程配置 | 根 imports 膨胀（47条@lessjs/*），维护成本高 |
| P1-ENG-02 | P1 | 工程配置 | hub:scan/validate 使用 -A 全权限 |
| P2-ENG-03 | P2 | 工程配置 | 子包 build task 定义不一致 |
| P2-ENG-04 | P2 | 工程配置 | tsconfig.json 与 deno.json compilerOptions 重复 |
| P2-ENG-05 | P2 | 工程配置 | .gitignore 重复条目 |
| P2-ENG-06 | P2 | 工程配置 | .gitignore .workbuddy/ 重复 |
| P1-CI-01 | P1 | CI/CD | test.yml deno install 重复14次，缓存不完整 |
| P1-CI-02 | P1 | CI/CD | test.yml 14个job无统一门禁汇总 |
| P1-CI-03 | P1 | CI/CD | test.yml/sop-gate.yml/lint.yml 大量重叠 |
| P1-CI-04 | P1 | CI/CD | publish-jsr.yml 20包串行无并行 |
| P2-CI-05 | P2 | CI/CD | deploy-api.yml 无环境保护 |
| P2-CI-06 | P2 | CI/CD | hub-ci.yml auto-merge 无审批 |
| P2-CI-07 | P2 | CI/CD | codeql.yml PR触发过于宽松 |
| P2-CI-08 | P2 | CI/CD | 缺少 deno.lock 一致性检查 |
| P1-DEP-01 | P1 | 依赖管理 | 根deno.json混入www/adapter专用依赖 |
| P1-DEP-02 | P1 | 依赖管理 | 子包hono版本约束不一致 |
| P1-DEP-03 | P1 | 依赖管理 | deno.lock中playwright版本漂移 |
| P2-DEP-04 | P2 | 依赖管理 | router包marked精确版本与其他包不一致 |
| P2-DEP-05 | P2 | 依赖管理 | vite@8.0.10精确锁定需定期安全审查 |
| P2-DEP-06 | P2 | 依赖管理 | protocols/rpc零依赖声明待确认 |
| P2-BLD-01 | P2 | 构建 | build task需cd www，不支持从任意目录 |
| P2-BLD-02 | P2 | 构建 | 缺少构建产物在CI job间的共享 |
| P1-PUB-01 | P1 | 发布 | publish task无原子性，中间失败状态不一致 |
| P2-PUB-02 | P2 | 发布 | publish-manual.yml缺少部分包 |
| P2-PUB-03 | P2 | 发布 | consumer-smoke sleep 30硬编码 |
| P1-STD-01 | P1 | 规范 | pre-commit hook覆盖不完整 |
| P2-STD-02 | P2 | 规范 | Git hooks需手动安装 |
| P2-STD-03 | P2 | 规范 | 缺少commit message规范校验 |
| P2-STD-04 | P2 | 规范 | .gstack/目录用途不明 |
| P1-PERF-01 | P1 | 性能 | CI中deno install重复执行14+次 |
| P2-PERF-02 | P2 | 性能 | test:coverage生成的lcov未在CI使用 |

---

## 四、亮点与优势

1. **SOP Gate 体系完善**：`sop-gate.yml` 的 12 项门禁检查 + `gate-summary` 汇总 job，是项目质量保障的核心基础设施，设计精良
2. **发布流程设计良好**：`publish_if_missing` 函数的幂等设计、dirty worktree 检查、依赖顺序发布、consumer-smoke 测试，都是工程最佳实践
3. **工具脚本质量高**：`check-package-graph.ts` 实现了循环依赖检测、拓扑排序验证、发布顺序一致性校验，是 Monorepo 工程的重要保障
4. **JSR Consumer Monitor**：每日定时在 Windows 上验证 JSR 消费者构建，覆盖了跨平台兼容性
5. **最小权限原则（部分）**：`dev`、`build`、`test` 等 task 已使用具体 `--allow-*` 标志代替 `-A`
6. **.gitattributes 强制 LF**：确保 CI 环境一致性
7. **deno.lock 完整性**：所有 151 个 npm 条目都有 integrity 校验，防篡改

---

## 五、优先整改建议

### 立即整改（P1）

1. **CI 效率优化**：将 test.yml 中的公共 setup 步骤提取为 composite action，添加 Deno 缓存，减少 `deno install` 重复执行
2. **CI 去重**：合并 test.yml / sop-gate.yml / lint.yml 的重复逻辑，sop-gate 应复用 test.yml
3. **test.yml 门禁汇总**：添加 `test-summary` job
4. **依赖边界清理**：将 www/adapter 专用依赖从根 deno.json 移至各子包
5. **hub:scan/validate 权限收紧**：替换 `-A` 为具体权限
6. **pre-commit hook 扩展**：覆盖 `tools/` 和 `www/`，typecheck 与 CI 对齐

### 短期优化（P2）

1. 子包 build task 命名统一和路径修正
2. 版本约束统一（hono、marked）
3. deno.lock 一致性检查加入 CI
4. publish-manual.yml 包列表补全
5. .gitignore 去重
6. 覆盖率门禁引入 CI

### 长期改进

1. commit 规范化（conventional commits + commitlint）
2. 根 imports 映射自动化验证工具
3. 发布流程原子性改进（先 dry-run 再 execute）
4. 构建产物跨 job 共享（artifact）
