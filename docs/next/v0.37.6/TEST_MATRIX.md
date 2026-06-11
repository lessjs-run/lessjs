# v0.37.6 Test Matrix

| Area                   | Scope                                         | Expected                                      |
| ---------------------- | --------------------------------------------- | --------------------------------------------- |
| Handler contract       | `@openelement/protocols/runtime`              | Web Request/Response boundary works           |
| Generated entry        | SSG/file-route output                         | exports openElement handler and runtime shape |
| Nitro mount boundary   | `@openelement/adapter-vite/nitro-mount`       | Nitro-like event maps to Web Request/Response |
| Proof tasks            | `nitro:proof:node`, `nitro:proof:workers`     | pass for current proof level                  |
| Real Node output       | generated Nitro Node bundle                   | build and runtime smoke pass                  |
| Real Workers output    | generated Nitro Cloudflare Workers bundle     | build and runtime smoke pass or blocker filed |
| Static assets          | Nitro output asset serving                    | expected files resolve                        |
| Islands                | explicit island route                         | expected chunk emitted and referenced         |
| Static zero-JS         | no-island static route                        | no framework JavaScript emitted               |
| Route lifecycle        | load, layout, redirect, not-found, error, API | behavior matches openElement contract         |
| ISR/cache              | cache intent to Nitro primitive mapping       | tests or documented blocker exist             |
| Graph                  | `deno task graph:check`                       | no cycles, versions aligned                   |
| Architecture           | `deno task arch:check`                        | passes                                        |
| Docs                   | docs current and strategy checks              | pass                                          |
| Full test              | `deno task test`                              | passes                                        |
| Build                  | `deno task build`                             | passes                                        |
| Publish dry run        | `deno task publish:dry-run`                   | passes before release closure                 |
| Distribution telemetry | JSR publish/visibility attempt                | recorded, not an exit gate                    |
