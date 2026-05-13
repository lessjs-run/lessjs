# LessJS QA 维度审核报告

**审核人**: 严过关（Yan）· QA 工程师
**审核日期**: 2026-07-14
**项目根目录**: `C:\Users\Administrator\WorkBuddy\Claw\src-tmp`

---

## 一、测试覆盖率矩阵

### 1.1 各包源文件与测试文件对应关系

| 包名 | 源文件数 | 测试文件数 | 测试/源比 | 覆盖评估 |
|------|---------|-----------|----------|---------|
| adapter-lit | 3 | 3 | 1.00 | A - 完整覆盖 |
| adapter-vite | 20 | 14 | 0.70 | B+ - 核心覆盖良好 |
| app | 1 | 1 | 1.00 | A - 完整覆盖 |
| content | 11 | 4 | 0.36 | C - 覆盖不足 |
| core | 13 | 8 | 0.62 | B - 核心路径覆盖 |
| create | 0* | 1 | N/A | A - 模板CLI测试充分 |
| i18n | 5 | 1 | 0.20 | D - 严重不足 |
| rpc | 1 | 2 | 2.00 | A - 超额覆盖 |
| signals | 6 | 8 | 1.33 | A - 超额覆盖 |
| ui | 15 | 2 | 0.13 | C - 覆盖不足(但组件测试嵌入单一文件) |

> *create 包的源码在 `cli.ts` 中，不在 `src/` 目录下

**总计**: 源文件 75 个，测试文件 44 个，整体测试/源比 **0.59**

### 1.2 未覆盖的源文件清单

#### adapter-vite（6 个源文件无对应测试）
- `src/cli/build-client.ts` - 客户端构建 CLI
- `src/cli/build-ssg.ts` - SSG 构建 CLI
- `src/cli/ssg-render.ts` - SSG 渲染器
- `src/cli/ssg.ts` - SSG 命令入口
- `src/hono-entry.ts` - Hono 服务端入口
- `src/workspace-alias.ts` - 工作区别名
- `src/virtual-ids.ts` - Vite 虚拟模块 ID

#### content（7 个源文件无对应测试）
- `src/blog/blog-data.ts` - 博客数据处理
- `src/blog/markdown.ts` - Markdown 渲染
- `src/blog/types.ts` - 类型定义
- `src/blog-data-plugin.ts` - 博客数据插件
- `src/index.ts` - 包入口
- `src/nav/scanner.ts` - 导航扫描器
- `src/types.ts` - 类型定义

#### core（5 个源文件无对应测试）
- `src/adapter-registry.ts` - 适配器注册（在 render-dsd.test.ts 中部分覆盖）
- `src/constants.ts` - 常量定义
- `src/html-escape.ts` - HTML 转义（在 render-dsd.test.ts 和 ssr-handler.test.ts 中覆盖）
- `src/logger.ts` - 日志模块
- `src/navigation.ts` - 导航模块

#### i18n（3 个源文件无对应测试）
- `src/i18n-data-plugin.ts` - i18n 数据插件
- `src/index.ts` - 包入口
- `src/types.ts` - 类型定义

#### signals（无未覆盖的核心文件，但需注意）
- `src/polyfill.ts` - TC39 Signal polyfill
- `src/types.ts` - 类型定义
- `src/sugar.ts` - 语法糖工具函数

#### ui（实际测试深度超出文件数）
- `components.test.ts` 单文件包含 50+ 测试用例，覆盖所有 6 个组件
- `smoke.test.ts` 覆盖基础导出检查
- 缺失：`less-dialog.ts` 和 `less-hero-ping.ts` 的深度交互测试

---

## 二、测试质量评分

### 2.1 各包测试质量评分

| 包名 | 边界条件 | 错误路径 | Happy Path | Mock 质量 | 评分 |
|------|---------|---------|-----------|----------|------|
| adapter-lit | B | B | A | A | **B+** |
| adapter-vite | A | A | A | B+ | **A-** |
| app | B | C | A | N/A | **B-** |
| content | B | C | B | B | **C+** |
| core | A | A | A | A | **A** |
| create | A | B | A | N/A | **A-** |
| i18n | C | D | A | N/A | **C-** |
| rpc | A | A | A | A | **A** |
| signals | A | B | A | B+ | **A-** |
| ui | B+ | B | A | B | **B+** |

### 2.2 整体测试质量评分: **B+**

---

## 三、详细审核分析

### 3.1 测试覆盖率分析

