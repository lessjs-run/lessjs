---
title: 'Island 深度指南'
section: 'Principles'
label: 'Island Deep Dive'
order: 50
---

<less-layout
locale=
locales=
navItems=
headerNav=
currentPath=/architecture/islands-deep`}

    <h1>Island 深度指南</h1>
    <p class='subtitle'>
      Island 是 LessJS 中唯一允许的客户端 JavaScript 单元。本页深入讲解 Island
      的三层架构、升级策略、声明式事件绑定和数据传递机制。
    </p>
    <h2>Island 架构原理</h2>
    <p>
      LessJS 的 Island 是对 Custom Element Upgrade 机制的诚实利用。浏览器解析 HTML 时看到 
      <span class='inline-code'>&lt;my-counter&gt;</span>，稍后加载模块调用 
      <span class='inline-code'>customElements.define()</span>，已有元素被升级--这就是 Island
      的全部原理。关于 DSD 渲染模型和为什么选择 DSD-first，参见 
      <a href=/architecture/dsd`}>DSD 渲染架构</a>。
    </p>
    <h2>三层 Island 架构</h2>
    <div class='layer-card'>
      <div class='layer-tag'>Layer 1 - dsd-static</div>
      <h3>无 JS，纯 DSD</h3>
      <p>
        导航栏、文章内容、页脚等纯展示组件。SSG 输出完整 DSD HTML，客户端不加载任何
        JavaScript。组件即使永远不会被 customElements.define()
        升级，内容也始终可见且样式完整。
      </p>
    </div>
    <div class='layer-card'>
      <div class='layer-tag'>Layer 2 - dsd-interactive</div>
      <h3>DSD + 事件绑定</h3>
      <p>
        需要交互但状态简单的组件。SSR 输出完整 DSD（首屏可见），客户端加载模块后检测已有
        shadow root，跳过 render()，只绑定声明的事件处理器。
      </p>
    </div>
    <div class='layer-card'>
      <div class='layer-tag'>Layer 3 - pure-island</div>
      <h3>框架完全拥有 Shadow Root</h3>
      <p>
        需要完整框架响应性的组件：本地状态、定时器、轮询、WebSocket。SSR 只输出标签和
        data-ssr-props，不输出 DSD 模板。客户端框架创建 shadow root 并完全控制渲染。
      </p>
    </div>
    <h2>升级策略</h2>
    <p>
      Island 的 strategy 控制客户端模块何时加载并注册。策略在 defineIsland()
      调用时声明，构建器通过 island manifest 传递到客户端 entry。
    </p>
    <div class='strategy-grid'>
      <div class='strategy-item'>
        <div class='strat-name'>
          <code>client:load</code>
        </div>
        <p>客户端入口加载后立即导入模块。适用于首屏交互组件（导航、主题切换）。</p>
      </div>
      <div class='strategy-item'>
        <div class='strat-name'>
          <code>client:idle</code>
        </div>
        <p>延迟到 requestIdleCallback 注册。默认策略，适用于非紧急交互组件。</p>
      </div>
      <div class='strategy-item'>
        <div class='strat-name'>
          <code>visible</code>
        </div>
        <p>
          使用 IntersectionObserver 延迟到元素进入视口前 200px
          注册。适用于折叠内容、评论区等不在首屏的组件。
        </p>
      </div>
    </div>
    <h2>Speculative Loading</h2>
    <p>
      LessJS 在 SSG 后处理阶段生成 per-page island manifest，列出每个页面上实际出现的 island
      及其 chunk URL 和策略。运行时只加载当前页面用到的 island chunk。
    </p>
    <h2>bindEvents() 声明式事件绑定</h2>
    <p>
      Layer 2 组件使用 bindEvents() 声明式绑定事件。DSD 已经渲染了 DOM，render() 返回
      nothing。bindEvents() 告诉适配器哪些 DOM 事件需要手动绑定。事件监听器通过
      AbortController 管理，组件断开时自动清理。
    </p>
    <h2>data-ssr-props 机制</h2>
    <p>
      SSR 渲染时，组件的属性值被序列化为 JSON 并写入 data-ssr-props
      属性。客户端升级时，bindEvents() 自动解析并恢复这些属性值，确保 SSR 和客户端状态一致。
    </p>
    <h2>最佳实践</h2>
    <p>
      1. 从 Layer 1 开始。大部分展示性组件永远不需要离开 Layer 1。
      <br />2. 用 CSS 优先于 JavaScript。hover、focus、响应式布局等 CSS 就能解决。
      <br />3. 保持 Island 小且独立。多个小 Island 比一个大 Island 更容易理解和优化。
      <br />4. client:visible 策略优先于 client:idle。对于不在首屏的组件更精确。
      <br />5. 注意 data-ssr-props 大小。大型数据集应通过 fetch 在客户端获取。
      <br />6. DSD hydration 检测：在客户端 hydrate 时自动检测已有 shadow root，避免 DOM 重复渲染。
    </p>
    <div class='nav-row'>
      <a href=/architecture/dsd`} class='nav-link'>← DSD 渲染架构</a>
      <a href=/api/reference`} class='nav-link'>RPC 远程调用 →</a>
    </div>
