# SOP-011: 统一错误处理架构

> Version: v0.23.x
> Priority: P1
> Status: PLANNED
> Depends on: ADR-0053, SOP-010（错误边界依赖响应式属性系统）
> Blocks: SOP-015（验证需要错误系统）

## Objective

用四层统一错误架构（错误类型 + 错误边界 + 错误传播管线 + 错误遥测）替代当前断裂的两套错误系统，实现：子组件渲染失败不拖垮整页、SPA 导航有重试机制、所有错误可观测。

## Current Problem

深度评估报告指出 5 个错误处理缺陷：

1. **无错误边界**：`render()` 抛异常 → SSR 管线回退裸标签 → 客户端无错误边界概念
2. **SPA 导航无错误恢复**：网络错误 → 全页刷新，无重试
3. **两套断裂错误系统**：`LessError`/`SsrRenderError`（errors.ts）与 `RenderError` interface（render-errors.ts）不组合
4. **构建错误无结构化元数据**：`throw new Error('Phase X failed')` 无 code/phase/recoverable
5. **无错误遥测 hook**：无法接入 Sentry/Datadog 等监控

当前错误流：

```
render() throws → renderDSD() catch → bare tag + RenderError in output.errors[]
→ ssgRender() ignores errors[] → 用户看到降级页面，无错误报告
```

审计发现 5 个空 `catch {}` 块——全是"没有标准错误报告方式"的症状。

## Target Files

| File | Action | 说明 |
|------|--------|------|
| `packages/core/src/errors.ts` | REWRITE | 统一错误类型层级 |
| `packages/core/src/render-errors.ts` | MODIFY | 合并到统一系统，保留 classifyError |
| `packages/core/src/dsd-element.ts` | MODIFY | 添加 onError() + isErrorBoundary |
| `packages/core/src/render-dsd.ts` | MODIFY | 错误聚合到共享累加器 |
| `packages/core/src/render-nested.ts` | MODIFY | 共享 errors[] 传递 |
| `packages/core/src/ssg-render.ts` | MODIFY | 错误聚合 + 报告输出 |
| `packages/ui/src/less-layout.ts` | MODIFY | SPA 导航重试 + 错误页面 |
| `packages/app/src/index.ts` | MODIFY | onError 遥测 hook |
| `packages/core/__tests__/errors-unified.test.ts` | CREATE | 统一错误系统测试 |
| `packages/core/__tests__/error-boundary.test.ts` | CREATE | 错误边界测试 |
| `packages/ui/__tests__/spa-navigation-error.test.ts` | CREATE | SPA 导航错误测试 |

## Procedure

### Step 1: 统一错误类型层级

**目标**：所有框架错误继承 `LessError` 基类，携带 `code`/`severity`/`phase`/`tagName`/`recoverable`/`details` 结构化元数据。

**涉及文件**：`packages/core/src/errors.ts`（重写）

**执行动作**：

- [ ] 重写 `LessError` 基类：

```ts
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';
export type ErrorPhase = 'render' | 'hydrate' | 'build' | 'route' | 'unknown';

export class LessError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly severity: ErrorSeverity = 'error',
    public readonly phase?: ErrorPhase,
    public readonly tagName?: string,
    public readonly recoverable: boolean = false,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'LessError';
  }

  summarize(): string {
    const location = this.tagName ? ` [${this.tagName}]` : '';
    const phaseLabel = this.phase ? ` (${this.phase})` : '';
    return `[${this.code}]${location}${phaseLabel}: ${this.message}`;
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code, severity: this.severity, phase: this.phase,
      tagName: this.tagName, recoverable: this.recoverable,
      message: this.message, details: this.details,
    };
  }
}
```

- [ ] 创建子类：

