# LessJS v0.31.0 SOP: UI Shell and Ocean-Island Expansion

> Version: v0.31.0
> Date: 2026-06-04
> Status: Deferred
> ADRs: ADR-0074, ADR-0075, ADR-0076

## Summary

v0.31.0 is reserved for the UI Shell work that was previously planned for
v0.30.0:

- `@openelement/ui/css`
- Ocean/Island UI split
- daisyUI compiled CSS fork
- Open Props token merge
- DSD shell component styling

This work must not start until v0.30.0 finishes the architecture contract freeze.
UI expansion depends on a clean core renderer, a single public contract, and
gate-proved metadata/release boundaries.

## Entry Criteria

- v0.30.0 is complete.
- `deno task arch:check` exists and passes.
- current docs no longer teach removed APIs.
- package graph and release metadata gates pass.

## Non-Goals Before v0.30.0

- no daisyUI fork
- no new CSS subpath exports
- no new UI Shell public API
- no create-template UI rewrite
- no Ocean/Island visual migration

## Carry-Forward ADRs

- ADR-0074: @openelement/ui Dual-Track Ocean and Island Architecture
- ADR-0075: Fork daisyUI 5 Compiled CSS for DSD Shell Components
- ADR-0076: Open Props and daisyUI Token Merge
