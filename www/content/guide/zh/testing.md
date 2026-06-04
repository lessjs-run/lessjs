---
title: 'Testing'
section: 'Production'
label: 'Testing'
order: 40
---

<open-layout
locale=
locales=
navItems=
headerNav=
currentPath='/zh/guide/testing'

    <h1>Testing</h1>
    <p class='subtitle'>
      openElement testing should protect framework contracts: route scanning, DSD output, island
      metadata, middleware scope, SSG post-processing, and package boundaries.
    </p>
    <h2>Project Testing</h2>
    <p>
      Application code can use Deno's built-in test runner. Start with unit tests for pure
      logic and API handlers, then add build smoke tests for critical routes.
    </p>
    <h2>Build Smoke Tests</h2>
    <p>
      A static-first framework needs at least one test that builds the site and verifies the
      generated HTML. This catches route scanning, SSR, client island, and SSG integration
      issues.
    </p>
    <open-code-block>
      <pre><code>deno test --allow-read --allow-write --allow-env --allow-net --allow-run</code></pre>
    </open-code-block>
    <h2>Browser Testing</h2>
    <p>
      Use browser tests when behavior depends on Custom Element upgrade, IntersectionObserver,
      idle loading, service worker, or real DOM semantics.
    </p>
    <h2>Playwright E2E Tests</h2>
    <p>
      openElement includes Playwright end-to-end tests that verify SSG output in real browsers.
      They confirm DSD is correctly parsed, Custom Elements upgrade, and island strategies
      work as expected.
    </p>
    <div class='nav-row'>
      <a href='/guide/error-handling' class='nav-link'>← Error Handling</a>
      <a href='/guide/deployment' class='nav-link'>Deployment →</a>
    </div>
