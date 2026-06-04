---
title: 'Island Upgrade'
section: 'Principles'
label: 'Island Upgrade'
order: 40
---

<open-layout
        locale="$"
        locales='$'
        nav-items='$'
        header-nav='$'
        current-path="/$/architecture/islands"
      >

    <h1>Island Upgrade</h1>
    <p class="subtitle">
      LessJS islands are Custom Element upgrades that follow DSD HTML. This is not full-page
      hydration - it does not restore the entire application state on the client.
    </p>
    <h2>Why Islands</h2>
    <div class="comparison">
      <div class="comparison-item">
        <h3>Cost of Traditional SPA</h3>
        <ul>
          <li>Content and interactivity both depend on client JavaScript.</li>
          <li>First paint, SEO, and no-JS fallback require extra handling.</li>
          <li>Component model is typically bound to a proprietary runtime.</li>
        </ul>
      </div>
      <div class="comparison-item less">
        <h3>LessJS Island Model</h3>
        <ul>
          <li>Content is first rendered by SSG + DSD.</li>
          <li>Only components that truly need interactivity load client modules.</li>
          <li>Events, local state, and browser APIs bind after upgrade.</li>
        </ul>
      </div>
    </div>
    <h2>Upgrade, Not Hydration</h2>
    <p>
      When the browser parses HTML, DSD has already placed component content and styles into the
      shadow root. After the client entry loads, it calls <span class="inline-code"
      >customElements.define()</span> and the browser upgrades existing elements into real Custom
      Elements. This process is more accurately called <strong>Island Upgrade</strong>.
    </p>
    <h2>When to Create an Island</h2>
    <table>
      <thead>
        <tr>
          <th>Need</th>
          <th>Preferred Layer</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Readable content, navigation, layout</td>
          <td>HTML + DSD</td>
        </tr>
        <tr>
          <td>Hover, focus, responsive state, simple disclosure</td>
          <td>CSS and native HTML elements</td>
        </tr>
        <tr>
          <td>Clipboard, localStorage, IntersectionObserver</td>
          <td>Small island using browser APIs</td>
        </tr>
        <tr>
          <td>Local state, event orchestration, API polling, optimistic UI</td>
          <td>Island Upgrade</td>
        </tr>
      </tbody>
    </table>
    <h2>Creating a Local Island</h2>
    <p>
      Place local islands in <span class="inline-code">app/islands</span>. The builder scans them,
      generates a client entry, and injects it into the static HTML.
    </p>
    <h2>Package Islands</h2>
    <p>
      Reusable packages can export island metadata. LessJS reads this at build time for SSR
      registration and client entry generation.
    </p>
    <p>
      Today that metadata is intentionally minimal. Future package islands should be driven by a
      CEM-compatible manifest that declares tag, module, export, strategy, SSR renderability, DSD
      constraints, hydration events, diagnostics, and fallback behavior. That protocol is required
      before <code>less add</code>, automatic registration, or registry hub claims are stable.
    </p>
    <h2>Current Boundaries</h2>
    <p>
      The current implementation should be treated as framework-supported package island scanning,
      not a general-purpose component marketplace. If a package cannot explain its SSR and hydration
      behavior, LessJS should render it as static host markup or a pure island instead of guessing.
    </p>
    <div class="nav-row">
      <a href="/$/architecture/dsd" class="nav-link">&larr; DSD Architecture</a>
      <a href="/$/architecture/islands-deep" class="nav-link">Island Deep Guide &rarr;</a>
    </div>
