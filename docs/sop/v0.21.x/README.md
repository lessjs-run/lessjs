# LessJS v0.21.x Hardening SOP Index

Status: planned\
Range: after v0.21.0 Reactive DSD, before v0.22.0 Edge Full-Stack\
Owner: framework architecture\
Primary audit input: `docs/conversation/20260524/LessJS-comprehensive-architecture-product-audit-2026-05-24.md`

## Purpose

v0.21.0 proves the Reactive DSD model. v0.22.0 should not start by expanding the product surface. The v0.21.x line exists to make the current core hard, clean, measurable, and boring before Edge Full-Stack work begins.

The product stance for this line is:

- LessJS is not a generic app framework yet. It is a Web Standards-first SSG stack with a DSD-first Web Components renderer, deterministic island admission, typed reactive authoring, and package-discovery infrastructure.
- The real moat is not "full-stack". The moat is the contract between standards-shaped HTML output, component metadata, islands, reactive DSD, and build-time evidence.
- v0.22.0 may add edge runtime entrypoints only after v0.21.x proves the core API, renderer behavior, SSG workflow, and trust pipeline are stable.

## Version Plan

| Version  | SOPs               | Goal                                                                                             |
| -------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| v0.21.1  | SOP-001 to SOP-003 | Freeze the Core API shape, clean stale contracts, and stabilize renderer output/error taxonomy.  |
| v0.21.2  | SOP-004 to SOP-006 | Prove DSD, Web Components, OpenWC, and Open UI alignment with conformance fixtures and docs.     |
| v0.21.3  | SOP-007 to SOP-008 | Harden adapter-vite admission, SSG build reports, and the blog/docs product path.                |
| v0.21.4  | SOP-009            | Make Registry Hub evidence and package trust checks credible enough to support ecosystem growth. |
| v0.21.5  | SOP-010            | Run the pre-v0.22 release gate and decide whether Edge Full-Stack can start.                     |
| v0.21.9  | SOP-011            | Harden the JSR consumer ESM graph so Vite/Rolldown only owns final bundling optimization.        |
| v0.21.16 | SOP-012 to SOP-018 | Separate source gates, post-publish release smoke, and Windows JSR latest monitoring.            |

## SOP List

1. [SOP-001 Core API Freeze and Public Surface Audit](./SOP-001-core-api-freeze.md)
2. [SOP-002 Template and Reactive Contract Hardening](./SOP-002-template-reactive-contract.md)
3. [SOP-003 Render Output and Error Taxonomy Stabilization](./SOP-003-render-output-error-taxonomy.md)
4. [SOP-004 Declarative Shadow DOM and WHATWG Conformance](./SOP-004-dsd-whatwg-conformance.md)
5. [SOP-005 OpenWC Testing and Web Component Compatibility](./SOP-005-openwc-testing-compatibility.md)
6. [SOP-006 Open UI Component Contract Alignment](./SOP-006-openui-component-contracts.md)
7. [SOP-007 Adapter Vite Admission and Build Report Cleanup](./SOP-007-adapter-vite-admission-cleanup.md)
8. [SOP-008 SSG Product Stack Hardening](./SOP-008-ssg-product-hardening.md)
9. [SOP-009 Hub Evidence and Trust Pipeline](./SOP-009-hub-evidence-trust.md)
10. [SOP-010 v0.22 Entry Gate](./SOP-010-v022-entry-gate.md)
11. [SOP-011 JSR Consumer ESM Graph Hardening](./SOP-011-jsr-consumer-esm-graph.md)
12. [SOP-012 CI Consumer Smoke](./SOP-012-ci-consumer-smoke.md)
13. [SOP-013 Post-publish Consumer Smoke](./SOP-013-post-publish-consumer-smoke.md)
14. [SOP-014 Build Pipeline Clean Architecture](./SOP-014-build-pipeline-clean-arch.md)
15. [SOP-015 Vite Config Virtual Modules](./SOP-015-vite-config-virtual-modules.md)
16. [SOP-016 SSR HTMLElement Self-contained](./SOP-016-ssr-htmlelement-self-contained.md)
17. [SOP-017 Deno Pre-resolution External Dependencies](./SOP-017-deno-pre-resolution-external-deps.md)
18. [SOP-018 CI and Release Gate Separation](./SOP-018-ci-release-gate-separation.md)

## Public API Classification

The v0.21.x line must classify every exported `@lessjs/core` symbol into one of these groups:

| Level        | Meaning                               | Rule                                                                           |
| ------------ | ------------------------------------- | ------------------------------------------------------------------------------ |
| Stable       | Safe for userland and templates       | Breaking changes require a migration note and deprecation window.              |
| Experimental | Usable but still allowed to move      | Must be marked in docs and type comments.                                      |
| Internal     | For packages inside the monorepo only | Must not be documented as user-facing. Prefer moving behind internal subpaths. |

The first pass must cover:

- `renderDSD()` and `renderDSDStream()`
- `DsdElement`
- `html()` and `unsafeHTML()`
- `ReactiveHost`
- `StyleSheet`
- `signal()`, `computed()`, `effect()` re-exports
- `client:*` hydration strategies: `load`, `idle`, `visible`, `only`
- adapter registry APIs
- manifest, Hub, and ISR surfaces

## Non-Goals

v0.21.x must not add broad full-stack features:

- no auth framework
- no ORM or database abstraction
- no session abstraction
- no generic permissions model
- no RPC layer
- no framework-wide router redesign
- no breaking public API rename unless it is documented as a deprecation bridge

## Global Gate

Every SOP that changes code or public docs must record this gate unless the SOP explicitly narrows the command set:

```powershell
git status --short --branch
deno task fmt:check
deno task lint
deno task typecheck
deno audit
deno task test
deno task build
deno task dsd:check-report
deno task hub:validate --strict --json
deno task hub:check-index
deno task docs:check-strategy
deno task test:e2e
git status --short --branch
```

JSR consumer validation is split by purpose:

- source branches prove generated-project behavior through local-source tests;
- `publish.yml` proves the freshly published JSR package set on Ubuntu;
- `jsr-consumer-monitor.yml` monitors JSR latest on Windows by schedule or
  manual dispatch.

If a command fails, continue with independent gates and document:

- failed command
- key error text
- likely owner package
- user-facing impact
- exact follow-up acceptance command

## External Reference Baseline

These references are the standards and ecosystem baseline for v0.21.x decisions:

- WHATWG HTML template and Declarative Shadow DOM attributes: <https://html.spec.whatwg.org/multipage/scripting.html#the-template-element>
- MDN template element and `shadowrootmode`: <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template>
- OpenWC testing guidance: <https://open-wc.org/guides/developing-components/testing/>
- Open UI purpose and component research scope: <https://open-ui.org/>
- Custom Elements Manifest schema effort: <https://github.com/webcomponents/custom-elements-manifest>
