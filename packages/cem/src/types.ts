/**
 * @lessjs/cem — Custom Elements Manifest types.
 *
 * Canonical owner of CEM schema types and LessJS package manifest types.
 * Formerly defined in @lessjs/core/types.ts and migrated here in v0.23.0
 * (SOP-001).
 *
 * Types owned by this package:
 * - CEM schema types (CustomElementsManifest, CemModule, CemCustomElement, etc.)
 * - CEM parse result types (CemParseResult, CemParseError, CemParseWarning)
 * - LessJS package manifest types (LessPackageManifest, LessDeclaration, etc.)
 */

export type ComponentLayer = 'dsd-static' | 'dsd-interactive' | 'pure-island';
export type HydrationStrategy = 'load' | 'idle' | 'visible' | 'only';

// ─── WC Package Protocol (v0.16+) ───────────────────────────────────

/** Custom element attribute descriptor (CEM-compatible) */
export interface LessAttribute {
  /** Attribute name */
  name: string;
  /** Attribute type (e.g. 'string', 'boolean', 'number') */
  type?: string;
  /** Default value */
  default?: string;
  /** Description */
  description?: string;
  /** Whether the attribute reflects to the corresponding property */
  reflects?: boolean;
  /** Field name on the element class (if different from attribute name) */
  fieldName?: string;
}

/** Custom element class member descriptor (CEM-compatible) */
export interface LessMember {
  /** Member name */
  name: string;
  /** Member kind */
  kind: 'field' | 'method' | 'property';
  /** Type string */
  type?: string;
  /** Default value */
  default?: string;
  /** Description */
  description?: string;
  /** Privacy level */
  privacy?: 'public' | 'protected' | 'private';
  /** Whether this member is static */
  static?: boolean;
  /** Whether this member is readonly */
  readonly?: boolean;
}

/** Custom element event descriptor (CEM-compatible) */
export interface LessEvent {
  /** Event name */
  name: string;
  /** Event type (e.g. 'CustomEvent<{ value: string }>') */
  type?: string;
  /** Description */
  description?: string;
}

/** Custom element slot descriptor (CEM-compatible) */
export interface LessSlot {
  /** Slot name (empty string for default slot) */
  name: string;
  /** Description */
  description?: string;
}

/** Custom element CSS custom property descriptor (CEM-compatible) */
export interface LessCssProperty {
  /** CSS property name (e.g. '--button-padding') */
  name: string;
  /** Default value */
  default?: string;
  /** Description */
  description?: string;
  /** Type (e.g. 'length', 'color') */
  type?: string;
}

/** Custom element CSS part descriptor (CEM-compatible) */
export interface LessCssPart {
  /** Part name */
  name: string;
  /** Description */
  description?: string;
}

/** SSR/DSD/hydration declarations for a LessJS custom element */
export interface LessElementExtensions {
  /** Whether this component can be server-side rendered */
  ssr?: boolean;
  /** Whether this component uses Declarative Shadow DOM for SSR output */
  dsd?: boolean;
  /** Component layer in the three-layer model */
  layer?: ComponentLayer;
  /** Hydration strategy for client-side upgrade */
  hydrate?: HydrationStrategy;
  /** Module path for import (e.g. '@lessjs/ui/less-button') */
  module?: string;
  /** Export name from the module (default: tagName in PascalCase) */
  export?: string;
}

/** Package-level LessJS declarations */
export interface LessPackageExtensions {
  /** Minimum LessJS core version required */
  lessjsVersion?: string;
  /** Adapter required for SSR rendering (e.g. 'lit', 'vanilla') */
  adapter?: string;
  /** Whether this package provides a default CSS stylesheet */
  hasStylesheet?: boolean;
  /** CSS custom property prefix (e.g. 'less') */
  cssPrefix?: string;
}

/** Named export descriptor within a package module */
export interface LessExport {
  /** Export name (e.g. 'LessButton') */
  name: string;
  /** Reference path (e.g. './less-button.js') */
  path?: string;
  /** Description */
  description?: string;
}

/** Custom element declaration within a LessJS package manifest */
export interface LessDeclaration {
  /** Custom element tag name (must be valid per HTML spec) */
  tagName: string;
  /** Element class name */
  className?: string;
  /** Super class name (e.g. 'LitElement') */
  superclassName?: string;
  /** Attributes */
  attributes?: LessAttribute[];
  /** Class members */
  members?: LessMember[];
  /** Events */
  events?: LessEvent[];
  /** Slots */
  slots?: LessSlot[];
  /** CSS custom properties */
  cssProperties?: LessCssProperty[];
  /** CSS shadow parts */
  cssParts?: LessCssPart[];
  /** LessJS SSR/DSD/hydration extensions */
  less?: LessElementExtensions;
  /** Description */
  description?: string;
}

