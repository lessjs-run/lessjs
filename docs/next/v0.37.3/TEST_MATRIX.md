# v0.37.3 Test Matrix

| Test Area             | Scope                                                      | Expected                 |
| --------------------- | ---------------------------------------------------------- | ------------------------ |
| `MemoryDataAdapter`   | get, keys, missing key, concurrent access                  | 4 tests                  |
| `FileDataAdapter`     | get, keys, missing key, non-existent dir, permission error | 5 tests                  |
| ISR cache regression  | FileIsrCache, MemoryIsrCache persistence, manifest key     | existing tests must pass |
| Type-level contract   | DataAdapter<T> type compatibility, generic inference       | typecheck only           |
| Graph check           | no new cycles from data adapter module                     | pass                     |
| Architecture contract | no duplicate data types, no ORM leakage                    | pass                     |
