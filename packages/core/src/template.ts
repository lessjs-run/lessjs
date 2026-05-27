/**
 * @lessjs/core - Safe template runtime.
 *
 * A tiny TemplateResult implementation for DsdElement. It is intentionally
 * string-first for SSR and DSD, with runtime descriptors only for event and
 * property binding on the client.
 *
 * v0.24 (SOP-009): Template caching via WeakMap, type-narrowed
 * template values, and directives (classMap/when/choose/repeat/ref).
 */
import { escapeAttr, escapeHtml } from './html-escape.ts';

// ─── Symbols ────────────────────────────────────────────────────────

const TEMPLATE_RESULT = Symbol.for('lessjs.templateResult');
const UNSAFE_HTML = Symbol.for('lessjs.unsafeHTML');
const CLASS_MAP = Symbol.for('lessjs.classMap');

// ─── Types ──────────────────────────────────────────────────────────

export interface SignalLike<T = unknown> {
  readonly value: T;
  subscribe(fn: (value: T) => void): () => void;
}

/** Value usable in attribute position (class, id, style, etc.) */
export type AttrValue = string | number | boolean | null | undefined | SignalLike;

/** Value usable in text content / child position */
export type ContentValue =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined
  | TemplateResult
  | UnsafeHtmlValue
  | SignalLike
  | ClassMapValue
  | RefDirective
  | ContentValue[];

/** Value usable in event binding position (@click, @input, etc.) */
export type EventValue = EventListener | ((event: Event) => void) | SignalLike<EventListener>;

/** Union of all value types accepted by html`` template (backward compat) */
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
  | ClassMapValue
  | RefDirective
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

/** Value produced by `classMap()`. Rendered as space-separated tokens. */
export interface ClassMapValue {
  readonly kind: 'less:class-map';
  readonly tokens: ReadonlyMap<string, boolean>;
  readonly [CLASS_MAP]: true;
}

/** Value produced by `ref()`. Directs the template engine to call a callback. */
export interface RefDirective {
  readonly kind: 'less:ref';
  readonly callback: (element: Element) => void;
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

// ─── Template Caching ────────────────────────────────────────────────

/** Pre-parsed slot descriptors for static parts of a template. */
interface ParsedSlot {
  /** Index into the values array */
  index: number;
  /** Binding info if this slot is a directive (@, ., ?) */
  binding?: BindingInfo;
  /** The static text prefix before this slot */
  prefix: string;
  /** Whether this slot is a text content slot (not an attribute binding) */
  isText: boolean;
}

interface ParsedTemplate {
  /** Pre-parsed slots for each value position (in order) */
  slots: ParsedSlot[];
  /** Final static tail string after the last value */
  tail: string;
  /** Length of values array this parse was built for */
  valueCount: number;
}

const templateCache = new WeakMap<TemplateStringsArray, ParsedTemplate>();

function parseTemplate(strings: readonly string[], valueCount: number): ParsedTemplate {
  const slots: ParsedSlot[] = [];
  let stripNextQuote: '"' | "'" | '' = '';

  for (let i = 0; i < valueCount; i++) {
    let chunk = strings[i] ?? '';
    if (stripNextQuote && chunk.startsWith(stripNextQuote)) {
      chunk = chunk.slice(1);
      stripNextQuote = '';
    }

    const binding = detectBinding(chunk);

    if (binding) {
      slots.push({
        index: i,
        binding,
        prefix: binding.prefix,
        isText: false,
        ...(binding.quoted ? {} : {}),
      });
      stripNextQuote = binding.quoted;
    } else {
      slots.push({
        index: i,
        prefix: chunk,
        isText: true,
      });
    }
  }

  let tail = strings[valueCount] ?? '';
  if (stripNextQuote && tail.startsWith(stripNextQuote)) {
    tail = tail.slice(1);
  }

  return { slots, tail, valueCount };
}

function getOrParseTemplate(result: TemplateResult): ParsedTemplate {
  const strings = result.strings as TemplateStringsArray;
  let parsed = templateCache.get(strings);
  if (parsed && parsed.valueCount === result.values.length) {
    return parsed;
  }
  parsed = parseTemplate(result.strings, result.values.length);
  templateCache.set(strings, parsed);
  return parsed;
}

// ─── ClassMap ────────────────────────────────────────────────────────

export interface ClassMapInput {
  [className: string]: boolean | undefined | null;
}

export function classMap(classes: ClassMapInput): ClassMapValue {
  const entries: [string, boolean][] = [];
  for (const key of Object.keys(classes)) {
    const v = classes[key];
    if (v != null) entries.push([key, Boolean(v)]);
  }
  return {
    kind: 'less:class-map',
    tokens: new Map(entries),
    [CLASS_MAP]: true,
  };
}

function renderClassMapValue(classes: ClassMapValue): string {
  const active: string[] = [];
  for (const [name, enabled] of classes.tokens) {
    if (enabled) active.push(name);
  }
  return active.join(' ');
}

// ─── When / Choose ────────────────────────────────────────────────────

export function when(
  condition: unknown,
  truthy: TemplateResult | (() => TemplateResult),
  falsy?: TemplateResult | (() => TemplateResult),
): TemplateResult {
  const resolved = condition;
  if (resolved) {
    return typeof truthy === 'function' ? truthy() : truthy;
  }
  return falsy ? (typeof falsy === 'function' ? falsy() : falsy) : html`

  `;
}

export type ChooseCase = readonly [key: string, template: () => TemplateResult];

export function choose(
  key: string,
  cases: readonly ChooseCase[],
  fallback?: () => TemplateResult,
): TemplateResult {
  for (const [caseKey, template] of cases) {
    if (caseKey === key) return template();
  }
  return fallback ? fallback() : html`

  `;
}

// ─── Repeat ───────────────────────────────────────────────────────────

export function repeat<T>(
  items: readonly T[],
  keyFnOrTemplate: ((item: T) => string | number) | ((item: T, index: number) => TemplateResult),
  templateFn?: (item: T, index: number) => TemplateResult,
): TemplateResult {
  // Overload resolution at runtime
  const _keyFn: ((item: T) => string | number) | undefined = templateFn
    ? (keyFnOrTemplate as (item: T) => string | number)
    : undefined;
  const _templateFn: (item: T, index: number) => TemplateResult = templateFn
    ? templateFn
    : (keyFnOrTemplate as (item: T, index: number) => TemplateResult);

  const fragments: string[] = [];
  const values: TemplateValue[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const result = _templateFn(item, i);
    fragments.push(result.strings[0]);
    for (let j = 0; j < result.values.length; j++) {
      values.push(result.values[j]);
      fragments.push(result.strings[j + 1]);
    }
  }

  const _key = _keyFn ? items.map((item) => _keyFn(item)).join(',') : String(items.length);

  return {
    kind: 'less:template-result',
    strings: [fragments.join(''), ''],
    values,
    [TEMPLATE_RESULT]: true,
  } as TemplateResult;
}

// ─── Ref ──────────────────────────────────────────────────────────────

export function ref(callback: (element: Element) => void): RefDirective {
  return {
    kind: 'less:ref',
    callback,
  };
}

// ─── Core API ─────────────────────────────────────────────────────────

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

export function isClassMapValue(value: unknown): value is ClassMapValue {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as Record<PropertyKey, unknown>)[CLASS_MAP] === true,
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

// ─── SSR Rendering ────────────────────────────────────────────────────

export function renderTemplateToString(
  result: TemplateResult,
  options: { runtimeMarkers?: boolean } = {},
): string {
  const parsed = getOrParseTemplate(result);
  let output = '';
  let stripNextQuote: '"' | "'" | '' = '';
  let bindingIndex = 0;

  for (const slot of parsed.slots) {
    let chunk = slot.prefix;
    if (stripNextQuote && chunk.startsWith(stripNextQuote)) {
      chunk = chunk.slice(1);
      stripNextQuote = '';
    }

    const value = result.values[slot.index];
    const binding = slot.binding;

    if (binding) {
      output += chunk;
      stripNextQuote = binding.quoted;
      output += renderBinding(bindingIndex, binding, value, options.runtimeMarkers === true);
      bindingIndex++;
      continue;
    }

    output += chunk;
    if (options.runtimeMarkers && isSignalLike(value)) {
      output += `<span data-less-b="${bindingIndex}">${renderContent(value)}</span>`;
      bindingIndex++;
    } else {
      output += renderContent(value);
    }
  }

  let tail = parsed.tail;
  if (stripNextQuote && tail.startsWith(stripNextQuote)) {
    tail = tail.slice(1);
  }
  return output + tail;
}

// ─── Client Runtime Bindings ──────────────────────────────────────────

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

// ─── Signal Collection ────────────────────────────────────────────────

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

// ─── Internal Helpers ─────────────────────────────────────────────────

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

