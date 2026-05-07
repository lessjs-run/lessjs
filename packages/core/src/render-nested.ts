/**
 * @lessjs/core - Nested Custom Element recursive rendering
 *
 * Handles recursive DSD rendering of nested Custom Elements within
 * HTML content. Includes helper functions for tag matching, attribute
 * parsing, and shadow DOM range detection.
 *
 * @module @lessjs/core/render-nested
 */

import { type DsdOptions } from './types.js';

/**
 * Convert kebab-case attribute name to camelCase property name.
 * e.g. current-path → currentPath, aria-label → ariaLabel
 */
function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Parse an HTML element's attributes string into a props object.
 *
 * v0.6: Handles quoted values with escaped chars and JSON-encoded
 * attribute values (arrays, objects). Boolean attributes are set to true.
 * Also preserves data-* attributes as-is (no camelCase conversion).
 */
function parseElementAttrs(attrsStr: string): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  // Match key="value", key='value', or bare key (boolean)
  const attrRegex = /(\w[\w-]*)(?:="((?:[^"\\]|\\.)*)"|='((?:[^'\\]|\\.)*)')?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(attrsStr)) !== null) {
    const key = match[1];
    const value = match[2] ?? match[3];
    if (value === undefined) {
      // Boolean attribute (no value): e.g. home, disabled
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
 * Find the matching close tag for an opening tag using balanced counting.
 *
 * Handles nested same-name elements correctly:
 *   <x-foo>...<x-foo>...</x-foo>...</x-foo>
 *                 ^-- not this one     ^-- this one
 *
 * @returns Index of the close tag start, or -1 if not found
 */
function findMatchingCloseTag(
  html: string,
  tagName: string,
  searchFrom: number,
): number {
  let depth = 1;
  const openRegex = new RegExp(`<${tagName}[\\s/>]`, 'g');
  const closeRegex = new RegExp(`</${tagName}>`, 'g');

  // Start searching from the position after the opening tag
  openRegex.lastIndex = searchFrom;
  closeRegex.lastIndex = searchFrom;

  // Walk through both open and close tags in document order
  let nextOpen: RegExpExecArray | null;
  let nextClose: RegExpExecArray | null;

  // Get first candidates
  nextOpen = openRegex.exec(html);
  nextClose = closeRegex.exec(html);

  while (depth > 0) {
    // No more close tags → unmatched
    if (nextClose === null) return -1;

    // If the next tag is a close tag (or there's no more open tags before it)
    if (nextOpen === null || nextOpen.index >= nextClose.index) {
      depth--;
      if (depth === 0) return nextClose.index;
      nextClose = closeRegex.exec(html);
    } else {
      // Another open tag of the same type → increase depth
      depth++;
      nextOpen = openRegex.exec(html);
    }
  }

  return -1;
}

/**
 * Identify ranges in the HTML that are inside <template shadowrootmode="open">
 * and should be excluded from custom element processing.
 *
 * Shadow DOM content is rendering output, not light DOM that needs DSD wrapping.
 * Processing it would cause CSS/HTML leakage and double-rendering bugs.
 *
 * @returns Array of [start, end] ranges to skip
 */
function findTemplateShadowRanges(html: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  // v0.6 fix: must match additional DSD attributes (shadowrootdelegatesfocus, etc.)
  // not just <template shadowrootmode="open"> but also
  // <template shadowrootmode="open" shadowrootdelegatesfocus>
  const templateOpenRegex = /<template\s+shadowrootmode\s*=\s*"open"[^>]*>/g;
  let match: RegExpExecArray | null;

  while ((match = templateOpenRegex.exec(html)) !== null) {
    const contentStart = match.index + match[0].length;
    // Find the matching </template> using balanced counting
    let depth = 1;
    let searchPos = contentStart;
    while (depth > 0 && searchPos < html.length) {
      const nextClose = html.indexOf('</template>', searchPos);
      const nextOpen = html.indexOf('<template', searchPos);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        // Nested <template> — skip past it
        depth++;
        searchPos = nextOpen + 9; // past "<template"
      } else {
        depth--;
        if (depth === 0) {
          ranges.push([match.index, nextClose + '</template>'.length]);
        }
        searchPos = nextClose + '</template>'.length;
      }
    }
  }

  return ranges;
}

/**
 * Check if a position is inside any of the skip ranges.
 */
function isInRange(pos: number, ranges: Array<[number, number]>): boolean {
  for (const [start, end] of ranges) {
    if (pos >= start && pos < end) return true;
  }
  return false;
}

/**
 * Check if an element already has its own DSD template child (already rendered).
 *
 * This prevents double-rendering: if a CE tag's FIRST child is
 * <template shadowrootmode="open">, it was rendered in a previous pass.
 *
 * IMPORTANT: We check only the FIRST child, not the entire content.
 * Light DOM children (slot content) may contain other CE DSDs, which
 * must NOT cause a false positive.
 */
