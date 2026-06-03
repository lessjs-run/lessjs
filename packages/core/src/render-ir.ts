/**
 * Internal structured render IR.
 *
 * This module is intentionally internal in v0.29.0. Public entrypoints keep
 * returning HTML strings or RenderOutput, but the renderer now crosses explicit
 * node boundaries before serialization.
 */

import { escapeAttr, escapeHtml } from './html-escape.ts';
import {
  createEventMarkerContext,
  type EventMarkerContext,
  serializeEventMarkers,
} from './event-hydration.ts';
import { FOR_TAG, Fragment, SHOW_TAG } from './jsx-runtime.ts';
import { trustRenderHtml } from './security.ts';
import { isSignalLike, unwrapSignalLike } from './signal-like.ts';
import { isVNode, type VNode } from './vnode.ts';
import { renderDsd } from './render-dsd.js';

export type RenderNode =
  | { kind: 'text'; value: string }
  | { kind: 'trusted-html'; value: string }
  | { kind: 'fragment'; children: RenderNode[] }
  | {
    kind: 'element';
    tag: string;
    attrs: Record<string, unknown>;
    eventAttrs?: string;
    children: RenderNode[];
    voidElement?: boolean;
  }
  | {
    kind: 'dsd-host';
    tag: string;
    attrs: string;
    ssrPropsAttr: string;
    source: string;
    templateAttrs: string;
    styleCss: string;
    shadow: RenderNode[];
    light: RenderNode[];
    layer: string;
  };

export const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export function textNode(value: unknown): RenderNode {
  return { kind: 'text', value: String(value) };
}

export function trustedHtmlNode(value: unknown): RenderNode {
  return { kind: 'trusted-html', value: trustRenderHtml(String(value)) };
}

export function fragmentNode(children: RenderNode[]): RenderNode {
  return { kind: 'fragment', children };
}

export function dsdHostNode(params: Omit<Extract<RenderNode, { kind: 'dsd-host' }>, 'kind'>) {
  return { kind: 'dsd-host', ...params } satisfies RenderNode;
}

export function serializeRenderNode(node: RenderNode): string {
  switch (node.kind) {
    case 'text':
      return escapeHtml(node.value);
    case 'trusted-html':
      return node.value;
    case 'fragment':
      return node.children.map(serializeRenderNode).join('');
    case 'element': {
      const attrs = serializeElementAttrs(node.attrs);
      const events = node.eventAttrs ?? '';
      if (node.voidElement || VOID_ELEMENTS.has(node.tag)) {
        return `<${node.tag}${attrs}${events}>`;
      }
      return `<${node.tag}${attrs}${events}>${
        node.children.map(serializeRenderNode).join('')
      }</${node.tag}>`;
    }
    case 'dsd-host': {
      if (node.layer === 'pure-island') {
        return `<${node.tag}${node.attrs}${node.ssrPropsAttr}${node.source}>${
          node.light.map(serializeRenderNode).join('')
        }</${node.tag}>`;
      }

      const style = node.styleCss ? `\n    <style>${node.styleCss}</style>` : '';
      return `<${node.tag}${node.attrs}${node.ssrPropsAttr}${node.source}>
  <template shadowrootmode="open"${node.templateAttrs}>${style}
    ${node.shadow.map(serializeRenderNode).join('')}
  </template>
${node.light.map(serializeRenderNode).join('')}</${node.tag}>`;
    }
  }
}

export function serializeElementAttrs(props: Record<string, unknown>): string {
  let result = '';
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'ref' || key === 'key' || key === 'rawHtml') continue;
    if (key.startsWith('on') && typeof value === 'function') continue;
    if (typeof value === 'function') continue;
    if (value == null) continue;
    if (key === 'innerHTML' || key === 'textContent') continue;

    const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;
    const resolved = unwrapSignalLike(value);

    if (typeof resolved === 'boolean') {
      if (resolved) result += ` ${attrName}`;
      continue;
    }

    if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
      const styleObj: Record<string, unknown> = {};
      for (const [sk, sv] of Object.entries(resolved as Record<string, unknown>)) {
        styleObj[sk] = unwrapSignalLike(sv);
      }
      const css = styleObjectToString(styleObj);
      if (css) result += ` style="${escapeAttr(css)}"`;
      continue;
    }

    result += ` ${attrName}="${escapeAttr(String(resolved))}"`;
  }
  return result;
}

