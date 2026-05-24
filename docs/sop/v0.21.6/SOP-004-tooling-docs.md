# SOP-004: Document CI/Dev Tooling Gotchas

Status: planned\
Target version: v0.21.6\
Owner: docs

## Objective

Document two tooling issues discovered during v0.21.5 release that block new
contributors and CI setup.

## Issue 1: CodeQL Default + Advanced Setup Conflict

When a GitHub repository has the default CodeQL analysis enabled (via
Settings → Code security → Code scanning → CodeQL analysis),
adding a custom `.github/workflows/codeql.yml` with advanced queries
(`security-extended,security-and-quality`) causes:

```
Error: CodeQL analyses from advanced configurations cannot be processed
when the default setup is enabled
```

**Fix**: Disable the default CodeQL setup at
`https://github.com/<org>/<repo>/settings/security_analysis`

**Document in**: `CONTRIBUTING.md` or `docs/guide/ci-setup.md`

## Issue 2: PowerShell `@'...'@` HERE String in Git Commits

On Windows, `git commit -m @'...'@` prefixes the first line of the commit
message with `@`:

```
git commit -m @'
release: v0.21.5
'@
# Result: "@ release: v0.21.5"  ← BAD
```

**Root cause**: PowerShell's HERE string syntax treats the opening `@'` as
content when piped to a non-PowerShell command.

**Workaround**: Use `printf` to write the message to a temp file, then
`git commit -F`:

```bash
printf 'subject line\n\nbody line 1\nbody line 2\n' > /tmp/msg.txt
git commit -F /tmp/msg.txt
```

**Document in**: `CONTRIBUTING.md`

## Acceptance Criteria

- [ ] `CONTRIBUTING.md` includes CodeQL setup instructions
- [ ] `CONTRIBUTING.md` includes PowerShell git commit workaround
- [ ] Both issues are linked from the v0.21.6 README
