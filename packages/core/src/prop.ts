/**
 * @lessjs/core — Reactive property runtime.
 *
 * ADR-0052 / SOP-010 / ADR-0057: static props + Signal model.
 *
 * v0.29.1: PropDecl / PropType / PropsFrom types merged from prop-types.ts.
 */

import type { DsdElement } from './dsd-element.js';

// ─── PropDecl Type Utilities ────────────────────────────────────

export type PropDeclShorthand =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor;

export type PropDeclFull =
  | { type: StringConstructor; default?: string; reflect?: boolean }
  | { type: NumberConstructor; default?: number; reflect?: boolean }
  | { type: BooleanConstructor; default?: boolean; reflect?: boolean }
  | { type: ArrayConstructor; default?: unknown[]; reflect?: boolean }
  | { type: ObjectConstructor; default?: Record<string, unknown>; reflect?: boolean };

export type PropDecl = PropDeclShorthand | PropDeclFull;

export type PropType<D> = D extends NumberConstructor ? number
  : D extends StringConstructor ? string
  : D extends BooleanConstructor ? boolean
  : D extends ArrayConstructor ? unknown[]
  : D extends ObjectConstructor ? Record<string, unknown>
  : D extends { type: NumberConstructor } ? number
  : D extends { type: StringConstructor } ? string
  : D extends { type: BooleanConstructor } ? boolean
  : D extends { type: ArrayConstructor } ? unknown[]
  : D extends { type: ObjectConstructor } ? Record<string, unknown>
  : unknown;

export type PropsFrom<P extends Record<string, PropDecl>> = {
  [K in keyof P]: PropType<P[K]>;
};

// ─── Internal types (v0.24.1: `PropertyOptions` no longer exported) ────────

interface PropertyOptions {
  /** Constructor for attribute↔property type conversion */
  type?: StringConstructor | NumberConstructor | BooleanConstructor;
  /** Custom HTML attribute name (default: lowercase property name) */
  attribute?: string | false;
  /** Whether property changes write back to HTML attribute */
  reflect?: boolean;
  /** Use own-property instead of accessor (opt-in for low-level control) */
  noAccessor?: boolean;
}

interface PropMetadata {
  key: PropertyKey;
  options: PropertyOptions;
}

interface PropMetadataStore {
  props: PropMetadata[];
}

const PROP_METADATA = Symbol.for('lessjs.propMetadata');

// ─── Internal type helpers for symbol-keyed internals ───────────
// DsdElement / Record<string,unknown> instances store prop runtime
// state under well-known symbols. TypeScript does not natively model
// symbol-keyed properties on arbitrary objects, so we define narrow
// accessor types and cast through `unknown` (type-safe) rather than `any`.

/** Typed access to @prop() signal state on DsdElement instances */
type _PropSignalsAccessor = {
  [PROP_SIGNALS]?: PropSignalMap;
  [PROP_UNSUBSCRIBERS]?: Array<() => void>;
};

/** Typed access to @prop() metadata on constructors */
type _PropMetadataAccessor = {
  [PROP_METADATA]?: PropMetadataStore;
};

/** Typed access to static props signal state on Record<string,unknown> instances */
type _StaticPropSignalsAccessor = {
  [STATIC_PROP_SIGNALS]?: Map<string, PropSignal>;
  [STATIC_PROP_UNSUBS]?: Array<() => void>;
};

/** Typed access to a constructor that may have static props */
type _PropsCtor = { props?: Record<string, unknown> };

// ─── Runtime integration (v0.24: @prop() legacy runtime — kept for compat) ──

/**
 * Internal: signal key for property signals stored on the element instance.
 */
const PROP_SIGNALS = Symbol.for('lessjs.propSignals');
const PROP_UNSUBSCRIBERS = Symbol.for('lessjs.propUnsubscribers');

interface PropSignalMap {
  signals: Map<PropertyKey, { value: unknown; subscribe(fn: (v: unknown) => void): () => void }>;
}

