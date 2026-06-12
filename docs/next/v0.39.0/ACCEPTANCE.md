# v0.39.0 Acceptance

v0.39.0 is acceptable when the documented framework RC surface is proven by a
generated app, local gates, CI, and release evidence.

## Product Surface

- [x] Generated app code uses the v0.38 product map as the first-run public
      surface.
- [x] Archived/internal packages are not introduced as first-run dependencies.
- [ ] Any new package, removed surface, or public contract reset has ADR
      coverage.

## Runtime Surface

- [ ] Pages, layouts, islands, API routes, assets, static output, SSR intent,
      and ISR/cache intent are proven in a repeatable smoke.
- [ ] Vite and Nitro remain the documented build/runtime base engine.
- [ ] Provider-specific deployment behavior is documented as recipes or adapter
      boundaries.

## Release Surface

- [ ] Local release gates pass before package bump.
- [ ] Package versions are bumped only after implementation gates pass.
- [ ] `dev` and `main` non-JSR CI pass before tag/release.
- [ ] JSR publish is attempted as best-effort telemetry only.
