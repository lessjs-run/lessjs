# v0.37.0 NextVersion

v0.37.0 is a product-doctrine and rendering-contract reset. It does not
implement light DOM, server runtime adapters, database adapters, pure CSS UI, or
new protocol ports. It prepares the repository for the v0.37.x four-product
validation train.

Scope:

- Adopt ADR-0091 as the governing v0.37-v1 roadmap.
- Replace the oversized v0.37.0 Server/Data/UI closure with a v0.37.x train.
- Define default zero-JS, SSR/ISR, DSD/shadow, light DOM opt-in, and
  client-only terminology.
- Reframe future SOPs as step-by-step implementation plans.
- Align public roadmap, status, README, website roadmap, SOP index, and
  workflow checks.

Deferred to v0.37.1 and later:

- DsdElement shadow/light implementation.
- SSR/ISR request-time runtime implementation.
- data/database adapter contracts.
- pure CSS UI export implementation.
- protocol port implementation.
- full-stack preset smoke implementation.

## Related

- SOP: `docs/sop/v0.37.0/README.md`
- ADR: `docs/adr/ADR-0091-four-product-platform-roadmap.md`
- [SOP v0.37.0](../../sop/v0.37.0/README.md)
- [ADR-0091: Four-Product Platform Roadmap](../../adr/ADR-0091-four-product-platform-roadmap.md)
- [Conversation: Four-Product Roadmap Reset](../../conversation/20260609/four-product-roadmap-reset.md)
