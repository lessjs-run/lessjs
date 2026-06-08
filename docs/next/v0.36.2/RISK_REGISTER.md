# v0.36.2 Risk Register

| Risk                                                           | Impact                                      | Mitigation                                                                  |
| -------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| Migrated SSG core accidentally imports Vite or adapter context | Breaks package boundary and publishability  | Keep `SsgRenderEvidence` plain and run graph/type/publish gates             |
| ISR manifest shape diverges between adapter and SSG package    | Runtime cache lookup ambiguity              | Generate manifest entries in `@openelement/ssg` using `createIsrCacheKey()` |
| Compatibility re-exports mask stale imports forever            | v0.37 migration gets unclear                | Document re-exports as bridge-only and defer complete ownership cleanup     |
| `@openelement/ssg` publish metadata is incomplete              | `publish:dry-run` fails late                | Add README, LICENSE, package-local imports                                  |
| Full build output changes unexpectedly                         | Static site regression                      | Require root build, DSD report, and e2e before release                      |
| Firefox/WebKit failures are behavioral rather than setup-only  | Scope creep into browser compatibility work | Record as v0.37 blocker unless simple setup fix                             |

## Non-Goals

- No Vite SSR bundle build migration.
- No route scanner or entry generator migration.
- No Server/Data/UI/starter/Hub work.
- No automated tag, publish, or main merge by AutoFlow.
