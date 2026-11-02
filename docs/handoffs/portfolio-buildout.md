# Handoff: Portfolio build-out after the initial scaffold

Last updated: 2026-11-02

## Goal

Finish the portfolio and deploy it from `main` on Cloudflare Pages. Done when the remaining items below are closed and the site is live.

## State

- All three projects (SGL, Aquamania, Maze game) exist on `develop` with their islands. Work is committed and pushed on `develop`. `main` is untouched.
- Cloudflare Pages is not linked yet. `docs/deployment.md` describes the planned setup only. The user is checking Cloudflare Pages now.
- The dev server may still be running in the background (`npx astro dev status`, `npx astro dev stop`).

## Next steps

- [ ] Link the repository to Cloudflare Pages (build `npm run build`, output `dist`, Node 22) and document it fully in `docs/deployment.md`, including how agents and humans interact with the service. Merging `develop` into `main` goes through a pull request.
- [ ] Add a sitemap: needs `site` in `astro.config.mjs`, so the final domain first.
- [ ] Add a social preview image (`og:image`, needs a design).
- [ ] The user reviews the project texts in `src/content/projects/`:
  - `sgl.md`: the text about learning linear algebra is generic and needs the user's real story.
  - `aquamania.md`: text was expanded from the user's notes; year (2026) is a guess.
  - `maze-game.md`: text was written from the repo and slides; check the year (2025), the credits paragraph, and whether the phone screenshot showing demo code on the captive page is fine to publish.
- [ ] Test the mobile navigation on a real touch device. Known quirk: on desktop, closing the menu by clicking the toggle while it keeps focus leaves it visible through `:focus-within`.
- [ ] Re-check `npm audit` when a newer `@astrojs/svelte` is released (3 low findings, build-time only; the only offered fix is a breaking downgrade).

## Decisions and constraints

- Hero visual is a starfield (chosen by the user on 2026-10-31).
- Astro with static output, Svelte islands, plain CSS with tokens, npm. These were confirmed by the user.
- `main` is production only. Never commit or push to it directly. Commit to `develop`.
- All documentation is Markdown inside `docs/`. The user writes the actual content. Agents only build the UI and components.
- Design: black background, white text, mono and display fonts. No italic or serif: the accent style is bold JetBrains Mono (user request). See `docs/art-direction.md`.
- Navigation: Home, Projects (dropdown), About me. Home shows project overviews and each project has its own page.

## Open questions

- Which final domain will the site use?

## Pointers

- `docs/architecture.md`, `docs/art-direction.md`, `docs/content.md`, `docs/deployment.md`
