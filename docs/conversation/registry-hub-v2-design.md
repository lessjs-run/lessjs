# Registry Hub v2 Design Conversation

> Design session: 2026-05-17
> Result: ADR-0031 + v0.19.0 Phase 2 SOP

## Trigger

Post-v0.19.0 user testing revealed three critical gaps:

1. **Search doesn't work**: SSG page has search UI but no client-side JS to
   power it (fixed: vanilla JS search script inlined via `_renderer.ts`)
2. **Detail pages 404**: `encodeURIComponent` turned `@` into `%40` in
   directory names, mismatching URLs (fixed: removed encoding)
3. **No usage workflow**: User finds a package, sees `less add <package>`, but
   the CLI doesn't exist. No component previews. No code snippets. Dead end.

## Key Insight

The user's purpose when visiting the Hub is not "browse a catalogue." Their
purpose is: **"I need `<sl-dialog>` in my LessJS page."**

Everything in the Hub should serve that purpose.

## Architecture Decision: Three-Tier Browser

| Tier             | Route                           | Status                                 |
| ---------------- | ------------------------------- | -------------------------------------- |
| Package List     | `/registry/`                    | ✅ Exists, enhance with metrics        |
| Package Detail   | `/registry/:package`            | ✅ Exists, add component links + usage |
| Component Detail | `/registry/:package/:component` | 🆕 New route with rendered preview     |

## User Personas Identified

### Persona A: Alex — LessJS Site Builder

The primary user. Frontend developer building a site with LessJS who needs
third-party components. The entire Hub redesign optimizes for Alex's flow:
discover → evaluate → install → use.

### Persona B: Bob — WC Package Author

Wants his components discoverable by LessJS users. Needs clear submission docs
and confidence that listed components show well.

### Persona C: Carol — Framework Evaluator

Deciding between frameworks. The Hub is LessJS's "ecosystem storefront."
Component previews and usage docs build trust.

### Persona D: Dave — Casual Browser

Just looking around. Visual richness matters — component previews make
browsing rewarding.

## Key Design Decisions

1. **`less add` CLI is P0**: Without it, the entire "install" step is a dead
   end. Follow v0.18.2 SOP spec (dry-run first, --apply for real changes).

2. **Component detail pages follow existing SSG pattern**:
   `[package]/[component].ts` mirrors `[package].ts`. Same data source
   (`_hub-data-full.ts`), same SSG generation.

3. **Rendered previews are pre-built SSG snapshots**: No runtime rendering.
   Snapshots generated during `hub:scan` and inlined in the page. For
   SSR-capable components: full rendered HTML. For client-only: placeholder.

4. **Usage examples start hardcoded per known package, with generic fallback**:
   Shoelace, Media Chrome, @lessjs/ui get hand-written examples. Others get
   auto-generated from CEM manifest.

5. **CEM API reference is P2**: Rich attribute/event/slot tables depend on
   packages publishing good `custom-elements.json`. Not blocking for MVP.

## Implementation Priority

| Pri | Item                       | Effort | Risk                                         |
| --- | -------------------------- | ------ | -------------------------------------------- |
| P0  | `less add` CLI             | M      | Medium — validation logic exists in builder  |
| P0  | Component detail route     | M      | Low — follows existing [package].ts pattern  |
| P0  | Component drill-down links | S      | Low — just modify template                   |
| P1  | SSR snapshot generation    | L      | Medium — need headless render infra          |
| P1  | Usage examples             | M      | Low — content work                           |
| P2  | CEM API reference          | M      | Medium — depends on external package quality |
| P2  | Package list badges        | S      | Low — UI work                                |

## Files Referenced

- docs/adr/0031-hub-v2-component-browser-workflow.md
- docs/sop/v0.19.1-component-browser.md
- docs/status/STATUS.md
- docs/roadmap/ROADMAP.md
- packages/hub/src/cli/less-add.ts (to be created)
- www/app/routes/registry/[package]/[component].ts (to be created)
- www/app/routes/registry/[package].ts (to be modified)
- www/app/routes/registry/index.ts (to be modified)

## Next Steps After v0.19.1

- Package submission documentation (for Bob)
- `hub.lessjs.dev` standalone deployment (separate from docs site)
- Scoped Custom Element Registries
- Publisher accounts
