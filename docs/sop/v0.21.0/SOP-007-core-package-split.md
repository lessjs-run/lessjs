# SOP-007: Core Package Split — compat-check, cem, style-sheet

> Version: v0.21.0
> Priority: P0
> Status: IMPLEMENTED (DOCUMENTATION CATCH-UP)
> Depends on: SOP-001 (DsdElement+Signals), SOP-006 (Unified Event Model)
> Audit Date: 2026-05-23

## Objective

Extract three independent packages from `@openelement/core`:

1. **`@openelement/compat-check`** — SSR compatibility classifier (tier system, tag validation)
2. **`@openelement/cem`** — Custom Elements Manifest parser/reader
3. **`@openelement/style-sheet`** — Cross-environment CSSStyleSheet shim

Each package must have its own `deno.json`, publish path, and be importable
independently without pulling all of `@openelement/core`.

## Non-Goals

- Do not move CLI commands (`less-add`, `validate-manifest`) out of core yet.
- Do not break existing `@openelement/core` subpath exports (`/compatibility`, `/cem-parser`).
- Do not change public API signatures.

## Actual Implementation

All three packages were created in v0.21.0:

```
packages/compat-check/
├── deno.json          # version: "0.21.0"
├── src/
│   └── index.ts       # Re-exports from @openelement/core/compatibility
└── README.md

packages/cem/
├── deno.json          # version: "0.21.0"
├── src/
│   └── index.ts       # Re-exports from @openelement/core/cem-parser
└── README.md

packages/style-sheet/
├── deno.json          # version: "0.21.0"
├── src/
│   ├── index.ts       # Re-exports StyleSheet class
│   └── style-sheet.ts # CSSStyleSheet shim implementation
└── README.md
```

### Package-by-Package Detail

#### `@openelement/compat-check`

Exports:

- `classifyCemManifest(manifest)` → compatibility tiers
- `classifyTag(tagName)` → single tag classification
- `isValidTagName(name)` → W3C custom element name validation
- `validateModulePath(path)` → module path sanity check

Tiers:

| Tier               | Meaning                          |
| ------------------ | -------------------------------- |
| `ssr-capable`      | Full SSR-safe, DSD output works  |
| `client-only`      | Browser-only, needs CSR fallback |
| `rejected`         | Known issues, cannot be used     |
| `experimental-dom` | Uses experimental DOM features   |

#### `@openelement/cem`

Exports:

- `parseCem(content)` → parse CEM JSON string
- `readCemFile(path)` → read and parse CEM file
- `classifyCemManifest(manifest)` → compatibility classification
- `extractLessDeclarations(manifest)` → extract LessJS-specific metadata
- `findModulePathForTag(manifest, tagName)` → resolve module path for a tag
- `validateModulePaths(manifest)` → validate all module paths

#### `@openelement/style-sheet`

Exports:

- `StyleSheet` class — delegates to native `CSSStyleSheet` in browser, in-memory shim in Deno/Node
- `StyleSheetLike` type
- `StyleSheetRule` type

## Known Limitation

**Current implementation is a thin re-export layer.** The actual implementation
lives in `@openelement/core/src/` (compatibility.ts, cem-parser.ts, style-sheet.ts).
The new packages re-export from core via subpath imports:

```ts
// packages/compat-check/src/index.ts (actual)
export { classifyCemManifest, ... } from '@openelement/core/compatibility';
```

This is "logical separation" rather than "physical separation". The
implementation should be physically moved into each package's src/ directory
in v0.22.0 to eliminate the cross-package import dependency.

## Verification

```sh
deno task typecheck
deno task test
deno task build
```

- All three packages have independent `deno.json` with correct version (0.21.0)
- Core re-exports preserved via subpath exports for backward compatibility
- No test regression (760 passed)

## Exit Criteria

- [x] Three independent packages with own `deno.json` and publish paths
- [x] Core subpath exports preserved for backward compatibility
- [x] All tests pass without regression
- [ ] **P2**: Physically move implementation from core/src/ to each package's src/

## Related

- SOP-001: DsdElement + Signals Integration
- `packages/compat-check/`, `packages/cem/`, `packages/style-sheet/`
- Comprehensive review 2026-05-23: package split is "logical" not "physical"
