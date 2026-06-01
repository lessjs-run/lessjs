/** @jsxImportSource @lessjs/core */

export const tagName = 'mdx-guide-page';
export const meta = {
  title: 'MDX',
  description: 'Build-time MDX support for LessJS content and DSD components.',
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
            Author Markdown with LessJS custom elements, compile it at build time, and keep the
            output on the existing JSX and Declarative Shadow DOM path.
          </p>
        </header>

        <section class='doc-section'>
          <h2>Compiler</h2>
          <less-code-block language='ts'>
            {`import { compileMdx } from '@lessjs/content/mdx';

const module = await compileMdx(source, {
  jsxImportSource: '@lessjs/core',
});`}
          </less-code-block>
        </section>

        <section class='doc-section'>
          <h2>Vite</h2>
          <less-code-block language='ts'>
            {`import { mdxPlugin } from '@lessjs/adapter-vite/plugin-mdx';

export default {
  plugins: [mdxPlugin()],
};`}
          </less-code-block>
        </section>

        <section class='doc-section'>
          <h2>Islands</h2>
          <less-code-block language='mdx'>
            {`---
title: Counter demo
---

# Counter

<less-counter client:idle count={1} />`}
          </less-code-block>
        </section>
      </article>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, MdxGuidePage);
}
