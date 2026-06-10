# v0.37.3 Acceptance Criteria

- [x] Data adapter contract is defined and type-safe.
- [x] MemoryDataAdapter has unit tests proving get/keys behavior.
- [x] Existing ISR cache implementations remain functional (no regression).
- [x] ADR-0095 is accepted and registered.
- [x] All local gates pass (typecheck, test, graph:check, arch:check).
- [x] `publish:dry-run` passes through the same graph-driven package order used
      by live publishing.
- [x] `publish` gate completes: code-validation CI green (build, test, coverage,
      lint, typecheck), graph-driven sequential publish to JSR, and post-publish
      consumer smoke on Windows.
- [x] `main` Publish to JSR passes; all 20 `@openelement/*` packages reach
      `0.37.2` on JSR and the consumer smoke confirms a clean local install.

> FileDataAdapter was deferred to recipe level per ADR-0095 Non-Goals. The
> framework core must not import filesystem APIs. Build-time JSON loading is a
> recipe concern.
