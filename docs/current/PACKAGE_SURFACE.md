# Package Surface Inventory

This is the v0.40.x 11-package cleanup-train truth table.

```text
openElement = Elements + UI + Framework + Protocols
```

ADR-0101 approves the product-line reset and AutoFlow3 governance boundary.
ADR-0105 approves the v0.40.x breaking cleanup train and the 14-to-11 package
graph collapse.

## Current 11-package surface

| Package                     | Class          | v0.40.x decision                                                                                          |
| --------------------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `@openelement/app`          | product-facing | Framework authoring API, including optional Preact island proof under `./preact`.                         |
| `@openelement/create`       | product-facing | Starter and consumer entry.                                                                               |
| `@openelement/elements`     | product-facing | Canonical component-authoring facade for `OpenElement`, `DsdElement`, `StyleSheet`, islands, and signals. |
| `@openelement/protocols`    | product-facing | Runtime-free replacement boundary.                                                                        |
| `@openelement/ui`           | product-facing | First-party `open-*` component library.                                                                   |
| `@openelement/core`         | foundation     | Low-level implementation kernel, now including `StyleSheet`.                                              |
| `@openelement/router`       | foundation     | Route support behind Framework.                                                                           |
| `@openelement/signals`      | foundation     | Signal implementation behind protocols; default remains `alien-signals`.                                  |
| `@openelement/content`      | foundation     | Content support behind Framework recipes.                                                                 |
| `@openelement/i18n`         | foundation     | I18n support behind Framework recipes.                                                                    |
| `@openelement/adapter-vite` | foundation     | Vite/Nitro build bridge; SSG internals live here.                                                         |

## Removed from current graph

v0.40.x removes historical and collapsed packages from the current workspace and
publish order:

- `@openelement/rpc`
- `@openelement/hub`
- `@openelement/cem`
- `@openelement/compat-check`
- `@openelement/adapter-lit`
- `@openelement/adapter-react`
- `@openelement/adapter-vanilla`
- `@openelement/runtime`
- `@openelement/style-sheet`
- `@openelement/ssg`

`StyleSheet` now lives in `@openelement/core/style-sheet` and is re-exported
from `@openelement/elements`. SSG is internal to `@openelement/adapter-vite`.
The canonical authoring import is `@openelement/elements`.

## Governance

The v0.40.x cleanup train is manually approved breaking patch work, not normal
AutoFlow patch automation. AutoFlow3 patch release must refuse this train unless
the release state references approval id `ADR-0105/v0.40.x-cleanup-train`.
