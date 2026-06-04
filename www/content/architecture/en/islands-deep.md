---
title: 'Island Deep Dive'
section: 'Principles'
label: 'Island Deep Dive'
order: 50
---

<open-layout
locale=
locales=
navItems=
headerNav=
currentPath=/architecture/islands-deep`}

    <h1>Island Deep Dive</h1>
    <p class='subtitle'>
      Islands are the only allowed client-side JavaScript units in LessJS. This page covers
      the three-layer architecture, upgrade strategies, declarative event binding, and data
      passing mechanisms.
    </p>
    <h2>Island Architecture</h2>
    <p>
      LessJS islands are a straightforward exploitation of the Custom Element Upgrade
      mechanism. The browser sees <span class='inline-code'>&lt;my-counter&gt;</span> 
      during HTML parsing; later the module loads and calls 
      <span class='inline-code'>customElements.define()</span>, upgrading the existing
      element. See <a href=/architecture/dsd`}>DSD Architecture</a> 
      for the rendering model.
    </p>
    <h2>Three-Layer Island Architecture</h2>
    <div class='layer-card'>
      <div class='layer-tag'>Layer 1 - dsd-static</div>
      <h3>No JS, Pure DSD</h3>
      <p>
        Purely presentational components: nav, article content, footer. SSG outputs full DSD
        HTML; the client loads zero JavaScript. Content remains visible and styled even if
        customElements.define() is never called.
      </p>
    </div>
    <div class='layer-card'>
      <div class='layer-tag'>Layer 2 - dsd-interactive</div>
      <h3>DSD + Event Binding</h3>
      <p>
        Components needing simple interactivity. SSR outputs full DSD (visible on first
        paint); after the client module loads, it detects the existing shadow root, skips
        render(), and binds only the declared event handlers.
      </p>
    </div>
    <div class='layer-card'>
      <div class='layer-tag'>Layer 3 - pure-island</div>
      <h3>Framework Owns Shadow Root</h3>
      <p>
        Components needing full framework reactivity: local state, timers, polling, WebSocket.
        SSR outputs only the tag and data-ssr-props - no DSD template. The client framework
        creates the shadow root and controls rendering entirely.
      </p>
    </div>
    <h2>Upgrade Strategies</h2>
    <div class='strategy-grid'>
      <div class='strategy-item'>
        <div class='strat-name'>
          <code>client:load</code>
        </div>
        <p>
          Imports immediately after the client entry loads. For first-paint interactive
          components such as nav and theme controls.
        </p>
      </div>
      <div class='strategy-item'>
        <div class='strat-name'>
          <code>client:idle</code>
        </div>
        <p>
          Defers to requestIdleCallback. Default strategy for non-urgent interactive
          components.
        </p>
      </div>
      <div class='strategy-item'>
        <div class='strat-name'>
          <code>client:visible</code>
        </div>
        <p>
          Uses IntersectionObserver to import when the element is 200px before the viewport.
          For below-the-fold components like collapsible sections and comments.
        </p>
      </div>
      <div class='strategy-item'>
        <div class='strat-name'>
          <code>client:only</code>
        </div>
        <p>
          Excludes the component from SSR and lets the browser own rendering. For browser-only
          components that cannot produce reliable DSD.
        </p>
      </div>
    </div>
    <h2>Speculative Loading</h2>
    <p>
      During SSG post-processing, LessJS generates a per-page island manifest listing every
      island present on each page, with chunk URLs and strategies. The runtime only loads
      islands actually used on the current page.
    </p>
    <h2>bindEvents() Declarative Event Binding</h2>
    <p>
      Layer 2 components use bindEvents() for declarative event binding. Since DSD has
      already rendered the DOM, render() returns nothing. bindEvents() tells the adapter
      which DOM events to wire up manually. Listeners are managed via AbortController and
      cleaned up on disconnect.
    </p>
    <h2>data-ssr-props Mechanism</h2>
    <p>
      During SSR, component property values are serialized to JSON and written to the
      data-ssr-props attribute. On client upgrade, bindEvents() automatically parses and restores
      these values, ensuring SSR and client state stay in sync.
    </p>
    <h2>Best Practices</h2>
    <p>
      1. Start with Layer 1. Most presentational components never need to leave Layer 1.
      <br />2. Prefer CSS over JavaScript. Hover, focus, responsive layouts can be done with
      CSS alone.
      <br />3. Keep islands small and independent. Multiple small islands are easier to
      understand and optimize than one large one.
      <br />4. Prefer client:visible over client:idle for below-the-fold components.
      <br />5. Keep data-ssr-props small. Large datasets should be fetched client-side.
      <br />            6. DSD hydration detection: automatically detects existing shadow root on client
      hydrate to avoid re-rendering DSD DOM.
    </p>
    <div class='nav-row'>
      <a href=/architecture/dsd`} class='nav-link'>← DSD Architecture</a>
      <a href=/api/reference`} class='nav-link'>RPC →</a>
    </div>
