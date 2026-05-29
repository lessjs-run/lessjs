# LessJS v0.26.0 Web Core Redesign Blueprint

## 🇨🇭 Neo-Swiss Hyper-Dark Tech Modernist Theme

This document defines the official design specifications, technical guidelines, and step-by-step implementation plan for refactoring the LessJS Documentation Website (`www/`) to the **Neo-Swiss Hyper-Dark Tech Modernist (新瑞士赛博现代主义极黑)** theme.

The implementation will strictly leverage and showcase the native capabilities of LessJS Core Packages (`packages/`), demonstrating high-performance, DSD-first, and zero-runtime bundle efficiency.

---

## 🗺️ Architectural Assets & Mockups

The high-fidelity vector mockups illustrating this design are located in the repository:

1. **Homepage Console (Light Refinement)**: `../mockups/swiss-style-homepage.svg`
2. **Docs Layout & TOC (Clean Grid)**: `../mockups/swiss-style-docs.svg`
3. **Hyper-Dark Neo-Swiss Dashboard (Official Selection)**: `../mockups/swiss-style-hyper-dark-showcase.svg`

---

## 🎨 Part 1: Visual Design System (Theme Spec)

We transition from standard B&W minimal to a high-contrast **Neo-Swiss Hyper-Dark** aesthetic.

### 1.1 Color Palette & Accent Glows

```css
:root, :host {
  /* Core Base Colors */
  --bg-obsidian: #040508; /* Deep space obsidian body background */
  --bg-panel: #090b11; /* Glassmorphic panel background */
  --bg-terminal: #010204; /* Hyper-dark code container */

  --text-primary: #ffffff; /* High-contrast active headers and copy */
  --text-secondary: #8e92a2; /* Calibrated low-fatigue slate grey */
  --text-muted: #515466; /* Subdued text for borders & inactive elements */

  /* Cyber Accents (To be used with extreme mathematical restraint) */
  --brand-neon: #7c6ff5; /* Neo-violet brand signature */
  --brand-glow: rgba(124, 111, 245, 0.16);

  --cyber-green: #00ff87; /* Neon cyber green for gates & success states */
  --cyber-green-glow: rgba(0, 255, 135, 0.12);

  --laser-cyan: #60efff; /* Tech cyan for dynamic links and charts */

  /* Borders */
  --border-futuristic: rgba(124, 111, 245, 0.16);
  --border-bright: rgba(124, 111, 245, 0.4);
}
```

### 1.2 Mathematical Typography scale

Aligning to a strict Swiss structural grid:

- **Title (H1)**: `3rem` (48px) | Font-weight: `900` | Line-height: `1.05` | `letter-spacing: -0.04em`.
- **Subtitle / Secondary Title (H2)**: `1.5rem` (24px) | Font-weight: `700` | `letter-spacing: -0.02em`.
- **Mini Headers / Category Eyebrows**: `10px` (or `11px`) | Font-weight: `800` | Full `uppercase` | `letter-spacing: 0.25em`.
- **Monospace Text**: `JetBrains Mono` | Font-weight: `450` | Line-height: `1.65`.

### 1.3 Adaptive Micro-interactions

- **Card Hover Feedbacks**:
  - Instead of translation animations or drop shadows, cards use **border-sharpening**: on hover, the border transition shifts from `var(--border-futuristic)` to `var(--border-bright)` with a subtle inner glow.
- **Glassmorphic Blur (Where supported)**:
  - Header & floating TOC use `backdrop-filter: blur(12px) saturate(180%)` to allow gridlines to subtly pass underneath during scrolls.

---

## 🛠️ Part 2: Leveraging Framework Capabilities (`packages/`)

To keep the bundle size small (~30KB), we will strictly utilize the native features exported by LessJS monorepo packages. **No bulky external libraries.**

### 2.1 CSS & Stylesheet Separation (`@lessjs/style-sheet`)

Instead of inlining long CSS strings directly inside `.tsx` files, we use the framework-native asset pipeline.

1. Create dedicated `.css` files.
2. In the `.tsx` route/island file, load CSS as an inline module via Vite:
   ```ts
   import pageCss from './styles/getting-started.css?inline';
   ```
3. Instantiate and adopted the style sheet safely:
   ```ts
   const pageStyles = new StyleSheet();
   pageStyles.replaceSync(pageCss);

   export class GettingStartedPage extends DsdElement {
     static override styles = [openPropsTokenSheet, pageStyles];
   }
   ```

### 2.2 Fine-grained Reactivity in Islands (`@lessjs/signals`)

For tab switches, interactive graphs, and live components, we avoid bulky state managers. We use the native `@lessjs/signals` library.

