/**
 * @lessjs/hub — Snapshot Renderer
 *
 * v0.19.0 Phase 2: Renders Lit components / Web Components to static HTML
 * for Hub previews. Supports three strategies:
 *
 * 1. @lit-labs/ssr-dom-shim: for SSR-capable Lit components (@lessjs/ui)
 * 2. Happy DOM: for browser-dependent npm packages (Shoelace, Media Chrome)
 * 3. Placeholder: fallback when rendering fails
 *
 * @see ADR-0031
 */

// ─── Types ───────────────────────────────────────────────────────────────

export interface SnapshotRenderResult {
  html: string;
  success: boolean;
  error?: string;
}

function _warn(msg: string) {
  try {
    console.warn('[hub:snapshot]', msg);
  } catch {
    // ignore
  }
}

// ─── SSR Snapshot Renderer (@lit-labs/ssr-dom-shim) ──────────────────────

/**
 * Render a Lit-based Web Component to a static HTML snapshot using
 * @lit-labs/ssr-dom-shim for the DOM environment.
 *
 * @param modUrl - file:// URL to the component module
 * @param tagName - Custom element tag name
 */
export async function renderSnapshotLit(
  modUrl: string,
  tagName: string,
): Promise<SnapshotRenderResult> {
  // Step 1: Set up DOM shim globals before module import
  let domShim: typeof import('@lit-labs/ssr-dom-shim') | null = null;
  try {
    domShim = await import('@lit-labs/ssr-dom-shim');
  } catch {
    return renderPlaceholder(tagName, '@lit-labs/ssr-dom-shim not available');
  }

  const origHTMLElement = globalThis.HTMLElement;
  const origCustomElements = (globalThis as Record<string, unknown>).customElements;

  try {
    // Patch globals with DOM shim
    const g = globalThis as Record<string, unknown>;
    g.HTMLElement = domShim.HTMLElement;
    g.customElements = domShim.customElements;

    // Step 2: Import the component module
    const mod = await import(modUrl);

    // Step 3: Find the component class
    let ComponentClass: CustomElementConstructor | null = null;

    // Try default export
    if (typeof mod.default === 'function') {
      ComponentClass = mod.default;
    }

    // Try registered element (some modules call customElements.define internally)
    if (!ComponentClass) {
      try {
        const ce = globalThis.customElements;
        if (ce && 'get' in ce) {
          ComponentClass = (ce as CustomElementRegistry).get(tagName) ?? null;
        }
      } catch {
        // ignore
      }
    }

    // Try named export matching the tag
    if (!ComponentClass) {
      const exportName = tagName.replace(/-/g, '_');
      if (typeof mod[exportName] === 'function') {
        ComponentClass = mod[exportName];
      }
    }

    if (!ComponentClass) {
      throw new Error(`No component class found for <${tagName}>`);
    }

    // Step 4: Create instance and get TemplateResult
    const instance = new ComponentClass() as HTMLElement & { render(): unknown };

    // Call render() to get the Lit TemplateResult
    let templateResult: unknown;
    try {
      templateResult = instance.render();
    } catch (renderErr) {
      throw new Error(
        `render() failed: ${renderErr instanceof Error ? renderErr.message : String(renderErr)}`,
      );
    }

    if (!templateResult) {
      throw new Error('render() returned nothing (null/undefined)');
    }

    // Step 5: Convert to HTML string using renderLitToString
    let htmlString: string;
    try {
      // Try adapter-lit SSR renderer first
      const adapterLit = await import('../../adapter-lit/src/ssr.ts');
      if (typeof adapterLit.renderLitToString === 'function') {
        htmlString = adapterLit.renderLitToString(templateResult, tagName);
      } else {
        throw new Error('renderLitToString not found');
      }
    } catch {
      // Fallback: manual TemplateResult serialization
      htmlString = templateResultToString(templateResult, tagName);
    }

    // Strip DSD template wrapper
    const innerHtml = stripDsdTemplate(htmlString);

    const html = `<div class="snapshot-preview">${innerHtml}</div>`;

    return { html, success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return renderPlaceholder(tagName, msg);
  } finally {
    // Restore globals
    const g = globalThis as Record<string, unknown>;
    g.HTMLElement = origHTMLElement;
    g.customElements = origCustomElements;
  }
}

// ─── Happy DOM Snapshot Renderer (for browser-dependent npm packages) ────

/**
 * Render a browser-dependent Web Component using Happy DOM.
 *
 * Happy DOM provides a full browser-environment simulation so that
 * npm packages like Shoelace and Media Chrome (which access
 * document.body, HTMLMediaElement, etc.) can render their shadow DOM
 * content at build time.
 *
 * @param importSpec - npm import specifier with subpath
 * @param tagName - Custom element tag name
 */
export async function renderSnapshotWithHappyDom(
  importSpec: string,
  tagName: string,
): Promise<SnapshotRenderResult> {
  // 1. Load Happy DOM
  let HappyWindowClass: typeof import('happy-dom').Window;
  try {
    const happyDom = await import('happy-dom');
    HappyWindowClass = happyDom.Window;
  } catch (err) {
    return renderPlaceholder(
      tagName,
      `Happy DOM not available: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 2. Create isolated Happy DOM environment
  const hWin = new HappyWindowClass({ url: 'https://localhost:8080' });
  const hDoc = hWin.document;

  // 3. Save and replace ALL global constructors from Happy DOM Window
  // This ensures components can reference Document, Node, Event, etc.
  const _savedGlobals = new Map<string, unknown>();
  const _hdPropNames = [
    'window',
    'self',
    'document',
    'customElements',
    'HTMLElement',
    'ShadowRoot',
    'Document',
    'Node',
    'Element',
    'Text',
    'Comment',
    'Event',
    'CustomEvent',
    'MouseEvent',
    'KeyboardEvent',
    'FocusEvent',
    'HTMLMediaElement',
    'HTMLVideoElement',
    'HTMLAudioElement',
    'HTMLInputElement',
    'HTMLButtonElement',
    'HTMLDivElement',
    'MutationObserver',
    'Selection',
    'Range',
    'CSSStyleSheet',
    'CSS',
    'CSSStyleDeclaration',
    'CSSRule',
    'getComputedStyle',
  ];
  const g = globalThis as Record<string, unknown>;
  const w = hWin as unknown as Record<string, unknown>;
  for (const k of _hdPropNames) {
    try {
      _savedGlobals.set(k, g[k]);
      const val = w[k];
      if (val !== undefined) {
        g[k] = val;
      }
    } catch { /* skip */ }
  }

  try {
    // 5. Import the npm component module (calls customElements.define)
    await import(importSpec);

    // 6. Verify element registration
    if (!hWin.customElements.get(tagName)) {
      throw new Error(`Component <${tagName}> was not registered after module import`);
    }

    // 7. Create element instance
    const Ctor = hWin.customElements.get(tagName);
    if (!Ctor) {
      throw new Error(`Component <${tagName}> was not registered`);
    }
    let el: HTMLElement;
    try {
      el = new Ctor() as unknown as HTMLElement;
    } catch {
      el = hDoc.createElement(tagName) as unknown as HTMLElement;
    }

    // Apply demo attributes so the component is visible / meaningful
    const DEMO_ATTRS: Record<string, Record<string, string>> = {
      'sl-alert': { open: '', variant: 'primary' },
      'sl-dialog': { open: '', label: 'Dialog' },
      'sl-drawer': { open: '', label: 'Drawer' },
      'sl-details': { open: '', summary: 'Details' },
      'sl-dropdown': { open: '' },
      'sl-tooltip': { content: 'Tooltip content', open: '', placement: 'top' },
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
      'media-controller': {},
      'media-play-button': {},
      'media-time-range': {},
      'media-volume-range': {},
      'media-poster-image': { src: 'https://placehold.co/400x225/111/fff?text=Video' },
      'media-loading-indicator': {},
    };
    const demos = DEMO_ATTRS[tagName];
    if (demos) {
      for (const [k, v] of Object.entries(demos)) {
        if (v === '') el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }

    // Add demo slot content for meaningful previews
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
      'sl-select':
        '<sl-menu-item value="a">Option A</sl-menu-item><sl-menu-item value="b">Option B</sl-menu-item>',
      'sl-button': 'Button',
      'sl-badge': 'Badge',
      'sl-tag': 'Tag',
      'sl-menu': '<sl-menu-item>Item 1</sl-menu-item><sl-menu-item>Item 2</sl-menu-item>',
      'sl-menu-item': 'Menu Item',
      'sl-tab-group':
        '<sl-tab slot="nav" panel="a">Tab A</sl-tab><sl-tab slot="nav" panel="b">Tab B</sl-tab><sl-tab-panel name="a">Panel A</sl-tab-panel><sl-tab-panel name="b">Panel B</sl-tab-panel>',
      'sl-tree': '<sl-tree-item expanded>Branch<sl-tree-item>Leaf</sl-tree-item></sl-tree-item>',
      'sl-tree-item': 'Tree Item',
    };
    const demoSlots = DEMO_SLOTS[tagName];
    if (demoSlots) {
      el.innerHTML = demoSlots;
    }

    // Polyfill ElementInternals for components that use it
    const elRecord = el as unknown as Record<string, unknown>;
    if (typeof elRecord.attachInternals !== 'function') {
      elRecord.attachInternals = () => ({
        setFormValue: () => {},
        setValidity: () => {},
      });
    }
    // Manually trigger connectedCallback (more reliable than DOM append)
    if (typeof elRecord.connectedCallback === 'function') {
      try {
        (elRecord.connectedCallback as () => void)();
      } catch { /* ignore callback errors */ }
    }
    await new Promise((r) => setTimeout(r, 0));
    // Append to DOM for a more complete environment
    if (hDoc.body) {
      (hDoc.body as unknown as { appendChild(n: unknown): unknown }).appendChild(el);
    }
    // Give microtasks time for connectedCallback to fire
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

    // 8. Serialize shadow DOM and interpolate slots with demo content
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
    shadowHtml = shadowHtml.replace(/:host\b/g, tagName);

    // Load package theme CSS variables (e.g. Shoelace light.css)
    let themeCss = '';
    try {
      if (importSpec.includes('@shoelace-style/shoelace')) {
        const resolved = await import.meta.resolve(
          'npm:@shoelace-style/shoelace/dist/themes/light.css',
        );
        const cssText = Deno.readTextFileSync(new URL(resolved));
        const rootMatch = cssText.match(/:root,\s*:host,\s*\.sl-theme-light\s*\{([\s\S]*?)\n\}/);
        if (rootMatch) {
          themeCss = `<style>:root, :host, .sl-theme-light {\n${rootMatch[1]}\n}</style>`;
        }
      }
    } catch { /* ignore — theme not critical for all previews */ }

    // 9. Detach element
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }

    return {
      html: `<div class="snapshot-preview">${themeCss}<${tagName}>${shadowHtml}</${tagName}></div>`,
      success: true,
    };
  } catch (err) {
    // Throw so the caller sees the failure (scanner's own try/catch will handle it)
    throw new Error(
      `Happy DOM render failed for <${tagName}>: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  } finally {
    // 10. Restore original globals
    for (const [k, v] of _savedGlobals) {
      (globalThis as Record<string, unknown>)[k] = v;
    }

    // 11. Clean up Happy DOM
    try {
      hWin.happyDOM?.cancelAsync();
    } catch { /* ignore */ }
  }
}

// ─── Manual TemplateResult Serialization (Fallback) ─────────────────────

/**
 * Convert a Lit TemplateResult to HTML string without renderLitToString.
 * This is a minimal implementation for snapshot purposes.
 */
function templateResultToString(result: unknown, tagName: string): string {
  if (!result || typeof result !== 'object') {
    return '';
  }

  const r = result as Record<string, unknown>;
  const strings = r.strings as string[] | undefined;
  const values = r.values as unknown[] | undefined;

  if (!strings || !values) {
    return String(result);
  }

  // Interleave: strings[0] + values[0] + strings[1] + values[1] + ...
  let output = '';
  for (let i = 0; i < values.length; i++) {
    output += strings[i];
    const val = values[i];
    if (val === null || val === undefined) {
      continue;
    }
    if (typeof val === 'string') {
      output += htmlEscape(val);
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      output += String(val);
    } else if (isLitTemplateResult(val)) {
      output += templateResultToString(val, tagName);
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (item === null || item === undefined) continue;
        if (typeof item === 'string') {
          output += htmlEscape(item);
        } else if (isLitTemplateResult(item)) {
          output += templateResultToString(item, tagName);
        } else if (
          item && typeof item === 'object' && 'strings' in (item as Record<string, unknown>)
        ) {
          output += templateResultToString(item, tagName);
        } else {
          output += htmlEscape(String(item));
        }
      }
    } else if (val && typeof val === 'object' && 'strings' in (val as Record<string, unknown>)) {
      output += templateResultToString(val, tagName);
    } else {
      output += htmlEscape(String(val));
    }
  }
  output += strings[strings.length - 1] || '';

  return output;
}

const LIT_TEMPLATE_TYPE_MARKER = '_$litType$';

function isLitTemplateResult(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    LIT_TEMPLATE_TYPE_MARKER in (value as Record<string, unknown>)
  );
}

