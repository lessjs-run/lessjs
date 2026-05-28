// deno-fmt-ignore-file
export const meta = { section: 'Guide', label: 'v0.24 迁移指南', order: 10 };
import { headerNav, navSections } from 'virtual:less-nav';
import { filterFrameworkNav } from '../../../utils/nav-filter.ts';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';

export const tagName = 'zh-migration-v0.24-page';

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        font-size: 0.875rem;
      }
      th, td {
        padding: 0.5rem 0.75rem;
        border-bottom: 0.5px solid var(--border);
        text-align: left;
        vertical-align: top;
      }
      th {
        background: var(--bg-surface);
        color: var(--text-muted);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .step {
        margin: 1.5rem 0 2rem;
      }
      .step h2 {
        margin-top: 0;
      }
    `);

export default class ZhMigrationV024Page extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return `
      <less-layout
        locale="zh"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterFrameworkNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/zh/guide/migration-v0.24"
      >
        <div class="container">
          <h1>v0.24 迁移指南</h1>
          <p class="subtitle">
            从 LessJS v0.23（<code>html</code> 标签模板 + <code>@prop()</code> 装饰器）
            迁移到 v0.24.1（JSX + <code>static props</code> + <code>effect()</code>）的完整指南。
          </p>

          <less-callout type="warning" label="破坏性变更">
            v0.24.1 移除了多项 API：<code>html</code> 标签模板、<code>@prop()</code> 装饰器、
            <code>TemplateResult</code> 类型、<code>repeat()</code>/<code>when()</code>/<code>choose()</code> 控制流等。
            迁移前请确认项目已升级到 v0.23 最新补丁版本。
          </less-callout>

          <h2>API 变更总览</h2>
          <table>
            <thead>
              <tr>
                <th>移除的 API</th>
                <th>替代方案</th>
                <th>迁移难度</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>html`...`</code></td>
                <td>JSX 语法：<code>&lt;div&gt;...&lt;/div&gt;</code></td>
                <td>中</td>
              </tr>
              <tr>
                <td><code>@prop()</code> 装饰器</td>
                <td><code>static props = { name: Type }</code></td>
                <td>低</td>
              </tr>
              <tr>
                <td><code>TemplateResult</code> / <code>isTemplateResult</code></td>
                <td><code>VNode</code> / <code>isVNode()</code></td>
                <td>中</td>
              </tr>
              <tr>
                <td><code>PropertyOptions</code></td>
                <td><code>PropDecl</code> / <code>PropType&lt;D&gt;</code> / <code>PropsFrom&lt;P&gt;</code></td>
                <td>低</td>
              </tr>
              <tr>
                <td><code>renderTemplateToString</code></td>
                <td><code>renderToString()</code></td>
                <td>低</td>
              </tr>
              <tr>
                <td><code>unsafeHTML()</code></td>
                <td>内联 JSX 含受信内容</td>
                <td>低</td>
              </tr>
              <tr>
                <td><code>classMap()</code></td>
                <td>JSX className + 模板字面量/三元表达式</td>
                <td>低</td>
              </tr>
              <tr>
                <td><code>when()</code></td>
                <td>JSX 三元或 <code>&&</code> 表达式</td>
                <td>低</td>
              </tr>
              <tr>
                <td><code>choose()</code></td>
                <td>JSX switch/对象查找或三元</td>
                <td>低</td>
              </tr>
              <tr>
                <td><code>repeat()</code></td>
                <td>JSX <code>Array.map()</code></td>
                <td>低</td>
              </tr>
              <tr>
                <td><code>ref()</code></td>
                <td>JSX <code>ref</code> 属性</td>
                <td>低</td>
              </tr>
            </tbody>
          </table>

          <section class="step">
            <h2>第 1 步：配置 JSX</h2>
            <p>确保构建工具配置了 JSX 转换。LessJS Vite 插件已预配置：</p>
            <less-code-block><pre><code>// vite.config.ts
import { defineConfig } from 'vite';
import lessjs from '@lessjs/vite';

export default defineConfig({
  plugins: [lessjs()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@lessjs/core',
  },
});</code></pre></less-code-block>

            <p>Deno 项目在 <code>deno.json</code> 中配置：</p>
            <less-code-block><pre><code>{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@lessjs/core"
  }
}</code></pre></less-code-block>
          </section>

          <section class="step">
            <h2>第 2 步：替换 html`...` 标签模板</h2>

            <h3>之前 (v0.23)</h3>
            <less-code-block><pre><code>import { html } from '@lessjs/runtime';

