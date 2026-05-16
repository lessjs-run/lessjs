# Version Ladder: v0.15.1 → v0.16.1

> The full v0.16 target is too large to treat as one release.
> Execute it as a small version ladder — each rung can ship independently.

## Ladder Overview

| Version | SOP | Main outcome | Can ship alone |
| ------- | --- | ------------ | -------------- |
| v0.15.1 | [v0.15.1-audit-gates.md](./v0.15.1-audit-gates.md) | Security and test gates before protocol work | Yes ✅ Done |
| v0.15.2 | [v0.15.2-render-output-hooks.md](./v0.15.2-render-output-hooks.md) | `RenderOutput` return type + `RenderHooks` | Yes |
| v0.15.3 | [v0.15.3-dsd-report-and-release-gate.md](./v0.15.3-dsd-report-and-release-gate.md) | `dsd-report.json` + repeatable release gate | Yes |
| v0.16.0 | [v0.16.0-package-protocol.md](./v0.16.0-package-protocol.md) | CEM-compatible manifest + local registry | Yes |
| v0.16.1 | [v0.16.1-build-time-package-integration.md](./v0.16.1-build-time-package-integration.md) | Manifest-driven build-time package rendering | Conditional |

## Dependency Chain

```
v0.15.1 ✅ (done)
  ↓
v0.15.2  (RenderOutput + RenderHooks)
  ↓
v0.15.3  (DSD Report + Release Gate)
  ↓
v0.16.0  (WC Package Protocol — manifest + registry)
  ↓
v0.16.1  (Build-Time Package Integration — conditional)
```

## Key Rule

v0.16.0 should ship the protocol even if v0.16.1 integration is not ready.
Do not let build-time SSR-aware package integration block the manifest and
registry foundation.

## Historical Reference

The original combined SOP for the entire v0.16 pipeline is archived at
[archive/v0.16-structured-render-pipeline.md](./archive/v0.16-structured-render-pipeline.md).
It has been superseded by the per-version SOPs above.
