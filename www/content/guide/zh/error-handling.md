---
title: '错误处理'
section: 'Production'
label: 'Error Handling'
order: 30
---

<open-layout
locale=
locales=
navItems=
headerNav=
currentPath='/guide/error-handling'

    <h1>错误处理</h1>
    <p class='subtitle'>
      LessJS 区分框架错误、构建时渲染错误、API 错误和浏览器 island
      故障。目标是在不泄露生产环境内部信息的前提下实现清晰诊断。
    </p>
    <h2>Error Hierarchy</h2>
    <div class='error-hierarchy'>
      LessError |-- NotFoundError 404 |-- UnauthorizedError 401 |-- ForbiddenError 403 |--
      ValidationError 422 |-- ConflictError 409 |-- RateLimitError 429 |-- SsrRenderError 500
      |-- IslandUpgradeError 500
    </div>
    <h2>Operational vs Programming</h2>
    <p>
      LessJS 区分操作错误（not found, validation, rate limit -
      返回结构化状态）和编程错误（render failure, broken import - 构建时失败或开发诊断）。
    </p>
    <h2>Structured Logging</h2>
    <p>
      LessJS 使用 createLogger(scope) 提供带 scope 的分级日志，包括 DEBUG、INFO、WARN、ERROR
      级别。
    </p>
    <div class='nav-row'>
      <a href='/guide/security-middleware' class='nav-link'>← 安全与 Middleware</a>
      <a href='/guide/testing' class='nav-link'>Testing →</a>
    </div>
