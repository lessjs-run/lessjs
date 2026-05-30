# Bilingual Sync Audit — LessJS Docs (v0.26.1)

Audit scope: All `.tsx` route pages in `www/app/routes/`.\
Patterns identified: **dual-method** (`_renderEn`/`_renderZh`) and **inline isZh** ternary.

---

## Summary Table

| File                                   | Type        | ZH Lines            | EN Lines | Ratio | Gaps                                                                         | Priority     |
| -------------------------------------- | ----------- | ------------------- | -------- | ----- | ---------------------------------------------------------------------------- | ------------ |
| guide/testing.tsx                      | Dual-method | ~36                 | ~50      | 0.72  | EN has code example + Browser Testing section missing in ZH                  | **HIGH**     |
| guide/api.tsx                          | Dual-method | ~50                 | ~82      | 0.61  | EN has 2 code examples + Request Validation section missing in ZH            | **HIGH**     |
| guide/getting-started.tsx              | Dual-method | ~126                | ~111     | 1.14  | EN missing JSX counter code example in "Adding Interactivity"                | **HIGH**     |
| guide/configuration.tsx                | Dual-method | ~117                | ~133     | 0.88  | Divergent content: ZH has extra JSX explanation; EN has `less add` paragraph | **MEDIUM**   |
| guide/deployment.tsx                   | Dual-method | ~116                | ~96      | 1.21  | Well synced; minor text verbosity differences                                | LOW          |
| guide/error-handling.tsx               | Dual-method | ~39                 | ~46      | 0.85  | EN logging section more detailed                                             | LOW          |
| guide/core-concepts.tsx                | Dual-method | ~217                | ~221     | 0.98  | Excellent sync                                                               | **PASS**     |
| guide/routing-and-data.tsx             | Dual-method | ~134                | ~135     | 0.99  | Excellent sync                                                               | **PASS**     |
| guide/islands-and-ssr.tsx              | Dual-method | ~138                | ~143     | 0.97  | Excellent sync                                                               | **PASS**     |
| architecture/design-system.tsx         | Dual-method | ~128                | ~128     | 1.00  | Perfect parity                                                               | **PASS**     |
| architecture/dsd.tsx                   | Dual-method | ✓                   | ✓        | —     | Both present, visually checked                                               | **PASS**     |
| architecture/islands.tsx               | Dual-method | ✓                   | ✓        | —     | Both present, visually checked                                               | **PASS**     |
| architecture/islands-deep.tsx          | Dual-method | ✓                   | ✓        | —     | Both present, visually checked                                               | **PASS**     |
| architecture/package-compatibility.tsx | Dual-method | ✓                   | ✓        | —     | Both present, visually checked                                               | **PASS**     |
| architecture/standards-registry.tsx    | Dual-method | ✓                   | ✓        | —     | Both present, visually checked                                               | **PASS**     |
| architecture/benchmark.tsx             | Dual-method | ✓                   | ✓        | —     | Both present (recently fixed)                                                | **PASS**     |
| contributing.tsx                       | Dual-method | ✓                   | ✓        | —     | Both present, visually checked                                               | **PASS**     |
| blog/[slug].tsx                        | Dual-method | ✓                   | ✓        | —     | Both present, visually checked                                               | **PASS**     |
| blog/index.tsx                         | Dual-method | ✓                   | ✓        | —     | Both present, visually checked                                               | **PASS**     |
| architecture/comparison.tsx            | Inline isZh | 1 isZh              | —        | —     | **Only heading is bilingual; entire body ZH-only**                           | **CRITICAL** |
| architecture/architecture.tsx          | Inline isZh | 7 isZh              | —        | —     | All 7 patterns have both branches; well-synced                               | **PASS**     |
| index/index.tsx                        | Inline isZh | 10 isZh             | —        | —     | All 10 patterns have both branches; well-synced                              | **PASS**     |
| guide/architecture.tsx                 | Inline isZh | 6 isZh              | —        | —     | Redirect page; both languages present                                        | **PASS**     |
| changelog.tsx                          | **No i18n** | **ZH-only wrapper** | —        | —     | Page chrome ("更新日志", subtitle) is ZH-only; CHANGELOG.md is English       | **MEDIUM**   |
| roadmap.tsx                            | **No i18n** | **EN-only**         | —        | —     | All content English-only; no ZH translation                                  | **MEDIUM**   |

---

## Critical Findings

### 1. `architecture/comparison.tsx` — Comparison table ZH-only (CRITICAL)

**Only the `<h1>` heading is bilingual.** Everything else — subtitle, 12-row comparison table (all cell values), "三支柱差异化" section, and "不优化的方向" section — is **Chinese-only**. There is no English version of the comparison content.

```tsx
// Line 142 — ONLY bilingual content in the file
<h1>${isZh ? 'LessJS 与竞品对比' : 'LessJS vs Alternatives'}</h1>

// Line 143-146 — ZH-only subtitle
<p class="subtitle">
  LessJS 当前是 DSD-first Web Components 应用框架。与同级框架的对比基于...
</p>

// Lines 149-246 — ZH-only table
// Lines 248-260 — ZH-only sections
```

**Impact**: English users see a comparison table and analysis entirely in Chinese. This is the most significant i18n gap in the docs.

### 2. `guide/api.tsx` — Missing EN content in ZH (HIGH)

The EN `_renderEn()` has significantly more content than the ZH `_renderZh()`:

**ZH missing** (present in EN only):

- Detailed "Create API Routes" paragraph with code examples (2 examples)
- "Request Validation" section (Zod + `@hono/zod-validator`)

