/**
 * @openelement/app - JSX-first application authoring API.
 *
 * This file is intentionally free of Vite/build imports. Route modules can
 * import from @openelement/app without pulling adapter-vite into the runtime
 * graph.
 */

import { DsdElement, type HydrationStrategy, type VNode } from '@openelement/core';
import { defineIsland as defineRuntimeIsland } from '@openelement/core';

export type PageRenderingMode = 'auto' | 'static' | 'dynamic';
export type PageStreamingMode = 'auto' | 'force' | false;
export type PageRevalidate = false | number | `${number}s` | `${number}m` | `${number}h`;

export interface PageHead {
  meta?: Array<Record<string, string | number | boolean>>;
}

export interface PageLoadContext<
  Params extends Record<string, string> = Record<string, string>,
> {
  params: Params;
  request?: Request;
  env?: Record<string, unknown>;
  platform?: unknown;
  route: {
    path?: string;
    filePath?: string;
  };
}

export interface PageRenderContext<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> {
  data: Data;
  params: Params;
  request?: Request;
  props: Record<string, unknown>;
}

export type PageRenderFunction<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> = (context: PageRenderContext<Data, Params>) => VNode | null;

export type PageLoadFunction<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> = (context: PageLoadContext<Params>) => Data | Promise<Data>;

export interface PageDefinition<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> {
  title?: string;
  description?: string;
  head?: PageHead;
  layout?: string | false;
  styles?: typeof DsdElement.styles;
  rendering?: PageRenderingMode;
  streaming?: PageStreamingMode;
  revalidate?: PageRevalidate;
  load?: PageLoadFunction<Data, Params>;
  render: PageRenderFunction<Data, Params>;
}

export interface OpenElementPageDescriptor<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
> extends Omit<PageDefinition<Data, Params>, 'render'> {
  kind: 'page';
  render: PageRenderFunction<Data, Params>;
}

type PageHostProps = {
  params?: Record<string, string>;
  __openElementParams?: Record<string, string>;
  __openElementData?: unknown;
  __openElementRequest?: Request;
};

type PageConstructor = typeof DsdElement & {
  openElementPage: OpenElementPageDescriptor;
};

function normalizePageDefinition<
  Data,
  Params extends Record<string, string>,
>(
  input: PageRenderFunction<Data, Params> | PageDefinition<Data, Params>,
): PageDefinition<Data, Params> {
  return typeof input === 'function' ? { render: input } : input;
}

function collectPublicProps(host: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const key of Object.keys(host)) {
    if (key.startsWith('__openElement')) continue;
    props[key] = host[key];
  }
  return props;
}

/**
 * Define a file-route page.
 *
 * The returned class is a DsdElement-compatible custom element constructor, so
 * the existing renderer pipeline remains unchanged while app authors write JSX
 * functions instead of class components.
 */
export function definePage<
  Data = unknown,
  Params extends Record<string, string> = Record<string, string>,
>(
  input: PageRenderFunction<Data, Params> | PageDefinition<Data, Params>,
): PageConstructor {
  const definition = normalizePageDefinition(input);
  const pageDescriptor = {
    kind: 'page',
    ...definition,
    rendering: definition.rendering ?? 'auto',
    streaming: definition.streaming ?? 'auto',
    revalidate: definition.revalidate ?? false,
  } as OpenElementPageDescriptor<Data, Params>;

  class OpenElementPage extends DsdElement {
    static override styles = definition.styles;
    static openElementPage = pageDescriptor;

    override render(): VNode | null {
      const host = this as unknown as Record<string, unknown> & PageHostProps;
      const params = (host.__openElementParams ?? host.params ?? {}) as Params;
      const data = host.__openElementData as Data;
      return definition.render({
        data,
        params,
        request: host.__openElementRequest,
        props: collectPublicProps(host),
      });
    }
  }

  return OpenElementPage as PageConstructor;
}

export interface ElementDefinition<
  Props extends Record<string, unknown> = Record<string, unknown>,
> {
  styles?: typeof DsdElement.styles;
  render: (props: Props) => VNode | null;
}

function normalizeElementDefinition<Props extends Record<string, unknown>>(
  input: ((props: Props) => VNode | null) | ElementDefinition<Props>,
): ElementDefinition<Props> {
  return typeof input === 'function' ? { render: input } : input;
}

function assertCustomElementTag(tagName: string): void {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(tagName)) {
    throw new Error(
      `[openElement] "${tagName}" is not a valid custom element name. ` +
        'Use lowercase ASCII letters, digits, and at least one hyphen.',
    );
  }
}

export function defineElement<Props extends Record<string, unknown> = Record<string, unknown>>(
  tagName: string,
  input: ((props: Props) => VNode | null) | ElementDefinition<Props>,
): typeof DsdElement {
  assertCustomElementTag(tagName);
  const definition = normalizeElementDefinition(input);

  class OpenElementComponent extends DsdElement {
    static override styles = definition.styles;

    override render(): VNode | null {
      return definition.render(
        collectPublicProps(this as unknown as Record<string, unknown>) as Props,
      );
    }
  }

  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, OpenElementComponent);
  }

  return OpenElementComponent;
}

export function defineLayout<Props extends Record<string, unknown> = Record<string, unknown>>(
  tagName: string,
  input: ((props: Props) => VNode | null) | ElementDefinition<Props>,
): typeof DsdElement {
  return defineElement(tagName, input);
}

export interface AppIslandOptions {
  hydrate?: HydrationStrategy;
  dsd?: boolean;
}

export function defineIsland<Props extends Record<string, unknown> = Record<string, unknown>>(
  tagName: string,
  input: ((props: Props) => VNode | null) | ElementDefinition<Props> | CustomElementConstructor,
  options: AppIslandOptions = {},
): CustomElementConstructor {
  assertCustomElementTag(tagName);
  const componentClass = typeof input === 'function' && input.prototype?.render
    ? input as CustomElementConstructor
    : defineElement(tagName, input as ((props: Props) => VNode | null) | ElementDefinition<Props>);
  return defineRuntimeIsland(tagName, componentClass, {
    strategy: options.hydrate,
    dsd: options.dsd,
  });
}
