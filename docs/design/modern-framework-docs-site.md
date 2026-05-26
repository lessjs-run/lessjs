# Modern Framework Docs Site Structure

> Status: DRAFT\
> Version line: v0.23.x\
> Scope: `www` information architecture, routes, content model, and visual design\
> References: [v0.app home](https://v0.app/),
> [v0 docs](https://v0.app/docs),
> [v0 design mode](https://v0.app/docs/design-mode)

## Goal

Rethink the LessJS public site as a modern JavaScript full-stack framework docs
experience.

The site should do three jobs at once:

1. Teach LessJS quickly to a new user.
2. Prove the framework through real rendered artifacts.
3. Make the architecture and release truth visible to contributors.

The reference point is not to copy v0's visual language. The useful lesson from
v0 is the product structure: a direct creation surface, template/examples as
first-class content, live preview feedback, design-system awareness, and a clear
path from idea to deploy. LessJS should adapt those patterns to a framework docs
site centered on DSD, Web Components, SSG, package boundaries, and gates.

## Reference Takeaways

| Reference pattern                 | What to learn                            | What LessJS should do differently                                  |
| --------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| Prompt-first creation surface     | start from user intent, not a long pitch | use command-first and artifact-first entry points                  |
| Templates and examples            | examples are navigational anchors        | use generated LessJS projects, DSD components, and Hub packages    |
| Live preview plus design controls | visual feedback builds trust             | show DSD output, build reports, route graphs, and component states |
| Design-system section             | tokens and reuse matter                  | expose LessJS UI tokens, CSS Parts, and component anatomy          |
| Agentic workflow language         | users want an end-to-end path            | show create -> develop -> build -> inspect -> deploy               |
| Docs with role/use-case grouping  | users enter from different jobs          | support learner, builder, maintainer, and package-author paths     |

## Site Thesis

LessJS should present itself as:

> A DSD-first Web Components app framework with static output, progressive
> islands, Hono routes, and architecture gates that make package behavior
> deterministic.

The first impression should be operational, not decorative. The user should see
what LessJS produces:

- rendered DSD HTML;
- island upgrade metadata;
- package graph status;
- generated project file tree;
- build manifest and DSD report;
- live component preview.

## Proposed Top-Level Routes

```text
/
/docs
/docs/get-started
/docs/concepts
/docs/concepts/dsd
/docs/concepts/islands
/docs/concepts/routing
/docs/concepts/content
/docs/concepts/i18n
/docs/concepts/api-routes
/docs/guides
/docs/guides/create-project
/docs/guides/build-and-preview
/docs/guides/deploy
/docs/guides/testing
/docs/reference
/docs/reference/config
/docs/reference/core
/docs/reference/runtime
/docs/reference/app
/docs/reference/adapter-vite
/docs/reference/protocols
/docs/reference/cli
/examples
/examples/gallery
/examples/dsd
/examples/islands
/examples/content-blog
/examples/i18n
/examples/api-routes
/examples/deployments
/components
/components/ui
/components/tokens
/components/anatomy
/components/states
/architecture
/architecture/overview
/architecture/package-graph
/architecture/runtime-kernel
/architecture/protocols
/architecture/adapter-vite
/architecture/release-gates
/hub
/hub/packages
/hub/packages/:package
/hub/packages/:package/:component
/roadmap
/changelog
/decisions
/decisions/:slug
/blog
/blog/:slug
/community
/contributing
```

The current site already has `guide`, `engine`, `registry`, `decisions`,
`blog`, `roadmap`, and `changelog` routes. The change is mostly a content
architecture cleanup: present these routes as a coherent product surface rather
than separate historical sections.

## Navigation Model

Use a stable top navigation with seven items:

| Item         | Route           | Role                               |
| ------------ | --------------- | ---------------------------------- |
| Home         | `/`             | proof-first overview               |
| Docs         | `/docs`         | learning path and task docs        |
| Examples     | `/examples`     | live outputs and source            |
| Components   | `/components`   | LessJS UI, tokens, CSS Parts       |
| Architecture | `/architecture` | package graph and decisions        |
| Hub          | `/hub`          | package evidence and compatibility |
| Roadmap      | `/roadmap`      | shipped/planned/deferred truth     |

Secondary navigation should be section-local:

- Docs: Start, Concepts, Guides, Reference.
- Examples: DSD, Islands, Content, i18n, API, Deploy.
- Architecture: Overview, Package graph, Runtime kernel, Protocols, Adapter,
  Gates.
- Components: UI, Tokens, Anatomy, States.
- Hub: Packages, Compatibility, Submit, Trust policy.

## Home Page Structure

The home page should be a framework console, not a traditional SaaS landing
page.

### First Viewport

Layout:

```text
left:  product identity, command, current status, primary actions
right: live artifact panel with tabs
bottom: proof strip visible before scroll
```

Required content:

- title: `LessJS`
- one-line definition;
- create command;
- current version line;
- shipped status chips;
- two primary actions: `Start building`, `Read architecture`;
- artifact panel tabs:
  - DSD output;
  - package graph;
  - build report;
  - generated project.

Do not use a generic illustration here. The visual should be a real artifact.

### Proof Strip

Use compact horizontal proof modules:

| Module    | Shows                                                         |
| --------- | ------------------------------------------------------------- |
| DSD       | sample `<template shadowrootmode="open">` output              |
| Islands   | `client:load`, `client:idle`, `client:visible`, `client:only` |
| SSG       | route count, output files, build manifest                     |
| Hono API  | route handler snippet and response shape                      |
| Protocols | graph gate status                                             |
| Hub       | compatibility badge examples                                  |

### Body Sections

1. `Build path`: create -> route -> component -> island -> build -> deploy.
2. `What makes LessJS different`: DSD-first, Web Components, package evidence.
3. `Live examples`: preview/source/output/status quadrants.
4. `Architecture truth`: package graph and ADR/SOP links.
5. `Roadmap truth`: shipped, current, planned, deferred.

## Docs Content Organization

Docs should be task-first at the top and architecture-aware underneath.

### `/docs`

The docs landing page should present four entry paths:

| Path               | Audience           | Starts with                            |
| ------------------ | ------------------ | -------------------------------------- |
| Build an app       | app developers     | create project, routes, DSD component  |
| Learn the engine   | framework learners | DSD, islands, render pipeline          |
| Integrate packages | package authors    | manifest, compatibility, Hub evidence  |
| Maintain LessJS    | contributors       | package graph, ADR, SOP, release gates |

### Start

```text
/docs/get-started
/docs/guides/create-project
/docs/guides/build-and-preview
/docs/guides/deploy
```

These pages should use a "do the thing" format:

1. goal;
2. command;
3. expected file tree;
4. generated code;
5. build output;
6. next step.

### Concepts

Concept pages explain mental models:

```text
/docs/concepts/dsd
/docs/concepts/islands
/docs/concepts/routing
/docs/concepts/content
/docs/concepts/i18n
/docs/concepts/api-routes
```

Each concept page should contain:

- one paragraph definition;
- where it lives in the package graph;
- minimal source;
- generated output;
- constraints and non-goals;
- related reference pages.

### Guides

Guides should be workflow-based:

```text
/docs/guides/create-project
/docs/guides/add-a-dsd-component
/docs/guides/add-an-island
/docs/guides/add-content
/docs/guides/add-i18n
/docs/guides/add-api-route
/docs/guides/build-and-preview
/docs/guides/deploy
/docs/guides/testing
```

### Reference

Reference pages should be dense and predictable:

```text
/docs/reference/config
/docs/reference/core
/docs/reference/runtime
/docs/reference/app
/docs/reference/adapter-vite
/docs/reference/protocols
/docs/reference/cli
/docs/reference/package-manifest
/docs/reference/compatibility-report
```

Each reference page should use the same structure:

1. import path;
2. package owner;
3. stability;
4. API table;
5. examples;
6. errors;
7. related gates.

## Architecture Section

Architecture should be public, not hidden in ADRs.

```text
/architecture
/architecture/overview
/architecture/package-graph
/architecture/runtime-kernel
/architecture/protocols
/architecture/adapter-vite
/architecture/release-gates
```

### Architecture Landing

Layout:

- left: layer diagram;
- right: package ownership table;
- below: "why this exists" explanations.

Required modules:

- package graph visualization;
- no-backward-compatibility note for v0.23 architecture work;
- current graph gate output;
- ADR-0050 summary;
- SOP v0.23 execution map.

## Examples and Templates

v0's strongest site pattern is that templates are not secondary. LessJS should
make examples equally first-class.

```text
/examples
/examples/gallery
/examples/dsd
/examples/islands
/examples/content-blog
/examples/i18n
/examples/api-routes
/examples/deployments
```

Every example page should use a four-panel layout:

| Panel   | Content                               |
| ------- | ------------------------------------- |
| Preview | actual rendered component/page        |
| Source  | key source files                      |
| Output  | generated DSD/build artifact          |
| Status  | SSR/DSD/island/package classification |

Examples should be runnable and link back to generated project files.

## Components Section

The component section should be a design-system surface for LessJS UI.

```text
/components
/components/ui
/components/tokens
/components/anatomy
/components/states
```

Required views:

- component gallery;
- token table;
- CSS Parts table;
- interactive states;
- SSR output snippet;
- island upgrade example if relevant.

This section should look more visual than reference docs but remain dense and
inspectable.

## Hub Section

The Hub should look like package evidence, not a marketplace brochure.

```text
/hub
/hub/packages
/hub/packages/:package
/hub/packages/:package/:component
/hub/submit
/hub/trust-policy
```

Package cards should show:

- compatibility tier;
- SSR/DSD/client-only status;
- manifest validation;
- snapshot status;
- size and hydration metadata;
- last verified date;
- install/add command.

## Content Data Model

Move toward structured content instead of hand-written page islands everywhere.

Recommended content model:

```text
www/content/docs/*.md
www/content/examples/*.md
www/content/components/*.md
www/content/architecture/*.md
www/content/blog/*.md
www/content/changelog/*.md
```

Frontmatter:

```yaml
title: DSD rendering
description: Render Web Components with Declarative Shadow DOM.
section: Concepts
status: shipped
version: 0.23.x
packageOwner: '@lessjs/core'
related:
  - /architecture/runtime-kernel
  - /docs/reference/core
```

Generated route data should power:

- left navigation;
- page status chips;
- related links;
- search index;
- sitemap;
- docs freshness checks.

## Page Templates

### Learning Page

Use for concepts and guides.

```text
header: title, summary, status, owner
body: explanation, runnable snippet, output
aside: on this page, related, package owner
footer: previous/next
```

### Reference Page

Use for API surfaces.

```text
header: package, import path, stability
body: API tables, examples, errors
aside: owner, version, gates
footer: changelog links
```

### Artifact Page

Use for examples and component previews.

```text
header: example name, status, command
main: preview/source/output/status
footer: related guide and package links
```

### Architecture Page

Use for package and decision pages.

```text
header: decision summary, current status
main: diagram, ownership table, reasoned narrative
aside: ADR/SOP links, gates, affected packages
```

## Visual Direction

The site should feel modern but not AI-generic.

### Layout

- dense top navigation;
- no oversized empty hero;
- full-width bands for major sections;
- constrained reading columns for docs;
- split artifact panels only when the artifact is real;
- sticky sidebars on desktop;
- bottom nav and collapsible outline on mobile.

### Surface Language

Use:

- thin borders;
- subtle elevation only for interactive tools;
- 6-8px radius;
- monospaced artifact panels;
- status chips;
- tabs for artifact modes;
- segmented controls for output/source/preview.

Avoid:

- nested cards;
- glassmorphism as default;
- decorative gradient blobs;
- pure marketing icon grids;
- generic AI-generated dashboard mockups.

### Palette

Use a neutral technical base plus semantic accents.

| Role    | Use                                      |
| ------- | ---------------------------------------- |
| neutral | page background, docs surface, borders   |
| ink     | headings, body text, code labels         |
| accent  | active nav, links, focused controls      |
| success | shipped, passing gates, SSR-ready        |
| warning | planned, deferred, experimental          |
| danger  | rejected, failed gate, unsafe package    |
| info    | architecture notes and package ownership |

Do not let one hue dominate the full page. The identity should come from
artifacts, not color tricks.

### Typography

- use one strong sans font for UI and prose;
- use a crisp monospace for code and artifact panels;
- keep docs body text comfortable, not oversized;
- use compact headings inside panels;
- avoid negative letter spacing.

### Motion

Motion should explain state:

- tab transitions;
- preview/source switch;
- build step progress;
- route graph reveal;
- search result filtering.

No ambient decorative motion is needed.

## Search and Discovery

The search experience should be framework-aware.

Search result types:

- docs page;
- API reference;
- package;
- component;
- ADR;
- SOP;
- example;
- changelog entry.

Each result should show:

- title;
- section;
- status;
- package owner when available;
- short snippet;
- route.

## Mobile Structure

Mobile should preserve docs utility:

- top bar with search and section menu;
- collapsible left nav;
- sticky page actions only when useful;
- artifact panels switch to stacked tabs;
- code blocks scroll horizontally;
- status chips wrap cleanly.

Do not hide architecture status on mobile. The current version line and shipped
versus planned labels must remain visible.

## Migration From Current Routes

| Current route family     | Proposed destination                               |
| ------------------------ | -------------------------------------------------- |
| `/guide/*`               | `/docs/guides/*` and `/docs/concepts/*`            |
| `/engine/*`              | `/architecture/*` plus selected `/docs/concepts/*` |
| `/engine/reference/core` | `/docs/reference/core`                             |
| `/registry/*`            | `/hub/*`                                           |
| `/decisions/*`           | `/decisions/*`, linked from `/architecture`        |
| `/roadmap`               | keep as top-level route                            |
| `/changelog`             | keep as top-level route                            |
| `/blog/*`                | keep as top-level route                            |

This can be implemented gradually with redirects or route aliases during the
site migration. The content model should move first, then the route tree.

## Implementation Order

1. Add content metadata model for docs/examples/components/architecture.
2. Build new docs shell with top nav, left nav, right outline, and search.
3. Create `/architecture` landing from `docs/arch/current-architecture.md`.
4. Rework home page into artifact-first console.
5. Move `engine/*` content into architecture and concepts.
6. Move `guide/*` into docs concepts/guides/reference.
7. Rebrand `registry/*` as Hub package evidence.
8. Add examples gallery with preview/source/output/status layout.
9. Add component gallery and token/CSS Parts views.
10. Add route redirects and remove obsolete nav labels.

## Acceptance Criteria

- A new user can reach "create project" within one click from the home page.
- A technical evaluator can understand DSD, islands, package graph, and release
  gates within five minutes.
- Every major page distinguishes shipped, planned, deferred, and experimental.
- Examples show real preview, source, output, and status.
- Architecture is public and linked from top navigation.
- The site does not look like a generic AI landing page.
- The design uses real LessJS artifacts as the primary visual language.
