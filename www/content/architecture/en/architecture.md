---
title: Layered Package Architecture
section: Principles
label: Architecture
order: 10
---

<h1>Layered Package Architecture</h1>

<section class="hero">
<div>
<div class="eyebrow">
<span class="chip current">ADR-0050</span>
<span class="chip current">v0.23.0</span>
<span class="chip pass">graph gate passing</span>
</div>
<p class="lede">
LessJS is now organized around explicit package ownership:
protocols own shared contracts, core stays the runtime kernel,
runtime owns authoring imports, app owns configuration, and
adapter-vite owns Vite implementation.
</p>
</div>
<div class="artifact">
<div class="artifact-head">
<strong>package graph sketch</strong>
<span>source imports declared per package</span>
</div>
<pre><code>create -> "no source deps, just generates"
hub -> "no LessJS deps: scans npm packages"
ui -> core, style-sheet
core -> style-sheet, signals
app -> core
rpc -> core, hub
i18n -> protocols
content -> protocols
adapter-lit -> core, signals, style-sheet
adapter-vanilla -> core, signals, style-sheet
adapter-react -> core, react, signals
adapter-vite -> core, adapter-lit, adapter-vanilla, adapter-react
protocols -> "no deps"
runtime -> core, ui, app, signals, adapter-lit, adapter-vanilla, adapter-react
style-sheet -> "no deps"
cem -> compat-check -> hub
content -> adapter-vite -> app</code></pre>
</div>
</section>

<section class="section">
<div class="section-head">
<div>
<p class="kicker">layers</p>
<h2>Dependency direction is part of the API.</h2>
</div>
<p class="section-copy">
v0.23.0 makes package responsibility inspectable. Feature
packages use protocols for shared build contracts instead of
adapter internals, and ordinary users write components from the
runtime facade.
</p>
</div>
<div class="layer-map">
<div class="layer"><strong>tools and gates</strong><span>create, graph checker, publish workflow, smoke tests</span><p>Prove generated users, release order, and docs truth.</p></div>
<div class="layer"><strong>product facades</strong><span>@lessjs/core, @lessjs/app</span><p>Separate authoring imports from configuration assembly.</p></div>
<div class="layer"><strong>build adapters</strong><span>@lessjs/adapter-vite</span><p>Own Vite plugin assembly, route scanning, SSG phases, and generated entries.</p></div>
<div class="layer"><strong>feature packages</strong><span>content, i18n, hub, ui, cem, compat-check</span><p>Own product features and evidence surfaces without routing through core.</p></div>
<div class="layer"><strong>runtime kernel</strong><span>@lessjs/core</span><p>Own DSD runtime, templates, renderDsd, islands, navigation, logger, and errors.</p></div>
<div class="layer"><strong>protocols</strong><span>@lessjs/protocols</span><p>Own dependency-light shared build contracts and virtual ids.</p></div>
</div>
</section>

<section class="section">
<div class="section-head">
<div>
<p class="kicker">why it exists</p>
<h2>Small core, honest facades.</h2>
</div>
<p class="section-copy">
The framework can only grow if users, contributors, and release
automation agree about which package owns each concept.
</p>
</div>
<div class="cards">
<div class="card">
<h3>Why protocols?</h3>
<p>Content, i18n, and adapter-vite need shared build contracts. Those contracts are not Vite implementation and should not live under adapter-vite.</p>
</div>
<div class="card">
<h3>Why runtime?</h3>
<p>Generated components need a single authoring import. Runtime provides that without turning core into an all-purpose DX barrel.</p>
</div>
<div class="card">
<h3>Why signals facade?</h3>
<p>LessJS uses alien-signals as the engine. The public LessJS contract is .value, subscribe(), and DSD integration semantics.</p>
</div>
</div>
</section>

<section class="section">
<div class="section-head">
<div>
<p class="kicker">release gates</p>
<h2>The architecture is checked mechanically.</h2>
</div>
<p class="section-copy">
The root import map can hide missing dependencies during local
development. The graph gate checks package-local truth before
publishing.
</p>
</div>
<div class="gate-grid">
<div class="gate"><strong>0 cycles</strong><span>Internal LessJS package dependencies must remain acyclic.</span></div>
<div class="gate"><strong>18 packages</strong><span>Every package in packages/ must be present in the publish workflow.</span></div>
<div class="gate"><strong>direct imports</strong><span>Each source-level @lessjs/* import must be declared in that package's deno.json.</span></div>
<div class="gate"><strong>0.23.0</strong><span>Unified version releases keep JSR packages resolvable as one set.</span></div>
</div>
</section>

<nav class="nav-row">
<a class="nav-link" href="/roadmap">Roadmap truth -></a>
<a class="nav-link" href="/changelog">Changelog -></a>
<a class="nav-link" href="/guide/getting-started">Start building -></a>
</nav>
