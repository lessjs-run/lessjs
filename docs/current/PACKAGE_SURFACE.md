# Package Surface Inventory

This file is the v0.40 package-surface truth table. It classifies every
workspace package so the repository stops presenting implementation, adapter,
tooling, and archived packages as equal product lines.

Product target:

```text
openElement = Elements + UI + Framework + Protocols
```

## Classification Rules

- `product-facing`: first-run public product surface.
- `foundation`: implementation package that supports product surfaces.
- `adapter`: compatibility or framework interop surface.
- `archive-candidate`: frozen, merge-candidate, or removal-candidate package
  that requires ADR approval before topology changes.

Package deletion, package merge, package addition, publish-order changes, and
package graph topology changes require ADR-backed human approval under
ADR-0101.

## Current Packages

| Package                        | Class             | v0.40 decision                                                      |
| ------------------------------ | ----------------- | ------------------------------------------------------------------- |
| `@openelement/app`             | product-facing    | Framework authoring API; keep first-run.                            |
| `@openelement/create`          | product-facing    | Starter and consumer entry; keep first-run.                         |
| `@openelement/protocols`       | product-facing    | Runtime-free replacement boundary; keep first-run.                  |
| `@openelement/ui`              | product-facing    | First-party `open-*` component library; keep first-run.             |
| `@openelement/core`            | foundation        | Low-level implementation kernel; demote from first-run docs.        |
| `@openelement/runtime`         | foundation        | Runtime support; keep if Framework still requires it.               |
| `@openelement/router`          | foundation        | Route support; keep behind Framework surface.                       |
| `@openelement/signals`         | foundation        | Signal implementation package; default change requires ADR.         |
| `@openelement/style-sheet`     | foundation        | CSS/StyleSheet support; keep behind Elements/UI surfaces.           |
| `@openelement/ssg`             | foundation        | SSG implementation package; keep behind Framework surface.          |
| `@openelement/content`         | foundation        | Content support; keep behind docs/content recipes.                  |
| `@openelement/i18n`            | foundation        | I18n support; keep behind Framework recipes.                        |
| `@openelement/adapter-vite`    | foundation        | Vite/Nitro build bridge; keep as Framework implementation.          |
| `@openelement/adapter-lit`     | adapter           | Compatibility proof; freeze expansion unless ADR reopens.           |
| `@openelement/adapter-vanilla` | adapter           | Compatibility proof; freeze expansion unless ADR reopens.           |
| `@openelement/adapter-react`   | adapter           | Compatibility proof; freeze expansion unless ADR reopens.           |
| `@openelement/hub`             | archive-candidate | Hub remains frozen; decide retain, merge, or remove by ADR.         |
| `@openelement/cem`             | archive-candidate | Tooling candidate; decide retain, merge, or remove by ADR.          |
| `@openelement/compat-check`    | archive-candidate | Tooling candidate; decide retain, merge, or remove by ADR.          |
| `@openelement/rpc`             | archive-candidate | Archived feature candidate; decide retain, merge, or remove by ADR. |

## Future Package

| Package                 | Class          | v0.40 decision                                                                                         |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `@openelement/elements` | product-facing | ADR-0099-approved Elements direction. Adding the package still requires the full package graph update. |
