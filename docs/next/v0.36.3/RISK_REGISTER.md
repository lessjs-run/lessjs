# v0.36.3 Risk Register

| Risk                                        | Likelihood | Impact | Mitigation                                       |
| ------------------------------------------- | ---------- | ------ | ------------------------------------------------ |
| Build breaks after migration                | Medium     | High   | Gate: build after each tier                      |
| Type errors from import path changes        | Medium     | High   | Gate: typecheck after each tier                  |
| Vite dev server breaks                      | Low        | High   | Dev server imports from ssg, not removed         |
| adapter-vite tests break                    | Medium     | Medium | Gate: test after each tier                       |
| SSG package missing deps (typescript, vite) | Low        | Medium | Add deps to deno.json                            |
| Circular dependency (ssg ↔ adapter-vite)    | Low        | High   | ssg depends on vite types only, not adapter-vite |
| Compat re-exports break consumers           | Low        | Medium | Keep compat re-exports in adapter-vite index.ts  |
| E2E failures from rendering changes         | Low        | Medium | Run test:e2e before completing                   |
| Version bump mismatch                       | Low        | Low    | Gate: graph:check verifies alignment             |

## Non-Goals (explicitly deferred)

- Cross-browser E2E fixes → v0.36.4
- Server/Data/UI product closure → v0.37.0
- Removing adapter-vite package → never (it's the Vite orchestration shell)
