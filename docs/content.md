# Content

Editable content lives in `src/content/` and is typed by `src/content.config.ts`. Components contain no hard-coded content (apart from placeholders to replace).

## Projects

One Markdown file per project: `src/content/projects/<slug>.md`. The file name is the URL slug (`/projects/<slug>`).

```md
---
title: Project name
summary: One or two lines shown on cards.
year: 2026
tags: [web, math]
order: 1            # lower comes first (optional, default 0)
cover: /images/x.png  # optional, file in public/
repoUrl: https://...  # optional
liveUrl: https://...  # optional
draft: false          # true hides it everywhere
---

Markdown body shown on the project page.
```

The home grid, the navbar dropdown and the project page all read this collection.

## Other placeholders to replace

- Name, title and intro: `Navbar.astro`, `Hero.astro`, `Footer.astro`
- About page text: `src/pages/about.astro`
- Social links: `Footer.astro`
- Site description and title: `BaseLayout.astro`

## Media

Put images and other static media in `public/` (served as-is) and reference them by absolute path (`/images/x.png`).