#### 优势
1. **signals 包超额覆盖**: 8 个测试文件覆盖 6 个源文件，测试/源比 1.33，包含 signal、computed、effect、batch、untracked、channel、native-signal、theme-signal、island-effect 的完整测试矩阵
2. **rpc 包深度测试**: 虽然仅 1 个源文件，但有 2 个测试文件（smoke + state-machine），覆盖状态机、AbortController、并发调用等边界场景
3. **core 包测试全面**: 8 个测试文件覆盖 DSD 渲染、island 系统、上下文、错误处理、策略推荐等核心逻辑
4. **adapter-vite 测试矩阵丰富**: 14 个测试文件覆盖构建、路由扫描、island 转换、SSG 后处理等关键路径

#### 不足
1. **i18n 包严重不足**: 仅 1 个测试文件，覆盖 `loadI18nData`、`i18nStaticPaths`、`switchLocale` 三个纯函数，但未测试：
   - `i18n-data-plugin.ts` 的 Vite 插件行为
   - `routes.ts` 的路由生成完整流程
   - 边界场景：无效 locale、缺失翻译文件、循环引用
2. **content 包覆盖不足**: 11 个源文件仅 4 个测试文件，缺少对以下核心模块的测试：
   - `markdown.ts` 的 Markdown 渲染（frontmatter 解析、代码高亮、链接处理）
   - `blog-data.ts` 的博客数据聚合
   - `nav/scanner.ts` 的导航结构扫描
3. **adapter-vite CLI 未覆盖**: 4 个 CLI 相关源文件无测试，构建流程是最关键的用户路径

### 3.2 测试质量分析

#### 优势
1. **边界条件测试优秀**:
   - `render-dsd.test.ts` 覆盖了组件构造失败、render 抛异常、null 返回值、只读属性、XSS 注入等边界场景
   - `island.test.ts` 测试了无连字符标签名、空标签名、幂等注册、策略降级等边界
   - `state-machine.test.ts` 覆盖了 abort 取消、并发调用、undefined 参数等边界
   - `ssg-postprocess.test.ts` 覆盖了非 HTML 文件跳过、重复注入防护、body 文本误匹配回归等

2. **错误路径测试充分**:
   - `errors.test.ts` 覆盖了 LessError 和 SsrRenderError 的完整行为
   - `render-dsd.test.ts` 对构造失败和渲染失败分别测试，验证了降级 HTML 输出
   - `rpc/state-machine.test.ts` 完整测试了错误状态管理和恢复流程

3. **Mock 设计合理**:
   - `island.test.ts` 使用自定义 mock 替代浏览器 API（customElements、IntersectionObserver），setup/teardown 清晰
   - `render-dsd.test.ts` 使用纯 class mock 替代 HTMLElement，不依赖浏览器环境
   - `components.test.ts` 对 document/localStorage/navigator.clipboard 的 mock 管理规范

4. **回归测试意识强**:
   - `ssg-postprocess.test.ts` 中有专门的回归测试（changelog 页面文本误匹配导致注入跳过）
   - `island-transform.test.ts` 测试了不再注入 CJS 风格注册代码（v0.5.0 CE 升级）

#### 不足
1. **i18n 缺少错误路径测试**: `switchLocale` 未测试无效 locale 参数、空路径、已含 locale 前缀的路径等场景
2. **content/markdown.test.ts 仅测试 frontmatter 解析**: 未测试 Markdown 内容渲染、代码块处理、链接转换等核心功能
3. **signals/channel.test.ts 大量使用 mock**: channel() 在 Deno 环境下是 no-op，测试实际验证的是 mock 实现，而非真实代码行为
4. **ui/less-dialog.ts 无专门测试**: 对话框组件的打开/关闭/ESC 键/焦点管理等交互未测试

### 3.3 测试策略分析

#### 测试层次分布

| 层次 | 数量 | 占比 | 评估 |
|------|------|------|------|
| 单元测试 | ~43 文件 | 95% | 充分 |
| 集成测试 | ~1 文件 (ssg-integration.test.ts) | 2% | 不足 |
| E2E 测试 | 9 spec 文件 | 3% | 合理 |

#### 缺失的测试层次
1. **集成测试严重不足**: 仅 `ssg-integration.test.ts` 一个文件测试了 SSG 管道集成。缺少：
   - adapter-vite + core 的构建管道集成测试
   - adapter-lit SSR 渲染 + DSD hydration 的端到端测试
   - content + i18n 的内容生成集成测试
   - signals + island 的响应式联动测试

