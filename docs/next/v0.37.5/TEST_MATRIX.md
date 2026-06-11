# v0.37.5 Test Matrix

| Area                          | Scope                                                    | Expected                            |
| ----------------------------- | -------------------------------------------------------- | ----------------------------------- |
| Protocol package exports      | New protocol group subpaths                              | importable without package cycles   |
| Renderer conformance          | Current core renderer                                    | passes `runRendererConformance()`   |
| Component adapter conformance | DsdElement/openElement baseline                          | skeleton passes baseline smoke      |
| Runtime adapter conformance   | fetch-compatible handler boundary                        | request to response behavior proven |
| Cache adapter conformance     | memory cache baseline                                    | get/set/delete tests pass           |
| Route manifest contracts      | EntryDescriptor and route declarations                   | type and runtime fixtures pass      |
| Island contracts              | Hydration strategy and client entry metadata             | backward-compatible imports pass    |
| Signal contracts              | Signal-like interop type checks                          | existing signal tests still pass    |
| Data adapter                  | MemoryDataAdapter / re-export path                       | existing data tests still pass      |
| Graph                         | `deno task graph:check`                                  | no cycles, versions aligned         |
| Architecture                  | `deno task arch:check`                                   | passes                              |
| Docs                          | `deno task docs:check-current` and `docs:check-strategy` | passes                              |
| Full test                     | `deno task test`                                         | passes                              |
| UI coverage rebase            | v0.37.4 CSS foundation and deferred daisyUI list         | no new UI dependency or Tailwind    |

Nitro proof commands are planned in v0.37.6, not required for v0.37.5 release
closure.
