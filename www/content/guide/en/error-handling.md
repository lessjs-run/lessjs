---
title: 'Error Handling'
section: 'Production'
label: 'Error Handling'
order: 30
---

<less-layout
locale=
locales=
navItems=
headerNav=
currentPath='/en/guide/error-handling'

    <h1>Error Handling</h1>
    <p class='subtitle'>
      LessJS distinguishes between framework errors, build-time render errors, API errors, and
      browser island failures. The goal is clear diagnostics without leaking internal
      information in production.
    </p>
    <h2>Error Hierarchy</h2>
    <div class='error-hierarchy'>
      LessError |-- NotFoundError 404 |-- UnauthorizedError 401 |-- ForbiddenError 403 |--
      ValidationError 422 |-- ConflictError 409 |-- RateLimitError 429 |-- SsrRenderError 500
      |-- IslandUpgradeError 500
    </div>
    <h2>Operational vs Programming</h2>
    <p>
      LessJS distinguishes operational errors (not found, validation, rate limit - return
      structured status) from programming errors (render failure, broken import - fail build
      or show dev diagnostics).
    </p>
    <h2>Structured Logging</h2>
    <p>
      LessJS uses <span class='inline-code'>createLogger(scope)</span> 
      for scoped log levels (DEBUG, INFO, WARN, ERROR). Each message carries a prefix
      identifying its source - e.g. <span class='inline-code'>[LessJS/SSG]</span>.
    </p>
    <div class='nav-row'>
      <a href='/guide/security-middleware' class='nav-link'>← Security &amp; Middleware</a>
      <a href='/guide/testing' class='nav-link'>Testing →</a>
    </div>
