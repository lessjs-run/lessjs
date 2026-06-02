/**
 * @lessjs/core - SSR Security Guards.
 *
 * Properties that MUST NOT be injected from untrusted SSR props.
 * These are Object.prototype internals and dangerous overrides that
 * could be exploited via arbitrary property assignment.
 *
 * Shared by island.ts (client-side bindEvents) and render-instantiate.ts
 * (SSR injectProps). Previously defined in island.ts and imported by
 * render-instantiate.ts, creating a false coupling — render-instantiate
 * is an SSR module that shouldn't depend on client-side island logic.
 *
 * @module @lessjs/core/security
 */

// @deno-types="npm:@types/sanitize-html@^2"
import sanitizeHtml, { type IOptions as SanitizeHtmlOptions } from 'npm:sanitize-html@^2.17.4';

/** Object prototype keys that must never be injected as SSR props. */
export const DANGEROUS_KEYS: ReadonlySet<string> = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toString',
  'toLocaleString',
  'valueOf',
]);

const SAFE_HTML_TAGS = [
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'button',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'dd',
  'del',
  'details',
  'dfn',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'u',
  'ul',
  'var',
  'wbr',
] as const;

export const RENDER_HTML_SANITIZE_OPTIONS: SanitizeHtmlOptions = {
  allowedTags: [...SAFE_HTML_TAGS],
  allowedAttributes: {
    '*': [
      'aria-*',
      'class',
      'data-*',
      'dir',
      'id',
      'lang',
      'role',
      'title',
    ],
    a: ['href', 'name', 'target', 'rel'],
    img: [
      'alt',
      'decoding',
      'height',
      'loading',
      'referrerpolicy',
      'src',
      'title',
      'width',
    ],
    td: ['align', 'colspan', 'rowspan'],
    th: ['align', 'colspan', 'rowspan', 'scope'],
    time: ['datetime'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
  },
  allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true,
};

/**
 * Sanitize caller-supplied HTML before it is injected into a DOM/string render path.
 *
 * `rawHtml` is still an explicit trust boundary. This policy keeps common
 * markdown/document HTML while stripping scripts, event handlers, dangerous URL
 * protocols, SVG/MathML namespaces, iframes, and browser-parsed edge cases that
 * regex-based sanitizers miss.
 */
export function sanitizeRenderHtml(html: string): string {
  return sanitizeHtml(html, RENDER_HTML_SANITIZE_OPTIONS);
}
