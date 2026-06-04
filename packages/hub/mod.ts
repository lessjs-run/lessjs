/**
 * @openelement/hub - Registry Hub SDK
 *
 * v0.19.0: Schema, builder, indexer, submission pipeline.
 *
 * Public API:
 * - Schema types and validators
 * - Builder functions for HubPackageRecord
 * - Indexer for search indices
 * - Submitter for submission bundles and PR pipeline
 * - Snapshot management utilities
 *
 * @see docs/sop/v0.19.0-platform-hub.md
 * @see docs/adr/0030-hub-architecture-submission-pipeline.md
 */

// Schema
export type {
  BuildPackageRecordOptions,
  BundleReport,
  CompatibilityTier,
  HubArtifact,
  HubIndex,
  HubIndexEntry,
  HubInstallGuidance,
  HubPackageRecord,
  HubSubmission,
  HubTagRecord,
  SchemaValidationError,
  SecurityReport,
  SubmissionOptions,
  SubmissionResult,
} from './src/schema.ts';

export { validateHubIndex, validateHubPackageRecord, validateHubSubmission } from './src/schema.ts';

// Builder
export { buildInstallGuidance, buildPackageRecord, buildSnapshotPaths } from './src/builder.ts';

// Indexer
export { buildIndex, filterByCompatibility, searchPackages, sortEntries } from './src/indexer.ts';

// Submitter
export {
  buildSubmissionBundle,
  createGithubPr,
  createHtmlArtifact,
  createJsonArtifact,
  createTextArtifact,
  deserializeBundle,
  loadBundle,
  runSubmission,
  serializeBundle,
} from './src/submitter.ts';

// Snapshot
export type { SnapshotMeta } from './src/snapshot.ts';
export {
  buildSnapshotMeta,
  decodeSnapshot,
  encodeSnapshot,
  MAX_SNAPSHOT_BYTES,
  validateSnapshotSize,
} from './src/snapshot.ts';
