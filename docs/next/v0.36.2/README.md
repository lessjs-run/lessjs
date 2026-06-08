# v0.36.2 NextVersion

v0.36.2 is a patch release for SSG bridge migration and rendering evidence
closure.

It moves Vite-free SSG render and HTML post-processing ownership into
`@openelement/ssg` while keeping `@openelement/adapter-vite` responsible for
Vite SSR bundle construction, virtual entry generation, alias/noExternal
orchestration, generated data resolution, and plugin composition.

Primary evidence:

- `packages/ssg/src/ssg-render.ts`
- `packages/ssg/src/postprocess.ts`
- `packages/ssg/__tests__/`
- `packages/adapter-vite/__tests__/ssg-bridge.test.ts`
- `docs/autoflow/cells/cell-v0.36.2-001/events.jsonl`
- `docs/autoflow/metrics/v0.36.2.json`
- `docs/sop/v0.36.2/README.md`
- `docs/release/v0.36.2.md`

Deferred to v0.37.0:

- Complete adapter-vite SSG file ownership migration.
- Server/data/UI/starter/Hub product closure.
- Expanded Firefox/WebKit proof if it is not a simple local setup issue.

## Related

- [ADR-0086: AI-Readable Architecture and AutoFlow Roadmap](../../adr/ADR-0086-ai-readable-architecture-and-autoflow2-roadmap.md)
- [SOP v0.36.2](../../sop/v0.36.2/README.md)
