# v0.37.4 Test Matrix

| Test Area                  | Scope                                                                                                                                | Expected                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| authoring.ts interpolation | Verify ERROR_PREFIX renders in error messages                                                                                        | 4 assertions               |
| Core logger unification    | Verify scoped logger calls in 4 files; no bare console.*                                                                             | 4 type-level checks + grep |
| Adapter-vite shell removal | graph:check, arch:check, existing adapter-vite tests                                                                                 | all pass                   |
| dsd-hydration dedup        | adapter-lit, adapter-react, adapter-vanilla hydration tests                                                                          | all pass                   |
| UI/router decoupling       | open-layout locale/path, SPA nav, e2e nav smoke                                                                                      | all pass                   |
| CSS tokens                 | Token sheet exports ~40 tokens; plain HTML smoke; DsdElement light DOM smoke; DsdElement shadow DOM with DSD SSR output verification | 10 tests                   |
| ssg entry-descriptor       | buildEntryDescriptor options, SSG/SSR modes, island mapping, CSP                                                                     | ~20 tests                  |
| ssg entry-renderer         | renderEntry output, Hono entry, middleware, error paths                                                                              | ~15 tests                  |
| ssg ssg-render error paths | failing getStaticPaths, malformed modules, missing exports                                                                           | ~8 tests                   |
| router tests               | error routes, edge patterns, locale switching                                                                                        | ~20 tests                  |
| router client-router       | SPA lifecycle, popstate, click delegation, locale                                                                                    | ~15 tests                  |
| protocols validators       | null, undefined, malformed, empty arrays                                                                                             | ~15 tests                  |
| protocols type-level       | conformance type checks                                                                                                              | ~5 tests                   |
| Build + e2e                | deno task build, e2e regression suite                                                                                                | all pass                   |
