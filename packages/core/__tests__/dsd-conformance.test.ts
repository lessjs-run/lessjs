import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { renderDSD } from '../src/render-dsd.ts';

function asCtor(cls: new () => { render(): string }): CustomElementConstructor {
  return cls as unknown as CustomElementConstructor;
}

Deno.test('DSD conformance: emits WHATWG shadowrootmode and focus attributes', async () => {
  class FocusCard {
    render() {
      return '<button>Focus</button>';
    }
  }

  const output = await renderDSD('focus-card', asCtor(FocusCard), {}, undefined, {
    delegatesFocus: true,
  });

  assertStringIncludes(output.html, '<template shadowrootmode="open"');
  assertStringIncludes(output.html, 'shadowrootdelegatesfocus');
});

Deno.test('DSD conformance: emits manual slot assignment attribute', async () => {
  class SlotCard {
    render() {
      return '<slot name="title"></slot><slot></slot>';
    }
  }

  const output = await renderDSD('slot-card', asCtor(SlotCard), {}, undefined, {
    slotAssignment: 'manual',
  });

  assertStringIncludes(output.html, 'shadowrootslotassignment="manual"');
  assertStringIncludes(output.html, '<slot name="title"></slot>');
});

Deno.test('DSD conformance: host wraps inert template fallback', async () => {
  class ParseCard {
    render() {
      return '<slot></slot><p>Shadow</p>';
    }
  }

  const output = await renderDSD('parse-card', asCtor(ParseCard), {});

  assertStringIncludes(output.html, '<parse-card>');
  assertStringIncludes(output.html, '<template shadowrootmode="open">');
  assertStringIncludes(output.html, '</template>');
  assertStringIncludes(output.html, '</parse-card>');
  assertEquals(output.errors.length, 0);
});
