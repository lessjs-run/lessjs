# www/ Site Architecture

> **Hardened**: v0.26.0 | **Last audit**: 2026-05-29

## Site Map

```
lessjs.org
├── /                          Homepage (index/index.tsx)
│
├── /guide/                    Tutorials (10 pages)
│   ├── getting-started        Installation + first project
│   ├── core-concepts          JSX + static props + signals
│   ├── routing-and-data       File-based routing + SSG + data
│   ├── islands-and-ssr        Islands + DSD + hydration strategies
│   ├── deployment             Build + deploy + PWA
│   ├── api                    API routes (Hono)
│   ├── architecture           Framework design overview
│   ├── configuration          lessPipeline() config reference
│   ├── error-handling         Error boundaries + patterns
│   └── testing                Unit + integration testing
│
├── /api/                      API Reference (2 pages)
│   ├── reference              Core API by category (Components, Rendering, Islands, Signals, Build, SSR)
│   └── term                   API terminal playground
│
├── /architecture/             Architecture Deep Dives (9 pages)
│   ├── architecture           Framework design principles
│   ├── dsd                    Declarative Shadow DOM rendering
│   ├── islands                Island architecture deep dive
│   ├── islands-deep           Island internals + lifecycle
│   ├── comparison             Framework comparison
│   ├── design-system          Open Props + semantic tokens
│   ├── benchmark              Performance + build characteristics
│   ├── package-compatibility  WC compatibility admission
│   └── standards-registry     Standards compliance registry
│
├── /blog/                     Blog (2 pages)
│   ├── index                  All posts
│   └── [slug]                 Individual post
│
├── /registry/                 Registry Hub (3 pages)
│   ├── index                  All packages
│   ├── [package]              Package detail
│   └── [package]/[component]  Component detail
│
├── /hub/                      Hub Index (1 page)
│   └── index
│
├── /docs/                     Documentation Index (1 page)
│   └── index
│
├── /zh/                       i18n Placeholder
│   └── (reserved for Chinese content)
│
├── /changelog                 Version history
├── /roadmap                   Future plans
├── /contributing              Contribution guide
└── /404                       Not found
```

## Section Rules

### guide/

- Target: framework users learning LessJS
- Tone: tutorial, step-by-step, code-first
- Must: show working examples, link to next/prev page
- Must not: discuss internal implementation details

### api/

- Target: developers looking up API signatures
- Tone: reference, terse, type-signature-first
- Must: group by category, show signature + one-liner

### architecture/

- Target: advanced users and framework authors
- Tone: explanatory, principled, comparison-heavy
- Must: explain "why", not just "how"
- May: reference ADRs and SOPs

### blog/

- Target: community, releases, case studies
- Content: auto-generated from `content/blog/`

### registry/ + hub/

- Target: package consumers
- Content: auto-generated from hub data

## Navigation

### Top Nav (headerNav)

- Guide (/guide/getting-started) — tutorials
- API (/guide/reference) — API reference
- Architecture (/architecture/architecture) — deep dives
- Hub (/registry) — package registry
- Blog (/blog) — blog

### Sidebar Sections (navSections)

- **Quick Start, Core, Production** → guide/ sidebar (filterDocsNav)
- **Principles, Compatibility, Reference** → architecture/ sidebar (filterArchitectureNav)
- **Registry** → registry/ + hub/ sidebar (filterHubNav)
- **History** → blog/ sidebar (filterBlogNav)

## Page Template

Every page:

```tsx
export const meta = { section: 'Section', label: 'Label', order: N };

export default class PageName extends DsdElement { ... }
export const tagName = 'page-name';
```

## Section Renderers

Each section has `_renderer.ts`:

```ts
export default createSectionRenderer('section-name');
```

Used by SSG to inject edit-url and section-specific layout.

## Anti-Patterns

- ❌ No internal developer docs in www/ (belongs in docs/adr/, docs/sop/)
- ❌ No duplicate content across sections
- ❌ No inline styles (use StyleSheet + openPropsTokenSheet)
- ❌ No LitElement (use DsdElement)
- ❌ No `html\`\`` templates (use JSX)
- ❌ No virtual:less imports in route files (use @lessjs/content/nav)

## New Page Checklist

1. Create `routes/<section>/<name>.tsx`
2. Set `meta` with correct `section`, `label`, `order`
3. Import `@lessjs/content/nav` for nav data
4. Import `openPropsTokenSheet` + use `static styles`
5. Use `less-layout` wrapper
6. Register `customElements.define()`
7. Export `tagName`
8. Update `docs/design/www-architecture.md` (this file)
9. Run `deno task build:docs` — verify no SSG errors
