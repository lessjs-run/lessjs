/**
 * @lessjs/core - Nested Custom Element recursive rendering
 *
 * Uses parse5 AST for O(n·d) recursive DSD rendering of nested Custom Elements.
 * Replaces the previous regex-based O(n²) approach.
 *
 * Strategy:
 *   1. Parse HTML into a parse5 AST
 *   2. Recursively traverse nodes bottom-up
 *   3. For custom element nodes (tagName contains hyphen), render DSD
 *   4. Insert DSD template as first child, preserving light DOM for slots
 *   5. Serialize AST back to HTML
 *
 * @module @lessjs/core/render-nested
 */

import * as parse5 from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';
import {
  type DsdOptions,
  type DsdRenderCollector,
  type HydrationHint,
  type RenderError,
  type RenderHooks,
  type RenderOutput,
} from './types.js';
import { renderDSD } from './render-dsd.js';
import { createLogger } from './logger.js';

const log = createLogger('core');

type P5Element = DefaultTreeAdapterMap['element'];
type P5ChildNode = DefaultTreeAdapterMap['childNode'];
type P5TextNode = DefaultTreeAdapterMap['textNode'];

/**
 * Convert kebab-case attribute name to camelCase property name.
 * e.g. current-path → currentPath, aria-label → ariaLabel
 */
function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Parse parse5 element attributes into a props object.
 *
 * Boolean attributes are set to true.
 * data-* attributes are preserved as-is (no camelCase conversion).
 */
function parseAttrsToProps(attrs: Array<{ name: string; value: string }>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const attr of attrs) {
    const key = attr.name;
    const value = attr.value;
    if (value === '') {
      // Boolean attribute (no value): e.g. disabled, home
      props[key] = true;
    } else if (key.startsWith('data-')) {
      // data-* attributes: preserve as-is (don't camelCase)
      props[key] = value;
    } else {
      const camelKey = kebabToCamel(key);
      // Try to parse as JSON for array/object values from SSR property bindings.
      // The Lit SSR adapter converts .navItems="${arr}" → nav-items="[{...}]"
      // so we need to parse the JSON back to a JS value for renderDSD().
      // v0.14.5: Quick structural checks to avoid unnecessary JSON.parse exceptions
      if (value.startsWith('[') || value.startsWith('{')) {
        // Fast check: JSON must end with matching bracket
        const lastChar = value[value.length - 1];
        if (
          (value.startsWith('{') && lastChar === '}') ||
          (value.startsWith('[') && lastChar === ']')
        ) {
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'object' && parsed !== null) {
              props[camelKey] = parsed;
              continue;
            }
          } catch {
            // Not valid JSON — treat as string
          }
        }
      }
      props[camelKey] = value;
    }
  }
  return props;
}

/**
 * Check if an element already has a DSD template child (already rendered).
 *
 * This prevents double-rendering: if a CE's FIRST element child is
 * <template shadowrootmode="open">, it was rendered in a previous pass.
 *
 * IMPORTANT: We check only the FIRST element child, not all children.
 * Light DOM children (slot content) may contain other CE DSDs, which
 * must NOT cause a false positive.
 */
function elementAlreadyHasDSD(node: P5Element): boolean {
  for (const child of node.childNodes) {
    if (child.nodeName === 'template') {
      const template = child as P5Element;
      const shadowAttr = template.attrs.find(
        (a: { name: string; value: string }) => a.name === 'shadowrootmode' && a.value === 'open',
      );
      if (shadowAttr) return true;
    }
    // Skip text nodes (whitespace) — only check the first element child
    if (child.nodeName !== '#text') break;
  }
  return false;
}

/**
 * Check if a tagName is a valid Custom Element name (contains a hyphen).
 */
function isCustomElementName(tagName: string): boolean {
  return /^[a-z][a-z0-9]*-[a-z0-9-]+$/i.test(tagName);
}

function isClientOnlyTag(tagName: string): boolean {
  const globalWithTags = globalThis as typeof globalThis & {
    __LESS_CLIENT_ONLY_TAGS__?: Set<string>;
  };
  return globalWithTags.__LESS_CLIENT_ONLY_TAGS__?.has(tagName) === true;
}

/**
 * Infer DSD options from the component class.
 * Checks for static properties that declare DSD behavior:
 *   - static delegatesFocus = true → shadowrootdelegatesfocus
 *   - static serializable = true → shadowrootserializable
 *   - static slotAssignment = 'manual' → shadowrootslotassignment="manual"
 *   - static customElementRegistry → shadowrootcustomelementregistry
 */
