# v0.32.0 Risk Register

| Risk                                                 | Mitigation                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| Lifecycle helpers become a second router API         | Keep helpers as control errors consumed by existing entry generation |
| SSG and request-time rendering diverge               | Update both generated Hono routes and SSG `renderRoute()`            |
| Error handling reintroduces string renderer behavior | Render page error fallback through the same VNode page class         |
| v0.33 cache/runtime semantics leak into v0.32        | Limit v0.32 to metadata and lifecycle control                        |
| AutoWorkflow becomes documentation-only              | Add `workflow:check` and run it in CI                                |

## Non-Goals

- No ISR implementation changes.
- No deployment host adapters.
- No database, ORM, auth, or mutation API.
- No package surface reset.
