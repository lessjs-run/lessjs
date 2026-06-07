# @openelement/create

Project scaffolding CLI for openElement applications.

`@openelement/create` generates a new openElement project with the recommended
directory structure, Deno configuration, Vite setup, and starter pages.

## Usage

```bash
deno run -A jsr:@openelement/create my-app
cd my-app
deno task dev
```

## What It Creates

- `deno.json` — workspace configuration with openElement imports
- `vite.config.ts` — Vite build configuration with openElement plugin
- `app/` — application directory with starter pages and islands
- `www/` — website output directory

## License

MIT
