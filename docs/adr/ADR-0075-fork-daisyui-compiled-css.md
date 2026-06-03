# ADR-0075: Fork daisyUI 5 Compiled CSS for DSD Shell Components

> Status: Proposed\
> Date: 2026-06-03\
> Target: v0.29.0

## Context

LessJS needs a CSS-only Shell component library. daisyUI 5 is a strong starting
point because it provides a broad set of CSS component styles and theme tokens.
However, consuming daisyUI directly does not automatically make it a DSD Shell
library.

The hard parts are:

- Shadow DOM selector boundaries
- theme variables crossing DSD/Shadow DOM
- composite component DOM assumptions
- `::slotted()` limitations
- Tailwind utility assumptions in source material

## Options

### Option A: PostCSS transform at build time

This keeps upstream daisyUI untouched and transforms selectors during the build.

Rejected because the build path becomes a fragile black box. It also does not
solve theme and composite DOM issues by itself.

### Option B: Fork daisyUI source

This keeps more upstream structure but requires maintaining Tailwind plugin and
source-generation internals.

Rejected for v0.29.0 because it expands the maintenance surface too much.

### Option C: Fork compiled CSS and deeply adapt it

This starts from compiled daisyUI CSS and adapts only the CSS needed for the
LessJS Shell layer.

Accepted as the v0.29.0 plan.

### Option D: Build every component from scratch

This gives full control but delays a useful Shell library and risks weaker
visual quality in the first pass.

Deferred.

## Decision

Fork daisyUI 5 compiled CSS as a source material, then adapt it for LessJS DSD
Shell components.

The adaptation is not a blind `:root` to `:host` replacement. It must include:

1. Ocean/Island component classification.
2. Theme variable bridge using root-level CSS custom properties.
3. Component selectors that work inside Shadow DOM.
4. Composite DOM redesign where daisyUI expects descendants in one DOM tree.
5. `::slotted()` rules only for direct slot children.
6. Tailwind utility assumptions replaced with explicit CSS/Open Props tokens.
7. DSD, theme, and visual verification.

## Theme Rule

Theme variables belong at the document/root theme bridge:

```css
:root {
  --color-base-100: oklch(0.98 0 0);
  --color-primary: oklch(0.7 0.15 250);
}

:root[data-theme='dark'] {
  --color-base-100: oklch(0.2 0 0);
  --color-primary: oklch(0.6 0.2 280);
}
```

Component-local styling belongs inside DSD/Shadow DOM:

```css
:host {
  display: block;
}

.card {
  background: var(--color-base-100);
}
```

## Consequences

Positive:

- v0.29.0 can start from a mature component vocabulary.
- LessJS controls the DSD-specific adaptation.
- The Shell layer does not depend on Tailwind at runtime.

Negative:

- Upstream daisyUI updates require deliberate re-import and review.
- Deep adaptation makes automatic merging unrealistic.
- Some components still need Island behavior for accessibility.

Mitigations:

- Lock the daisyUI source version per release.
- Keep an analysis report for imported CSS.
- Treat dialog/dropdown/tooltip as Island-first.
- Add visual and DSD conformance tests before release.
