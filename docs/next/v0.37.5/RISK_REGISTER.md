# v0.37.5 Risk Register

| Risk                                                                                 | Severity | Mitigation                                                                                                             |
| ------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Protocol work becomes abstract architecture with no implementation proof             | High     | Require conformance tests and baseline implementations for accepted protocols                                          |
| Nitro is treated as the public app API instead of the default runtime implementation | Medium   | Keep `openElement()` as the primary user API; route Nitro config through adapter/runtime options                       |
| Vite replacement is over-promised                                                    | Medium   | State that Vite is the default build engine and not short-term replaceable                                             |
| Package graph cycles appear when protocol types move                                 | High     | Move only runtime-free types into `@openelement/protocols`; run `graph:check` after each slice                         |
| Existing public imports break                                                        | High     | Keep backward-compatible re-exports from original packages where needed                                                |
| UI coverage is lost in the runtime pivot                                             | Medium   | Preserve the CSS foundation and explicitly defer interactive coverage to a later UI slice                              |
| JSR publish instability hides release truth                                          | High     | Keep direct `deno info --no-config jsr:@openelement/<pkg>@<version>` checks and consumer smoke as closure requirements |
| Product positioning becomes too abstract                                             | Medium   | Keep Web Components as the default product identity and Vite + Nitro as the default engine                             |
