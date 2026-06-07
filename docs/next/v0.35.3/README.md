# v0.35.3 NextVersion Package

> Version: v0.35.3\
> Theme: Issue #47 Final Closure (remaining 16 items)\
> Base: v0.35.2 (c7bd2db1)\
> Issue: [#47](https://github.com/open-element/openelement/issues/47)

## Purpose

v0.35.3 completes all remaining items from issue #47 that were falsely
claimed done in v0.35.2.

## Completed (14 of 16)

| #  | Item                                 | Status |
| -- | ------------------------------------ | ------ |
| A3 | Constructor type available from core | ✅     |
| D2 | Build task dedup documented          | ✅     |
| D3 | Publish config dedup documented      | ✅     |
| H3 | Publish tasks deprecated             | ✅     |
| G3 | PLAYWRIGHT_VERSION constant          | ✅     |
| P1 | Package list single source           | ✅     |
| P2 | Exclude consolidated                 | ✅     |
| P4 | DsdHydration interface in core       | ✅     |
| P5 | tools/lib/ with shared utils         | ✅     |
| P6 | Gate names from STATUS.md            | ✅     |
| P7 | sop-gate.yml dedup                   | ✅     |
| I1 | README template documented           | ✅     |
| H4 | Autoflow CLI documented              | ✅     |
| F3 | ERROR_PREFIX centralized             | ✅     |

## Deferred (2 of 16)

| #     | Reason                                                                           |
| ----- | -------------------------------------------------------------------------------- |
| P3    | CI workflow_call change — needs separate PR with CI testing, too risky for patch |
| C2/C3 | Test helper dedup — separate PR, no functional impact                            |

## Completion Rule

Issue #47 closed with 30/32 items completed. 2 items deferred to v0.36.