```tsx
import { DsdElement } from '@lessjs/core';
import { computed, signal } from '@lessjs/signals';

export class InteractiveConsole extends DsdElement {
  // Define private signal state (avoids polluting public properties)
  #activeTab = signal<'dsd' | 'graph' | 'build'>('dsd');

  // Computed state for high-performance dependency calculations
  #activeCode = computed(() => {
    if (this.#activeTab.value === 'dsd') return DSD_SOURCE;
    if (this.#activeTab.value === 'graph') return GRAPH_SOURCE;
    return BUILD_SOURCE;
  });

  override render() {
    return (
      <div className='console-wrapper'>
        <div className='tabs'>
          <button
            className={this.#activeTab.value === 'dsd' ? 'active' : ''}
            onClick={() => this.#activeTab.value = 'dsd'}
          >
            DSD
          </button>
        </div>
        <pre><code>{this.#activeCode}</code></pre>
      </div>
    );
  }
}
```

_Note: In JSX templates, children that are signals (e.g. `{this.#activeCode}`) are automatically unwrapped and bound to text-node effects during client-side hydration, giving ultra-fast pinpoint DOM updates._

### 2.3 Single-file Bilingual Components (`@lessjs/core`)

Instead of duplicating route folders, we utilize the native `_getLocale` API of `DsdElement`:

```tsx
export class GettingStartedPage extends DsdElement {
  override render() {
    const isZh = this._getLocale('zh') === 'zh';
    return isZh ? this._renderZh() : this._renderEn();
  }
}
```

At build-time, the `@lessjs/i18n` plugin automatically executes SSG expansion. It renders the component twice (once with `locale="en"`, once with `locale="zh"`) and writes the output to `/guide/getting-started/index.html` and `/zh/guide/getting-started/index.html` respectively, preserving 100% zero-duplication code structure and 100% SEO-friendly static assets.

---

## 🚀 Part 3: Step-by-Step Refactoring Steps

### 📅 Phase 1: Foundations & Shared Token Alignment

1. **Configure Theme Colors**:
   - Update `www/vite.config.ts`'s `colorTokensStyle` and global inject fragments to set up the dark theme variables.
   - Force HTML background to `#040508` and default text selection to the purple-neon glow.
2. **Refactor `<less-layout>` (`packages/ui/src/less-layout.tsx`)**:
   - Update the background of the app wrapper to `var(--bg-obsidian)`.
   - Polish the header and sidebar to a ultra-minimalist Swiss grid.
   - Add the vertical activity indicator line (`border-left`) to active navigation items.
   - Refactor `<less-theme-toggle>` to support a smooth CSS rotation animation (`transform: rotate(45deg)`).

### 📅 Phase 2: Decoupling Style Sheets (DX Overhaul)

1. **Create Asset Files**:
   - In `www/app/components/`, split `page-styles.ts` into a clean CSS stylesheet `global-page-styles.css`.
   - Update `www/app/components/page-styles.ts` to simply read this CSS and export it, or update route files to import CSS directly.
2. **Remove Inline Styles**:
   - In each of the files under `www/app/routes/guide/` and `www/app/routes/architecture/`, move the `StyleSheet.replaceSync` CSS strings to separate `.css` files under a `styles/` subfolder. This completely cleans up the `.tsx` component code.

### 📅 Phase 3: High-Frequency Homepage Upgrades

1. **Interactive Console**:
   - In `www/app/routes/index/index.tsx`, upgrade the tab controls.
   - Introduce a `signal` to manage active tab selection (`dsd` | `graph` | `build`).
   - Wire up click event handlers on the tabs, updating the pre-rendered panels dynamically on the client side.
2. **Visual Dependency Graph**:
   - Replace the static text-based package graph on the homepage with an elegant, responsive vector SVG diagram of the 18 monorepo packages.
   - Align the SVG to the 12-column Swiss grid, applying neon purple and green glows to indicate active release gate status.

### 📅 Phase 4: Docs Reader Polish (TOC Integration)

1. **Integrate Dynamic TOC**:
   - Enable `<less-toc>` island component inside `www/app/routes/guide/getting-started.tsx` and all subsequent guide pages.
   - Use `IntersectionObserver` to track reading progress. Apply the Swiss active track indicator (neon violet left border) to highlight the active heading in the TOC side panel.
2. **Beautify Code Blocks (`<less-code-block>`)**:
   - Polish code containers in `@lessjs/ui` to use `#1A1A2E` background, sharp `0.5px` border contrast, and custom mono typography.

### 📅 Phase 5: Verification & Safety Gates

1. Run local dev preview mode to verify routing and layout integrity:
   ```bash
   deno task build
   deno task preview
   ```
2. Verify all tests pass 100% and there are no regression gaps:
   ```bash
   deno task test
   ```

---

## 🎯 Architecture Quality Affirmation

By executing this refactoring plan, LessJS will demonstrate an industry-leading standard for **highly aesthetic, minimalist design** backed by an **uncompromisingly clean and performance-tuned engineering implementation**. Every single visual ornament is derived from real framework properties, establishing a 100% truthful, high-fidelity developer showcase.
