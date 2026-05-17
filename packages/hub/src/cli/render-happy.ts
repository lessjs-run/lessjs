/**
 * @lessjs/hub — Standalone Happy DOM renderer
 *
 * Called as a subprocess by the scanner. Each invocation renders ONE
 * component in a fresh Deno process, avoiding global state pollution.
 *
 * Usage:
 *   deno run -A render-happy.ts <importSpec> <tagName>
 *
 * Output: stdout = snapshot HTML (or empty if failed)
 *         stderr = error message (if failed)
 */

const [importSpec, tagName] = Deno.args;

if (!importSpec || !tagName) {
  console.error('Usage: render-happy.ts <importSpec> <tagName>');
  Deno.exit(1);
}

/** Demo attributes to make component snapshots visible and meaningful.
 *  Many WC libraries default to hidden/closed states (e.g. sl-alert open=false).
 */
const DEMO_ATTRS: Record<string, Record<string, string>> = {
  // Shoelace — need 'open' to be visible
  'sl-alert': { open: '', variant: 'primary' },
  'sl-dialog': { open: '', label: 'Dialog' },
  'sl-drawer': { open: '', label: 'Drawer' },
  'sl-details': { open: '', summary: 'Details' },
  'sl-dropdown': { open: '' },
  'sl-tooltip': { content: 'Tooltip content', open: '', placement: 'top' },
  // Shoelace — need value/content to show state
  'sl-progress-bar': { value: '50' },
  'sl-progress-ring': { value: '50' },
  'sl-range': { value: '50' },
  'sl-rating': { value: '3' },
  'sl-icon': { name: 'star' },
  'sl-icon-button': { name: 'gear', label: 'Settings' },
  'sl-input': { placeholder: 'Type something...', value: 'Hello' },
  'sl-textarea': { placeholder: 'Type something...', value: 'Hello World' },
  'sl-select': { placeholder: 'Choose an option' },
  'sl-color-picker': { value: '#339af0' },
  'sl-badge': { variant: 'primary' },
  'sl-tag': { variant: 'primary', size: 'medium' },
  'sl-button': { variant: 'primary' },
  'sl-avatar': { image: 'https://placehold.co/40x40/339af0/fff?text=JS' },
  'sl-carousel': { navigation: '', pagination: '', loop: '' },
  'sl-animated-image': { src: 'https://placehold.co/200x150/339af0/fff?text=GIF' },
  'sl-image-comparer': {},
  'sl-skeleton': { effect: 'pulse' },
  'sl-spinner': {},
  'sl-split-panel': {},
  'sl-switch': { checked: '' },
  'sl-checkbox': { checked: '' },
  'sl-radio': { checked: '' },
  'sl-radio-group': { label: 'Select one' },
  'sl-tab-group': {},
  'sl-tab': {},
  'sl-tab-panel': {},
  'sl-table': {},
  'sl-tree': {},
  'sl-tree-item': { expanded: '' },
  'sl-card': {},
  'sl-divider': {},
  'sl-menu': {},
  'sl-menu-item': { checked: '' },
  // Media Chrome
  'media-controller': {},
  'media-play-button': {},
  'media-time-range': {},
  'media-volume-range': {},
  'media-poster-image': { src: 'https://placehold.co/400x225/111/fff?text=Video' },
  'media-loading-indicator': {},
};

