# Package Surface Inventory

This is the v0.40 14-package product-line truth table.

```text
openElement = Elements + UI + Framework + Protocols
```

ADR-0101 approves the product-line reset and governance boundary. v0.40 removes
historical archive packages and interop proofs from the current package graph.

## Current 14-package surface

| Package                     | Class          | v0.40 decision                            |
| --------------------------- | -------------- | ----------------------------------------- |
| `@openelement/app`          | product-facing | Framework authoring API.                  |
| `@openelement/create`       | product-facing | Starter and consumer entry.               |
| `@openelement/elements`     | product-facing | Elements authoring API.                   |
| `@openelement/protocols`    | product-facing | Runtime-free replacement boundary.        |
| `@openelement/ui`           | product-facing | First-party `open-*` component library.   |
| `@openelement/core`         | foundation     | Low-level implementation kernel.          |
| `@openelement/runtime`      | foundation     | Runtime support behind Framework.         |
| `@openelement/router`       | foundation     | Route support behind Framework.           |
| `@openelement/signals`      | foundation     | Signal implementation behind protocols.   |
| `@openelement/style-sheet`  | foundation     | CSS and StyleSheet support.               |
| `@openelement/ssg`          | foundation     | SSG implementation behind Framework.      |
| `@openelement/content`      | foundation     | Content support behind Framework recipes. |
| `@openelement/i18n`         | foundation     | I18n support behind Framework recipes.    |
| `@openelement/adapter-vite` | foundation     | Vite/Nitro build bridge.                  |

## Removed from current graph

v0.40 removes the historical RPC, Hub, CEM, compat-check, Lit adapter, React
adapter, and Vanilla adapter packages from the current workspace and publish
order. CEM detection needed by `@openelement/ssg` is now an internal SSG
implementation detail instead of a public package.

Package deletion, package merge, package addition, publish-order changes, and
default runtime or signal-engine changes still require human-approved ADR
evidence under ADR-0101.
