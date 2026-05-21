/**
 * @lessjs/ui - Package Manifest
 *
 * CEM-compatible LessPackageManifest for the @lessjs/ui package.
 * Consumers (adapter-vite) read manifest.declarations to derive
 * island metadata (tagName, module, hydrate, ssr, dsd).
 *
 * v0.20.0: Ocean components use DsdElement (zero framework).
 *   less-hero-ping remains LitElement (Island component).
 */

import type { LessPackageManifest } from '@lessjs/core';

export const manifest: LessPackageManifest = {
  schemaVersion: '1.0.0',
  packageName: '@lessjs/ui',
  version: '0.20.0',
  description: 'Swiss International Style Web Component library for LessJS',
  author: 'LessJS',
  license: 'MIT',
  homepage: 'https://lessjs.run',
  repository: 'https://github.com/lessjs-run/lessjs',
  less: {
    adapter: 'vanilla', // v0.20.0: DSD components use DsdElement (zero framework)
    hasStylesheet: true,
    cssPrefix: 'less',
  },
  declarations: [
    // â”€â”€ Ocean (DSD, DsdElement) â”€â”€
    {
      tagName: 'less-card',
      className: 'LessCard',
      superclassName: 'DsdElement',
      description: 'Card container with header and footer slots',
      attributes: [
        { name: 'variant', type: 'string', default: '"default"', description: 'Card variant (default, elevated, borderless)' },
      ],
      slots: [
        { name: '', description: 'Default slot for card content' },
        { name: 'header', description: 'Header slot' },
        { name: 'footer', description: 'Footer slot' },
      ],
      cssParts: [
        { name: 'container', description: 'The article wrapper' },
        { name: 'body', description: 'The card content area' },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'lazy',
        module: '@lessjs/ui/less-card',
        export: 'LessCard',
      },
    },
    {
      tagName: 'less-callout',
      className: 'LessCallout',
      superclassName: 'DsdElement',
      description: 'Callout notice box (info, warning, danger, tip)',
      attributes: [
        { name: 'type', type: 'string', default: '"info"', description: 'Callout type' },
        { name: 'label', type: 'string', description: 'Callout heading label' },
      ],
      cssParts: [
        { name: 'container', description: 'The callout wrapper' },
        { name: 'icon', description: 'The type icon span' },
        { name: 'content', description: 'The body content area' },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'lazy',
        module: '@lessjs/ui/less-callout',
        export: 'LessCallout',
      },
    },
    {
      tagName: 'less-step-card',
      className: 'LessStepCard',
      superclassName: 'DsdElement',
      description: 'Step card with numbered indicator',
      attributes: [
        { name: 'step', type: 'number', default: '1', description: 'Step number' },
        { name: 'label', type: 'string', description: 'Step label' },
        { name: 'description', type: 'string', description: 'Step description' },
        { name: 'status', type: 'string', description: 'Step status (completed, active, pending)' },
      ],
      cssParts: [
        { name: 'container', description: 'The step card wrapper' },
        { name: 'indicator', description: 'The step number circle' },
        { name: 'title', description: 'The step label heading' },
        { name: 'content', description: 'The slot content area' },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'lazy',
        module: '@lessjs/ui/less-step-card',
        export: 'LessStepCard',
      },
    },
    {
      tagName: 'less-button',
      className: 'LessButton',
      superclassName: 'DsdElement',
      description: 'Button with variants (default, primary, ghost, accent)',
      attributes: [
        { name: 'variant', type: 'string', default: '"default"', description: 'Button variant' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether disabled' },
        { name: 'size', type: 'string', default: '"md"', description: 'Button size (sm, md, lg)' },
        { name: 'href', type: 'string', description: 'Link URL (renders as anchor)' },
      ],
      events: [
        { name: 'less-click', type: 'CustomEvent', description: 'Fired on button click' },
      ],
      cssParts: [
        { name: 'control', description: 'The button or anchor element' },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'eager',
        module: '@lessjs/ui/less-button',
        export: 'LessButton',
      },
    },
    {
      tagName: 'less-input',
      className: 'LessInput',
      superclassName: 'DsdElement',
      description: 'Input field with label and error states',
      attributes: [
        { name: 'label', type: 'string', description: 'Input label' },
        { name: 'value', type: 'string', default: '""', description: 'Input value' },
        { name: 'type', type: 'string', default: '"text"', description: 'Input type' },
        { name: 'error', type: 'string', description: 'Error message' },
        { name: 'placeholder', type: 'string', description: 'Placeholder text' },
        { name: 'disabled', type: 'boolean', description: 'Disabled state' },
      ],
      events: [
        { name: 'less-input', type: 'CustomEvent<{ value: string }>', description: 'Fired on input change' },
      ],
      cssParts: [
        { name: 'wrapper', description: 'The outer wrapper div' },
        { name: 'label', description: 'The label element' },
        { name: 'control', description: 'The input element' },
        { name: 'error', description: 'The error message element' },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'eager',
        module: '@lessjs/ui/less-input',
        export: 'LessInput',
      },
    },
    {
      tagName: 'less-theme-toggle',
      className: 'LessThemeToggle',
      superclassName: 'DsdElement',
      description: 'Dark/Light theme toggle',
      attributes: [
        { name: 'theme', type: 'string', description: 'Initial theme (light/dark)' },
      ],
      cssParts: [
        { name: 'toggle', description: 'The button element' },
        { name: 'icon-sun', description: 'The sun SVG icon' },
        { name: 'icon-moon', description: 'The moon SVG icon' },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'eager',
        module: '@lessjs/ui/less-theme-toggle',
        export: 'LessThemeToggle',
      },
    },
    {
      tagName: 'less-code-block',
      className: 'LessCodeBlock',
      superclassName: 'DsdElement',
      description: 'Code block with syntax highlighting and copy button',
      cssParts: [
        { name: 'container', description: 'The code-block wrapper' },
        { name: 'copy', description: 'The copy button' },
        { name: 'body', description: 'The pre/code area' },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'lazy',
        module: '@lessjs/ui/less-code-block',
        export: 'LessCodeBlock',
      },
    },
    {
      tagName: 'less-dialog',
      className: 'LessDialog',
      superclassName: 'DsdElement',
      description: 'Modal dialog component using native <dialog>',
      attributes: [
        { name: 'open', type: 'boolean', default: 'false', description: 'Whether the dialog is open' },
        { name: 'label', type: 'string', description: 'Dialog heading' },
      ],
      events: [
        { name: 'less-dialog-close', type: 'CustomEvent', description: 'Fired when dialog closes' },
      ],
      slots: [
        { name: '', description: 'Default slot for dialog content' },
        { name: 'trigger', description: 'Click target to open the dialog' },
        { name: 'footer', description: 'Footer slot for action buttons' },
      ],
      cssParts: [
        { name: 'overlay', description: 'The dialog element (backdrop)' },
        { name: 'dialog', description: 'The dialog container' },
        { name: 'header', description: 'The header bar' },
        { name: 'close', description: 'The close button' },
        { name: 'body', description: 'The content area' },
        { name: 'footer', description: 'The footer area' },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'lazy',
        module: '@lessjs/ui/less-dialog',
        export: 'LessDialog',
      },
    },
    {
      tagName: 'less-layout',
      className: 'LessLayout',
      superclassName: 'DsdElement',
      description: 'App layout with header, sidebar, footer, and SPA navigation',
      attributes: [
        { name: 'current-path', type: 'string', description: 'Current URL path' },
        { name: 'nav-items', type: 'array', description: 'Sidebar navigation sections' },
        { name: 'header-nav', type: 'array', description: 'Header navigation links' },
        { name: 'logo-text', type: 'string', default: '"LessJS"', description: 'Logo text' },
        { name: 'home', type: 'boolean', description: 'Home page layout (no sidebar)' },
      ],
      slots: [
        { name: '', description: 'Default slot for page content' },
        { name: 'header-actions', description: 'Header right-side actions (e.g. search)' },
      ],
      cssParts: [
        { name: 'container', description: 'The app-layout root div' },
        { name: 'header', description: 'The sticky header' },
        { name: 'sidebar', description: 'The docs-sidebar nav' },
        { name: 'main', description: 'The layout-main element' },
        { name: 'footer', description: 'The app-footer element' },
        { name: 'nav', description: 'The header-nav element' },
        { name: 'nav-toggle', description: 'The mobile menu toggle button' },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'eager',
        module: '@lessjs/ui/less-layout',
        export: 'LessLayout',
      },
    },
    // â”€â”€ Island (Lit, kept for reactivity) â”€â”€
    {
      tagName: 'less-hero-ping',
      className: 'LessHeroPing',
      superclassName: 'LitElement', // v0.20.0: Island component â€” retains Lit
      description: 'Animated hero ping indicator (Island)',
      cssParts: [
        { name: 'dot-static', description: 'The static status dot' },
        { name: 'dot-animated', description: 'The animated ping dot' },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'lazy',
        module: '@lessjs/ui/less-hero-ping',
        export: 'LessHeroPing',
      },
    },
  ],
  modules: [
    { path: './less-button.js', exports: [{ name: 'LessButton', path: './less-button.js' }], declarations: ['less-button'] },
    { path: './less-card.js', exports: [{ name: 'LessCard', path: './less-card.js' }], declarations: ['less-card'] },
    { path: './less-callout.js', exports: [{ name: 'LessCallout', path: './less-callout.js' }], declarations: ['less-callout'] },
    { path: './less-step-card.js', exports: [{ name: 'LessStepCard', path: './less-step-card.js' }], declarations: ['less-step-card'] },
    { path: './less-code-block.js', exports: [{ name: 'LessCodeBlock', path: './less-code-block.js' }], declarations: ['less-code-block'] },
    { path: './less-dialog.js', exports: [{ name: 'LessDialog', path: './less-dialog.js' }], declarations: ['less-dialog'] },
    { path: './less-hero-ping.js', exports: [{ name: 'LessHeroPing', path: './less-hero-ping.js' }], declarations: ['less-hero-ping'] },
    { path: './less-input.js', exports: [{ name: 'LessInput', path: './less-input.js' }], declarations: ['less-input'] },
    { path: './less-layout.js', exports: [{ name: 'LessLayout', path: './less-layout.js' }], declarations: ['less-layout'] },
    { path: './less-theme-toggle.js', exports: [{ name: 'LessThemeToggle', path: './less-theme-toggle.js' }], declarations: ['less-theme-toggle'] },
  ],
};