/**
 * Initialize @prop() signals and accessors for a DsdElement instance.
 * Called once from connectedCallback().
 */
export function initializeProps(instance: DsdElement): void {
  const ctor = instance.constructor as unknown as _PropMetadataAccessor;
  const store = ctor[PROP_METADATA];
  if (!store?.props.length) return;

  const sigMap: PropSignalMap = { signals: new Map() };
  (instance as unknown as _PropSignalsAccessor)[PROP_SIGNALS] = sigMap;

  const unsubscribers: Array<() => void> = [];
  (instance as unknown as _PropSignalsAccessor)[PROP_UNSUBSCRIBERS] = unsubscribers;

  for (const { key, options } of store.props) {
    const attrName = resolveAttrName(key, options);
    const initialValue = getInitialValue(instance, key, attrName, options);

    // Create per-property signal
    const sig = createPropSignal(initialValue);

    // Wire signal → ReactiveHost
    let skipFirst = true;
    const unsubscribe = sig.subscribe(() => {
      if (skipFirst) {
        skipFirst = false;
        return;
      }
      if (options.reflect && typeof key === 'string') {
        reflectToAttribute(instance, key, sig.value, options);
      }
      instance.requestReactiveUpdate();
    });
    unsubscribers.push(unsubscribe);

    sigMap.signals.set(key, sig);

    // Replace prototype property with accessor
    if (!options.noAccessor) {
      installPropAccessor(instance, key as string | symbol, sigMap);
    }
  }

  // Register observedAttributes
  registerObservedAttributes(
    instance.constructor as typeof DsdElement & { observedAttributes?: string[] },
    store,
  );
}

/**
 * Clean up @prop() signal subscriptions. Called from disconnectedCallback().
 */
export function disposeProps(instance: DsdElement): void {
  const unsubs = (instance as unknown as _PropSignalsAccessor)[PROP_UNSUBSCRIBERS];
  if (unsubs) {
    for (const fn of unsubs.splice(0)) fn();
  }
}

/**
 * Handle attribute change → signal update. Called from attributeChangedCallback().
 */
export function handlePropAttributeChange(
  instance: DsdElement,
  name: string,
  _oldValue: string | null,
  newValue: string | null,
): void {
  const sigMap = (instance as unknown as _PropSignalsAccessor)[PROP_SIGNALS];
  if (!sigMap) return;

  // Find which prop maps to this attribute
  const ctor = instance.constructor as unknown as _PropMetadataAccessor;
  const store = ctor[PROP_METADATA];
  if (!store) return;

  for (const { key, options } of store.props) {
    const attr = resolveAttrName(key, options);
    if (attr !== name) continue;

    const sig = sigMap.signals.get(key);
    if (!sig) continue;

    const converted = fromAttribute(newValue, options);
    sig.value = converted;
    return;
  }
}

// ─── Internal helpers ────────────────────────────────────────────────

function resolveAttrName(key: PropertyKey, options: PropertyOptions): string {
  if (options.attribute === false) return '';
  if (typeof options.attribute === 'string') return options.attribute;
  return String(key).toLowerCase();
}

function getInitialValue(
  instance: DsdElement,
  key: PropertyKey,
  attrName: string,
  options: PropertyOptions,
): unknown {
  // Check instance own property first (class field initializer)
  const own = (instance as unknown as Record<PropertyKey, unknown>)[key];
  if (own !== undefined) return own;

  // Check HTML attribute
  if (attrName && instance.hasAttribute(attrName)) {
    return fromAttribute(instance.getAttribute(attrName), options);
  }

  return options.type === Boolean ? false : '';
}

function fromAttribute(value: string | null, options: PropertyOptions): unknown {
  if (value === null) {
    return options.type === Boolean ? false : options.type === Number ? 0 : '';
  }
  if (options.type === Boolean) return true;
  if (options.type === Number) {
    const n = Number(value);
    return Number.isNaN(n) ? 0 : n;
  }
  return value;
}

function toAttribute(value: unknown, options: PropertyOptions): string | null {
  if (options.type === Boolean) return value ? '' : null;
  return String(value);
}

