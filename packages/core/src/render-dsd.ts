/**
 * @lessjs/core - DSD Renderer.
 *
 * Pure string-based Declarative Shadow DOM SSR renderer.
 * Framework-agnostic: no Lit dependency and no TemplateResult knowledge.
 *
 * KISS Architecture (v0.5.0):
 * - Takes a registered Custom Element class + props and returns DSD HTML
 * - Components MUST implement render(): string
 * - Rendering is synchronous string concatenation; no DOM shim needed
 * - Framework adapters can hook into the pipeline via globalThis
 *
 * SSR lifecycle:
 *   1. Instantiate component class
 *   2. Set attributes/properties from props
 *   3. Call render() to get Shadow DOM HTML string
 *   4. Wrap in <template shadowrootmode="open">
 *
 * Client lifecycle:
 *   1. Browser parses DSD and attaches Shadow DOM automatically
 *   2. customElements.define() upgrades existing elements
 *   3. connectedCallback fires and attaches event listeners to existing DOM
 *   4. No duplicate client render is needed
 *
 * @module @lessjs/core/render-dsd
 */
/** Escape text content for safe HTML insertion */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape an HTML attribute value */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape a string for use as an attribute value (double-quoted) */
export function escapeAttrValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return escapeAttr(String(value));
}

// ─── Adapter Protocol ──────────────────────────────────────────

/** Type for the adapter's template check function */
type TemplateCheckFn = (value: unknown) => boolean;

/** Type for the adapter's SSR renderer function */
type SsrRendererFn = (value: unknown, tagName: string) => Promise<string>;

/** Type for the adapter's styles extractor function */
type StylesExtractorFn = (componentClass: CustomElementConstructor) => string | undefined;

/**
 * Check if an adapter has registered a template type checker.
 * Returns the checker function if available, undefined otherwise.
 */
function getAdapterTemplateCheck(): TemplateCheckFn | undefined {
  return (globalThis as Record<string, unknown>).__kissLitTemplateCheck as
    | TemplateCheckFn
    | undefined;
}

/**
 * Check if an adapter has registered an SSR renderer.
 * Returns the renderer function if available, undefined otherwise.
 */
function getAdapterSsrRenderer(): SsrRendererFn | undefined {
  return (globalThis as Record<string, unknown>).__kissLitSsrRenderer as
    | SsrRendererFn
    | undefined;
}

/**
 * Check if an adapter has registered a styles extractor.
 * Returns the extractor function if available, undefined otherwise.
 */
function getAdapterStylesExtractor(): StylesExtractorFn | undefined {
  return (globalThis as Record<string, unknown>).__kissLitStylesExtractor as
    | StylesExtractorFn
    | undefined;
}

// ─── DSD Rendering ──────────────────────────────────────────────

