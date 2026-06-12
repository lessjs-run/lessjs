# v0.38.0 Risk Register

| Risk                                          | Impact                          | Mitigation                                               |
| --------------------------------------------- | ------------------------------- | -------------------------------------------------------- |
| Public package names change without ADR       | Breaks users without governance | Require ADR before new package names or removals         |
| Internal APIs remain documented as products   | v1 surface becomes unclear      | Inventory docs and templates before code moves           |
| Compatibility shims preserve unwanted APIs    | Reset fails silently            | Prefer explicit migration notes over silent shims        |
| UI depends on framework routing again         | Product split regresses         | Keep architecture gate and package graph checks strict   |
| Protocols gain runtime dependencies           | Runtime-free boundary regresses | Classify protocol exports and check dependency graph     |
| Hub scope expands into v1 product by accident | Release scope balloons          | Record Hub disposition before exit                       |
| JSR instability distracts release closure     | Roadmap stalls                  | Keep JSR publish as best-effort telemetry under ADR-0097 |
