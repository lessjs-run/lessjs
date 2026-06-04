import { StyleSheet, type StyleSheetLike } from '@openelement/style-sheet';

/**
 * Shared docs page layout styles.
 *
 * Framework-owned docs primitives live in @openelement/ui so route files do not
 * silently break layout when a local www stylesheet import is missed.
 */

const docsPageCss = `
  :host {
    display: block;
    --content-width: 720px;
    --content-max-width: 1100px;
    --toc-width: 220px;
    --underline-offset: 3px;
    --border-hairline: 0.5px;
  }

  .container {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: var(--size-10) var(--size-6) var(--size-16);
    overflow-wrap: break-word;
    word-break: break-word;
  }

  img { max-width: 100%; height: auto; }

  h1 {
    font-size: var(--font-size-7);
    font-weight: var(--font-weight-9);
    letter-spacing: var(--font-letterspacing-0);
    margin: 0 0 var(--size-3);
    color: var(--text-primary);
    line-height: var(--font-lineheight-1);
  }

  h2 {
    font-size: var(--font-size-5);
    font-weight: var(--font-weight-8);
    margin: var(--size-10) 0 var(--size-4);
    color: var(--text-primary);
    padding-bottom: var(--size-2);
    border-bottom: var(--border-hairline) solid var(--border);
    line-height: var(--font-lineheight-1);
  }

  h3 {
    font-size: var(--font-size-4);
    font-weight: var(--font-weight-7);
    margin: var(--size-6) 0 var(--size-2);
    color: var(--text-primary);
    line-height: var(--font-lineheight-3);
  }

  p {
    line-height: var(--font-lineheight-4);
    margin: var(--size-2) 0;
    color: var(--text-primary);
    font-size: var(--font-size-1);
  }

  a {
    color: var(--brand);
    text-decoration: underline;
    text-underline-offset: var(--underline-offset);
    text-decoration-color: var(--brand);
    text-decoration-thickness: var(--border-size-1);
    transition: color var(--ease-2) var(--duration-2);
  }

  pre {
    background: var(--bg-code);
    color: var(--text-secondary);
    padding: var(--size-5) var(--size-6);
    border-radius: var(--radius-3);
    overflow-x: auto;
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-4);
    margin: var(--size-4) 0;
    border: var(--border-hairline) solid var(--code-border);
    box-shadow: var(--shadow-1);
  }

  code { font-family: var(--font-mono); }

  p code, li code, .inline-code {
    background: var(--bg-code);
    padding: var(--size-1) var(--size-2);
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    color: var(--text-secondary);
    border: var(--border-hairline) solid var(--code-border);
  }

  ul, ol {
    padding-left: var(--size-5);
    color: var(--text-secondary);
    line-height: var(--font-lineheight-4);
    font-size: var(--font-size-1);
  }

  li { margin: var(--size-1) 0; }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr var(--toc-width);
    gap: var(--size-8);
    align-items: start;
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: var(--size-6) var(--size-4);
  }

  .content-grid .container {
    max-width: none;
    margin: 0;
    padding: 0;
  }

  @media (max-width: 1100px) {
    .content-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 900px) {
    .container { padding: var(--size-8) var(--size-5) var(--size-12); }
    h1 { font-size: var(--font-size-6); }
    h2 { font-size: var(--font-size-4); }
    p { font-size: var(--font-size-0); }
    pre { padding: var(--size-4) var(--size-5); font-size: var(--font-size-00); }
  }

  @media (max-width: 480px) {
    .container { padding: var(--size-6) var(--size-4) var(--size-10); }
    h1 { font-size: var(--font-size-5); }
    h2 { font-size: var(--font-size-3); }
    p { font-size: var(--font-size-0); }
    pre { padding: var(--size-3) var(--size-4); font-size: var(--font-size-00); }
    ul, ol { padding-left: var(--size-4); font-size: var(--font-size-0); }
  }
`;

export const docsPageStyles: StyleSheetLike = new StyleSheet();
docsPageStyles.replaceSync(docsPageCss);

export const docsTocPageStyles = docsPageStyles;
