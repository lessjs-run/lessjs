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
      index.tsx
    islands/
      my-counter.ts
```

The scaffold uses `definePage()` and `defineIsland()` from `@openelement/app`,
and imports the Vite facade from `@openelement/app/vite`.

## Current Scope

This CLI creates a working openElement project. It is not the future `open add`
registry installer. Package install automation should come later and must first
validate a package manifest, show a dry-run diff, and generate explicit
registration code.

## License

MIT
