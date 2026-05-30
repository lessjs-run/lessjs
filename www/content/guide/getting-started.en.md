# Getting Started

LessJS is a **DSD-first** Web Components framework. Start with a minimal project: create an app, start the dev server, build static output, then understand what each directory does.

<less-callout type="info" label="Recommended">
Use Deno 2.7+. LessJS **v0.26** is Deno-first — dependencies managed via `deno.json`, all dev and build commands run through Deno tasks.
</less-callout>

## 1. Create a project

```shell
deno run -A jsr:@lessjs/create my-app
cd my-app
```

The generated project includes page routes, an example island, Vite config, and common Deno tasks.

## 2. Start dev server

```shell
deno task dev
```

This starts the Vite dev server with SSR. Edit any route file — changes appear instantly with Hot Module Replacement.