function reflectToAttribute(
  instance: DsdElement,
  key: PropertyKey,
  value: unknown,
  options: PropertyOptions,
): void {
  const attr = resolveAttrName(key, options);
  if (!attr) return;
  const str = toAttribute(value, options);
  if (str === null) {
    instance.removeAttribute(attr);
  } else {
    instance.setAttribute(attr, str);
  }
}

export interface PropSignal {
  value: unknown;
  subscribe(fn: (v: unknown) => void): () => void;
}

/**
 * Create a signal for a `static props` or `@prop()` property.
 *
 * Adds `valueOf()` and `Symbol.toPrimitive` for automatic value unwrapping
 * inside JSX expressions `{}` — no explicit `.value` needed in common cases.
 *
 * Unwrapping boundary (ADR-0057 §3.1):
 * - ✅ JSX expression `{this.count}` — auto-unwraps via valueOf
 * - ✅ Arithmetic `this.count > 5` — triggers valueOf
 * - ✅ Template literal `${this.count}` — triggers Symbol.toPrimitive('string')
 * - ❌ `JSON.stringify(this.count)` — use `this.count.value` explicitly
 * - ❌ `Array.isArray(this.items)` — use `Array.isArray(this.items.value)`
 * - ❌ `typeof this.count` — returns "object", use `typeof this.count.value`
 */
