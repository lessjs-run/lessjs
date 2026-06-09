# v0.36.5 Release Checklist

## Pre-PR

- [x] Release task issue created: #48
- [ ] v0.36.5 SOP and NextVersion package complete
- [ ] v0.36.4 missing NextVersion files added
- [ ] STATUS, ROADMAP, SOP index, changelog, release notes, and website aligned
- [ ] AutoFlow report has no active-package missing-evidence blocker

## Local Gates

- [ ] `deno task workflow:check`
- [ ] `deno task graph:check`
- [ ] `deno task arch:check`
- [ ] `deno task docs:check-current`
- [ ] `deno task docs:check-strategy`
- [ ] `deno task fmt:check`
- [ ] `deno task lint`
- [ ] `deno task typecheck`
- [ ] `deno audit`
- [ ] `deno task verify:configs`
- [ ] `deno task autoflow:check-dev`
- [ ] `deno task autoflow:report:json`
- [ ] `deno task build`
- [ ] `deno task test:e2e`

## PR

- [ ] Link issue #48
- [ ] Summarize gate results
- [ ] State that no package bump, tag, publish, or product feature is included
