# v0.38.0 Tasks

## A. Inventory

- [x] Generate a package and subpath inventory for all 20 workspace packages.
- [x] Record package roles, exports, internal dependencies, and docs exposure.
- [ ] Record create-template and website import paths.

## B. Classification

- [x] Classify every package as product, advanced subpath, internal, archived,
      or removed.
- [x] Classify every public subpath with the same taxonomy.
- [x] Identify package-name decisions that require ADR approval.

## C. Product Map

- [x] Define the v0.38 product map for elements, UI, protocols, and framework.
- [x] Decide whether existing package names are retained or changed.
- [x] Document Hub disposition through v0.38 and v1.0.

## D. Docs And Templates

- [ ] Align root README, README.zh, website docs, package READMEs, and create
      templates with the product map.
- [ ] Remove internal implementation details from public docs.
- [ ] Add migration notes for intentional breaking changes.

## E. Gates

- [ ] Run workflow, graph, architecture, docs, format, lint, typecheck, test,
      build, E2E, generated consumer, and publish dry-run gates.
- [ ] Record AutoFlow evidence and release-truth state.
