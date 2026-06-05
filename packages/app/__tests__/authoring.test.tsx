import { assertEquals, assertExists, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { renderDsd } from '@openelement/core';
import {
  defineElement,
  definePage,
  isOpenElementNotFound,
  isOpenElementRedirect,
  notFound,
  redirect,
} from '../src/index.ts';

Deno.test('definePage() returns a DsdElement-compatible constructor', async () => {
  const Page = definePage(() => <main>Hello OpenElement</main>);

  const out = await renderDsd('test-page', { componentClass: Page });

  assertEquals(out.errors.length, 0);
  assertEquals(out.html.includes('<main>Hello OpenElement</main>'), true);
});

Deno.test('definePage() object form exposes metadata and load data to render()', async () => {
  const Page = definePage({
    title: 'Home',
    description: 'Application API',
    layout: 'docs',
    rendering: 'auto',
    streaming: 'auto',
    revalidate: 60,
    load({ params }) {
      return { message: `Hello ${params.name}` };
    },
    render({ data }) {
      return <main>{(data as { message: string }).message}</main>;
    },
  });

  assertEquals(Page.openElementPage.title, 'Home');
  assertEquals(Page.openElementPage.layout, 'docs');
  const data = await Page.openElementPage.load?.({
    params: { name: 'DX' },
    route: { path: '/' },
  });

  const out = await renderDsd('loaded-page', {
    componentClass: Page,
    props: { name: 'DX', __openElementParams: { name: 'DX' }, __openElementData: data },
  });

  assertEquals(out.errors.length, 0);
  assertEquals(out.html.includes('Hello DX'), true);
  assertEquals(out.html.includes('__openElementParams'), false);
  assertEquals(out.html.includes('__openElementData'), false);
});

Deno.test('definePage() passes structured route and meta context to render()', async () => {
  const Page = definePage({
    title: 'Article',
    meta: { section: 'docs' },
    render({ route, meta }) {
      return <main>{route.path}:{String(meta.section)}</main>;
    },
  });

  const out = await renderDsd('context-page', {
    componentClass: Page,
    props: {
      __openElementRoute: { path: '/guide' },
      __openElementMeta: { section: 'guide' },
    },
  });

  assertEquals(out.errors.length, 0);
  assertEquals(out.html.includes('/guide:guide'), true);
});

Deno.test('definePage() renders page error fallback through the same VNode contract', async () => {
  const Page = definePage({
    render() {
      return <main>ok</main>;
    },
    error({ error }) {
      return <main>Error: {String((error as Error).message)}</main>;
    },
  });

  const out = await renderDsd('error-page', {
    componentClass: Page,
    props: { __openElementError: new Error('boom') },
  });

  assertEquals(out.errors.length, 0);
  assertEquals(out.html.includes('Error: boom'), true);
});

Deno.test('redirect() and notFound() expose typed lifecycle control errors', () => {
  let redirectError: unknown;
  try {
    redirect('/login', 307);
  } catch (error) {
    redirectError = error;
  }

  assertEquals(isOpenElementRedirect(redirectError), true);
  assertEquals((redirectError as { location: string }).location, '/login');
  assertEquals((redirectError as { status: number }).status, 307);

  let notFoundError: unknown;
  try {
    notFound('missing article');
  } catch (error) {
    notFoundError = error;
  }

  assertEquals(isOpenElementNotFound(notFoundError), true);
  assertEquals((notFoundError as { status: number }).status, 404);
});

Deno.test('defineElement() validates custom element tag names', () => {
  assertThrows(
    () => {
      defineElement('BadName', () => <span />);
    },
    Error,
    'valid custom element name',
  );
});

Deno.test('@openelement/app root exports authoring helpers only', () => {
  assertExists(definePage);
  assertExists(defineElement);
});
