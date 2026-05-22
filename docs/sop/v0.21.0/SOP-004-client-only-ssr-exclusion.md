# SOP-004: Client-Only SSR Exclusion

> Version: v0.21.0\
> Phase: Build Pipeline\
> Priority: P0\
> Status: IMPLEMENTED

## Objective

Make `client:only` a hard SSR boundary. Browser-only components must not be
imported, evaluated, or registered in the SSR bundle.

## Required Behavior

For `client:only` components:

- exclude source module from SSR import graph
- emit client island metadata
- emit deterministic placeholder HTML
- record exclusion in `dsd-report.json`
- keep build output successful unless the component is also required by SSR

## Placeholder Rules

Default:

```html
<my-widget data-less-client-only="true"></my-widget>
```

With fallback:

```html
<my-widget data-less-client-only="true">
  <p>Loading...</p>
</my-widget>
```

Do not create fake DSD templates for client-only components.

## Diagnostics

Report:

- tag name
- module path
- strategy: `only`
- reason: `client:only directive`
- SSR action: `excluded`
- client entry chunk

## Failure Modes

Fail build when:

- the same tag is both SSR-required and `client:only` on the same page
- a `client:only` directive references an unknown island module
- generated client entry cannot resolve the module

Warn when:

- fallback content is empty
- component is known SSR-capable but forced client-only

## Verification

- SSR bundle test proves the client-only module text is absent.
- Build report includes the exclusion.
- E2E verifies the component upgrades on the client.
- DSD report contains zero unknown errors for client-only exclusions.
