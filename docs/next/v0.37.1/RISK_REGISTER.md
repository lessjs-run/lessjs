# v0.37.1 Risk Register

| Risk                                           | Mitigation                                            |
| ---------------------------------------------- | ----------------------------------------------------- |
| Light DOM becomes the default by accident      | Tests keep shadow/DSD as the default path.            |
| `dsd: false` is confused with light DOM        | ADR-0092 and docs keep the terms separate.            |
| Light mode silently adopts shadow-only styles  | Document that static styles are shadow-mode behavior. |
| Reactive update path only works in shadow mode | Add light-mode update test.                           |
