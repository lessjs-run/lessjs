# ADR-0076: Open Props and daisyUI Token Merge

> Status: Proposed\
> Date: 2026-06-03\
> Target: v0.29.0

## Context

LessJS already uses Open Props influenced tokens and project brand variables.
The planned CSS Shell layer also wants daisyUI's semantic theme variables.

Without a deliberate merge, the project would have competing token systems:

- Open Props for spacing, radius, shadows, typography, and motion
- daisyUI for semantic colors and component theme values
- LessJS brand tokens for project identity

## Decision

Use a three-layer token model.

### Layer 1: Open Props Infrastructure

Open Props provides low-level primitives:

- spacing
- radius
- shadow
- font size
- font weight
- line height
- easing
- duration

These tokens should be stable and mostly unbranded.

### Layer 2: daisyUI Semantic Theme

daisyUI-derived variables provide theme semantics:

- `--color-primary`
- `--color-secondary`
- `--color-accent`
- `--color-neutral`
- `--color-base-100`
- `--color-base-200`
- `--color-base-300`
- `--color-base-content`
- `--color-info`
- `--color-success`
- `--color-warning`
- `--color-error`

These variables are the theme bridge for Ocean and Island components.

### Layer 3: LessJS Brand and Project Tokens

LessJS-specific tokens provide project identity:

- `--brand`
- `--brand-hover`
- `--brand-light`
- `--brand-deep`
- `--brand-subtle`
- `--brand-glow`

Project tokens may map onto semantic tokens but should not replace them.

## Compatibility Strategy

v0.29.0 should keep existing public token names where removing them would cause
site regressions. New CSS Shell components should prefer the semantic daisyUI
variable names.

During the transition:

```css
:root {
  --color-base-100: oklch(0.98 0 0);
  --color-base-content: oklch(0.2 0 0);

  --bg-base: var(--color-base-100);
  --text-primary: var(--color-base-content);
}
```

The compatibility mapping should be removed only during a deliberate API freeze
cleanup.

## Consequences

Positive:

- Ocean and Island components share one visual system.
- Theme switching works through CSS variables across Shadow DOM.
- LessJS avoids maintaining a bespoke complete design-token system.

Negative:

- There is a transition period with old and new variable names.
- daisyUI token names become part of the UI package's public surface.
- OKLCH values may need fallbacks depending on browser support targets.

Mitigations:

- Document token layers.
- Keep compatibility mappings explicit.
- Add light/dark visual tests for the Shell components.
