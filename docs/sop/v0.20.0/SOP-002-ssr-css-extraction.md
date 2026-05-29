# SOP-002: SSR CSSStyleSheet Extraction

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-001 (DsdElement base class)
> **Estimated time**: 0.3 day
> **Complexity**: 🟢 Low

---

## Objective

Add native CSSStyleSheet extraction to `renderDsd()` so that DsdElement components' `static styles` are automatically serialized into `<style>` tags within DSD output — without needing any adapter.

---

## Pre-requisites

- [ ] SOP-001 complete: `DsdElement` class exists with `static styles: CSSStyleSheet`

---

## Files

| File                              | Action   | Lines changed                                 |
| --------------------------------- | -------- | --------------------------------------------- |
| `packages/core/src/render-dsd.ts` | **EDIT** | +~15 lines (insert before adapter extraction) |

Only one file changed. No new files.

---

## Step-by-Step

### Step 1: Insert CSSStyleSheet extraction before adapter dispatch

In `render-dsd.ts`, find the style extraction block starting at **line 250**:

```typescript
// 5. Extract static styles from component class
let styleCss = '';
for (const adapter of getRegisteredAdapters()) {
```

**Insert BEFORE that loop**:

```typescript
// 5. Extract static styles from component class
let styleCss = '';

// 5a. Try native DsdElement styles (CSSStyleSheet) — no adapter needed
const ctor = componentClass as unknown as {
  styles?: CSSStyleSheet | CSSStyleSheet[];
};
if (ctor.styles) {
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  for (const sheet of sheets) {
    try {
      for (const rule of [...sheet.cssRules]) {
        styleCss += rule.cssText + '\n';
      }
    } catch {
      // Cross-origin stylesheet or empty sheet — skip silently
      log.debug(`Cannot read CSSStyleSheet rules for <${tagName}>`);
    }
  }
}

// 5b. Fallback: registered adapters (Lit, etc.)
if (!styleCss) {
  for (const adapter of getRegisteredAdapters()) {
```

### Step 2: Verify the change is minimal

Your diff should be exactly **one block insertion** between the `let styleCss = '';` declaration and the existing `for (const adapter of getRegisteredAdapters())` loop. No other lines changed.

### Step 3: Test the extraction

Create a minimal DsdElement component:

```typescript
// Test component
const sheet = new CSSStyleSheet();
sheet.replaceSync(`.foo { color: red; }`);

class TestEl extends DsdElement {
  static styles = sheet;
  render(): string {
    return `<div class="foo">test</div>`;
  }
}
customElements.define('test-el', TestEl);
```

Then verify:

```typescript
const output = await renderDsd('test-el', TestEl, {});
// output.html should contain:
// <style>.foo { color: red; }</style>
```

---

## Edge Cases

| Scenario                                                       | Expected behavior                                |
| -------------------------------------------------------------- | ------------------------------------------------ |
| `static styles` is `undefined`                                 | Skip native extraction, fall through to adapters |
| `static styles` is `CSSStyleSheet[]`                           | Iterate all sheets, concatenate rules            |
| `sheet.cssRules` throws (cross-origin)                         | Catch, log debug, skip — not an error            |
| Sheet is empty (0 rules)                                       | No `<style>` tag emitted (existing behavior)     |
| Both `static styles` (DsdElement) AND Lit adapter styles exist | Native takes priority (checked first)            |
| Lit component without `static styles` (Island)                 | Falls through to adapter extraction — unchanged  |

---

## Verification Checklist

- [ ] `renderDsd()` output for DsdElement component includes `<style>` tag
- [ ] `renderDsd()` output for existing Lit component unchanged (falls through to adapter)
- [ ] Multiple CSSStyleSheets merge correctly
- [ ] Empty sheet → no `<style>` tag
- [ ] No regression in existing SSG build output (compare before/after)

---

## Dependencies

```
SOP-002 blocks: SOP-004, SOP-005, SOP-006, SOP-007, SOP-008 (all component migrations need SSR to work)
SOP-002 blocked by: SOP-001
```
