# SOP v0.35.5 — Configuration Deduplication & Standardization

## Purpose

Establish a single source of truth for `deno.json` configurations across all
workspace packages, with automated verification and auto-fix capabilities.

## Background

Prior to v0.35.5, workspace packages had redundant and inconsistent configurations:

- 35 duplicate subpath declarations in root `deno.json`
- Inconsistent `publish`, `include`/`exclude`, and `tasks` across packages
- No automated way to detect or fix configuration drift

## Standard Configuration

Defined in `tools/config-templates.ts`:

```typescript
STANDARD_CONFIGS = {
  publish: { include: ['src/**', 'deno.json', 'README.md', 'LICENSE'] },
  include: ['src'],
  exclude: ['node_modules', 'dist'],
  tasks: { build: 'deno check src/index.ts' },
};
```

## Exception Handling

Packages with legitimate deviations are declared in `CONFIG_EXCEPTIONS`:

| Package               | Exception                         | Reason                   |
| --------------------- | --------------------------------- | ------------------------ |
| `@openelement/hub`    | publish includes `mod.ts`         | Non-standard entry point |
| `@openelement/create` | publish includes `cli.ts`         | CLI entry point          |
| `@openelement/core`   | Extra tasks (lint, test, test:ci) | Core package needs more  |
| `@openelement/hub`    | Custom build task                 | Multi-file check         |
| Adapters              | Build checks multiple files       | SSR + hydration exports  |

## Tools

### Verification

```bash
deno task verify:configs       # Check all 19 packages
deno task verify:configs:fix   # Auto-fix non-compliant configs
```

### autoflow Integration

- Invariant: `I-PACKAGE-CONFIG-STANDARD`
- Severity: error
- Checked by: `deno task autoflow:check`

## Enforcement Layers

1. **pre-commit** (step 8/8): `deno task verify:configs`
2. **pre-push** (autoflow:check): Includes config invariant
3. **CI sop-gate.yml**: `config-validate` job
4. **autoflow**: Fails if any package config deviates from standard

## Maintenance

To update the standard configuration:

1. Edit `tools/config-templates.ts` → `STANDARD_CONFIGS`
2. Run `deno task verify:configs:fix` to apply to all packages
3. Update `CONFIG_EXCEPTIONS` if any package needs special handling
4. Run `deno task autoflow:check` to verify

## References

- `tools/config-templates.ts` — Standard definitions
- `tools/verify-package-configs.ts` — Validation script
- `tools/autoflow/invariant-checker.ts` — autoflow integration
