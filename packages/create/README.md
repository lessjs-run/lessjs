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

- `deno.json` - starter authoring imports and build tasks
- `vite.config.ts` - Vite build configuration with the openElement plugin
- `app/` - application directory with starter pages and islands
- `www/` - website output directory

The generated import map intentionally keeps protocol and build internals out of
the starter surface. Advanced contracts remain available through the published
workspace packages when a project needs them.

## License

MIT
