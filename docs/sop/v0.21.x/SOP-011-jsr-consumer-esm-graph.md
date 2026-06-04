# SOP-011: JSR Consumer ESM Graph Hardening

Status: planned\
Target version: v0.21.9\
Owner: adapter-vite and release owner\
Architecture decision: `docs/adr/0041-esm-module-graph-first-jsr-consumer-build.md`

## Objective

Make the JSR consumer path boring and deterministic.

The core principle for v0.21.9 is:

> LessJS owns the ESM module graph and package entrypoint contract. Vite/Rolldown
> only performs the final bundle, tree-shaking, and code splitting.

This SOP exists because local workspace gates were not enough. A generated app
using `jsr:@openelement/create` exposed package graph leaks only after packages were
published and consumed outside the monorepo.

## Scope

v0.21.9 focuses on the consumer build path:

- generated starter project
- JSR package versions
- package `exports` and `imports`
- adapter-vite SSG module graph resolution
- Vite/Rolldown unresolved import behavior
- consumer smoke validation in CI

This is not an Edge Full-Stack milestone. It is the release-contract cleanup
needed before Edge Full-Stack can be trusted.

## Problem Statement

The intended application graph is clean ESM:

```ts
import { DsdElement, html, signal } from '@openelement/core';
import '@openelement/ui/less-card';
```

The failing published-consumer path showed that LessJS can accidentally hand
Vite a graph containing Deno/JSR-specific resolution details:

```text
Rolldown failed to resolve import "jsr:@openelement/signals@^0.21/framework"
from "lessjs:ssg-pkg/core/index.ts"
```

This is a boundary error. `jsr:` belongs to Deno/JSR resolution metadata, not to
the final Vite/Rolldown module graph.

## Required Work

### 1. Package Graph Audit

Audit every `packages/*/deno.json` file.

Record:

- package name and version;
- all `exports`;
- all `imports` using `jsr:@openelement/*`;
- any LessJS dependency still using a broad range such as `^0.21`;
- whether a subpath import has a matching exported subpath.

Acceptance:

- all publishable LessJS packages use the same target version for v0.21.9;
- no package depends on an older LessJS release train;
- every package-to-package import has a matching public export;
- the audit result is documented in the v0.21.9 release note.

### 2. Centralize adapter-vite Package Graph Resolution

Move SSG package resolution out of ad hoc code paths in `build-ssg.ts`.

Create or extract a focused resolver module that owns:

- parsing LessJS package specifiers;
- parsing `jsr:@openelement/*` specifiers;
- resolving package subpaths through known exports;
- mapping virtual package ids back to source modules;
- keeping package version choice explicit;
- producing clear errors for unknown package, subpath, or version mismatch.

Acceptance:

- `build-ssg.ts` delegates package graph normalization to the resolver;
- resolver tests cover `@openelement/core`, `@openelement/core/navigation`,
  `@openelement/ui/less-card`, `@openelement/signals/framework`, `@openelement/content`,
  and `@openelement/i18n`;
- unresolved LessJS package imports fail with a LessJS error message before
  Vite emits a generic unresolved import error.

### 3. Keep Vite's Responsibility Narrow

The module graph handed to Vite must contain only:

- normal relative imports;
- normal package imports Vite can resolve from the consumer project;
- adapter-vite virtual ids;
- LessJS virtual package ids fully owned by the SSG resolver.

Vite must not be asked to understand:

- `jsr:@openelement/*`;
- Deno workspace-only aliases;
- package metadata imports after manual source fetch;
- missing LessJS package subpaths.

Acceptance:

- consumer SSG logs contain no unresolved `jsr:@openelement/*`;
- generated virtual entry code contains no direct `jsr:@openelement/*`;
- Vite is used for bundle optimization, not for Deno/JSR package semantics.

### 4. Generated Consumer Smoke Test

Add a CI smoke that runs outside the monorepo workspace.

The smoke must prove:

```powershell
deno run -A jsr:@openelement/create test-blog
cd test-blog
deno task build
```

The test must avoid putting the generated project under the LessJS workspace,
because Deno should not treat it as a workspace member.

Acceptance:

- generated project directory is under a temp directory outside the repository;
- build uses the JSR-published package path;
- failure logs preserve the root unresolved import line;
- smoke is documented as a release gate.

### 5. Release Documentation

Add a v0.21.9 changelog or release note after implementation.

It must include:

- what package graph issue was fixed;
- which packages were version-aligned;
- the consumer smoke command;
- whether the smoke was run against local workspace, dry-run package output, or
  published JSR packages;
- any remaining caveats.

## Non-Goals

- no new public Core API;
- no hydration strategy rename;
- no Edge runtime handler;
- no ISR adapter expansion;
- no auth, ORM, session, or RPC framework;
- no npm publication strategy change.

## Validation Gate

Run from the repo root:

```powershell
git status --short --branch
deno task fmt:check
deno task lint
deno task typecheck
deno audit
deno task test
deno task build
deno task dsd:check-report
deno task hub:validate --strict --json
deno task hub:check-index
deno task docs:check-strategy
deno task test:e2e
git status --short --branch
```

Run the consumer smoke outside the repo:

```powershell
$tmp = Join-Path $env:TEMP "lessjs-v0219-consumer-smoke"
Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $tmp | Out-Null
Set-Location $tmp
deno run -A jsr:@openelement/create test-blog
Set-Location test-blog
deno task build
```

## Pass Criteria

v0.21.9 passes when:

- every LessJS package version is unified;
- generated consumer SSG builds successfully outside the monorepo;
- Vite/Rolldown reports no unresolved LessJS import;
- no `jsr:@openelement/*` specifier leaks into the Vite module graph;
- package graph resolver tests pass;
- global gate passes or any failure has a documented owner and command.

## Fail Criteria

Do not call v0.21.9 complete if any of these remain true:

- consumer smoke only passes inside the monorepo;
- adapter-vite needs another one-off resolver patch for each package;
- generated app build fails after JSR publication;
- package versions drift across the release train;
- `^0.21` ranges remain where the release requires exact v0.21.9 alignment;
- docs claim the starter is stable without an external consumer proof.

## Exit Output

Completion must leave:

- centralized package graph resolver code;
- resolver unit tests;
- generated consumer smoke gate;
- v0.21.9 changelog or release note;
- updated status docs if the gate changes release readiness;
- final command log for both repo gate and consumer smoke.
