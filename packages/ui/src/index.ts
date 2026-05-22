/**
 * @lessjs/ui - LessJS UI Component Library
 *
 * Swiss International Style: Pure B&W, minimal, typography-driven.
 * Zero Lit dependency - built on DsdElement (native HTMLElement).
 *
 * Components:
 * - less-button: Button with variants (default, primary, ghost, accent)
 * - less-card: Card container with optional header/footer
 * - less-input: Input field with label and error states
 * - less-code-block: Code block with copy button
 * - less-layout: App layout with header, sidebar, footer
 * - less-theme-toggle: Theme toggle Island (Dark/Light)
 * - less-dialog: Dialog component using native <dialog>
 * - less-callout: Callout/notice box (info/warning/danger/tip)
 * - less-step-card: Step card with numbered indicator
 * - less-hero-ping: Hero ping Island (API health check)
 *
 * Usage:
 * ```ts
 * // Import all components
 * import '@lessjs/ui';
 *
 * // Or import specific components
 * import { LessButton } from '@lessjs/ui/less-button';
 * ```
 *
 * @module @lessjs/ui
 */

// Design tokens (CSSStyleSheet, zero Lit dependency)
export { openPropsTokenSheet } from './open-props-tokens.js';

// Components
export { LessButton, tagName as lessButtonTagName } from './less-button.js';
export { LessCard, tagName as lessCardTagName } from './less-card.js';
export { LessInput, tagName as lessInputTagName } from './less-input.js';
export { LessCodeBlock, tagName as lessCodeBlockTagName } from './less-code-block.js';
export { LessLayout, tagName as lessLayoutTagName } from './less-layout.js';
export type { HeaderNavLink, NavItem, NavSection } from './less-layout.js';
export { LessThemeToggle, tagName as lessThemeToggleTagName } from './less-theme-toggle.js';
export { default as LessHeroPing, tagName as lessHeroPingTagName } from './less-hero-ping.js';
export { LessDialog, tagName as lessDialogTagName } from './less-dialog.js';
export { LessCallout, tagName as lessCalloutTagName } from './less-callout.js';
export { LessStepCard, tagName as lessStepCardTagName } from './less-step-card.js';

// Package manifest (WC Package Protocol)
// Consumers (adapter-vite) read manifest.declarations to derive island metadata.
export { manifest } from './manifest.js';
