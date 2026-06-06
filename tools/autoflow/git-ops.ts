/**
 * Git operations — v0.36.0
 *
 * Kahn isolation principle (C6): each cell operates on its own branch.
 * Branches are safety airbags (paper 05 Git Internals).
 *
 * v0.36 dry-run: all operations are local only.
 *   - create branch, commit changes, run local gates.
 *   - no push, no merge, no remote operations.
 *
 * v0.37 full: push to origin, wait for CI, merge on green.
 */

export interface GitBranchResult {
  success: boolean;
  branchName: string;
  message: string;
}

export interface GitCommitResult {
  success: boolean;
  commitSha: string;
  message: string;
}

export class GitOps {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /** Run a git command and return stdout. */
  private git(args: string[]): { success: boolean; output: string } {
    try {
      const cmd = new Deno.Command('git', {
        args,
        cwd: this.projectRoot,
        stdout: 'piped',
        stderr: 'piped',
      });
      const result = cmd.outputSync();
      const stdout = new TextDecoder().decode(result.stdout).trim();
      const stderr = new TextDecoder().decode(result.stderr).trim();
      return {
        success: result.code === 0,
        output: stdout || stderr,
      };
    } catch (err) {
      return { success: false, output: String(err) };
    }
  }

  /** Get current branch name. */
  currentBranch(): string {
    const r = this.git(['branch', '--show-current']);
    return r.success ? r.output : 'unknown';
  }

  /** Get current HEAD commit SHA. */
  currentSha(): string {
    const r = this.git(['rev-parse', 'HEAD']);
    return r.success ? r.output.slice(0, 7) : 'unknown';
  }

  /** Create and checkout a new branch. */
  createBranch(branchName: string, baseBranch = 'dev'): GitBranchResult {
    // Checkout base first
    const checkout = this.git(['checkout', baseBranch]);
    if (!checkout.success) {
      return {
        success: false,
        branchName,
        message: `Failed to checkout ${baseBranch}: ${checkout.output}`,
      };
    }

    // Create new branch
    const create = this.git(['checkout', '-b', branchName]);
    if (!create.success) {
      return {
        success: false,
        branchName,
        message: `Failed to create ${branchName}: ${create.output}`,
      };
    }

    return {
      success: true,
      branchName,
      message: `Created branch ${branchName} from ${baseBranch}`,
    };
  }

  /** Stage and commit changes. */
  commit(message: string, files?: string[]): GitCommitResult {
    // Stage files (or all changes)
    if (files && files.length > 0) {
      for (const f of files) {
        this.git(['add', f]);
      }
    } else {
      this.git(['add', '-A']);
    }

    const commit = this.git(['commit', '-m', message]);
    if (!commit.success) {
      // No changes to commit — not necessarily an error
      if (commit.output.includes('nothing to commit')) {
        return { success: true, commitSha: 'no-changes', message: 'No changes to commit' };
      }
      return { success: false, commitSha: '', message: commit.output };
    }

    const sha = this.currentSha();
    return { success: true, commitSha: sha, message: `Committed: ${sha}` };
  }

  /** Get the diff between current branch and base. */
  diff(baseBranch = 'dev'): string {
    const r = this.git(['diff', baseBranch]);
    return r.success ? r.output.slice(0, 5000) : ''; // truncate for safety
  }

  /** Check if there are uncommitted changes. */
  hasChanges(): boolean {
    const r = this.git(['status', '--porcelain']);
    return r.success && r.output.length > 0;
  }

  /** Reset working directory to HEAD (abandon all changes). */
  resetHard(): { success: boolean; output: string } {
    return this.git(['reset', '--hard', 'HEAD']);
  }

  /** Clean untracked files. */
  clean(): { success: boolean; output: string } {
    return this.git(['clean', '-fd']);
  }

  /** Checkout back to dev and delete the cell branch. */
  cleanup(branchName: string, baseBranch = 'dev'): { success: boolean; output: string } {
    this.git(['checkout', baseBranch]);
    return this.git(['branch', '-D', branchName]);
  }
}
