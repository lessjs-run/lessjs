/**
 * @openelement/ui - LessJS UI Component Library
 *
 * Swiss International Style: Pure B&W, minimal, typography-driven.
 * Zero Lit dependency - built on DsdElement (native HTMLElement).
 *
 * Components:
 * - open-button: Button with variants (default, primary, ghost, accent)
 * - open-card: Card container with optional header/footer
 * - open-input: Input field with label and error states
 * - open-code-block: Code block with copy button
 * - open-layout: App layout with header, sidebar, footer
 * - open-theme-toggle: Theme toggle Island (Dark/Light)
 * - open-dialog: Dialog component using native <dialog>
 * - open-callout: Callout/notice box (info/warning/danger/tip)
 * - open-step-card: Step card with numbered indicator
 * - open-hero-ping: Hero ping Island (API health check)
 *
 * Usage:
 * ```ts
 * // Import all components
 * import '@openelement/ui';
 *
 * // Or import specific components
 * import { LessButton } from '@openelement/ui/open-button';
 * ```
 *
 * @module @openelement/ui
 */

// Design tokens (CSSStyleSheet, zero Lit dependency)
export { openPropsTokenSheet } from './open-props-tokens.js';

// Components
export { OpenButton, tagName as openButtonTagName } from './open-button.js';
export { OpenCard, tagName as openCardTagName } from './open-card.js';
export { OpenInput, tagName as openInputTagName } from './open-input.js';
export { OpenCodeBlock, tagName as openCodeBlockTagName } from './open-code-block.js';
export { OpenLayout, tagName as openLayoutTagName } from './open-layout.js';
export type { HeaderNavLink, NavItem, NavSection } from './open-layout.js';
export { OpenThemeToggle, tagName as openThemeToggleTagName } from './open-theme-toggle.js';
export { default as OpenHeroPing, tagName as openHeroPingTagName } from './open-hero-ping.js';
export { OpenDialog, tagName as openDialogTagName } from './open-dialog.js';
export { OpenCallout, tagName as openCalloutTagName } from './open-callout.js';
export { OpenStepCard, tagName as openStepCardTagName } from './open-step-card.js';

// Package manifest (WC Package Protocol)
// Consumers (adapter-vite) read manifest.declarations to derive island metadata.
export { manifest } from './manifest.js';
