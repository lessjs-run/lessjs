# v0.39.0 Risk Register

| Risk                                                      | Impact                                          | Mitigation                                                                                         |
| --------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Generated app does not match documented first-run imports | RC docs become misleading                       | Drive implementation from create-template smoke and docs checks                                    |
| Vite + Nitro proof diverges from starter defaults         | Deploy guidance becomes brittle                 | Validate runtime/deploy evidence from the generated path                                           |
| Archived/internal packages leak back into public guides   | Product map loses clarity before v1.0           | Re-run docs strategy checks and review package README wording                                      |
| Public README drifts from current package or active line  | Product and release story becomes false         | Add `docs:check-public` and run it in AutoFlow gate                                                |
| README.zh mojibake returns                                | Public Chinese docs lose credibility            | Gate README files for mojibake/replacement text                                                    |
| Four-product matrix is flattened into package catalog     | Product positioning becomes noisy               | Keep supporting packages out of first-class product tables                                         |
| Elements reset looks like an implemented package too soon | Users expect unavailable imports                | Document `@openelement/elements` as future direction until built                                   |
| Preact island proof expands into general renderer work    | v0.40 scope grows unbounded                     | Keep Preact as the only heavy island proof; freeze Vue/React/Svelte                                |
| Preact Signals becomes branding-driven default too early  | Signal semantics regress behind a familiar name | Require protocol conformance, bundle, SSR/CSR, and consumer-smoke evidence before any default swap |
| Package bump happens before implementation gates          | Release truth becomes unverifiable              | Done after local v0.39 gates passed; re-run gates after bump                                       |
| JSR publish regresses after recovery                      | Release closure blocks on distribution          | ADR-0100 restores JSR as a gate; inspect CI logs and fix locally                                   |
