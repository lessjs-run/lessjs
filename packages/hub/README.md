# @openelement/hub - Registry Hub SDK

Schema, builder, indexer, and submission pipeline for the openElement Registry Hub.

## Usage

```bash
# Scan installed packages and generate Hub records
deno run -A packages/hub/scan.ts

# Validate hub-index records
deno task hub:validate

# Check hub-index consistency
deno task hub:check-index

# Submit a package to the Hub
less hub submit --dir ./my-package
```

## API

See `mod.ts` for public exports.

## License

MIT
