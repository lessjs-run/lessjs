/**
 * @openelement/ui public contract tests.
 */
import { assertEquals, assertExists, assertFalse } from 'jsr:@std/assert@^1.0.0';

type TestAttributeStore = WeakMap<object, Map<string, string>>;
type TestListenerStore = WeakMap<object, Map<string, Set<EventListener>>>;

interface ComponentModule {
  tagName: string;
  [exportName: string]: unknown;
}

interface RenderableElement extends HTMLElement {
  render(): unknown;
}

type RenderableElementConstructor = new () => RenderableElement;

interface ManifestDeclaration {
  tagName?: string;
  openElement?: {
    module?: string;
    hydrate?: string;
  };
}

interface ManifestModule {
  manifest: {
    packageName: string;
    declarations: ManifestDeclaration[];
  };
}

class TestHTMLElement {
  static observedAttributes?: readonly string[];

  readonly #attributes: TestAttributeStore;
  readonly #listeners: TestListenerStore;

  constructor(attributes: TestAttributeStore, listeners: TestListenerStore) {
    this.#attributes = attributes;
    this.#listeners = listeners;
  }

  getAttribute(name: string): string | null {
    return this.#attributes.get(this)?.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    let attributes = this.#attributes.get(this);
    if (!attributes) {
      attributes = new Map();
      this.#attributes.set(this, attributes);
    }
    attributes.set(name, value);
  }

  hasAttribute(name: string): boolean {
    return this.#attributes.get(this)?.has(name) ?? false;
  }

  removeAttribute(name: string): void {
    this.#attributes.get(this)?.delete(name);
  }

  addEventListener(type: string, listener: EventListener): void {
    let listeners = this.#listeners.get(this);
    if (!listeners) {
      listeners = new Map();
      this.#listeners.set(this, listeners);
    }
    let typedListeners = listeners.get(type);
    if (!typedListeners) {
      typedListeners = new Set();
      listeners.set(type, typedListeners);
    }
    typedListeners.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.#listeners.get(this)?.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.#listeners.get(this)?.get(event.type);
    for (const listener of listeners ?? []) listener(event);
    return true;
  }

  get shadowRoot(): ShadowRoot | null {
    return null;
  }

  attachShadow(_init: ShadowRootInit): ShadowRoot {
    throw new Error('Shadow DOM is not available in this test harness.');
  }

  querySelector(_selectors: string): Element | null {
    return null;
  }

  querySelectorAll(_selectors: string): NodeListOf<Element> {
    return [] as unknown as NodeListOf<Element>;
  }

  connectedCallback?(): void;
  disconnectedCallback?(): void;
  attributeChangedCallback?(
    _name: string,
    _oldValue: string | null,
    _newValue: string | null,
  ): void;
}

function installDomHarness(): void {
  if (typeof globalThis.HTMLElement !== 'undefined') return;

  const attributes: TestAttributeStore = new WeakMap();
  const listeners: TestListenerStore = new WeakMap();
  const ElementBase = class extends TestHTMLElement {
    constructor() {
      super(attributes, listeners);
    }
  } as unknown as typeof HTMLElement;

  Object.defineProperty(globalThis, 'HTMLElement', {
    configurable: true,
    value: ElementBase,
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      documentElement: {
        dataset: {},
        getAttribute: () => null,
        setAttribute: () => {},
      },
      createElement: () => new ElementBase(),
      createTreeWalker: () => ({ nextNode: () => null }),
      querySelector: () => null,
      querySelectorAll: () => [],
      body: new ElementBase(),
      head: new ElementBase(),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as unknown as Document,
  });
}

function asComponentModule(module: unknown): ComponentModule {
  const candidate = module as Partial<ComponentModule>;
  assertExists(candidate.tagName);
  assertEquals(typeof candidate.tagName, 'string');
  return candidate as ComponentModule;
}

