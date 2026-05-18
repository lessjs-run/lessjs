/**
 * @lessjs/hub — Registry Hub Data Schema
 *
 * v0.19.0: Hub package records, search index, submission bundles.
 *
 * All types are plain data. No runtime dependencies beyond TypeScript.
 *
 * @see ADR-0030 (Hub Architecture — Static Index + CLI Submission Pipeline)
 * @see docs/sop/v0.19.0-platform-hub.md
 */

// ─── Compatibility ───────────────────────────────────────────────────────

/** 4-tier compatibility classification, same as @lessjs/core/compatibility */
export type CompatibilityTier =
  | 'ssr-capable'
  | 'client-only'
  | 'rejected'
  | 'experimental-dom';

// ─── Tag Record ──────────────────────────────────────────────────────────

/** Per-tag record inside a Hub package version */
export interface HubTagRecord {
  tagName: string;
  compatibility: CompatibilityTier;
  validationErrors: number;
  validationWarnings: number;
  ssrSnapshot?: string; // relative path to SSR snapshot (HTML)

  // CEM API reference data (from custom-elements.json)
  attributes?: CemAttribute[];
  events?: CemEvent[];
  slots?: CemSlot[];
  usageExample?: string;
}

/** CEM attribute descriptor */
export interface CemAttribute {
  name: string;
  type?: string;
  default?: string;
  description?: string;
  fieldName?: string;
}

/** CEM event descriptor */
export interface CemEvent {
  name: string;
  type?: string;
  description?: string;
}

/** CEM slot descriptor */
export interface CemSlot {
  name: string; // empty string for default slot
  description?: string;
}

// ─── Install Guidance ────────────────────────────────────────────────────

export interface HubInstallGuidance {
  safeToInstall: boolean;
  command: string; // e.g. "less add shoelace"
  configChanges: string[]; // config keys that will be added
  warnings: string[]; // known risks before install
  ssrCapable: boolean;
}

// ─── Reports ─────────────────────────────────────────────────────────────

/** Minimal bundle size report */
export interface BundleReport {
  totalBytes: number;
  gzipBytes?: number;
  entryPoints: Record<string, number>;
}

/** Minimal security report */
export interface SecurityReport {
  auditDate: string;
  vulnerabilities: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

// ─── Package Record ──────────────────────────────────────────────────────

/**
 * Per-version record stored in hub-index/packages/<scope>/<name>.json
 *
 * This is the canonical evidence artifact for one package version.
 * All fields are derived from machine-readable validation/build output.
 */
export interface HubPackageRecord {
  /** Schema marker for forward compatibility */
  schema: 'hub-package-v1';

  /** Package identity */
  name: string;
  scope: string; // e.g. "@shoelace" or ""
  version: string; // semver
  source: 'jsr' | 'npm' | 'local';
  repository?: string;
  description?: string;
  homepage?: string;

  /** Manifest integrity */
  manifestHash: string; // sha256 of custom-elements.json
  manifestPath?: string; // relative path in submission

  /** Compatibility classification */
  compatibility: CompatibilityTier;
  compatibilityJustification: string;

  /** Tags discovered from CEM */
  tags: HubTagRecord[];

  /** Evidence reports */
  reports: {
    validation: string; // inline JSON string or path
    dsd?: string;
    bundle?: string;
    security?: string;
  };

  /** SSR snapshot paths: tagName → relative path to HTML file */
  snapshotPaths: Record<string, string>;

  /** Install guidance generated from compatibility data */
  installGuidance: HubInstallGuidance;

  /** Submission metadata */
  submittedAt: string; // ISO 8601
  submittedBy?: string; // GitHub username
  validatorVersion: string; // e.g. "0.19.0"
}

// ─── Search Index ───────────────────────────────────────────────────────

/** Lightweight search index entry — one per package version */
export interface HubIndexEntry {
  name: string;
  scope: string;
  version: string;
  description: string;
  compatibility: CompatibilityTier;
  tags: string[]; // tag names only, for search
  source: 'jsr' | 'npm' | 'local';
  safeToInstall: boolean;
  ssrCapable: boolean;
  submittedAt: string; // ISO 8601 — for "New" badge (< 7 days)
}

/** Full search index, regenerated on each merge */
export interface HubIndex {
  schema: 'hub-index-v1';
  updatedAt: string;
  packages: HubIndexEntry[];
}

// ─── Submission Bundle ───────────────────────────────────────────────────

/** An artifact included in a submission bundle */
export interface HubArtifact {
  path: string;
  contentType: string; // MIME type
  content: string; // base64-encoded or inline string
}

/** Submission bundle produced by `less hub submit` */
export interface HubSubmission {
  schema: 'hub-submission-v1';
  package: HubPackageRecord;
  artifacts: HubArtifact[];
}

// ─── Submission Result ───────────────────────────────────────────────────

export interface SubmissionResult {
  success: boolean;
  prUrl?: string;
  bundlePath?: string;
  errors: string[];
  warnings: string[];
}

// ─── Build Options ───────────────────────────────────────────────────────

export interface BuildPackageRecordOptions {
  name: string;
  scope: string;
  version: string;
  source: 'jsr' | 'npm' | 'local';
  compatibility: CompatibilityTier;
  compatibilityJustification: string;
  tags: HubTagRecord[];
  validationReport: string; // JSON string from validate-manifest
  dsdReport?: string; // JSON string from dsd-report.json
  snapshotPaths?: Record<string, string>;
  repository?: string;
  description?: string;
  homepage?: string;
  submittedBy?: string;
  validatorVersion: string;

