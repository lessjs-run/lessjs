---
title: 'API Routes'
section: 'Core'
label: 'API Routes'
order: 60
---

<less-layout
locale=
locales=
navItems=
headerNav=
currentPath='/guide/api'

    <h1>API Routes</h1>
    <p class='subtitle'>
      LessJS 的服务端层是 Hono。API routes 使用标准 Request/Response 语义，适合部署到
      serverless 或 edge runtime。
    </p>
    <h2>Design Principles</h2>
    <div class='principle'>
      <p>
        <strong>使用平台原语。</strong>优先使用 Fetch、Request、Response 而非框架专有传输。
      </p>
      <p>
        <strong>验证在边界完成。</strong>在业务逻辑看到数据之前，完成请求体的解析和校验。
      </p>
      <p>
        <strong>运行时显式声明。</strong>静态页面可以调用 API，但 API 本身需要 serverless 或
        edge 部署目标。
      </p>
    </div>
    <h2>Create API Routes</h2>
    <p>API routes 放在 app/routes/api。模块默认导出一个 Hono app。</p>
    <h2>Type-Safe RPC</h2>
    <p>
      @lessjs/rpc 提供类型安全的客户端/服务端调用约定。详见 
      <a href='/api/reference'>RPC 远程调用</a>。
    </p>
    <h2>Static Build Boundary</h2>
    <p>
      SSG 输出是静态文件。API routes 是生成的 Hono app
      的一部分，但纯静态托管不会运行它们。当应用需要运行时行为时，通过 serverless adapter
      或平台函数部署 API routes。
    </p>
    <div class='nav-row'>
      <a href='/api/reference' class='nav-link'>← RPC 远程调用</a>
      <a href='/guide/configuration' class='nav-link'>Configuration →</a>
    </div>
