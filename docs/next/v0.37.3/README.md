# v0.37.3 NextVersion

v0.37.3 defines the data / database boundary for the four-product validation
train. It does not ship an ORM, auth system, or built-in database.

Scope:

- audit existing data patterns in the codebase (FileIsrCache, MemoryIsrCache,
  blog-data, i18n-data, nav, route `revalidate`, isr-manifest.json);
- define a data adapter contract that is platform-neutral, side-effect-free at
  the type level, and testable without a real database;
- provide minimal memory/file test fixtures as baseline proofs;
- keep database, ORM, auth, and migration choices as adapter or recipe
  decisions, not framework defaults;
- require ADR-0095 approval before any default database, ORM, or migration
  story.

## Related

- SOP: `docs/sop/v0.37.3/README.md`
- Roadmap ADR: `docs/adr/ADR-0091-four-product-platform-roadmap.md`
- ISR cache contract: `docs/adr/ADR-0093-ssr-isr-runtime-contract.md`