/** Serialize key-value strings to HTML attribute string */
export function serializeAttributes(props: Record<string, string | boolean | undefined>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(props)) {
    if (val === false || val === null || val === undefined) continue;
    if (val === true) {
      parts.push(key);
    } else {
      parts.push(`${key}="${escapeAttrValue(val)}"`);
    }
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

/**
 * Interface that components must implement to be DSD-renderable.
 * Works with any Custom Element class that has render() and connectedCallback().
 *
 * render() MUST return a string. If you use Lit components that return
 * TemplateResult, install @lessjs/adapter-lit to handle the conversion.
 */
export interface DsdComponent {
  /** Return Shadow DOM inner HTML as a string */
  render(): string | unknown;

  /** Optional: called after setting props, before render() */
  connectedCallback?(): void;

  /** Set named property/value */
  [key: string]: unknown;
}

/**
 * Render a single component to DSD HTML string.
 *
 * @param tagName - Custom element tag name (e.g. 'less-button')
 * @param componentClass - Registered Custom Element class constructor
 * @param props - Attribute/property key-value pairs
 * @returns Complete DSD HTML string
 *
 * @example
 * ```ts
 * const html = renderDSD('less-button', KissButton, { variant: 'primary' })
 * // → <less-button variant="primary">
 * //      <template shadowrootmode="open">
 * //        <style>:host{...}</style>
 * //        <button>Click</button>
 * //      </template>
 * //    </less-button>
 * ```
 */
export async function renderDSD(
  tagName: string,
  componentClass: CustomElementConstructor,
  props: Record<string, string | boolean | undefined> = {},
): Promise<string> {
  // 1. Instantiate the component
  //    Note: In Node.js/Deno SSR, no DOM lifecycle fires.
  //    The component must be designed to work without connectedCallback.
  let instance: DsdComponent;
  try {
    instance = new componentClass() as unknown as DsdComponent;
  } catch (err) {
    console.error(`[LessJS] Failed to instantiate <${tagName}>:`, err);
    return `<${tagName}><!-- render error --></${tagName}>`;
  }

  // 2. Set attributes/properties
  for (const [key, value] of Object.entries(props)) {
    try {
      (instance as Record<string, unknown>)[key] = value;
    } catch {
      // Some properties may be read-only — ignore silently
    }
  }

  // 3. DO NOT call connectedCallback in SSR.
  //    Lit's connectedCallback triggers performUpdate() → requestUpdate()
  //    which requires a real DOM (createComment, etc.).
  //    In DSD SSR we only need the render() return value.
  //    connectedCallback will fire on the client after upgrade.

  // 4. Call render() to get Shadow DOM content
  let content: string;
  try {
    const result = instance.render();
    if (result == null) {
      content = '';
    } else if (typeof result === 'string') {
      // Fast path: render() returned a plain string — no adapter needed
      content = result;
    } else {
      // Slow path: render() returned a non-string value.
      // Check if an adapter (e.g. @lessjs/adapter-lit) is installed.
      const templateCheck = getAdapterTemplateCheck();
      const ssrRenderer = getAdapterSsrRenderer();

      if (templateCheck && ssrRenderer && templateCheck(result)) {
        // Adapter handles the framework-specific type (e.g. Lit TemplateResult)
        content = await ssrRenderer(result, tagName);
      } else {
        // No adapter installed — this is a user error.
        // The component returned something that's not a string and no adapter
        // can handle it. Provide a clear error message.
        console.error(
          `[LessJS] <${tagName}> render() returned ${typeof result} instead of string. ` +
            (isLitTemplateResultHeuristic(result)
              ? 'This looks like a Lit TemplateResult — install @lessjs/adapter-lit to handle it.'
              : 'Components must return a string from render().'),
        );
        content = `<!-- render error: ${typeof result} returned, expected string -->`;
      }
    }
  } catch (err) {
    console.error(`[LessJS] <${tagName}> render() failed:`, err);
    content = '<!-- render error -->';
  }

  // 5. Extract static styles from component class
  //    Adapters (e.g. @lessjs/adapter-lit) register a styles extractor
  //    that reads CSSResult / CSSResultArray from the class and returns
  //    a plain CSS string. This is injected as a <style> tag inside the
  //    shadow root so the DSD output includes styles for first paint.
  let styleCss = '';
  const stylesExtractor = getAdapterStylesExtractor();
  if (stylesExtractor) {
    try {
      styleCss = stylesExtractor(componentClass) || '';
    } catch {
      // Style extraction failed — continue without styles
    }
  }

  // 6. Wrap in DSD
  const attrs = serializeAttributes(props);
  const styleTag = styleCss ? `\n    <style>${styleCss}</style>` : '';
  return `<${tagName}${attrs}>
  <template shadowrootmode="open">${styleTag}
    ${content}
  </template>
</${tagName}>`;
}

/**
 * Heuristic check for Lit TemplateResult without importing Lit.
 * Checks for the _$litType$ marker that Lit uses internally.
 * This is only used for error messaging — actual rendering goes through adapters.
 */
function isLitTemplateResultHeuristic(value: unknown): boolean {
  return typeof value === 'object' && value !== null &&
    '_$litType$' in (value as Record<string, unknown>);
}

/**
 * Render a component from the global Custom Element registry.
 * Looks up the class by tag name using customElements.get().
 *
 * @param tagName - Registered custom element tag name
 * @param props - Attribute/property key-value pairs
 * @returns DSD HTML string, or error HTML if tag is not registered
 *
 * @example
 * ```ts
 * const html = renderDSD('less-button', { variant: 'primary' })
 * ```
 */
export async function renderDSDByName(
  tagName: string,
  props: Record<string, string | boolean | undefined> = {},
): Promise<string> {
  const cls = globalThis.customElements?.get(tagName);

  if (!cls) {
    console.warn(`[LessJS] <${tagName}> is not registered — rendering as void element`);
    const attrs = serializeAttributes(props);
    return `<${tagName}${attrs}></${tagName}>`;
  }

  return await renderDSD(tagName, cls as CustomElementConstructor, props);
}

// ─── Document Wrapping ──────────────────────────────────────────

/**
 * Wrap rendered DSD output in a full HTML document.
 * Replaces wrapInDocument from ssr-handler.ts for DSD-first pages.
 */
export function wrapDsdDocument(
  bodyHtml: string,
  options: {
    title?: string;
    lang?: string;
    headExtras?: string;
  } = {},
): string {
  const { title = 'LessJS', lang = 'en', headExtras = '' } = options;
  return `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${headExtras}
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

// ─── Convenience Re-exports ─────────────────────────────────────
export { wrapInDocument } from './ssr-handler.js';
