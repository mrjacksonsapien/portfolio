# Conventions

## Git

- `main`: production only. Deployed automatically by Cloudflare Pages. Never commit or push to it directly. Merge only via pull request from `develop`.
- `develop`: integration branch. Commit and merge into it directly.
- Feature branches are optional for now.

## Documentation

- Markdown only, strictly inside `docs/`.
- `README.md`: presentation. `AGENTS.md` files: agent instructions.
- One topic per file. Add the file to `docs/README.md`.
- Update docs when a change is worth knowing about.
- Do not load docs into context unless needed.

## Media

Originals in `media-src/<project>/`, optimized files in `public/`. See `media.md`.

## Handoffs

Unfinished tasks get a handoff in `docs/handoffs/`, removed once the task is done. See `handoffs/README.md`.
