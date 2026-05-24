# SOP-002: Template and Reactive Contract Hardening

Status: planned\
Target version: v0.21.1\
Owner: core package and signals package

## Objective

Make `html`, `unsafeHTML`, `DsdElement`, and signal-driven rerendering feel like one clean programming model instead of several adjacent mechanisms.

## Evidence Inputs

- `packages/core/src/template.ts`
- `packages/core/src/dsd-element.ts`
- `packages/core/src/security.ts`
- `packages/core/src/types.ts`
- `packages/signals/`
- `packages/ui/src/`
- focused Reactive DSD tests

## Problem Statement

Reactive DSD is now the center of the framework. The authoring model must therefore be sharp:

- safe templates by default;
- explicit escape hatches;
- deterministic signal subscription and microtask update behavior;
- event/property binding semantics that do not require obsolete `hydrateEvents`;
- server output that remains valid DSD.

Any ambiguity here will become expensive when edge rendering and streaming are added.

## Scope

Harden these contracts:

- `TemplateResult`
- `TemplateValue`
- `html()`
- `unsafeHTML()`
- `collectTemplateSignals()`
- `collectRuntimeTemplateBindings()`
- `applyRuntimeTemplateBindings()`
- `DsdElement`
- `ReactiveHost`
- signal subscription behavior

## Procedure

1. Write a short contract note for template values:
   - primitives are escaped;
   - arrays flatten deterministically;
   - signals render current value and subscribe through `ReactiveHost`;
   - event listeners are runtime bindings, not serialized functions;
   - `unsafeHTML()` is the only raw HTML path.
2. Add or update tests for:
   - nested `TemplateResult`;
   - signal value changes;
   - event binding collection;
   - property binding collection;
   - `unsafeHTML()` containment;
   - URL sanitization in sensitive attributes.
3. Verify that `DsdElement` lifecycle code does not duplicate signal subscription work.
4. Confirm that server-rendered DSD does not leak runtime-only binding objects into HTML.
5. Confirm that UI package components use the same authoring style as examples and generated templates.

## Required Tests

Add focused tests if they do not already exist:

- `html` escapes text, attribute values, and URL-like attributes.
- `unsafeHTML` preserves raw markup but does not bypass unrelated attribute escaping.
- signal reads in templates are collected exactly once per render pass.
- repeated renders do not accumulate duplicate subscriptions.
- event bindings round-trip through the runtime binding registry.
- property bindings do not stringify objects into server HTML.

## API Design Rules

- Do not introduce JSX as a core requirement.
- Do not make signals mandatory for static components.
- Do not serialize functions into HTML.
- Do not make the template system framework-global; it must stay usable by core DSD render paths.
- Do not hide unsafe behavior behind friendly names.

## Acceptance Criteria

- The template/reactive contract can be explained from one doc page and one type file.
- Existing UI components compile under the same contract as userland components.
- Tests prove both static and reactive rendering paths.
- No docs mention `hydrateEvents` as the current event authoring path.
- The generated project starter demonstrates `html`, signal state, and event binding without private APIs.

## Validation Commands

```powershell
git status --short --branch
deno task fmt:check
deno task lint
deno task typecheck
deno test packages/core packages/signals packages/ui
deno task test
git status --short --branch
```

## Exit Decision

Proceed to SOP-003 when the user-facing component authoring model is stable enough to document as the v0.21.x canonical style.
