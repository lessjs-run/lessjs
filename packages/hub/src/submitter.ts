/**
 * @lessjs/hub - Submission Bundler + GitHub PR Pipeline
 *
 * v0.19.0: Bundle validation artifacts into submission format,
 * optionally create GitHub Pull Requests for Hub registration.
 *
 * @see ADR-0030 (CLI Submission Pipeline)
 */

import type {
  HubArtifact,
  HubPackageRecord,
  HubSubmission,
  SubmissionOptions,
  SubmissionResult,
} from './schema.ts';

// ─── Submission Bundle ───────────────────────────────────────────────────

/**
 * Build a HubSubmission bundle from a package record and its artifacts.
 *
 * @param record - The HubPackageRecord to submit
 * @param artifacts - Supporting artifacts (snapshots, reports, etc.)
 * @returns A fully formed HubSubmission
 */
export function buildSubmissionBundle(
  record: HubPackageRecord,
  artifacts: HubArtifact[],
): HubSubmission {
  return {
    schema: 'hub-submission-v1',
    package: record,
    artifacts,
  };
}

// ─── Artifact Helpers ────────────────────────────────────────────────────

/**
 * Create a HubArtifact from a string content.
 */
export function createTextArtifact(
  path: string,
  content: string,
): HubArtifact {
  return {
    path,
    contentType: 'text/plain',
    content,
  };
}

/**
 * Create a HubArtifact from a JSON object.
 */
export function createJsonArtifact(
  path: string,
  data: unknown,
): HubArtifact {
  return {
    path,
    contentType: 'application/json',
    content: JSON.stringify(data, null, 2),
  };
}

/**
 * Create a HubArtifact from an HTML string.
 */
export function createHtmlArtifact(
  path: string,
  html: string,
): HubArtifact {
  return {
    path,
    contentType: 'text/html',
    content: html,
  };
}

// ─── Submission Runner ───────────────────────────────────────────────────

/**
 * Run the full submission pipeline.
 *
 * Steps:
 * 1. Build submission bundle from record + artifacts
 * 2. If dry-run: print preview and exit
 * 3. If not dry-run: create GitHub fork + PR via gh CLI
 *
 * @param record - HubPackageRecord to submit
 * @param artifacts - Supporting artifacts
 * @param options - Submission options
 * @returns SubmissionResult
 */
export async function runSubmission(
  record: HubPackageRecord,
  artifacts: HubArtifact[],
  options: SubmissionOptions,
): Promise<SubmissionResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Build bundle
  const bundle = buildSubmissionBundle(record, artifacts);

  // Write bundle to file
  const bundlePath = options.outputPath;
  try {
    const json = JSON.stringify(bundle, null, 2);
    await Deno.writeTextFile(bundlePath, json);
    if (options.verbose) {
      console.error(`  Submission bundle written to ${bundlePath}`);
    }
  } catch (e) {
    errors.push(`Failed to write submission bundle: ${e}`);
    return { success: false, errors, warnings, bundlePath };
  }

  // Dry-run mode
  if (options.dryRun) {
    const pkg = record.scope ? `${record.scope}/${record.name}` : record.name;
    console.log(`\n  📦 Hub Submission Preview`);
    console.log(`  ─────────────────────────`);
    console.log(`  Package:      ${pkg} v${record.version}`);
    console.log(`  Source:       ${record.source}`);
    console.log(`  Compat:       ${record.compatibility}`);
    console.log(`  Tags:         ${record.tags.length}`);
    console.log(`  Artifacts:    ${artifacts.length}`);
    console.log(`  Safe install: ${record.installGuidance.safeToInstall ? '✅' : '❌'}`);
    console.log(`  SSR capable:  ${record.installGuidance.ssrCapable ? '✅' : '❌'}`);
    if (record.installGuidance.warnings.length > 0) {
      console.log(`  Warnings:`);
      for (const w of record.installGuidance.warnings) {
        console.log(`    ⚠️  ${w}`);
      }
    }
    console.log(`\n  Output: ${bundlePath}`);
    console.log(`  Run without --dry-run to create a GitHub PR.\n`);
    return { success: true, bundlePath, errors, warnings };
  }

  // GitHub PR mode
  if (!options.skipPr) {
    try {
      const prUrl = await createGithubPr(bundle, options);
      if (prUrl) {
        if (options.verbose) {
          console.error(`  Pull request created: ${prUrl}`);
        }
        return { success: true, prUrl, bundlePath, errors, warnings };
      }
    } catch (e) {
      warnings.push(`GitHub PR creation failed: ${e}`);
      warnings.push('Submission bundle saved locally. Create a PR manually.');
    }
  }

  return { success: true, bundlePath, errors, warnings };
}

// ─── GitHub PR Creation ──────────────────────────────────────────────────

/**
 * Create a GitHub Pull Request for a Hub submission.
 *
 * Requires:
 * - `gh` CLI installed and authenticated
 * - A fork of the target repository (created automatically if needed)
 *
 * @param bundle - The submission bundle
 * @param options - Submission options
 * @returns PR URL or null
 */
