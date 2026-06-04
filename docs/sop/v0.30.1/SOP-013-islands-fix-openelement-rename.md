# SOP-013: v0.30.1 Clean Architecture Sweep

> Version: v0.30.1
> Date: 2026-06-04
> Status: In Progress
> ADR: `docs/adr/ADR-0081-vnode-event-unification.md`
> Output: openElement rename closure, VNode-only dynamic island UI, trusted HTML
> boundary, stale-route cleanup, and gate-proven architecture hygiene.

## Summary

v0.30.1 is the cleanup release after the v0.30.0 architecture freeze. Its purpose
is not to add features. Its purpose is to make the active repository match the
claimed architecture:

- one public package scope: `@openelement/*`;
- one component naming line: `open-*`;
- one dynamic interactive UI model: `Signal -> VNode -> renderToDom`;
- one trusted HTML escape hatch for non-interactive pre-sanitized content;
- one current source of truth for architecture, package graph, and gates.

## Scan Evidence

The initial v0.30.1 scan read the tracked repository rather than sampling a few
files:

- tracked files: 961
- text files: 921
- tracked bytes read: 12,471,185
- `@lessjs`: 0 matches
- `LessJS`: 1,909 matches, mostly historical/current docs and public copy
- `lessjs` domains: 42 matches
- `virtual:less`: 515 matches, mostly historical/generated content
- `@openelement/ui/less-*`: 102 matches
- `<less-*>`: 89 matches
- `data-on-*`: 84 matches
- `data-signal-html`: 60 matches
- `innerHTML`: 350 matches
- `rawHtml`: 27 matches
- mojibake/replacement text: 11,450 matches
- `as unknown as`: 191 matches

`deno task arch:check` currently fails and is part of the work, not an optional
follow-up. The first failure set includes stale type-escape allowlist entries,
mojibake in active source, and gate drift after `less-*` files were renamed to
`open-*`.

## Workstreams

### 1. Remove accidental material

- Delete `opc-doc/` from git tracking.
- Confirm `git ls-files opc-doc` returns no files.
- Do not move these files into product docs.

### 2. Finish the `@openelement` and `open-*` rename

- Replace active root import-map entries such as
  `@openelement/ui/less-button` with `@openelement/ui/open-button`.
- Update package exports, generated entry references, consumer smoke helpers,
  docs examples, and website imports to the same `open-*` subpaths.
- Remove active `<less-*>` usage from source and generated site inputs.
- Keep historical ADR/changelog wording only when the file is clearly historical
  and not part of the current user-facing contract.

### 3. Make dynamic island UI VNode-only

- Do not restore `_bindEvents()`.
- Keep `data-signal-render` as an internal hydration marker while documenting
  the public model as "signals return VNodes".
- Rewrite framework-authored interactive dynamic content from HTML strings to
  `VNode | VNode[]`.
- Remove `data-on-*` from active framework UI.
- Remove `data-signal-html` from active islands.
- Remove direct `escapeHtml` and `escapeAttr` imports from islands; JSX owns text
  escaping.

### 4. Narrow HTML injection to a trusted boundary

- Keep `trustedHtml` only for pre-sanitized, non-interactive content such as
  Markdown/MDX output, code highlighting, and Hub snapshots.
- Do not use trusted HTML for buttons, links with framework handlers, filters,
  live search results, or other dynamic interactive UI.
- Replace ordinary `rawHtml` naming in active docs and current examples with the
  trusted boundary language.
- Gate unreviewed `innerHTML` writes. Allow only audited core renderer, trusted
  content routes, devtools, syntax highlighting, and snapshot boundaries.

### 5. Repair architecture gates

- Update `tools/check-architecture-contract.ts` after the rename:
  `less-code-block.tsx` allowlist entries become `open-code-block.tsx`.
- Add active-source checks for:
  - stale `@openelement/ui/less-*` imports;
  - active `<less-*>` tags;
  - `_bindEvents`;
  - `data-on-*` in production UI;
  - `data-signal-html` in islands;
  - island imports of `escapeHtml` or `escapeAttr`;
  - unreviewed `innerHTML`;
  - mojibake/replacement text in current source and current docs.
- Keep historical docs out of hard failures unless they are linked as current
  product docs.

### 6. Repair encoding and stale current docs

- Remove mojibake from current source comments, active ADR/SOP docs, README files,
  package READMEs, and current architecture/reference/guide pages.
- Update `docs/status/STATUS.md` so it reflects v0.30.1, not v0.28.x.
- Update `README.md`, `README.zh.md`, `CONTRIBUTING.md`, and agent prompts to
  match the current openElement identity.
- Keep older historical ADRs readable but do not spend this release rewriting
  every old archive solely for branding.

### 7. Align release metadata

- Bump all 19 packages to `0.30.1`.
- Align internal `jsr:@openelement/*` ranges to `^0.30.1`.
- Update `www/app/data/version.ts` and Hub constants.
- Regenerate or explicitly restore deterministic lock state. The release must
  not accidentally remove `deno.lock` without an intentional lock policy.
- Add `docs/changelog/v0.30.1.md` and `docs/release/v0.30.1.md`.

### 8. Verification and release closure

Run the local gate in this order:

```powershell
deno task fmt
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
deno task publish:dry-run
deno task graph:check
deno task arch:check
```

Then push `dev`, watch CI, fix failures until green, fast-forward/merge to
`main`, and confirm publish plus consumer smoke if the publish workflow runs.

## Exit Criteria

- [ ] `git ls-files opc-doc` is empty.
- [ ] `deno task arch:check` passes with no stale allowlist entries.
- [ ] root import map and package exports expose `open-*`, not `less-*`, UI
      subpaths.
- [ ] active framework-authored UI has no `data-on-*`.
- [ ] active islands have no `data-signal-html`.
- [ ] active islands do not import `escapeHtml` or `escapeAttr`.
- [ ] all reviewed `innerHTML` use is either renderer internals, devtools,
      syntax highlighting, trusted content, or Hub snapshot display.
- [ ] current docs and current source contain no mojibake/replacement text.
- [ ] all 19 packages are versioned `0.30.1`.
- [ ] changelog and release note for v0.30.1 exist.
- [ ] local full gate passes.
- [ ] dev CI passes.
- [ ] main CI passes after merge.

## Non-Goals

- No new renderer feature beyond the cleanup needed for VNode-only dynamic UI.
- No keyed diff implementation.
- No sanitizer dependency in core.
- No rewrite of every historical ADR/changelog/blog archive for branding alone.
- No v0.31 UI Shell/Ocean-Island work in this release.
