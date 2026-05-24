# SOP-003: Windows + Linux CI for JSR Consumer Build

Status: implemented\
Target version: v0.21.6\
Owner: CI config

## Objective

Add a CI job that simulates the end-to-end JSR consumer journey on both Windows
and Linux: `less create → deno task build`. Currently the `create` integration
test patches imports from JSR to local source — this gap allowed SOP-001 to go
undetected in CI.

## Problem Statement

The existing `create` integration test (`cli.test.ts:161`) works by:

1. Generating a project via `less create`
2. Patching `deno.json` to replace all `jsr:@lessjs/*` with local `file://` paths
3. Patching `vite.config.ts` to replace all JSR URL aliases with local aliases
4. Running `deno task build`

This means CI has NEVER tested what actual users do. The patching hides real
issues like the Windows JSR URL mangling and the missing alias generation.

## Scope

1. Add a `test-create-jsr` job to `sop-gate.yml` (or `test.yml`) that:
   - Runs `less create test-blog` using the JSR-published CLI
   - Does NOT patch deno.json or vite.config.ts
   - Runs `deno task build` on the unmodified generated project
   - Verifies `dist/index.html` exists and contains content

2. Run this job on both `ubuntu-latest` and `windows-latest`

3. If `deno task build` fails on Windows, the job should fail (it's a real bug)

## CI Job Design

```yaml
test-create-jsr:
  strategy:
    matrix:
      os: [ubuntu-latest, windows-latest]
  runs-on: ${{ matrix.os }}
  steps:
    - uses: actions/checkout@v4
    - uses: denoland/setup-deno@v2
      with: { deno-version: '2' }
    - run: deno run -A jsr:@lessjs/create@0.21.6 test-blog
    - run: cd test-blog && deno task build
    - run: test -f test-blog/dist/index.html
```

## Depends On

- SOP-001 (build must work on both platforms first)

## Acceptance Criteria

- [ ] CI job `test-create-jsr` passes on ubuntu-latest
- [ ] CI job `test-create-jsr` passes on windows-latest
- [ ] Job fails (correctly) if build fails on either platform
- [ ] Existing create integration test (patched) still passes

## Non-Goals

- Not replacing the existing create integration test (it's still valuable for
  local development speed)
- Not running this on every PR (can be push-only or workflow_dispatch)
