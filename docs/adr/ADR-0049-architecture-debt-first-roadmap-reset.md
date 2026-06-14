# ADR-0049: Architecture Debt First Roadmap Reset

- Status: ACCEPTED
- Date: 2026-05-26

## Context

The 2026-05-26 review set exposed a pattern that is more important than the
next feature line:

- consumer projects carry framework internals in `deno.json`;
- `@openelement/core` still owns build-time types and duplicated helpers;
- extracted packages such as `@openelement/style-sheet` are not yet cleanly owned;
- `adapter-vite` mixes plugin assembly, dependency resolution, head injection,
  optional stubs, and phase orchestration in one large module;
- `@openelement/signal` has useful public API value, but its engine/facade boundary
  is unclear;
- Hub, CEM, and manifest validation repeat schema concepts across packages;
- CI proves many things, but coverage artifacts, consumer E2E depth, traces, and
  cache fallback are still weak quality signals.

ADR-0038 remains a valid Edge ISR/KV architecture decision. The problem is
release order. Shipping more v0.22 surface area before paying down these debts
would turn today's maintainable-but-tangled internals into tomorrow's public
compatibility burden.

## Decision

v0.22.x is reset from **Edge Full-Stack** to **Architecture Integrity**.

The new priority is to make the current framework architecture clean enough to
support future Edge Full-Stack work without hiding coupling or leaking internals
to users.

v0.22.x must complete these cleanup streams before public Edge Full-Stack
claims resume:

1. **Consumer surface cleanup**
   Generated projects must not need to list framework transitive dependencies
   such as `parse5`, `entities`, `hono`, or internal LessJS subpaths unless the
   user imports them directly.

2. **Package boundary repair**
   Runtime packages, build packages, extracted helper packages, and public API
   facades must have explicit ownership. `@openelement/core` should not keep
   adapter-only types or duplicated extracted implementations.

3. **Adapter decomposition**
   `@openelement/adapter-vite` must split plugin assembly, import-map resolution,
   optional package stubs, head injection, and SSG phase logic into testable
   modules.

4. **Signals facade hardening**
   LessJS keeps a framework-owned signal API surface. Any move to
   `alien-signals` or another engine must happen behind a facade and must not
   delete public package paths without a deprecation window.

5. **Schema and validation unification**
   Hub, CEM, package manifest, and submission validation should converge on
   shared types and stable diagnostic contracts. Third-party schema libraries
   may be used only if they preserve LessJS-specific errors and strict gates.

6. **Quality gate strengthening**
   CI must produce useful coverage artifacts, exercise generated consumers more
   deeply, retain Playwright traces on retry, and keep docs/status/roadmap claims
   aligned with verified repo behavior.

v0.23.x becomes the earliest line for resuming ADR-0038 Edge Full-Stack work:
ISR production handler, KV adapters, self-hosting proof, and deployment guides.

v0.24.x is reserved for ecosystem hardening: Hub growth, trust policy, package
compatibility evidence, and component discovery improvements.

## Consequences

### Positive

- LessJS avoids expanding public commitments while core ownership boundaries are
  still muddy.
- Generated projects become a clearer product surface instead of exposing build
  pipeline decisions.
- Edge ISR/KV work will start from cleaner packages and more reliable gates.
- Public docs become more conservative and less likely to outrun code reality.

### Negative

- Edge Full-Stack public positioning is delayed.
- Some already-written v0.22 SOPs must be treated as deferred plans rather than
  active release work.
- Refactoring work may not create immediate user-visible features.

### Neutral

- ADR-0038 is not rejected. Its architecture remains accepted, but its
  implementation line moves behind v0.22 architecture cleanup.
- The decision does not require replacing every hand-written subsystem with a
  community library. Replacement is only justified where it improves ownership,
  maintenance risk, and validation clarity.

## Acceptance

- `docs/roadmap/ROADMAP.md` lists v0.22.x as Architecture Integrity and moves
  Edge Full-Stack to v0.23.x or later.
- `docs/status/STATUS.md` explains that v0.22 is now the architecture cleanup
  line.
- `docs/sop/v0.22.0/` contains detailed Architecture Integrity SOPs.
- The 2026-05-26 conversation archive contains the synthesis decision that led
  to this ADR.
- Future code work against this line starts from the SOPs, not from ad hoc
  cleanup.
