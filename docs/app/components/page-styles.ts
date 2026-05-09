import { css } from 'lit';

/**
 * LessJS Docs — Shared Page Styles (Minimal)
 *
 * Clean, restrained, typography-driven.
 * Aligned with the new minimal design system.
 */
export const pageStyles = css`
  :host {
    display: block;
  }

  .container {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    /* Prevent long strings (URLs, code references) from causing overflow */
    overflow-wrap: break-word;
    word-break: break-word;
  }

  /* Responsive images */
  img {
    max-width: 100%;
    height: auto;
  }

  /* Table scroll wrapper — wrap any <table> in <div class="table-wrap"> */
  .table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 1rem 0;
  }

  h1 {
    font-size: 2rem;
    font-weight: 500;
    letter-spacing: -0.02em;
    margin: 0 0 0.5rem;
    color: var(--less-text-primary);
    line-height: 1.2;
  }

  .subtitle {
    color: var(--less-text-tertiary);
    margin-bottom: 3rem;
    font-size: 0.875rem;
    line-height: 1.7;
  }

  h2 {
    font-size: 1rem;
    font-weight: 500;
    margin: 2rem 0 0.75rem;
    color: var(--less-text-primary);
  }

  h3 {
    font-size: 0.875rem;
    font-weight: 500;
    margin: 1.5rem 0 0.5rem;
    color: var(--less-text-primary);
  }

  p {
    line-height: 1.7;
    margin: 0.5rem 0;
    color: var(--less-text-secondary);
    font-size: 0.875rem;
  }

  strong {
    color: var(--less-text-primary);
    font-weight: 500;
  }
  em {
    font-style: italic;
  }

  a {
    color: var(--less-text-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--less-border-hover);
    text-decoration-thickness: 0.5px;
    transition: text-decoration-color 0.15s;
  }
  a:hover {
    text-decoration-color: var(--less-text-primary);
  }

  /* Code */
  pre {
    background: var(--less-code-bg);
    color: var(--less-text-secondary);
    padding: 1rem 1.25rem;
    border-radius: 3px;
    overflow-x: auto;
    font-size: 0.8125rem;
    line-height: 1.6;
    margin: 0.75rem 0;
    border: 0.5px solid var(--less-code-border);
  }

  code {
    font-family: "SF Mono", "Fira Code", "Consolas", monospace;
  }

  p code, li code {
    background: var(--less-code-bg);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-size: 0.75rem;
    color: var(--less-text-secondary);
    border: 0.5px solid var(--less-code-border);
  }

  .inline-code {
    background: var(--less-code-bg);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-size: 0.875em;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.75rem 0 1.5rem;
    font-size: 0.8125rem;
  }
  th, td {
    border: 0.5px solid var(--less-border);
    padding: 0.5rem 0.75rem;
    text-align: left;
  }
  th {
    font-weight: 500;
    color: var(--less-text-secondary);
  }
  td {
    color: var(--less-text-tertiary);
  }

  /* Callouts */
  .callout {
    padding: 1rem 1.25rem;
    margin: 1rem 0;
    border-left: 2px solid var(--less-border-hover);
    background: var(--less-bg-surface);
    border-radius: 0 3px 3px 0;
  }
  .callout.warn {
    border-left-color: var(--less-text-tertiary);
  }

  .pillar {
    padding: 1.25rem 1.5rem;
    margin: 1rem 0;
    border-left: 2px solid var(--less-border-hover);
    background: var(--less-bg-surface);
    border-radius: 0 3px 3px 0;
  }
  .pillar .num {
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--less-text-muted);
    margin-bottom: 0.25rem;
  }
  .pillar h3 {
    margin: 0 0 0.5rem;
  }

  .hard-constraint {
    display: inline-block;
    background: var(--less-code-bg);
    border: 0.5px solid var(--less-border-hover);
    padding: 0.25rem 0.625rem;
    border-radius: 3px;
    font-size: 0.75rem;
    margin: 0.125rem 0;
  }

  /* Lists */
  ul, ol {
    padding-left: 1.25rem;
    color: var(--less-text-secondary);
    line-height: 1.7;
  }
  li {
    margin: 0.25rem 0;
  }

  /* Page nav */
  .nav-row {
    margin-top: 2.5rem;
    display: flex;
    justify-content: space-between;
  }
  .nav-link {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--less-text-secondary);
    text-decoration: none;
    border: 0.5px solid var(--less-border);
    border-radius: 3px;
    transition: color 0.15s, border-color 0.15s;
  }
  .nav-link:hover {
    color: var(--less-text-primary);
    border-color: var(--less-border-hover);
  }

  @media (max-width: 900px) {
    .container {
      padding: 2rem 1.25rem 3rem;
    }
    h1 {
      font-size: 1.5rem;
    }
    .subtitle {
      margin-bottom: 2rem;
    }
    pre {
      padding: 0.875rem 1rem;
      font-size: 0.75rem;
    }
    .nav-row {
      flex-direction: column;
      gap: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .container {
      padding: 1.5rem 1rem 2.5rem;
    }
    h1 {
      font-size: 1.25rem;
    }
    .subtitle {
      font-size: 0.8125rem;
      margin-bottom: 1.5rem;
    }
    h2 {
      font-size: 0.9375rem;
    }
    p {
      font-size: 0.8125rem;
    }
    pre {
      padding: 0.75rem;
      font-size: 0.6875rem;
    }
    ul, ol {
      padding-left: 1rem;
    }
  }

  /* ── Prism.js token colors ──────────────────────────────────────────
   * Inlined here because global Prism CSS can't penetrate Shadow DOM.
   * All guide/blog pages use pageStyles inside their shadow root.
   */
  .token.cdata,
  .token.comment,
  .token.doctype,
  .token.prolog { color: #708090; }

  .token.punctuation { color: #999; }

  .token.namespace { opacity: 0.7; }

  .token.boolean,
  .token.constant,
  .token.deleted,
  .token.number,
  .token.property,
  .token.symbol,
  .token.tag { color: #905; }

  .token.attr-name,
  .token.builtin,
  .token.char,
  .token.inserted,
  .token.selector,
  .token.string { color: #690; }

  .token.entity,
  .token.operator,
  .token.url,
  .language-css .token.string,
  .style .token.string { color: #9a6e3a; }

  .token.atrule,
  .token.attr-value,
  .token.keyword { color: #07a; }

  .token.class-name,
  .token.function { color: #dd4a68; }

  .token.important,
  .token.regex,
  .token.variable { color: #e90; }

  .token.bold,
  .token.important { font-weight: 700; }

  .token.italic { font-style: italic; }

  .token.entity { cursor: help; }

  /* Extra: selection color matching Prism default theme */
  code[class*="language-"] ::selection,
  code[class*="language-"]::selection,
  pre[class*="language-"] ::selection,
  pre[class*="language-"]::selection {
    background: #b3d4fc;
  }
`;
