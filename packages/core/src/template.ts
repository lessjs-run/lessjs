/**
 * @lessjs/core - Safe template runtime.
 *
 * A tiny TemplateResult implementation for DsdElement. It is intentionally
 * string-first for SSR and DSD, with runtime descriptors only for event and
 * property binding on the client.
 */

import { escapeAttr, escapeHtml } from './html-escape.ts';

const TEMPLATE_RESULT = Symbol.for('lessjs.templateResult');
const UNSAFE_HTML = Symbol.for('lessjs.unsafeHTML');

export interface SignalLike<T = unknown> {
  readonly value: T;
  subscribe(fn: (value: T) => void): () => void;
}

export type TemplateValue =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined
  | TemplateResult
  | UnsafeHtmlValue
  | SignalLike
  | TemplateValue[]
  | EventListener
  | ((event: Event) => void);

export interface TemplateResult {
  readonly kind: 'less:template-result';
  readonly strings: readonly string[];
  readonly values: readonly TemplateValue[];
  readonly [TEMPLATE_RESULT]: true;
}

export interface UnsafeHtmlValue {
  readonly kind: 'less:unsafe-html';
  readonly html: string;
  readonly [UNSAFE_HTML]: true;
}

export interface RuntimeEventBinding {
  index: number;
  eventName: string;
  handler: EventListener | ((event: Event) => void);
}

export interface RuntimePropertyBinding {
  index: number;
  propertyName: string;
  value: unknown;
}

export interface RuntimeTemplateBindings {
  events: RuntimeEventBinding[];
  properties: RuntimePropertyBinding[];
}

interface BindingInfo {
  prefix: string;
  sigil: '@' | '.' | '?' | '';
  name: string;
  quoted: '"' | "'" | '';
}

export function html(
  strings: TemplateStringsArray | readonly string[],
  ...values: TemplateValue[]
): TemplateResult {
  return {
    kind: 'less:template-result',
    strings: Array.from(strings),
    values,
    [TEMPLATE_RESULT]: true,
  };
}

export function unsafeHTML(value: string): UnsafeHtmlValue {
  return {
    kind: 'less:unsafe-html',
    html: String(value),
    [UNSAFE_HTML]: true,
  };
}

export function isTemplateResult(value: unknown): value is TemplateResult {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as Record<PropertyKey, unknown>)[TEMPLATE_RESULT] === true,
  );
}

export function isUnsafeHTML(value: unknown): value is UnsafeHtmlValue {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as Record<PropertyKey, unknown>)[UNSAFE_HTML] === true,
  );
}

export function isSignalLike(value: unknown): value is SignalLike {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'value' in value &&
      typeof (value as { subscribe?: unknown }).subscribe === 'function',
  );
}

export function renderTemplateToString(
  result: TemplateResult,
  options: { runtimeMarkers?: boolean } = {},
): string {
  let output = '';
  let stripNextQuote: '"' | "'" | '' = '';
  let bindingIndex = 0;

  for (let i = 0; i < result.values.length; i++) {
    let chunk = result.strings[i] ?? '';
    if (stripNextQuote && chunk.startsWith(stripNextQuote)) {
      chunk = chunk.slice(1);
      stripNextQuote = '';
    }

    const value = result.values[i];
    const binding = detectBinding(chunk);
    if (binding) {
      output += binding.prefix;
      stripNextQuote = binding.quoted;
      output += renderBinding(bindingIndex, binding, value, options.runtimeMarkers === true);
      bindingIndex++;
      continue;
    }

    output += chunk;
    // v0.21: wrap signal text values in data-less-b markers for fine-grained patching
    if (options.runtimeMarkers && isSignalLike(value)) {
      output += `<span data-less-b="${bindingIndex}">${renderValue(value, 'text')}</span>`;
      bindingIndex++;
    } else {
      output += renderValue(value, 'text');
    }
  }

  let tail = result.strings[result.strings.length - 1] ?? '';
  if (stripNextQuote && tail.startsWith(stripNextQuote)) {
    tail = tail.slice(1);
  }
  return output + tail;
}

export function collectRuntimeTemplateBindings(result: TemplateResult): RuntimeTemplateBindings {
  const events: RuntimeEventBinding[] = [];
  const properties: RuntimePropertyBinding[] = [];

  for (let i = 0; i < result.values.length; i++) {
    const binding = detectBinding(result.strings[i] ?? '');
    if (!binding) continue;
    const value = resolveSignalValue(result.values[i]);
    if (binding.sigil === '@' && typeof value === 'function') {
      events.push({ index: i, eventName: binding.name, handler: value as EventListener });
    } else if (binding.sigil === '.') {
      properties.push({ index: i, propertyName: binding.name, value });
    }
  }

  return { events, properties };
}