/** Module entry within a LessJS package manifest */
export interface LessModule {
  /** Module path relative to package root (e.g. './less-button.js') */
  path: string;
  /** Named exports from this module */
  exports?: LessExport[];
  /** Declarations defined in this module */
  declarations?: string[];
}

/** CEM-compatible package manifest for LessJS Web Component packages.
 *
 * Structured, tool-consumable metadata for an entire WC package.
 */
export interface LessPackageManifest {
  /** Schema version of the manifest format */
  schemaVersion: string;
  /** Package name on JSR/npm (e.g. '@lessjs/ui') */
  packageName: string;
  /** Package version (semver) */
  version: string;
  /** Human-readable package description */
  description?: string;
  /** Author or organization */
  author?: string;
  /** License identifier (e.g. 'MIT') */
  license?: string;
  /** Homepage URL */
  homepage?: string;
  /** Repository URL */
  repository?: string;
  /** Custom element declarations in this package */
  declarations: LessDeclaration[];
  /** Module entry points */
  modules?: LessModule[];
  /** Package-level LessJS extensions */
  less?: LessPackageExtensions;
}

// ─── CEM Schema Types ──────────────────────────────────────────────

/** CEM schema version */
export type CemSchemaVersion = string;

/** CEM module kind */
export type CemModuleKind = 'javascript-module' | 'css' | 'html';

/** CEM declaration kind */
export type CemDeclarationKind =
  | 'custom-element'
  | 'custom-element-definition'
  | 'mixin'
  | 'variable'
  | 'function'
  | 'class'
  | 'method'
  | 'field'
  | 'property'
  | 'attribute'
  | 'event'
  | 'slot'
  | 'css-property'
  | 'css-part';

/** CEM visibility/privacy */
export type CemPrivacy = 'public' | 'protected' | 'private';

/** CEM attribute type */
export type CemAttributeType = 'string' | 'boolean' | 'number' | 'array' | 'object' | 'function';

/** CEM member type */
export type CemMemberType = 'field' | 'method' | 'property';

/** CEM export kind */
export type CemExportKind = 'default' | 'named';

/**
 * Base CEM entry with common fields.
 */
interface CemBase {
  /** Declaration kind */
  kind: CemDeclarationKind;
  /** Human-readable description */
  description?: string;
  /** Deprecation notice */
  deprecated?: boolean | string;
  /** Since version */
  since?: string;
  /** Author name */
  author?: string;
  /** Additional metadata (preserve unknown CEM fields) */
  [key: string]: unknown;
}

/** CEM attribute descriptor */
export interface CemAttribute extends CemBase {
  kind: 'attribute';
  /** Attribute name */
  name: string;
  /** Attribute type */
  type?: CemAttributeType | string;
  /** Default value */
  defaultValue?: string;
  /** Whether the attribute reflects to a property */
  reflects?: boolean;
  /** Property name (if different from attribute name) */
  propertyName?: string;
  /** Whether the attribute is required */
  required?: boolean;
}

/** CEM property descriptor */
export interface CemProperty extends CemBase {
  kind: 'property';
  /** Property name */
  name: string;
  /** Property type */
  type?: string;
  /** Default value */
  defaultValue?: string;
  /** Whether the property is readonly */
  readonly?: boolean;
  /** Whether the property is static */
  static?: boolean;
  /** Privacy level */
  privacy?: CemPrivacy;
}

/** CEM method descriptor */
export interface CemMethod extends CemBase {
  kind: 'method';
  /** Method name */
  name: string;
  /** Return type */
  returns?: string;
  /** Parameters */
  params?: CemParameter[];
  /** Privacy level */
  privacy?: CemPrivacy;
  /** Whether the method is static */
  static?: boolean;
  /** Whether the method is async */
  async?: boolean;
}

/** CEM parameter descriptor */
export interface CemParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type?: string;
  /** Whether the parameter is optional */
  optional?: boolean;
  /** Default value */
  default?: string;
  /** Whether the parameter is a rest parameter */
  rest?: boolean;
}

/** CEM event descriptor */
export interface CemEvent extends CemBase {
  kind: 'event';
  /** Event name */
  name: string;
  /** Event type (e.g. 'CustomEvent', 'Event') */
  type?: string;
  /** Event detail type */
  detailType?: string;
  /** Whether the event bubbles */
  bubbles?: boolean;
  /** Whether the event is cancelable */
  cancelable?: boolean;
  /** Whether the event is composed */
  composed?: boolean;
}

