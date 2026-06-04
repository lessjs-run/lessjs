# ADR-0074: @openelement/ui Dual-Track Ocean and Island Architecture

> Status: Proposed\
> Date: 2026-06-03\
> Target: v0.29.0

## Context

`@openelement/ui` currently contains JSX + `DsdElement` components. They are useful
for interactive UI, but they are not a zero-JS Shell component system. LessJS
needs a UI layer that matches its DSD-first positioning:

- SSG should be able to emit useful Shell UI as HTML + CSS.
- Shadow DOM styling should be explicit and testable.
- Interactive components should hydrate only when interaction requires
  JavaScript.

This means one component model is not enough.

## Decision

Adopt a dual-track UI architecture.

### Track 1: `@openelement/ui/css`

`@openelement/ui/css` is the Ocean Shell track:

- CSS-only
- DSD and Shadow DOM friendly
- zero client JavaScript
- organized as tokens, base styles, utilities, and component CSS
- consumed by SSG/DSD output through explicit CSS injection or imports

It is intended for static Shell components and native HTML interaction.

### Track 2: `@openelement/ui`

`@openelement/ui` remains the Island track:

- JSX + `DsdElement`
- JavaScript hydration when needed
- focus management, keyboard behavior, positioning, state, and async behavior
- able to reuse the same CSS tokens and component shells

### Shared Boundary

Both tracks share:

- Open Props based infrastructure tokens
- daisyUI-derived semantic color/theme tokens
- LessJS brand/project tokens
- light/dark theme behavior

The tracks should not fork the visual language.

## Component Classification

Initial v0.29.0 classification:

| Component type                                                                                                         | Track        | Reason                                                               |
| ---------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------- |
| card, badge, alert, hero, avatar, divider, stat, table, timeline, progress, skeleton, navbar, menu, breadcrumb, footer | Ocean        | Static display or layout                                             |
| button, accordion                                                                                                      | Ocean first  | Native HTML interaction is enough for the base behavior              |
| dialog, dropdown, tooltip                                                                                              | Island first | Focus management, keyboard behavior, positioning, or timing needs JS |

Island-first components may still expose a CSS shell, but the accessible
interactive behavior belongs in the Island implementation.

## Consequences

Positive:

- LessJS gains a real zero-JS Shell component layer.
- Interactive components keep a clear home instead of forcing CSS-only hacks.
- DSD and Shadow DOM styling become explicit release surfaces.

Negative:

- The UI package has two consumption modes.
- CSS and JSX components need shared naming and documentation discipline.
- Visual regression testing becomes more important.

Mitigations:

- Document Ocean vs Island selection rules.
- Keep tokens shared.
- Treat Island components as enhancement layers over CSS shells where practical.
