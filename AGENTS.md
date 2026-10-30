# AGENTS.md

Instructions for agents working on this portfolio. This file holds agent instructions only. Documentation lives in `docs/`.

## Project in one line

Static portfolio built with Astro (islands architecture), hosted on Cloudflare Pages. Interactive parts are Svelte islands that hydrate only when needed.

## Commands

- `npm install`: install dependencies
- `npm run dev`: dev server
- `npm run check`: type and Astro diagnostics (run before opening a PR)
- `npm run build`: production build to `dist/`

## Git workflow

- Never commit or push directly to `main`. `main` is production: everything merged there is deployed automatically by Cloudflare Pages. Merge into `main` only through a pull request.
- `develop` is the integration branch. Commits and merges can go straight into `develop`.
- Feature branches are not required for now (single maintainer).

## Documentation rules

- All documentation and other text files are written in Markdown (`.md`).
- Documentation lives strictly inside `docs/`. `README.md` is for presentation only and `AGENTS.md` files are for agent instructions only.
- Read the relevant file in `docs/` to understand the architecture before changing it. Start from `docs/README.md` (the index) and open only the files you need. Do not load the whole documentation into context.
- Keep documentation split into small, focused files so each can be read on its own.
- Update the documentation when a change would be useful to know about (new convention, new island, deployment change, etc.).

## Code conventions

- Static by default: use `.astro` components in `src/components/`. Add JavaScript only through an island in `src/islands/`, and always choose the lightest hydration directive (`client:visible` > `client:idle` > `client:load`). See `docs/architecture.md`.
- Styling uses plain CSS with the design tokens in `src/styles/tokens.css`. Follow `docs/art-direction.md`. Do not hard-code colors, fonts or spacing.
- Editable content (projects) lives in `src/content/`. See `docs/content.md`. Do not hard-code content in components.
- TypeScript is strict. Keep `npm run check` at zero errors.

More specific instructions: `src/AGENTS.md`.
