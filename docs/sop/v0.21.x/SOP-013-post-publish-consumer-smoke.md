# SOP-013: Post-Publish Consumer Smoke Test

Status: active\
Target version: v0.21.10+\
Owner: CI + release owner\
Related: SOP-011, SOP-012, ADR-0041

## Objective

Verify that freshly published JSR packages form a complete, buildable consumer
project. This is the final release gate — it catches problems that pre-publish
testing cannot because the new version does not yet exist on JSR.

## Problem

SOP-012 tests against already-published JSR versions. It validates the last
release, not the current one. The publish workflow (`publish.yml`) currently
publishes all packages and then stops — there is no verification that the
published packages actually work together.

The v0.21.9 hotfix (removing optional packages from the resolver) would have
been caught immediately if a post-publish smoke had existed.

## Implementation

Add a `consumer-smoke` job to `.github/workflows/publish.yml` that runs after
all packages are published.

### Job Definition

```yaml
consumer-smoke:
  runs-on: ubuntu-latest
  needs: [publish]
  steps:
    - uses: denoland/setup-deno@v2
      with:
        deno-version: '2'
    - name: Wait for JSR propagation
      run: sleep 30
    - name: Generate consumer project from JSR
      env:
        TEMP_DIR: ${{ runner.temp }}/lessjs-post-publish-smoke
      run: |
        rm -rf "$TEMP_DIR"
        mkdir -p "$TEMP_DIR"
        cd "$TEMP_DIR"
        deno run -A jsr:@lessjs/create test-blog
    - name: Build consumer project
      env:
        TEMP_DIR: ${{ runner.temp }}/lessjs-post-publish-smoke
      run: |
        cd "$TEMP_DIR/test-blog"
        deno task build
    - name: Verify output
      env:
        TEMP_DIR: ${{ runner.temp }}/lessjs-post-publish-smoke
      run: |
        test -f "$TEMP_DIR/test-blog/dist/index.html" || {
          echo "::error::dist/index.html not found — build failed silently"
          exit 1
        }
```

### Key Constraints

- **No checkout needed** — this test runs against the JSR-published packages,
  not the local source. This is the whole point: it tests what the consumer
  actually receives.
- A 30-second wait allows JSR to propagate the newly published versions. This
  may need adjustment based on JSR's actual propagation delay.
- The job must depend on `publish` (all packages published first).
- If any package failed to publish, this job will naturally fail because
  `deno run -A jsr:@lessjs/create` will pull a version mismatch.

## Acceptance Criteria

- [ ] `consumer-smoke` job exists in `publish.yml` after the publish step
- [ ] Job does NOT checkout the repository (tests pure JSR consumption)
- [ ] Job verifies `dist/index.html` exists after build
- [ ] A broken publish (e.g., missing package) causes this job to fail

## Relationship to SOP-012

| | SOP-012 (CI Pre-Publish) | SOP-013 (Post-Publish) |
|---|---|---|
| **When** | Every push to dev/main | After publish completes |
| **Tests against** | Last published JSR version | Freshly published JSR version |
| **Catches** | Regressions in already-shipped code | New-version integration bugs |
| **Needs checkout** | Yes (for create scaffolding) | No (pure JSR consumption) |

Both are needed. SOP-012 catches regressions early in PR CI. SOP-013 is the
final gate that proves the release is actually shippable.

## Validation

This can only be validated during an actual publish cycle. Manual test:

```powershell
# After publishing a new version
Start-Sleep -Seconds 30
$tmp = Join-Path $env:TEMP "lessjs-post-publish-smoke"
Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $tmp | Out-Null
Set-Location $tmp
deno run -A jsr:@lessjs/create test-blog
Set-Location test-blog
deno task build
Test-Path dist/index.html
```
