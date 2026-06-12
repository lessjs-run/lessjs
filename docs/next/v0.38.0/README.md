# v0.38.0 NextVersion

v0.38.0 resets and hardens the public product/package surface after the
v0.37.x validation train proved DsdElement shadow/light behavior, SSR/ISR
runtime contracts, data/database boundaries, protocol-first architecture, and
the Vite + Nitro runtime path.

The release goal is not to add broad new features. The goal is to decide and
prove the public surface that v0.39.0 can validate as the release-candidate
framework surface.

## Scope

### Surface Inventory

- [ ] inventory every `@openelement/*` package;
- [ ] inventory every exported public subpath;
- [ ] inventory docs, README, website, and create-template import paths;
- [ ] identify internal implementation details currently presented as product
      APIs.

### Classification

- classify each surface as product, advanced subpath, internal, archived, or
  removed;
- decide whether package names such as `@openelement/elements`,
  `@openelement/protocol`, or `@openelement/framework` need ADR approval;
- keep `@openelement/ui` independent from framework routing;
- keep protocol contracts runtime-free and small.

### Hardening

- align package READMEs, root READMEs, website docs, and create templates;
- update migration notes for intentional breaking changes;
- update architecture and package graph gates if the reset changes contracts;
- prove the generated consumer path before package bump.

## Current Evidence

- v0.37.6 is released at tag `v0.37.6`.
- `@openelement/protocols` owns runtime-free protocol boundaries from v0.37.5.
- `fixtures/nitro-proof/` proves the Nitro runtime path from v0.37.6.
- `docs/sop/v0.38.0/README.md` defines the product surface reset contract.

## Non-Goals

- No new feature scope beyond reset blockers.
- No ORM, auth, database, or backend platform ownership.
- No silent compatibility shims for intentionally removed 0.x imports.
- No new package name without ADR approval.

## Related

- SOP: `docs/sop/v0.38.0/README.md`
- Surface inventory: `docs/next/v0.38.0/PACKAGE_SURFACE_INVENTORY.md`
- Surface classification:
  `docs/next/v0.38.0/PRODUCT_SURFACE_CLASSIFICATION.md`
- Product map: `docs/next/v0.38.0/PRODUCT_MAP.md`
- Roadmap: `docs/roadmap/ROADMAP.md`
- Status: `docs/status/STATUS.md`
- Prior line: `docs/next/v0.37.6/`
