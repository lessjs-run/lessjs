# SOP-002: Safe Templates — Automatic Escaping

> Version: v0.21.0 (Reactive DSD)
> Priority: P0
> Depends on: SOP-001 (DsdElement + Signals)

## Objective

The `html` tagged template literal must escape interpolated values by default.
This is v0.21's primary security boundary — prevents XSS in DSD-rendered
content without requiring developer awareness.

## Rules

| Context           | Behavior                            | Escape               |
| ----------------- | ----------------------------------- | -------------------- |
| Text content      | `html\`<p>${value}</p>\``           | `&` `"` `'` `<` `>`  |
| Attribute value   | `html\`<a href="${url}">\``         | `&` `"` `<` `>` `'`  |
| Boolean attribute | `html\`<input ?disabled=${flag}>\`` | No escape (boolean)  |
| Property binding  | `html\`<input .value=${val}>\``     | No escape (property) |
| Event handler     | `html\`<button @click=${fn}>\``     | No escape (function) |

## Implementation

### Default: Escape Everything

```ts
html`Hello ${userInput}` → Hello &lt;script&gt;alert(1)&lt;/script&gt;
```

Every `${}` insertion passes through `escapeHtml()` unless explicitly marked safe.

### Escape Hatch: `unsafeHTML()`

```ts
import { unsafeHTML } from '@lessjs/core';
html`
  <div>${unsafeHTML(trustedMarkdown)}</div>
`;
```

`unsafeHTML()` wraps a `TrustedHTML`-like object that the template processor
recognizes and passes through without escaping.

### Attribute Context Awareness

```ts
// Safe: auto-escaped
html`<img src="${userProvidedUrl}" alt="${userProvidedAlt}">`

// Dangerous: needs developer awareness
html`<a href="javascript:${malicious}">`  // href context ≠ attr context
```

## Edge Cases

- Nested templates: `html\`<div>${html\`<span>${val}</span>\`}</div>\``— inner`html` result is pre-escaped, outer passes through
- Style context: `html\`<div style="color: ${color}">\`` — CSS escaping (different from HTML)
- URL context: `html\`<a href="${url}">\`` — URL-encode, not HTML-escape
- Rich text: `html\`<div>${unsafeHTML(markdown)}</div>\`` — developer explicitly opts out

## Verification

- `<script>alert(1)</script>` injected → escaped in output
- `unsafeHTML(trusted)` → passed through unescaped
- Attribute context: `href="javascript:..."` escaped
- Nested templates: no double-escaping
- No XSS in any DSD-rendered page (verified by DSD report gate)

## Related

- ADR-0039: DsdElement + Signals
- SOP-001: DsdElement + Signals Integration
- `escapeHtml()` in `@lessjs/core`
