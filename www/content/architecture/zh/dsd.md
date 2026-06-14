---
title: 'DSD 渲染架构'
section: 'Principles'
label: 'DSD Rendering'
order: 30
---

<open-layout
        locale="$"
        locales='$'
        nav-items='$'
        header-nav='$'
        current-path="/$/architecture/dsd"
      >

          <h1>DSD 渲染架构</h1>
          <p class="subtitle">
            Declarative Shadow DOM 是 openElement 的核心渲染模型：服务端输出标准 HTML，浏览器在解析阶段创建
            shadow root，JavaScript 只负责后续升级和必要事件绑定。v0.20 起，DSD 组件默认以
            OpenElement + StyleSheet 实现。
          </p>

          <h2>什么是 DSD</h2>
          <p>
            DSD 是 WHATWG HTML 中的 template 语义，核心属性是 <code>shadowrootmode</code>。它允许 HTML
            直接携带 shadow root 内容，使服务端渲染的 Web Components 在 JS 加载前已经可见。
          </p>
          <open-code-block><pre><code>&lt;my-card&gt;

&lt;template shadowrootmode="open"&gt;
&lt;style&gt;:host &lt;/style&gt;
&lt;p&gt;内容在 JavaScript 加载前可见。&lt;/p&gt;
&lt;/template&gt;
&lt;/my-card&gt;</code></pre></open-code-block>

          <h2>为什么 openElement 选择 DSD</h2>
          <div class="comparison">
            <div class="comparison-item">
              <h3>传统 hydration</h3>
              <ul>
                <li>客户端通常需要恢复整棵组件树。</li>
                <li>容易出现 mismatch、重复渲染或交互丢失。</li>
                <li>常依赖框架私有标记。</li>
              </ul>
            </div>
            <div class="comparison-item less">
              <h3>DSD-first</h3>
              <ul>
                <li>HTML 解析阶段已有 shadow root。</li>
                <li>Custom Element upgrade 只激活已有 host。</li>
                <li>输出接近平台语义，便于 SSG 和缓存。</li>
              </ul>
            </div>
          </div>

          <h2>WHATWG DSD 属性</h2>
          <table>
            <thead><tr><th>属性</th><th>openElement 选项</th><th>用途</th></tr></thead>
            <tbody>
              <tr><td><code>shadowrootmode</code></td><td>固定输出 open</td><td>启用声明式 shadow root。</td></tr>
              <tr><td><code>shadowrootdelegatesfocus</code></td><td><code>delegatesFocus</code></td><td>焦点委托。</td></tr>
              <tr><td><code>shadowrootslotassignment</code></td><td><code>slotAssignment</code></td><td>slot 分配策略。</td></tr>
              <tr><td><code>shadowrootclonable</code></td><td><code>clonable</code></td><td>允许 clone 时保留 shadow root。</td></tr>
              <tr><td><code>shadowrootserializable</code></td><td><code>serializable</code></td><td>允许序列化 shadow root。</td></tr>
              <tr><td><code>shadowrootcustomelementregistry</code></td><td><code>customElementRegistry</code></td><td>为 scoped registry 方向预留语义。</td></tr>
            </tbody>
          </table>

          <h2>三层组件模型</h2>
          <table>
            <thead><tr><th>层级</th><th>类型</th><th>客户端 JS</th><th>适合场景</th></tr></thead>
            <tbody>
              <tr><td>Layer 1</td><td><code>dsd-static</code></td><td>无</td><td>布局、导航、文章内容。</td></tr>
              <tr><td>Layer 2</td><td><code>dsd-interactive</code></td><td>只绑定事件</td><td>主题切换、折叠、tabs。</td></tr>
              <tr><td>Layer 3</td><td><code>pure-island</code></td><td>完整客户端逻辑</td><td>图表、复杂表单、WebSocket。</td></tr>
            </tbody>
          </table>

          <h2>边界</h2>
          <p>
            DSD 不是"任意组件 SSR"的保证。组件如果依赖浏览器布局、全局 DOM、副作用、timer 或第三方脚本，
            就必须降级为 pure island，或通过 manifest 明确声明 SSR/fallback 行为。
          </p>
          <p>
            openElement 应通过 Playwright 验证目标浏览器行为。旧浏览器 polyfill 只能作为降级路径，不能替代真实浏览器验证。
          </p>

          <h2>Reactive DSD（v0.21）</h2>
          <p>
            OpenElement + Signals 让 Ocean 组件获得零框架响应式。
            一个 <code>signal(0)</code> 驱动计数器，一个 <code>computed()</code> 驱动过滤器——
            不需要 Lit、React 或任何框架运行时。
          </p>
          <reactive-showcase></reactive-showcase>

          <div class="nav-row">
            <a href="/$/architecture/architecture" class="nav-link">&larr; $</a>
            <a href="/$/architecture/islands" class="nav-link">$ &rarr;</a>
            <a href="/$/architecture/standards-registry" class="nav-link">$ &rarr;</a>
          </div>