/** Demo slot content so components show meaningful structure in previews */
const DEMO_SLOTS: Record<string, string> = {
  'sl-card':
    '<div slot="header">Card Header</div><div>This is the card body content.</div><div slot="footer">Card Footer</div>',
  'sl-alert': 'This is an alert message with important information.',
  'sl-dialog': '<div slot="label">Dialog Title</div><div>This is the dialog content.</div>',
  'sl-drawer': '<div slot="label">Drawer Title</div><div>This is the drawer content.</div>',
  'sl-details':
    '<div slot="summary">Click to expand</div><div>Here is the hidden detail content.</div>',
  'sl-dropdown':
    '<sl-button slot="trigger" caret>Dropdown</sl-button><sl-menu><sl-menu-item>Option 1</sl-menu-item><sl-menu-item>Option 2</sl-menu-item></sl-menu>',
  'sl-tooltip': '<sl-button>Hover me</sl-button>',
  'sl-input': '',
  'sl-textarea': '',
  'sl-select':
    '<sl-menu-item value="a">Option A</sl-menu-item><sl-menu-item value="b">Option B</sl-menu-item>',
  'sl-button': 'Button',
  'sl-badge': 'Badge',
  'sl-tag': 'Tag',
  'sl-avatar': '',
  'sl-icon': '',
  'sl-icon-button': '',
  'sl-menu': '<sl-menu-item>Item 1</sl-menu-item><sl-menu-item>Item 2</sl-menu-item>',
  'sl-menu-item': 'Menu Item',
  'sl-tab-group':
    '<sl-tab slot="nav" panel="a">Tab A</sl-tab><sl-tab slot="nav" panel="b">Tab B</sl-tab><sl-tab-panel name="a">Panel A</sl-tab-panel><sl-tab-panel name="b">Panel B</sl-tab-panel>',
  'sl-tree': '<sl-tree-item expanded>Branch<sl-tree-item>Leaf</sl-tree-item></sl-tree-item>',
  'sl-tree-item': 'Tree Item',
};

async function loadPackageTheme(impSpec: string): Promise<string> {
  try {
    if (impSpec.includes('@shoelace-style/shoelace')) {
      const resolved = await import.meta.resolve(
        'npm:@shoelace-style/shoelace/dist/themes/light.css',
      );
      const cssText = Deno.readTextFileSync(new URL(resolved));
      const rootMatch = cssText.match(/:root,\s*:host,\s*\.sl-theme-light\s*\{([\s\S]*?)\n\}/);
      if (rootMatch) {
        return `<style>:root, :host, .sl-theme-light {\n${rootMatch[1]}\n}</style>`;
      }
    }
  } catch { /* ignore — theme not critical for all previews */ }
  return '';
}

