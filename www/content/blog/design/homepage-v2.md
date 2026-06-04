---
title: 'Homepage v2 Redesign'
date: '2026-05-12'
type: 'post'
tags: ['design', 'homepage']
draft: false
excerpt: 'Design concept for the LessJS homepage redesign — hero code comparison, feature cards, use cases, architecture diagram, live demo.'
---

## Motivation

The original homepage was text-heavy with no visual demonstration of DSD or the build pipeline. Visitors couldn't see "what LessJS produces" within 3 seconds of landing.

## Design Changes

### Hero
- Black background, full-width (breaks out of less-layout container)
- Tagline: "html before javascript" / "html 先于 javascript 存在"
- Side-by-side code comparison: Lit component vs SSG output HTML
- Stats bar: v0.13, 268 tests, 10 packages, 0 runtime deps

### Core Model (3 cards)
- DSD Rendering
- Island Upgrade
- Static by Default

### Use Cases (4 column grid)
- Documentation (dogfooding)
- Blogs
- Content Sites
- Lightweight APIs

### Package Architecture
- Inline SVG diagram showing app → adapter-vite/content+i18n/adapter-lit+ui → core
- Replaces the old prose-heavy "What LessJS Is / Is Not" section

### Live Demo
- Counter Island showing 0KB JS loaded state
- Side-by-side with the raw DSD HTML the browser sees
- Demonstrates "HTML before JS" concretely

### CTA
- Single command: `deno run -A jsr:@openelement/create my-app`
- Requirements line

## Implementation Notes
- Uses existing `<open-code-block>` for syntax highlighting (no hardcoded colors)
- Uses existing `<open-layout>` for nav and footer
- Full-width hero via `width: 100vw; margin-left: calc(-50vw + 50%);`
- Code examples defined as template strings at module scope for i18n reuse
