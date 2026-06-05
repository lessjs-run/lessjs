# v0.32.0 Tasks

## API

- [ ] Add typed redirect and not-found lifecycle helpers.
- [ ] Export lifecycle helpers from `@openelement/app`.
- [ ] Add route and meta context to `definePage()` render context.
- [ ] Add page error renderer support without introducing a second renderer
      path.

## Generated Entry

- [ ] Pass structured route and meta props into page rendering.
- [ ] Catch redirect and not-found controls in request-time rendering.
- [ ] Catch redirect and not-found controls in SSG `renderRoute()`.
- [ ] Expose route file path, rendering intent, streaming intent, and
      revalidate data through structured `routeInfo`.

## Documentation

- [ ] Add ADR-0085 for the App Lifecycle Contract.
- [ ] Update v0.32 SOP from planned tasks to implemented tasks.
- [ ] Update website and guide content to teach lifecycle after Application API.
- [ ] Update status, roadmap, changelog, and release note.

## Workflow

- [ ] Add AutoWorkflow governance.
- [ ] Add required NextVersion package files.
- [ ] Add PR and issue templates.
- [ ] Add GitHub agent prompts that require reading AutoWorkflow.
- [ ] Add `workflow:check` and wire it into CI.
