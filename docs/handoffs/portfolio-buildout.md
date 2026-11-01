# Handoff: Portfolio build-out after the initial scaffold

Last updated: 2026-10-31

## Goal

Turn the scaffold into the finished portfolio: real visuals and interactions, with content added by the user. Done when the placeholders are replaced, the hero visual and project islands exist, and the site is deployed from `main` on Cloudflare Pages.

## State

- Scaffold is committed and pushed on `develop` (commit `94af03f`). `main` is untouched (it has no commits of its own from this work).
- `npm run check` reports 0 errors and `npm run build` generates 5 pages. The result has only been verified through build output and an HTTP 200 on the dev server, not by looking at it in a browser.
- The dev server may still be running in the background (`npx astro dev status`, `npx astro dev stop`).
- Cloudflare Pages is not linked yet. `docs/deployment.md` describes the planned setup only.

## Next steps

- [ ] Ask the user for feedback on the visual result in the browser, then adjust the layout and styling.
- [x] Hero visual: `src/islands/Starfield.svelte` is now a real starfield (drift, twinkle, pointer parallax, pauses off screen, static under reduced motion), hydrated with `client:idle`. Not yet checked in a browser.
- [ ] Design and implement the interactive islands on project pages (`src/pages/projects/[slug].astro`). Discuss with the user what each project needs first.
- [x] Site content (name, headline, intro, about, social links) is set in `src/data/site.ts`. The navbar has GitHub and LinkedIn icons.
- [ ] Project 1 (SGL) is on `develop`: live demo island (`SglDemo`), illustrated story (`SglStage`, `sgl-stages.ts`) and pipeline background (`SglPipeline`); see `docs/architecture.md`. None of it has been checked by an agent in a browser, only by the user. The same approach (frontmatter `story`, one island per visual) can be reused for projects 2 and 3.
- [ ] The user adds the real projects in `src/content/projects/`. Project 1 is done: `sgl.md` with the live `SglDemo` island (not yet checked in a browser; the text about learning linear algebra is generic and needs the user's real story). `project-2.md` and `project-3.md` are still placeholders.
- [x] Added `public/favicon.svg`, theme-color and basic Open Graph tags (`lang` was already set).
- [ ] Still missing metadata: a social preview image (`og:image`, needs a design) and a sitemap (needs `site` in `astro.config.mjs`, so the final domain first).
- [x] Mobile navigation: tap toggle added in `Navbar.astro`. Not yet tested on a real touch device. Known quirk: on desktop, closing by clicking the toggle while it keeps focus leaves the menu visible through `:focus-within`.
- [x] `npm audit`: 3 low severity findings (deepmerge prototype poisoning via `@astrojs/svelte`, build-time only). The only offered fix downgrades `@astrojs/svelte` to 0.1.2 (breaking), so it was left alone. Re-check when a newer `@astrojs/svelte` is released.
- [ ] Link the repository to Cloudflare Pages (build `npm run build`, output `dist`, Node 22) and document it fully in `docs/deployment.md`, including how agents and humans interact with the service. Merging `develop` into `main` goes through a pull request.

## Decisions and constraints

- Hero visual is a starfield (chosen by the user on 2026-10-31).
- Astro with static output, Svelte islands, plain CSS with tokens, npm. These were confirmed by the user.
- `main` is production only. Never commit or push to it directly. Commit to `develop`.
- All documentation is Markdown inside `docs/`. The user writes the actual content. Agents only build the UI and components.
- Design: black background, white text, mono and display fonts. No italic or serif: the accent style is bold JetBrains Mono (user request). See `docs/art-direction.md`.
- Navigation: Home, Projects (dropdown), About me. Home shows project overviews and each project has its own page.

## Open questions

- What should projects 2 and 3 be, and what visuals or interactions do they need? (Project 1 is done.)

## Pointers

- `docs/architecture.md`, `docs/art-direction.md`, `docs/content.md`, `docs/deployment.md`