async function render(impSpec: string, tag: string): Promise<string> {
  const { Window } = await import('npm:happy-dom@^20.8.9');
  const hWin = new Window({ url: 'https://localhost:8080' });
  const hDoc = hWin.document;

  // Patch globals
  const orig: Record<string, unknown> = {};
  const patches = [
    'window',
    'self',
    'document',
    'HTMLElement',
    'customElements',
    'ShadowRoot',
    'Document',
    'Node',
    'Element',
    'Event',
    'CustomEvent',
    'CSSStyleSheet',
    // Media Chrome's isShimmed check
    'ResizeObserver',
    'DocumentFragment',
    'localStorage',
    'getComputedStyle',
    'navigator',
    'matchMedia',
    'DOMParser',
    // Required by some components
    'MutationObserver',
  ];
  // eslint-disable-next-line no-explicit-any -- globalThis index access requires any
  const g = globalThis as Record<string, unknown>;
  // eslint-disable-next-line no-explicit-any -- Happy DOM window index access requires any
  const w = hWin as Record<string, unknown>;
  for (const k of patches) {
    orig[k] = g[k];
    const val = w[k];
    if (val !== undefined) g[k] = val;
  }

  try {
    // Import component module (may load Lit, Shoelace, etc.)
    await import(impSpec);

    // Verify registration
    const Ctor = hWin.customElements.get(tag);
    if (!Ctor) {
      throw new Error(`Component <${tag}> was not registered`);
    }

    // Instantiate
    const el = new Ctor() as HTMLElement;

    // Apply demo attributes so the component is visible / meaningful
    const demos = DEMO_ATTRS[tag];
    if (demos) {
      for (const [k, v] of Object.entries(demos)) {
        if (v === '') {
          el.setAttribute(k, '');
        } else {
          el.setAttribute(k, v);
        }
      }
    }

    // Append demo slot content
    const demoSlots = DEMO_SLOTS[tag];
    if (demoSlots) {
      el.innerHTML = demoSlots;
    }

    // Append to trigger lifecycle
    if (hDoc.body) {
      hDoc.body.appendChild(el);
    }
    await new Promise((r) => setTimeout(r, 0));

    // Convert adoptedStyleSheets (Lit constructable styles) into inline <style> tags
    // so the snapshot HTML actually contains the component CSS.
    if (el.shadowRoot && el.shadowRoot.adoptedStyleSheets?.length) {
      for (const sheet of el.shadowRoot.adoptedStyleSheets) {
        try {
          const rules: string[] = [];
          for (const rule of sheet.cssRules) {
            rules.push(rule.cssText);
          }
          if (rules.length) {
            const styleEl = hDoc.createElement('style');
            styleEl.textContent = rules.join('\n');
            el.shadowRoot.insertBefore(styleEl as unknown as Node, el.shadowRoot.firstChild);
          }
        } catch { /* skip sheets we can't read */ }
      }
    }

    // Serialize shadow DOM and interpolate slots with demo content
    let shadowHtml = '';
    if (el.shadowRoot) {
      shadowHtml = el.shadowRoot.innerHTML.trim();
    }

    // Extract slot content from light DOM children (including text nodes)
    const slotMap = new Map<string, string>();
    const defaultSlots: string[] = [];
    for (const child of el.childNodes) {
      if (child.nodeType === 1) {
        // Element node
        const slotName = (child as HTMLElement).getAttribute('slot');
        if (slotName) {
          slotMap.set(slotName, (child as HTMLElement).outerHTML);
        } else {
          defaultSlots.push((child as HTMLElement).outerHTML);
        }
      } else if (child.nodeType === 3) {
        // Text node — include trimmed text as default slot fallback
        const text = child.textContent?.trim();
        if (text) {
          defaultSlots.push(text);
        }
      }
    }
    if (defaultSlots.length) {
      slotMap.set('default', defaultSlots.join(''));
    }

    // Insert demo content as <slot> fallback so CSS classes on <slot> are preserved.
    // Use placeholder tags to avoid the default-slot regex matching named slots.
    shadowHtml = shadowHtml.replace(/<slot name="([^"]*)"([^>]*)><\/slot>/gi, (_m, name, attrs) => {
      const content = slotMap.get(name) || '';
      return `<SLOT-FALLBACK name="${name}"${attrs}>${content}</SLOT-FALLBACK>`;
    });
    shadowHtml = shadowHtml.replace(/<slot(?![a-z0-9-])([^>]*)><\/slot>/gi, (_m, attrs) => {
      const content = slotMap.get('default') || '';
      return `<SLOT-FALLBACK${attrs}>${content}</SLOT-FALLBACK>`;
    });
    shadowHtml = shadowHtml.replace(/<SLOT-FALLBACK/g, '<slot').replace(
      /<\/SLOT-FALLBACK>/g,
      '</slot>',
    );

    // Make :host selectors work outside shadow DOM
    shadowHtml = shadowHtml.replace(/:host\b/g, tag);

    // Load package theme CSS variables (e.g. Shoelace light.css)
    const themeCss = await loadPackageTheme(impSpec);

    // Detach
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }

    return `<div class="snapshot-preview">${themeCss}<${tag}>${shadowHtml}</${tag}></div>`;
  } finally {
    // Restore globals
    const g = globalThis as Record<string, unknown>;
    for (const k of patches) {
      g[k] = orig[k];
    }
    // Clean up Happy DOM
    try {
      hWin.happyDOM?.cancelAsync();
    } catch { /* ignore */ }
  }
}

// Execute
render(importSpec, tagName)
  .then((result) => {
    if (result) {
      console.log(result);
    }
    Deno.exit(result ? 0 : 1);
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  });
