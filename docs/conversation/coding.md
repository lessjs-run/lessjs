# LessJS Coding Conventions

## Deno / Lint

- `// deno-lint-ignore-file RULE` must be the **first line** of the file (above comments)
- Per-line `// deno-lint-ignore RULE` must be on the line immediately above the violation
- Do NOT use `// deno-lint-ignore` for rules that don't exist in `deno lint` (e.g., JSR warnings)
- `no-explicit-any`: use per-file exemption only for TC39 polyfill code; otherwise fix the type

## JSR Import Map (deno.json)

- Version constraints: always use `^X.Y.Z` where Z is the version that introduced the export
  - Example: `@openelement/core/build-types` introduced in 0.14.11 → use `^0.14.11`
- When adding a new subpath export to a package, update ALL downstream `deno.json` imports
- Never add `jsr:` import map entries for packages that create circular publish dependencies
- Use dynamic `import()` for runtime-only cross-package dependencies

## Type Casting

- Single cast: `val as TargetType` (when types overlap)
- Double cast: `val as unknown as TargetType` (when types don't overlap — necessary for
  `Record<string, unknown>` → specific interface)
- Never use `any` as an intermediate type

## Branch Discipline

- All work on `dev` branch
- Never push directly to `main` unless explicitly ordered
- Sync main from dev: `git push origin origin/dev:refs/heads/main --force`
- Tags go on both branches

## File Naming

- Source files: `kebab-case.ts`
- Test files: `kebab.test.ts` in `__tests__/`
- ADR files: `NNNN-kebab-case-title.md`
