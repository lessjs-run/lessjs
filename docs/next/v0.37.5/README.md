# v0.37.5 NextVersion

v0.37.5 completes daisyUI interactive coverage and migrates protocol types
out of implementation packages into @openelement/protocols.

Scope:

### daisyUI Interactive Completion

- 12 DsdElement thin shells following the signal → host attribute →
  :host([attr]) CSS pattern established in v0.37.4
- 4 form enhancement DsdElement components (checkbox, radio, range,
  file-input)
- All components reuse daisyClassSheet HTML structure and class names

### Protocol Ports

- Migrate 5 protocol types from core/app/ssg/signals into
  @openelement/protocols (non-breaking — re-export from original
  locations)
- Write EntryDescriptor ADR
- Add exportable conformance test suites for RendererProtocol

### Non-Goals

- No new external dependencies
- No package split/merge
- No Tailwind runtime
- No theme system (Open Props already covers this)

## Related

- SOP: `docs/sop/v0.37.5/README.md`
- Roadmap ADR: `docs/adr/ADR-0091-four-product-platform-roadmap.md`
