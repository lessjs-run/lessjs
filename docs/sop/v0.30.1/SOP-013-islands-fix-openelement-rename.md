# SOP-013: v0.30.1 Islands Fix + openelement Rename

> Version: v0.30.1
> Date: 2026-06-04
> Status: In Progress
> Output: Island interactivity restored, @openelement → @openelement complete rename, openelement.org domain activated

## Summary

Two-phase release:

1. **Islands fix**: Replace string-concatenation event binding with VNode `data-signal-render` path (ADR-0081)
2. **Full rename**: @openelement → @openelement across all 19 packages, CI/CD, website, and documentation

## Entry Criteria

- v0.30.0 is on `main` (1297 tests passing)
- Islands broken on production (search, counter, showcase, console)
- openelement.org domain purchased, GitHub org open-element created, JSR scope @openelement created

---

## Phase 1: Islands Architecture Fix (ADR-0081)

### Workstream 1.1: `data-signal-render` in DsdElement

**File**: `packages/core/src/dsd-element.ts` — `_hydrateSignals()`

Add new signal handling branch after `data-signal-attr` block:

```ts
// --- Signal → VNode rendering: data-signal-render="signalName" ---
const renderEls = this.shadowRoot.querySelectorAll('[data-signal-render]');
for (const el of renderEls) {
  const name = el.getAttribute('data-signal-render');
  if (!name) continue;
  const sig = this.signalRegistry.get(name);
  if (!sig) continue;

  const renderTarget = () => {
    while (el.firstChild) el.removeChild(el.firstChild);
    const v = sig.value;
    if (v != null) {
      const nodes = Array.isArray(v) ? v : [v];
      for (const node of nodes) {
        el.appendChild(renderToDom(node, undefined, this.#effectDisposers));
      }
    }
  };
  renderTarget();
  this.#effectDisposers.add(effect(() => renderTarget()));
}
```

### Workstream 1.2: Migrate less-search island

**File**: `www/app/islands/less-search.tsx`

| Current                                    | New                                           |
| ------------------------------------------ | --------------------------------------------- |
| `#resultsHtml: Signal<string>`             | `#resultsNodes: Signal<VNode[]>`              |
| Template: `data-signal-html="resultsHtml"` | Template: `data-signal-render="resultsNodes"` |
| `data-on-click="_open"`                    | `onClick={this._handleOpen.bind(this)}`       |
| `data-on-input="_onInput"`                 | `onInput={this._handleInput.bind(this)}`      |
| `data-on-click="_closeOnBackdrop"`         | `onClick={this._handleBackdrop.bind(this)}`   |
| `data-on-click="__stopPropagation"`        | `onClick={(e) => e.stopPropagation()}`        |
| `escapeHtml`, `escapeAttr` imports         | Removed (JSX auto-escapes)                    |
| String concatenation of search results     | VNode array via JSX                           |

### Workstream 1.3: Migrate remaining islands

**File**: `www/app/islands/reactive-showcase.tsx`

- Audit for `data-on-*` usage; migrate to `onClick`/`onInput` in JSX
- Replace `data-signal-html` with `data-signal-render` where applicable

**File**: `www/app/islands/home-console.tsx`

- `data-on-click="_increment"` → `onClick={this._increment.bind(this)}`
- `data-on-click="_decrement"` → `onClick={this._decrement.bind(this)}`

**File**: `www/app/islands/scroll-reveal.tsx`

- Audit: may not use `data-on-*` directly; check for `data-signal-html` patterns

### Workstream 1.4: Remove unused imports

Remove `escapeHtml`/`escapeAttr` imports from islands that no longer use them.

---

## Phase 2: Full Rename @openelement → @openelement

### Workstream 2.1: Mechanical string replacement

Execute across all files (`.ts`, `.tsx`, `.json`, `.yml`, `.md`):

```
@openelement → @openelement
```

**Files affected**: ~300 files, ~4500 occurrences

**Key config files**:

- Root `deno.json`: import map (53 entries), jsxImportSource, tasks
- `www/deno.json`: generated imports
- 19 package `deno.json`: `"name"` fields, internal JSR references

### Workstream 2.2: Internal identifiers (manual review)