2. **性能测试缺失**: 无 benchmark 测试，尤其对于以下关键路径：
   - DSD 渲染大量嵌套组件的性能
   - route scanner 在大型项目中的扫描性能
   - signal 系统在高频更新下的表现

3. **兼容性测试缺失**: 无跨浏览器测试（E2E 仅 Chromium），无 Deno 版本兼容性测试

### 3.4 E2E 测试分析

#### 覆盖范围
9 个 spec 文件覆盖了以下场景：

| Spec 文件 | 测试场景 | 用例数 | 质量 |
|-----------|---------|--------|------|
| navigation-routing.spec.ts | 路由导航、404、博客 | 12 | B+ |
| islands-reactivity.spec.ts | Island 交互、脚本加载 | 6 | B |
| accessibility-performance.spec.ts | 无障碍、性能、PWA | 9 | B+ |
| dsd-layers.spec.ts | DSD 结构验证 | 5 | A- |
| i18n-locale.spec.ts | 国际化路由、语言切换 | 9 | B |
| seo-meta.spec.ts | SEO 标签、Sitemap | 12 | A- |
| theme-system.spec.ts | 主题切换、持久化 | 5 | B+ |
| nested-ce.spec.ts | 嵌套自定义元素 | 4 | B |
| view-transitions-speculation.spec.ts | View Transitions、Speculation Rules | 11 | A |

#### Playwright 配置评估
- **仅 Chromium 浏览器**: 缺少 Firefox 和 WebKit 测试，DSD 在不同浏览器有不同表现
- **webServer 使用 `npx serve`**: 合理，但超时 30 秒可能不够大型构建
- **CI 模式**: `forbidOnly: true` + 2 次重试，配置合理
- **无 video/screenshot 收集**: 调试困难

#### 不足
1. **Island 交互测试脆弱**: `islands-reactivity.spec.ts` 中大量使用 `if (counter.count() > 0)` 的条件跳过，说明测试对页面结构依赖过强
2. **缺少表单交互 E2E**: less-input、less-code-block 的用户交互未在 E2E 中验证
3. **缺少移动端视口测试**: 无 `viewport` 配置，未测试响应式布局
4. **缺少错误页面 E2E**: 500 错误页面、SSR 渲染失败的降级页面未测试

### 3.5 CI/CD 分析

#### GitHub Actions 配置

| Workflow | 触发条件 | Jobs | 评估 |
|----------|---------|------|------|
| test.yml | push/PR (main, dev) | typecheck + 9 个包独立测试 + build-www | A- |
| lint.yml | push/PR (main, dev) | fmt + lint (packages/ only) | B |
| publish.yml | 手动 + tag | 发布到 JSR | N/A |
| publish-manual.yml | 手动 | 手动发布 | N/A |
| deploy-api.yml | N/A | 部署 API | N/A |

#### 优势
1. **test.yml 按包分离 job**: 并行执行，任一包失败独立报告
2. **每个 job 独立缓存**: 使用 `deno.lock` 哈希作为缓存 key
3. **build-www 独立 job**: 验证文档站点可构建
4. **pre-commit hook**: 格式化 + lint + 类型检查三重守卫

#### 缺失的 CI 步骤
1. **无 E2E 测试 CI**: `test.yml` 不包含 `test:e2e`，Playwright 测试仅在本地运行
2. **无覆盖率报告上传**: `--coverage` 标志已添加但结果未上传到 Codecov/Coveralls
3. **无定时构建 (cron)**: 缺少每日/每周定期运行全量测试
4. **lint 跳过 www/ 目录**: 因 Deno fmt/lint 对 tagged template literals 的 bug，www/ 目录未纳入检查
5. **无依赖安全审计**: 缺少 `deno audit` 或 npm audit 步骤
6. **无 Matrix 测试**: 未在不同 OS（Windows/macOS）和 Deno 版本上测试

### 3.6 测试基础设施分析

#### Deno Test 配置
```json
"test": "deno test --allow-read --allow-write --allow-env --allow-net --allow-run"
"test:coverage": "deno test --coverage=.coverage ... && deno coverage .coverage --lcov > .coverage/lcov.info"
"test:watch": "deno test --allow-... --watch"
"test:e2e": "npx -y @playwright/test test --config www/e2e/playwright.config.ts"
```

#### 评估

| 方面 | 状态 | 评分 |
|------|------|------|
| 测试命令完整性 | test + coverage + watch + e2e 齐全 | A |
| 权限配置 | --allow-* 粒度合理 | B+ |
| 覆盖率输出 | lcov 格式，可接入 CI | A- |
| E2E 独立命令 | 单独 test:e2e 任务 | A |
| Playwright 安装 | test:e2e:install 独立任务 | A |
| 覆盖率阈值 | 无最低覆盖率要求 | C |
| 测试隔离 | 部分 test 使用 --allow-ffi | B |

