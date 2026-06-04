# SOP-001: Consumer Surface Cleanup

> Version: v0.22.0\
> Priority: P0\
> Status: PLANNED\
> Depends on: ADR-0049, ADR-0047

## Objective

Make a generated LessJS project expose only user-facing imports. Framework
transitive dependencies and internal subpaths must be resolved by LessJS build
infrastructure, not copied into ordinary consumer `deno.json` files.

## Current Problem

`@openelement/create` currently emits imports for framework internals and transitive
dependencies including `parse5`, `entities`, `hono`, `@openelement/signals/framework`,
`@openelement/core/navigation`, and `@openelement/ui/`. This is a product-surface leak.

## Target Files

- `packages/create/cli.ts`
- `packages/create/__tests__/cli.test.ts`
- `packages/app/src/index.ts`
- `packages/app/deno.json`
- `packages/adapter-vite/src/external-resolver.ts`
- `packages/adapter-vite/src/cli/build-ssg.ts`
- `docs/adr/ADR-0047-deno-pre-resolution-external-deps.md`

## Target Contract

Generated projects should start near this shape:

```json
{
  "imports": {
    "@openelement/app": "jsr:@openelement/app@^0.22",
    "@openelement/core": "jsr:@openelement/core@^0.22",
    "@openelement/ui": "jsr:@openelement/ui@^0.22"
  }
}
```

Additional imports are allowed only when the generated template directly imports
them in user-visible code.

## Procedure

### Step 1: Inventory the Consumer Import Graph

- [ ] Generate a project with local `packages/create/cli.ts`.
- [ ] Record every import in generated source files.
- [ ] Classify each `deno.json` import as:
  - direct user source import;
  - framework public entry;
  - framework internal subpath;
  - build tool;
  - transitive SSR dependency.

Acceptance:

- [ ] No import is removed before its consumer is identified.
- [ ] The inventory is added to the implementation PR or release note.

### Step 2: Move Internal Resolution Behind the Framework

- [ ] Keep ADR-0047 pre-resolution in `adapter-vite` as the owner of external
      SSR dependency discovery.
- [ ] Add the minimum bridge needed so `@openelement/app` / `adapter-vite` can supply
      sidecar import-map data without requiring consumers to write it by hand.
- [ ] Do not make `@openelement/app` a dumping ground for adapter internals; it may
      expose orchestration options, but resolver implementation belongs in
      `adapter-vite`.

Acceptance:

- [ ] `parse5`, `entities`, and `hono` are absent from generated consumer
      `deno.json` unless direct user source imports them.
- [ ] SSR build still resolves subpaths such as `entities/lib/*`.

### Step 3: Simplify `@openelement/create`

- [ ] Remove unused default imports from the generated template.
- [ ] Keep tasks stable: `dev`, `build`, and `preview` must still work.
- [ ] Avoid asking users to understand Rolldown/Vite external/noExternal
      internals.

Acceptance:

- [ ] Generated project builds from a clean temp directory.
- [ ] Generated project can run at least one Playwright smoke test.

### Step 4: Update Docs

- [ ] Update ADR-0047 with consumer-surface implications.
- [ ] Update quickstart docs once they exist.
- [ ] Document the rule: users import app/core/ui; build internals stay hidden.

## Verification

```sh
deno test packages/create/__tests__/cli.test.ts --allow-read --allow-write --allow-env --allow-run --allow-ffi
deno task typecheck
deno task build
```

Generated consumer proof:

```sh
deno run -A packages/create/cli.ts test-blog
cd test-blog
deno task build
```

## Exit Criteria

- Consumer `deno.json` is small and explainable.
- Internal resolution stays test-covered.
- No JSR consumer regression is introduced.