/** CEM slot descriptor */
export interface CemSlot extends CemBase {
  kind: 'slot';
  /** Slot name (empty string for default slot) */
  name: string;
  /** Whether the slot is required */
  required?: boolean;
}

/** CEM CSS custom property descriptor */
export interface CemCssProperty extends CemBase {
  kind: 'css-property';
  /** CSS property name (e.g. '--button-padding') */
  name: string;
  /** Default value */
  defaultValue?: string;
  /** CSS type (e.g. 'length', 'color', 'number') */
  syntax?: string;
  /** Whether the property inherits */
  inherits?: boolean;
  /** Initial value */
  initialValue?: string;
}

/** CEM CSS part descriptor */
export interface CemCssPart extends CemBase {
  kind: 'css-part';
  /** Part name */
  name: string;
  /** Whether the part is required */
  required?: boolean;
}

/** CEM custom element declaration */
export interface CemCustomElement extends CemBase {
  kind: 'custom-element';
  /** Custom element tag name */
  tagName: string;
  /** Class name */
  className?: string;
  /** Super class name or reference */
  superClass?: CemReference;
  /** Attributes */
  attributes?: CemAttribute[];
  /** Properties */
  properties?: CemProperty[];
  /** Methods */
  methods?: CemMethod[];
  /** Events */
  events?: CemEvent[];
  /** Slots */
  slots?: CemSlot[];
  /** CSS custom properties */
  cssProperties?: CemCssProperty[];
  /** CSS shadow parts */
  cssParts?: CemCssPart[];
  /** Whether the element uses shadow DOM */
  shadowDOM?: boolean;
  /** Shadow root mode */
  shadowRootMode?: 'open' | 'closed';
  /** Whether the element is a form-associated custom element */
  formAssociated?: boolean;
  /** LessJS SSR/DSD/hydration extensions (non-standard, LessJS-specific) */
  less?: LessElementExtensions;
}

/** CEM reference to another declaration */
export interface CemReference {
  /** Module path */
  module?: string;
  /** Declaration name */
  name: string;
}

/** CEM custom element definition (e.g. customElements.define call) */
export interface CemCustomElementDefinition extends CemBase {
  kind: 'custom-element-definition';
  /** Custom element tag name */
  tagName: string;
  /** Reference to the class declaration */
  declaration: CemReference;
  /** Module where the definition occurs */
  module?: string;
}

/** CEM export descriptor */
export interface CemExport {
  /** Export kind */
  kind: CemExportKind;
  /** Exported name (for named exports) */
  name?: string;
  /** Declaration reference */
  declaration: CemReference;
}

/** CEM module descriptor */
export interface CemModule {
  /** Module kind */
  kind: CemModuleKind;
  /** Module path relative to package root */
  path: string;
  /** Declarations defined in this module */
  declarations?: (CemCustomElement | CemCustomElementDefinition | CemBase)[];
  /** Exports from this module */
  exports?: CemExport[];
  /** Imports in this module */
  imports?: CemImport[];
}

/** CEM import descriptor */
export interface CemImport {
  /** Imported name */
  name: string;
  /** Export name in the source module */
  exportName?: string;
  /** Source module path or package name */
  module: string;
  /** Whether the import is a type-only import */
  typeOnly?: boolean;
}

/** Custom Elements Manifest (CEM) root schema */
export interface CustomElementsManifest {
  /** Schema version */
  schemaVersion: CemSchemaVersion;
  /** Package name */
  packageName?: string;
  /** Package version */
  version?: string;
  /** Readme content */
  readme?: string;
  /** Modules described by this manifest */
  modules: CemModule[];
  /** Preserve unknown top-level fields for future compatibility */
  [key: string]: unknown;
}

// ─── CEM Parse Result Types ─────────────────────────────────────

/** Result of parsing a CEM file */
export interface CemParseResult {
  /** Whether parsing succeeded */
  success: boolean;
  /** Parsed manifest (when success is true) */
  manifest?: CustomElementsManifest;
  /** Parse errors */
  errors: CemParseError[];
  /** Parse warnings */
  warnings: CemParseWarning[];
}

/** CEM parse error */
export interface CemParseError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Path to the problematic field */
  path?: string;
}

/** CEM parse warning */
export interface CemParseWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Path to the field that triggered the warning */
  path?: string;
}
