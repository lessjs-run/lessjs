# v0.37.0 SOP: Product Doctrine and Rendering Contract Reset

> Status: Planned\
> Roadmap: Product Doctrine and Rendering Contract Reset\
> NextVersion: `docs/next/v0.37.0/`\
> ADR: ADR-0091

## Goal

Reset the v0.37-v1 roadmap around the four-product platform before product code
continues. v0.37.0 is documentation, ADR, SOP, NextVersion, and public roadmap
work only.

## Entry Criteria

- v0.36.5 release-truth closure is merged.
- v0.36.4 remains the current package line.
- ADR-0086 AutoFlow boundary remains accepted.
- No product-code implementation is required to explain the new roadmap.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0086: AI-Readable Architecture and AutoFlow2 Roadmap.
- ADR-0083: Deferred Public Surface Reset.

## Step-by-Step Tasks

1. Add ADR-0091 and mark it as superseding ADR-0086 sequencing from v0.37 to
   v1.0.
2. Record the 2026-06-09 four-product roadmap discussion under
   `docs/conversation/`.
3. Replace v0.37.0 Server/Data/UI closure language with product doctrine and
   rendering contract reset language.
4. Define the future rendering doctrine in docs: static default 0JS,
   DSD/shadow default, light DOM opt-in, explicit client-only paths, SSR/ISR as
   framework core.
5. Split v0.37 into v0.37.1-v0.37.6 SOPs with bounded implementation purposes.
6. Update v0.38, v0.39, and v1.0 SOPs to follow the four-product route.
7. Add the complete v0.37.0 NextVersion package.
8. Align status, roadmap, SOP index, README, and public website roadmap copy.
9. Run the required documentation and website gates.

## Verification

```bash
deno task workflow:check
deno task docs:check-strategy
deno task docs:check-current
deno task fmt:check
deno task lint
deno task autoflow:check-dev
deno task autoflow:report:json
deno task build
deno task test:e2e
```

## Non-Goals

- No DsdElement light DOM implementation.
- No request-time SSR or ISR runtime adapter implementation.
- No data/database adapter implementation.
- No pure CSS UI export implementation.
- No protocol port implementation.
- No new top-level package.
- No package bump, tag, or publish from the roadmap reset alone.

## Exit Criteria

- ADR-0091 governs the v0.37-v1 sequence.
- v0.37.0 is no longer an oversized Server/Data/UI closure epic.
- SOP and NextVersion documents describe step-by-step future implementation
  order.
- Public docs consistently state static default 0JS and DSD/shadow default with
  explicit light DOM opt-in.
- AutoFlow remains evidence tooling, not a product decision-maker.

## AutoFlow Boundary

AutoFlow may verify required files, version state, task evidence, and gate
results. AutoFlow must not choose API names, package splits, database defaults,
license strategy, release actions, or product scope.
