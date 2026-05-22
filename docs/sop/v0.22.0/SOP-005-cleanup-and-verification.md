# SOP-005: v0.21 Cleanup + Release Verification

> Version: v0.22.0
> Priority: P1

## v0.21 Cleanup

- [ ] Delete `LessApiHandler` type (already done in v0.21 — verify no remaining references)
- [ ] Delete `createLessApiContext` (already done — verify test coverage)
- [ ] Verify `LessApiContext` type-only usage in all route examples
- [ ] Remove any `RedisIsrCache` references from docs/tests/changelog

## Release Verification Gate

```sh
deno task fmt:check
deno task lint
deno task typecheck
deno task docs:check-strategy
deno task test
deno audit
deno task build
deno task dsd:check-report  # threshold ≤ 12 non-recoverable
deno task test:e2e
```

## Changelog v0.22.0

- [ ] Create `docs/changelog/v0.22.0.md`
- [ ] Document ISR production handler
- [ ] Document KV adapters
- [ ] Document showcase pages
- [ ] Document deployment guides

## SOP Status Update

- [ ] Mark v0.21 SOPs as COMPLETED
- [ ] Mark v0.22 SOPs as PLANNED → IN_PROGRESS → COMPLETED
- [ ] Update `docs/status/STATUS.md`
- [ ] Update `docs/roadmap/ROADMAP.md`

## Non-Goals

- Do not add new rendering features beyond ISR handler
- Do not expand API surface beyond Hono
- Do not change the DSD rendering engine
