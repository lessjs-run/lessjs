# v0.34.0 Test Matrix

## Unit Tests

| Module               | File                                                     | Coverage                                  |
| -------------------- | -------------------------------------------------------- | ----------------------------------------- |
| state-machine        | `tools/autoflow/__tests__/state-machine.test.ts`         | All transitions, illegal rejection, drift |
| cells                | `tools/autoflow/__tests__/cells.test.ts`                 | Cell creation, status strings             |
| status reader        | `tools/autoflow/__tests__/readers/status.test.ts`        | Version extraction, gate parsing          |
| sop reader           | `tools/autoflow/__tests__/readers/sop.test.ts`           | Status parsing, task counting             |
| nextversion reader   | `tools/autoflow/__tests__/readers/nextversion.test.ts`   | File presence, emptiness check            |
| roadmap reader       | `tools/autoflow/__tests__/readers/roadmap.test.ts`       | Version sequence parsing                  |
| package-graph reader | `tools/autoflow/__tests__/readers/package-graph.test.ts` | Version alignment, workspace parsing      |
| adr reader           | `tools/autoflow/__tests__/readers/adr.test.ts`           | ADR count, status extraction              |
| reporter             | `tools/autoflow/__tests__/reporter.test.ts`              | JSON schema, summary format               |

## Integration Tests

| Test          | Fixture     | Expected State |
| ------------- | ----------- | -------------- |
| released repo | `released/` | `released`     |
| active repo   | `active/`   | `active`       |
| planned repo  | `planned/`  | `planned`      |
| drifted repo  | `drifted/`  | `drifted`      |
| invalid repo  | `invalid/`  | `invalid`      |

## Fixture Structure

Each fixture under `tools/autoflow/fixtures/<name>/` contains:

```
<name>/
├── docs/
│   ├── governance/PROJECT_WORKFLOW.md
│   ├── status/STATUS.md
│   ├── roadmap/ROADMAP.md
│   ├── sop/<version>/README.md
│   ├── next/<version>/  (or absent, depending on fixture)
│   └── adr/ADR-0001.md
├── deno.json
└── packages/
    └── <pkg>/deno.json
```

## Gate Order (must all pass)

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno test tools/autoflow/        # autoflow tests only
deno task test                    # all 1314+ tests
deno task workflow:check
deno task graph:check
deno task arch:check
deno task docs:check-current
deno task docs:check-strategy
```
