# WWW Layout and Art Direction

> Status: DRAFT\
> Version line: v0.23.x\
> Scope: public website, docs shell, examples, and framework demonstration

## Problem

The website should prove the framework by being a serious LessJS application,
not just describing LessJS. The current architecture work creates a better
technical story, but the public `www` surface also needs a clearer design
system:

- explain the DSD-first product center without a generic framework landing
  page;
- make package boundaries, roadmap, examples, and docs easy to scan;
- show actual rendered Web Components, reports, and generated output;
- avoid visual noise that makes the project look less rigorous than the code.

## Design Position

LessJS should feel like infrastructure for people building Web Components with
deterministic output.

The design tone should be:

| Quality   | Meaning                                                          |
| --------- | ---------------------------------------------------------------- |
| precise   | tables, metrics, status chips, build artifacts, real outputs     |
| calm      | restrained color, readable spacing, low animation pressure       |
| technical | examples, package maps, reports, import paths, validation states |
| visual    | real component previews, DSD output, diagrams, screenshots       |
| credible  | shipped/planned/deferred labels are always visible               |

Avoid:

- oversized generic hero sections;
- abstract gradients as the primary visual identity;
- card piles that repeat the same message;
- "full-stack magic" claims before v0.24 proves them;
- design that hides the framework's actual outputs.

## Information Architecture

The first viewport should answer four questions without scrolling deeply:

1. What is LessJS?
2. What is already shipped?
3. What is the current architecture direction?
4. Where do I start?

Recommended top-level navigation:

| Nav item     | Purpose                                         |
| ------------ | ----------------------------------------------- |
| Overview     | product center, current version, shipped proof  |
| Docs         | authoring, routing, DSD, islands, content, i18n |
| Architecture | package layers, ADR/SOP links, graph gates      |
| Components   | live DSD UI and island examples                 |
| Hub          | package discovery and compatibility evidence    |
| Roadmap      | shipped/planned/deferred version lines          |

## Page Layout Model

### Home

Use the first viewport as a working product dashboard, not a marketing hero.

Required regions:

- project identity and one-sentence definition;
- current version line and status;
- primary actions for docs and create command;
- compact proof strip: SSG, DSD, islands, Hono routes, Reactive DSD, graph gate;
- visible start of the next section on desktop and mobile.

The main visual should be a real framework artifact:

- DSD HTML output;
- package graph;
- build manifest;
- component preview;
- generated project file map.

### Docs Shell

Docs should optimize repeated technical reading:

- left navigation for topics;
- right mini-outline for long pages;
- stable content width;
- version/status badges near page titles;
- copyable import paths and commands;
- no decorative cards around every section.

### Architecture Page

The architecture page should be a first-class public artifact.

Required sections:

- package layer diagram;
- dependency direction rules;
- why `@openelement/protocols` exists;
- why `@openelement/core` is the runtime kernel;
- why `@openelement/signals` wraps `alien-signals`;
- current gates that enforce the architecture.

### Component and Example Pages

Examples should pair live output with source and build evidence:

| Pane    | Content                                   |
| ------- | ----------------------------------------- |
| Preview | rendered DSD component or island          |
| Source  | minimal component source                  |
| Output  | relevant generated HTML/report/import map |
| Status  | SSR/DSD/island/client-only classification |

## Visual System

Use a restrained but not monochrome palette.

Recommended roles:

- neutral base for reading and code;
- one structural accent for links and active navigation;
- one success color for shipped/proven gates;
- one warning color for planned/deferred scope;
- one danger color for rejected/failed validation.

The public website should not be dominated by purple gradients, dark blue
slate, beige, or ornamental backgrounds. Visual interest should come from real
framework artifacts and component states.

## Art Direction

Preferred visual assets:

- package graph diagrams;
- DSD output snapshots;
- screenshots of generated projects;
- component previews using LessJS UI;
- build report visualizations;
- compatibility badge examples.

Avoid purely atmospheric imagery. If a visual does not teach something about
the framework, it should not be the primary asset.

## Interaction Rules

- Navigation state must be obvious.
- Code copy buttons need clear hover/focus states.
- Component previews should show loading, SSR, upgraded, and error states when
  relevant.
- Roadmap and package status should use status chips, not prose alone.
- Animations should be short and functional; no decorative motion that competes
  with reading.

## Success Criteria

- The home page communicates LessJS as DSD-first infrastructure within one
  viewport.
- The architecture page makes package ownership understandable without reading
  the monorepo.
- Examples show real rendered output and source side by side.
- Shipped, planned, and deferred claims are visually distinct.
- The website itself demonstrates LessJS build artifacts instead of only
  describing them.
