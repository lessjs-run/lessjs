---
title: 'Islands & SSR'
section: 'Core'
label: 'Islands & SSR'
order: 4
---

<less-layout locale="$" locales='$' nav-items='$' header-nav='$' current-path="/en/guide/islands-and-ssr">

          <h1>Islands &amp; SSR</h1>
          <p class="subtitle">
            LessJS's Ocean/Island model: server pre-renders content via DSD, client upgrades interactive
            components on demand.
          </p>

          <h2>Ocean/Island Pattern</h2>
          <p>
            The "ocean" is purely static content (layout, text, navigation). "Islands" are components
            that need client-side interactivity. The core insight: most of a page doesn't need JavaScript —
            only a few interactive spots do.
          </p>
          <div class="comparison" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--size-4);margin:var(--size-4) 0 var(--size-6)">
            <div style="padding:var(--size-4);border:1px solid var(--border);border-radius:var(--radius-2)">
              <h3>Traditional SPA</h3>
              <ul>
                <li>Blank page until JavaScript loads</li>
                <li>Full-page hydration is expensive</li>
                <li>Content and interactivity are tightly coupled</li>
              </ul>
            </div>
            <div style="padding:var(--size-4);border:1px solid var(--border);border-radius:var(--radius-2);background:var(--bg-surface);border-left:3px solid var(--brand)">
              <h3>LessJS Islands</h3>
              <ul>
                <li>Content pre-rendered via SSG + DSD</li>
                <li>Only needed components load JavaScript</li>
                <li>Content decoupled from interactivity</li>
              </ul>
            </div>
          </div>

          <h2>DSD Rendering</h2>
          <p>
            Declarative Shadow DOM lets server-rendered Web Components have their shadow root during
            HTML parsing. Users see content immediately — no JavaScript required.
          </p>
          <less-code-block><pre><code>&lt;my-card&gt;

&lt;template shadowrootmode="open"&gt;
&lt;style&gt;:host &lt;/style&gt;
&lt;p&gt;Content is visible before JavaScript loads.&lt;/p&gt;
&lt;/template&gt;
&lt;/my-card&gt;</code></pre></less-code-block>

          <h2>Three-Layer Component Model</h2>
          <table>
            <thead><tr><th>Layer</th><th>Type</th><th>Client JS</th><th>Best Fit</th></tr></thead>
            <tbody>
              <tr><td>Layer 1</td><td>DSD Static</td><td>None</td><td>Layout, navigation, article content</td></tr>
              <tr><td>Layer 2</td><td>DSD Interactive</td><td>Events only</td><td>Theme toggles, disclosure, tabs</td></tr>
              <tr><td>Layer 3</td><td>Pure Island</td><td>Full client logic</td><td>Charts, complex forms, WebSocket</td></tr>
            </tbody>
          </table>

          <h2>Hydration Strategies</h2>
          <p>
            Declare islands via <code>defineIsland()</code> API with four hydration strategies:
          </p>
          <less-code-block><pre><code>import  from '@lessjs/core';

export class MyChart extends DsdElement

// Load immediately (above-the-fold interactive elements)
defineIsland(MyChart, );

// Defer until browser is idle (non-critical UI)
defineIsland(MyChart, );

// Load when entering viewport (lazy-loaded content)
defineIsland(MyChart, );

// Client-only render (no DSD, no SSR)
defineIsland(MyChart, );</code></pre></less-code-block>

          <table>
            <thead><tr><th>Strategy</th><th>Trigger</th><th>Recommended Use</th></tr></thead>
            <tbody>
              <tr><td><code>load</code></td><td>Module load</td><td>Above-fold: nav menus, search boxes</td></tr>
              <tr><td><code>idle</code></td><td>requestIdleCallback</td><td>Non-critical: footer widgets</td></tr>
              <tr><td><code>visible</code></td><td>IntersectionObserver</td><td>Lazy: image galleries, comments</td></tr>
              <tr><td><code>only</code></td><td>Client-only</td><td>Browser-specific: charts, maps</td></tr>
            </tbody>
          </table>

          <h2>Creating an Island</h2>
          <p>Place components that need client-side behavior in the <code>app/islands/</code> directory:</p>
          <less-code-block><pre><code>// app/islands/counter.ts

import from '@lessjs/core';

export class Counter extends DsdElement &gt;-&lt;/button&gt;
&lt;span&gt;&lt;/span&gt;
&lt;button onClick=&gt;+&lt;/button&gt;
&lt;/div&gt;
);
}
}

customElements.define('my-counter', Counter);</code></pre></less-code-block>

<p>Usage in pages:</p>
<less-code-block><pre><code>&lt;my-counter&gt;&lt;/my-counter&gt;</code></pre></less-code-block>
<p>
The builder automatically scans <code>app/islands/</code>, generates a client entry,
and injects it into the static HTML. Page HTML renders first; the browser upgrades
components after loading the island entry.
</p>

          <h2>SSR vs CSR Behavior</h2>
          <table>
            <thead><tr><th>Aspect</th><th>SSR (Server-Side)</th><th>CSR (Client-Side)</th></tr></thead>
            <tbody>
              <tr><td>Render output</td><td>DSD HTML string</td><td>Live DOM in shadow root</td></tr>
              <tr><td>Signal subscriptions</td><td>Collected during render, serialized</td><td>Active — DOM updates on change</td></tr>
              <tr><td>Event handlers</td><td>Serialized for hydration</td><td>Bound via addEventListener</td></tr>
              <tr><td>effect()</td><td>Runs once, output captured</td><td>Runs continuously</td></tr>
              <tr><td>ref</td><td>Silently skipped</td><td>Callback invoked</td></tr>
            </tbody>
          </table>

          <less-callout type="info" label="Upgrade, Not Hydration">
            LessJS uses Island Upgrade instead of traditional hydration. When the browser parses HTML,
            DSD has already populated the content. The client entry calls <code>customElements.define()</code>
            to upgrade existing elements into real Custom Elements.
          </less-callout>

          <div class="nav-row">
            <a href="/guide/routing-and-data" class="nav-link">&larr; Routing &amp; Data</a>
            <a href="/guide/deployment" class="nav-link">Deployment &rarr;</a>
          </div>
