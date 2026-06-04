---
title: 'DSD Rendering Architecture'
section: 'Principles'
label: 'DSD Rendering'
order: 30
---

<open-layout
        locale="$"
        locales='$'
        nav-items='$'
        header-nav='$'
        current-path="/en/architecture/dsd"
      >

          <h1>DSD Rendering Architecture</h1>
          <p class="subtitle">
            Declarative Shadow DOM is the core LessJS rendering model: the server emits standard HTML,
            the browser creates shadow roots during parsing, and JavaScript only upgrades components and
            binds necessary events. Since v0.20, DSD components are built on DsdElement + StyleSheet by default.
          </p>

          <h2>What Is DSD</h2>
          <p>
            DSD is template semantics in WHATWG HTML. The key attribute is
            <code>shadowrootmode</code>. It lets HTML carry shadow root content so server-rendered Web
            Components are visible before their JavaScript implementation loads.
          </p>
          <open-code-block><pre><code>&lt;my-card&gt;

&lt;template shadowrootmode="open"&gt;
&lt;style&gt;:host &lt;/style&gt;
&lt;p&gt;Content is visible before JavaScript loads.&lt;/p&gt;
&lt;/template&gt;
&lt;/my-card&gt;</code></pre></open-code-block>

          <h2>Why LessJS Uses DSD</h2>
          <div class="comparison">
            <div class="comparison-item">
              <h3>Traditional Hydration</h3>
              <ul>
                <li>The client often restores a full component tree.</li>
                <li>Mismatches can cause re-rendering, flicker, or lost interactivity.</li>
                <li>Framework-private markers are common.</li>
              </ul>
            </div>
            <div class="comparison-item less">
              <h3>DSD-first</h3>
              <ul>
                <li>Shadow roots exist during HTML parsing.</li>
                <li>Custom Element upgrade activates existing hosts.</li>
                <li>The output stays close to platform semantics and works well with SSG/caching.</li>
              </ul>
            </div>
          </div>

          <h2>WHATWG DSD Attributes</h2>
          <table>
            <thead><tr><th>Attribute</th><th>LessJS Option</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr><td><code>shadowrootmode</code></td><td>always open</td><td>Enables declarative shadow root output.</td></tr>
              <tr><td><code>shadowrootdelegatesfocus</code></td><td><code>delegatesFocus</code></td><td>Delegates focus into the shadow root.</td></tr>
              <tr><td><code>shadowrootslotassignment</code></td><td><code>slotAssignment</code></td><td>Controls slot assignment.</td></tr>
              <tr><td><code>shadowrootclonable</code></td><td><code>clonable</code></td><td>Allows cloned hosts to include the shadow root.</td></tr>
              <tr><td><code>shadowrootserializable</code></td><td><code>serializable</code></td><td>Allows shadow root serialization.</td></tr>
              <tr><td><code>shadowrootcustomelementregistry</code></td><td><code>customElementRegistry</code></td><td>Leaves room for scoped registry semantics.</td></tr>
            </tbody>
          </table>

          <h2>Three-Layer Component Model</h2>
          <table>
            <thead><tr><th>Layer</th><th>Type</th><th>Client JS</th><th>Good Fit</th></tr></thead>
            <tbody>
              <tr><td>Layer 1</td><td><code>dsd-static</code></td><td>None</td><td>Layout, navigation, article content.</td></tr>
              <tr><td>Layer 2</td><td><code>dsd-interactive</code></td><td>Events only</td><td>Theme toggles, disclosure, tabs.</td></tr>
              <tr><td>Layer 3</td><td><code>pure-island</code></td><td>Full client logic</td><td>Charts, complex forms, WebSocket.</td></tr>
            </tbody>
          </table>

          <h2>Boundary</h2>
          <p>
            DSD is not a guarantee that every component can be SSR-rendered. Components that depend on
            browser layout, global DOM, side effects, timers, or third-party scripts must degrade to pure
            islands or declare their SSR/fallback behavior in a manifest.
          </p>
          <p>
            LessJS should validate target browser behavior with Playwright. Polyfills for older browsers
            are graceful fallback, not a replacement for real-browser validation.
          </p>

          <h2>Reactive DSD (v0.21)</h2>
          <p>
            DsdElement + Signals gives Ocean components zero-framework reactivity.
            A single <code>signal(0)</code> drives a counter, a <code>computed()</code> drives a filter —
            no Lit, React, or any framework runtime required.
          </p>
          <reactive-showcase></reactive-showcase>

          <div class="nav-row">
            <a href="/$/architecture/architecture" class="nav-link">&larr; $</a>
            <a href="/$/architecture/islands" class="nav-link">$ &rarr;</a>
            <a href="/$/architecture/standards-registry" class="nav-link">$ &rarr;</a>
          </div>
