# ADR-0030: Registry Hub Architecture — Static Index + CLI Submission Pipeline

- Status: Proposed
- Date: 2026-05-17
- Target: v0.19.0

## Context

v0.19.0 introduces the LessJS Registry Hub — a public-facing, searchable
registry of validated Web Component packages. The Hub must solve two
fundamental problems that killed earlier WC registries (notably webcomponents.org):

### Problem 1: Trust without Code Execution

webcomponents.org tried to dynamically parse and execute submitted packages on
the server. This was expensive, insecure, and ultimately unsustainable.

**LessJS constraint**: The Hub MUST NOT execute arbitrary package code at
request time. All trust decisions must be based on pre-generated evidence
artifacts.

### Problem 2: Submission Friction

If submitting a package requires filling out a web form, uploading files, and
waiting for manual review, nobody will submit. The submission path must be
**developer-native** — a CLI command that feels like `npm publish` or `cargo
publish`.

### Options Considered

#### Option A: Full Dynamic Backend (API + Database + Web UI)

Like a traditional package registry (npm, PyPI).

- **Pros**: Rich features, real-time data, user accounts
- **Cons**: Server cost, security surface, requires arbitrary code execution
  for validation, maintenance burden, violates "no code execution" constraint

#### Option B: Static Hub with Manual PRs

Hub data is hand-edited JSON files committed to the repo.

- **Pros**: Zero server cost, fully auditable, no code execution risk
- **Cons**: High submission friction, no automation, prone to staleness

#### Option C: Static Hub + CLI Submissions + GitHub PR Pipeline (Chosen)

Hub is a static site powered by JSON data files. Submissions flow through a
CLI command that runs local validation, bundles artifacts, and opens a GitHub
Pull Request. CI validates and auto-merges.

- **Pros**: No server cost, fully auditable, no code execution in Hub, CLI
  feels native, PR workflow is familiar to OSS developers, auto-merge for
  validated packages
- **Cons**: GitHub API dependency, PR latency (minutes vs seconds), requires
  GitHub token setup, large data files could bloat repo

## Decision

**Build the Registry Hub as a static-site registry with a CLI-driven
submission pipeline over GitHub PRs.**

Three architectural pillars:

### Pillar 1: Static Data Layer

Hub data lives in `hub-index/` at the repository root as JSON files:

```
hub-index/
├── index.json                       ← Search index (lightweight, client-side)
└── packages/
    ├── @shoelace.json               ← Per-package HubPackageRecord
    ├── @media-chrome.json
    └── ...
```

The www site reads these JSON files at build time to render registry pages.
No database. No API server. No runtime code execution.

### Pillar 2: CLI Submission Pipeline

`less hub submit` is a first-class CLI command that:

1. Reads the local package (CEM manifest, package.json/deno.json)
2. Runs `less validate-manifest` — local validation, no server dependency
3. Runs build to produce dsd-report.json and SSR snapshots (if compatible)
4. Bundles everything into a `hub-submission.json` artifact
5. Opens a GitHub Pull Request via `gh` CLI (or outputs bundle for manual PR)

This means:

- **Validation happens on the submitter's machine** — not on Hub servers
- **Hub only stores and serves evidence** — never executes arbitrary code
- **Submission is a git-native workflow** — fork, branch, commit, PR

### Pillar 3: CI-Based Validation Gate

A GitHub Actions workflow (`hub-ci.yml`) runs on each submission PR:

1. Validates JSON schema of the submitted package record
2. Verifies artifact integrity (hash checks)
3. Checks for duplicate custom element tag names
4. Conditionally auto-merges:
   - ✅ **Auto-merge**: `ssr-capable` or `client-only` packages that pass all
     checks
   - 👁️ **Manual review**: `rejected` or `experimental-dom` packages, or
     packages with validation warnings

## Consequences

### Positive

- **Zero server infrastructure** — the Hub is a static site deployed to
  GitHub Pages / EdgeOne Pages
- **No arbitrary code execution in request path** — all validation is
  pre-submission and offline
- **Fully auditable** — every submission is a git commit with full history
- **OSS-native workflow** — GitHub PR review is familiar to every developer
- **Scalable** — adding a package is adding a JSON file, not provisioning
  database capacity
- **Aligns with LessJS principles** — deterministic outcomes from validated
  evidence, not magic

### Negative

- **PR latency** — submission takes ~30s-2min (CI run) instead of instant
  API response
- **GitHub dependency** — requires `gh` CLI and GitHub token; alternative
  output mode needed for non-GitHub users
- **Repo bloat risk** — snapshot artifacts could grow large; mitigated by
  keeping snapshots small (<5KB text/HTML) and adding CI size gates
- **No real-time updates** — hub data is as fresh as the last merged PR

### Neutral

- **GitHub token setup** is a one-time cost per developer (documented in
  README)
- **Manual PR review** for edge cases is intentional — it gates risky
  submissions behind human judgment

## Comparison to webcomponents.org

| Aspect                     | webcomponents.org    | LessJS Hub                    |
| -------------------------- | -------------------- | ----------------------------- |
| Server-side code execution | Yes (unsustainable)  | **Never**                     |
| Submission method          | Web form             | `less hub submit` CLI         |
| Data storage               | Database             | Git-tracked JSON files        |
| Validation                 | Server-side (opaque) | Local + CI (transparent)      |
| Trust model                | Trust the registry   | **Trust the evidence**        |
| Audit trail                | Database logs        | Full git history              |
| Server cost                | High                 | **Zero**                      |
| Offline usability          | No                   | Yes (--dry-run works offline) |

## Related Artifacts

- SOP: `docs/sop/v0.19.0-platform-hub.md`
- Hub data types: `packages/hub/src/schema.ts`
- Submission CLI: `packages/core/src/cli/hub-submit.ts`
- Hub CI: `.github/workflows/hub-ci.yml`
- Registry UI: `www/app/routes/registry/`