  /** Raw CEM content to compute manifestHash from (optional) */
  manifestContent?: string;
}

// ─── Submission Options ──────────────────────────────────────────────────

export interface SubmissionOptions {
  packageDir: string;
  source: 'jsr' | 'npm' | 'local';
  dryRun: boolean;
  skipPr: boolean;
  outputPath: string;
  verbose: boolean;
}

// ─── Schema Validation ───────────────────────────────────────────────────

/**
 * Compute SHA-256 hash of a CEM manifest string.
 */
export async function computeManifestHash(content: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(content),
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface SchemaValidationError {
  path: string;
  message: string;
  value?: unknown;
}

export interface SchemaValidationResult {
  errors: SchemaValidationError[];
  warnings: SchemaValidationWarning[];
}

export interface SchemaValidationWarning {
  path: string;
  message: string;
  value?: unknown;
}

/**
 * Validate a HubPackageRecord against the v1 schema.
 * Returns errors (must fix) and warnings (should fix).
 */
export function validateHubPackageRecord(
  record: unknown,
): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];

  if (!record || typeof record !== 'object') {
    errors.push({ path: '', message: 'Expected an object' });
    return errors;
  }

  const r = record as Record<string, unknown>;

  if (r.schema !== 'hub-package-v1') {
    errors.push({ path: 'schema', message: `Expected "hub-package-v1", got "${r.schema}"` });
  }

  if (typeof r.name !== 'string' || !r.name) {
    errors.push({ path: 'name', message: 'Missing or non-string name' });
  }

  if (typeof r.scope !== 'string') {
    errors.push({ path: 'scope', message: 'Missing or non-string scope' });
  }

  if (typeof r.version !== 'string' || !r.version) {
    errors.push({ path: 'version', message: 'Missing or non-string version' });
  }

  if (!['jsr', 'npm', 'local'].includes(r.source as string)) {
    errors.push({ path: 'source', message: `Invalid source: "${r.source}"` });
  }

  if (
    !['ssr-capable', 'client-only', 'rejected', 'experimental-dom'].includes(
      r.compatibility as string,
    )
  ) {
    errors.push({
      path: 'compatibility',
      message: `Invalid compatibility tier: "${r.compatibility}"`,
    });
  }

  if (!Array.isArray(r.tags)) {
    errors.push({ path: 'tags', message: 'Missing or non-array tags' });
  } else {
    // Validate tag names follow WHATWG custom element name rules
    for (let i = 0; i < r.tags.length; i++) {
      const tag = r.tags[i] as Record<string, unknown>;
      const tagName = tag?.tagName;
      if (typeof tagName === 'string' && !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(tagName)) {
        errors.push({
          path: `tags[${i}].tagName`,
          message:
            `Invalid custom element name: "${tagName}". Must start with lowercase letter, contain only lowercase/digits/hyphens.`,
        });
      }
    }
  }

  if (!r.reports || typeof r.reports !== 'object') {
    errors.push({ path: 'reports', message: 'Missing reports' });
  } else {
    const reports = r.reports as Record<string, unknown>;
    if (typeof reports.validation !== 'string') {
      errors.push({
        path: 'reports.validation',
        message: 'Missing or non-string validation report',
      });
    }
  }

  const guidance = r.installGuidance as Record<string, unknown> | undefined;
  if (!guidance || typeof guidance !== 'object') {
    errors.push({ path: 'installGuidance', message: 'Missing installGuidance' });
  } else {
    if (typeof guidance.safeToInstall !== 'boolean') {
      errors.push({ path: 'installGuidance.safeToInstall', message: 'Missing or non-boolean' });
    }
    if (typeof guidance.command !== 'string') {
      errors.push({ path: 'installGuidance.command', message: 'Missing or non-string command' });
    }
  }

  if (typeof r.submittedAt !== 'string') {
    errors.push({ path: 'submittedAt', message: 'Missing or non-string submittedAt' });
  }

  return errors;
}

/**
 * Validate a HubIndex against the v1 schema.
 */
export function validateHubIndex(index: unknown): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];

  if (!index || typeof index !== 'object') {
    errors.push({ path: '', message: 'Expected an object' });
    return errors;
  }

  const idx = index as Record<string, unknown>;

  if (idx.schema !== 'hub-index-v1') {
    errors.push({ path: 'schema', message: `Expected "hub-index-v1", got "${idx.schema}"` });
  }

  if (!Array.isArray(idx.packages)) {
    errors.push({ path: 'packages', message: 'Missing or non-array packages' });
  }

  return errors;
}

/**
 * Validate a HubSubmission against the v1 schema.
 */
export function validateHubSubmission(
  submission: unknown,
): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];

  if (!submission || typeof submission !== 'object') {
    errors.push({ path: '', message: 'Expected an object' });
    return errors;
  }

  const s = submission as Record<string, unknown>;

  if (s.schema !== 'hub-submission-v1') {
    errors.push({ path: 'schema', message: `Expected "hub-submission-v1", got "${s.schema}"` });
  }

  // Validate the nested package record
  const pkgErrors = validateHubPackageRecord(s.package);
  for (const e of pkgErrors) {
    errors.push({ path: `package.${e.path}`, message: e.message });
  }

  if (!Array.isArray(s.artifacts)) {
    errors.push({ path: 'artifacts', message: 'Missing or non-array artifacts' });
  }

  return errors;
}