function alreadyHasDSD(html: string, openEnd: number, _closeIdx: number): boolean {
  // Check if the first non-whitespace content after the open tag
  // is <template shadowrootmode="open" ...> (may include shadowrootdelegatesfocus etc.)
  // v0.6 fix: must accept additional DSD attributes after shadowrootmode="open"
  // otherwise components with delegatesFocus=true cause an infinite loop
  const content = html.slice(openEnd);
  const match = content.match(/^\s*<template\s+shadowrootmode\s*=\s*"open"[^>]*>/);
  return match !== null;
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
 * Recursively render nested Custom Elements with DSD.
 *
 * v0.6 (rev 3): Fixed critical rendering bugs:
 *
 *   ROOT CAUSE: The old two-pass approach (collect positions, then apply
 *   replacements) broke when parent/child replacements overlapped. When
 *   less-layout's replacement range included code-block positions, applying
 *   code-block replacements first shifted string indices, causing less-layout's
 *   replacement to corrupt the output (CSS truncated, code-block DSD leaking
 *   into style tags).
 *
 *   FIX: Process one element at a time from innermost out. After each
 *   replacement, re-scan the updated string for the next element. This is
 *   O(n²) in the worst case but n is small (typically <10 nested CEs per page)
 *   and correctness is more important than asymptotic speed.
 *
 *   Additional protections:
 *   - Skips content inside <template shadowrootmode="open"> (shadow DOM)
 *     to prevent double-rendering and CSS leakage
 *   - Uses balanced counting for close tag matching (handles nested same-name
 *     elements correctly)
 *   - Detects already-rendered elements to avoid double DSD wrapping
 *   - Preserves light DOM children for slot projection
 *   - Self-closing CE tags handled correctly
 *
 * Only processes tags with hyphens (valid Custom Element names)
 * that are registered in the global customElements registry.
 */
export async function renderNestedCustomElements(html: string): Promise<string> {
  if (!globalThis.customElements?.get) return html;

  // Import renderDSD dynamically to avoid circular dependency
  const { renderDSD } = await import('./render-dsd.js');

  // Iterative approach: find the deepest nested CE, render it, repeat.
  // This avoids the overlapping-replacement bug of the old two-pass approach.
  let result = html;
  let maxIterations = 50; // Safety limit

  while (maxIterations-- > 0) {
    // Identify shadow DOM ranges that must not be processed
    const shadowRanges = findTemplateShadowRanges(result);

    // Find the deepest (rightmost) unprocessed custom element
    const ceOpenRegex = /<([a-z][a-z0-9]*-[a-z0-9-]+)([\s\S]*?)>/g;
    let deepestPos: {
      tagName: string;
      attrsStr: string;
      start: number;
      openEnd: number;
      selfClosing: boolean;
    } | null = null;

    let match: RegExpExecArray | null;
    while ((match = ceOpenRegex.exec(result)) !== null) {
      const tagName = match[1];
      const attrsStr = match[2];
      const openStart = match.index;
      const openEnd = openStart + match[0].length;

      // Only process registered Custom Elements
      if (!globalThis.customElements!.get(tagName)) continue;

      // Skip if inside a shadow DOM range
      if (isInRange(openStart, shadowRanges)) continue;

      const selfClosing = attrsStr.trimEnd().endsWith('/');

      if (selfClosing) {
        // Track self-closing elements (they're leaf nodes)
        if (!deepestPos || openStart > deepestPos.start) {
          deepestPos = {
            tagName,
            attrsStr: attrsStr.replace(/\/\s*$/, ''),
            start: openStart,
            openEnd,
            selfClosing: true,
          };
        }
        continue;
      }

      // Find matching close tag using balanced counting
      const closeIdx = findMatchingCloseTag(result, tagName, openEnd);
      if (closeIdx === -1) continue;

      // Skip if already has DSD (previously rendered)
      if (alreadyHasDSD(result, openEnd, closeIdx)) continue;

      // Skip if close tag is inside a shadow range
      if (isInRange(closeIdx, shadowRanges)) continue;

      // This is a candidate — keep the deepest one
      if (!deepestPos || openStart > deepestPos.start) {
        deepestPos = { tagName, attrsStr, start: openStart, openEnd, selfClosing: false };
      }
    }

    if (!deepestPos) break; // No more CEs to process

    // Render this single CE
    const pos = deepestPos;
    const Cls = globalThis.customElements!.get(pos.tagName) as CustomElementConstructor;
    const props = parseElementAttrs(pos.attrsStr);
    const dsdOpts = inferDsdOptions(pos.tagName, Cls);

    if (pos.selfClosing) {
      const dsdHtml = await renderDSD(pos.tagName, Cls, props, undefined, dsdOpts);
      result = result.slice(0, pos.start) + dsdHtml + result.slice(pos.openEnd);
    } else {
      const closeTag = `</${pos.tagName}>`;
      const closeIdx = findMatchingCloseTag(result, pos.tagName, pos.openEnd);
      if (closeIdx === -1) break;
      const closeEnd = closeIdx + closeTag.length;

      // Get light DOM children (between open and close tags)
      const lightDom = result.slice(pos.openEnd, closeIdx);

      // Render the component's DSD
      const dsdHtml = await renderDSD(pos.tagName, Cls, props, undefined, dsdOpts);

      // Slot projection: inject light DOM children after </template>
      const templateClose = '</template>';
      const templateIdx = dsdHtml.lastIndexOf(templateClose);
      if (templateIdx === -1) break;

      const lightDomTrimmed = lightDom.trim();
      let finalHtml: string;
      if (!lightDomTrimmed) {
        finalHtml = dsdHtml;
      } else {
        const before = dsdHtml.slice(0, templateIdx + templateClose.length);
        const after = dsdHtml.slice(templateIdx + templateClose.length);
        finalHtml = before + '\n  ' + lightDom + after;
      }

      result = result.slice(0, pos.start) + finalHtml + result.slice(closeEnd);
    }
  }

  return result;
}