```ts
export class RenderError extends LessError {
  constructor(tagName: string, cause: Error) {
    super(`Render failed: ${tagName}`, 'RENDER_FAILURE', 'error', 'render',
      tagName, true, { causeMessage: cause.message, causeName: cause.name });
  }
}

export class HydrateError extends LessError {
  constructor(tagName: string, eventName: string, cause: Error) {
    super(`Hydration failed: ${tagName}.${eventName}`, 'HYDRATE_FAILURE', 'warning',
      'hydrate', tagName, true, { eventName, causeMessage: cause.message });
  }
}

export class RouteError extends LessError {
  constructor(path: string, cause?: Error) {
    super(`Route navigation failed: ${path}`, 'ROUTE_FAILURE', 'error', 'route',
      undefined, true, { path, causeMessage: cause?.message });
  }
}

export class BuildError extends LessError {
  constructor(phase: string, cause: Error) {
    super(`Build phase ${phase} failed`, 'BUILD_FAILURE', 'fatal', 'build',
      undefined, false, { buildPhase: phase, causeMessage: cause.message });
  }
}
```

- [ ] 旧 `SsrRenderError` → 标记 `@deprecated`，v0.25 移除
- [ ] 旧 `RenderError` interface（render-errors.ts 中的）→ 重命名为 `RenderErrorV0`，内部过渡期保留
- [ ] 保持 `classifyError()` 函数不变（返回 `RenderErrorV0`），标注 `@deprecated`

**验收命令**：

```sh
deno test packages/core/__tests__/errors-unified.test.ts --allow-read
```

**通过标准**：

- [ ] `new RenderError('my-comp', new Error('test')).code` === `'RENDER_FAILURE'`
- [ ] `new RenderError('my-comp', new Error()).recoverable` === `true`
- [ ] `new BuildError('phase1', new Error()).severity` === `'fatal'`
- [ ] `new RouteError('/about', new Error('network')).details.path` === `'/about'`
- [ ] `error.summarize()` 输出 `[RENDER_FAILURE] [my-comp] (render): Render failed: my-comp`
- [ ] `error.toJSON()` 输出 JSON 安全对象

**失败处理**：如果旧 `RenderError` interface 重命名导致大量文件修改，使用 `type RenderErrorLegacy = RenderErrorV0` 过渡别名。

**是否污染工作区**：是（重写核心 errors.ts）

---

### Step 2: 错误边界机制

**目标**：DsdElement 支持 `onError()` 生命周期 + `isErrorBoundary` 静态标志，子组件渲染失败可被父边界捕获。

**涉及文件**：`packages/core/src/dsd-element.ts`

**执行动作**：

- [ ] 添加 `isErrorBoundary` 静态属性：

```ts
class DsdElement extends HTMLElement {
  static isErrorBoundary = false;
}
```

- [ ] 添加 `onError()` 生命周期钩子：

```ts
class DsdElement extends HTMLElement {
  protected onError(error: RenderError): void {
    console.error(`[${error.tagName}] ${error.message}`);
    this._renderFallback(error);
  }

  private _renderFallback(error: RenderError): void {
    if (this._devMode) {
      this.shadowRoot!.innerHTML =
        `<div class="less-error" role="alert"><code>${escapeHtml(error.code)}</code>: ${escapeHtml(error.message)}</div>`;
    }
  }
}
```

- [ ] 修改 `_renderIntoShadowRoot()` 客户端重渲染路径：

```ts
private _renderIntoShadowRoot(): void {
  try {
    const result = this.render();
    // ... 现有逻辑
  } catch (e) {
    const error = new RenderError(this.tagName!, e as Error);
    this.onError(error);
  }
}
```

- [ ] 错误边界冒泡：

```ts
private _propagateError(error: RenderError): void {
  const host = this.getRootNode()?.host;
  if (host instanceof DsdElement) {
    if ((host.constructor as typeof DsdElement).isErrorBoundary) {
      host.onError(error);
    } else {
      host._propagateError(error);
    }
  }
}
```

**验收命令**：

```sh
deno test packages/core/__tests__/error-boundary.test.ts --allow-read
```

**通过标准**：

- [ ] 子组件 `render()` 抛异常 → 最近 `isErrorBoundary = true` 的祖先的 `onError()` 被调用
- [ ] 无错误边界 → 错误传播到 `renderDSD()` 的裸标签回退
- [ ] dev 模式显示错误详情
- [ ] 生产模式显示裸标签（无信息泄漏）
- [ ] 错误边界组件可以渲染自定义降级 UI

**失败处理**：如果 Shadow DOM 边界导致 `getRootNode().host` 为 null（closed shadow），改用 `CustomEvent` 向上派发错误。

**是否污染工作区**：是（修改 dsd-element.ts，约 +40 行）

---

