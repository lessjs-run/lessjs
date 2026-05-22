# SOP-003: Client Runtime Strategies

> Version: v0.21.0\
> Phase: Runtime\
> Priority: P0\
> Status: IMPLEMENTED

## Objective

Implement a small browser runtime that loads island modules according to their
declared strategy without changing the DSD-first server output model.

## Runtime Rules

### `client:load`

- Import module immediately after the client entry executes.
- Define the custom element idempotently.
- Hydrate all matching elements on the page.

### `client:idle`

- Use `requestIdleCallback` when available.
- Fallback order:
  1. `requestAnimationFrame`
  2. `setTimeout(..., 50)`
- Avoid starving hydration on browsers without idle callback.

### `client:visible`

- Use one shared `IntersectionObserver`.
- Default root margin: `200px 0px`.
- Disconnect observed element after successful import/upgrade.
- Fallback to `client:load` when `IntersectionObserver` is unavailable.

### `client:only`

- Do not expect SSR shadow DOM.
- Import module immediately.
- Let the custom element render its client DOM after definition.
- Emit a placeholder only when the author provides fallback content.

## Runtime State

The runtime should track:

- imported modules
- defined tag names
- pending elements by strategy
- failed module imports

It must not keep references to hydrated DOM nodes after completion.

## Error Handling

- Failed dynamic import logs one concise warning per module.
- Missing custom element definition after import is reported.
- Runtime must not throw globally for one failed island.

## Verification

- Unit tests for scheduler fallback selection.
- Browser/e2e test for each directive.
- E2E assertion that `client:visible` does not import before viewport entry.
- E2E assertion that repeated tag instances share one module import.
- Console-error test excludes expected third-party warnings only.
