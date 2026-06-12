# ADR-0104: Signal Engine Default Policy

- Status: Accepted
- Date: 2026-06-13
- Target: v0.40.x
- Depends on: ADR-0096, ADR-0101

## Context

v0.40 evaluates `@preact/signals-core` because Preact is the priority
heavy-framework island proof. However, a default signal-engine change affects
runtime behavior and is explicitly protected by ADR-0101.

The current signal package uses an existing default engine behind
`@openelement/signals`. Protocols already define `SignalEngine` and conformance
tests.

## Decision

Do not switch the default signal engine in the first v0.40 product-line reset.

Instead:

- keep the current default engine;
- add a candidate adapter for `@preact/signals-core` only if it remains behind
  the `SignalEngine` protocol boundary;
- require conformance, SSR/CSR, bundle, and consumer-smoke evidence before any
  default-engine proposal;
- require a later ADR to change the default.

## Non-Goals

- Do not make Preact the identity of openElement.
- Do not add Preact or `@preact/signals-core` as a required dependency of
  `@openelement/core` or `@openelement/elements`.
- Do not change signal scheduling or host update semantics without tests.

## Consequences

### Positive

- v0.40 can prove Preact islands without destabilizing Elements and core.
- Signal replacement remains protocol-driven instead of dependency-driven.
- Existing consumers keep current signal behavior.

### Negative

- The Preact signal candidate is additional work before any default switch.
- The project carries two signal-engine concepts during evaluation.

## Acceptance

- Existing default signal tests remain green.
- Candidate work must pass `runSignalEngineConformance`.
- `@openelement/core` and `@openelement/elements` do not require Preact signal
  packages.
- Any default switch requires a later ADR and updated release evidence.
