# v0.39.0 Design Notes

## Intent

v0.39.0 turns the v0.38 product map into a release-candidate framework
experience and applies ADR-0099's four-product matrix reset. The implementation
should prioritize generated app proof, public docs truth, and governance checks
before new code abstractions.

## Constraints

- Product package names and first-run imports follow the v0.38 product map.
- ADR-0099 defines the target product matrix:
  `openElement = Elements + UI + Framework + Protocols`.
- Elements is the future `@openelement/elements` + `OpenElement` product
  direction. Code implementation is a follow-up, not required by this docs
  reset.
- Vite + Nitro stay the default base engine for build, runtime, and deploy
  proof.
- Archived/internal packages stay available only where they are already part of
  tooling or advanced documentation.
- Breaking changes are allowed in 0.x only when recorded in migration notes and
  backed by tests.
- Web Awesome is out of scope for the current UI target.
- Preact is the v0.40 heavy-framework island priority; Vue, React, Svelte, and
  broad heavy-island expansion are frozen before v1.0 unless a later ADR
  changes scope.
- `@preact/signals-core` may be evaluated only as a protocol-conforming
  `SignalEngine` candidate; it is not an immediate default engine swap.

## Evidence To Record

- Generated app fixture or smoke command.
- Runtime/deploy command output.
- Docs and website alignment.
- README.md and README.zh version/integrity checks.
- Package graph and release-gate output.
