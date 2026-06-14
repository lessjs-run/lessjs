import { defineIsland as defineRuntimeIsland, getSsrProps } from '@openelement/core';
import type { IslandConfig } from '@openelement/protocol/islands';
import { type ComponentChild, render } from 'preact';

export type PreactIslandProps = Record<string, unknown>;

export type PreactIslandComponent<Props extends PreactIslandProps = PreactIslandProps> = (
  props: Props,
) => ComponentChild;

export interface PreactIslandOptions extends IslandConfig {
  props?: PreactIslandProps;
}

function assertCustomElementTag(tagName: string): void {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(tagName)) {
    throw new Error(
      `openElement: "${tagName}" is not a valid custom element name. ` +
        'Use lowercase ASCII letters, digits, and at least one hyphen.',
    );
  }
}

function collectAttributes(host: HTMLElement): PreactIslandProps {
  const props: PreactIslandProps = {};
  for (const attr of Array.from(host.attributes)) {
    if (attr.name === 'data-ssr-props') continue;
    props[attr.name] = attr.value;
  }
  return props;
}

function resolveProps(host: HTMLElement, baseProps: PreactIslandProps): PreactIslandProps {
  return {
    ...baseProps,
    ...collectAttributes(host),
    ...(getSsrProps(host) ?? {}),
  };
}

export function definePreactIsland<Props extends PreactIslandProps = PreactIslandProps>(
  tagName: string,
  Component: PreactIslandComponent<Props>,
  options: PreactIslandOptions = {},
): CustomElementConstructor {
  assertCustomElementTag(tagName);
  const baseProps = options.props ?? {};

  class OpenElementPreactIsland extends HTMLElement {
    #mounted = false;

    connectedCallback(): void {
      if (this.#mounted) return;
      this.#mounted = true;
      const root = options.dsd === false
        ? this.attachShadow({ mode: 'open' })
        : this.shadowRoot ?? this.attachShadow({ mode: 'open' });
      render(Component(resolveProps(this, baseProps) as Props), root);
    }

    disconnectedCallback(): void {
      if (!this.#mounted) return;
      const root = this.shadowRoot;
      if (root) render(null, root);
      this.#mounted = false;
    }
  }

  return defineRuntimeIsland(tagName, OpenElementPreactIsland, {
    strategy: options.hydrate,
    dsd: options.dsd,
    ssr: options.ssr,
  });
}
