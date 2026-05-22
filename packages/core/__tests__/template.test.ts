import { assertEquals, assertFalse, assertStringIncludes } from 'jsr:@std/assert@1';
import { html, renderTemplateToString, unsafeHTML } from '../src/template.ts';
import { renderDSD, renderDSDStream } from '../src/render-dsd.ts';

class TemplateComponent {
  name = '<Less>';
  href = 'javascript:alert(1)';

  render() {
    return html`
      <a href="${this.href}">${this.name}</a>
      ${unsafeHTML('<strong>trusted</strong>')}
    `;
  }
}

function asCtor(cls: new () => { render(): unknown }): CustomElementConstructor {
  return cls as unknown as CustomElementConstructor;
}

function compact(html: string): string {
  return html.trim().replace(/\n\s*/g, '');
}

Deno.test('html templates escape interpolated text and attributes by default', () => {
  const result = html`
    <p title="${'<x>'}">${'<script>'}</p>
  `;
  assertEquals(
    compact(renderTemplateToString(result)),
    '<p title="&lt;x&gt;">&lt;script&gt;</p>',
  );
});

Deno.test('unsafeHTML inserts trusted HTML only in text context', () => {
  const result = html`
    <div>${unsafeHTML('<span>ok</span>')}</div>
  `;
  assertEquals(compact(renderTemplateToString(result)), '<div><span>ok</span></div>');
});

Deno.test('event and property bindings are not serialized during SSR', () => {
  const result = html`
    <button @click="${() => {}}" .value="${'x'}">Save</button>
  `;
  const rendered = compact(renderTemplateToString(result));
  assertEquals(rendered, '<button  >Save</button>');
  assertFalse(rendered.includes('@click'));
  assertFalse(rendered.includes('.value'));
  assertFalse(rendered.includes('() =>'));
});

Deno.test('url attributes reject unsafe protocols', () => {
  const result = html`
    <a href="${'javascript:alert(1)'}">x</a>
  `;
  assertEquals(compact(renderTemplateToString(result)), '<a href="#">x</a>');
});

Deno.test('renderDSD renders native LessJS TemplateResult without an adapter', async () => {
  const output = await renderDSD('template-el', asCtor(TemplateComponent), {});
  assertStringIncludes(output.html, '<template shadowrootmode="open">');
  assertStringIncludes(output.html, '&lt;Less&gt;');
  assertStringIncludes(output.html, 'href="#"');
  assertStringIncludes(output.html, '<strong>trusted</strong>');
  assertEquals(output.errors.length, 0);
});

Deno.test('renderDSDStream yields shell, component chunks, and footer', async () => {
  const stream = renderDSDStream([
    { tagName: 'template-el', componentClass: asCtor(TemplateComponent) },
  ], {
    shell: '<main>',
    footer: '</main>',
  });
  const body = await new Response(stream).text();
  assertStringIncludes(body, '<main>');
  assertStringIncludes(body, '<template-el>');
  assertStringIncludes(body, '</main>');
});
