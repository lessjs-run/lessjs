# v0.36.4 Design

v0.36.4 validates cross-browser behavior for the docs-site E2E surface. The
design is to treat browser-specific behavior as release evidence: fix differences
where they are framework defects, and document limitations where browser engine
behavior is externally constrained.

## Browser Scope

- Chromium remains the default docs-site E2E target.
- Firefox and WebKit are added as release proof for search, theme, navigation,
  i18n, and DSD-sensitive flows.
- Known browser limitations are documented in
  `docs/next/v0.36.4/BROWSER_LIMITATIONS.md`.

## Release Contract

- `test:e2e:browsers` proves Chromium, Firefox, and WebKit execution.
- CI includes browser proof as a release gate.
- v0.36.4 does not change SSG ownership or product scope.

## Compatibility

No public package API changes are introduced by this proof line.
