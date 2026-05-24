# Contributing to LessJS

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/lessjs-run/lessjs.git
cd lessjs
deno task dev      # Start dev server at localhost:5173
deno task build    # Production build (3-phase SSG)
deno task test     # Run all tests
```

## Project Structure

```
packages/
  core/           # Pure runtime - DSD rendering, Islands, Navigation
  adapter-vite/   # Vite plugin + SSG build pipeline
  adapter-lit/    # Lit -> DSD adapter
  app/            # Umbrella package: lessjs() = less() + content + i18n
  content/        # Blog + Navigation + Sitemap
  i18n/           # Internationalization
  ui/             # Web Components + design tokens
  signals/        # TC39 Signals polyfill
  rpc/            # Fetch-based RPC controller
  create/         # Scaffolding CLI
www/              # lessjs.run website
```

## Before Submitting a PR

1. Run `deno task fmt` - format all code
2. Run `deno task lint` - check for lint errors
3. Run `deno task test` - ensure all tests pass
4. Write tests for new functionality (we aim for ≥60% coverage per package)
5. Update relevant README if changing public API

## Code Style

- TypeScript with Deno
- Single quotes, semicolons, 2-space indent
- Use `createLogger()` for logging (not console.log)
- Use `LessError` subclasses for errors (not generic Error)
- Reference ADR numbers in comments for architectural decisions

## Release Process

See [RELEASE.md](./RELEASE.md) for the full release workflow.

## Windows Tips

### PowerShell `git commit` with multi-line messages

PowerShell's `@'...'@` here-string syntax leaks a literal `@` into the first
line of the commit message when used with `git commit -m`. Use a temp file
instead:

```powershell
# BAD - leaks '@' prefix
git commit -m @'
fix: something
detailed body
'@

# GOOD - write to temp file, commit from file
"fix: something`n`ndetailed body" | Out-File -Encoding utf8 /tmp/msg
git commit -F /tmp/msg
```
