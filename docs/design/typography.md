# Typography Design Decision — v0.27.0

## Principles

1. **One font, one scale.** System-ui sans for UI/nav/body. Monospace for code/metrics. No third font.
2. **Open Props first.** Every value maps to a `--font-size-N` and `--font-lineheight-N` token.
3. **Semantic, not visual.** H1-H6 are role-driven — visual size is a consequence of role, not decoration.
4. **8px grid.** Vertical rhythm aligns to `--size-N` multiples.

## Font Stack

| Role                       | Font                                                       | Token              |
| -------------------------- | ---------------------------------------------------------- | ------------------ |
| Body / UI / Nav / Headings | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | `var(--font-sans)` |
| Code / Terminal / Metrics  | `'SF Mono', 'Fira Code', 'Fira Mono', monospace`           | `var(--font-mono)` |

## Type Scale (Open Props Tokens)

| Token            | Size            | Usage                                            |
| ---------------- | --------------- | ------------------------------------------------ |
| `--font-size-8`  | 4rem (64px)     | Hero headline only (home page `.giant-headline`) |
| `--font-size-7`  | 3.5rem (56px)   | Page H1 (guide-title, architecture-title)        |
| `--font-size-6`  | 3rem (48px)     | Section H1 on narrow layouts                     |
| `--font-size-5`  | 2.5rem (40px)   | Counter value, metric display                    |
| `--font-size-4`  | 2rem (32px)     | H3, card titles                                  |
| `--font-size-3`  | 1.5rem (24px)   | H4, sidebar section headers                      |
| `--font-size-2`  | 1.25rem (20px)  | H5, code block lang badge                        |
| `--font-size-1`  | 1rem (16px)     | Body text, nav links, H6                         |
| `--font-size-0`  | 0.875rem (14px) | Secondary body, callout body                     |
| `--font-size-00` | 0.75rem (12px)  | Captions, meta, badges, footer                   |

## Heading Hierarchy (Full)

```
h1 (page title):     var(--font-size-7)  var(--font-weight-9)  var(--font-lineheight-1)
h2 (section head):   var(--font-size-5)  var(--font-weight-8)  var(--font-lineheight-1)
h3 (subsection):     var(--font-size-4)  var(--font-weight-7)  var(--font-lineheight-3)
h4 (topic):          var(--font-size-3)  var(--font-weight-6)  var(--font-lineheight-3)
h5 (detail):         var(--font-size-2)  var(--font-weight-6)  var(--font-lineheight-4)
h6 (minor):          var(--font-size-1)  var(--font-weight-6)  var(--font-lineheight-4)
```

## Content Typography

```
body text:           var(--font-size-1)  var(--font-lineheight-4)
lead paragraph:      var(--font-size-2)  var(--font-lineheight-3)
callout body:        var(--font-size-0)  var(--font-lineheight-4)
code inline:         var(--font-size-0)  var(--font-family-mono)  var(--bg-code)
code block:          var(--font-size-0)  var(--font-lineheight-4)  var(--font-family-mono)
caption / meta:      var(--font-size-00)  var(--font-lineheight-3)
nav item:            var(--font-size-00)  var(--font-weight-6)
sidebar link:        var(--font-size-0)  var(--font-lineheight-3)
```

## Color — Semantic Only

| Purpose               | Token                                             |
| --------------------- | ------------------------------------------------- |
| Headings              | `var(--text-primary)`                             |
| Body text             | `var(--text-primary)`                             |
| Secondary text        | `var(--text-secondary)`                           |
| Muted / labels / meta | `var(--text-muted)`                               |
| Code text             | `var(--text-secondary)`                           |
| Links (content)       | `var(--brand)`                                    |
| Links (nav)           | `var(--text-muted)` → hover `var(--text-primary)` |

## Spacing Grid

| Context               | Token                              | Notes                        |
| --------------------- | ---------------------------------- | ---------------------------- |
| Section gap           | `var(--size-8)` ~ `var(--size-12)` | Between major content blocks |
| Paragraph gap         | `var(--size-4)`                    | After p tags                 |
| Heading margin-top    | `var(--size-8)`                    | Before H2/H3                 |
| Heading margin-bottom | `var(--size-3)`                    | After H1/H2/H3               |
| List item gap         | `var(--size-1)`                    | Between li                   |
| Code block margin     | `var(--size-5)`                    | Around pre/code              |

## Layout Constraints

```
max-width: 720px (content column — prose)
max-width: 1120px (wide layout — hero, cards, comparisons)
max-width: 1400px (full page — less-layout header)
```

## Specimen — How It Should Look

```
┌─────────────────────────────────────────────────┐
│  H1 PAGE TITLE                                  │  font-size-7, weight-9
│                                                 │
│  H2 Section Heading                             │  font-size-5, weight-8
│  Body text flows naturally. Lorem ipsum dolor    │  font-size-1, lineheight-4
│  sit amet, consectetur adipiscing elit. Nulla    │
│  facilisi. Sed do eiusmod tempor incididunt.     │
│                                                 │
│  H3 Subsection Topic                            │  font-size-4, weight-7
│  Secondary detail with slightly smaller text     │  font-size-0, lineheight-4
│  for supporting information and callouts.        │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │ const code = "in a block";               │   │  font-size-0, mono
│  └──────────────────────────────────────────┘   │
│                                                 │
│  Footnote / meta text — smallest readable.       │  font-size-00, muted
└─────────────────────────────────────────────────┘
```

## Migration Checklist

For every route/component file, ensure:

- [ ] H1-H6 use `var(--font-size-N)` not raw px/rem
- [ ] Body text uses `var(--font-size-1)` (or `var(--font-size-0)` for dense content)
- [ ] Line-height uses `var(--font-lineheight-N)` not raw decimals
- [ ] Font-weight uses `var(--font-weight-N)` not `bold`/`bolder`
- [ ] All color uses `var(--text-*)` not `#XXX` or `var(--gray-N)` direct
- [ ] Font-family uses `var(--font-sans)` / `var(--font-mono)` not hard-coded
- [ ] Letter-spacing uses `--font-letterspacing-N` when non-default
- [ ] Vertical rhythm uses `--size-N` not raw px/rem
