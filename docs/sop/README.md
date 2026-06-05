# SOP Index

This directory is the execution map for openElement releases. Each version should
have one SOP with:

- entry criteria: what must be true before work starts
- step-by-step execution: exact implementation order
- verification: commands, fixtures, and report checks
- exit criteria: what must be true before the version can be called complete
- non-goals: what must not be expanded into the release

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`. Every active minor
also has an execution package under `docs/next/<version>/`.

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
| v0.20.0 | [v0.20.0/](./v0.20.0/)                                                                       | Done     | Ocean-Island + docs alignment      |
| v0.21.0 | [v0.21.0/](./v0.21.0/)                                                                       | Done     | Reactive DSD + streaming           |
| v0.22.0 | [v0.22.0/](./v0.22.0/)                                                                       | Done     | Architecture Integrity             |
| v0.23.0 | [v0.23.0/](./v0.23.0/)                                                                       | Done     | Layered Package Architecture       |
| v0.24.3 | [v0.24.3/](./v0.24.3/)                                                                       | Done     | Consolidation + legacy removal     |
| v0.25.0 | [v0.25.0/](./v0.25.0/)                                                                       | Done     | Declarative DX                     |
| v0.26.0 | [v0.26.0/](./v0.26.0/)                                                                       | Done     | Hub CLI reorganization             |
| v0.26.1 | [v0.26.1/](./v0.26.1/)                                                                       | Done     | Signal-to-CSS visual binding       |
| v0.27.0 | [v0.27.0/](./v0.27.0/)                                                                       | Done     | Framework decoupling + reactive    |
| v0.28.0 | [v0.28.0/](./v0.28.0/)                                                                       | Done     | Contracts & Tokens + Open Props    |
| v0.28.1 | [v0.28.1/](./v0.28.1/)                                                                       | Done     | Hygiene convergence                |
| v0.28.2 | [v0.28.2/](./v0.28.2/)                                                                       | Done     | Deprecated purge + hardening       |
| v0.28.3 | [v0.28.3/](./v0.28.3/)                                                                       | Done     | Cleanup closure + MDX design       |
| v0.28.4 | [v0.28.4/](./v0.28.4/)                                                                       | Done     | AppShell protocol + cleanup        |
| v0.28.6 | [v0.28.6/](./v0.28.6/)                                                                       | Done     | Build pipeline cleanup             |
| v0.29.0 | [v0.29.0/](./v0.29.0/)                                                                       | Done     | Structured renderer IR             |
| v0.29.1 | [v0.29.1/](./v0.29.1/)                                                                       | Done     | Core simplification and merge      |
| v0.29.2 | [v0.29.2/](./v0.29.2/)                                                                       | Done     | Renderer and contract cleanup      |
| v0.29.3 | [v0.29.3/](./v0.29.3/)                                                                       | Done     | Cleanup hardening                  |
| v0.29.4 | [v0.29.4/](./v0.29.4/)                                                                       | Done     | Type and renderer hardening        |
| v0.29.5 | [v0.29.5/](./v0.29.5/)                                                                       | Done     | Type safety cleanup                |
| v0.29.6 | [v0.29.6/](./v0.29.6/)                                                                       | Done     | Architecture debt closure          |
| v0.30.0 | [v0.30.0/](./v0.30.0/)                                                                       | Done     | Architecture contract freeze       |
| v0.30.1 | [v0.30.1/](./v0.30.1/)                                                                       | Done     | Clean architecture sweep           |
| v0.31.0 | [v0.31.0/](./v0.31.0/)                                                                       | Done     | JSX-first Application API          |
| v0.32.0 | [v0.32.0/](./v0.32.0/)                                                                       | Current  | App lifecycle contract             |
| v0.33.0 | [v0.33.0/](./v0.33.0/)                                                                       | Next     | AI-readable API foundation         |
| v0.34.0 | [v0.34.0/](./v0.34.0/)                                                                       | Planned  | AutoFlow2 sidecar kernel           |
| v0.35.0 | [v0.35.0/](./v0.35.0/)                                                                       | Planned  | AutoFlow2 harness gate             |
| v0.36.0 | [v0.36.0/](./v0.36.0/)                                                                       | Planned  | Rendering runtime and deployment   |
| v0.37.0 | [v0.37.0/](./v0.37.0/)                                                                       | Planned  | Server/data/UI product closure     |
| v0.38.0 | [v0.38.0/](./v0.38.0/)                                                                       | Planned  | Public surface reset               |
| v0.39.0 | [v0.39.0/](./v0.39.0/)                                                                       | Planned  | v1 release candidate               |
| v1.0.0  | [v1.0.0/](./v1.0.0/)                                                                         | Vision   | Stable engine + AutoFlow default   |

## Operator Rules

1. Read `docs/status/STATUS.md` first.
2. Read `docs/governance/PROJECT_WORKFLOW.md`.
3. Read the current version SOP.
4. Read the active NextVersion package.
5. Do not start a later version until the current SOP exit criteria are met.
6. Do not broaden scope beyond the SOP non-goals.
7. If a command fails, update the SOP or changelog with the exact blocker
   before moving on.
8. For third-party packages, default to client-only unless validation proves
   SSR capability.
