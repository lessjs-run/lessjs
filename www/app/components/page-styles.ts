/**
 * LessJS Docs - Shared Page Styles
 *
 * v0.26.1 Complete overhaul:
 * - All sizing → Open Props var(--size-N) / var(--font-size-N)
 * - All colors → Open Props var(--text-*) / var(--gray-*) / var(--brand*)
 * - Light/dark contrast via [data-theme] selectors
 * - Removed duplicate .nav-row
 * - Improved typography for readability
 */
export const pageStyles = `
  :host { display: block; }

  .container {
    max-width: var(--size-content-3, 800px);
    margin: 0 auto;
    padding: var(--size-10) var(--size-6) var(--size-16);
    overflow-wrap: break-word;
    word-break: break-word;
  }

  img { max-width: 100%; height: auto; }

  .table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: var(--size-4) 0;
  }

  /* ─── Headings ─── */
  h1 {
    font-size: var(--font-size-8);
    font-weight: var(--font-weight-7);
    letter-spacing: -0.025em;
    margin: 0 0 var(--size-3);
    color: var(--text-primary);
    line-height: var(--font-lineheight-0);
  }

  .subtitle {
    color: var(--text-muted);
    margin-bottom: var(--size-12);
    font-size: var(--font-size-3);
    line-height: var(--font-lineheight-4);
  }

  h2 {
    font-size: var(--font-size-6);
    font-weight: var(--font-weight-6);
    margin: var(--size-10) 0 var(--size-4);
    color: var(--text-primary);
    letter-spacing: -0.01em;
    padding-bottom: var(--size-2);
    border-bottom: 0.5px solid var(--border);
  }

  h3 {
    font-size: var(--font-size-4);
    font-weight: var(--font-weight-6);
    margin: var(--size-6) 0 var(--size-2);
    color: var(--text-primary);
  }

  p {
    line-height: var(--font-lineheight-4);
    margin: var(--size-2) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-2);
  }

  strong { color: var(--text-primary); font-weight: var(--font-weight-6); }
  em { font-style: italic; }

  /* ─── Links ─── */
  a {
    color: var(--brand);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--brand);
    text-decoration-thickness: 0.5px;
    transition: color var(--ease-2) var(--duration-2);
  }
  a:hover { color: var(--brand-hover); }

  /* ─── Section labels & dividers ─── */
  .section-label {
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-6);
    color: var(--brand);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    margin-bottom: var(--size-3);
  }

  .section-divider {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--brand) 20%, var(--brand-light) 80%, transparent);
    opacity: 0.2;
    margin: var(--size-10) 0;
  }

  /* ─── Code ─── */
  pre {
    background: var(--bg-code);
    color: var(--text-secondary);
    padding: var(--size-5) var(--size-6);
    border-radius: var(--radius-3);
    overflow-x: auto;
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-4);
    margin: var(--size-4) 0;
    border: 0.5px solid var(--code-border);
    box-shadow: var(--shadow-1);
  }

  code { font-family: var(--font-mono); }

  p code, li code, .inline-code {
    background: var(--bg-code);
    padding: var(--size-1) var(--size-2);
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    color: var(--text-secondary);
    border: 0.5px solid var(--code-border);
  }

  /* ─── Tables ─── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: var(--size-3) 0 var(--size-6);
    font-size: var(--font-size-0);
  }
  th, td {
    border: 0.5px solid var(--border);
    padding: var(--size-2) var(--size-3);
    text-align: left;
  }
  th {
    font-weight: var(--font-weight-6);
    color: var(--text-primary);
    background: var(--bg-surface);
  }
  td { color: var(--text-secondary); }
  tr:nth-child(even) td { background: var(--bg-surface); }

  /* ─── Callouts & Pillars ─── */
  .callout, .pillar {
    padding: var(--size-4) var(--size-5);
    margin: var(--size-4) 0;
    border-left: 3px solid var(--brand);
    background: var(--bg-surface);
    border-radius: 0 var(--radius-3) var(--radius-3) 0;
  }
  .callout.warn { border-left-color: var(--brand-deep); }

  .pillar .num {
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--brand);
    margin-bottom: var(--size-1);
  }
  .pillar h3 { margin: 0 0 var(--size-2); }

  .hard-constraint {
    display: inline-block;
    background: var(--bg-code);
    border: 0.5px solid var(--border-hover);
    padding: var(--size-1) var(--size-2);
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    margin: var(--size-1) 0;
  }

  /* ─── Lists ─── */
  ul, ol {
    padding-left: var(--size-5);
    color: var(--text-secondary);
    line-height: var(--font-lineheight-4);
  }
  li { margin: var(--size-1) 0; }

  /* ─── Page nav (next/prev) ─── */
  .nav-row {
    margin-top: var(--size-10);
    padding-top: var(--size-4);
    border-top: 0.5px solid var(--border);
    display: flex;
    justify-content: space-between;
  }
  .nav-link {
    color: var(--brand);
    text-decoration: none;
    font-weight: var(--font-weight-5);
    font-size: var(--font-size-1);
    padding: var(--size-2) var(--size-4);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-2);
    transition: all var(--ease-2) var(--duration-2);
  }
  .nav-link:hover {
    color: var(--text-primary);
    border-color: var(--brand);
    background: var(--bg-surface);
  }

  /* ─── Content grid (TOC + content) ─── */
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 220px;
    gap: var(--size-8);
    align-items: start;
    max-width: 1100px;
    margin: 0 auto;
    padding: var(--size-6) var(--size-4);
  }
  .content-grid .container { max-width: none; margin: 0; padding: 0; }

  /* ─── Light theme overrides ─── */
  :host([data-theme="light"]) pre { background: var(--gray-1); color: var(--gray-8); }
  :host([data-theme="light"]) p code, 
  :host([data-theme="light"]) li code,
  :host([data-theme="light"]) .inline-code { background: var(--gray-2); color: var(--gray-8); }

  /* ─── Responsive ─── */
  @media (max-width: 1100px) { .content-grid { grid-template-columns: 1fr; } }
  @media (max-width: 900px) {
    .container { padding: var(--size-8) var(--size-5) var(--size-12); }
    h1 { font-size: var(--font-size-7); }
    h2 { font-size: var(--font-size-5); }
    .subtitle { margin-bottom: var(--size-8); }
    pre { padding: var(--size-4) var(--size-5); font-size: var(--font-size-00); }
    .nav-row { flex-direction: column; gap: var(--size-3); }
  }
  @media (max-width: 480px) {
    .container { padding: var(--size-6) var(--size-4) var(--size-10); }
    h1 { font-size: var(--font-size-6); }
    .subtitle { font-size: var(--font-size-0); margin-bottom: var(--size-6); }
    h2 { font-size: var(--font-size-4); }
    p { font-size: var(--font-size-0); }
    pre { padding: var(--size-3) var(--size-4); font-size: var(--font-size-00); }
    ul, ol { padding-left: var(--size-4); }
  }

  :focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { a, .nav-link { transition: none; } }
`;
