# SOP-006: Open UI Component Contract Alignment

Status: planned\
Target version: v0.21.2\
Owner: ui package and docs

## Objective

Use Open UI as a research and vocabulary baseline for component contracts, not as a claim of formal conformance.

## External Baseline

- Open UI home and purpose: <https://open-ui.org/>
- W3C Open UI Community Group: <https://www.w3.org/groups/cg/open-ui>

## Evidence Inputs

- `packages/ui/src/`
- component examples in `www/`
- CEM output or package metadata
- docs/reference pages for UI components

## Problem Statement

LessJS wants to be a standards-first stack. That requires component APIs that feel native to the web:

- attributes and properties must be named predictably;
- events must be explicit;
- slots and parts must be documented;
- styling hooks should avoid accidental private CSS structure;
- accessibility behavior must be tested for core UI primitives.

Open UI is useful here because it studies common control semantics and styling extension points. It is not a shortcut to product maturity.

## Scope

Apply this SOP to first-party UI components that are part of the public story. Prioritize:

- theme toggle;
- navigation primitives;
- form-like controls if present;
- showcase components used by the docs site.

## Procedure

1. Inventory public UI components.
2. For each component, document:
   - tag name;
   - attributes;
   - properties;
   - events;
   - slots;
   - CSS parts or custom properties;
   - accessibility expectations.
3. Compare naming and behavior with native HTML and Open UI vocabulary where relevant.
4. Add tests for keyboard behavior and accessible names for interactive components.
5. Add CEM metadata checks where component metadata is generated or consumed.
6. Mark unfinished components as internal or experimental.

## Component Contract Template

Each public component should have this minimum contract:

```md
### `<less-example>`

- Status: stable | experimental | internal
- Purpose:
- Attributes:
- Properties:
- Events:
- Slots:
- CSS parts:
- CSS custom properties:
- Accessibility:
- SSR/DSD behavior:
- Hydration/island behavior:
```

## API Design Rules

- Do not expose CSS internals as accidental API.
- Prefer attributes for serializable state and properties for complex runtime state.
- Event payloads must be typed where TypeScript can express them.
- Interactive controls need keyboard and accessibility tests.
- Open UI alignment must be written as "aligned vocabulary" unless a formal spec or test suite exists.

## Acceptance Criteria

- Public UI components have contract docs.
- Interactive components have keyboard and accessibility coverage.
- CSS parts/custom properties are intentional and documented.
- Experimental components are labeled as such.
- Docs avoid claiming formal Open UI conformance without evidence.

## Validation Commands

```powershell
git status --short --branch
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task test:e2e
deno task docs:check-strategy
git status --short --branch
```

## Exit Decision

Proceed to SOP-007 when the first-party UI surface is clean enough to act as the reference implementation for userland components.