function inferDsdOptions(_tagName: string, cls: CustomElementConstructor): DsdOptions {
  const opts: DsdOptions = {};
  const proto = cls as unknown as Record<string, unknown>;

  if (proto.delegatesFocus === true) opts.delegatesFocus = true;
  if (proto.serializable === true) opts.serializable = true;
  if (proto.slotAssignment === 'manual') opts.slotAssignment = 'manual';
  if (proto.customElementRegistry === true) opts.customElementRegistry = true;

  return opts;
}

/**
 * Check if a node is inside a DSD template (shadow DOM content).
 *
 * v0.17.4: REMOVED — we now allow nested DSD rendering inside shadow DOM.
 * Previously, all CEs inside a DSD template were skipped because they were
 * assumed to be "already rendered output". But nested DSD is valid and
 * necessary — a parent's shadow DOM can contain child CEs that need their
 * own DSD templates (e.g. <less-layout> inside <docs-home>'s shadow DOM).
 *
 * The correct guard is elementAlreadyHasDSD(), which skips CEs that already
 * have their own <template shadowrootmode="open"> child — meaning they were
 * already rendered by their parent's render() method.
 */
// isInsideDsdTemplate removed — see ADR 0015

/**
 * Recursively render nested Custom Elements with DSD using parse5 AST.
 *
 * v0.15.2: Returns `Promise<RenderOutput>` instead of `Promise<string>`.
 * Propagates child render errors and hydration hints up to the parent.
 *
 * v0.8: Replaced regex-based O(n²) approach with parse5 AST traversal.
 * v0.8.1: Fixed two critical bugs:
 *   - Use parseFragment() instead of parse() to avoid <html><head><body> wrapping
 *   - Only insert DSD template children (not full CE wrapper) into existing CE nodes
 * v0.12.0: Added maxDepth parameter to prevent stack overflow on deeply nested components.
 *
 * Strategy:
 *   - Parse HTML → AST with parse5.parseFragment() (NOT parse() — avoids doc wrapping)
 *   - Collect custom element nodes in bottom-up order with depth tracking
 *   - For each un-rendered CE: render DSD, extract template + attrs, merge into CE
 *   - Serialize AST → HTML with parse5.serialize()
 *
 * Complexity: O(n·d) where n = total nodes, d = max nesting depth
 * (vs O(n²) for the regex approach which re-scanned after each replacement)
 *
 * Only processes tags with hyphens (valid Custom Element names)
 * that are registered in the global customElements registry.
 *
 * @param html - HTML string to process
 * @param collector - Optional collector for DSD render metrics
 * @param maxDepth - Maximum CE nesting depth. Nodes beyond this are skipped (default 10)
 * @param hooks - Optional render pipeline hooks
 * @returns Structured render output with html, errors, and hydration hints
 */
