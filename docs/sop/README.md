# SOP Index

This directory is the execution map for LessJS releases. Each version should
have one SOP with:

- entry criteria: what must be true before work starts
- step-by-step execution: exact implementation order
- verification: commands, fixtures, and report checks
- exit criteria: what must be true before the version can be called complete
- non-goals: what must not be expanded into the release

## Current Execution Ladder

| Version | SOP                                                                                          | Status   | Purpose                            |
| ------- | -------------------------------------------------------------------------------------------- | -------- | ---------------------------------- |
| v0.15.1 | [v0.15.1-audit-gates.md](./v0.15.1-audit-gates.md)                                           | Done     | Release gates                      |
| v0.15.2 | [v0.15.2-render-output-hooks.md](./v0.15.2-render-output-hooks.md)                           | Done     | Structured output hooks            |
| v0.15.3 | [v0.15.3-dsd-report-and-release-gate.md](./v0.15.3-dsd-report-and-release-gate.md)           | Done     | DSD build report                   |
| v0.16.0 | [v0.16.0-package-protocol.md](./v0.16.0-package-protocol.md)                                 | Done     | Package manifest protocol          |
| v0.17.0 | [v0.17.0-manifest-native-pipeline.md](./v0.17.0-manifest-native-pipeline.md)                 | Done     | Manifest-native pipeline           |
| v0.17.1 | [v0.17.1-cross-runtime.md](./v0.17.1-cross-runtime.md)                                       | Done     | Cross-runtime adapter-vite         |
| v0.17.2 | [v0.17.2-ssr-filtering-dsd-report.md](./v0.17.2-ssr-filtering-dsd-report.md)                 | Done     | SSR filtering report               |
| v0.17.3 | [v0.17.3-multi-framework-adapters.md](./v0.17.3-multi-framework-adapters.md)                 | Done     | Multi-adapter support and boundary |
| v0.17.4 | [v0.17.4-compatibility-boundary-hardening.md](./v0.17.4-compatibility-boundary-hardening.md) | Done     | SSR admission planner              |
| v0.18.0 | [v0.18.0-universal-wc-engine.md](./v0.18.0-universal-wc-engine.md)                           | Done     | CEM parser and tiers               |
| v0.18.1 | [v0.18.1-validate-manifest-cli.md](./v0.18.1-validate-manifest-cli.md)                       | Done     | Validation CLI                     |
| v0.18.2 | [v0.18.2-less-add-install-flow.md](./v0.18.2-less-add-install-flow.md)                       | Done     | Safe add/install flow              |
| v0.18.3 | [v0.18.3-dom-simulation-experiment.md](./v0.18.3-dom-simulation-experiment.md)               | Done     | Opt-in DOM simulation              |
| v0.19.0 | [v0.19.0-platform-hub.md](./v0.19.0-platform-hub.md)                                         | Done     | Hub ingestion MVP                  |
| v0.19.1 | [v0.19.1-hub-previews-quality-gates.md](./v0.19.1-hub-previews-quality-gates.md)             | Deferred | Hub previews and scores            |
| v0.20.0 | [v0.20.0/](./v0.20.0/)                                                                       | Current  | Ocean-Island + docs alignment      |
| v1.0.0  | [v1.0.0-general-purpose-engine.md](./v1.0.0-general-purpose-engine.md)                       | Vision   | API freeze                         |

## Operator Rules

1. Read `docs/status/STATUS.md` first.
2. Read the current version SOP.
3. Do not start a later version until the current SOP exit criteria are met.
4. Do not broaden scope beyond the SOP non-goals.
5. If a command fails, update the SOP or changelog with the exact blocker
   before moving on.
6. For third-party packages, default to client-only unless validation proves
   SSR capability.
