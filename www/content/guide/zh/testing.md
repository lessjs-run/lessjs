---
title: '测试'
section: 'Production'
label: 'Testing'
order: 40
---

<open-layout
locale=
locales=
navItems=
headerNav=
currentPath='/guide/testing'

    <h1>测试</h1>
    <p class='subtitle'>
      LessJS 测试应保护框架契约：路由扫描、DSD 输出、island 元数据、middleware 范围、SSG
      后处理和包边界。
    </p>
    <h2>项目测试</h2>
    <p>
      应用代码可以使用 Deno 内置的测试运行器。从纯逻辑和 API handler 的单元测试开始。
    </p>
    <h2>构建冒烟测试</h2>
    <p>
      静态优先框架至少需要一个测试来构建站点并验证生成的 HTML。
    </p>
    <h2>Playwright E2E 测试</h2>
    <p>
      LessJS 包含 Playwright 端到端测试，在真实浏览器中验证 SSG 输出。
    </p>
    <div class='nav-row'>
      <a href='/guide/error-handling' class='nav-link'>← 错误处理</a>
      <a href='/guide/deployment' class='nav-link'>部署 →</a>
    </div>
