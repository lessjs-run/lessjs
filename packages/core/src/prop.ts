/**
 * @lessjs/core — Reactive property runtime.
 *
 * ADR-0052 / SOP-010 / ADR-0057: static props + Signal model.
 *
 * v0.29.5: WeakMap replaces Symbol.for() for type-safe signal storage.
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

// ─── Internal types ─────────────────────────────────────────────

interface PropertyOptions {
  type?: StringConstructor | NumberConstructor | BooleanConstructor;
  attribute?: string | false;
  reflect?: boolean;
  noAccessor?: boolean;
}

interface PropMetadata {
  key: PropertyKey;
  options: PropertyOptions;
}

interface PropMetadataStore {
  props: PropMetadata[];
}

interface PropSignalMap {
  signals: Map<PropertyKey, { value: unknown; subscribe(fn: (v: unknown) => void): () => void }>;
}

type PropSignal = { value: unknown; subscribe(fn: (v: unknown) => void): () => void };

// ─── WeakMap storage (v0.29.5: replaces Symbol.for()) ───────────

const _propSignals = new WeakMap<DsdElement, PropSignalMap>();
const _propUnsubscribers = new WeakMap<DsdElement, Array<() => void>>();
const _ctorMetadata = new WeakMap<Function, PropMetadataStore>();
const _staticPropSignals = new WeakMap<DsdElement, Map<string, PropSignal>>();
const _staticPropUnsubs = new WeakMap<DsdElement, Array<() => void>>();

// ─── @prop() runtime (legacy compat) ────────────────────────────

export function initializeProps(instance: DsdElement): void {
  const store = _ctorMetadata.get(instance.constructor as Function);
  if (!store?.props.length) return;

  const sigMap: PropSignalMap = { signals: new Map() };
  _propSignals.set(instance, sigMap);

  const unsubscribers: Array<() => void> = [];
  _propUnsubscribers.set(instance, unsubscribers);

  for (const { key, options } of store.props) {
    const attrName = resolveAttrName(key, options);
    const initialValue = getInitialValue(instance, key, attrName, options);

    const sig = createPropSignal(initialValue);
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

    if (!options.noAccessor) {
      installPropAccessor(instance, key as string | symbol, sigMap);
    }
  }

  registerObservedAttributes(
    instance.constructor as typeof DsdElement & { observedAttributes?: string[] },
    store,
  );
}

export function disposeProps(instance: DsdElement): void {
  const unsubs = _propUnsubscribers.get(instance);
  if (unsubs) {
    for (const fn of unsubs.splice(0)) fn();
  }
}

export function handlePropAttributeChange(
  instance: DsdElement,
  name: string,
  _oldValue: string | null,
  newValue: string | null,
): void {
  const sigMap = _propSignals.get(instance);
  if (!sigMap) return;

  const store = _ctorMetadata.get(instance.constructor as Function);
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

// ─── Internal helpers ───────────────────────────────────────────

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
  const own = (instance as unknown as Record<PropertyKey, unknown>)[key];
  if (own !== undefined) return own;

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

function reflectToAttribute(
  instance: DsdElement,
  key: string,
  value: unknown,
  options: PropertyOptions,
): void {
  const attr = resolveAttrName(key, options);
  if (!attr) return;

  if (options.type === Boolean) {
    if (value) {
      instance.setAttribute(attr, '');
    } else {
      instance.removeAttribute(attr);
    }
  } else {
    instance.setAttribute(attr, String(value));
  }
}

function createPropSignal(initial: unknown): PropSignal {
  let _value = initial;
  const _subs = new Set<(v: unknown) => void>();

  return {
    get value(): unknown {
      return _value;
    },
    set value(v: unknown) {
      _value = v;
      for (const fn of _subs) fn(v);
    },
    subscribe(fn: (v: unknown) => void): () => void {
      _subs.add(fn);
      fn(_value);
      return () => _subs.delete(fn);
    },
  };
}

function installPropAccessor(
  instance: DsdElement,
  key: string | symbol,
  sigMap: PropSignalMap,
): void {
  Object.defineProperty(instance, key, {
    get() {
      return sigMap.signals.get(key)?.value;
    },
    set(v: unknown) {
      const sig = sigMap.signals.get(key);
      if (sig) sig.value = v;
    },
    enumerable: true,
    configurable: true,
  });
}

function registerObservedAttributes(
  ctor: typeof DsdElement & { observedAttributes?: string[] },
  store: PropMetadataStore,
): void {
  if (!ctor.observedAttributes) {
    ctor.observedAttributes = [];
  }
  for (const { key, options } of store.props) {
    const attr = resolveAttrName(key, options);
    if (attr && !ctor.observedAttributes.includes(attr)) {
      ctor.observedAttributes.push(attr);
    }
  }
}

// ─── Static props runtime ───────────────────────────────────────

export function initializeStaticProps(instance: DsdElement): void {
  const ctor = instance.constructor as { props?: Record<string, unknown> };
  const propsDef = ctor.props as Record<string, unknown> | undefined;
  if (!propsDef || typeof propsDef !== 'object') return;

  const sigMap = new Map<string, PropSignal>();
  _staticPropSignals.set(instance, sigMap);

  const unsubs: Array<() => void> = [];
  _staticPropUnsubs.set(instance, unsubs);

  for (const [name, decl] of Object.entries(propsDef)) {
    const { default: defVal, reflect } = normalizePropDecl(decl);
    const sig = createPropSignal(defVal);

    sigMap.set(name, sig);

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

    if (reflect) {
      const unsub = sig.subscribe(() => {
        const { type } = normalizePropDecl(decl);
        if (type === Boolean) {
          if (sig.value) instance.setAttribute(name, '');
          else instance.removeAttribute(name);
        } else {
          instance.setAttribute(name, String(sig.value));
        }
      });
      unsubs.push(unsub);
    }
  }

  registerStaticObservedAttributes(ctor, propsDef);
}

export function disposeStaticProps(instance: DsdElement): void {
  const unsubs = _staticPropUnsubs.get(instance);
  if (unsubs) {
    for (const fn of unsubs.splice(0)) fn();
  }
}

export function handleStaticPropAttributeChange(
  instance: DsdElement,
  name: string,
  _oldValue: string | null,
  newValue: string | null,
): void {
  const sigMap = _staticPropSignals.get(instance);
  if (!sigMap) return;

  const ctor = instance.constructor as { props?: Record<string, unknown> };
  const propsDef = ctor.props as Record<string, unknown> | undefined;
  if (!propsDef) return;

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

export function syncStaticPropsFromAttributes(instance: DsdElement): void {
  const ctor = instance.constructor as { props?: Record<string, unknown> };
  const propsDef = ctor.props as Record<string, unknown> | undefined;
  if (!propsDef) return;

  const sigMap = _staticPropSignals.get(instance);
  if (!sigMap) return;

  const el = instance as unknown as {
    getAttribute(n: string): string | null;
    hasAttribute(n: string): boolean;
  };

  for (const [name, decl] of Object.entries(propsDef)) {
    const sig = sigMap.get(name);
    if (!sig) continue;
    if (el.hasAttribute(name)) {
      const { type } = normalizePropDecl(decl);
      const raw = el.getAttribute(name);
      if (raw === null) continue;
      if (type === Boolean) {
        sig.value = true;
      } else if (type === Number) {
        const n = Number(raw);
        sig.value = Number.isNaN(n) ? 0 : n;
      } else {
        sig.value = raw;
      }
    }
  }
}

export function unwrap<T>(sig: { value: T } | T): T {
  if (
    sig !== null && typeof sig === 'object' && 'value' in (sig as object) &&
    'subscribe' in (sig as object)
  ) {
    return (sig as { value: T }).value;
  }
  return sig as T;
}

// ─── Shared utilities ───────────────────────────────────────────

export interface NormalizedPropDecl {
  type: StringConstructor | NumberConstructor | BooleanConstructor;
  default: unknown;
  reflect: boolean;
}

export function normalizePropDecl(decl: unknown): NormalizedPropDecl {
  if (typeof decl === 'function') {
    return {
      type: decl as NormalizedPropDecl['type'],
      default: decl === Boolean ? false : decl === Number ? 0 : '',
      reflect: false,
    };
  }
  if (decl && typeof decl === 'object') {
    const d = decl as { type?: unknown; default?: unknown; reflect?: unknown };
    return {
      type: (d.type ?? String) as NormalizedPropDecl['type'],
      default: d.default ?? (d.type === Boolean ? false : d.type === Number ? 0 : ''),
      reflect: d.reflect === true,
    };
  }
  return { type: String, default: '', reflect: false };
}

export function registerStaticObservedAttributes(
  ctor: { props?: Record<string, unknown> },
  propsDef: Record<string, unknown>,
): void {
  const c = ctor as unknown as { observedAttributes?: string[] };
  if (!c.observedAttributes) {
    c.observedAttributes = [];
  }
  for (const name of Object.keys(propsDef)) {
    if (!c.observedAttributes.includes(name.toLowerCase())) {
      c.observedAttributes.push(name.toLowerCase());
    }
  }
}
