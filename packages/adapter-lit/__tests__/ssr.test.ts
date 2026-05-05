/**
 * @lessjs/adapter-lit - SSR adapter tests
 */

import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { css, html, LitElement, nothing } from 'lit';
import {
  extractLitStyles,
  installLitAdapter,
  renderLitToString,
  uninstallLitAdapter,
} from '../src/ssr.ts';

function compactHtml(value: string): string {
  return value.replace(/>\s+</g, '><').trim();
}

function compactCss(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;])\s*/g, '$1')
    .trim();
}

Deno.test('renderLitToString escapes text content values', () => {
  const rendered = renderLitToString(html`
    <p>${'<script>alert(1)</script>'}</p>
  `);
  assertEquals(compactHtml(rendered), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
});

Deno.test('renderLitToString escapes attribute values', () => {
  const rendered = renderLitToString(html`
    <a href="${'javascript:alert("x")'}">link</a>
  `);
  assertEquals(compactHtml(rendered), '<a href="javascript:alert(&quot;x&quot;)">link</a>');
});

Deno.test('renderLitToString supports boolean attributes', () => {
  assertEquals(
    compactHtml(renderLitToString(html`
      <button ?disabled="${true}">Save</button>
    `)),
    '<button disabled>Save</button>',
  );
  assertEquals(
    compactHtml(renderLitToString(html`
      <button ?disabled="${false}">Save</button>
    `)),
    '<button>Save</button>',
  );
});

Deno.test('renderLitToString strips event and property bindings', () => {
  const rendered = renderLitToString(
    html`
      <button @click="${() => undefined}" .value="${'private'}">Save</button>
    `,
  );
  assertEquals(compactHtml(rendered), '<button>Save</button>');
});

Deno.test('renderLitToString handles nothing, arrays, and nested templates', () => {
  const rendered = renderLitToString(html`
    <section title="${nothing}">
      ${[
        html`
          <span>${'A&B'}</span>
        `,
        ' ',
        html`
          <strong>${'<C>'}</strong>
        `,
      ]}
    </section>
  `);
  assertStringIncludes(rendered, '<section>');
  assertStringIncludes(rendered, '<span>A&amp;B</span>');
  assertStringIncludes(rendered, '<strong>&lt;C&gt;</strong>');
});

Deno.test('extractLitStyles reads single and array CSSResult values', () => {
  class StyledElement extends LitElement {
    static override styles = [
      css`
        :host {
          display: block;
        }
      `,
      css`
        .label {
          color: red;
        }
      `,
    ];
  }

  const styles = compactCss(
    extractLitStyles(StyledElement as unknown as CustomElementConstructor) ?? '',
  );
  assertStringIncludes(styles, ':host{display:block;}');
  assertStringIncludes(styles, '.label{color:red;}');
});

Deno.test('installLitAdapter registers idempotent global hooks and uninstall removes them', async () => {
  uninstallLitAdapter();
  installLitAdapter();
  installLitAdapter();

  const globals = globalThis as Record<string, unknown>;
  const check = globals.__lessLitTemplateCheck as (value: unknown) => boolean;
  const renderer = globals.__lessLitSsrRenderer as (
    value: unknown,
    tagName: string,
  ) => Promise<string>;
  const styles = globals.__lessLitStylesExtractor as (
    componentClass: CustomElementConstructor,
  ) => string | undefined;

  assertEquals(
    check(html`
      <p>ok</p>
    `),
    true,
  );
  assertEquals(
    compactHtml(
      await renderer(
        html`
          <p>${'<x>'}</p>
        `,
        'test-el',
      ),
    ),
    '<p>&lt;x&gt;</p>',
  );
  assertEquals(typeof styles, 'function');

  uninstallLitAdapter();
  assertEquals(globals.__lessLitTemplateCheck, undefined);
  assertEquals(globals.__lessLitSsrRenderer, undefined);
  assertEquals(globals.__lessLitStylesExtractor, undefined);
  assertEquals(globals.__lessLitAdapterInstalled, undefined);
});

// ─── Additional Coverage Tests ────────────────────────────────────

Deno.test('extractLitStyles returns undefined for class without styles', () => {
  class NoStyleElement extends LitElement {}
  const result = extractLitStyles(NoStyleElement as unknown as CustomElementConstructor);
  assertEquals(result, undefined);
});

Deno.test('extractLitStyles handles single CSSResult (not array)', () => {
  class SingleStyleElement extends LitElement {
    static override styles = css`
      :host {
        display: inline;
      }
    `;
  }
  const result = compactCss(
    extractLitStyles(SingleStyleElement as unknown as CustomElementConstructor) ?? '',
  );
  assertStringIncludes(result, ':host{display:inline;}');
});

Deno.test('extractLitStyles handles plain string styles', () => {
  // @ts-expect-error — string[] is not a valid CSSResultGroup, but the
  // extractor handles it defensively at runtime
  class StringStyleElement extends LitElement {
    static override styles = ['div { color: blue; }', 'span { font-size: 12px; }'];
  }
  const result = compactCss(
    extractLitStyles(StringStyleElement as unknown as CustomElementConstructor) ?? '',
  );
  assertStringIncludes(result, 'div{color:blue;}');
  assertStringIncludes(result, 'span{font-size:12px;}');
});

Deno.test('renderLitToString handles deeply nested TemplateResult', () => {
  const inner = html`
    <em>${'bold'}</em>
  `;
  const middle = html`
    <span>${inner}</span>
  `;
  const outer = html`
    <div>${middle}</div>
  `;
  const result = compactHtml(renderLitToString(outer));
  assertEquals(result, '<div><span><em>bold</em></span></div>');
});

Deno.test('renderLitToString strips multiple event and property bindings in one template', () => {
  const result = compactHtml(renderLitToString(html`
    <form @submit="${() => undefined}" .data="${{ a: 1 }}" @input="${() => undefined}">
      <input .value="${'secret'}" @change="${() => undefined}" type="text">
      <button ?disabled="${false}" @click="${() => undefined}" .label="${'x'}">Submit</button>
    </form>
  `));
  assertEquals(result, '<form><input type="text"><button>Submit</button></form>');
});

Deno.test('renderLitToString handles nothing sentinel in text content', () => {
  const result = compactHtml(renderLitToString(html`
    <p>${nothing}</p>
  `));
  assertEquals(result, '<p></p>');
});

Deno.test('renderLitToString handles null and undefined values', () => {
  const result = compactHtml(renderLitToString(html`
    <span>${null}${undefined}</span>
  `));
  assertEquals(result, '<span></span>');
});

Deno.test('renderLitToString handles array values in attribute context', () => {
  const result = compactHtml(renderLitToString(html`
    <div class="${['a', 'b', 'c']}"></div>
  `));
  assertEquals(result, '<div class="abc"></div>');
});

Deno.test('renderLitToString handles numeric values', () => {
  const result = compactHtml(renderLitToString(html`
    <span>${42}</span>
  `));
  assertEquals(result, '<span>42</span>');
});

Deno.test('renderLitToString handles boolean attribute with nothing sentinel', () => {
  const result = compactHtml(renderLitToString(html`
    <button ?disabled="${nothing}">OK</button>
  `));
  assertEquals(result, '<button>OK</button>');
});

Deno.test('renderLitToString passes non-TemplateResult through String()', () => {
  assertEquals(renderLitToString('plain text'), 'plain text');
  assertEquals(renderLitToString(42), '42');
});