### Step 3: SSR 错误传播管线

**目标**：SSR 管线中的错误聚合到共享累加器，`ssgRender` 最终汇总输出。

**涉及文件**：`packages/core/src/render-dsd.ts`, `packages/core/src/render-nested.ts`, `packages/core/src/ssg-render.ts`

**执行动作**：

- [ ] 修改 `RenderOutput.errors` 类型为 `LessError[]`（从 `RenderErrorV0[]` 改为统一）

- [ ] 修改 `renderNestedCustomElements()` 签名，增加共享错误累加器：

```ts
async function renderNestedCustomElements(
  html: string,
  registry: ComponentRegistry,
  depth: number,
  errors: LessError[],       // 共享累加器
): Promise<string> {
  for (const ce of customElements) {
    try {
      const result = await renderDSD(ce.tagName, ce.attrs);
      errors.push(...result.errors);    // 收集子组件错误
    } catch (e) {
      errors.push(new RenderError(ce.tagName, e as Error));
      // 兄弟组件继续渲染——一个失败不杀整页
    }
  }
}
```

- [ ] 修改 `ssgRender()` 处理错误汇总：

```ts
const { html, errors } = await ssgRender(app, routes);
if (errors.length > 0) {
  const fatal = errors.filter(e => e.severity === 'fatal');
  const recoverable = errors.filter(e => e.recoverable);
  console.warn(`${recoverable.length} recoverable errors during SSG`);
  console.error(`${fatal.length} fatal errors during SSG`);
  await writeFile('dist/ssg-errors.json', JSON.stringify(errors.map(e => e.toJSON())));
  if (fatal.length > 0) process.exit(1);
}
```

**验收命令**：

```sh
deno test packages/core/__tests__/render-dsd.test.ts --allow-read --filter "error"
deno task build
```

**通过标准**：

- [ ] 子组件渲染失败不阻断兄弟组件渲染
- [ ] `RenderOutput.errors` 包含所有嵌套层级的错误
- [ ] `ssgRender()` 输出错误汇总到控制台 + `dist/ssg-errors.json`
- [ ] fatal 错误导致构建失败（exit 1）
- [ ] recoverable 错误仅警告，不阻断构建

**失败处理**：如果共享累加器在并发渲染中产生竞态，改用不可变数组合并（每次返回新数组）。

**是否污染工作区**：是（修改 SSR 渲染管线核心文件）

---

### Step 4: SPA 导航错误恢复

**目标**：`less-layout` 的 SPA 导航增加重试 + 错误页面渲染，替代全页刷新。

**涉及文件**：`packages/ui/src/less-layout.ts`

**执行动作**：

- [ ] 修改 `navigateTo()` 方法增加重试逻辑：

```ts
async navigateTo(url: string): Promise<void> {
  try {
    const html = await this._fetchPage(url);
    this._swapContent(html);
  } catch (e) {
    const error = new RouteError(url, e as Error);
    this._onFrameworkError?.(error);

    if (this._shouldRetry(e as Error)) {
      try {
        const html = await this._fetchPage(url);
        this._swapContent(html);
        return;
      } catch (_) { /* 降级到错误页面 */ }
    }

    this._renderErrorPage(error);
  }
}

private _shouldRetry(error: Error): boolean {
  if (error instanceof TypeError) return true;  // 网络错误
  return false;
}
```

- [ ] 实现 `_renderErrorPage()`：

```ts
private _renderErrorPage(error: RouteError): void {
  const main = this.shadowRoot?.querySelector('main');
  if (main) {
    main.innerHTML = `
      <div class="less-route-error" role="alert">
        <h2>Page Load Error</h2>
        <p>${escapeHtml(error.message)}</p>
        <button onclick="location.reload()">Retry</button>
        <a href="${escapeAttr(error.details?.path as string ?? '/')}">Full reload</a>
      </div>`;
  }
}
```

- [ ] 重试次数限制：最多 1 次

**验收命令**：

```sh
deno test packages/ui/__tests__/spa-navigation-error.test.ts --allow-read
```

**通过标准**：

- [ ] 网络错误触发 1 次重试
- [ ] 重试成功 → 正常渲染
- [ ] 重试失败 → 渲染错误页面
- [ ] 4xx 错误不重试，直接显示错误页面
- [ ] 错误页面有"重试"和"刷新"操作

