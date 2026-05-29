/**
 * @lessjs/core - Render Serialization.
 *
 * Attribute serialization and DSD template wrapping for the render pipeline.
 * Extracted from render-dsd.ts for maintainability.
 *
 * @module @lessjs/core/render-serialize
 */

import { escapeAttrValue } from './html-escape.js';
import type { DsdOptions } from './types.js';

// ─── camelCase -> kebab-case ────────────────────────────────────

/**
 * Convert camelCase to kebab-case for HTML attribute names.
 * e.g. currentPath -> current-path, navItems -> nav-items
 *
 * HTML attributes are case-insensitive - browsers lowercase them.
 * Lit's @property({attribute: 'current-path'}) expects kebab-case.
 * Without this conversion, currentPath would render as "currentpath"
 * (lowercased by the browser) and never match "current-path".
 */
export function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

// ─── Attribute Serialization ────────────────────────────────────

/** Serialize key-value strings to HTML attribute string */
export function serializeAttributes(props: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(props)) {
    if (val === false || val === null || val === undefined) continue;
    const attrKey = camelToKebab(key);
    if (val === true) {
      parts.push(attrKey);
    } else if (typeof val === 'object') {
      // Array or Object: JSON-encode and escape for safe HTML attribute embedding.
      // Client-side Lit deserializes via property setter (not attribute), so the
      // JSON string only needs to survive HTML parsing, not be human-readable.
      parts.push(`${attrKey}="${escapeAttrValue(JSON.stringify(val))}"`);
    } else {
      parts.push(`${attrKey}="${escapeAttrValue(val)}"`);
    }
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

// ─── DSD Template Attributes ────────────────────────────────────

/**
 * Build DSD template attributes per WHATWG HTML Living Standard.
 * Only includes non-default attributes to keep output clean.
 */
export function buildDsdTemplateAttrs(options?: DsdOptions): string {
  if (!options) return '';
  const parts: string[] = [];
  if (options.delegatesFocus) parts.push(' shadowrootdelegatesfocus');
  if (options.clonable) parts.push(' shadowrootclonable');
  if (options.serializable) parts.push(' shadowrootserializable');
  if (options.slotAssignment === 'manual') {
    parts.push(' shadowrootslotassignment="manual"');
  }
  if (options.customElementRegistry) {
    parts.push(' shadowrootcustomelementregistry');
  }
  return parts.join('');
}

// ─── DSD Output Wrapping ────────────────────────────────────────

/**
 * Wrap rendered content into a complete DSD HTML element.
 *
 * Handles three-layer model:
 * - pure-island: no DSD template, client creates shadow root
 * - dsd-static: DSD template with static content
 * - dsd-interactive: DSD template with hydration hints
 */
export function wrapDsdOutput(params: {
  tagName: string;
  props: Record<string, unknown>;
  content: string;
  styleCss: string;
  layer: string;
  sourceStr: string;
  dsdOptions?: DsdOptions;
}): string {
  const { tagName, props, content, styleCss, layer, sourceStr, dsdOptions } = params;
  const attrs = serializeAttributes(props);
  // NOTE: Object-type props are intentionally serialized TWICE:
  //   1. In HTML attributes via serializeAttributes() - used by SSR rendering
  //   2. In data-ssr-props - used by client-side bindEvents() for hydration
  const ssrPropsAttr = Object.keys(props).length > 0
    ? ` data-ssr-props="${escapeAttrValue(JSON.stringify(props))}"`
    : '';

  if (layer === 'pure-island') {
    return `<${tagName}${attrs}${ssrPropsAttr}${sourceStr}></${tagName}>`;
  }

  // Layer 1 (dsd-static) and Layer 2 (dsd-interactive): emit DSD template
  const styleTag = styleCss ? `\n    <style>${styleCss}</style>` : '';
  const dsdAttrs = buildDsdTemplateAttrs(dsdOptions);

  return `<${tagName}${attrs}${ssrPropsAttr}${sourceStr}>
  <template shadowrootmode="open"${dsdAttrs}>${styleTag}
    ${content}
  </template>
</${tagName}>`;
}
