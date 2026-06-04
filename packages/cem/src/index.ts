/**
 * @openelement/cem — Custom Elements Manifest Parser.
 *
 * Extracted from @openelement/core in v0.21.0 (SOP-007).
 *
 * Parses and validates Custom Elements Manifest (CEM) JSON files.
 * Extracts openElement-specific declarations, finds module paths for tags,
 * and validates CEM structure.
 *
 * This package is standalone — usable by any tool that needs to
 * parse CEM files, not just openElement.
 */

// v0.23.0: Canonical implementation moved from @openelement/core/cem-parser.
export {
  classifyCemManifest,
  extractLessDeclarations,
  findModulePathForTag,
  parseCem,
  readCemFile,
  validateModulePaths,
} from './cem-parser.js';

// v0.23.0: Canonical type owner for CEM schema & openElement manifest types.
export type {
  CemAttribute,
  CemAttributeType,
  CemCssPart,
  CemCssProperty,
  CemCustomElement,
  CemCustomElementDefinition,
  CemDeclarationKind,
  CemEvent,
  CemExport,
  CemExportKind,
  CemImport,
  CemMemberType,
  CemMethod,
  CemModule,
  CemModuleKind,
  CemParameter,
  CemParseError,
  CemParseResult,
  CemParseWarning,
  CemPrivacy,
  CemProperty,
  CemReference,
  CemSchemaVersion,
  CemSlot,
  CustomElementsManifest,
  OpenElementAttribute,
  OpenElementCssPart,
  OpenElementCssProperty,
  OpenElementDeclaration,
  OpenElementEvent,
  OpenElementExport,
  OpenElementExtensions,
  OpenElementMember,
  OpenElementModule,
  OpenElementPackageExtensions,
  OpenElementPackageManifest,
  OpenElementSlot,
} from './types.js';
