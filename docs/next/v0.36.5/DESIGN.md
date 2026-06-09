# v0.36.5 Design

v0.36.5 is a repository-truth patch. The design is to update evidence surfaces
only, preserving runtime, build, package, and public API behavior.

## Evidence Surfaces

- Workflow validation uses v0.36.5 as the active package.
- v0.36.4 receives the missing mandatory NextVersion files.
- v0.36.3 and v0.36.4 completion state is reflected consistently in status,
  roadmap, SOP, changelog, release notes, and website pages.
- AutoFlow metrics and cells describe the real release-truth work rather than
  leaving stale or misnamed files.

## Four-Product Direction

The future product split is recorded as roadmap direction only:

- `DsdElement` can become a Lit-like base-class surface.
- A daisyUI-derived pure CSS layer is feasible after license and dependency
  review.
- A Spring-like protocol layer should start as explicit ports and adapters.
- A full-stack preset should compose the stabilized surfaces later.

## Compatibility

No package exports, runtime types, generated output, or user-facing APIs change
in this patch.
