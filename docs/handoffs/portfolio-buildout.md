# Handoff: Portfolio build-out after the initial scaffold

Last updated: 2026-10-30

## Goal

Turn the scaffold into the finished portfolio: real visuals and interactions, with content added by the user. Done when the placeholders are replaced, the hero visual and project islands exist, and the site is deployed from `main` on Cloudflare Pages.

## State

- Scaffold is committed and pushed on `develop` (commit `94af03f`). `main` is untouched (it has no commits of its own from this work).
- `npm run check` reports 0 errors and `npm run build` generates 5 pages. The result has only been verified through build output and an HTTP 200 on the dev server, not by looking at it in a browser.
- The dev server may still be running in the background (`npx astro dev status`, `npx astro dev stop`).
- Cloudflare Pages is not linked yet. `docs/deployment.md` describes the planned setup only.

## Next steps

- [ ] Ask the user for feedback on the visual result in the browser, then adjust the layout and styling.
- [ ] Replace the placeholder visual `src/islands/Starfield.svelte` with the real hero visual (starfield or glowing orb, see `docs/art-direction.md`). Keep it a `client:visible` or `client:idle` island and respect `prefers-reduced-motion`.
- [ ] Design and implement the interactive islands on project pages (`src/pages/projects/[slug].astro`). Discuss with the user what each project needs first.
- [ ] The user adds the real content: name, title, intro (`Navbar.astro`, `Hero.astro`, `Footer.astro`), about text (`about.astro`), social links, and real projects in `src/content/projects/`. Remove the three `project-N.md` placeholders when real ones exist.
- [ ] Add site metadata: favicon, social preview image, `lang`, and a sitemap if wanted.
- [ ] Mobile navigation: the dropdown is hover and focus only, so check and handle touch devices.
- [ ] Check the `npm audit` notice shown during `npm install`.
- [ ] Link the repository to Cloudflare Pages (build `npm run build`, output `dist`, Node 22) and document it fully in `docs/deployment.md`, including how agents and humans interact with the service. Merging `develop` into `main` goes through a pull request.

## Decisions and constraints

- Astro with static output, Svelte islands, plain CSS with tokens, npm. These were confirmed by the user.
- `main` is production only. Never commit or push to it directly. Commit to `develop`.
- All documentation is Markdown inside `docs/`. The user writes the actual content. Agents only build the UI and components.
- Design: black background, white text, mono, display and serif accent fonts. See `docs/art-direction.md`.
- Navigation: Home, Projects (dropdown), About me. Home shows project overviews and each project has its own page.

## Open questions

- What interactive behavior should each project page have?
- Which design is wanted for the hero visual: orb, starfield, or something else?

## Pointers

- `docs/architecture.md`, `docs/art-direction.md`, `docs/content.md`, `docs/deployment.md`