| File                                          | Old                                           | New                                                    |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `core/src/jsx-runtime.ts`                     | `Symbol.for('lessjs.fragment/show/for')`      | `Symbol.for('openelement.fragment/show/for')`          |
| `core/src/render-ir.ts`                       | `Symbol(lessjs.fragment)`                     | `Symbol(openelement.fragment)`                         |
| `core/src/event-hydration.ts`                 | `Symbol(lessjs.fragment)`                     | `Symbol(openelement.fragment)`                         |
| `core/src/isr.ts`                             | `lessjs:isr:`                                 | `openelement:isr:`                                     |
| `adapter-vite/src/subpath-resolver.ts`        | `/@openelement/` regex, `VIRTUAL_CORE_PREFIX` | `/@openelement/`, `VIRTUAL_CORE_PREFIX`                |
| `adapter-vite/src/ssg-package-resolver.ts`    | `VIRTUAL_LESSJS_PACKAGE_PREFIX`, `\0lessjs:`  | `VIRTUAL_OPENELEMENT_PACKAGE_PREFIX`, `\0openelement:` |
| `adapter-vite/src/generated-data-resolver.ts` | `@openelement/generated/*`                    | `@openelement/generated/*`                             |
| `adapter-vite/src/entry-renderer.ts`          | ~15 generated import strings                  | Same with @openelement                                 |
| `adapter-vite/src/entry-descriptor.ts`        | `@openelement/ui\/open-layout`                | `@openelement/ui/open-layout`                          |
| `adapter-vite/src/optional-package-stubs.ts`  | 9 keys                                        | 9 keys renamed                                         |
| `router/src/client-router.ts`                 | `[lessjs/router]`                             | `[openelement/router]`                                 |
| `app/src/index.ts`                            | `JSR_SCOPE = '@openelement'`                  | `JSR_SCOPE = '@openelement'`                           |
| `content/src/manifest/writer.ts`              | `Auto-generated by @openelement/content`      | `@openelement/content`                                 |

### Workstream 2.3: Component rename less- → open-

| File                            | New Name                |
| ------------------------------- | ----------------------- |
| `ui/src\/open-button.tsx`       | `open-button.tsx`       |
| `ui/src\/open-card.tsx`         | `open-card.tsx`         |
| `ui/src\/open-dialog.tsx`       | `open-dialog.tsx`       |
| `ui/src\/open-input.tsx`        | `open-input.tsx`        |
| `ui/src\/open-layout.tsx`       | `open-layout.tsx`       |
| `ui/src\/open-code-block.tsx`   | `open-code-block.tsx`   |
| `ui/src\/open-hero-ping.tsx`    | `open-hero-ping.tsx`    |
| `ui/src\/open-theme-toggle.tsx` | `open-theme-toggle.tsx` |
| `ui/src\/open-callout.tsx`      | `open-callout.tsx`      |
| `ui/src\/open-step-card.tsx`    | `open-step-card.tsx`    |

Internal changes per file:

- Class name: `LessButton` → `OpenButton` (etc.)
- Tag name string: `'less-button'` → `'open-button'`
- All JSX: `<less-*>` → `<open-*>` across entire codebase
- `ui/deno.json` exports updated
- `ui/src/manifest.ts` references updated

### Workstream 2.4: CI/CD workflows

| Workflow                   | Changes                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| `publish-jsr.yml`          | 19 package names + consumer smoke directory                           |
| `publish-manual.yml`       | 10 package names                                                      |
| `jsr-consumer-monitor.yml` | `jsr:@openelement/create` → `jsr:@openelement/create`, directory name |
| `deploy-api.yml`           | `/tmp/less-api` → `/tmp/open-api`, `--app=less-demo-api`              |
| `codeql.yml`               | Comment: `LessJS` → `openElement`                                     |

---

## Phase 3: Domain Configuration

### Code changes

| File                       | Change                                                          |
| -------------------------- | --------------------------------------------------------------- |
| `www/public/CNAME`         | `lessjs.com` → `openelement.org`                                |
| `www/vite.config.ts`       | OG tags, sitemap, PWA name, GoatCounter, logo/footer, githubUrl |
| `ui/src/open-layout.tsx`   | Internal link origin URL                                        |
| `www/e2e/seo-meta.spec.ts` | Expected domain                                                 |

### Infrastructure (manual — user action)

1. Transfer domain from GoDaddy to Tencent Cloud DNSPod
2. Set CloudFlare nameservers in DNSPod
3. Add CNAME `openelement.org` → `lessjs.pages.dev` in CloudFlare DNS
4. Add `openelement.org` as Custom Domain in CloudFlare Pages

---

## Phase 4: Verification

### Build

```powershell
Remove-Item -Recurse -Force www/dist
deno task build
```

### Tests

```powershell
deno test
```

**Target**: 1297 tests passing (baseline unchanged).

### Push

```powershell
git push origin dev
```

### CI gates

- `typecheck`: passes
- `lint` + `fmt:check`: clean
- All 12 test jobs: green
- `build-www` + `test-e2e`: green

### Post-publish

- JSR auto-publish 19 packages to `@openelement` scope
- Consumer smoke test: `deno run -A jsr:@openelement/create test-blog` → build → verify
- `z-js.dev` → `openelement.org` 301 redirect

---

## Exit Criteria

- [ ] All 4 islands interactive on local build
- [ ] Search returns results with clickable links
- [ ] GoatCounter loads (SRI hash verified or removed)
- [ ] 1297 tests pass
- [ ] CI all green on dev branch
- [ ] Build produces valid dist with no stale `@openelement` references
- [ ] All `<less-*>` → `<open-*>` in production HTML
- [ ] `openelement.org` resolves and serves the site