function createPropSignal(initialValue: unknown): PropSignal {
  let _value = initialValue;
  const listeners = new Set<(v: unknown) => void>();

  const sig: PropSignal = {
    get value() {
      return _value;
    },
    set value(v: unknown) {
      if (Object.is(_value, v)) return;
      _value = v;
      for (const fn of listeners) fn(v);
    },
    subscribe(fn: (v: unknown) => void): () => void {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };

  // Automatic value unwrapping for JSX expressions and operators
  Object.defineProperties(sig, {
    valueOf: {
      value() {
        return _value;
      },
      enumerable: false,
      configurable: true,
    },
    [Symbol.toPrimitive]: {
      value(hint: string) {
        return hint === 'string' ? String(_value) : _value;
      },
      enumerable: false,
      configurable: true,
    },
  });

  return sig;
}

// ─── unwrap() ─────────────────────────────────────────────────────────────────

/**
 * Explicitly unwrap a Signal value.
 *
 * Use when the automatic `valueOf` unwrapping is insufficient —
 * e.g. `JSON.stringify`, `Array.isArray`, or `typeof` checks.
 *
 * @example
 * ```ts
 * Array.isArray(unwrap(this.items)); // true
 * Array.isArray(this.items);         // false — Signal is not an Array
 * ```
 *
 * Zero overhead — compiles to a simple property access.
 */
export function unwrap<T>(sig: { value: T } | T): T {
  if (
    sig !== null && typeof sig === 'object' && 'value' in (sig as object) &&
    'subscribe' in (sig as object)
  ) {
    return (sig as { value: T }).value;
  }
  return sig as T;
}

// ─── normalizePropDecl ────────────────────────────────────────────────────────

/** Internal shape returned by normalizePropDecl */
export interface NormalizedPropDecl {
  type:
    | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | ArrayConstructor
    | ObjectConstructor;
  default: unknown;
  reflect: boolean;
}

const DEFAULT_VALUES: Record<string, unknown> = {
  String: '',
  Number: 0,
  Boolean: false,
  Array: () => [],
  Object: () => ({}),
};

/**
 * Normalise a `static props` entry to a consistent shape.
 *
 * Shorthand: `count: Number` → `{ type: Number, default: 0, reflect: false }`
 * Full form: `{ type: Number, default: 5, reflect: true }` → returned as-is
 */
export function normalizePropDecl(decl: unknown): NormalizedPropDecl {
  if (typeof decl === 'function') {
    const ctor = decl as { name: string };
    const def = DEFAULT_VALUES[ctor.name];
    return {
      type: decl as NormalizedPropDecl['type'],
      default: typeof def === 'function' ? (def as () => unknown)() : def,
      reflect: false,
    };
  }
  if (decl !== null && typeof decl === 'object') {
    const d = decl as { type: unknown; default?: unknown; reflect?: boolean };
    const ctor = d.type as { name: string };
    const defVal = d.default !== undefined
      ? d.default
      : DEFAULT_VALUES[ctor?.name ?? ''] !== undefined
      ? (typeof DEFAULT_VALUES[ctor.name] === 'function'
        ? (DEFAULT_VALUES[ctor.name] as () => unknown)()
        : DEFAULT_VALUES[ctor.name])
      : null;
    return {
      type: d.type as NormalizedPropDecl['type'],
      default: defVal,
      reflect: d.reflect ?? false,
    };
  }
  return { type: String, default: '', reflect: false };
}

// ─── Static props runtime ─────────────────────────────────────────────────────

const STATIC_PROP_SIGNALS = Symbol.for('lessjs.staticPropSignals');
const STATIC_PROP_UNSUBS = Symbol.for('lessjs.staticPropUnsubs');

/**
 * Initialize `static props` on a DsdElement instance.
 *
 * Creates a PropSignal for each declared prop, installs a get/set accessor
 * on the instance, and registers attribute observation.
 *
 * Called from DsdElement.connectedCallback() before initializeProps().
 */
export function initializeStaticProps(instance: Record<string, unknown>): void {
  const ctor = instance.constructor as unknown as _PropsCtor;
  const propsDef = ctor.props as Record<string, unknown> | undefined;
  if (!propsDef || typeof propsDef !== 'object') return;

  const sigMap = new Map<string, PropSignal>();
  (instance as unknown as _StaticPropSignalsAccessor)[STATIC_PROP_SIGNALS] = sigMap;

  const unsubs: Array<() => void> = [];
  (instance as unknown as _StaticPropSignalsAccessor)[STATIC_PROP_UNSUBS] = unsubs;

  for (const [name, decl] of Object.entries(propsDef)) {
    const { default: defVal, reflect } = normalizePropDecl(decl);
    const sig = createPropSignal(defVal);

    sigMap.set(name, sig);

    // Install accessor on instance
    Object.defineProperty(instance, name, {
      get() {
        return sig;
      },
      set(v: unknown) {
        sig.value = v;
      },
      enumerable: true,
      configurable: true,
    });

    // Wire reflect → attribute
    if (reflect) {
      const unsub = sig.subscribe(() => {
        const el = instance as unknown as Element & {
          setAttribute(n: string, v: string): void;
          removeAttribute(n: string): void;
        };
        const { type } = normalizePropDecl(decl);
        if (type === Boolean) {
          if (sig.value) {
            el.setAttribute(name, '');
          } else {
            el.removeAttribute(name);
          }
        } else {
          el.setAttribute(name, String(sig.value));
        }
      });
      unsubs.push(unsub);
    }
  }

  // Register observedAttributes from static props
  registerStaticObservedAttributes(ctor, propsDef);
}

/**
 * Dispose static props signal subscriptions.
 * Called from DsdElement.disconnectedCallback().
 */
export function disposeStaticProps(instance: Record<string, unknown>): void {
  const unsubs = (instance as unknown as _StaticPropSignalsAccessor)[STATIC_PROP_UNSUBS] as
    | Array<() => void>
    | undefined;
  if (unsubs) {
    for (const fn of unsubs.splice(0)) fn();
  }
}

/**
 * Handle attribute changes for `static props`.
 * Called from DsdElement.attributeChangedCallback().
 */
export function handleStaticPropAttributeChange(
  instance: Record<string, unknown>,
  name: string,
  _oldValue: string | null,
  newValue: string | null,
): void {
  const sigMap = (instance as unknown as _StaticPropSignalsAccessor)[STATIC_PROP_SIGNALS] as
    | Map<string, PropSignal>
    | undefined;
  if (!sigMap) return;

  const ctor = instance.constructor as unknown as _PropsCtor;
  const propsDef = ctor.props as Record<string, unknown> | undefined;
  if (!propsDef) return;

  // Find matching prop by lowercased name
  for (const [propName, decl] of Object.entries(propsDef)) {
    if (propName.toLowerCase() !== name.toLowerCase()) continue;
    const sig = sigMap.get(propName);
    if (!sig) continue;
    const { type } = normalizePropDecl(decl);
    if (newValue === null) {
      sig.value = type === Boolean ? false : type === Number ? 0 : '';
    } else if (type === Boolean) {
      sig.value = true;
    } else if (type === Number) {
      const n = Number(newValue);
      sig.value = Number.isNaN(n) ? 0 : n;
    } else {
      sig.value = newValue;
    }
    return;
  }
}

/**
 * Sync static props from HTML attributes when element is connected.
 * Called from DsdElement.connectedCallback() after initializeStaticProps().
 */
export function syncStaticPropsFromAttributes(
  instance: Record<string, unknown>,
): void {
  const ctor = instance.constructor as unknown as _PropsCtor;
  const propsDef = ctor.props as Record<string, unknown> | undefined;
  if (!propsDef) return;

  const sigMap = (instance as unknown as _StaticPropSignalsAccessor)[STATIC_PROP_SIGNALS] as
    | Map<string, PropSignal>
    | undefined;
  if (!sigMap) return;

  const el = instance as unknown as {
    getAttribute(n: string): string | null;
    hasAttribute(n: string): boolean;
  };
  for (const [name, decl] of Object.entries(propsDef)) {
    const { type } = normalizePropDecl(decl);
    if (type === Boolean) {
      if (el.hasAttribute(name)) {
        const sig = sigMap.get(name);
        if (sig) sig.value = true;
      }
    } else {
      const attrVal = el.getAttribute(name);
      if (attrVal !== null) {
        const sig = sigMap.get(name);
        if (!sig) continue;
        if (type === Number) {
          const n = Number(attrVal);
          sig.value = Number.isNaN(n) ? 0 : n;
        } else {
          sig.value = attrVal;
        }
      }
    }
  }
}

export function registerStaticObservedAttributes(
  ctor: { observedAttributes?: string[]; props?: Record<string, unknown> },
  propsDef: Record<string, unknown>,
): void {
  const existing = ctor.observedAttributes ?? [];
  const toAdd: string[] = [];
  for (const name of Object.keys(propsDef)) {
    const lower = name.toLowerCase();
    if (!existing.includes(lower) && !toAdd.includes(lower)) {
      toAdd.push(lower);
    }
  }
  if (toAdd.length === 0) return;
  const combined = [...existing, ...toAdd];
  Object.defineProperty(ctor, 'observedAttributes', {
    get(): string[] {
      return combined;
    },
    configurable: true,
  });
}

function installPropAccessor(
  instance: DsdElement,
  key: string | symbol,
  sigMap: PropSignalMap,
): void {
  const _proto = Object.getPrototypeOf(instance);
  const sig = sigMap.signals.get(key)!;

  Object.defineProperty(instance, key, {
    get(): unknown {
      return sig.value;
    },
    set(v: unknown) {
      sig.value = v;
    },
    enumerable: true,
    configurable: true,
  });
}

function registerObservedAttributes(
  ctor: typeof DsdElement & { observedAttributes?: string[] },
  store: PropMetadataStore,
): void {
  const existing = ctor.observedAttributes ?? [];
  const toAdd: string[] = [];
  for (const { key, options } of store.props) {
    const attr = resolveAttrName(
      typeof options.attribute === 'string' ? options.attribute : String(key),
      options,
    );
    if (attr && !existing.includes(attr) && !toAdd.includes(attr)) {
      toAdd.push(attr);
    }
  }
  if (toAdd.length > 0) {
    Object.defineProperty(ctor, 'observedAttributes', {
      get(): string[] {
        return [...existing, ...toAdd];
      },
      configurable: true,
    });
  }
}
