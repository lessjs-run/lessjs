/**
 * @lessjs/ui - Package Manifest
 *
 * CEM-compatible LessPackageManifest for the @lessjs/ui package.
 * Consumers (adapter-vite) read manifest.declarations to derive
 * island metadata (tagName, module, hydrate, ssr, dsd).
 */

import type { LessPackageManifest } from '@lessjs/core';

export const manifest: LessPackageManifest = {
  schemaVersion: '1.0.0',
  packageName: '@lessjs/ui',
  version: '0.16.0',
  description: 'Swiss International Style Web Component library for LessJS',
  author: 'LessJS',
  license: 'MIT',
  homepage: 'https://lessjs.run',
  repository: 'https://github.com/lessjs-run/lessjs',
  less: {
    adapter: 'lit',
    hasStylesheet: true,
    cssPrefix: 'less',
  },
  declarations: [
    {
      tagName: 'less-theme-toggle',
      className: 'LessThemeToggle',
      superclassName: 'LitElement',
      description: 'Dark/Light theme toggle island',
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
      tagName: 'less-button',
      className: 'LessButton',
      superclassName: 'LitElement',
      description: 'Button with variants (default, primary, ghost)',
      attributes: [
        { name: 'variant', type: 'string', default: '"default"', description: 'Button variant' },
        {
          name: 'disabled',
          type: 'boolean',
          default: 'false',
          description: 'Whether the button is disabled',
        },
        {
          name: 'size',
          type: 'string',
          default: '"medium"',
          description: 'Button size (small, medium, large)',
        },
      ],
      events: [
        { name: 'less-click', type: 'CustomEvent', description: 'Fired on button click' },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'lazy',
        module: '@lessjs/ui/less-button',
        export: 'LessButton',
      },
    },
    {
      tagName: 'less-input',
      className: 'LessInput',
      superclassName: 'LitElement',
      description: 'Input field with label and error states',
      attributes: [
        { name: 'label', type: 'string', description: 'Input label' },
        { name: 'value', type: 'string', default: '""', description: 'Input value' },
        { name: 'type', type: 'string', default: '"text"', description: 'Input type' },
        { name: 'error', type: 'string', description: 'Error message' },
        { name: 'placeholder', type: 'string', description: 'Placeholder text' },
      ],
      events: [
        {
          name: 'less-input',
          type: 'CustomEvent<{ value: string }>',
          description: 'Fired on input change',
        },
      ],
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'lazy',
        module: '@lessjs/ui/less-input',
        export: 'LessInput',
      },
    },
    {
      tagName: 'less-code-block',
      className: 'LessCodeBlock',
      superclassName: 'LitElement',
      description: 'Code block with copy button',
      attributes: [
        {
          name: 'language',
          type: 'string',
          description: 'Programming language for syntax highlighting',
        },
        { name: 'code', type: 'string', description: 'Code content' },
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
      tagName: 'less-layout',
      className: 'LessLayout',
      superclassName: 'LitElement',
      description: 'App layout with header, sidebar, footer',
      slots: [
        { name: '', description: 'Default slot for page content' },
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
    {
      tagName: 'less-hero-ping',
      className: 'LessHeroPing',
      superclassName: 'LitElement',
      description: 'Animated hero ping indicator',
      less: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'lazy',
        module: '@lessjs/ui/less-hero-ping',
        export: 'LessHeroPing',
      },
    },
    {
      tagName: 'less-dialog',
      className: 'LessDialog',
      superclassName: 'LitElement',
      description: 'Modal dialog component',
      attributes: [
        {
          name: 'open',
          type: 'boolean',
          default: 'false',
          description: 'Whether the dialog is open',
        },
        { name: 'label', type: 'string', description: 'Dialog heading' },
      ],
      events: [
        { name: 'less-close', type: 'CustomEvent', description: 'Fired when dialog closes' },
        { name: 'less-confirm', type: 'CustomEvent', description: 'Fired when dialog confirms' },
      ],
      slots: [
        { name: '', description: 'Default slot for dialog content' },
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
  ],
  modules: [
    {
      path: './less-button.js',
      exports: [{ name: 'LessButton', path: './less-button.js' }],
      declarations: ['less-button'],
    },
    {
      path: './less-card.js',
      exports: [{ name: 'LessCard', path: './less-card.js' }],
    },
    {
      path: './less-code-block.js',
      exports: [{ name: 'LessCodeBlock', path: './less-code-block.js' }],
      declarations: ['less-code-block'],
    },
    {
      path: './less-dialog.js',
      exports: [{ name: 'LessDialog', path: './less-dialog.js' }],
      declarations: ['less-dialog'],
    },
    {
      path: './less-hero-ping.js',
      exports: [{ name: 'LessHeroPing', path: './less-hero-ping.js' }],
      declarations: ['less-hero-ping'],
    },
    {
      path: './less-input.js',
      exports: [{ name: 'LessInput', path: './less-input.js' }],
      declarations: ['less-input'],
    },
    {
      path: './less-layout.js',
      exports: [{ name: 'LessLayout', path: './less-layout.js' }],
      declarations: ['less-layout'],
    },
    {
      path: './less-theme-toggle.js',
      exports: [{ name: 'LessThemeToggle', path: './less-theme-toggle.js' }],
      declarations: ['less-theme-toggle'],
    },
  ],
};
