# WWW Navigation Structure Decision

> Date: 2026-05-18
> Decision: 5-section navigation (user's confirmed choice)

## Decision

WWW navigation will use 5 sections, matching the project's five product pillars:

```
/            → Homepage
/framework/  → Full-Stack Framework docs
/engine/     → WC Rendering Engine docs
/hub/        → Registry Hub (functional page, not docs)
/ui/         → @lessjs/ui component library
/blog/       → Blog
```

## Rationale

- Aligns navigation with internal product structure
- Each pillar gets its own visibility
- User explicitly chose this over the 4-section alternative (/docs/ + /hub/ + /blog/)

## Current Implementation Status

Route migration is partially complete:
- `/engine/` — created from `/guide/` engine-related pages (architecture, comparison, dsd, islands, etc.)
- `/guide/` — retained for framework-related pages (getting-started, routing, configuration, etc.)
- Need to rename `/guide/` → `/framework/` to complete the 5-section model

## Remaining Work

1. Rename `/guide/` → `/framework/` in www routes
2. Add `/ui/` section (currently only 8 components, may be a single page initially)
3. Update all internal links referencing `/guide/`
4. Add redirect rules for old `/guide/` URLs → `/framework/` URLs
5. Update navigation component to show 5 sections

## Audit Consideration

The audit recommended 4 sections (/docs/ + /hub/ + /blog/) for user-centric organization.
The 5-section model was chosen because:
- It reflects the project's strategic pillars
- Each pillar is a distinct product with different audiences
- The /engine/ section contains the core differentiation content
