# SOP-007: WWW Demo And Docs

> Version: v0.21.0\
> Phase: Public Surface\
> Priority: P1\
> Status: IMPLEMENTED

## Objective

Update the website and docs so users can verify v0.21 behavior without reading
source code.

## Required Public Pages

Update or add:

- `/guide/islands`
- `/engine/islands-deep`
- `/guide/ssg`
- `/guide/api`
- `/guide/deployment`
- `/roadmap`
- README and README.en when v0.21 is shipped

## Examples

Each directive needs one minimal example:

```html
<demo-counter client:load></demo-counter>
<demo-search client:idle></demo-search>
<demo-chart client:visible></demo-chart>
<demo-player client:only></demo-player>
```

ISR example:

```ts
export const revalidate = 60;
```

API context example:

```ts
export function GET(ctx: LessApiContext) {
  return Response.json({ id: ctx.params.id });
}
```

## Documentation Rules

- Do not describe v0.22 Signals as shipped.
- Do not imply request-time SSR parity unless ISR handler support is present.
- Every user-facing claim must point to a command, generated report, or e2e
  test.

## Verification

- `deno task docs:check-strategy`
- e2e checks for demo pages
- no stale "planned" wording for shipped v0.21 items after release closure
- no "mature marketplace" claims
