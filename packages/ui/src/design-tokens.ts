/**
 * @lessjs/ui - Design Tokens (Combined)
 *
 * LessJS Design System: Pure B&W, Swiss International Style.
 *
 * Built on Open Props (https://open-props.style) for consistent design tokens.
 * Custom properties map to LessJS theme system (Dark/Light).
 *
 * Architecture:
 * - L1: CSS custom properties (design tokens)
 * - L3: Lit components consume these tokens
 * - Theme switching via data-theme attribute
 *
 * v0.3.1: Tokens are organized into sub-modules for maintainability:
 *   tokens/spacing.ts   â€” spacing scale, radius, z-index, transitions
 *   tokens/typography.ts â€” font families, sizes, weights, line-height
 *   tokens/colors.ts     â€” dark/light theme color palettes (SINGLE SOURCE OF TRUTH)
 *   tokens/effects.ts    â€” box shadows
 *
 * This file combines all tokens into a single CSSResult for convenience.
 * Import individual token modules if you only need a subset:
 *   import { lessColorTokens } from '@lessjs/ui/tokens/colors';
 *
 * DRY: Page-level CSS can be imported from colors.ts:
 *   import { lessRootColorCSS } from '@lessjs/ui/tokens/colors';
 *   // or: import { lessRootColorCSS } from '@lessjs/ui/design-tokens.js';
 *
 * Usage:
 * ```css
 * .my-component {
 *   background: var(--less-bg-base);
 *   color: var(--less-text-primary);
 *   padding: var(--less-size-4);
 * }
 * ```
 */

import { css, type CSSResult } from 'lit';
import { lessSpacingTokens } from './tokens/spacing.js';
import { lessTypographyTokens } from './tokens/typography.js';
import { lessEffectTokens } from './tokens/effects.js';
import { lessRadiusTokens } from './tokens/radius.js';
import { lessAnimationTokens } from './tokens/animation.js';

/**
 * LessJS Design Tokens CSS (all tokens combined).
 *
 * v0.20.0: Color tokens have moved to `open-props-tokens.ts` (CSSStyleSheet).
 * This combined export remains for backward compatibility with Lit components.
 *
 * These tokens are injected into every LessJS UI component.
 * They provide consistent spacing, colors, typography, and more.
 */
export const lessDesignTokens: CSSResult = css`
  ${lessSpacingTokens} ${lessTypographyTokens} ${lessEffectTokens} ${lessRadiusTokens} ${lessAnimationTokens};
`;

export default lessDesignTokens;
