# SOP-005: OpenWC Testing and Web Component Compatibility

Status: planned\
Target version: v0.21.2\
Owner: core package, ui package, test infrastructure

## Objective

Use OpenWC as an ecosystem compatibility baseline without copying its product shape. LessJS should prove that its components remain ordinary Web Components wherever possible.

## External Baseline

- OpenWC testing guide: <https://open-wc.org/guides/developing-components/testing/>
- OpenWC testing helpers: <https://open-wc.org/docs/testing/helpers/>
- Custom Elements Manifest schema effort: <https://github.com/webcomponents/custom-elements-manifest>

## Evidence Inputs

- `packages/ui/src/`
- `packages/core/src/dsd-element.ts`
- `packages/core/src/cem.ts` or equivalent CEM parser code
- package manifests
- UI and browser tests

## Problem Statement

LessJS can be differentiated while still being interoperable. If LessJS components cannot be tested or described with common Web Component tooling, the ecosystem story weakens.

The target is not "be OpenWC". The target is:

- ordinary custom elements;
- clear attributes/properties/events/slots;
- useful Custom Elements Manifest support;
- browser-based tests for component behavior;
- no hidden runtime dependency on LessJS app internals for basic component use.

## Scope

Audit and harden:

- lifecycle behavior of `DsdElement` subclasses;
- attributes and property reflection expectations;
- event names and payload contracts;
- slot behavior;
- CEM parsing and validation;
- UI package component examples.

## Procedure

1. Pick three representative components:
   - one static component;
   - one reactive component;
   - one component with events or slots.
2. Add compatibility tests that mount them as plain custom elements.
3. Validate their CEM metadata where available.
4. Verify that test helpers can inspect shadow DOM, events, slots, and attributes.
5. Document where LessJS intentionally differs from Lit or OpenWC conventions.
6. Add a small compatibility matrix to docs.

## Compatibility Matrix

The matrix should answer:

| Area                        | LessJS expectation                                     | Evidence                |
| --------------------------- | ------------------------------------------------------ | ----------------------- |
| Custom element registration | Works through standard `customElements.define` path    | Test file               |
| Shadow DOM                  | DSD-first server output plus browser shadow root parse | DSD conformance fixture |
| Attributes                  | Documented and reflected when intentional              | CEM and test            |
| Properties                  | Runtime-only objects are not serialized                | Template test           |
| Events                      | Event names and detail payloads are typed              | Test                    |
| Slots                       | Named/default slot behavior is covered                 | Browser test            |

## API Design Rules

- Avoid inventing a proprietary component metadata format where CEM works.
- Do not force users to adopt LessJS app routing to consume a component.
- Do not claim OpenWC compliance unless tests prove the specific behavior.
- Prefer small compatibility fixtures over broad narrative claims.

## Acceptance Criteria

- At least three representative components have browser-level compatibility tests.
- CEM validation behavior is documented and tested.
- A compatibility matrix exists in docs.
- LessJS differences from OpenWC/Lit are explicit and evidence-based.
- No public docs imply ecosystem compatibility without a linked test or fixture.

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

Proceed to SOP-006 when Web Component compatibility is supported by tests and metadata, not only positioning language.
