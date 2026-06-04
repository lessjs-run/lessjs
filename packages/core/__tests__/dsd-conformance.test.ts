import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { renderDsd, type RenderDsdOptions } from '../src/render-dsd.ts';
import { jsx } from '../src/jsx-runtime.ts';
import type { VNode } from '../src/vnode.ts';

function asCtor(cls: new () => { render(): VNode | null }): CustomElementConstructor {
  return cls as unknown as CustomElementConstructor;
}

function renderDsdForTest(
  tagName: string,
  componentClass: CustomElementConstructor,
  props: Record<string, unknown> = {},
  sourceInfo?: { route?: string; source?: string },
  dsdOptions?: RenderDsdOptions['dsdOptions'],
) {
  return renderDsd(tagName, {
    componentClass,
    props,
    sourceInfo,
    dsdOptions,
  });
}

Deno.test('DSD conformance: emits WHATWG shadowrootmode and focus attributes', async () => {
  class FocusCard {
    render() {
      return jsx('button', { children: 'Focus' });
    }
  }

  const output = await renderDsdForTest('focus-card', asCtor(FocusCard), {}, undefined, {
    delegatesFocus: true,
  });

  assertStringIncludes(output.html, '<template shadowrootmode="open"');
  assertStringIncludes(output.html, 'shadowrootdelegatesfocus');
});

Deno.test('DSD conformance: emits manual slot assignment attribute', async () => {
  class SlotCard {
    render() {
      return jsx('div', {
        innerHTML: '<slot name="title"></slot><slot></slot>',
        trustedHtml: true,
      });
    }
  }

  const output = await renderDsdForTest('slot-card', asCtor(SlotCard), {}, undefined, {
    slotAssignment: 'manual',
  });

  assertStringIncludes(output.html, 'shadowrootslotassignment="manual"');
  assertStringIncludes(output.html, '<slot name="title"></slot>');
});

Deno.test('DSD conformance: host wraps inert template fallback', async () => {
  class ParseCard {
    render() {
      return jsx('div', {
        innerHTML: '<slot></slot><p>Shadow</p>',
        trustedHtml: true,
      });
    }
  }

  const output = await renderDsdForTest('parse-card', asCtor(ParseCard), {});

  assertStringIncludes(output.html, '<parse-card>');
  assertStringIncludes(output.html, '<template shadowrootmode="open">');
  assertStringIncludes(output.html, '</template>');
  assertStringIncludes(output.html, '</parse-card>');
  assertEquals(output.errors.length, 0);
});
