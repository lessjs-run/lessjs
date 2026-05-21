export const meta = { section: 'Core', label: 'RPC', order: 70 };
import { headerNav, navSections } from 'virtual:less-nav';
import { pageStyles } from '../../components/page-styles.js';
import { filterFrameworkNav } from '../../utils/nav-filter.ts';
import { DsdElement } from '@lessjs/core';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class RpcGuidePage extends DsdElement {
  static override styles = [pageStyles];
  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `<less-layout locale="${this._getLocale('zh')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterFrameworkNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/guide/rpc"><div class="container">
    <h1>RPC 远程调用</h1>
    <p class="subtitle">@lessjs/rpc 是零依赖的 fetch 抽象层，用原生 Web API（fetch、AbortController）管理 Island 的远程调用。框架无关，可以和 Lit、原生 HTMLElement 或任何 Web Component 库一起使用。</p>
    <h2>设计理念</h2>
    <p>LessJS 的 Island 是独立的 Custom Element，每个 Island 管理自己的状态和副作用。RPC 调用是最常见的副作用之一。@lessjs/rpc 的设计遵循三个原则：</p>
    <ul><li><strong>零依赖</strong>：只用 fetch 和 AbortController。</li><li><strong>框架无关</strong>：RpcController 实现了 ReactiveController 接口。</li><li><strong>安全默认</strong>：请求在组件断开时自动取消，重试只针对瞬态错误。</li></ul>
    <h2>基本用法</h2>
    <less-code-block><pre><code>import { LitElement, html } from 'lit';
import { RpcController } from '@lessjs/rpc';
class PostList extends DsdElement {
  private rpc = new RpcController(this);
  private _posts = [];
  override connectedCallback() {
    super.connectedCallback();
    this._loadPosts();
  }
  private async _loadPosts() {
    this._posts = await this.rpc.call(() => fetch('/api/posts').then(r => r.json()));
    this.requestUpdate();
  }
}</code></pre></less-code-block>
    <h2>Retry &amp; Cancel</h2>
    <p>RpcController 内置重试机制：最多 3 次，仅重试网络错误和 5xx，每次间隔 1 秒。组件断开时自动终止所有进行中的请求。</p>
    <h2>Type-Safe RPC</h2>
    <p>@lessjs/rpc 同时提供类型安全的调用约定--在 API 定义和客户端调用之间共享类型。</p>
    <div class="nav-row"><a href="/guide/api" class="nav-link">&larr; API Routes</a><a href="/guide/content-system" class="nav-link">Content System &rarr;</a></div>
  </div></less-layout>`;
  }

  private _renderEn() {
    return `<less-layout locale="${this._getLocale('en')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterFrameworkNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/en/guide/rpc"><div class="container">
    <h1>RPC</h1>
    <p class="subtitle"><span class="inline-code">@lessjs/rpc</span> is a zero-dependency fetch abstraction layer that uses native Web APIs (fetch, AbortController) to manage remote calls from Islands. Framework-agnostic - works with Lit, native HTMLElement, or any Web Component library.</p>
    <h2>Design Philosophy</h2>
    <p>LessJS islands are independent Custom Elements, each managing its own state and side effects. RPC calls are the most common side effect. <span class="inline-code">@lessjs/rpc</span> follows three principles:</p>
    <ul><li><strong>Zero dependencies</strong>: Only fetch and AbortController.</li><li><strong>Framework-agnostic</strong>: RpcController implements the ReactiveController interface.</li><li><strong>Safe defaults</strong>: Requests auto-cancel on disconnect; retry only for transient errors.</li></ul>
    <h2>Basic Usage</h2>
    <less-code-block><pre><code>import { LitElement, html } from 'lit';
import { RpcController } from '@lessjs/rpc';
class PostList extends DsdElement {
  private rpc = new RpcController(this);
  override connectedCallback() {
    super.connectedCallback();
    this._loadPosts();
  }
  private async _loadPosts() {
    this._posts = await this.rpc.call(() => fetch('/api/posts').then(r => r.json()));
    this.requestUpdate();
  }
}</code></pre></less-code-block>
    <h2>Retry &amp; Cancel</h2>
    <p>RpcController has built-in retry: up to 3 attempts, only for network errors and 5xx, with 1-second intervals. All in-flight requests are aborted when the component disconnects.</p>
    <h2>Type-Safe RPC</h2>
    <p><span class="inline-code">@lessjs/rpc</span> also provides type-safe calling conventions - shared types between API definitions and client calls.</p>
    <div class="nav-row"><a href="/guide/api" class="nav-link">&larr; API Routes</a><a href="/guide/content-system" class="nav-link">Content System &rarr;</a></div>
  </div></less-layout>`;
  }
}

customElements.define('page-rpc-guide', RpcGuidePage);
export default RpcGuidePage;
export const tagName = 'page-rpc-guide';
