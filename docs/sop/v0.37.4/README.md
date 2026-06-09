# v0.37.4 SOP: Pure CSS UI Foundation

> Status: Planned\
> Roadmap: Four-Product Validation Train\
> Depends on: v0.37.0, v0.37.1

## Goal

Make `@openelement/ui` a CSS-first product surface that can serve plain HTML,
light DOM DsdElement, shadow DSD components, and framework starters.

## Entry Criteria

- v0.37.1 has defined shadow and light rendering contracts.
- UI behavior components are not required for the CSS product surface.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0074: UI Dual-Track Ocean and Island Architecture.
- ADR-0075: Fork daisyUI Compiled CSS.
- ADR-0076: Open Props and daisyUI Token Merge.

## Step-by-Step Tasks

1. Audit daisyUI license, compiled CSS shape, class model, theme variables, and
   Tailwind coupling.
2. Decide through ADR whether to fork, adapt, or only draw inspiration from
   daisyUI.
3. Define the pure CSS export path.
4. Define token naming and theme variable policy.
5. Add CSS smoke for plain HTML.
6. Add CSS smoke for light DOM DsdElement.
7. Add shadow adoption guidance for DSD components.
8. Keep behavior components optional and separate from the CSS layer.
9. Update starter and docs examples.

## Verification

- CSS export smoke.
- token/theme snapshot.
- UI package tests.
- build and E2E for website/starter surfaces.

## Non-Goals

- No blind daisyUI fork.
- No Tailwind runtime dependency unless ADR approves it.
- No coupling between CSS and DsdElement behavior.
- No large component rewrite in the CSS foundation release.

## Exit Criteria

- UI CSS has a clear import path and theme contract.
- The same CSS layer works in plain HTML, light DOM, and framework starter
  examples.
- Behavior components remain optional.

## AutoFlow Boundary

AutoFlow may check CSS snapshots and example builds. It must not decide license
strategy or fork policy.
