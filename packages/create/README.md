# @lessjs/create

Project scaffold for LessJS.

## Usage

```bash
deno run -A jsr:@lessjs/create my-app
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

The scaffold uses `@lessjs/app` and includes `packageIslands: ['@lessjs/ui']`
for the built-in LessJS UI components.

## Current Scope

This CLI creates a working LessJS project. It is not the future `less add`
registry installer. Package install automation should come later and must first
validate a package manifest, show a dry-run diff, and generate explicit
registration code.

## License

MIT
