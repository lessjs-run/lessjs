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

Deno.test('renderDSD keeps runtime markers for DSD upgrade template events', async () => {
  class EventComponent {
    render() {
      return html`
        <button @click="${() => {}}">Run</button>
      `;
    }
  }

  const output = await renderDSD('event-el', asCtor(EventComponent), {});
  assertStringIncludes(output.html, 'data-less-event-0');
  assertFalse(output.html.includes('@click'));
  assertFalse(output.html.includes('() =>'));
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

// === v0.21 Security Tests ===

Deno.test('Text XSS: script tag is escaped as text', () => {
  const result = html`
    <p>${'<script>alert(1)</script>'}</p>
  `;
  const rendered = renderTemplateToString(result);
  assertStringIncludes(rendered, '&lt;script&gt;alert(1)&lt;/script&gt;');
  assertFalse(rendered.includes('<script>'));
});

Deno.test('Attribute breakout: quote injection cannot break attribute', () => {
  const payload = '" onclick="alert(1)"';
  const result = html`
    <div title="${payload}">x</div>
  `;
  const rendered = renderTemplateToString(result);
  // The payload should be escaped, not create an onclick handler
  assertStringIncludes(rendered, '&quot;');
  assertFalse(rendered.includes('onclick='));
});

Deno.test('URL attack: javascript: protocol is neutralized', () => {
  const result = html`
    <a href="${'javascript:alert(1)'}">click</a>
  `;
  const rendered = compact(renderTemplateToString(result));
  // href should be neutralized to #
  assertEquals(rendered, '<a href="#">click</a>');
});

Deno.test('Boolean false: ?disabled=false produces no disabled attribute in SSR', () => {
  const result = html`
    <input ?disabled="${false}">
  `;
  const rendered = compact(renderTemplateToString(result));
  assertFalse(rendered.includes('disabled'));
  assertEquals(rendered, '<input >');
});

Deno.test('Property no-serialize: .value binding is not serialized in SSR', () => {
  const evil = { toString: () => 'evil' };
  const result = html`
    <input .value="${evil}">
  `;
  const rendered = compact(renderTemplateToString(result));
  assertFalse(rendered.includes('evil'));
  assertFalse(rendered.includes('value='));
});

Deno.test('Event no-serialize: @click handler emits no function source in SSR', () => {
  const result = html`
    <button @click="${() => {/* evil */}}">x</button>
  `;
  const rendered = compact(renderTemplateToString(result));
  assertFalse(rendered.includes('() =>'));
  assertFalse(rendered.includes('function'));
  assertFalse(rendered.includes('evil'));
});

Deno.test('unsafeHTML: renders raw HTML without escaping', () => {
  const result = html`
    <div>${unsafeHTML('<em>bold</em>')}</div>
  `;
  const rendered = compact(renderTemplateToString(result));
  assertEquals(rendered, '<div><em>bold</em></div>');
});

Deno.test('Nested escape: nested template does not double-escape', () => {
  const result = html`
    <div>${html`
      <span>${'<b>'}</span>
    `}</div>
  `;
  const rendered = compact(renderTemplateToString(result));
  // Should be single-escaped, not double-escaped
  assertEquals(rendered, '<div><span>&lt;b&gt;</span></div>');
});