export function applyRuntimeTemplateBindings(
  root: ParentNode,
  result: TemplateResult,
  host: EventTarget,
  signal?: AbortSignal,
): void {
  const bindings = collectRuntimeTemplateBindings(result);

  for (const binding of bindings.events) {
    const marker = `data-less-event-${binding.index}`;
    const elements = root.querySelectorAll(`[${marker}]`);
    for (const element of elements) {
      element.removeAttribute(marker);
      element.addEventListener(
        binding.eventName,
        ((event: Event) => binding.handler.call(host, event)) as EventListener,
        signal ? { signal } : undefined,
      );
    }
  }

  for (const binding of bindings.properties) {
    const marker = `data-less-prop-${binding.index}`;
    const elements = root.querySelectorAll(`[${marker}]`);
    for (const element of elements) {
      element.removeAttribute(marker);
      (element as unknown as Record<string, unknown>)[binding.propertyName] = binding.value;
    }
  }
}

export function collectTemplateSignals(result: TemplateResult): SignalLike[] {
  const signals: SignalLike[] = [];
  const seen = new Set<SignalLike>();

  const visit = (value: TemplateValue): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (isTemplateResult(value)) {
      for (const item of value.values) visit(item);
      return;
    }
    if (isSignalLike(value) && !seen.has(value)) {
      seen.add(value);
      signals.push(value);
    }
  };

  for (const value of result.values) visit(value);
  return signals;
}

function renderBinding(
  index: number,
  binding: BindingInfo,
  value: TemplateValue,
  runtimeMarkers: boolean,
): string {
  if (binding.sigil === '@') {
    return runtimeMarkers ? `data-less-event-${index}` : '';
  }

  if (binding.sigil === '.') {
    return runtimeMarkers ? `data-less-prop-${index}` : '';
  }

  if (binding.sigil === '?') {
    return isTruthyTemplateValue(value) ? binding.name : '';
  }

  const resolved = resolveSignalValue(value);
  const escaped = binding.name === 'href' || binding.name === 'src' ||
      binding.name.endsWith(':href')
    ? escapeAttr(sanitizeUrl(String(resolved ?? '')))
    : renderValue(resolved as TemplateValue, 'attribute');
  return `${binding.name}="${escaped}"`;
}

function renderValue(value: TemplateValue, context: 'text' | 'attribute'): string {
  const resolved = resolveSignalValue(value);
  if (resolved === null || resolved === undefined || typeof resolved === 'function') return '';
  if (Array.isArray(resolved)) {
    return resolved.map((item) => renderValue(item, context)).join('');
  }
  if (isTemplateResult(resolved)) {
    return renderTemplateToString(resolved);
  }
  if (isUnsafeHTML(resolved)) {
    return context === 'attribute' ? escapeAttr(resolved.html) : resolved.html;
  }
  const str = String(resolved);
  return context === 'attribute' ? escapeAttr(str) : escapeHtml(str);
}

function resolveSignalValue(value: TemplateValue): TemplateValue | unknown {
  return isSignalLike(value) ? value.value : value;
}

function isTruthyTemplateValue(value: TemplateValue): boolean {
  const resolved = resolveSignalValue(value);
  return Boolean(resolved);
}

function detectBinding(chunk: string): BindingInfo | undefined {
  const match = /(^|[\s<])([@.?]?)([A-Za-z_][\w:.-]*)\s*=\s*(["']?)$/.exec(chunk);
  if (!match?.index && match?.index !== 0) return undefined;
  const sigil = (match[2] || '') as BindingInfo['sigil'];
  const name = match[3];
  return {
    prefix: chunk.slice(0, match.index) + match[1],
    sigil,
    name,
    quoted: (match[4] || '') as BindingInfo['quoted'],
  };
}

function sanitizeUrl(value: string): string {
  const trimmed = Array.from(value.replace(/\s+/g, ''))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 0x1f && code !== 0x7f;
    })
    .join('')
    .trim();
  if (!trimmed) return '';
  if (/^(https?:|mailto:|tel:|\/|\.\/|\.\.\/|#|\?)/i.test(trimmed)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return '#';
  return value;
}
