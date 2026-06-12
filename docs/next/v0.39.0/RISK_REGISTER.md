# v0.39.0 Risk Register

| Risk                                                      | Impact                                  | Mitigation                                                       |
| --------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| Generated app does not match documented first-run imports | RC docs become misleading               | Drive implementation from create-template smoke and docs checks  |
| Vite + Nitro proof diverges from starter defaults         | Deploy guidance becomes brittle         | Validate runtime/deploy evidence from the generated path         |
| Archived/internal packages leak back into public guides   | Product map loses clarity before v1.0   | Re-run docs strategy checks and review package README wording    |
| Public README drifts from current package or active line  | Product and release story becomes false | Add `docs:check-public` and run it in AutoFlow gate              |
| README.zh mojibake returns                                | Public Chinese docs lose credibility    | Gate README files for mojibake/replacement text                  |
| Four-product matrix is flattened into package catalog     | Product positioning becomes noisy       | Keep supporting packages out of first-class product tables       |
| Elements reset looks like an implemented package too soon | Users expect unavailable imports        | Document `@openelement/elements` as future direction until built |
| Vue adapter proof expands into general renderer work      | v0.39 scope grows unbounded             | Keep Vue as a bounded adapter proof; do not add renderer fields  |
| Package bump happens before implementation gates          | Release truth becomes unverifiable      | Done after local v0.39 gates passed; re-run gates after bump     |
| JSR publish latency distracts from roadmap execution      | External registry state blocks progress | Treat JSR publish as best-effort telemetry under ADR-0097        |
