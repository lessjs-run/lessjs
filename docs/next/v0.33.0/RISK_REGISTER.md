# v0.33.0 Risk Register

| Risk                                                     | Mitigation                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| AI-readable API becomes noisy boilerplate                | Keep object fields optional, but do not restore function-form pages  |
| New metadata creates a second descriptor path            | Normalize old and new forms into one internal descriptor model       |
| Head API hides a trust boundary                          | Use explicit trusted/dangerous names for raw head fragments          |
| Island SSR flag conflicts with hydration strategies      | Define `ssr?: boolean` as render admission, not hydration timing     |
| v0.33 accidentally starts AutoFlow2 implementation scope | Keep AutoFlow2 runtime work in v0.34 and v0.35                       |
| Docs show APIs before code exists                        | Update API examples only after implementation and tests are complete |

## Non-Goals

- No AutoFlow2 sidecar implementation.
- No AutoFlow2 CI blocker.
- No ISR/cache/deploy expansion.
- No server mutation API.
- No data library recipes.
- No UI Shell redesign.
- No package surface reset.
