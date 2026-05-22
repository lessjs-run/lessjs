# SOP-002: Safe Templates

> Version: v0.21.0
> Priority: P0
> Status: PLANNED
> Depends on: SOP-001

## Objective

Make `html` templates safe by default. Every dynamic interpolation must be
escaped or handled by a typed binding rule unless the developer explicitly uses
`unsafeHTML()`.

This SOP is a security boundary, not a formatting helper.

## Security Rules

| Template position | Example                             | Behavior                            |
| ----------------- | ----------------------------------- | ----------------------------------- |
| Text content      | `html\`<p>${value}</p>\``           | HTML-escape dynamic value           |
| Quoted attribute  | `html\`<a title="${value}">\``      | Attribute-escape dynamic value      |
| URL attribute     | `html\`<a href=${url}>\``           | Validate safe URL, then attr-escape |
| Boolean attribute | `html\`<input ?disabled=${flag}>\`` | Add/remove attribute                |
| Property binding  | `html\`<input .value=${value}>\``   | Runtime property assignment         |
| Event binding     | `html\`<button @click=${fn}>\``     | Runtime listener only               |
| Raw HTML          | `html\`${unsafeHTML(value)}\``      | Pass through trusted wrapper        |

## Non-Goals

- Do not sanitize arbitrary HTML automatically.
- Do not allow `javascript:` URLs through escaping alone.
- Do not support style-object or class-map directives in v0.21.
- Do not make `unsafeHTML()` available without tests that prove the trust
  boundary.

## Target Files

- `packages/core/src/template.ts`
- `packages/core/src/html-escape.ts`
- `packages/core/src/url-safety.ts` if URL validation needs a separate module
- `packages/core/src/index.ts`
- `packages/core/__tests__/safe-template.test.ts`
- `packages/core/__tests__/template-url.test.ts`

## Step-by-Step Execution

### Step 0: Reuse Existing Escape Primitives

- [ ] Inspect `escapeHtml`, `escapeAttr`, and `UnsafeHtml` in core.
- [ ] Decide whether `unsafeHTML()` is a new helper or a wrapper around the
      existing `UnsafeHtml` brand.
- [ ] Ensure the implementation is runtime-visible, not only TypeScript-branded.

Acceptance:

- [ ] `unsafeHTML('<b>x</b>')` can be recognized at runtime.
- [ ] Plain strings cannot masquerade as trusted raw HTML.

### Step 1: Implement Text Escaping

- [ ] Dynamic values in text position escape `&`, `<`, `>`, `"`, and `'`.
- [ ] `null`, `undefined`, and `false` render as empty text.
- [ ] Numbers render as decimal strings.
- [ ] Objects without binding semantics throw or warn clearly.

Acceptance:

- [ ] `<script>alert(1)</script>` renders as text.
- [ ] Nested templates do not double-escape inner safe output.

### Step 2: Implement Attribute Escaping

- [ ] Detect whether an interpolation is inside an attribute.
- [ ] Quoted attributes escape the full attribute value.
- [ ] Unquoted dynamic attributes are either normalized to quoted output or
      rejected with a clear error.
- [ ] Remove attributes for `null`, `undefined`, and `false` unless the binding
      is an explicit text attribute.

Acceptance:

- [ ] Quotes cannot break out of attributes.
- [ ] `aria-*` and `data-*` bindings behave predictably.

### Step 3: Implement URL Safety

- [ ] Identify URL-sensitive attributes: `href`, `src`, `action`, `formaction`,
      `poster`, and similar HTML URL attributes.
- [ ] Reject or neutralize `javascript:`, `vbscript:`, malformed percent
      encoding, and control-character-prefixed URLs.
- [ ] Allow relative URLs, absolute `http`/`https`, `mailto`, and documented safe
      schemes only.

Acceptance:

- [ ] `href="javascript:alert(1)"` does not reach output as an executable URL.
- [ ] Relative paths and hash links still work.

### Step 4: Implement Boolean, Property, and Event Binding Parsing

- [ ] Parse `?disabled=${flag}` as boolean attribute.
- [ ] Parse `.value=${value}` as property binding.
- [ ] Parse `@click=${handler}` as event binding.
- [ ] These bindings must not stringify functions or objects into HTML.

Acceptance:

- [ ] SSR output for event/property bindings contains no function source.
- [ ] CSR/DSD hydration attaches runtime behavior after upgrade.

### Step 5: Implement `unsafeHTML()`

- [ ] Add `unsafeHTML(value: string): UnsafeHtmlValue`.
- [ ] Require the wrapper for raw trusted markup.
- [ ] Make nested `unsafeHTML()` pass through exactly once.
- [ ] Document that user-provided markdown must be sanitized before it reaches
      `unsafeHTML()`.

Acceptance:

- [ ] `unsafeHTML('<em>ok</em>')` renders raw.
- [ ] Plain `'<em>escaped</em>'` renders escaped.

### Step 6: Error Reporting

- [ ] In development/test, throw clear errors for unsupported binding contexts.
- [ ] In build output, classify template security failures in render errors.
- [ ] Add DSD report entries for unsafe template errors.

Acceptance:

- [ ] Failures identify tag name and binding context.
- [ ] DSD report does not classify these as unknown errors.

## Verification

```sh
deno test packages/core/__tests__/safe-template.test.ts
deno test packages/core/__tests__/template-url.test.ts
deno test packages/core/__tests__/reactive-dsd.test.ts
deno task dsd:check-report
```

Required test cases:

- [ ] Text XSS vector escaped.
- [ ] Attribute breakout escaped.
- [ ] URL protocol attack rejected.
- [ ] Boolean binding does not emit `false`.
- [ ] Property binding does not serialize objects.
- [ ] Event binding does not serialize function source.
- [ ] `unsafeHTML()` passes through raw trusted HTML.
- [ ] Nested templates do not double-escape.

## Exit Criteria

- `html` can be exported without creating a new XSS footgun.
- Every dynamic interpolation has a documented context rule.
- Security failures are test-covered and reportable.

## Related

- SOP-001: DsdElement + Signals Integration
- ADR-0039: DsdElement + Signals Reactive Architecture