export async function renderNestedCustomElements(
  html: string,
  collector?: DsdRenderCollector,
  maxDepth = 10,
  hooks?: RenderHooks,
): Promise<RenderOutput> {
  if (!globalThis.customElements?.get) {
    return {
      html,
      errors: [],
      metrics: {
        tagName: '__nested__',
        renderTimeMs: 0,
        templateSize: html.length,
        layer: 'dsd-static',
        hasError: false,
        nestingDepth: 0,
      },
      hydrationHints: [],
    };
  }

  // Use parseFragment() — NOT parse(). parse5.parse() wraps fragments in
  // <html><head><body>, which would appear inside shadow DOM when this
  // function processes render() output (which is a fragment, not a document).
  const ast = parse5.parseFragment(html);

  // Collect custom element nodes in bottom-up (deepest-first) order
  const ceNodes: Array<{ node: P5Element; depth: number }> = [];

  function collectCustomElements(node: P5ChildNode, depth = 0): void {
    if (!('tagName' in node)) return;
    const element = node as P5Element;

    // Recurse into children first (bottom-up: children before parent)
    if (element.childNodes) {
      for (const child of element.childNodes) {
        collectCustomElements(child, depth + 1);
      }
    }

    // Check if this is a custom element
    const tagName = element.tagName;
    if (!tagName || !isCustomElementName(tagName)) return;

    // v0.17.4: client-only tags are admitted for browser upgrade only.
    // They must not be instantiated by nested DSD rendering.
    if (isClientOnlyTag(tagName)) return;

    // v0.17.4: isInsideDsdTemplate removed — nested DSD is valid.
    // elementAlreadyHasDSD() below prevents double-rendering.

    // Check if registered
    if (!globalThis.customElements!.get(tagName)) return;

    // Skip if already has DSD
    if (elementAlreadyHasDSD(element)) return;

    // Skip if exceeds max depth (prevents stack overflow on pathological nesting)
    if (depth > maxDepth) return;

    ceNodes.push({ node: element, depth });
  }

  // Fragment childNodes are the top-level nodes directly
  for (const child of ast.childNodes ?? []) {
    collectCustomElements(child);
  }

  // Process each custom element (already in bottom-up order)
  const allNestedErrors: RenderError[] = [];
  const allNestedHints: HydrationHint[] = [];

  for (const { node: ceNode, depth } of ceNodes) {
    const tagName = ceNode.tagName;
    const Cls = globalThis.customElements!.get(tagName) as CustomElementConstructor;
    if (!Cls) continue;

    const props = parseAttrsToProps(ceNode.attrs);
    const dsdOpts = inferDsdOptions(tagName, Cls);

    // Render DSD for this component — now returns RenderOutput
    const dsdResult = await renderDSD(
      tagName,
      Cls,
      props,
      undefined,
      dsdOpts,
      collector,
      depth,
      hooks,
    );
    const dsdHtml = dsdResult.html;

    // Propagate nested errors and hydration hints
    if (dsdResult.errors.length > 0) {
      allNestedErrors.push(...dsdResult.errors);
    }
    if (dsdResult.hydrationHints.length > 0) {
      allNestedHints.push(...dsdResult.hydrationHints);
    }

    // Parse the DSD HTML into a fragment
    const dsdFragment = parse5.parseFragment(dsdHtml);

    // The DSD fragment contains a top-level CE element (e.g. <less-layout>).
    // We must NOT insert this entire element — that would create double nesting
    // (<existing-ce><new-ce-from-dsd>...</new-ce></existing-ce>).
    // Instead, extract the inner children (the <template> and any light DOM)
    // and merge new attributes (like data-ssr-props) onto the existing CE node.
    const dsdCeElement = dsdFragment.childNodes?.find(
      (child): child is P5Element =>
        'tagName' in (child as P5Element) && (child as P5Element).tagName === tagName,
    );

    // Merge attributes from DSD CE onto the existing CE node
    // (e.g. data-ssr-props, source, route attrs added by renderDSD)
    if (dsdCeElement) {
      for (const attr of dsdCeElement.attrs) {
        // Only add attrs that don't already exist on the CE node
        const alreadyExists = ceNode.attrs.some((a: { name: string; value: string }) =>
          a.name === attr.name
        );
        if (!alreadyExists) {
          ceNode.attrs.push(attr);
        }
      }
    }

    // Collect light DOM children (slot content) — everything currently inside the CE
    const lightDomChildren = [...ceNode.childNodes];

    // Clear the CE node and repopulate with DSD content + light DOM
    ceNode.childNodes = [];

    // v0.14.5: Graceful degradation when renderDSD returns unexpected content
    if (!dsdCeElement) {
      log.warn(
        `renderDSD() for <${tagName}> returned unexpected content — ` +
          'DSD element not found in rendered output. Falling back to raw fragment.',
      );
    }

    // Insert only the CHILDREN of the DSD CE element (not the CE wrapper itself)
    // This is the <template shadowrootmode="open"> and any other shadow DOM content
    const dsdChildren = dsdCeElement?.childNodes ?? dsdFragment.childNodes ?? [];
    for (const child of dsdChildren) {
      (child as P5Element).parentNode = ceNode;
      ceNode.childNodes.push(child);
    }

    // Append light DOM children after the DSD template (for slot projection)
    // Only add non-empty text nodes and element nodes
    for (const child of lightDomChildren) {
      // Skip pure whitespace text nodes between the DSD template and light DOM
      if (
        child.nodeName === '#text' &&
        (child as P5TextNode).value.trim() === ''
      ) {
        continue;
      }
      (child as P5Element).parentNode = ceNode;
      ceNode.childNodes.push(child);
    }
  }

  // Serialize fragment back to HTML (no <html><head><body> wrapper)
  const resultHtml = parse5.serialize(ast);
  return {
    html: resultHtml,
    errors: allNestedErrors,
    metrics: {
      tagName: '__nested__',
      renderTimeMs: 0,
      templateSize: resultHtml.length,
      layer: 'dsd-static',
      hasError: allNestedErrors.length > 0,
      nestingDepth: 0,
    },
    hydrationHints: allNestedHints,
  };
}
