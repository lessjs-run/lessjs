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
import { type DsdOptions } from './types.js';

type P5Element = DefaultTreeAdapterMap['element'];
type P5Document = DefaultTreeAdapterMap['document'];
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
      props[kebabToCamel(key)] = value;
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
  if (typeof proto.customElementRegistry === 'string') {
    opts.customElementRegistry = proto.customElementRegistry;
  }

  return opts;
}

/**
 * Check if a node is inside a DSD template (shadow DOM content).
 * We must NOT process custom elements inside shadow DOM — they are
 * already rendered output, not light DOM that needs DSD wrapping.
 */
function isInsideDsdTemplate(node: P5Element): boolean {
  let parent: P5Element['parentNode'] = node.parentNode;
  while (parent) {
    if ('nodeName' in parent && (parent as P5Element).nodeName === 'template') {
      const tpl = parent as P5Element;
      if (
        tpl.attrs.some((a: { name: string; value: string }) =>
          a.name === 'shadowrootmode' && a.value === 'open'
        )
      ) {
        return true;
      }
    }
    parent = (parent as P5Element).parentNode;
  }
  return false;
}

/**
 * Recursively render nested Custom Elements with DSD using parse5 AST.
 *
 * v0.8: Replaced regex-based O(n²) approach with parse5 AST traversal.
 *
 * Strategy:
 *   - Parse HTML → AST with parse5.parse()
 *   - Collect all custom element nodes in a bottom-up order
 *   - For each un-rendered CE: render DSD, insert template, preserve light DOM
 *   - Serialize AST → HTML with parse5.serialize()
 *
 * Complexity: O(n·d) where n = total nodes, d = max nesting depth
 * (vs O(n²) for the regex approach which re-scanned after each replacement)
 *
 * Only processes tags with hyphens (valid Custom Element names)
 * that are registered in the global customElements registry.
 */
export async function renderNestedCustomElements(html: string): Promise<string> {
  if (!globalThis.customElements?.get) return html;

  // Import renderDSD dynamically to avoid circular dependency
  const { renderDSD } = await import('./render-dsd.js');

  // Parse HTML into AST
  const ast = parse5.parse(html);

  // Collect custom element nodes in bottom-up (deepest-first) order
  const ceNodes: P5Element[] = [];

  function collectCustomElements(node: P5ChildNode): void {
    if (!('tagName' in node)) return;
    const element = node as P5Element;

    // Recurse into children first (bottom-up: children before parent)
    if (element.childNodes) {
      for (const child of element.childNodes) {
        collectCustomElements(child);
      }
    }

    // Check if this is a custom element
    const tagName = element.tagName;
    if (!tagName || !isCustomElementName(tagName)) return;

    // Skip if inside a DSD template (shadow DOM content)
    if (isInsideDsdTemplate(element)) return;

    // Check if registered
    if (!globalThis.customElements!.get(tagName)) return;

    // Skip if already has DSD
    if (elementAlreadyHasDSD(element)) return;

    ceNodes.push(element);
  }

  for (const child of (ast as P5Document).childNodes ?? []) {
    collectCustomElements(child);
  }

  // Process each custom element (already in bottom-up order)
  for (const ceNode of ceNodes) {
    const tagName = ceNode.tagName;
    const Cls = globalThis.customElements!.get(tagName) as CustomElementConstructor;
    if (!Cls) continue;

    const props = parseAttrsToProps(ceNode.attrs);
    const dsdOpts = inferDsdOptions(tagName, Cls);

    // Render DSD HTML for this component
    const dsdHtml = await renderDSD(tagName, Cls, props, undefined, dsdOpts);

    // Parse the DSD HTML into a fragment
    const dsdFragment = parse5.parseFragment(dsdHtml);

    // Collect light DOM children (slot content) — everything currently inside the CE
    const lightDomChildren = [...ceNode.childNodes];

    // Clear the CE node and repopulate with DSD content + light DOM
    ceNode.childNodes = [];

    // Insert DSD fragment children into the CE node
    if (dsdFragment.childNodes) {
      for (const child of dsdFragment.childNodes) {
        // Set parentNode to the CE node
        (child as P5Element).parentNode = ceNode;
        ceNode.childNodes.push(child);
      }
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

  // Serialize AST back to HTML
  return parse5.serialize(ast);
}
