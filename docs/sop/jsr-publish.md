# SOP: JSR Publish Dependency Management

## Rule: No Circular JSR Dependencies

JSR publish resolves `jsr:` dependencies at publish time. If package A's `deno.json`
imports `jsr:@openelement/B@^ver/subpath` and package B's imports `jsr:@openelement/A@^ver`,
neither can publish until the other is already published. This creates a deadlock.

## Publish Order (see docs/status/STATUS.md)

Core first, then packages that only depend on core, then packages that depend on those.

## Dynamic Imports for Runtime-Only Dependencies

When adapter-vite needs to use content at runtime but must not create a
publish-time dependency, use dynamic `import()`:

```ts
// WRONG: static import creates JSR publish-time dependency
import { generateSitemap } from '@openelement/content/sitemap';

// RIGHT: dynamic import resolved at runtime via workspace import map
const { generateSitemap } = await import('@openelement/content/sitemap');
```

JSR will emit `unanalyzable-dynamic-import` warnings — these are acceptable
for genuinely runtime-path-dependent imports. Do NOT add these to `deno.json`
imports map as `jsr:` entries.

## Import Map Hygiene

- Remove `jsr:` entries from `deno.json` imports if source code no longer uses them
- Always verify: `grep -rn "from '@openelement/PKG" packages/THIS/src/` before adding jsr deps
- Workspace-level `deno.json` import map provides local resolution; `jsr:` entries are
  only needed for published packages

## Metadata Propagation Gate

JSR can expose `https://jsr.io/@openelement/<pkg>/<version>_meta.json` before
`https://jsr.io/@openelement/<pkg>/meta.json` lists that version. The version
metadata proves that JSR accepted the immutable package, but Deno fresh
consumers still resolve through package-level `meta.json`.

Post-publish smoke must therefore wait for package-level metadata before
running `deno run -A jsr:@openelement/create@<version>`:

```sh
deno run --allow-read --allow-net tools/wait-jsr-release-metadata.ts
```

The release may be called closed only after all workspace packages list the
release in package-level metadata, report it as `latest`, and consumer smoke
passes.
