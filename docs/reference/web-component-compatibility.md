# Web Component Compatibility Baseline

Status: v0.21.x hardening baseline\
Scope: openElement DSD components and first-party UI components

openElement should integrate with the Web Components ecosystem without pretending to replace it. The compatibility target is ordinary custom elements plus DSD-first rendering evidence.

## Compatibility Matrix

| Area                        | openElement expectation                                     | Evidence                                          |
| --------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| Custom element registration | Components work through `customElements.define()`           | `packages/core/__tests__/reactive-dsd.test.ts`    |
| Shadow DOM                  | Server output uses standard DSD attributes                  | `packages/core/__tests__/dsd-conformance.test.ts` |
| Attributes                  | Serializable values are escaped and reflected intentionally | `packages/core/__tests__/render-dsd.test.ts`      |
| Properties                  | Runtime-only objects are not serialized                     | `packages/core/__tests__/template.test.ts`        |
| Events                      | `@event` handlers bind at runtime and are not serialized    | `packages/core/__tests__/template.test.ts`        |
| Slots                       | DSD slot output and manual slot assignment are covered      | `packages/core/__tests__/dsd-conformance.test.ts` |
| Metadata                    | Package/component metadata prefers CEM-compatible fields    | `packages/core/__tests__/cem-parser.test.ts`      |

## OpenWC Alignment

OpenWC is the testing and Web Component practice baseline. openElement should be compatible with ordinary custom element testing patterns:

- mount a custom element;
- inspect shadow DOM;
- assert attributes/properties/events/slots;
- verify accessibility behavior for interactive components.

openElement does not claim to be an OpenWC replacement. It adds a DSD renderer, island admission, build reports, and Hub evidence around standard components.

## Open UI Alignment

Open UI is a vocabulary and research baseline for component contracts. openElement component docs should name:

- tag name;
- attributes;
- properties;
- events;
- slots;
- CSS parts;
- CSS custom properties;
- accessibility behavior;
- SSR/DSD behavior;
- hydration/island behavior.

Do not claim formal Open UI conformance without a dedicated spec or test suite for the specific component.
