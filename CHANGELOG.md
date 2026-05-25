## 0.21.13 (2026-05-25)

### Architecture: Clean Architecture — Import Map Universal Resolution (ADR-0042~0045)

- **SSG Phase 3 refactor**: Split SSR dependency strategy into external + noExternal two tiers.
  - `noExternal`: @lessjs/* + Lit ecosystem (bundled by Rolldown)
  - `external`: parse5, entities, hono, node-fetch, etc. (resolved by Deno ESM Runtime via import map)
- **SSR polyfill unification**: New `ssr-polyfills.ts` module — CSSStyleSheet → HTMLElement → customElements
- **Import map hardening**: Added `entities/` subpath mapping for Deno native npm resolution
- **Consumer template**: genenated deno.json now includes SSR transitive deps (hono, parse5, entities)
- **ADR**: 0042 (Import Map Universal Resolution), 0043 (SSG Phase3 dependency strategy), 0044 (SSR polyfill), 0045 (Native API first-class)

- **Phase 2 import map resolution**: Client island build now uses deno.json import map
  for module resolution, unified with Phase 1 and Phase 3. (ADR-0046)
- **Phase 1 virtual module fix**: Consumer template now includes a `virtual-passthrough`
  resolve plugin (`enforce: 'pre'`) to intercept `virtual:*` module IDs before
  `@deno/vite-plugin`, avoiding unsupported scheme errors. (SOP-015)

### Fixed

- `entities/lib/escape.js` subpath resolution failure in Rolldown SSR bundle
- `customElements is not defined` ReferenceError in SSR environment
- `deno fmt` check failure in ssg-package-resolver.ts

### Changed

- `defaultNoExternal` in build-ssg.ts now only covers @lessjs/* + Lit ecosystem
- SSG entry code uses shared polyfill module instead of inline + output.banner
- importmap.json sidecar now only records external dependencies
