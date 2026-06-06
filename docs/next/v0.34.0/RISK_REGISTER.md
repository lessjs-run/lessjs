# v0.34.0 Risk Register

## Risks

| Risk                                                                   | Severity | Mitigation                                                                                                     |
| ---------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| Reader parsing is fragile against Markdown format drift                | Medium   | Readers target structured sections with known headers; snapshot tests catch regressions; fixtures are explicit |
| State machine is too simplistic for real workflow edge cases           | Low      | 6 states + `drifted` catch-all covers current 0.x workflow; v0.35 can refine                                   |
| Fixture maintenance burden as docs evolve                              | Low      | Fixtures are minimal; each contains only what readers need; snapshot tests auto-update                         |
| `tools/autoflow/` imports from `packages/` creating dependency cycle   | Low      | Architecture gate verifies no package imports; readers are pure Deno stdlib                                    |
| Over-engineering — sidecar becomes a product before it's proven useful | Medium   | Strict scope: advisory only, no gate, no CI, no edits; v0.35 review decides if it's worth gating               |

## Mitigations Already in Place

- `workflow:check` continues to enforce NextVersion package structure.
- `graph:check` verifies zero cycles across all packages.
- `arch:check` verifies renderer contract stays frozen.
- `docs:check-current` verifies no legacy references leak.

## Non-Goals (Anti-Risks)

- **No CI gate.** The sidecar fails silently outside its own test suite.
- **No git operations.** No risk of corrupting repository state.
- **No network.** No risk of external dependency failures.
- **No edits.** Pure observer pattern, zero side effects.
- **No subjective scoring.** "Blocked" means hard contradiction, not opinion.
