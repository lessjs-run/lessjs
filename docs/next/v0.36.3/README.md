# v0.36.3 NextVersion

v0.36.3 completes the SSG file ownership migration that began in v0.36.2.

It moves the remaining SSG-related files out of `@openelement/adapter-vite` and
into `@openelement/ssg`, so that the SSG engine can be consumed without
adapter-vite internal types.

Scope:

- Route scanner and route type generation.
- Virtual entry generator for SSG.
- Vite plugin orchestration specific to SSG.
- Generated data resolver (blog, nav, search, i18n data bridges).
- Remove bridge-only compatibility exports once new import paths are stable.

Deferred to v0.36.4:

- Firefox/WebKit cross-browser E2E proof.

Deferred to v0.37.0:

- Server/data/UI/starter/Hub product closure.

## Related

- [ADR-0086: AI-Readable Architecture and AutoFlow Roadmap](../../adr/ADR-0086-ai-readable-architecture-and-autoflow2-roadmap.md)
- [SOP v0.36.3](../../sop/v0.36.3/README.md)