export function renderToString(
  node: unknown,
  eventContext: EventMarkerContext = createEventMarkerContext(),
): string {
  return serializeRenderNode(renderToStaticNode(node, eventContext));
}

export async function renderDsdTree(
  node: unknown,
  eventContext: EventMarkerContext = createEventMarkerContext(),
): Promise<string> {
  return serializeRenderNode(await renderToDsdNode(node, eventContext));
}

export function renderToStaticNode(
  node: unknown,
  eventContext: EventMarkerContext = createEventMarkerContext(),
): RenderNode {
  if (node == null || node === false || typeof node === 'boolean') return fragmentNode([]);
  if (typeof node === 'string' || typeof node === 'number') return textNode(node);
  if (isSignalLike(node)) {
    return renderToStaticNode((node as { value: unknown }).value, eventContext);
  }
  if (!isVNode(node)) return textNode(String(node));

  const special = renderSpecialVNodeSync(node, eventContext);
  if (special) return special;

  const { tag, props, children } = node;
  if (typeof tag === 'function') {
    try {
      return renderToStaticNode(callComponent(tag, props, children), eventContext);
    } catch (err) {
      console.error(
        `[LessJS/SSR] renderToString() failed for <${String(tag)}>:` +
          ` ${err instanceof Error ? err.message : String(err)}`,
      );
      return fragmentNode([]);
    }
  }

  const tagName = String(tag);
  return {
    kind: 'element',
    tag: tagName,
    attrs: props,
    eventAttrs: serializeEventMarkers(props, eventContext),
    children: renderChildrenFromProps(props, children, eventContext),
    voidElement: VOID_ELEMENTS.has(tagName),
  };
}