function exportedConstructor(module: ComponentModule): RenderableElementConstructor {
  for (const [name, value] of Object.entries(module)) {
    if (name === 'tagName') continue;
    if (typeof value === 'function') {
      const prototype = (value as { prototype?: Partial<RenderableElement> }).prototype;
      if (typeof prototype?.render === 'function') {
        return value as RenderableElementConstructor;
      }
    }
  }
  throw new Error(`No renderable custom element export found for ${module.tagName}.`);
}

installDomHarness();

const COMPONENT_FILES = [
  'open-button',
  'open-card',
  'open-input',
  'open-code-block',
  'open-layout',
  'open-theme-toggle',
  'open-dialog',
  'open-callout',
  'open-step-card',
  'open-dropdown',
  'open-modal',
  'open-tabs',
] as const;

const REACTIVE_PROPERTY_CASES: ReadonlyArray<{
  fileName: string;
  className: string;
  props: readonly string[];
}> = [
  {
    fileName: 'open-button',
    className: 'OpenButton',
    props: ['variant', 'size', 'disabled', 'href', 'target', 'type'],
  },
  {
    fileName: 'open-card',
    className: 'OpenCard',
    props: ['variant'],
  },
  {
    fileName: 'open-input',
    className: 'OpenInput',
    props: ['type', 'placeholder', 'label', 'value', 'name', 'disabled', 'required', 'error'],
  },
  {
    fileName: 'open-layout',
    className: 'OpenLayout',
    props: ['home', 'currentPath', 'navItems', 'headerNav', 'logoText', 'logoSub', 'githubUrl'],
  },
  {
    fileName: 'open-theme-toggle',
    className: 'OpenThemeToggle',
    props: ['theme'],
  },
];

for (const name of COMPONENT_FILES) {
  Deno.test(`${name}: exports a custom-element tag and renderable class`, async () => {
    const module = asComponentModule(await import(`../src/${name}.tsx`));
    assertEquals(module.tagName.includes('-'), true);

    const Component = exportedConstructor(module);
    const instance = new Component();
    assertExists(instance.render());
  });
}

Deno.test('open-props-tokens: exports a StyleSheet-compatible token sheet', async () => {
  const { openPropsTokenSheet } = await import('../src/open-props-tokens.ts');
  assertExists(openPropsTokenSheet);
  assertEquals(typeof openPropsTokenSheet.replaceSync, 'function');
  assertEquals(Array.isArray(openPropsTokenSheet.cssRules), true);
});

Deno.test('index: re-exports all public components', async () => {
  const mod = await import('../src/index.ts');

  for (
    const exportName of [
      'OpenButton',
      'OpenCard',
      'OpenInput',
      'OpenCodeBlock',
      'OpenLayout',
      'OpenThemeToggle',
      'OpenHeroPing',
      'OpenDialog',
      'OpenCallout',
      'OpenStepCard',
      'OpenDropdown',
      'OpenModal',
      'OpenTabs',
      'openPropsTokenSheet',
      'manifest',
    ]
  ) {
    assertExists(mod[exportName as keyof typeof mod], `missing export ${exportName}`);
  }
});

Deno.test('index: manifest exposes island declarations', async () => {
  const { manifest } = await import('../src/index.ts') as ManifestModule;
  assertEquals(manifest.packageName, '@openelement/ui');

  const islandDecls = manifest.declarations.filter((decl) => decl.openElement?.module);
  assertEquals(islandDecls.length > 0, true);

  for (const decl of islandDecls) {
    assertExists(decl.tagName);
    assertExists(decl.openElement?.module);
    assertEquals(typeof decl.openElement?.hydrate, 'string');
  }
});

for (const { fileName, className, props } of REACTIVE_PROPERTY_CASES) {
  Deno.test(`${fileName}: reactive properties are not shadowed by class fields`, async () => {
    const module = await import(`../src/${fileName}.tsx`);
    const Component = module[className as keyof typeof module] as unknown as new () => object;
    const instance = new Component();

    for (const prop of props) {
      assertFalse(
        Object.prototype.hasOwnProperty.call(instance, prop),
        `${className}.${prop} must use generated accessors, not own fields`,
      );
    }
  });
}
