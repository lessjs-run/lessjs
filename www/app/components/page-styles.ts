/**
 * LessJS Docs - Shared Page Styles
 *
 * v0.19.1 Phase 6 (ADR-0035 B1): Visual overhaul.
 * v0.20.0 Ocean-Island: Pure CSS string - zero Lit dependency.
 *
 * "精密·克制·有深度" - precise, restrained, with depth.
 *
 * Key changes from v0.19.0:
 * - H1: 2rem -> 2.5rem, weight 500 -> 700
 * - H2: 1rem -> 1.25rem, weight 500 -> 600
 * - Container: 720px -> 800px
 * - Paragraph/H2 spacing increased
 * - Links use brand color (--brand)
 * - Code blocks: dark theme with better line-height
 * - Tables: striped rows + cleaner borders
 * - Cards/sections: border-radius 6px + shadow
 */
export const pageStyles = `
  :host {
    display: block;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 4rem;
    /* Prevent long strings (URLs, code references) from causing overflow */
    overflow-wrap: break-word;
    word-break: break-word;
  }

  /* Responsive images */
  img {
    max-width: 100%;
    height: auto;
  }

  /* Table scroll wrapper - wrap any <table> in <div class="table-wrap"> */
  .table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 1rem 0;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    margin: 0 0 0.75rem;
    color: var(--text-primary);
    line-height: 1.15;
  }

  .subtitle {
    color: var(--text-muted);
    margin-bottom: 3rem;
    font-size: 1rem;
    line-height: 1.7;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 2.5rem 0 1rem;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem;
    color: var(--text-primary);
  }

  p {
    line-height: 1.75;
    margin: 0.5rem 0;
    color: var(--text-secondary);
    font-size: 0.9375rem;
  }

  strong {
    color: var(--text-primary);
    font-weight: 600;
  }
  em {
    font-style: italic;
  }

  a {
    color: var(--brand, #534ab7);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--brand, #534ab7);
    text-decoration-thickness: 0.5px;
    opacity: 0.9;
    transition: opacity 0.15s, text-decoration-color 0.15s;
  }
  a:hover {
    opacity: 1;
    text-decoration-color: var(--brand, #534ab7);
  }

  /* Brand section label (matches homepage) */
  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--brand, #534ab7);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    margin-bottom: 14px;
  }

  /* Section divider - brand gradient */
  .section-divider {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--brand, #534AB7) 20%, var(--brand-light, #6D5CE8) 80%, transparent);
    opacity: 0.2;
    margin: 2.5rem 0;
  }

  /* Code - dark theme */
  pre {
    background: var(--bg-terminal, #1a1a2e);
    color: #e0e0e0;
    padding: 1.25rem 1.5rem;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 0.8125rem;
    line-height: 1.7;
    margin: 1rem 0;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  code {
    font-family: "JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace;
  }

  p code, li code {
    background: var(--bg-code);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
    color: var(--text-secondary);
    border: 0.5px solid var(--code-border);
  }

  .inline-code {
    background: var(--bg-code);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.875em;
  }

  /* Tables - striped + cleaner borders */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.75rem 0 1.5rem;
    font-size: 0.8125rem;
  }
  th, td {
    border: 1px solid var(--border);
    padding: 0.625rem 0.875rem;
    text-align: left;
  }
  th {
    font-weight: 600;
    color: var(--text-secondary);
    background: var(--bg-surface);
  }
  td {
    color: var(--text-muted);
  }
  tr:nth-child(even) td {
    background: var(--bg-surface);
  }

  /* Callouts */
  .callout {
    padding: 1rem 1.25rem;
    margin: 1rem 0;
    border-left: 3px solid var(--brand, #534ab7);
    background: var(--bg-surface);
    border-radius: 0 8px 8px 0;
  }
  .callout.warn {
    border-left-color: #f59e0b;
  }

  .pillar {
    padding: 1.25rem 1.5rem;
    margin: 1rem 0;
    border-left: 3px solid var(--brand, #534ab7);
    background: var(--bg-surface);
    border-radius: 0 8px 8px 0;
  }
  .pillar .num {
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--brand, #534ab7);
    margin-bottom: 0.25rem;
  }
  .pillar h3 {
    margin: 0 0 0.5rem;
  }

  .hard-constraint {
    display: inline-block;
    background: var(--bg-code);
    border: 0.5px solid var(--border-hover);
    padding: 0.25rem 0.625rem;
    border-radius: 4px;
    font-size: 0.75rem;
    margin: 0.125rem 0;
  }

  /* Lists */
  ul, ol {
    padding-left: 1.25rem;
    color: var(--text-secondary);
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
    color: var(--text-secondary);
    text-decoration: none;
    border: 0.5px solid var(--border);
    border-radius: 6px;
    transition: color 0.15s, border-color 0.15s;
  }
  .nav-link:hover {
    color: var(--text-primary);
    border-color: var(--border-hover);
  }

  @media (max-width: 900px) {
    .container {
      padding: 2rem 1.25rem 3rem;
    }
    h1 {
      font-size: 2rem;
    }
    .subtitle {
      margin-bottom: 2rem;
    }
    pre {
      padding: 1rem 1.25rem;
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
      font-size: 1.5rem;
    }
    .subtitle {
      font-size: 0.8125rem;
      margin-bottom: 1.5rem;
    }
    h2 {
      font-size: 1.0625rem;
    }
    p {
      font-size: 0.8125rem;
    }
    pre {
      padding: 0.875rem 1rem;
      font-size: 0.6875rem;
    }
    ul, ol {
      padding-left: 1rem;
    }
  }

  :focus-visible {
    outline: 2px solid var(--brand, #534ab7);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    a {
      transition: none;
    }
    .nav-link {
      transition: none;
    }
  }

  /* v0.26: Bottom navigation links */
  .nav-row {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 0.5px solid var(--border);
    display: flex;
    justify-content: space-between;
  }
  .nav-link {
    color: var(--brand);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;
  }
  .nav-link:hover { text-decoration: underline; }
`;
