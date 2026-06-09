# v0.37.0 Design

v0.37.0 is a documentation and execution-system reset. The design goal is to
make future product work small enough to execute with evidence.

## Product Doctrine

openElement is a static-first, SSR/SSG-first Web Components framework:

- static routes emit zero framework JavaScript by default;
- client JavaScript appears only through explicit islands, hydration, or
  client-only components;
- DSD/shadow DOM remains the default component rendering mode;
- light DOM is an explicit opt-in mode for content, layout, global CSS, and
  integration use cases;
- SSR and ISR belong to the framework product line.

## Four-Product Target

- Elements: DsdElement and component authoring.
- UI: pure CSS-first UI layer.
- Protocol: small ports/adapters contracts.
- Framework: full-stack preset and create path.

## Version Train

v0.37.0 defines the doctrine and execution steps. Later v0.37.x versions do the
implementation work one product boundary at a time.

## Compatibility

No runtime exports, package versions, generated output, or user-facing APIs
change in v0.37.0.