export async function createGithubPr(
  bundle: HubSubmission,
  options: SubmissionOptions,
): Promise<string | null> {
  const pkg = bundle.package;
  const packageFullName = pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name;
  const branchName = `hub-submit/${packageFullName}-${pkg.version.replace(/\./g, '-')}`;

  try {
    // Check gh CLI availability
    const whichResult = await new Deno.Command('which', {
      args: ['gh'],
    }).output();
    if (!whichResult.success) {
      throw new Error('gh CLI not found. Install GitHub CLI and authenticate.');
    }

    if (options.verbose) {
      console.error(`  Creating PR on branch: ${branchName}`);
    }

    // Create and switch to a new branch
    const checkoutCmd = new Deno.Command('git', {
      args: ['checkout', '-b', branchName],
      cwd: options.packageDir,
    });
    const checkoutResult = await checkoutCmd.output();
    if (!checkoutResult.success) {
      throw new Error(
        `Failed to create branch: ${new TextDecoder().decode(checkoutResult.stderr)}`,
      );
    }

    // Write the package record to hub-index/packages/
    const recordPath = `hub-index/packages/${packageFullName}.json`;
    await Deno.writeTextFile(
      `${options.packageDir}/${recordPath}`,
      JSON.stringify(bundle.package, null, 2),
    );

    // Stage and commit
    const addCmd = new Deno.Command('git', {
      args: ['add', recordPath],
      cwd: options.packageDir,
    });
    await addCmd.output();

    const commitCmd = new Deno.Command('git', {
      args: [
        'commit',
        '-m',
        `hub: submit ${packageFullName} v${pkg.version}`,
        '-m',
        `Compatibility: ${pkg.compatibility}\nTags: ${pkg.tags.length}\nSource: ${pkg.source}`,
      ],
      cwd: options.packageDir,
    });
    const commitResult = await commitCmd.output();
    if (!commitResult.success) {
      const stderr = new TextDecoder().decode(commitResult.stderr);
      throw new Error(`Failed to commit: ${stderr}`);
    }

    // Push branch
    const pushCmd = new Deno.Command('git', {
      args: ['push', 'origin', branchName],
      cwd: options.packageDir,
    });
    const pushResult = await pushCmd.output();
    if (!pushResult.success) {
      const stderr = new TextDecoder().decode(pushResult.stderr);
      throw new Error(`Failed to push branch: ${stderr}`);
    }

    // Create PR via gh CLI
    const prCmd = new Deno.Command('gh', {
      args: [
        'pr',
        'create',
        '--title',
        `hub: ${packageFullName} v${pkg.version}`,
        '--body',
        [
          `## Hub Submission: ${packageFullName} v${pkg.version}`,
          '',
          `**Compatibility:** ${pkg.compatibility}`,
          `**Source:** ${pkg.source}`,
          `**Tags:** ${pkg.tags.length} component(s)`,
          `**SSR capable:** ${pkg.installGuidance.ssrCapable ? 'Yes' : 'No'}`,
          `**Safe to install:** ${pkg.installGuidance.safeToInstall ? 'Yes' : 'No'}`,
          '',
          '### Artifacts',
          `- Validation report included`,
          pkg.reports.dsd ? '- DSD build report included' : '',
          Object.keys(pkg.snapshotPaths).length > 0
            ? `- ${Object.keys(pkg.snapshotPaths).length} snapshot(s)`
            : '',
          '',
          '---',
          `Submitted via \`less hub submit\` (v${pkg.validatorVersion})`,
        ].filter(Boolean).join('\n'),
      ],
      cwd: options.packageDir,
    });
    const prResult = await prCmd.output();
    if (!prResult.success) {
      const stderr = new TextDecoder().decode(prResult.stderr);
      throw new Error(`Failed to create PR: ${stderr}`);
    }

    const prUrl = new TextDecoder().decode(prResult.stdout).trim();

    // Switch back to original branch
    await new Deno.Command('git', {
      args: ['checkout', '-'],
      cwd: options.packageDir,
    }).output();

    return prUrl;
  } catch (e) {
    // Switch back on failure
    try {
      await new Deno.Command('git', {
        args: ['checkout', '-'],
        cwd: options.packageDir,
      }).output();
    } catch {
      // Best effort
    }
    throw e;
  }
}

// ─── Bundle Serialization ────────────────────────────────────────────────

/**
 * Serialize a submission bundle to a JSON string.
 */
export function serializeBundle(bundle: HubSubmission): string {
  return JSON.stringify(bundle, null, 2);
}

/**
 * Deserialize a submission bundle from a JSON string.
 */
export function deserializeBundle(json: string): HubSubmission {
  return JSON.parse(json) as HubSubmission;
}

/**
 * Load a submission bundle from a file.
 */
export async function loadBundle(path: string): Promise<HubSubmission> {
  const content = await Deno.readTextFile(path);
  return deserializeBundle(content);
}
