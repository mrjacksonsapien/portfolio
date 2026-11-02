# AGENTS.md

Instructions for agents working on this portfolio. This file holds agent instructions only. Documentation lives in `docs/`.

## Project in one line

Static portfolio built with Astro (islands architecture), hosted on Cloudflare. Interactive parts are Svelte islands that hydrate only when needed.

## Commands

- `npm install`: install dependencies
- `npm run dev`: dev server
- `npm run check`: type and Astro diagnostics (run before opening a PR)
- `npm run build`: production build to `dist/`

## Git workflow

- **Never commit, push, merge or force-push directly to `main`, under any circumstances.** `main` is production: everything merged there is deployed automatically by Cloudflare. The only way to change `main` is a pull request from `develop`, opened by the agent and merged by the user.
- Always commit on `develop`. It is the integration branch: commits and merges go straight into it.
- To ship: push `develop`, then open a PR `develop` -> `main` (`gh pr create --base main --head develop`). Never merge it yourself.
- **Agents never accept, approve or merge a pull request** (no `gh pr merge`, no auto-merge, no merging through the GitHub API or UI). They may open and review PRs, and comment on them, but only the user merges. This applies to every PR into `main`.
- Feature branches are not required for now (single maintainer).

## Documentation rules

- All documentation and other text files are written in Markdown (`.md`).
- Documentation lives strictly inside `docs/`. `README.md` is for presentation only and `AGENTS.md` files are for agent instructions only.
- Read the relevant file in `docs/` to understand the architecture before changing it. Start from `docs/README.md` (the index) and open only the files you need. Do not load the whole documentation into context.
- Keep documentation split into small, focused files so each can be read on its own.
- Update the documentation when a change would be useful to know about (new convention, new island, deployment change, etc.).

## Handoffs

- At the start of a session, check `docs/handoffs/` for an unfinished task related to your work.
- If a task is not completely done when the session ends, write or update a handoff in `docs/handoffs/` so a new session can continue it. Delete the handoff only when the task is done.
- Format and lifecycle: `docs/handoffs/README.md`.

## Media

- Originals go in `media-src/<project>/`, never in `docs/` or `public/`. The site serves only optimized files from `public/`. Procedure and folders: `docs/media.md`.

## Code conventions

- Static by default: use `.astro` components in `src/components/`. Add JavaScript only through an island in `src/islands/`, and always choose the lightest hydration directive (`client:visible` > `client:idle` > `client:load`). See `docs/architecture.md`.
- Styling uses plain CSS with the design tokens in `src/styles/tokens.css`. Follow `docs/art-direction.md`. Do not hard-code colors, fonts or spacing.
- Editable content (projects) lives in `src/content/`. See `docs/content.md`. Do not hard-code content in components.
- TypeScript is strict. Keep `npm run check` at zero errors.

More specific instructions: `src/AGENTS.md`.
