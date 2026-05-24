# SOP-004: Declarative Shadow DOM and WHATWG Conformance

Status: planned\
Target version: v0.21.2\
Owner: core package

## Objective

Make LessJS DSD output visibly aligned with the platform. The framework should generate standards-shaped HTML first, then layer islands and reactivity on top.

## External Baseline

- WHATWG HTML template element and DSD attributes: <https://html.spec.whatwg.org/multipage/scripting.html#the-template-element>
- MDN `template` element reference and `shadowrootmode`: <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template>
- DOM Standard shadow root model: <https://dom.spec.whatwg.org/>

## Evidence Inputs

- `packages/core/src/render-dsd.ts`
- `packages/core/src/dsd-options.ts` or equivalent DSD option definitions
- `packages/core/src/html-escape.ts`
- `packages/core/src/types.ts`
- DSD report fixtures
- browser/e2e tests that parse generated DSD

## Problem Statement

LessJS should not merely output strings that look like shadow DOM. It must preserve the platform contract:

- `template shadowrootmode` must be emitted correctly;
- `shadowrootdelegatesfocus` and `shadowrootslotassignment` must match valid attribute semantics;
- light DOM and slot content must remain parseable;
- nested custom elements must not corrupt host/shadow boundaries;
- browser parsing behavior must be treated as the source of truth.

## Scope

Build a focused DSD conformance suite around:

- open and closed shadow roots where supported by the current API;
- delegates focus;
- named and manual slot assignment;
- nested custom elements;
- inert templates and script/style handling;
- serialization and parsing through a browser;
- invalid option handling.

## Procedure

1. Create a DSD conformance fixture directory.
2. For each fixture, store:
   - component source;
   - expected rendered HTML fragment;
   - expected browser-parsed shadow root behavior;
   - expected report metrics.
3. Run the fixture through `renderDSD()` and the adapter build path.
4. Parse representative output in a real browser via Playwright.
5. Compare browser-observed structure with the expected structure.
6. Update docs if a limitation is intentional.

## API Design Rules

- LessJS should follow current standard attribute names, not legacy aliases.
- Compatibility aliases may exist only as explicit migration behavior.
- Framework convenience must not produce invalid HTML.
- Browser parse behavior outranks string snapshots.
- New DSD options must map to platform terms.

## Acceptance Criteria

- A DSD conformance suite exists and runs in CI or the documented release gate.
- `shadowrootmode`, `shadowrootdelegatesfocus`, and `shadowrootslotassignment` behavior is covered.
- Nested custom elements have at least one browser-parse assertion.
- Unsupported or unsafe combinations produce typed errors.
- Docs identify LessJS as DSD-first without overstating browser or spec support.

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

Proceed to SOP-005 when LessJS DSD output is tested against platform behavior, not only internal string expectations.