function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Placeholder ─────────────────────────────────────────────────────────

/**
 * Generate a placeholder snapshot for components that cannot be rendered.
 */
function renderPlaceholder(tagName: string, reason?: string): SnapshotRenderResult {
  const html =
    `<div class="snapshot-preview"><span style="display:inline-block;padding:0.75rem 1.25rem;border:1px dashed #d0d0d0;border-radius:6px;font-family:monospace;font-size:0.8125rem;color:#999;background:#fafafa;">${tagName}</span></div>`;
  return { html, success: true, error: reason };
}

// ─── Public helpers ──────────────────────────────────────────────────────

/**
 * Format a snapshot HTML for embedding in an SSG page.
 */
export function formatSnapshotForDisplay(html: string): string {
  return html.trim();
}

/**
 * Strip DSD template wrapper from Lit SSR output.
 *
 * Lit SSR produces: <tag><template shadowrootmode="open">...content...</template></tag>
 * For snapshot previews, we only want the inner rendered HTML without DSD syntax.
 */
function stripDsdTemplate(html: string): string {
  let result = html.replace(/<template\s+shadowrootmode[^>]*>/gi, '');
  result = result.replace(/<\/template>/gi, '');

  // Strip <style> blocks (they pollute the preview with host styles)
  result = result.replace(/<style>[\s\S]*?<\/style>/gi, '');

  // Strip duplicate wrapping tag names
  const tagMatch = html.match(/^<([a-z][a-z0-9-]*)>/i);
  if (tagMatch) {
    const tagName = tagMatch[1];
    const closeTag = `</${tagName}>`;
    result = result.replace(new RegExp(`^<${tagName}[^>]*>`, 'i'), '');
    result = result.replace(new RegExp(escapeRegex(closeTag) + '$'), '');
  }

  return result.trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
