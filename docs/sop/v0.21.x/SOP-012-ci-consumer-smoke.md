# SOP-012: CI Pre-Publish Consumer Smoke Test

Status: active\
Target version: v0.21.10+\
Owner: CI + release owner\
Related: SOP-011, ADR-0041

## Objective

Prevent ESM module graph boundary leaks before they reach JSR consumers.

SOP-011 item 4 requires a "generated consumer smoke test" that runs outside the
monorepo. This SOP defines the CI implementation of that requirement.

## Problem

The v0.21.9 consumer 404 bug (adapter-vanilla, adapter-react intercepted by
`ssg-package-resolver` instead of `optionalPackageStubsPlugin`) was caught by
manual testing, not CI. The existing `ssg-smoke.test.ts` runs inside the
workspace and cannot detect JSR-specific resolution failures.

## Implementation

Add a `consumer-smoke` job to `.github/workflows/test.yml` that:

1. Creates a temp directory outside the repository checkout
2. Runs `deno run -A jsr:@lessjs/create test-blog`
3. Enters the generated project and runs `deno task build`
4. Fails the CI if any step errors

### Job Definition

```yaml
consumer-smoke:
  runs-on: ubuntu-latest
  needs: [test-core, test-adapter-vite]
  steps:
    - uses: actions/checkout@v4
    - uses: denoland/setup-deno@v2
      with:
        deno-version: '2'
    - name: Generate consumer project from JSR
      env:
        TEMP_DIR: ${{ runner.temp }}/lessjs-consumer-smoke
      run: |
        rm -rf "$TEMP_DIR"
        mkdir -p "$TEMP_DIR"
        cd "$TEMP_DIR"
        deno run -A jsr:@lessjs/create test-blog
    - name: Build consumer project
      env:
        TEMP_DIR: ${{ runner.temp }}/lessjs-consumer-smoke
      run: |
        cd "$TEMP_DIR/test-blog"
        deno task build
```

### Key Constraints

- The generated project **must** be outside the repository checkout to avoid
  Deno workspace member detection.
- The job should depend on `test-core` and `test-adapter-vite` (not gate on the
  full matrix) to keep feedback fast.
- No special permissions needed — `deno run` and `deno task` are standard.

## Acceptance Criteria

- [ ] `consumer-smoke` job exists in `test.yml`
- [ ] Job creates project outside the checkout directory
- [ ] Job runs `deno task build` on the generated project
- [ ] CI green on a version that is already published to JSR
- [ ] Job fails if a required package is missing from JSR or has a resolution bug

## Known Limitation

This test only validates against **already-published** JSR versions. It cannot
detect issues in a version that has not yet been published. For that, see
SOP-013 (Post-Publish Consumer Smoke).

## Validation

```powershell
# Local validation (requires published version on JSR)
$tmp = Join-Path $env:TEMP "lessjs-consumer-smoke"
Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $tmp | Out-Null
Set-Location $tmp
deno run -A jsr:@lessjs/create test-blog
Set-Location test-blog
deno task build
```
