# SOP-006: API Route Production Parity

> Version: v0.21.0\
> Phase: ISR + API Parity\
> Priority: P1\
> Status: IMPLEMENTED

## Objective

Make Hono API routes behave consistently in dev, build, and production handler
execution.

## Scope

- request context shape
- route params
- environment access
- response helpers
- error behavior
- deployment documentation

## Request Context

Expose a stable context object:

```ts
export interface LessApiContext {
  request: Request;
  params: Record<string, string>;
  env: Record<string, string | undefined>;
  platform?: unknown;
}
```

The public type must not expose Vite internals.

## Required Tests

- API route responds in dev server.
- API route is present in production build handler.
- Dynamic API route receives params.
- Environment values are read through the documented context.
- Thrown errors return deterministic status and body.

## Deployment Guide

Document:

- static-only deployment
- deployment with API handlers
- deployment with ISR route support
- unsupported hosting modes

## Non-Goals

- No auth/session framework.
- No database abstraction.
- No platform-specific SDK wrapper.
- No promise of all serverless providers in v0.21.
