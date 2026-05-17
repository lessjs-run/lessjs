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

async function render(impSpec: string, tag: string): Promise<string> {
  const { Window } = await import('npm:happy-dom@^20.8.9');
  const hWin = new Window({ url: 'https://localhost:8080' });
  const hDoc = hWin.document;

  // Patch globals
  const orig: Record<string, unknown> = {};
  const patches = [
    'window', 'self', 'document', 'HTMLElement', 'customElements', 'ShadowRoot',
    'Document', 'Node', 'Element', 'Event', 'CustomEvent', 'CSSStyleSheet',
    // Media Chrome's isShimmed check
    'ResizeObserver', 'DocumentFragment', 'localStorage', 'getComputedStyle',
    'navigator', 'matchMedia', 'DOMParser',
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

    // Append to trigger lifecycle
    if (hDoc.body) {
      hDoc.body.appendChild(el);
    }
    await new Promise((r) => setTimeout(r, 0));

    // Serialize — keep <style> tags so the preview has scoped component styles
    let html = '';
    if (el.shadowRoot) {
      html = el.shadowRoot.innerHTML.trim();
    } else {
      html = el.innerHTML || '';
    }

    // Detach
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }

    return `<div class="snapshot-preview">${html}</div>`;
  } finally {
    // Restore globals
    const g = globalThis as Record<string, unknown>;
    for (const k of patches) {
      g[k] = orig[k];
    }
    // Clean up Happy DOM
    try { hWin.happyDOM?.cancelAsync(); } catch { /* ignore */ }
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