  // classMap in attribute position
  if (binding.name === 'class' && isClassMapValue(resolved as TemplateValue)) {
    const classes = renderClassMapValue(resolved as unknown as ClassMapValue);
    return `class="${escapeAttr(classes)}"`;
  }

  const escaped = binding.name === 'href' || binding.name === 'src' ||
      binding.name.endsWith(':href')
    ? escapeAttr(sanitizeUrl(String(resolved ?? '')))
    : renderAttrValue(resolved as TemplateValue);
  return `${binding.name}="${escaped}"`;
}

function renderContent(value: TemplateValue): string {
  const resolved = resolveSignalValue(value);
  if (resolved === null || resolved === undefined || typeof resolved === 'function') return '';
  if (isClassMapValue(resolved as unknown)) {
    return escapeHtml(renderClassMapValue(resolved as unknown as ClassMapValue));
  }
  if (Array.isArray(resolved)) {
    return resolved.map((item) => renderContent(item as TemplateValue)).join('');
  }
  if (isTemplateResult(resolved as TemplateValue)) {
    return renderTemplateToString(resolved as TemplateResult);
  }
  if (isUnsafeHTML(resolved as TemplateValue)) {
    return (resolved as UnsafeHtmlValue).html;
  }
  return escapeHtml(String(resolved));
}

function renderAttrValue(value: TemplateValue): string {
  const resolved = resolveSignalValue(value);
  if (resolved === null || resolved === undefined || typeof resolved === 'function') return '';
  if (isClassMapValue(resolved as unknown)) {
    return escapeAttr(renderClassMapValue(resolved as unknown as ClassMapValue));
  }
  if (Array.isArray(resolved)) {
    return resolved.map((item) => renderAttrValue(item as TemplateValue)).join(' ');
  }
  return escapeAttr(String(resolved));
}

function resolveSignalValue(value: TemplateValue): TemplateValue | unknown {
  if (isSignalLike(value)) return value.value;
  return value;
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
  if (/^(https?:|mailto:|tel:|\/|\.\/|\.\.\/|#|\?)/i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return '#';
  return trimmed;
}
