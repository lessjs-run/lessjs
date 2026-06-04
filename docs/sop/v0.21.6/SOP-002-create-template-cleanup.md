# SOP-002: Remove Hardcoded JSR URL Aliases from create Template

Status: implemented\
Target version: v0.21.6\
Owner: @openelement/create

## Objective

Remove all hardcoded JSR URL aliases from the `create/cli.ts` template's
`vite.config.ts` output. These aliases are redundant once SOP-001 is fixed
(the plugin auto-generates them), and they break on Windows.

## Problem Statement

The `create/cli.ts` `buildTemplates()` function generates a `vite.config.ts` that
contains per-component JSR URL aliases:

```typescript
// Currently generated (BAD)
const lessUiAliases = {
  '@openelement/ui/less-card': 'https://jsr.io/@openelement/ui/0.21.5/src/less-card.ts',
  '@openelement/ui/less-button': 'https://jsr.io/@openelement/ui/0.21.5/src/less-button.ts',
  // ... 10+ more entries
};
```

Three distinct problems:

1. **Redundant**: The `lessjs()` plugin already generates these aliases via
   `packageIslands: ['@openelement/ui']`. The hardcoded list is duplicate work.

2. **Broken on Windows**: Rolldown treats `https://jsr.io/...` as file paths,
   mangling `https://` to `https:/`, producing "os error 123"
   (invalid filename/volume syntax).

3. **Fragile**: Each component name and version is hardcoded. Adding a new UI
   component requires updating the template, and version bumps require
   string replacements.

## Scope

1. Remove the `lessUiAliases` object from the create template
2. Remove the `resolve: { alias: lessUiAliases }` section from generated config
3. Keep `packageIslands: ['@openelement/ui']` — the plugin handles the rest
4. Update the create integration test to verify no hardcoded aliases exist

## Generated Config Target

After fix, the generated `vite.config.ts` should contain:

```typescript
export default defineConfig({
  plugins: [lessjs({
    packageIslands: ['@openelement/ui'],
    // ... other config
  })],
});
```

No `resolve.alias` section, no `lessUiAliases` object, no JSR URLs.

## Depends On

- SOP-001 (JSR-mode alias generation must work first, otherwise removing
  hardcoded aliases will break the SSR build)

## Acceptance Criteria

- [ ] Generated `vite.config.ts` contains zero JSR URLs
- [ ] Generated `vite.config.ts` contains no `resolve.alias` section
- [ ] `less create test && cd test && deno task build` works (with SOP-001 fix)
- [ ] Existing integration test updated to check for absence of hardcoded aliases

## Validation

```powershell
deno test packages/create/__tests__/cli.test.ts --filter "generated project builds"
```
