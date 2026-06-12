# v0.39.0 Acceptance

v0.39.0 is acceptable when the documented framework RC surface and ADR-0099
four-product matrix are proven by public docs, a generated app, local gates,
CI, and release evidence.

## Product Surface

- [x] Generated app code uses the v0.38 product map as the first-run public
      surface.
- [x] Archived/internal packages are not introduced as first-run dependencies.
- [x] Any new package, removed surface, or public contract reset has ADR
      coverage.
- [x] ADR-0099 covers the four-product matrix and Elements reset.
- [x] Public docs state `openElement = Elements + UI + Framework + Protocols`.
- [x] README.md and README.zh.md show package line `0.39.0` and active line
      `v0.39.0`.
- [x] README.zh.md contains no mojibake/replacement text.
- [x] Web Awesome is not presented as a current target.
- [x] Vue is the only documented heavy-framework island adapter proof for this
      line.

## Runtime Surface

- [x] Pages, layouts, islands, API routes, assets, static output, SSR intent,
      and ISR/cache intent are proven in a repeatable smoke.
- [x] Vite and Nitro remain the documented build/runtime base engine.
- [x] Provider-specific deployment behavior is documented as recipes or adapter
      boundaries.

## Release Surface

- [x] Local implementation gates pass before package bump.
- [x] Post-bump local release gates pass after package version `0.39.0`.
- [x] `deno task docs:check-public` passes.
- [ ] Package versions are bumped only after implementation gates pass.
- [ ] `dev` and `main` non-JSR CI pass before tag/release.
- [ ] JSR publish is attempted as best-effort telemetry only.
