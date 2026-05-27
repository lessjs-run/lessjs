/**
 * @lessjs/core — @prop() reactive property decorator.
 *
 * ADR-0052 / SOP-010: Reduces property declaration from 10+ lines
 * across 4 locations to a single `@prop() name = value`.
 *
 * Each @prop() creates a signal-backed accessor. When the property
 * changes, the signal notifies the DsdElement's ReactiveHost, which
 * schedules a microtask-batched DOM patch.
 *
 * Attribute↔property sync:
 * - attributeChangedCallback writes to signal value
 * - signal changes optionally reflect back to HTML attribute
 *
 * Type conversion:
 * - String: value.toString() (default)
 * - Number: Number(value)
 * - Boolean: attribute presence ("" or null)
 */

import type { DsdElement } from './dsd-element.js';

// ─── Property metadata ──────────────────────────────────────────────

export interface PropertyOptions {
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

const PROP_METADATA = Symbol.for('lessjs.propMetadata');

interface PropMetadataStore {
  props: PropMetadata[];
}

function getOrCreateMetadata(target: object): PropMetadataStore {
  const ctor = target.constructor as unknown as Record<symbol, PropMetadataStore>;
  if (!ctor[PROP_METADATA]) {
    ctor[PROP_METADATA] = { props: [] };
  }
  return ctor[PROP_METADATA];
}

// ─── Decorator ──────────────────────────────────────────────────────

/**
 * @prop() reactive property decorator.
 *
 * Declares a signal-backed reactive property on a DsdElement subclass.
 *
 * @example
 * ```ts
 * class MyButton extends DsdElement {
 *   @prop() count = 0;
 *   @prop({ type: Boolean }) disabled = false;
 *   @prop({ attribute: 'aria-label', reflect: true }) ariaLabel = '';
 * }
 * ```
 */
export function prop(options: PropertyOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const store = getOrCreateMetadata(target);
    store.props.push({ key: propertyKey, options });
  };
}

// ─── Runtime integration ────────────────────────────────────────────

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
  // deno-lint-ignore no-explicit-any
  const ctor = instance.constructor as any as Record<symbol, PropMetadataStore>;
  const store = ctor[PROP_METADATA];
  if (!store?.props.length) return;

  const sigMap: PropSignalMap = { signals: new Map() };
  // deno-lint-ignore no-explicit-any
  (instance as any as Record<symbol, PropSignalMap>)[PROP_SIGNALS] = sigMap;

  const unsubscribers: Array<() => void> = [];
  // deno-lint-ignore no-explicit-any
  (instance as any as Record<symbol, Array<() => void>>)[PROP_UNSUBSCRIBERS] = unsubscribers;

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
  // deno-lint-ignore no-explicit-any
  const unsubs = (instance as any as Record<symbol, Array<() => void>>)[PROP_UNSUBSCRIBERS];
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
  oldValue: string | null,
  newValue: string | null,
): void {
  // deno-lint-ignore no-explicit-any
  const sigMap = (instance as any as Record<symbol, PropSignalMap>)[PROP_SIGNALS];
  if (!sigMap) return;

  // Find which prop maps to this attribute
  // deno-lint-ignore no-explicit-any
  const ctor = instance.constructor as any as Record<symbol, PropMetadataStore>;
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
  // deno-lint-ignore no-explicit-any
  const own = (instance as any as Record<PropertyKey, unknown>)[key];
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

interface PropSignal {
  value: unknown;
  subscribe(fn: (v: unknown) => void): () => void;
}

function createPropSignal(initialValue: unknown): PropSignal {
  let _value = initialValue;
  const listeners = new Set<(v: unknown) => void>();

  return {
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
}

function installPropAccessor(
  instance: DsdElement,
  key: string | symbol,
  sigMap: PropSignalMap,
): void {
  const proto = Object.getPrototypeOf(instance);
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