**失败处理**：如果 `_fetchPage` 的错误类型不可区分（4xx vs 网络错误），添加 `fetchError.type` 分类。

**是否污染工作区**：是（修改 less-layout.ts，约 +40 行）

---

### Step 5: 错误遥测 Hook

**目标**：`FrameworkOptions` 增加 `onError` 回调，用户可接入 Sentry/Datadog。

**涉及文件**：`packages/app/src/index.ts`

**执行动作**：

- [ ] 在 `FrameworkOptions` 接口中添加：

```ts
export interface FrameworkOptions {
  // ... 现有选项
  onError?: (error: LessError) => void;
}
```

- [ ] 框架初始化时注册全局错误处理器：

```ts
if (options.onError) {
  app._errorHandler = options.onError;
}
```

- [ ] 在 SSR 错误传播管线（Step 3）中，每个错误经过 `onError`：

```ts
if (this._errorHandler) {
  try {
    this._errorHandler(error);
  } catch { /* 遥测 hook 自身不应阻断流程 */ }
}
```

**验收命令**：

```sh
deno test packages/core/__tests__/errors-unified.test.ts --allow-read --filter "telemetry"
```

**通过标准**：

- [ ] `lessjs({ onError: (e) => sentry.captureException(e) })` 捕获所有 LessError
- [ ] 遥测 hook 异常不阻断渲染管线
- [ ] 无 `onError` 时零开销

**失败处理**：如果 `onError` 在 SSR 和客户端行为不一致，确保两路径都调用。

**是否污染工作区**：是（修改 app 入口）

---

### Step 6: 清理空 catch 块 + 旧代码迁移

**目标**：消除审计发现的 5 个空 `catch {}` 块，用结构化 `LessError` 替代。

**涉及文件**：全局搜索空 catch 块

**执行动作**：

- [ ] `rg 'catch\s*\(\w*\)\s*\{\s*\}' packages/ --type ts` 找到所有空 catch 块
- [ ] 每个空 catch 块改为：
  - 创建合适的 `LessError` 子类实例
  - 调用 `this.onError(error)` 或 `log.error(error.summarize())`
  - 确保错误被记录
- [ ] 更新 `render-errors.ts` 中的 `classifyError()` 返回类型为 `LessError` 兼容
- [ ] 删除 `SsrRenderError` 使用处，替换为 `RenderError`
- [ ] 更新所有 `import` 引用

**验收命令**：

```sh
rg 'catch\s*\(\w*\)\s*\{\s*\}' packages/ --type ts
# 预期：0 结果
deno task test
deno task typecheck
```

**通过标准**：

- [ ] 0 个空 `catch {}` 块
- [ ] 所有 catch 块产生结构化 `LessError`
- [ ] `SsrRenderError` 仅存在于 `@deprecated` 标记中
- [ ] 所有测试通过

**失败处理**：如果某些 catch 块上下文不适合创建 `LessError`（第三方库回调），至少添加 `log.debug()` 记录。

**是否污染工作区**：是（跨文件清理）

## Quality Gates

| Gate | Criteria |
|------|----------|
| G1 | 所有框架错误继承 `LessError`，含 code/severity/phase/recoverable |
| G2 | `isErrorBoundary` + `onError()` 可捕获子组件渲染失败 |
| G3 | SSR 管线错误聚合到 `RenderOutput.errors` |
| G4 | `ssgRender()` 输出 `dist/ssg-errors.json` |
| G5 | SPA 导航有重试 + 错误页面 |
| G6 | `onError` 遥测 hook 可接入外部监控 |
| G7 | 0 个空 `catch {}` 块 |
| G8 | `deno task typecheck && deno task test` 全通过 |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 旧 RenderError interface 重命名导致大面积修改 | 中 | 中 | 使用过渡别名 |
| Shadow DOM closed 阻止错误冒泡 | 低 | 中 | 改用 CustomEvent |
| SSR 共享累加器并发竞态 | 低 | 中 | 改用不可变数组合并 |
| SPA 重试增加延迟 | 低 | 低 | 限制最多 1 次重试 |
| 遥测 hook 异常拖垮渲染 | 低 | 高 | try/catch 包裹 hook 调用 |
