# @openelement/create

Project scaffold for openElement.

## Usage

```bash
deno run -A jsr:@openelement/create my-app
cd my-app
deno task dev
deno task build
```

## Generated Project

```text
my-app/
  deno.json
  vite.config.ts
  app/
    routes/
      index.ts
    islands/
      my-counter.ts
```

The scaffold uses `@openelement/app` and includes `packageIslands: ['@openelement/ui']`
for the built-in openElement UI components.

## Current Scope

This CLI creates a working openElement project. It is not the future `open add`
registry installer. Package install automation should come later and must first
validate a package manifest, show a dry-run diff, and generate explicit
registration code.

## License

MIT
