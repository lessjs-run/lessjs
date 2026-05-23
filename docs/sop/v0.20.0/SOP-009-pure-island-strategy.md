# SOP-009: Pure Island Strategy — less-hero-ping

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-008 (all DSD components migrated)
> **Estimated time**: 0.3 day
> **Complexity**: 🟢 Low (keep Lit, just document the strategy)

---

## Objective

Define the Pure Island strategy: `less-hero-ping` stays on Lit. No migration needed. This SOP formalizes the boundary between Ocean (DSD) and Island (framework) components.

---

## Decision

**`less-hero-ping` retains Lit.** It is the only component in `@lessjs/ui` that genuinely needs framework reactivity:

| Why it needs Lit                                       | Why DSD doesn't help                         |
| ------------------------------------------------------ | -------------------------------------------- |
| Animated ping effect (CSS animation on loop via state) | SSR would render static, needs JS to animate |
| `requestUpdate()` triggers re-render on interval       | DOM never "settles" — always recomputing     |
| `performUpdate()` in animation frame                   | DSD is static by design                      |

---

## What changes (minimal)

### 1. Add CSS Parts

```typescript
// less-hero-ping.ts — add part attributes in render()
override render() {
  if (this._dsdHydrated) return nothing;
  return html`
    <span class="ping-wrapper" part="wrapper">
      <span class="ping-dot ping-dot--static" part="dot-static"></span>
      <span class="ping-dot ping-dot--animated" part="dot-animated"></span>
    </span>`;
}
```

### 2. Add CSS Parts documentation

```
CSS Parts:
  ::part(wrapper)     — the outer span
  ::part(dot-static)  — the static dot
  ::part(dot-animated)— the animated pulse dot
```

### 3. Island metadata

```typescript
// For future Island strategy (load/idle/visible/idle):
static override layer: ComponentLayer = 'dsd-interactive';
// or in v0.21: static island: IslandConfig = { strategy: 'visible' };
```

---

## Island Strategy Table

| Component            | Type        | Framework         | Island Strategy     |
| -------------------- | ----------- | ----------------- | ------------------- |
| `less-button`        | Ocean (DSD) | None (DsdElement) | —                   |
| `less-card`          | Ocean (DSD) | None (DsdElement) | —                   |
| `less-callout`       | Ocean (DSD) | None (DsdElement) | —                   |
| `less-step-card`     | Ocean (DSD) | None (DsdElement) | —                   |
| `less-input`         | Ocean (DSD) | None (DsdElement) | —                   |
| `less-code-block`    | Ocean (DSD) | None (DsdElement) | —                   |
| `less-theme-toggle`  | Ocean (DSD) | None (DsdElement) | —                   |
| `less-dialog`        | Ocean (DSD) | None (DsdElement) | —                   |
| `less-layout`        | Ocean (DSD) | None (DsdElement) | —                   |
| `less-search`        | Ocean (DSD) | None (DsdElement) | —                   |
| **`less-hero-ping`** | **Island**  | **Lit**           | **load (default)** |

---

## Future Islands (v0.21+)

When new Island components are added:

```typescript
// Example: a data-grid component with Preact
// packages/ui/src/islands/less-data-grid.tsx (or .ts)
import { Component, h, render } from 'preact';

// Island config
export const islandConfig = {
  strategy: 'visible' as const, // load when visible in viewport
  framework: 'preact',
};

// SSR: renderDSD() outputs empty <less-data-grid></less-data-grid>
// Client: Preact mounts when IntersectionObserver triggers
```

This is out of scope for v0.20 but the architecture supports it.

---

## SSR Pipeline (Island path — unchanged)

```
LitElement.render(): TemplateResult
  → @lessjs/adapter-lit claims it (adapter.isTemplate() = true)
  → adapter.render(TemplateResult) → HTML string
  → renderDSD() wraps in DSD template
  → Client: LitElement upgrade → render() → reactive cycle starts
```

---

## @lessjs/adapter-lit Status

| v0.19                 | v0.20                       | v0.21+                              |
| --------------------- | --------------------------- | ----------------------------------- |
| All components use it | Only less-hero-ping uses it | Deprecate DSD path, keep Island SSR |
| 10 components         | 1 component                 | Only new Island components use it   |

**Action in v0.20**: Update `packages/adapter-lit/README.md` to clarify it's now **Island SSR only**.

---

## Verification Checklist

- [ ] `less-hero-ping` renders ping animation correctly
- [ ] Lit dependency still in `packages/ui/deno.json` (for hero-ping)
- [ ] `@lessjs/adapter-lit` still in `www/deno.json` (for hero-ping SSR)
- [ ] CSS Parts on hero-ping work (`::part(dot-animated)`)
- [ ] All 9 DSD components have zero Lit imports
- [ ] All 9 DSD components have zero `@lessjs/adapter-lit` imports
- [ ] Island strategy table is documented in `packages/ui/README.md`

---

## Dependencies

```
SOP-009 blocks: SOP-011 (build verification)
SOP-009 blocked by: SOP-008
```
