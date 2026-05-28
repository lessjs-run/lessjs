export const meta = { section: 'Guide', label: 'Migration (v0.24)', order: 10 };

import { headerNav, navSections } from 'virtual:less-nav';
import { pageStyles } from '../../components/page-styles.js';
import { filterFrameworkNav } from '../../utils/nav-filter.ts';
import { DsdElement } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';

export class MigrationV024Page extends DsdElement {
  static override styles = [openPropsTokenSheet, pageStyles];

  override render() {
    const nav = JSON.stringify(filterFrameworkNav(navSections));
    const hNav = JSON.stringify(headerNav);
    return "<less-layout nav-items='" + nav + "' header-nav='" + hNav +
      '\' current-path="/guide/migration-v0.24">' +
      '<div class="container">' +
      '<h1>Migration to v0.24</h1>' +
      '<p class="subtitle">Guide for migrating from v0.23.x html tagged template model to the new JSX+Signal model.</p>' +
      '<less-callout type="warning" label="Breaking Changes">v0.24.1 removes the old component model: <span class="inline-code">html</span>, <span class="inline-code">classMap</span>, <span class="inline-code">when</span>, <span class="inline-code">choose</span>, <span class="inline-code">repeat</span>, <span class="inline-code">@prop()</span> are deleted.</less-callout>' +
      '<h2>html Template to JSX</h2>' +
      '<less-code-block><pre><code>// Before: render() { return html`&lt;div&gt;${content}&lt;/div&gt;`; }' +
      '// After:  render() { return &lt;div&gt;{content}&lt;/div&gt;; }</code></pre></less-code-block>' +
      '<h2>@prop() to static props</h2>' +
      '<less-code-block><pre><code>// Before: @prop() count = 0;' +
      '// After:  static props = { count: Number };</code></pre></less-code-block>' +
      '<h2>Helper Migration</h2>' +
      '<table><thead><tr><th>v0.23.x</th><th>v0.24.1</th></tr></thead><tbody>' +
      '<tr><td>classMap({...})</td><td>className ternary</td></tr>' +
      '<tr><td>when(cond, a, b)</td><td>ternary operator</td></tr>' +
      '<tr><td>repeat(items, fn)</td><td>items.map(fn)</td></tr>' +
      '<tr><td>@click</td><td>onClick</td></tr>' +
      '<tr><td>.property</td><td>property={value}</td></tr>' +
      '</tbody></table>' +
      '<h2>Configuration</h2>' +
      '<p>Add to <span class="inline-code">deno.json</span>: <code>{"compilerOptions":{"jsx":"react-jsx","jsxImportSource":"@lessjs/core"}}</code></p>' +
      '<div class="nav-row"><a href="/guide/signal-reactivity" class="nav-link">&larr; Signal Reactivity</a><a href="/guide/deployment" class="nav-link">Deployment &rarr;</a></div>' +
      '</div></less-layout>';
  }
}

export const tagName = 'migration-v0.24-page';
customElements.define(tagName, MigrationV024Page);
export default MigrationV024Page;
