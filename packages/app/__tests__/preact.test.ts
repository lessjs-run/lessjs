import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { getIslandMeta } from '@openelement/core';
import { definePreactIsland } from '../src/preact.ts';

class StubNode {
  nodeType = 1;
  childNodes: Node[] = [];

  appendChild(node: Node): Node {
    this.childNodes.push(node);
    return node;
  }

  insertBefore(node: Node): Node {
    this.childNodes.push(node);
    return node;
  }

  removeChild(node: Node): Node {
    this.childNodes = this.childNodes.filter((child) => child !== node);
    return node;
  }
}

function installDomStubs(): () => void {
  const previousCustomElements = globalThis.customElements;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousDocument = globalThis.document;

  const registry = new Map<string, CustomElementConstructor>();
  (globalThis as { customElements?: CustomElementRegistry }).customElements = {
    define(name: string, ctor: CustomElementConstructor) {
      registry.set(name, ctor);
    },
    get(name: string) {
      return registry.get(name);
    },
  } as CustomElementRegistry;

  class TestElement {
    static attrs: Array<{ name: string; value: string }> = [];
    shadowRoot: ShadowRoot | null = null;

    attachShadow(): ShadowRoot {
      this.shadowRoot = new StubNode() as unknown as ShadowRoot;
      return this.shadowRoot;
    }

    get attributes(): Array<{ name: string; value: string }> {
      return (this.constructor as typeof TestElement).attrs;
    }

    getAttribute(name: string): string | null {
      return this.attributes.find((attr) => attr.name === name)?.value ?? null;
    }

    hasAttribute(name: string): boolean {
      return this.getAttribute(name) !== null;
    }
  }

  (globalThis as { HTMLElement?: typeof HTMLElement }).HTMLElement = TestElement as never;
  (globalThis as { document?: Document }).document = {
    createElement() {
      return new StubNode();
    },
    createTextNode(text: string) {
      return { nodeType: 3, data: text };
    },
  } as unknown as Document;

  return () => {
    (globalThis as { customElements?: CustomElementRegistry }).customElements =
      previousCustomElements;
    (globalThis as { HTMLElement?: typeof HTMLElement }).HTMLElement = previousHTMLElement;
    (globalThis as { document?: Document }).document = previousDocument;
  };
}

Deno.test('definePreactIsland records island metadata for all hydration strategies', () => {
  const restore = installDomStubs();
  try {
    for (const hydrate of ['load', 'idle', 'visible', 'only'] as const) {
      const tagName = `preact-${hydrate}`;
      const ctor = definePreactIsland(tagName, () => null, { hydrate });
      const meta = getIslandMeta(ctor);
      assertExists(meta);
      assertEquals(meta.tagName, tagName);
      assertEquals(meta.isIsland, true);
      assertEquals(meta.ssr, hydrate === 'only' ? false : true);
      assertEquals(meta.dsd, hydrate === 'only' ? false : true);
    }
  } finally {
    restore();
  }
});

Deno.test('definePreactIsland supports DSD opt-out metadata', () => {
  const restore = installDomStubs();
  try {
    const ctor = definePreactIsland('preact-no-dsd', () => null, { dsd: false });
    const meta = getIslandMeta(ctor);
    assertExists(meta);
    assertEquals(meta.layer, 'pure-island');
    assertEquals(meta.dsd, false);
  } finally {
    restore();
  }
});