```tsx
// EN has (lines 115-138):
<p>Place API routes in <span class='inline-code'>app/routes/api</span>.
  Default-export a Hono app for complex APIs, or a plain function...</p>
<less-code-block> {/* Hono app example */}
<less-code-block> {/* health endpoint example */}

<h2>Request Validation</h2>
<p>LessJS does not mandate a validation library. Zod with
  <span class='inline-code'>@hono/zod-validator</span> is a practical default.</p>

// ZH only has (lines 60-65):
<p>API routes 放在 app/routes/api。模块默认导出一个 Hono app。</p>
```

### 3. `guide/getting-started.tsx` — Missing EN content (HIGH)

ZH `_renderZh()` has a full JSX counter island example that **EN `_renderEn()` does not have**:

```tsx
// ZH has (lines 140-166) — JSX counter component with signal()
import { DsdElement } from '@lessjs/runtime';
import { signal } from '@lessjs/runtime';
// ... full CounterIsland example with onClick handlers

// EN has NO code example in the "Adding Interactivity" section at all
```

EN's "Adding Interactivity" section only has the usage line `<counter-island count="1">` — no component code.

### 4. `guide/testing.tsx` — Missing ZH content (HIGH)

EN `_renderEn()` has significantly more content:

**ZH missing** (present in EN only):

- "Build Smoke Tests" — `deno test` code example (line 82)
- "Browser Testing" section (lines 84-88)
- More detailed descriptions in "Project Testing" and "Playwright E2E"

---

## Medium Findings

### 5. `changelog.tsx` — Page chrome ZH-only

The page wrapper is hardcoded Chinese. Since `CHANGELOG.md` is English, the page is a **mixed-language** experience:

- Page title: "更新日志" (ZH only)
- Page subtitle: "LessJS 的所有重要变更都记录在这里。" (ZH only)
- Reference links: Chinese Keep a Changelog + Chinese SemVer links
- Content: English (from `CHANGELOG.md`)
- Error message: "无法加载更新日志。请查看 GitHub。" (ZH only)

No EN version of the page chrome exists.

### 6. `roadmap.tsx` — EN-only, no ZH

All content is English with no Chinese translation. Uses `locale="en"` hardcoded.

### 7. `guide/configuration.tsx` — Divergent content

Content is structurally different between EN and ZH (not just translated):

- ZH uses `h2>Main Options` header vs EN's `h2>Options Reference`
- ZH has extra JSX configuration context paragraph (line 80-83) before "JSX 配置"
- EN has extra paragraph about `less add` future support (lines 202-207) after options table
- EN has extra closing paragraph with links (lines 256-261)

---

## Passed (well-synced)

| File                                     | Notes                                       |
| ---------------------------------------- | ------------------------------------------- |
| `guide/core-concepts.tsx`                | 0.98 ratio, near-perfect mirror translation |
| `guide/routing-and-data.tsx`             | 0.99 ratio, identical structure             |
| `guide/islands-and-ssr.tsx`              | 0.97 ratio, well-maintained                 |
| `guide/deployment.tsx`                   | Good parity, minor verbosity differences    |
| `guide/error-handling.tsx`               | Good parity, EN slightly more detailed      |
| `architecture/design-system.tsx`         | 1.00 ratio, perfect parity                  |
| `architecture/benchmark.tsx`             | Both EN/ZH present (recently fixed)         |
| `architecture/architecture.tsx`          | 7 isZh patterns, all bilingual              |
| `architecture/dsd.tsx`                   | Both methods present                        |
| `architecture/islands.tsx`               | Both methods present                        |
| `architecture/islands-deep.tsx`          | Both methods present                        |
| `architecture/package-compatibility.tsx` | Both methods present                        |
| `architecture/standards-registry.tsx`    | Both methods present                        |
| `contributing.tsx`                       | Both methods present                        |
| `blog/[slug].tsx`                        | Both methods present                        |
| `blog/index.tsx`                         | Both methods present                        |
| `guide/architecture.tsx`                 | Redirect page, both languages in isZh       |
| `index/index.tsx`                        | 10 isZh patterns, all bilingual             |

---

## Statistics

| Metric                                                  | Count                                             |
| ------------------------------------------------------- | ------------------------------------------------- |
| Files audited                                           | 25                                                |
| Dual-method files (`_renderEn`/`_renderZh`)             | 19                                                |
| Inline isZh files                                       | 4                                                 |
| No i18n files (single-language)                         | 2                                                 |
| Dead aliases (`return this._renderEn()` in `_renderZh`) | 0                                                 |
| Files with ratio < 0.8                                  | 2 (testing: 0.72, api: 0.61)                      |
| CRITICAL gaps                                           | 1 (comparison.tsx)                                |
| HIGH gaps                                               | 3 (api.tsx, getting-started.tsx, testing.tsx)     |
| MEDIUM gaps                                             | 3 (configuration.tsx, changelog.tsx, roadmap.tsx) |
| PASS                                                    | 18                                                |

---

## Recommendations

1. **`comparison.tsx`** (CRITICAL): Add English translation for the entire comparison table body, "三支柱差异化" section, "不优化的方向" section, and the subtitle. Currently only the heading uses isZh.

2. **`guide/api.tsx`** (HIGH): Add Chinese translation for the "Create API Routes" code examples and "Request Validation" section, or remove the EN-only content.

3. **`guide/getting-started.tsx`** (HIGH): Add English translation for the JSX counter island example in "Adding Interactivity" section.

4. **`guide/testing.tsx`** (HIGH): Add Chinese translation for "Browser Testing" section and the `deno test` command code block in "Build Smoke Tests".

5. **`changelog.tsx`** (MEDIUM): Either add isZh pattern for page chrome, or accept mixed-language experience.

6. **`roadmap.tsx`** (MEDIUM): Add Chinese translation for roadmap content.

7. **`guide/configuration.tsx`** (MEDIUM): Harmonize the structural differences — either backfill missing content in both languages or decide on canonical version.
