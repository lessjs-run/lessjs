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
    // Append to trigger lifecycle
    if (hDoc.body) {
      hDoc.body.appendChild(el);
    }
    await new Promise((r) => setTimeout(r, 0));

    // Serialize
    let html = '';
    if (el.shadowRoot) {
      html = el.shadowRoot.innerHTML.replace(/<style>[\s\S]*?<\/style>/gi, '').trim();
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
