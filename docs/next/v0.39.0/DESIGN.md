# v0.39.0 Design Notes

## Intent

v0.39.0 turns the v0.38 product map into a release-candidate framework
experience. The implementation should prioritize a generated app proof over
new abstractions.

## Constraints

- Product package names and first-run imports follow the v0.38 product map.
- Vite + Nitro stay the default base engine for build, runtime, and deploy
  proof.
- Archived/internal packages stay available only where they are already part of
  tooling or advanced documentation.
- Breaking changes are allowed in 0.x only when recorded in migration notes and
  backed by tests.

## Evidence To Record

- Generated app fixture or smoke command.
- Runtime/deploy command output.
- Docs and website alignment.
- Package graph and release-gate output.
