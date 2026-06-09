# v0.37.2 NextVersion

v0.37.2 implements the SSR / ISR Server Runtime Contract from ADR-0093.

Scope:

- keep SSR and ISR as framework core capabilities;
- add a platform-neutral ISR runtime contract;
- preserve `IsrCache`, `MemoryIsrCache`, and `FileIsrCache` as baseline
  primitives;
- prove manifest lookup, cache hit, stale, miss, and not-found behavior;
- keep Hono, Express, Deno KV, Cloudflare KV/D1, and database caches as adapter
  or recipe choices, not defaults.

## Related

- SOP: `docs/sop/v0.37.2/README.md`
- ADR: `docs/adr/ADR-0093-ssr-isr-runtime-contract.md`
- Roadmap ADR: `docs/adr/ADR-0091-four-product-platform-roadmap.md`