#### 不足
1. **无覆盖率阈值**: `test:coverage` 仅生成报告，不设最低覆盖率门槛
2. **无 .coverage/ 排除配置**: 覆盖率目录未在 deno.json exclude 中
3. **signals 的 channel 测试在 Deno 中无实际效果**: `channel()` 在无 DOM 环境下是 no-op，测试仅验证了 API 契约而非真实行为
4. **部分测试使用 `sanitizeOps: false`**: `ssg-smoke.test.ts` 和 `route-scanner.test.ts` 因 rolldown SignalExit 问题禁用了操作消毒，可能掩盖资源泄漏

---

## 四、缺失测试清单（按优先级排序）

### P0 - 关键缺失（影响核心功能可靠性）

| # | 模块 | 缺失测试 | 风险 |
|---|------|---------|------|
| 1 | adapter-vite CLI | build-client、build-ssg、ssg-render、ssg 四个 CLI 入口无测试 | 构建命令是用户最高频操作，任何 bug 都会导致构建失败 |
| 2 | content/markdown | Markdown 渲染、代码高亮、链接处理无测试 | 内容渲染是框架核心价值，渲染错误导致文档不可读 |
| 3 | i18n/i18n-data-plugin | Vite 插件行为无测试 | i18n 插件失败导致整个多语言功能不可用 |
| 4 | E2E in CI | Playwright 测试不在 CI 中运行 | 端到端回归无法自动发现 |

### P1 - 重要缺失（影响边界场景可靠性）

| # | 模块 | 缺失测试 | 风险 |
|---|------|---------|------|
| 5 | adapter-vite/hono-entry | Hono 服务端入口无测试 | 开发模式服务端请求处理可能出错 |
| 6 | content/nav/scanner | 导航结构扫描无测试 | 导航生成错误导致侧边栏/面包屑不正确 |
| 7 | content/blog-data | 博客数据聚合无测试 | 博客列表、分页、标签等可能出错 |
| 8 | core/navigation | 客户端导航模块无测试 | SPA 导航跳转可能失效 |
| 9 | ui/less-dialog | 对话框组件无交互测试 | 弹窗/模态框打开关闭可能异常 |
| 10 | signals/polyfill | TC39 Signal polyfill 无测试 | polyfill 行为可能偏离标准 |

### P2 - 改善缺失（提升测试深度和可靠性）

| # | 模块 | 缺失测试 | 风险 |
|---|------|---------|------|
| 11 | E2E 多浏览器 | 仅 Chromium，缺 Firefox/WebKit | DSD 在 Firefox 有已知差异 |
| 12 | 性能基准 | 无 benchmark 测试 | 大型项目构建时间可能退化 |
| 13 | adapter-vite/workspace-alias | 工作区别名解析无测试 | monorepo 开发体验可能受损 |
| 14 | adapter-vite/virtual-ids | Vite 虚拟模块无测试 | 虚拟模块解析失败导致构建中断 |
| 15 | 覆盖率门槛 | 无最低覆盖率要求 | 覆盖率可能持续下降 |

---

## 五、改进建议（按优先级排序）

### P0 - 立即执行

1. **将 E2E 测试加入 CI**: 在 `test.yml` 中添加 `e2e` job，先 build-www 再运行 Playwright
   ```yaml
   e2e:
     needs: build-www
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: denoland/setup-deno@v2
       - run: deno install --node-modules-dir
       - run: deno task build:docs
       - uses: actions/setup-node@v4
       - run: npx playwright install chromium --with-deps
       - run: deno task test:e2e
   ```

2. **为 adapter-vite CLI 添加集成测试**: 测试 build-client、build-ssg、ssg-render 的完整流程，使用真实 fixture 项目

3. **添加 content/markdown 核心测试**: 覆盖 frontmatter 解析、代码块渲染、链接转换、图片处理

4. **添加 i18n-data-plugin 测试**: 测试 Vite 插件的虚拟模块解析、数据注入、热更新行为

### P1 - 短期执行（1-2 周）

5. **设置覆盖率门槛**: 在 CI 中添加 `--coverage` 结果检查，最低覆盖率不低于 60%
   ```yaml
   - name: Check coverage threshold
     run: |
       deno coverage .coverage --lcov > .coverage/lcov.info
       # 添加阈值检查脚本
   ```

