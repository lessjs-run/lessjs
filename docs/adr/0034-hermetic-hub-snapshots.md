# ADR-0034: Hermetic Hub Snapshots

## Status: Proposed

## Context

Current Hub snapshot pipeline (`packages/hub/src/snapshot-playwright.ts`) uses
`esm.sh` CDN for browser-side ESM resolution and hardcodes package versions for
Shoelace and media-chrome. This approach has several problems:

1. **Non-deterministic**: CDN availability and response times vary between runs
2. **Version drift**: Hardcoded versions may differ from local dependencies
3. **Not hermetic**: External network calls make builds non-reproducible
4. **CI fragility**: CDN outages cause snapshot failures
5. **Security**: Loading arbitrary CDN content increases attack surface

## Decision

Migrate to local `node_modules` + temporary static server:

1. **Resolution**: Install packages via `deno install` / `npm install` to local
   `node_modules`, then serve via a temporary static HTTP server
2. **Lockfile hash**: Record `deno.lock` hash and resolved package versions in
   snapshot metadata
3. **Version gate**: Fail if resolved version differs from lockfile
4. **No CDN**: Remove all `esm.sh` references from snapshot pipeline
5. **Reproducibility**: Same lockfile + same source = identical snapshots

## Implementation Phases

### Phase 1 (v0.19.x): Metadata enrichment

- Add version/source metadata to snapshot output
- Log `esm.sh` base URL and resolved versions
- No behavior change, just observability

### Phase 2 (v0.20.0): Local server migration

- Start a temporary `deno serve` or Vite dev server for ESM resolution
- Point Playwright at local server instead of `esm.sh`
- Keep `esm.sh` as fallback with warning

### Phase 3 (v0.21.0): Remove CDN dependency

- Remove `esm.sh` fallback entirely
- All snapshots must resolve locally
- CI enforces hermetic builds only

## Consequences

- Snapshots become deterministic and reproducible
- CI no longer depends on `esm.sh` availability
- Requires `node_modules` in CI (already present for Vite builds)
- Slightly more complex server setup in scan pipeline
- Better security posture (no arbitrary CDN content)
