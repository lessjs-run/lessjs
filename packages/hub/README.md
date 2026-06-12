# @openelement/hub - Registry Hub SDK

Schema, builder, indexer, and submission pipeline for the openElement Registry Hub.

> v0.40 surface: archived. This package remains in the workspace graph for
> registry evidence and historical tooling, but it is not part of the primary
> v1 public product map.

## Usage

```bash
# Validate hub-index records
deno task hub:validate

# Check hub-index consistency
deno task hub:check-index
```

Write tasks are archived by ADR-0103. `hub:scan` and `hub:index:update` require
`OPEN_ELEMENT_ALLOW_ARCHIVED_HUB_WRITE=1` and should only be used for approved
historical maintenance.

## API

See `mod.ts` for retained tooling exports. New Hub product work requires a fresh
roadmap entry and ADR.

## License

MIT