export async function renderToDsdNode(
  node: unknown,
  eventContext: EventMarkerContext = createEventMarkerContext(),
): Promise<RenderNode> {
  if (node == null || node === false || typeof node === 'boolean') return fragmentNode([]);
  if (typeof node === 'string' || typeof node === 'number') return textNode(node);
  if (isSignalLike(node)) {
    return await renderToDsdNode((node as { value: unknown }).value, eventContext);
  }
  if (!isVNode(node)) return textNode(String(node));

  const special = await renderSpecialVNodeAsync(node, eventContext);
  if (special) return special;

  const { tag, props, children } = node;
  if (typeof tag === 'function') {
    try {
      return await renderToDsdNode(callComponent(tag, props, children), eventContext);
    } catch (err) {
      console.error(
        `[LessJS/SSR] renderDsdTree() failed for <${String(tag)}>:` +
          ` ${err instanceof Error ? err.message : String(err)}`,
      );
      return fragmentNode([]);
    }
  }

  const tagName = String(tag);
  const childNodes = await renderChildrenFromPropsAsync(props, children, eventContext);

  if (
    typeof customElements !== 'undefined' &&
    customElements.get &&
    customElements.get(tagName)
  ) {
    try {
      const dsdResult = await renderDsd(tagName, {
        componentClass: customElements.get(tagName) as CustomElementConstructor,
        props,
      });
      return mergeDsdHostHtmlWithLightDom(dsdResult.html, tagName, childNodes);
    } catch (err) {
      console.error(
        `[LessJS/SSR] renderDsdTree() failed for registered CE <${tagName}>:` +
          ` ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return {
    kind: 'element',
    tag: tagName,
    attrs: props,
    eventAttrs: serializeEventMarkers(props, eventContext),
    children: childNodes,
    voidElement: VOID_ELEMENTS.has(tagName),
  };
}

function renderSpecialVNodeSync(
  node: VNode,
  eventContext: EventMarkerContext,
): RenderNode | null {
  const { tag, props, children } = node;
  if (tag === Fragment || (typeof tag === 'symbol' && String(tag) === 'Symbol(lessjs.fragment)')) {
    return fragmentNode(children.map((child) => renderToStaticNode(child, eventContext)));
  }

  if (tag === SHOW_TAG || tag === 'show') {
    const whenVal = isSignalLike(props?.when)
      ? (props!.when as { value: unknown }).value
      : props?.when;
    const target = whenVal ? children[0] : children[1];
    return target ? renderToStaticNode(target, eventContext) : fragmentNode([]);
  }

  if (tag === FOR_TAG || tag === 'fore') {
    const items = (isSignalLike(props?.each)
      ? (props!.each as { value: unknown }).value
      : props?.each) as unknown[];
    const renderFn = children[0] as unknown as ((item: unknown, idx: number) => unknown);
    if (!Array.isArray(items) || typeof renderFn !== 'function') {
      return fragmentNode([]);
    }
    return fragmentNode(
      items.map((item, index) =>
        renderToStaticNode(renderFn(item, index), eventContext)
      ),
    );
  }

  return null;
}

async function renderSpecialVNodeAsync(
  node: VNode,
  eventContext: EventMarkerContext,
): Promise<RenderNode | null> {
  const { tag, props, children } = node;
  if (tag === Fragment || (typeof tag === 'symbol' && String(tag) === 'Symbol(lessjs.fragment)')) {
    const parts: RenderNode[] = [];
    for (const child of children) parts.push(await renderToDsdNode(child, eventContext));
    return fragmentNode(parts);
  }

  if (tag === SHOW_TAG || tag === 'show') {
    const whenVal = isSignalLike(props?.when)
      ? (props!.when as { value: unknown }).value
      : props?.when;
    const target = whenVal ? children[0] : children[1];
    return target ? await renderToDsdNode(target, eventContext) : fragmentNode([]);
  }

  if (tag === FOR_TAG || tag === 'fore') {
    const items = (isSignalLike(props?.each)
      ? (props!.each as { value: unknown }).value
      : props?.each) as unknown[];
    const renderFn = children[0] as unknown as ((item: unknown, idx: number) => unknown);
    if (!Array.isArray(items) || typeof renderFn !== 'function') {
      return fragmentNode([]);
    }
    const parts: RenderNode[] = [];
    for (let index = 0; index < items.length; index++) {
      parts.push(await renderToDsdNode(renderFn(items[index], index), eventContext));
    }
    return fragmentNode(parts);
  }

  return null;
}

function renderChildrenFromProps(
  props: Record<string, unknown>,
  children: (VNode | string)[],
  eventContext: EventMarkerContext,
): RenderNode[] {
  if (props?.innerHTML !== undefined) {
    const value = unwrapSignalLike(props.innerHTML);
    return [props.rawHtml === true ? trustedHtmlNode(value) : textNode(value)];
  }
  if (props?.textContent !== undefined) return [textNode(unwrapSignalLike(props.textContent))];
  return children.map((child) => renderToStaticNode(child, eventContext));
}

async function renderChildrenFromPropsAsync(
  props: Record<string, unknown>,
  children: (VNode | string)[],
  eventContext: EventMarkerContext,
): Promise<RenderNode[]> {
  if (props?.innerHTML !== undefined) {
    const value = unwrapSignalLike(props.innerHTML);
    return [props.rawHtml === true ? trustedHtmlNode(value) : textNode(value)];
  }
  if (props?.textContent !== undefined) return [textNode(unwrapSignalLike(props.textContent))];
  const nodes: RenderNode[] = [];
  for (const child of children) nodes.push(await renderToDsdNode(child, eventContext));
  return nodes;
}

function callComponent(
  tag: VNode['tag'],
  props: Record<string, unknown>,
  children: (VNode | string)[],
): unknown {
  if (typeof tag !== 'function') return null;
  if (tag.prototype && typeof tag.prototype.render === 'function') {
    const instance = new (tag as new (...args: unknown[]) => { render(): unknown })();
    for (const [key, value] of Object.entries(props)) {
      (instance as Record<string, unknown>)[key] = value;
    }
    return instance.render();
  }
  return (tag as (props: Record<string, unknown>) => unknown)({ ...props, children });
}

function mergeDsdHostHtmlWithLightDom(
  hostHtml: string,
  tagName: string,
  lightDom: RenderNode[],
): RenderNode {
  const lightHtml = lightDom.map(serializeRenderNode).join('');
  if (!lightHtml) return trustedHtmlNode(hostHtml);

  const closingTag = `</${tagName}>`;
  const index = hostHtml.lastIndexOf(closingTag);
  const html = index === -1
    ? hostHtml + lightHtml
    : hostHtml.slice(0, index) + lightHtml + hostHtml.slice(index);
  return trustedHtmlNode(html);
}

function styleObjectToString(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .filter(([, value]) => value != null)
    .map(([key, value]) => {
      const prop = key.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
      return `${prop}: ${value}`;
    })
    .join('; ');
}
