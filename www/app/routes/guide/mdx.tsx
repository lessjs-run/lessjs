/** @jsxImportSource @openelement/core */

export const tagName = 'mdx-guide-page';
export const meta = {
  title: 'MDX',
  description: 'Build-time MDX support for openElement content and DSD components.',
  order: 65,
};

export default class MdxGuidePage extends HTMLElement {
  render() {
    return (
      <article class='doc-page'>
        <header class='doc-hero'>
          <p class='eyebrow'>Content</p>
          <h1>MDX</h1>
          <p>
            Author Markdown with openElement custom elements, compile it at build time, and keep the
            output on the existing JSX and Declarative Shadow DOM path.
          </p>
        </header>

        <section class='doc-section'>
          <h2>Compiler</h2>
          <open-code-block language='ts'>
            {`import { compileMdx } from '@openelement/content/mdx';

const module = await compileMdx(source, {
  jsxImportSource: '@openelement/core',
});`}
          </open-code-block>
        </section>

        <section class='doc-section'>
          <h2>Vite</h2>
          <open-code-block language='ts'>
            {`import { mdxPlugin } from '@openelement/adapter-vite/plugin-mdx';

export default {
  plugins: [mdxPlugin()],
};`}
          </open-code-block>
        </section>

        <section class='doc-section'>
          <h2>Islands</h2>
          <open-code-block language='mdx'>
            {`---
title: Counter demo
---

# Counter

<open-counter client:idle count={1} />`}
          </open-code-block>
        </section>
      </article>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, MdxGuidePage);
}
