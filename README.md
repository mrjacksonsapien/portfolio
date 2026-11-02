# Portfolio

Personal portfolio website: a mostly static site with a few interactive components, built with [Astro](https://astro.build) and hosted on Cloudflare.

## Stack

- Astro (static output, islands architecture)
- Svelte for interactive islands
- TypeScript, plain CSS with design tokens
- Cloudflare for hosting

## Getting started

Requires Node 22+.

```sh
npm install
npm run dev      # http://localhost:4321
npm run check    # type checking
npm run build    # output in dist/
```

## Pages

- `/` Home: presentation and project overviews
- `/projects/<slug>` One page per project
- `/about` About me

## Documentation

See [docs/README.md](docs/README.md). Agents: see [AGENTS.md](AGENTS.md).
