# v0.37.3 Risk Register

| Risk                                      | Severity | Mitigation                                                                                            |
| ----------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| Scope creep into ORM/auth                 | High     | ADR explicitly restricts to contract only; no implementation defaults                                 |
| Data adapter becoming a leaky abstraction | Medium   | Type-level contract first; test with memory/file only; no real database in baseline                   |
| Breaking existing ISR cache consumers     | Medium   | Keep FileIsrCache/MemoryIsrCache as-is; data adapter is additive, not replacement                     |
| Too many adapter interfaces               | Low      | Start with a single `DataAdapter<T>`; specialise only when proven needed                              |
| JSR publish gate remains red after CI     | High     | Use graph-driven sequential publish with JSR metadata recovery, then verify `main` publish plus smoke |