class MyCard extends DsdElement {
  render() {
    return html`
      &lt;div class="card"&gt;
        &lt;h2&gt;\${this.title}&lt;/h2&gt;
        &lt;p&gt;\${this.description}&lt;/p&gt;
      &lt;/div&gt;
    `;
  }
}</code></pre></less-code-block>

            <h3>之后 (v0.24.1)</h3>
            <less-code-block><pre><code>class MyCard extends DsdElement {
  render() {
    return (
      &lt;div class="card"&gt;
        &lt;h2&gt;{this.title}&lt;/h2&gt;
        &lt;p&gt;{this.description}&lt;/p&gt;
      &lt;/div&gt;
    );
  }
}</code></pre></less-code-block>
          </section>

          <section class="step">
            <h2>第 3 步：替换 @prop() 装饰器</h2>

            <h3>之前 (v0.23)</h3>
            <less-code-block><pre><code>import { prop } from '@lessjs/runtime';
import type { PropertyOptions } from '@lessjs/runtime';

class MyCounter extends DsdElement {
  @prop({ type: Number, default: 0, reflect: true })
  count!: number;

  @prop({ type: String, default: 'Counter' })
  label!: string;
}</code></pre></less-code-block>

            <h3>之后 (v0.24.1)</h3>
            <less-code-block><pre><code>class MyCounter extends DsdElement {
  static props = {
    count: { type: Number, default: 0, reflect: true },
    label: { type: String, default: 'Counter' },
  };

  declare count: number;
  declare label: string;
}</code></pre></less-code-block>

            <p>简写形式（不需要 default 或 reflect 时）：</p>
            <less-code-block><pre><code>static props = {
  count: Number,
  label: String,
};</code></pre></less-code-block>
          </section>

          <section class="step">
            <h2>第 4 步：更新事件绑定写法</h2>

            <h3>之前 (v0.23)</h3>
            <less-code-block><pre><code>html`&lt;button @click=\${this._handleClick}&gt;点击&lt;/button&gt;`</code></pre></less-code-block>

            <h3>之后 (v0.24.1)</h3>
            <less-code-block><pre><code>&lt;button onClick={this._handleClick}&gt;点击&lt;/button&gt;</code></pre></less-code-block>
          </section>

          <section class="step">
            <h2>第 5 步：更新控制流</h2>

            <h3>条件渲染</h3>
            <p><strong>之前：</strong><code>${when(this.visible, () => html`...`)}</code></p>
            <p><strong>之后：</strong><code>{this.visible.value && <div>...</div>}</code></p>

            <h3>列表渲染</h3>
            <p><strong>之前：</strong><code>${repeat(this.items, (item) => html`&lt;li&gt;\${item}&lt;/li&gt;`)}</code></p>
            <p><strong>之后：</strong><code>{this.items.value.map(item => <li>{item}</li>)}</code></p>

            <h3>多分支</h3>
            <p><strong>之前：</strong><code>${choose(this.status, [[...], [...]])}</code></p>
            <p><strong>之后：</strong></p>
            <less-code-block><pre><code>{this.status.value === 'loading' ? <Spinner /> :
 this.status.value === 'error' ? <Error /> :
 <Content />}</code></pre></less-code-block>
          </section>

          <section class="step">
            <h2>第 6 步：更新 ref</h2>

            <h3>之前 (v0.23)</h3>
            <less-code-block><pre><code>#inputRef = ref();
render() {
  return html`&lt;input \${this.#inputRef} /&gt;`;
}</code></pre></less-code-block>

            <h3>之后 (v0.24.1)</h3>
            <less-code-block><pre><code>#inputEl?: HTMLInputElement;
