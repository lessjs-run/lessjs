/**
 * @lessjs/ui - Design Tokens: Color Values
 *
 * Pure data — color token values for LessJS themes.
 * ZERO dependencies (no lit, no framework).
 *
 * This file is the SINGLE SOURCE OF TRUTH for all color token values.
 * Both the Lit CSSResult module (colors.ts) and the SSG post-processor
 * (ssg-postprocess.ts) import from here — no more duplicated hard-coded strings.
 *
 * Token naming: --less-{category}-{variant}
 * Values reference OpenProps CSS variables (loaded via CDN at runtime).
 * See: https://open-props.style/#colors
 *
 * Do NOT edit CSS strings elsewhere — edit the values below.
 */

/** Dark theme color values */
export const lessDarkColors = {
  '--less-bg-base': 'var(--gray-12)',
  '--less-bg-surface': 'var(--gray-11)',
  '--less-bg-elevated': 'var(--gray-10)',
  '--less-bg-hover': 'var(--gray-11)',
  '--less-bg-card': 'var(--gray-11)',
  '--less-border': 'var(--gray-9)',
  '--less-border-hover': 'var(--gray-8)',
  '--less-text-primary': 'var(--gray-0)',
  '--less-text-secondary': 'var(--gray-5)',
  '--less-text-tertiary': 'var(--gray-7)',
  '--less-text-muted': 'var(--gray-8)',
  '--less-accent': 'var(--gray-0)',
  '--less-accent-dim': 'var(--gray-4)',
  '--less-accent-subtle': 'var(--gray-11)',
  '--less-brand': '#534AB7',
  '--less-brand-subtle': '#EEEDFE',
  '--less-code-bg': 'var(--gray-10)',
  '--less-code-border': 'var(--gray-9)',
  '--less-error': 'var(--red-4)',
  '--less-scrollbar-track': 'transparent',
  '--less-scrollbar-thumb': 'var(--gray-9)',
} as const;

/** Light theme color values */
export const lessLightColors = {
  '--less-bg-base': 'var(--gray-0)',
  '--less-bg-surface': 'var(--gray-1)',
  '--less-bg-elevated': 'var(--gray-2)',
  '--less-bg-hover': 'var(--gray-2)',
  '--less-bg-card': 'var(--gray-0)',
  '--less-border': 'var(--gray-3)',
  '--less-border-hover': 'var(--gray-4)',
  '--less-text-primary': 'var(--gray-12)',
  '--less-text-secondary': 'var(--gray-8)',
  '--less-text-tertiary': 'var(--gray-7)',
  '--less-text-muted': 'var(--gray-6)',
  '--less-accent': 'var(--gray-12)',
  '--less-accent-dim': 'var(--gray-8)',
  '--less-accent-subtle': 'var(--gray-2)',
  '--less-brand': '#534AB7',
  '--less-brand-subtle': '#EEEDFE',
  '--less-code-bg': 'var(--gray-2)',
  '--less-code-border': 'var(--gray-3)',
  '--less-error': 'var(--red-7)',
  '--less-scrollbar-track': 'transparent',
  '--less-scrollbar-thumb': 'var(--gray-4)',
} as const;

// ─── CSS Generators ────────────────────────────────────────────

/** Generate CSS declarations string from a values object */
export function declarations(values: Readonly<Record<string, string>>): string {
  return Object.entries(values)
    .map(([prop, value]) => `${prop}:${value}`)
    .join(';');
}

/**
 * Generate page-level CSS for :root injection.
 *
 * Includes inline gray scale values so color tokens resolve immediately
 * without waiting for OpenProps CDN (prevents black flash on iOS dark mode).
 *
 * Output format:
 *   :root,[data-theme="light"]{--gray-0:#f8f9fa;...;--less-bg-base:var(--gray-0);...;color-scheme:light}
 *   [data-theme="dark"]{--gray-12:#030507;...;--less-bg-base:var(--gray-12);...;color-scheme:dark}
 *
 * Use in vite.config.ts `inject.headFragments` or SSG post-processing.
 */
export function generateRootColorCSS(): string {
  // OpenProps gray scale — inlined to avoid CDN dependency for first paint
  const grayScaleLight = [
    '--gray-0:#f8f9fa',
    '--gray-1:#f1f3f5',
    '--gray-2:#e9ecef',
    '--gray-3:#dee2e6',
    '--gray-4:#ced4da',
    '--gray-5:#adb5bd',
    '--gray-6:#868e96',
    '--gray-7:#495057',
    '--gray-8:#343a40',
    '--gray-9:#212529',
    '--gray-10:#16191d',
    '--gray-11:#0d0f12',
    '--gray-12:#030507',
  ].join(';');

  // Dark mode: inverted gray scale for sufficient contrast on dark backgrounds
  // WCAG 4.5:1 minimum contrast ratio enforced for text on #0d0f12 backgrounds
  const grayScaleDark = [
    '--gray-0:#030507',
    '--gray-1:#0d0f12',
    '--gray-2:#16191d',
    '--gray-3:#212529',
    '--gray-4:#343a40',
    '--gray-5:#5a6270',
    '--gray-6:#868e96',
    '--gray-7:#a0a8b4',
    '--gray-8:#adb5bd',
    '--gray-9:#ced4da',
    '--gray-10:#dee2e6',
    '--gray-11:#e9ecef',
    '--gray-12:#f8f9fa',
  ].join(';');

  return `:root,[data-theme="light"]{${grayScaleLight};${
    declarations(lessLightColors)
  };color-scheme:light}[data-theme="dark"]{${grayScaleDark};${
    declarations(lessDarkColors)
  };color-scheme:dark}`;
}
