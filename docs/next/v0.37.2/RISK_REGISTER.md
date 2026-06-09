# v0.37.2 Risk Register

| Risk                                           | Mitigation                                                    |
| ---------------------------------------------- | ------------------------------------------------------------- |
| Runtime contract accidentally chooses a host   | Keep core contract Web-standard and dependency-free           |
| ISR stale behavior becomes ambiguous           | Test blocking and background regeneration separately          |
| Cache backend work turns into database default | Keep DB/KV/cache providers as future adapters or recipes      |
| Public API grows too early                     | Add only one small subpath; defer package split until v0.38.x |