render() {
  return &lt;input ref={el =&gt; this.#inputEl = el as HTMLInputElement} /&gt;;
}</code></pre></less-code-block>
          </section>

          <section class="step">
            <h2>第 7 步：更新 classMap</h2>

            <h3>之前 (v0.23)</h3>
            <less-code-block><pre><code>html`&lt;div class=\${classMap({ active: this.isActive, large: this.big })}&gt;`</code></pre></less-code-block>

            <h3>之后 (v0.24.1)</h3>
            <less-code-block><pre><code>&lt;div className={`card \${this.isActive.value ? 'active' : ''} \${this.big.value ? 'large' : ''}`}&gt;</code></pre></less-code-block>
          </section>

          <section class="step">
            <h2>第 8 步：更新渲染函数导入</h2>

            <p>如果代码中直接使用了 <code>renderTemplateToString</code>，改为 <code>renderToString</code>：</p>

            <h3>之前 (v0.23)</h3>
            <less-code-block><pre><code>import { renderTemplateToString } from '@lessjs/runtime';
const html = renderTemplateToString(myTemplateResult);</code></pre></less-code-block>

            <h3>之后 (v0.24.1)</h3>
            <less-code-block><pre><code>import { renderToString } from '@lessjs/runtime';
const html = renderToString(myVNode);</code></pre></less-code-block>
          </section>

          <section class="step">
            <h2>第 9 步：更新类型守卫</h2>

            <p>如果代码中有 <code>isTemplateResult</code> 类型守卫：</p>

            <h3>之前 (v0.23)</h3>
            <less-code-block><pre><code>import { isTemplateResult } from '@lessjs/runtime';
if (isTemplateResult(x)) { ... }</code></pre></less-code-block>

            <h3>之后 (v0.24.1)</h3>
            <less-code-block><pre><code>import { isVNode } from '@lessjs/runtime';
if (isVNode(x)) { ... }</code></pre></less-code-block>
          </section>

          <h2>迁移检查清单</h2>
          <ol>
            <li>✅ 配置 JSX 转换（<code>jsx: "automatic"</code> + <code>jsxImportSource: "@lessjs/core"</code>）</li>
            <li>✅ 将所有 <code>html`...`</code> 标签模板替换为 JSX 语法</li>
            <li>✅ 将所有 <code>@prop()</code> 装饰器替换为 <code>static props = { ... }</code></li>
            <li>✅ 移除 <code>PropertyOptions</code> 导入，改用 <code>PropDecl</code>/<code>PropType</code>/<code>PropsFrom</code></li>
            <li>✅ 将 <code>@click=${fn}</code> 改为 <code>onClick={fn}</code></li>
            <li>✅ 将 <code>when()</code>/<code>choose()</code>/<code>repeat()</code> 改为原生 JS 表达式</li>
            <li>✅ 将 <code>ref()</code> 改为 JSX <code>ref</code> 属性</li>
            <li>✅ 将 <code>classMap()</code> 改为模板字面量</li>
            <li>✅ 将 <code>renderTemplateToString()</code> 改为 <code>renderToString()</code></li>
            <li>✅ 将 <code>isTemplateResult()</code> 改为 <code>isVNode()</code></li>
            <li>✅ 将 <code>TemplateResult</code> 类型引用改为 <code>VNode</code></li>
            <li>✅ 移除 <code>html</code>、<code>unsafeHTML</code>、<code>classMap</code>、<code>when</code>、<code>choose</code>、<code>repeat</code>、<code>ref</code> 导入</li>
            <li>✅ 运行 <code>deno task typecheck</code> 验证类型</li>
            <li>✅ 运行 <code>deno task test</code> 验证行为</li>
          </ol>

          <h2>常见问题</h2>

          <h3>Q: JSX 编译报错怎么办？</h3>
          <p>确认 <code>tsconfig.json</code> 或 <code>deno.json</code> 中配置了：</p>
          <less-code-block><pre><code>"jsx": "react-jsx",
"jsxImportSource": "@lessjs/core"</code></pre></less-code-block>

          <h3>Q: string render() 还能用吗？</h3>
          <p>可以。返回字符串的 <code>render()</code> 方法仍然支持，适合纯静态组件或渐进迁移。</p>

          <h3>Q: @prop() 和 static props 能共存吗？</h3>
          <p>可以。旧 <code>@prop()</code> 装饰器和新的 <code>static props</code> 在 <code>DsdElement</code> 中可以共存，支持渐进迁移。两者在 <code>attributeChangedCallback</code> 中都有一一对应的处理路径。</p>

          <h3>Q: 组件事件监听器需要手动清理吗？</h3>
          <p>不需要。VNode 路径的 <code>renderToDOM()</code> 通过 <code>addEventListener(type, fn, { signal })</code> 绑定事件，<code>AbortController</code> 在组件断连或重新渲染时自动 abort，事件监听器被自动移除。</p>

          <h3>Q: 迁移后 SSR 能正常工作吗？</h3>
          <p>可以。<code>renderToString()</code> 正确处理 VNode 树，跳过事件处理器和 ref，生成标准 HTML 字符串。DSD 渲染管道同时支持 VNode 和 TemplateResult 路径。</p>

          <div class="nav-row">
            <a href="/zh/guide/signal-reactivity" class="nav-link">&larr; Signal 响应式</a>
            <a href="/zh/guide/api" class="nav-link">API 参考 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, ZhMigrationV024Page);
