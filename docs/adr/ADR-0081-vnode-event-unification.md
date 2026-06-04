# ADR-0081: VNode-Only Dynamic UI and Trusted HTML Boundary

- Status: Accepted
- Date: 2026-06-04
- Target: v0.30.1
- Supersedes: `_bindEvents()` restoration proposals, `data-on-*` event binding,
  ordinary dynamic `data-signal-html`
- Related: ADR-0077, ADR-0080

## Context

v0.30.0 intentionally collapsed the public renderer contract to one model:
components return `VNode | null`, and the framework owns conversion to SSR HTML
or live DOM. After that cleanup, production islands exposed one remaining
secondary path:

1. A signal produced an HTML string.
2. `data-signal-html` assigned that string through `innerHTML`.
3. Event handlers were expressed as string attributes such as
   `data-on-click="_close"`.
4. `_bindEvents()` scanned the shadow DOM and looked up instance methods by name.

That path was brittle for the exact reasons v0.30.0 was trying to remove:
string UI construction, manual escaping, duplicated event binding, and no type
checking for handlers. Restoring `_bindEvents()` would fix the immediate island
regression but would permanently keep a second event model beside JSX events.

The full repository scan for v0.30.1 also found broader cleanup work, not only
the island regression:

- stale `less-*` UI subpaths and custom element names after the `@openelement`
  rename;
- `virtual:less-*` historical references that must not be active build
  contracts;
- dynamic HTML and `innerHTML` sites that need an explicit trust boundary;
- mojibake/replacement text introduced by broad edits;
- stale architecture gate allowlist entries after file renames;
- accidental non-product material under `opc-doc/`.

## Decision

openElement adopts this permanent boundary:

1. **Interactive dynamic UI is VNode-only.** Dynamic island content must be
   represented as `VNode | VNode[] | null` and rendered by the core renderer.
2. **Events live on VNodes.** JSX `on*` handlers are the only event model for
   framework-authored interactive UI. `data-on-*` and method-name lookup are not
   restored.
3. **`data-signal-render` is an internal hydration marker.** It is acceptable as
   the current DOM marker that connects a signal to a VNode render target, but
   docs should teach "signals return VNodes", not a public directive DSL.
4. **HTML injection remains only as a named trust escape hatch.** `trustedHtml`
   or a branded `TrustedHtml` value may be used for pre-sanitized, non-interactive
   content such as Markdown/MDX, code highlighting, or Hub snapshots. Ordinary
   dynamic `data-signal-html` is not a framework-authored UI path.
5. **The active contract must be proven by gates.** The architecture gate must
   reject active source regressions: `_bindEvents`, `data-on-*` in production UI,
   stale `less-*` package subpaths, unreviewed `innerHTML`, mojibake, and stale
   type-escape allowlist entries.

## Consequences

### Positive

- One event model: JSX handlers are type checked and refactorable.
- One dynamic UI model: signal-driven DOM updates flow through the VNode renderer.
- Less manual escaping: text goes through JSX escaping by default.
- Explicit trust: HTML injection is visible at the callsite and can be audited.
- Cleaner release readiness: architecture claims become gate-proven instead of
  prose-only.

### Negative

- Code using `data-on-*` must be rewritten.
- Code using `data-signal-html` for dynamic UI must return VNodes instead.
- Simple HTML snippets need either JSX or the explicit trusted HTML escape hatch.
- The first implementation may replace a dynamic container wholesale on signal
  changes. That is acceptable for v0.30.1 islands; keyed updates are a future
  optimization, not part of this cleanup.

## Non-Goals

- Do not add a new public directive family.
- Do not restore `_bindEvents()`.
- Do not introduce a sanitizer dependency in core.
- Do not remove all `innerHTML` platform usage. Only keep audited trusted
  boundaries.
- Do not rewrite historical ADRs solely to erase old product names. Current
  public docs and active source take priority.

## Required Gates

v0.30.1 is not complete until these are true in active tracked files:

- `opc-doc/` is absent from `git ls-files`.
- active production source has no `_bindEvents` implementation.
- `www/app/islands/**` has no `data-on-*`, `data-signal-html`, or direct
  `escapeHtml`/`escapeAttr` imports.
- framework-authored interactive pages have no `data-on-*`.
- root import maps and package exports use `open-*` UI subpaths only.
- `arch:check`, `graph:check`, build, tests, lint, and fmt all pass.
