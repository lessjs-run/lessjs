# v0.37.6 Risk Register

| Risk                                                                | Severity | Mitigation                                                                |
| ------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| Mount-boundary proof is mistaken for real Nitro output proof        | High     | Keep proof-plan wording explicit and require real Node/Workers output     |
| Nitro route APIs leak into the openElement public authoring API     | High     | Keep openElement handler and route manifest as the public contract        |
| Nitro reduces work but silently replaces render/island semantics    | High     | Add static zero-JS, explicit island JS, and route lifecycle checks        |
| Workers proof passes build but fails runtime assumptions            | Medium   | Add Workers-compatible smoke or document concrete unsupported primitives  |
| ISR/cache mapping is over-claimed                                   | Medium   | Require tests or blockers before claiming support                         |
| Hono ownership becomes unclear during the transition                | Medium   | Record Hono-owned, Nitro-owned, and openElement-owned surfaces explicitly |
| Package graph cycles appear when adapter-vite imports runtime types | High     | Keep runtime contracts in `@openelement/protocols`; run `graph:check`     |
| JSR instability distracts from roadmap closure                      | Medium   | Treat JSR publish and visibility as telemetry only under ADR-0097         |
