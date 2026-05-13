# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in LessJS, please report it privately.

**Do not** file a public GitHub issue. Instead, send a description to the
project maintainers via GitHub Issues with the `security` label.

You should receive a response within 48 hours. If you don't, please follow up.

## What to Include

- A clear description of the vulnerability
- Steps to reproduce
- Affected versions
- Potential impact
- Any suggested fix (if available)

## Scope

The following are in scope:
- `@lessjs/core` — HTML escaping, DSD rendering, XSS vectors
- `@lessjs/adapter-vite` — CSP injection, virtual module security
- `@lessjs/create` — Scaffolding code injection

The following are **out of scope**:
- Third-party dependencies (report to their respective maintainers)
- Theoretical attacks requiring physical access
- Self-XSS
