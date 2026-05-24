# SOP-008: SSG Product Stack Hardening

Status: planned\
Target version: v0.21.3\
Owner: app package, www site, create package

## Objective

Prove that LessJS v0.21.x is already a strong SSG stack for real content sites, especially documentation and blogs.

## Evidence Inputs

- `www/app/`
- `packages/create/`
- starter templates
- docs and blog examples
- Playwright e2e tests
- build output and bundle report

## Problem Statement

The current architecture can support a blog or docs site, but that claim should be proven by a repeatable product path:

- create a project;
- write content routes;
- use DSD components;
- add reactive islands only where needed;
- build static output;
- inspect route/report evidence;
- run browser smoke tests.

This is the practical milestone before Edge Full-Stack. If the SSG path is not excellent, edge features will amplify weakness.

## Scope

Harden the SSG workflow:

- starter project creation;
- content route conventions;
- markdown or content examples if supported;
- DSD-first component authoring;
- island usage;
- asset handling;
- build reports;
- e2e smoke tests;
- deployment notes for static hosting.

## Procedure

1. Create a canonical "blog/docs" example or ensure the existing starter covers it.
2. Include:
   - homepage;
   - index route;
   - article route;
   - component with DSD;
   - one small reactive island;
   - static asset;
   - metadata/head output if supported.
3. Run the generated project build outside the monorepo assumptions.
4. Add e2e smoke tests for navigation, DSD parsing, and island behavior.
5. Document the exact commands a user runs from project creation to deployment.
6. Record bundle and report budgets for the starter.

## Product Quality Bar

The blog/docs starter must feel like the default product path, not a demo:

- no private import paths;
- no unexplained warnings;
- minimal client JavaScript;
- clear route conventions;
- predictable build output;
- working static deployment notes;
- no reliance on edge runtime APIs.

## API Design Rules

- SSG remains the first-class v0.21.x product.
- Blog/docs ergonomics should not force a database, server runtime, or auth layer.
- Islands must be deliberate and visible in reports.
- The starter should teach the stable API only.

## Acceptance Criteria

- A generated blog/docs project builds successfully.
- Browser smoke tests pass on the built static output.
- Starter docs use only stable or clearly experimental APIs.
- Bundle/report budgets are documented.
- The docs site can honestly state that v0.21.x is production-capable for small SSG blogs/docs sites, with caveats.

## Validation Commands

```powershell
git status --short --branch
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
deno task test:e2e
git status --short --branch
```

## Exit Decision

Proceed to SOP-009 when the static-site product path is demonstrably good enough to be the public recommendation for v0.21.x.
