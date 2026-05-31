/**
 * @lessjs/docs - API Reference
 *
 * Organized by category: Components, Rendering, Islands, Signals, Build, SSR.
 */
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
export const tagName = 'api-core-page';
export const meta = { section: 'Reference', label: 'API Reference', order: 5 };

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .api-category { margin-bottom: var(--size-8); }
      .api-category h2 { margin-top: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
      .api-entry { margin: var(--size-4) 0 var(--size-3); }
      .api-sig {
        font-family: var(--font-mono);
        font-size: var(--font-size-00);
        color: var(--text-primary);
        margin-bottom: 0.25rem;
      }
      .api-desc {
        font-size: var(--font-size-0);
        color: var(--text-muted);
        line-height: var(--font-lineheight-3);
      }
    `);

export default class ApiCorePage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return (
      
        <div class="container">
          <h1>API 参考</h1>
          <p class="subtitle">LessJS 公开 API — 按类别分组。</p>

          <div class="api-category">
            <h2>组件</h2>
            <div class="api-entry">
              <div class="api-sig">class DsdElement extends HTMLElement</div>
              <div class="api-desc">所有 LessJS 组件的基类。提供 render()、static props、signal 管理和 DSD 集成。</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">override render(): VNode | string</div>
              <div class="api-desc">返回组件内容。返回 JSX/VNode 获取响应式，返回字符串获取静态 DSD 输出。</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">static props: Record&lt;string, typeof String | Number | Boolean&gt;</div>
              <div class="api-desc">声明类型化组件属性。键自动注册为 observedAttributes 并转换为 kebab-case。</div>
            </div>
          </div>

          <div class="api-category">
            <h2>渲染</h2>
            <div class="api-entry">
              <div class="api-sig">renderDsd(input: string | CustomElementConstructor, props?): Promise&lt;RenderOutput&gt;</div>
              <div class="api-desc">唯一渲染入口。input 为标签名时自动查 customElements 注册表，为类时直接使用。返回包含 html、errors、metrics 的 RenderOutput。</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">renderDsdStream(components, options?): ReadableStream&lt;Uint8Array&gt;</div>
              <div class="api-desc">流式输出文档外壳和 DSD 组件块，通过 Web Streams 逐块传输。</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">renderToDom(node: unknown, signal?: AbortSignal): Node</div>
              <div class="api-desc">将 VNode 树转换为真实 DOM 节点。事件处理器通过原生 addEventListener 绑定。</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">renderToString(node: unknown): string</div>
              <div class="api-desc">将 VNode 树转换为 HTML 字符串，用于 SSR/SSG 输出。文本内容自动 HTML 转义。</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">&lt;Show when=signal&gt;...children...&lt;/Show&gt; (v0.26.1)</div>
              <div class="api-desc">条件渲染控制流组件。when prop 为 truthy 时渲染第一个子节点，否则渲染第二个。基于 effect() 自动响应 signal 变化。</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">&lt;fore each=signal&gt;(item): VNode&lt;/fore&gt; (v0.26.1)</div>
              <div class="api-desc">列表渲染控制流组件。each prop 接受 Signal&lt;Array&gt;，子节点为 render function。基于 effect() 自动响应 signal 变化。</div>
            </div>
          </div>

          <div class="api-category">
            <h2>Islands</h2>
            <div class="api-entry">
              <div class="api-sig">{`defineIsland(componentClass, options?: { strategy?: 'load' | 'idle' | 'visible' | 'only' }): CustomElementConstructor`}</div>
              <div class="api-desc">为 Custom Element 类包装 Island 升级逻辑。支持四种 hydration 策略。</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">bindEvents(element: HTMLElement, events: Record&lt;string, Function&gt;): void</div>
              <div class="api-desc">将事件处理器重新绑定到已升级的 Island 组件上。</div>
            </div>
          </div>

          <div class="api-category">
            <h2>Signals</h2>
            <div class="api-entry">
              <div class="api-sig">signal&lt;T&gt;(initial: T): Signal&lt;T&gt;</div>
              <div class="api-desc">创建包含初始值的响应式容器。通过 .value 读写。JSX 内自动展开。</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">{`computed&lt;T&gt;(fn: () => T): Signal&lt;T&gt;`}</div>
              <div class="api-desc">创建从其他 signal 派生的只读 signal。惰性求值，自动追踪依赖，结果缓存。</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">{`effect(fn: () => void): () => void`}</div>
              <div class="api-desc">依赖 signal 变化时自动执行回调。返回 dispose 函数用于停止追踪。</div>
            </div>
          </div>

          <div class="api-category">
            <h2>构建</h2>
            <div class="api-entry">
              <div class="api-sig">lessPipeline(options?: FrameworkOptions, ctx?: LessBuildContext): Plugin[]</div>
              <div class="api-desc">创建 LessJS Vite 插件数组。处理路由扫描、Hono entry 生成、Island 转换、SSR 和 SSG。</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">{`interface PipelineConfig { routes?: string; islands?: string; ssr?: boolean; ssg?: boolean; ... }`}</div>
              <div class="api-desc">lessPipeline() 的配置选项，控制构建管线的各个阶段。</div>
            </div>
          </div>

          <div class="api-category">
            <h2>SSR</h2>
            <div class="api-entry">
              <div class="api-sig">getSsrProps(element: HTMLElement): Record&lt;string, unknown&gt;</div>
              <div class="api-desc">从元素属性中提取和反序列化 SSR 传递的数据。</div>
            </div>
          </div>
        </div>
      
    );
  }

  private _renderEn() {
    return (
      
        <div class="container">
          <h1>API Reference</h1>
          <p class="subtitle">LessJS public API — grouped by category.</p>

          <div class="api-category">
            <h2>Components</h2>
            <div class="api-entry">
              <div class="api-sig">class DsdElement extends HTMLElement</div>
              <div class="api-desc">Base class for all LessJS components. Provides render(), static props, signal management, and DSD integration.</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">override render(): VNode | string</div>
              <div class="api-desc">Returns component content. Return JSX/VNode for reactivity, string for static DSD output.</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">static props: Record&lt;string, typeof String | Number | Boolean&gt;</div>
              <div class="api-desc">Declare typed component properties. Keys auto-register as observedAttributes and convert to kebab-case.</div>
            </div>
          </div>

          <div class="api-category">
            <h2>Rendering</h2>
            <div class="api-entry">
              <div class="api-sig">renderDsd(input: string | CustomElementConstructor, props?): Promise&lt;RenderOutput&gt;</div>
              <div class="api-desc">The single rendering entry point. Accepts a tag name (auto-lookup from registry) or a component class directly. Returns RenderOutput with html, errors, metrics, and hydrationHints.</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">renderDsdStream(components, options?): ReadableStream&lt;Uint8Array&gt;</div>
              <div class="api-desc">Streams document shell and DSD component chunks via Web Streams for progressive delivery.</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">renderToDom(node: unknown, signal?: AbortSignal): Node</div>
              <div class="api-desc">Converts a VNode tree to real DOM nodes. Event handlers wired via native addEventListener.</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">renderToString(node: unknown): string</div>
              <div class="api-desc">Converts a VNode tree to an HTML string for SSR/SSG output. Text content is HTML-escaped.</div>
            </div>
          </div>

          <div class="api-category">
            <h2>Islands</h2>
            <div class="api-entry">
              <div class="api-sig">{`defineIsland(componentClass, options?: { strategy?: 'load' | 'idle' | 'visible' | 'only' }): CustomElementConstructor`}</div>
              <div class="api-desc">Wraps a Custom Element class with island upgrade logic. Supports four hydration strategies.</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">bindEvents(element: HTMLElement, events: Record&lt;string, Function&gt;): void</div>
              <div class="api-desc">Re-binds event handlers to an upgraded island component.</div>
            </div>
          </div>

          <div class="api-category">
            <h2>Signals</h2>
            <div class="api-entry">
              <div class="api-sig">signal&lt;T&gt;(initial: T): Signal&lt;T&gt;</div>
              <div class="api-desc">Creates a reactive container with an initial value. Read/write via .value. Auto-unwraps in JSX.</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">{`computed&lt;T&gt;(fn: () => T): Signal&lt;T&gt;`}</div>
              <div class="api-desc">Creates a read-only signal derived from other signals. Lazy, auto-tracking, memoized.</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">{`effect(fn: () => void): () => void`}</div>
              <div class="api-desc">Runs a callback automatically when tracked signals change. Returns a dispose function.</div>
            </div>
          </div>

          <div class="api-category">
            <h2>Build</h2>
            <div class="api-entry">
              <div class="api-sig">lessPipeline(options?: FrameworkOptions, ctx?: LessBuildContext): Plugin[]</div>
              <div class="api-desc">Creates the LessJS Vite plugin array. Handles route scanning, Hono entry generation, island transform, SSR, and SSG.</div>
            </div>
            <div class="api-entry">
              <div class="api-sig">{`interface PipelineConfig { routes?: string; islands?: string; ssr?: boolean; ssg?: boolean; ... }`}</div>
              <div class="api-desc">Configuration options for lessPipeline(), controlling each phase of the build pipeline.</div>
            </div>
          </div>

          <div class="api-category">
            <h2>SSR</h2>
            <div class="api-entry">
              <div class="api-sig">getSsrProps(element: HTMLElement): Record&lt;string, unknown&gt;</div>
              <div class="api-desc">Extracts and deserializes SSR-passed data from element attributes.</div>
            </div>
          </div>
        </div>
      
    );
  }
}

customElements.define(tagName, ApiCorePage);
