# Conventions

## Git

- `main`: production only. Deployed automatically by Cloudflare. Never commit, push or merge to it directly. It changes only through a pull request from `develop`, merged by the user.
- `develop`: integration branch. All commits go here. Commit and merge into it directly.
- Agents open the PR (`gh pr create --base main --head develop`) but never accept, approve or merge any pull request (no `gh pr merge`, no auto-merge). They may review and comment; only the user merges.
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