6. **为 content/nav/scanner 添加测试**: 测试导航结构扫描、嵌套目录处理、排序逻辑

7. **添加 ui/less-dialog 测试**: 测试对话框的打开/关闭/ESC 键/焦点陷阱/overlay 点击关闭

8. **增强 E2E 浏览器覆盖**: 在 `playwright.config.ts` 中添加 Firefox 和 WebKit 项目
   ```typescript
   projects: [
     { name: 'chromium', use: { browserName: 'chromium' } },
     { name: 'firefox', use: { browserName: 'firefox' } },
     { name: 'webkit', use: { browserName: 'webkit' } },
   ],
   ```

9. **修复 island E2E 测试脆弱性**: 使用确定性的页面 fixture 替代条件跳过逻辑

### P2 - 中期执行（1 个月）

10. **添加性能基准测试**: 使用 Deno benchmark API 或自定义计时器，对关键路径建立基线
    - DSD 渲染 100 个嵌套组件
    - route scanner 扫描 1000 个路由文件
    - signal 系统高频更新吞吐量

11. **添加 CI Matrix 测试**: 在不同 OS 和 Deno 版本上运行测试
    ```yaml
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        deno-version: ['2', '2.1']
    ```

12. **添加 core/logger 测试**: 日志级别控制、格式化、静默模式

13. **添加 core/navigation 测试**: SPA 导航、路由拦截、History API 管理

14. **解决 lint 跳过 www/ 的问题**: 跟踪 Deno fmt/lint 上游 bug，修复后纳入 www/ 目录

15. **添加依赖安全审计**: 定期运行 `deno audit` 或配置 Dependabot/Renovate

---

## 六、发现的具体测试问题

### 6.1 测试中的潜在问题

| # | 文件 | 问题描述 | 严重性 |
|---|------|---------|--------|
| 1 | signals/channel.test.ts | channel() 在 Deno 中是 no-op，测试实际验证 mock 实现而非真实代码 | 中 |
| 2 | adapter-vite/ssg-smoke.test.ts | `sanitizeOps: false` 可能掩盖 SignalExit 资源泄漏 | 低 |
| 3 | adapter-vite/route-scanner.test.ts | `sanitizeResources: false` 可能掩盖文件系统资源泄漏 | 低 |
| 4 | ui/components.test.ts | 大量 `as any` 类型断言，降低了类型安全保证 | 低 |
| 5 | islands-reactivity.spec.ts | 条件跳过模式（`if count > 0`）导致测试不稳定 | 中 |
| 6 | i18n.test.ts | 仅覆盖纯函数，未覆盖 Vite 插件生命周期 | 高 |

### 6.2 测试基础设施问题

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 1 | 覆盖率报告未上传 CI | 无法追踪覆盖率趋势 | 集成 Codecov |
| 2 | E2E 未在 CI 运行 | 端到端回归手动发现 | 添加 e2e CI job |
| 3 | pre-commit hook 不含测试 | 提交可能引入测试失败 | 添加 `deno test` 到 pre-commit |
| 4 | 无覆盖率阈值 | 覆盖率可能持续下降 | 设置最低 60% 门槛 |
| 5 | signals 测试依赖 setTimeout(50ms) | 在慢速 CI 中可能 flaky | 考虑使用 `FakeTime` 或增大超时 |

---

## 七、总结

### 整体评估: **B+**

LessJS 项目在测试方面表现出高于开源框架平均水平的质量，特别是在以下方面：
- **核心模块测试深度优秀**: core、signals、rpc 包的测试覆盖了关键边界条件和错误路径
- **SSG 管道测试细致**: ssg-postprocess.test.ts 包含回归测试和边界场景
- **E2E 测试范围合理**: 覆盖了 DSD、导航、主题、SEO、i18n、Islands、A11y 等核心场景

主要改进方向：
1. **i18n 包测试严重不足**（最急需改善）
2. **E2E 测试应加入 CI**（保障端到端质量）
3. **adapter-vite CLI 缺少测试**（用户最高频操作路径）
4. **content 包 markdown 测试缺失**（框架核心价值所在）
5. **覆盖率门槛和趋势追踪**（防止质量退化）

### 评分汇总

| 维度 | 评分 |
|------|------|
| 测试覆盖广度 | B |
| 测试质量深度 | B+ |
| 测试策略层次 | B |
| E2E 测试充分性 | B+ |
| CI/CD 配置 | B |
| 测试基础设施 | B+ |
| **综合评分** | **B+** |
