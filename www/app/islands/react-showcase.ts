/**
 * React Showcase — React adapter demo
 *
 * Renders React components through @lessjs/adapter-react's DSD pipeline.
 * Uses React createElement with professional inline styles to demonstrate
 * that React components render correctly in Declarative Shadow DOM.
 *
 * Architecture:
 * - SSR: render() returns a React element. The React adapter's isTemplate()
 *   detects it and converts to HTML via ReactDOMServer.renderToStaticMarkup().
 * - Client: WithDsdHydration mixin detects DSD-pre-populated shadow root
 *   and mounts React tree via createRoot() for interactivity.
 *
 * SSR Safety: This module is imported by route components, so it evaluates
 * in the SSR module runner where globalThis.HTMLElement may be undefined.
 * We use a safe base class pattern — if HTMLElement is unavailable, we fall
 * back to a plain class that won't crash at module evaluation time. The SSR
 * admission plan marks this island as renderable (ssr: true by default), so
 * the SSR bundle will have the Lit SSR dom-shim providing HTMLElement.
 *
 * @lessjs/app island — auto-detected and SSR'd by adapter-vite.
 */
import { createElement, type ReactNode } from 'react';
import { WithDsdHydration } from '@lessjs/adapter-react';

// ── Design tokens (mimics a modern design system) ──
const colors = {
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  success: '#10b981',
  successHover: '#059669',
  warning: '#f59e0b',
  warningHover: '#d97706',
  danger: '#ef4444',
};

function Button({
  children,
  color = 'primary',
}: {
  children?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const bg = colors[color];
  const bgHover = (colors as Record<string, string>)[`${color}Hover`];
  return createElement('button', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: '32px',
      padding: '0 14px',
      borderRadius: '6px',
      border: 'none',
      background: bg,
      color: '#fff',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background 0.15s',
      fontFamily: 'inherit',
    },
    onMouseEnter: (e: Event) => {
      (e.target as HTMLElement).style.background = bgHover;
    },
    onMouseLeave: (e: Event) => {
      (e.target as HTMLElement).style.background = bg;
    },
  }, children);
}

function Badge({ children, color = 'primary' }: { children?: ReactNode; color?: string }) {
  const bg = color === 'danger' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)';
  const c = color === 'danger' ? '#ef4444' : '#6366f1';
  return createElement('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: '22px',
      padding: '0 8px',
      borderRadius: '10px',
      background: bg,
      color: c,
      fontSize: '11px',
      fontWeight: 600,
      fontFamily: 'inherit',
    },
  }, children);
}

function Alert({
  type = 'info',
  children,
}: {
  type?: 'info' | 'success' | 'warning';
  children?: ReactNode;
}) {
  const cfg: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    info: { bg: 'rgba(99,102,241,0.1)', border: '#6366f1', color: '#a5b4fc', icon: '⚡' },
    success: { bg: 'rgba(16,185,129,0.1)', border: '#10b981', color: '#6ee7b7', icon: '✓' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', color: '#fcd34d', icon: '⚠' },
  };
  const s = cfg[type];
  return createElement(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '6px',
        background: s.bg,
        borderLeft: `3px solid ${s.border}`,
        color: s.color,
        fontSize: '12px',
        lineHeight: 1.5,
        fontFamily: 'inherit',
      },
    },
    createElement('span', null, s.icon),
    children,
  );
}

// SSR-safe base class: WithDsdHydration(HTMLElement) requires HTMLElement
// to be defined. In SSR dev mode, @lit-labs/ssr-dom-shim provides it.
// But the SSR module runner may evaluate this module before the shim is loaded.
// Fallback to a plain class to avoid "Class extends value undefined" crash.
const ReactShowcaseBase = typeof globalThis.HTMLElement !== 'undefined'
  ? WithDsdHydration(globalThis.HTMLElement)
  : class {};

export const tagName = 'react-showcase';

export default class ReactShowcase extends ReactShowcaseBase {
  // React adapter: render() returns a React element.
  // The pipeline detects it via isTemplate() and converts via
  // ReactDOMServer.renderToStaticMarkup().
  render(): ReactNode {
    return createElement(
      'div',
      { style: { fontFamily: 'system-ui, -apple-system, sans-serif' } },
      createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
        createElement(
          'div',
          { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' } },
          createElement(Button, { color: 'primary' }, 'Primary'),
          createElement(Button, { color: 'success' }, 'Success'),
          createElement(Button, { color: 'warning' }, 'Warning'),
          createElement(Badge, { color: 'danger' }, 'React 19'),
        ),
        createElement(
          Alert,
          { type: 'info' },
          'React — rendered via @lessjs/adapter-react DSD pipeline (ReactDOMServer → Declarative Shadow DOM)',
        ),
      ),
    );
  }
}

// Guard: idempotent across SSR paths
try {
  customElements.define(tagName, ReactShowcase);
} catch { /* already defined */ }
