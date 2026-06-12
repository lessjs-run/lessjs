# v0.39.0 Docs Plan

## Required Updates

- [x] Root README and README.zh describe the RC first-run framework surface.
- [x] Root README and README.zh state package line `0.39.0` and active
      execution `v0.39.0`.
- [x] README.zh is valid UTF-8 Chinese with no mojibake.
- [x] Public docs describe `openElement = Elements + UI + Framework +
      Protocols`.
- [x] Public docs describe Elements as the future `@openelement/elements` /
      `OpenElement` product direction.
- [x] Website getting-started, guide, API, and deployment pages use product
      surfaces by default.
- [x] Package READMEs identify product, advanced, internal, and archived
      status consistently.
- [x] Generated templates and docs agree on imports, tasks, deploy commands,
      and runtime expectations.
- [x] Migration notes record any intentional 0.x behavior changes.

## Guardrails

- Do not present Hub, RPC, direct SSG, CEM, or compat-check as first-run product
  APIs unless an ADR changes their status.
- Do not present Web Awesome as a current target.
- Do not expand React as part of v0.39 docs.
- Keep Vue as the only current heavy-framework island adapter proof.
- Keep JSR publish state documented as telemetry, not a release blocker.
