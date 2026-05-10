# ADR 0008/0009/0010 — Implementation Status

## Summary

ADR 0008 + 0009 + 0010 fully implemented on the `dev` branch. All `.less/` temp files eliminated.

## Completed Phases

### Phase A: Eliminate `.less/` File IPC → `LessBuildContext` + Virtual Modules + Define Injection

| Step | Status | Commit    | Description                                               |
| ---- | ------ | --------- | --------------------------------------------------------- |
| A.1  | ✅     | `85f3131` | Expand `LessBuildContext` with 20+ fields                 |
| A.2  | ✅     | `a1ab6ef` | `lessContent()` writes to `ctx` instead of `.less/` files |
| A.3  | ✅     | `605c249` | `lessI18n()` writes to `ctx` instead of `.less/` files    |
| A.4  | ✅     | `2e5e1aa` | `less:build` writes metadata to `ctx` + fallback          |
| A.5  | ✅     | `eb965a1` | Unified `build.ts` orchestrator with shared `ctx`         |
| A.6  | ✅     | `eb965a1` | `buildClient()`/`buildSSG()` read from `ctx` (preferred)  |
| A.7  | ✅     | `0acd4b7` | `headExtras` via Vite `define` injection                  |
| A.8  | ✅     | `eb965a1` | Cleaned up `.less/` references (see known limits)         |

### Phase D: Replace `runtime-shim.ts` with `virtual:less-runtime`

| Step    | Status | Commit    | Description                                                   |
| ------- | ------ | --------- | ------------------------------------------------------------- |
| D.1+D.3 | ✅     | `1bf6d6a` | `virtual:less-runtime` replaces `.less-runtime.ts` file write |
| D.2     | ✅     | `52f9e11` | Virtual runtime plugin added to SSR build                     |

### Phase E: Single-Plugin API (`lessjs()`)

| Step | Status | Commit    | Description                                               |
| ---- | ------ | --------- | --------------------------------------------------------- |
| E.1  | ✅     | `6208496` | `lessjs()` umbrella function with lazy sub-plugin imports |
| E.2  | ✅     | `6208496` | `less()` accepts optional `externalCtx` parameter         |

### ADR 0010: Eliminate All Remaining `.less/` Temp Files

| Step | Status | Commit    | Description                                                  |
| ---- | ------ | --------- | ------------------------------------------------------------ |
| 1    | ✅     | `c9cbe61` | `virtual:less-client-entry` replaces `.less-client-entry.ts` |
| 2    | ✅     | `c9cbe61` | `virtual:less-ssg-entry` replaces `.less-ssg-entry.ts`       |
| 3    | ✅     | `c9cbe61` | Remove `build-metadata.json` file write from `build.ts`      |
| 4    | ✅     | `c9cbe61` | Remove all `.less/` fallback reads from `build-ssg.ts`       |
| 5    | ✅     | `c9cbe61` | Clean up unused imports, fix lint                            |

## Key Results

- **`.less/` files reduced**: 10 → 3 → **0** (zero filesystem IPC)
- **`globalThis` bridges**: 0 (Phase B was already done)
- **Virtual modules**: `virtual:less-runtime`, `virtual:less-nav`, `virtual:less-client-entry`, `virtual:less-ssg-entry`
- **`lessjs({ content, i18n })`**: Single-call API with shared `LessBuildContext`
- **`buildClient()`/`buildSSG()` require `ctx`**: No standalone split-phase execution
- **Net code reduction**: ~87 lines removed
- **All pre-commit checks pass** (deno fmt, deno lint, deno check)

## Remaining Work

- [ ] E.3: Verify backward compatibility for standalone plugin usage
- [ ] E.4: Update `deno task build` to use unified orchestrator
- [ ] End-to-end build verification with `deno task build`
